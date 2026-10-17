import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import { useAuth } from '../../hooks/use-auth';
import { communityAPI } from '../../services/api-client';
import { notify } from '../../utils/toast';
import useScrollLock from '../../hooks/use-scroll-lock';
import PostFeed from './community/PostFeed';
import PostForm from './community/PostForm';
import ConfirmationModal from '../common/ConfirmationModal';
import { X } from 'reicon-react';

/**
 * "My Post" - everything this visitor has written, reachable from the Account Menu.
 *
 * Ownership is never decided in the browser. Post ids reach the client as `pid_`
 * ciphertexts with a fresh IV each time, so two encryptions of the same user id are
 * never string-equal. The server resolves `isOwner` for us
 * (backend/models/community-model.js), and this panel just filters on that flag.
 *
 * The feed reuses the community PostFeed rather than reimplementing cards, so edit
 * and delete behave exactly as they do on the Community page.
 */
const MyPostsPanel = ({ isOpen, onClose }) => {
    const { user, isAuthenticated } = useAuth();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [editingPost, setEditingPost] = useState(null);
    const [editorOpen, setEditorOpen] = useState(false);
    const [savingPost, setSavingPost] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [pendingDelete, setPendingDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    useScrollLock(isMounted && !editorOpen && !confirmOpen);

    useEffect(() => {
        // Delay mounting so the slide-out transition actually plays instead of the
        // panel appearing already open on first render.
        if (isOpen) {
            const timer = setTimeout(() => setIsMounted(true), 10);
            return () => clearTimeout(timer);
        }
        setIsMounted(false);
        return undefined;
    }, [isOpen]);

    const loadPosts = useCallback(async () => {
        setLoading(true);
        try {
            const response = await communityAPI.getPosts(user?.role || 'user');
            setPosts(response.posts || []);
        } catch {
            notify.error("Couldn't load your posts.");
        } finally {
            setLoading(false);
        }
    }, [user?.role]);

    // Refetch each time the panel opens so it never shows a stale snapshot.
    useEffect(() => {
        if (!isOpen || !isAuthenticated) return;
        loadPosts();
    }, [isOpen, isAuthenticated, loadPosts]);

    const myPosts = useMemo(() => posts.filter((post) => post.isOwner === true), [posts]);

    // PostFeed deletes through communityAPI itself and hands us the removal so the
    // confirmation dialog can hold the spinner for the whole request.
    const resolveConfirm = useRef(null);

    const confirmPostDelete = useCallback((removePost) => {
        // Stash the function in state, not by calling it, so React does not invoke it.
        setPendingDelete(() => removePost);
        setConfirmOpen(true);
        return new Promise((resolve) => {
            resolveConfirm.current = resolve;
        });
    }, []);

    const closeConfirm = useCallback((confirmed) => {
        setConfirmOpen(false);
        setPendingDelete(null);
        const resolve = resolveConfirm.current;
        resolveConfirm.current = null;
        if (typeof resolve === 'function') resolve(confirmed);
    }, []);

    const handleConfirmDelete = useCallback(async () => {
        if (typeof pendingDelete !== 'function') {
            closeConfirm(false);
            return;
        }
        setDeleting(true);
        try {
            await pendingDelete();
            closeConfirm(true);
        } finally {
            setDeleting(false);
        }
    }, [pendingDelete, closeConfirm]);

    const savePost = useCallback(async ({ content, imageFiles, removeImage }) => {
        if (!editingPost) return false;
        setSavingPost(true);
        try {
            await communityAPI.updatePost(
                editingPost.id,
                { content, imageFile: imageFiles?.[0], removeImage },
                user?.role || 'user'
            );
            notify.success('Post updated.');
            setEditingPost(null);
            setEditorOpen(false);
            await loadPosts();
            return true;
        } catch (error) {
            notify.error(error.message || "Couldn't save post.");
            return false;
        } finally {
            setSavingPost(false);
        }
    }, [editingPost, user?.role, loadPosts]);

    if (!isMounted) return null;

    return (
        <>
            <div
                className={`fixed inset-0 bg-slate-900/40 z-[90] backdrop-blur-sm transition-opacity duration-300 ease-out ${isOpen ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
            />
            <div
                className={`fixed right-0 top-0 h-full w-full sm:w-[480px] md:w-[600px] lg:w-[680px] bg-slate-50 shadow-2xl z-[100] flex flex-col transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
                data-lenis-prevent
                role="dialog"
                aria-modal="true"
                aria-label="My posts"
            >
                <div className="p-5 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-white gap-4">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-800">My Posts</h2>
                        <p className="text-sm text-slate-500 mt-1">
                            {loading
                                ? 'Loading your posts...'
                                : `${myPosts.length} ${myPosts.length === 1 ? 'post' : 'posts'}`}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close my posts"
                        title="Close"
                        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-700"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                            <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>

                {!isAuthenticated ? (
                    <div className="flex-1 flex items-center justify-center p-8">
                        <div className="text-center">
                            <h3 className="font-semibold text-slate-700 mb-2">Sign in required</h3>
                            <p className="text-slate-500 text-sm">Please sign in to view your posts</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5">
                        {loading && myPosts.length === 0 ? (
                            <div className="flex items-center justify-center py-24">
                                <div className="w-5 h-5 rounded-full border-[1.5px] border-slate-300 border-t-slate-600 animate-spin" />
                            </div>
                        ) : myPosts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                                <h3 className="text-base font-semibold text-slate-700">You have not posted yet</h3>
                                <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">
                                    Posts you write in the Community will appear here, where you can edit or delete them.
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-6">
                                <PostFeed
                                    posts={myPosts}
                                    currentUser={user}
                                    isGuest={false}
                                    onRequireAuth={() => {}}
                                    onRefresh={loadPosts}
                                    onUpdatePost={(postId, changes) =>
                                        setPosts((current) =>
                                            current.map((post) =>
                                                post.id === postId ? { ...post, ...changes } : post
                                            )
                                        )
                                    }
                                    onEditPost={(post) => {
                                        setEditingPost(post);
                                        setEditorOpen(true);
                                    }}
                                    // Left undefined on purpose: this panel manages posts, it does
                                    // not host the comment thread. PostFeed renders the counter
                                    // as disabled rather than as a button that silently fails.
                                    onPostClick={undefined}
                                    onCommentClick={undefined}
                                    onConfirmDelete={confirmPostDelete}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>

            <AnimatePresence>
                {editorOpen && editingPost && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center overscroll-contain p-4" role="dialog" aria-modal="true" aria-labelledby="my-posts-editor-title">
                        <Motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                            onClick={() => !savingPost && setEditorOpen(false)}
                        />
                        <Motion.div
                            data-lenis-prevent
                            initial={{ y: 30, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 30, opacity: 0 }}
                            className="relative z-10 max-h-[92dvh] w-full overflow-y-auto overscroll-contain rounded-t-md bg-white p-4 shadow-2xl sm:max-w-xl sm:rounded-md sm:border sm:border-gray-600 sm:p-8"
                        >
                            <div className="mb-6 flex items-center justify-between gap-4 border-b border-gray-600 pb-4">
                                <h2 id="my-posts-editor-title" className="text-lg font-black uppercase tracking-tight text-black sm:text-xl">
                                    Edit post
                                </h2>
                                <button
                                    type="button"
                                    onClick={() => !savingPost && setEditorOpen(false)}
                                    aria-label="Close post editor"
                                    className="flex h-9 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-[10px] font-bold uppercase tracking-[0.15em] text-black/60 transition-colors hover:bg-black/5 hover:text-black"
                                >
                                    Close
                                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                                </button>
                            </div>
                            <PostForm
                                onSubmit={async (data) => {
                                    const result = await savePost(data);
                                    if (result) setEditorOpen(false);
                                    return result;
                                }}
                                loading={savingPost}
                                initialPost={editingPost}
                                onCancelEdit={() => {
                                    setEditingPost(null);
                                    setEditorOpen(false);
                                }}
                            />
                        </Motion.div>
                    </div>
                )}
            </AnimatePresence>

            <ConfirmationModal
                isOpen={confirmOpen}
                title="Delete This Post?"
                message="This action cannot be undone."
                confirmLabel="Delete Post"
                danger
                loading={deleting}
                loadingLabel="Deleting..."
                onClose={() => closeConfirm(false)}
                onConfirm={handleConfirmDelete}
            />
        </>
    );
};

export default MyPostsPanel;