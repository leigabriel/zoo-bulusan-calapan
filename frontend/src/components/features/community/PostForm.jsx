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
        notify.success('Image upload success.');
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
        <form onSubmit={submitForm} className="bg-white rounded-2xl border border-emerald-100 p-4 md:p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
                {initialPost ? 'Edit post' : 'Share with the community'}
            </h2>

            <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Tell the community what is happening at Zoo Bulusan..."
                className="w-full min-h-28 rounded-xl border border-emerald-200 px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-y"
                maxLength={3000}
            />

            <div className="mt-2 text-xs text-gray-500 text-right">{content.length}/3000</div>

            {previewUrl && (
                <div className="mt-3 relative w-full rounded-xl overflow-hidden border border-emerald-100 bg-emerald-50">
                    <img src={previewUrl} alt="Post preview" className="max-h-72 w-full object-cover" />
                    <button
                        type="button"
                        onClick={clearImage}
                        className="absolute top-2 right-2 px-3 py-1 text-xs font-semibold rounded-lg bg-white/90 text-red-600 border border-red-100"
                    >
                        Remove image
                    </button>
                </div>
            )}

            {!previewUrl && (
                <label className="mt-3 inline-flex items-center gap-2 px-4 py-2 text-sm rounded-xl border border-emerald-200 text-emerald-700 cursor-pointer hover:bg-emerald-50">
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    Add image
                </label>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60"
                >
                    {loading ? 'Please wait...' : initialPost ? 'Update post' : 'Submit post'}
                </button>

                {initialPost && (
                    <button
                        type="button"
                        onClick={onCancelEdit}
                        className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200"
                    >
                        Cancel
                    </button>
                )}
            </div>
        </form>
    );
};

export default PostForm;
