import { useEffect, useState } from 'react';
import { communityAPI, getProfileImageUrl } from '../../../services/api-client';
import { notify } from '../../../utils/toast';

const buildCommentTree = (items) => {
    const byId = new Map();
    const roots = [];

    items.forEach((comment) => {
        byId.set(comment.id, { ...comment, replies: [] });
    });

    byId.forEach((comment) => {
        if (comment.parentCommentId && byId.has(comment.parentCommentId)) {
            byId.get(comment.parentCommentId).replies.push(comment);
        } else {
            roots.push(comment);
        }
    });

    return roots;
};

const CommentSection = ({ postId, currentUser, refreshTrigger, onRequireConfirmation }) => {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editingText, setEditingText] = useState('');
    const [replyingToId, setReplyingToId] = useState(null);
    const [replyText, setReplyText] = useState('');

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
        if (!value) return;

        try {
            if (onRequireConfirmation) {
                const confirmed = await onRequireConfirmation({
                    type: 'create-comment',
                    title: 'Post This Comment?',
                    message: 'Are you sure you want to publish this comment?',
                    confirmLabel: 'Post Comment'
                });
                if (!confirmed) return;
            }

            await communityAPI.createComment(postId, value, null, currentUser?.role || 'user');
            setCommentText('');
            await loadComments();
            notify.success('Comment posted.');
        } catch {
            notify.error('Could not add your comment right now.');
        }
    };

    const submitReply = async (parentCommentId) => {
        const value = replyText.trim();
        if (!value) return;

        try {
            if (onRequireConfirmation) {
                const confirmed = await onRequireConfirmation({
                    type: 'create-reply',
                    title: 'Post This Reply?',
                    message: 'Are you sure you want to publish this reply?',
                    confirmLabel: 'Post Reply'
                });
                if (!confirmed) return;
            }

            await communityAPI.createComment(postId, value, parentCommentId, currentUser?.role || 'user');
            setReplyText('');
            setReplyingToId(null);
            await loadComments();
            notify.success('Reply posted.');
        } catch {
            notify.error('Could not add your reply right now.');
        }
    };

    const saveEdit = async () => {
        const value = editingText.trim();
        if (!value) return;

        try {
            if (onRequireConfirmation) {
                const confirmed = await onRequireConfirmation({
                    type: 'update-comment',
                    title: 'Save Comment Changes?',
                    message: 'Are you sure you want to update this comment?',
                    confirmLabel: 'Save Changes'
                });
                if (!confirmed) return;
            }

            await communityAPI.updateComment(editingId, value, currentUser?.role || 'user');
            setEditingId(null);
            setEditingText('');
            await loadComments();
            notify.success('Comment updated.');
        } catch {
            notify.error('Could not update your comment right now.');
        }
    };

    const removeComment = async (commentId) => {
        try {
            if (onRequireConfirmation) {
                const confirmed = await onRequireConfirmation({
                    type: 'delete-comment',
                    title: 'Delete This Comment?',
                    message: 'This action cannot be undone.',
                    confirmLabel: 'Delete Comment',
                    danger: true
                });
                if (!confirmed) return;
            }

            await communityAPI.deleteComment(commentId, currentUser?.role || 'user');
            await loadComments();
            notify.success('Comment deleted.');
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

    const commentTree = buildCommentTree(comments);

    const renderComment = (comment, depth = 0) => {
        const isOwner = currentUser?.id === comment.userId;
        const maxIndentLevel = 4;
        const clampedDepth = Math.min(depth, maxIndentLevel);

        return (
            <div key={comment.id} className={`flex gap-4 py-6 ${depth > 0 ? 'border-l border-white/20 pl-4 md:pl-6 mt-4' : ''}`}>
                <img
                    src={getProfileImageUrl(comment.author.profileImage) || 'https://via.placeholder.com/48x48?text=U'}
                    alt="author"
                    className="w-10 h-10 rounded-none object-cover border border-white/30 shrink-0 grayscale"
                />
                <div className="flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-black uppercase tracking-tight text-white">
                                {comment.author.firstName} {comment.author.lastName}
                            </span>
                            <span className="text-[9px] tracking-[0.18em] uppercase font-bold text-white/60">
                                {new Date(comment.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                        {!isOwner && (
                            <button onClick={handleReport} className="text-[9px] tracking-[0.18em] uppercase font-bold text-white/50 hover:text-red-300 transition-colors">
                                Report
                            </button>
                        )}
                    </div>

                    {editingId === comment.id ? (
                        <div className="mt-2 flex flex-col gap-3">
                            <textarea
                                value={editingText}
                                onChange={(event) => setEditingText(event.target.value)}
                                className="w-full bg-transparent border border-white/30 p-3 text-sm font-medium text-white outline-none focus:border-white"
                                rows={3}
                                maxLength={1200}
                            />
                            <div className="flex gap-3">
                                <button onClick={saveEdit} className="px-5 py-2 border border-white bg-white text-[#26bc61] text-[9px] tracking-[0.18em] uppercase font-black hover:bg-transparent hover:text-white transition-colors">Save</button>
                                <button onClick={() => setEditingId(null)} className="px-5 py-2 border border-white/30 text-white text-[9px] tracking-[0.18em] uppercase font-black hover:bg-white/20 transition-colors">Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm md:text-base text-white font-medium whitespace-pre-wrap leading-relaxed">
                            {comment.commentText}
                        </p>
                    )}

                    <div className="flex items-center gap-6 mt-4 flex-wrap">
                        <button
                            onClick={() => toggleHeart(comment.id)}
                            className={`text-[10px] tracking-widest uppercase font-black transition-colors flex items-center gap-1.5 ${comment.heartedByViewer || comment.isHearted ? 'text-red-500' : 'text-white/50 hover:text-white'}`}
                        >
                            <svg className={`w-4 h-4 ${comment.heartedByViewer || comment.isHearted ? 'fill-red-500' : 'fill-none'}`} stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                            </svg>
                            {comment.heartCount || 0}
                        </button>

                        {clampedDepth < maxIndentLevel && (
                            <button
                                onClick={() => {
                                    setReplyingToId(comment.id);
                                    setReplyText('');
                                }}
                                className="text-[9px] tracking-[0.18em] uppercase font-black text-white/60 hover:text-white transition-colors"
                            >
                                Reply
                            </button>
                        )}

                        {isOwner && editingId !== comment.id && (
                            <>
                                <button
                                    onClick={() => {
                                        setEditingId(comment.id);
                                        setEditingText(comment.commentText || '');
                                    }}
                                    className="text-[9px] tracking-[0.18em] uppercase font-black text-white/50 hover:text-white transition-colors"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => removeComment(comment.id)}
                                    className="text-[9px] tracking-[0.18em] uppercase font-black text-white/50 hover:text-red-300 transition-colors"
                                >
                                    Delete
                                </button>
                            </>
                        )}
                    </div>

                    {replyingToId === comment.id && (
                        <div className="mt-4 border border-white/20 p-4 bg-white/5">
                            <textarea
                                value={replyText}
                                onChange={(event) => setReplyText(event.target.value)}
                                className="w-full bg-transparent border border-white/30 p-3 text-sm font-medium text-white outline-none focus:border-white"
                                placeholder="Write your reply..."
                                rows={3}
                                maxLength={1200}
                            />
                            <div className="mt-3 flex gap-3 justify-end">
                                <button
                                    onClick={() => {
                                        setReplyingToId(null);
                                        setReplyText('');
                                    }}
                                    className="px-4 py-2 border border-white/30 text-white text-[9px] tracking-[0.18em] uppercase font-black hover:bg-white/20 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => submitReply(comment.id)}
                                    disabled={!replyText.trim()}
                                    className="px-4 py-2 border border-white bg-white text-[#26bc61] text-[9px] tracking-[0.18em] uppercase font-black hover:bg-transparent hover:text-white disabled:opacity-50 disabled:pointer-events-none transition-colors"
                                >
                                    Reply
                                </button>
                            </div>
                        </div>
                    )}

                    {comment.replies?.length > 0 && (
                        <div className="mt-2">
                            {comment.replies.map((reply) => renderComment(reply, depth + 1))}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const handleReport = () => {
        notify.success('Comment reported for review.');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="w-4 h-4 rounded-full border-[1.5px] border-white/30 border-t-white animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col md:flex-row gap-4 items-start border border-white/20 p-5 bg-[#26bc61]">
                <img
                    src={getProfileImageUrl(currentUser?.profileImage || currentUser?.profile_image) || 'https://via.placeholder.com/48x48?text=U'}
                    alt="You"
                    className="w-10 h-10 rounded-none object-cover border border-white/30 shrink-0 hidden md:block grayscale"
                />
                <div className="flex-1 flex flex-col gap-4 w-full">
                    <textarea
                        value={commentText}
                        onChange={(event) => setCommentText(event.target.value)}
                        className="w-full bg-transparent border-b border-white/30 p-2 text-sm md:text-base font-medium text-white focus:border-white transition-all resize-none h-20 outline-none placeholder:uppercase placeholder:tracking-widest placeholder:text-[10px] placeholder:font-bold placeholder:text-white/50"
                        placeholder="Write a reply..."
                        maxLength={1200}
                    />
                    <div className="flex justify-end">
                        <button
                            onClick={submitComment}
                            disabled={!commentText.trim()}
                            className="px-6 py-2 border border-white bg-white text-[#26bc61] text-[9px] tracking-[0.18em] uppercase font-black hover:bg-transparent hover:text-white disabled:opacity-50 disabled:pointer-events-none transition-colors"
                        >
                            Reply
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex flex-col">
                {commentTree.map((comment) => renderComment(comment))}

                {comments.length === 0 && (
                    <div className="text-[10px] tracking-[0.18em] uppercase font-bold text-white/60 text-center py-8">
                        No comments yet
                    </div>
                )}
            </div>
        </div>
    );
};

export default CommentSection;