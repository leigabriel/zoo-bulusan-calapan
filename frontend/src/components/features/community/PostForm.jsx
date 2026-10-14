import { useEffect, useState } from 'react';
import { notify } from '../../../utils/toast';

const MAX_SIZE = 5 * 1024 * 1024;
// Up to five photos per post. Keep in step with MAX_POST_IMAGES in
// backend/routes/community-routes.js.
const MAX_IMAGES = 5;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const PostForm = ({ onSubmit, loading, initialPost = null, onCancelEdit }) => {
    const [content, setContent] = useState('');
    // One array of { file, url } pairs. Previously files and their preview urls lived in two
    // separate arrays and only the file array was populated on pick, so newly chosen photos
    // never got a thumbnail and index-based removal desynced the two.
    const [photos, setPhotos] = useState([]);
    // Photos already stored against a post being edited.
    const [existing, setExisting] = useState([]);
    const [removeImage, setRemoveImage] = useState(false);

    const isEditing = Boolean(initialPost);
    // Editing replaces the image rather than appending to it, so a new pick takes over.
    const showExisting = isEditing && !removeImage && photos.length === 0;
    const displayUrls = showExisting ? existing : photos.map((photo) => photo.url);
    const fileCount = showExisting ? existing.length : photos.length;

    useEffect(() => {
        if (initialPost) {
            setContent(initialPost.content || '');
            setPhotos([]);
            setExisting(initialPost.images?.length ? initialPost.images : (initialPost.imageUrl ? [initialPost.imageUrl] : []));
            setRemoveImage(false);
        } else {
            setContent('');
            setPhotos([]);
            setExisting([]);
            setRemoveImage(false);
        }
    }, [initialPost]);

    // Release object URLs so a long compose session does not leak blobs.
    useEffect(() => () => {
        photos.forEach((photo) => URL.revokeObjectURL(photo.url));
    }, [photos]);

    const handleFileChange = (event) => {
        const picked = Array.from(event.target.files || []);
        // Allow re-picking the same file after a removal.
        event.target.value = '';
        if (!picked.length) return;

        setPhotos((current) => {
            const accepted = [];
            for (const file of picked) {
                if (!ALLOWED_TYPES.includes(file.type)) {
                    notify.warning(`${file.name} is not a valid image.`);
                    continue;
                }
                if (file.size > MAX_SIZE) {
                    notify.warning(`${file.name} is over 5MB.`);
                    continue;
                }
                accepted.push({ file, url: URL.createObjectURL(file) });
            }

            const merged = [...current, ...accepted];
            if (merged.length > MAX_IMAGES) {
                notify.warning(`You can attach up to ${MAX_IMAGES} photos.`);
                // Drop the overflow rather than silently sending more than the cap.
                merged.slice(MAX_IMAGES).forEach((photo) => URL.revokeObjectURL(photo.url));
                return merged.slice(0, MAX_IMAGES);
            }
            return merged;
        });
        if (isEditing) setRemoveImage(true);
    };

    const removeImageAt = (index) => {
        if (showExisting) {
            setExisting([]);
            setRemoveImage(true);
            return;
        }
        setPhotos((current) => {
            const target = current[index];
            if (target) URL.revokeObjectURL(target.url);
            return current.filter((_, i) => i !== index);
        });
    };

    const clearImages = () => {
        photos.forEach((photo) => URL.revokeObjectURL(photo.url));
        setPhotos([]);
        setExisting([]);
        setRemoveImage(true);
    };

    const submitForm = async (event) => {
        event.preventDefault();
        const cleanContent = content.trim();

        if (!cleanContent) {
            notify.warning('Please write something first.');
            return;
        }

        // Photos are entirely optional; a text-only post is a valid post.
        const submitted = await onSubmit({
            content: cleanContent,
            imageFiles: photos.map((photo) => photo.file),
            removeImage
        });

        if (!initialPost && submitted !== false) {
            setContent('');
            photos.forEach((photo) => URL.revokeObjectURL(photo.url));
            setPhotos([]);
            setExisting([]);
            setRemoveImage(false);
        }
    };

    return (
        <form onSubmit={submitForm} className="bg-white flex flex-col relative">
            {/* Creating a post no longer blocks: it is handed to the upload queue, which shows
                the post in the feed immediately with a progress bar, so covering this form
                would hide the thing the visitor just wrote for no reason. An edit still runs
                in this page with no progress surface of its own, so it keeps the overlay. */}
            {loading && initialPost && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 rounded-md bg-white/90 backdrop-blur-[2px]" role="status" aria-live="polite">
                    <span aria-hidden="true" className="h-9 w-9 animate-spin rounded-full border-[3px] border-black/20 border-t-black" />
                    <span className="text-xs font-bold uppercase tracking-[0.15em] text-black">
                        {initialPost ? 'Updating...' : 'Publishing...'}
                    </span>
                </div>
            )}
            {/* No heading here: the surrounding modal already labels itself ("Create post" /
                "Edit post"), so a second one stacked underneath was just a duplicate. */}

            <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Share an update..."
                className="w-full min-h-[140px] bg-white border border-gray-600 p-4 text-sm md:text-base font-medium text-black focus:border-black focus:ring-0 transition-all resize-y outline-none placeholder:uppercase placeholder:tracking-widest placeholder:text-[10px] placeholder:font-bold placeholder:text-black/50"
                maxLength={3000}
            />

            {displayUrls.length > 0 && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {displayUrls.map((url, index) => (
                        <div key={`${url}-${index}`} className="relative overflow-hidden rounded-md border border-gray-600 bg-black/[0.03]">
                            <img src={url} alt={`Attached photo ${index + 1}`} className="h-28 w-full object-cover" />
                            <button
                                type="button"
                                onClick={() => removeImageAt(index)}
                                aria-label={`Remove photo ${index + 1}`}
                                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-md border border-gray-600 bg-white text-black shadow-sm hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors cursor-pointer"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                    <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                    <label className={`inline-flex items-center gap-2 rounded-md px-5 py-3 min-h-11 border border-gray-600 text-black transition-colors text-[10px] tracking-[0.15em] uppercase font-black w-max ${fileCount >= MAX_IMAGES ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-black/5'}`}>
                        <input type="file" accept="image/*" multiple={MAX_IMAGES > 1} disabled={fileCount >= MAX_IMAGES} className="hidden" onChange={handleFileChange} />
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2.828 2.828 0 012.828 0L16 16m-2-2l1.586-1.586a2.828 2.828 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                        {MAX_IMAGES === 1
                            ? (fileCount ? 'Replace Photo' : 'Attach Photo')
                            : (fileCount ? 'Add More' : 'Attach Photos')}
                    </label>
                    {fileCount > 0 && (
                        <button type="button" onClick={clearImages} className="text-[10px] tracking-[0.15em] uppercase font-black text-black/50 hover:text-red-600 transition-colors">Remove</button>
                    )}
                    {fileCount > 0 && MAX_IMAGES > 1 && (
                        <span className="text-[10px] tracking-[0.15em] uppercase font-bold text-black/40">{fileCount} of {MAX_IMAGES}</span>
                    )}
                </div>
                <div className="flex w-full items-center gap-3 sm:w-auto">
                    {initialPost && (
                        <button
                            type="button"
                            onClick={onCancelEdit}
                            className="flex-1 rounded-md border border-gray-600 px-5 py-3 min-h-11 text-black text-[10px] tracking-[0.15em] uppercase font-black hover:bg-black/5 transition-colors sm:flex-none sm:px-6"
                        >
                            Cancel
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={loading || !content.trim()}
                        aria-busy={loading}
                        className="flex-1 rounded-md bg-black px-7 py-3 min-h-11 text-white text-[10px] tracking-[0.15em] uppercase font-black hover:bg-black/80 disabled:opacity-50 disabled:pointer-events-none transition-colors sm:flex-none sm:px-8"
                    >
                        {loading ? (
                            <span className="inline-flex items-center gap-2">
                                <span
                                    aria-hidden="true"
                                    className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white"
                                />
                                <span>Publishing...</span>
                            </span>
                        ) : initialPost ? 'Save' : 'Publish'}
                    </button>
                </div>
            </div>
        </form>
    );
};

export default PostForm;
