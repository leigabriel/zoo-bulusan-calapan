import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { communityAPI, getProfileImageUrl } from '../../../services/api-client';
import { notify } from '../../../utils/toast';

const CommentSection = ({ postId, currentUser, refreshTrigger }) => {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editingText, setEditingText] = useState('');

    const loadComments = async () => {
        setLoading(true);
        try {
            const response = await communityAPI.getComments(postId, currentUser?.role || 'user');
            setComments(response.comments || []);
        } catch {
            notify.error('Could not load comments right now.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadComments();
    }, [postId, refreshTrigger]);

    const submitComment = async () => {
        const value = commentText.trim();
        if (!value) {
            notify.warning('Please write a comment first.');
            return;
        }

        try {
            await communityAPI.createComment(postId, value, currentUser?.role || 'user');
            setCommentText('');
            notify.success('Comment added.');
            await loadComments();
        } catch {
            notify.error('Could not add your comment right now.');
        }
    };

    const saveEdit = async () => {
        const value = editingText.trim();
        if (!value) {
            notify.warning('Please write a comment first.');
            return;
        }

        try {
            await communityAPI.updateComment(editingId, value, currentUser?.role || 'user');
            notify.success('Comment updated.');
            setEditingId(null);
            setEditingText('');
            await loadComments();
        } catch {
            notify.error('Could not update your comment right now.');
        }
    };

    const removeComment = async (commentId) => {
        try {
            await communityAPI.deleteComment(commentId, currentUser?.role || 'user');
            notify.success('Comment deleted.');
            await loadComments();
        } catch {
            notify.error('Could not delete your comment right now.');
        }
    };

    const toggleHeart = async (commentId) => {
        try {
            await communityAPI.toggleCommentHeart(commentId, currentUser?.role || 'user');
            await loadComments();
        } catch {
            notify.error('Could not update hearts right now.');
        }
    };

    const reportComment = async (commentId) => {
        const reason = window.prompt('Why are you reporting this comment?');
        if (!reason || !reason.trim()) return;

        try {
            await communityAPI.reportComment(commentId, reason.trim(), currentUser?.role || 'user');
            notify.success('Comment reported.');
            await loadComments();
        } catch {
            notify.error('Could not report this comment right now.');
        }
    };

    if (loading) {
        return <div className="text-sm text-gray-500 mt-3">Loading comments...</div>;
    }

    return (
        <div className="mt-4 border-t border-emerald-100 pt-3">
            <div className="flex gap-2">
                <input
                    value={commentText}
                    onChange={(event) => setCommentText(event.target.value)}
                    className="flex-1 rounded-lg border border-emerald-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                    placeholder="Write a comment"
                    maxLength={1200}
                />
                <button
                    onClick={submitComment}
                    className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700"
                >
                    Comment
                </button>
            </div>

            <div className="mt-3 space-y-3">
                {comments.map((comment) => {
                    const isOwner = currentUser?.id === comment.userId;
                    return (
                        <div key={comment.id} className="bg-emerald-50/40 border border-emerald-100 rounded-xl p-3">
                            <div className="flex items-center gap-2 mb-2">
                                <Link to={`/community/users/${comment.author.id}`} className="flex items-center gap-2">
                                    <img
                                        src={getProfileImageUrl(comment.author.profileImage) || 'https://via.placeholder.com/40x40?text=U'}
                                        alt="comment author"
                                        className="w-8 h-8 rounded-full object-cover"
                                    />
                                    <span className="text-sm font-semibold text-gray-800 hover:text-emerald-700">
                                        {comment.author.firstName} {comment.author.lastName}
                                    </span>
                                </Link>
                                <span className="text-xs text-gray-500">{new Date(comment.createdAt).toLocaleString()}</span>
                            </div>

                            {editingId === comment.id ? (
                                <div className="space-y-2">
                                    <textarea
                                        value={editingText}
                                        onChange={(event) => setEditingText(event.target.value)}
                                        className="w-full rounded-lg border border-emerald-200 px-3 py-2 text-sm"
                                        rows={2}
                                        maxLength={1200}
                                    />
                                    <div className="flex gap-2">
                                        <button onClick={saveEdit} className="px-3 py-1.5 text-xs rounded bg-emerald-600 text-white">Save</button>
                                        <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-xs rounded bg-gray-200 text-gray-700">Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.commentText}</p>
                            )}

                            <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                <button onClick={() => toggleHeart(comment.id)} className="px-2 py-1 rounded bg-white border border-emerald-200 text-emerald-700">
                                    Heart ({comment.heartCount || 0})
                                </button>
                                <button onClick={() => reportComment(comment.id)} className="px-2 py-1 rounded bg-white border border-amber-200 text-amber-700">
                                    Report
                                </button>
                                {isOwner && editingId !== comment.id && (
                                    <>
                                        <button
                                            onClick={() => {
                                                setEditingId(comment.id);
                                                setEditingText(comment.commentText || '');
                                            }}
                                            className="px-2 py-1 rounded bg-white border border-blue-200 text-blue-700"
                                        >
                                            Edit
                                        </button>
                                        <button onClick={() => removeComment(comment.id)} className="px-2 py-1 rounded bg-white border border-red-200 text-red-700">Delete</button>
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}

                {comments.length === 0 && (
                    <div className="text-sm text-gray-500">No comments yet.</div>
                )}
            </div>
        </div>
    );
};

export default CommentSection;
