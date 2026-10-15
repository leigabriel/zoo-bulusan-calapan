import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { communityAPI } from '../services/api-client';
import { notify } from '../utils/toast';

// Upload queue for community posts.
//
// This lives ABOVE the router so a post keeps uploading after the visitor navigates to
// another page: the request is owned by this provider, not by CommunityPage, so unmounting
// that page does not abort it. When the request finishes the visitor is told, wherever they
// have wandered to.
//
// Each entry renders optimistically in the feed as a "not posted yet" card with a progress
// bar, then is replaced by the real post once the server has it.

const PostUploadContext = createContext(null);

let sequence = 0;
const nextId = () => `pending_${Date.now()}_${(sequence += 1)}`;

export const PostUploadProvider = ({ children }) => {
    const [items, setItems] = useState([]);
    // Mirror of `items` for callbacks that need to read current state without being re-created
    // (and re-triggering their consumers) on every progress tick.
    const itemsRef = useRef(items);
    itemsRef.current = items;
    // Bumped every time a post lands successfully. The community feed watches this to know it
    // should refetch, which is what makes an upload that finished on another page (or another
    // tab's worth of time) show up in the feed without a manual refresh.
    const [completedCount, setCompletedCount] = useState(0);

    const patch = useCallback((id, changes) => {
        setItems((current) => current.map((item) => (item.id === id ? { ...item, ...changes } : item)));
    }, []);

    const remove = useCallback((id) => {
        setItems((current) => current.filter((item) => item.id !== id));
    }, []);

    const run = useCallback(async (item) => {
        patch(item.id, { status: 'uploading' });
        try {
            await communityAPI.createPostWithProgress(
                { content: item.content, imageFiles: item.files },
                (progress) => patch(item.id, { progress }),
                'user'
            );
            patch(item.id, { status: 'done', progress: 1 });
            setCompletedCount((count) => count + 1);
            // Let the finished card linger briefly so the bar is seen to complete, then drop it
            // and let the feed refresh to show the real post.
            window.setTimeout(() => remove(item.id), 1200);
            // The toaster is mounted at app level, so this reaches the visitor wherever they have
            // navigated to — which is the whole point of handing the upload off to the queue.
            notify.success(item.files.length
                ? `Your post was posted with ${item.files.length} photo${item.files.length > 1 ? 's' : ''}.`
                : 'Your post was posted.');
        } catch (error) {
            patch(item.id, { status: 'failed', error: error?.message || "Couldn't upload your post." });
            notify.error(error?.message || "Couldn't upload your post.");
        }
    }, [patch, remove]);

    // Re-runs a failed upload with the same files. The File handles are still held by the queue
    // item, so a dropped connection costs the visitor nothing beyond the wait. Declared after
    // `run` because its dependency array reads `run` during render.
    const retry = useCallback((id) => {
        const item = itemsRef.current.find((candidate) => candidate.id === id);
        if (!item || item.status === 'uploading') return;
        patch(id, { status: 'queued', progress: 0, error: null });
        run(item);
    }, [patch, run]);

    const enqueue = useCallback(({ content, files = [], ownerId = null }) => {
        const item = {
            id: nextId(),
            content,
            files,
            // Object URLs are minted here and never revoked on unmount because the upload may
            // outlive the page that started it; the browser reclaims them with the document.
            previewUrls: files.map((file) => URL.createObjectURL(file)),
            ownerId,
            progress: 0,
            status: 'queued',
            error: null
        };
        setItems((current) => [item, ...current]);
        // Defer so the optimistic card paints before the upload begins.
        window.setTimeout(() => run(item), 0);
        return item.id;
    }, [run]);

    const value = useMemo(
        () => ({ items, enqueue, remove, retry, completedCount }),
        [items, enqueue, remove, retry, completedCount]
    );

    return <PostUploadContext.Provider value={value}>{children}</PostUploadContext.Provider>;
};

export const usePostUploads = () => {
    const context = useContext(PostUploadContext);
    if (!context) throw new Error('usePostUploads must be used inside a PostUploadProvider');
    return context;
};

export default PostUploadProvider;
