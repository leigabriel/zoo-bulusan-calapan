import { useEffect, useState } from 'react';
import { notify } from '../../../utils/toast';

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const PostForm = ({ onSubmit, loading, initialPost = null, onCancelEdit }) => {
    const [content, setContent] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [removeImage, setRemoveImage] = useState(false);

    useEffect(() => {
        if (initialPost) {
            setContent(initialPost.content || '');
            setPreviewUrl(initialPost.imageUrl || '');
            setImageFile(null);
            setRemoveImage(false);
        } else {
            setContent('');
            setImageFile(null);
            setPreviewUrl('');
            setRemoveImage(false);
        }
    }, [initialPost]);

    const handleFileChange = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!ALLOWED_TYPES.includes(file.type)) {
            notify.warning('Please upload a JPG, PNG, WEBP, or GIF image.');
            return;
        }

        if (file.size > MAX_SIZE) {
            notify.warning('Please upload an image smaller than 5MB.');
            return;
        }

        setImageFile(file);
        setRemoveImage(false);
        setPreviewUrl(URL.createObjectURL(file));
    };

    const clearImage = () => {
        setImageFile(null);
        setPreviewUrl('');
        setRemoveImage(true);
    };

    const submitForm = async (event) => {
        event.preventDefault();
        const cleanContent = content.trim();

        if (!cleanContent) {
            notify.warning('Please write something before posting.');
            return;
        }

        await onSubmit({ content: cleanContent, imageFile, removeImage });

        if (!initialPost) {
            setContent('');
            setImageFile(null);
            setPreviewUrl('');
            setRemoveImage(false);
        }
    };

    return (
        <form onSubmit={submitForm} className="bg-[#ebebeb] flex flex-col">
            <h2 className="text-xl md:text-2xl font-black uppercase text-[#212631] tracking-tighter mb-6 border-b border-[#212631]/10 pb-4">
                {initialPost ? 'Edit Entry' : 'New Entry'}
            </h2>

            <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Share an update..."
                className="w-full min-h-[140px] bg-transparent border border-[#212631]/20 p-4 text-sm md:text-base font-medium text-[#212631] focus:border-[#212631] focus:ring-0 transition-all resize-y outline-none placeholder:uppercase placeholder:tracking-widest placeholder:text-[10px] placeholder:font-bold placeholder:text-[#212631]/30"
                maxLength={3000}
            />

            {previewUrl && (
                <div className="mt-4 relative w-full border border-[#212631]/20 bg-[#212631]/5">
                    <img src={previewUrl} alt="Preview" className="max-h-64 w-full object-cover grayscale" />
                    <button
                        type="button"
                        onClick={clearImage}
                        className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center border border-[#ebebeb]/20 bg-[#212631] text-[#ebebeb] hover:bg-red-600 transition-colors cursor-pointer"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                            <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            )}

            <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {!previewUrl ? (
                    <label className="inline-flex items-center gap-2 px-4 py-3 border border-[#212631]/20 text-[#212631] cursor-pointer hover:bg-[#212631] hover:text-[#ebebeb] transition-colors text-[9px] tracking-[0.18em] uppercase font-black w-max">
                        <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                        Attach Media
                    </label>
                ) : (
                    <div></div>
                )}

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    {initialPost && (
                        <button
                            type="button"
                            onClick={onCancelEdit}
                            className="flex-1 sm:flex-none px-6 py-3 border border-[#212631]/20 text-[#212631] text-[9px] tracking-[0.18em] uppercase font-black hover:bg-[#212631]/5 transition-colors"
                        >
                            Cancel
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={loading || !content.trim()}
                        className="flex-1 sm:flex-none px-8 py-3 bg-[#212631] text-[#ebebeb] border border-[#212631] text-[9px] tracking-[0.18em] uppercase font-black hover:bg-transparent hover:text-[#212631] disabled:opacity-50 disabled:pointer-events-none transition-colors"
                    >
                        {loading ? 'Processing...' : initialPost ? 'Save' : 'Publish'}
                    </button>
                </div>
            </div>
        </form>
    );
};

export default PostForm;