import { communityAPI, getProfileImageUrl } from '../../../services/api-client';
import { notify } from '../../../utils/toast';

const PostFeed = ({ posts, currentUser, onRefresh, onEditPost, onUserClick, onPostClick }) => {

    const deletePost = async (postId, e) => {
        e.stopPropagation();
        try {
            await communityAPI.deletePost(postId, currentUser?.role || 'user');
            notify.success('Post deleted.');
            onRefresh();
        } catch {
            notify.error('Could not delete your post right now.');
        }
    };

    const handleEditClick = (post, e) => {
        e.stopPropagation();
        onEditPost(post);
    };

    const handleUserClick = (userId, e) => {
        e.stopPropagation();
        if (onUserClick) onUserClick(userId);
    };

    const handleReport = (e) => {
        e.stopPropagation();
        notify.success('Post reported for review.');
    };

    return (
        <div className="flex flex-col gap-6 md:gap-8">
            {posts.map((post) => {
                const isOwner = post.userId === currentUser?.id;

                return (
                    <article
                        key={post.id}
                        className="bg-[#26bc61] border border-white/20 cursor-pointer group flex flex-col hover:border-white/40 transition-colors"
                        onClick={() => onPostClick && onPostClick(post)}
                    >
                        <div className="flex items-center justify-between p-5 md:p-6 border-b border-white/20">
                            <div
                                className="flex items-center gap-4 cursor-pointer"
                                onClick={(e) => handleUserClick(post.author.id, e)}
                            >
                                <img
                                    src={getProfileImageUrl(post.author.profileImage) || 'https://via.placeholder.com/56x56?text=U'}
                                    alt="author"
                                    className="w-10 h-10 rounded-none object-cover border border-white/30 grayscale group-hover:grayscale-0 transition-all duration-300"
                                />
                                <div className="flex flex-col">
                                    <p className="text-sm font-black uppercase text-white tracking-tight hover:underline">
                                        {post.author.firstName} {post.author.lastName}
                                    </p>
                                    <p className="text-[9px] tracking-[0.18em] uppercase font-bold text-white/60">
                                        {new Date(post.createdAt).toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {!isOwner && (
                                    <button
                                        onClick={handleReport}
                                        className="text-[9px] tracking-[0.18em] uppercase font-bold text-white/50 hover:text-red-300 transition-colors"
                                    >
                                        Report
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="p-5 md:p-6">
                            <p className="text-lg md:text-xl text-white font-medium leading-relaxed whitespace-pre-wrap tracking-tight">
                                {post.content}
                            </p>
                        </div>

                        {post.imageUrl && (
                            <div className="border-t border-b border-white/20 bg-white/10 flex items-center justify-center overflow-hidden">
                                <img src={post.imageUrl} alt="post" className="w-full h-auto max-h-[600px] object-cover" />
                            </div>
                        )}

                        <div className="flex items-center justify-between p-4 md:p-5 bg-[#26bc61] border-t border-white/20 mt-auto">
                            <button
                                className="flex items-center gap-2 text-[10px] tracking-[0.18em] uppercase font-bold text-white/70 hover:text-white transition-colors"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (onPostClick) onPostClick(post);
                                }}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                                </svg>
                                {post.commentCount || 0} Comments
                            </button>

                            {isOwner && (
                                <div className="flex gap-4">
                                    <button
                                        onClick={(e) => handleEditClick(post, e)}
                                        className="text-[9px] tracking-[0.18em] uppercase font-black text-white/70 hover:text-white transition-colors"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={(e) => deletePost(post.id, e)}
                                        className="text-[9px] tracking-[0.18em] uppercase font-black text-red-300 hover:text-red-400 transition-colors"
                                    >
                                        Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    </article>
                );
            })}

            {posts.length === 0 && (
                <div className="border border-white/20 p-16 flex flex-col items-center justify-center text-center bg-[#26bc61]">
                    <p className="text-2xl font-black uppercase tracking-tighter text-white/50 mb-2">No Posts Yet</p>
                    <p className="text-[10px] tracking-[0.18em] uppercase font-bold text-white/70">Be the first to share something.</p>
                </div>
            )}
        </div>
    );
};

export default PostFeed;