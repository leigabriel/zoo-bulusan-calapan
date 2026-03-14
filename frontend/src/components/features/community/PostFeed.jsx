import { useState } from 'react';
import { Link } from 'react-router-dom';
import { communityAPI, getProfileImageUrl } from '../../../services/api-client';
import { notify } from '../../../utils/toast';
import CommentSection from './CommentSection';

const statusStyles = {
    approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
    declined: 'bg-red-100 text-red-700 border-red-200'
};

const PostFeed = ({ posts, currentUser, onRefresh, onEditPost }) => {
    const [openComments, setOpenComments] = useState({});
    const [refreshToken, setRefreshToken] = useState(0);

    const deletePost = async (postId) => {
        try {
            await communityAPI.deletePost(postId, currentUser?.role || 'user');
            notify.success('Post deleted.');
            onRefresh();
        } catch {
            notify.error('Could not delete your post right now.');
        }
    };

    const toggleComments = (postId) => {
        setOpenComments((prev) => ({ ...prev, [postId]: !prev[postId] }));
    };

    const refreshComments = () => setRefreshToken((prev) => prev + 1);

    return (
        <div className="space-y-4 mt-4">
            {posts.map((post) => {
                const isOwner = post.userId === currentUser?.id;
                const statusClass = statusStyles[post.status] || statusStyles.pending;

                return (
                    <article key={post.id} className="bg-white border border-emerald-100 rounded-2xl p-4 md:p-5 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                            <Link to={`/community/users/${post.author.id}`} className="flex items-center gap-3">
                                <img
                                    src={getProfileImageUrl(post.author.profileImage) || 'https://via.placeholder.com/48x48?text=U'}
                                    alt="author"
                                    className="w-11 h-11 rounded-full object-cover border border-emerald-100"
                                />
                                <div>
                                    <p className="text-sm font-semibold text-gray-900 hover:text-emerald-700">
                                        {post.author.firstName} {post.author.lastName}
                                    </p>
                                    <p className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleString()}</p>
                                </div>
                            </Link>

                            <div className={`px-2.5 py-1 text-xs rounded-full border font-semibold ${statusClass}`}>
                                {post.status}
                            </div>
                        </div>

                        <p className="mt-3 text-sm text-gray-800 whitespace-pre-wrap">{post.content}</p>

                        {post.imageUrl && (
                            <div className="mt-3 rounded-xl overflow-hidden border border-emerald-100 bg-emerald-50">
                                <img src={post.imageUrl} alt="post" className="w-full max-h-[480px] object-cover" />
                            </div>
                        )}

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                            <button
                                onClick={() => toggleComments(post.id)}
                                className="px-3 py-1.5 text-xs rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700"
                            >
                                {openComments[post.id] ? 'Hide comments' : `Comments (${post.commentCount || 0})`}
                            </button>

                            {isOwner && (
                                <>
                                    <button
                                        onClick={() => onEditPost(post)}
                                        className="px-3 py-1.5 text-xs rounded-lg bg-blue-50 border border-blue-200 text-blue-700"
                                    >
                                        Edit post
                                    </button>
                                    <button
                                        onClick={() => deletePost(post.id)}
                                        className="px-3 py-1.5 text-xs rounded-lg bg-red-50 border border-red-200 text-red-700"
                                    >
                                        Delete post
                                    </button>
                                </>
                            )}
                        </div>

                        {openComments[post.id] && (
                            <CommentSection
                                postId={post.id}
                                currentUser={currentUser}
                                refreshTrigger={refreshToken}
                                onRefresh={refreshComments}
                            />
                        )}
                    </article>
                );
            })}

            {posts.length === 0 && (
                <div className="bg-white border border-emerald-100 rounded-2xl p-8 text-center text-sm text-gray-500">
                    No community posts yet.
                </div>
            )}
        </div>
    );
};

export default PostFeed;
