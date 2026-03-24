import { useEffect, useState } from 'react';
import { communityAPI } from '../../services/api-client';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import { notify } from '../../utils/toast';

const AdminCommunityModeration = () => {
    const [pendingPosts, setPendingPosts] = useState([]);
    const [allPosts, setAllPosts] = useState([]);
    const [reportedComments, setReportedComments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);
    const [removeModal, setRemoveModal] = useState({ isOpen: false, postId: null });
    const [reportActionModal, setReportActionModal] = useState({
        isOpen: false,
        reportId: null,
        action: null
    });
    const [removeCommentModal, setRemoveCommentModal] = useState({
        isOpen: false,
        reportId: null,
        commentId: null
    });
    const [moderationModal, setModerationModal] = useState({
        isOpen: false,
        postId: null,
        action: null,
        note: ''
    });

    const loadData = async () => {
        setLoading(true);
        try {
            const [postsRes, allPostsRes, reportsRes] = await Promise.all([
                communityAPI.getPendingPosts('admin'),
                communityAPI.getAllPostsForModeration('admin'),
                communityAPI.getReportedComments('admin')
            ]);
            setPendingPosts(postsRes.posts || []);
            setAllPosts(allPostsRes.posts || []);
            setReportedComments(reportsRes.reports || []);
        } catch {
            notify.error('Could not load moderation data right now.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const reviewPost = async (postId, action, note = '') => {
        try {
            await communityAPI.reviewPost(postId, action, note, 'admin');
            notify.success(action === 'approved' ? 'Post approved.' : 'Post declined.');
            await loadData();
        } catch {
            notify.error('Could not update this post right now.');
        }
    };

    const openModerationModal = (postId, action) => {
        setModerationModal({
            isOpen: true,
            postId,
            action,
            note: ''
        });
    };

    const closeModerationModal = () => {
        setModerationModal({
            isOpen: false,
            postId: null,
            action: null,
            note: ''
        });
    };

    const confirmModeration = async () => {
        const { postId, action, note } = moderationModal;
        if (!postId || !action) return;

        if (action === 'declined' && !note.trim()) {
            notify.warning('Please provide a specific reason for rejection.');
            return;
        }

        await reviewPost(postId, action, note.trim());
        closeModerationModal();
    };

    const reviewReport = async (reportId, action) => {
        try {
            await communityAPI.reviewReport(reportId, action, 'admin');
            notify.success('Comment report updated.');
            await loadData();
        } catch {
            notify.error('Could not update this report right now.');
        }
    };

    const openReportActionModal = (reportId, action) => {
        setReportActionModal({ isOpen: true, reportId, action });
    };

    const closeReportActionModal = () => {
        setReportActionModal({ isOpen: false, reportId: null, action: null });
    };

    const confirmReportAction = async () => {
        if (!reportActionModal.reportId || !reportActionModal.action) return;
        await reviewReport(reportActionModal.reportId, reportActionModal.action);
        closeReportActionModal();
    };

    const openRemoveCommentModal = (reportId, commentId) => {
        setRemoveCommentModal({ isOpen: true, reportId, commentId });
    };

    const closeRemoveCommentModal = () => {
        setRemoveCommentModal({ isOpen: false, reportId: null, commentId: null });
    };

    const removeReportedComment = async () => {
        if (!removeCommentModal.commentId || !removeCommentModal.reportId) return;

        try {
            await communityAPI.deleteComment(removeCommentModal.commentId, 'admin');
            await communityAPI.reviewReport(removeCommentModal.reportId, 'reviewed', 'admin');
            notify.success('Reported comment removed.');
            closeRemoveCommentModal();
            await loadData();
        } catch {
            notify.error('Could not remove this comment right now.');
        }
    };

    const openRemoveModal = (postId) => {
        setRemoveModal({ isOpen: true, postId });
    };

    const closeRemoveModal = () => {
        setRemoveModal({ isOpen: false, postId: null });
    };

    const removePost = async () => {
        if (!removeModal.postId) return;

        try {
            await communityAPI.deletePost(removeModal.postId, 'admin');
            notify.success('Post removed.');
            closeRemoveModal();
            await loadData();
        } catch {
            notify.error('Could not remove this post right now.');
        }
    };

    const getStatusBadgeClass = (status) => {
        if (status === 'approved') return 'bg-emerald-700/30 text-emerald-200 border border-emerald-700/50';
        if (status === 'declined') return 'bg-red-700/20 text-red-200 border border-red-700/50';
        return 'bg-amber-700/20 text-amber-100 border border-amber-700/50';
    };

    return (
        <div className="space-y-6">
            <section className="bg-[#141414] rounded-2xl border border-emerald-900/40 p-5">
                <h1 className="text-2xl font-black text-white">Community Moderation</h1>
                <p className="text-sm text-emerald-200 mt-1">Review pending posts and reported comments.</p>
            </section>

            {loading && <div className="text-sm text-gray-400">Loading moderation queue...</div>}

            <section className="bg-[#141414] rounded-2xl border border-emerald-900/40 p-5">
                <h2 className="text-lg font-bold text-white mb-4">Pending Posts ({pendingPosts.length})</h2>
                <div className="space-y-4">
                    {pendingPosts.map((post) => (
                        <article key={post.id} className="rounded-xl border border-emerald-900/40 p-4 bg-black/20">
                            <p className="text-sm text-emerald-200 mb-2">
                                {post.author?.firstName} {post.author?.lastName} • {new Date(post.createdAt).toLocaleString()}
                            </p>
                            <p className="text-xs text-emerald-300/80 mb-2">@{post.author?.username} • User ID #{post.userId}</p>
                            <p className="text-sm text-white whitespace-pre-wrap">{post.content}</p>
                            {post.imageUrl && <img src={post.imageUrl} alt="post" className="mt-3 w-full max-h-80 object-cover rounded-lg" />}
                            <div className="mt-3 flex gap-2">
                                <button onClick={() => setSelectedPost(post)} className="px-3 py-2 rounded-lg bg-slate-700 text-white text-xs font-semibold">View details</button>
                                <button onClick={() => openModerationModal(post.id, 'approved')} className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold">Accept</button>
                                <button onClick={() => openModerationModal(post.id, 'declined')} className="px-3 py-2 rounded-lg bg-red-600 text-white text-xs font-semibold">Decline</button>
                            </div>
                        </article>
                    ))}
                    {!pendingPosts.length && <p className="text-sm text-gray-400">No pending posts.</p>}
                </div>
            </section>

            <section className="bg-[#141414] rounded-2xl border border-emerald-900/40 p-5">
                <h2 className="text-lg font-bold text-white mb-4">All User Posts ({allPosts.length})</h2>
                <div className="space-y-4 max-h-[620px] overflow-auto pr-1">
                    {allPosts.map((post) => (
                        <article key={`all-${post.id}`} className="rounded-xl border border-emerald-900/40 p-4 bg-black/20">
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                <p className="text-sm text-emerald-200">
                                    {post.author?.firstName} {post.author?.lastName} • {new Date(post.createdAt).toLocaleString()}
                                </p>
                                <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-[0.15em] ${getStatusBadgeClass(post.status)}`}>
                                    {post.status}
                                </span>
                            </div>
                            <p className="text-xs text-emerald-300/80 mb-2">@{post.author?.username} • User ID #{post.userId}</p>
                            <p className="text-sm text-white whitespace-pre-wrap line-clamp-3">{post.content}</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                <button onClick={() => setSelectedPost(post)} className="px-3 py-2 rounded-lg bg-slate-700 text-white text-xs font-semibold">View details</button>
                                <button onClick={() => openRemoveModal(post.id)} className="px-3 py-2 rounded-lg bg-red-700 text-white text-xs font-semibold">Remove</button>
                            </div>
                        </article>
                    ))}
                    {!allPosts.length && <p className="text-sm text-gray-400">No posts found.</p>}
                </div>
            </section>

            <section className="bg-[#141414] rounded-2xl border border-emerald-900/40 p-5">
                <h2 className="text-lg font-bold text-white mb-4">Reported Comments ({reportedComments.length})</h2>
                <div className="space-y-4">
                    {reportedComments.map((report) => (
                        <article key={report.reportId || report.report_id} className="rounded-xl border border-amber-700/40 p-4 bg-black/20">
                            <p className="text-[11px] text-amber-200">
                                Reported by: {report.reporter?.firstName || report.reporter_first_name} {report.reporter?.lastName || report.reporter_last_name} (@{report.reporter?.username || report.reporter_username})
                            </p>
                            <p className="text-[11px] text-amber-200 mt-1">
                                Comment by: {report.commentAuthor?.firstName || report.comment_first_name} {report.commentAuthor?.lastName || report.comment_last_name} (@{report.commentAuthor?.username || report.comment_username})
                            </p>
                            <p className="text-xs text-amber-300">Reason: {report.reason}</p>
                            <p className="text-sm text-white mt-2">{report.commentText || report.comment_text}</p>
                            <div className="mt-3 flex gap-2">
                                <button onClick={() => openReportActionModal(report.reportId || report.report_id, 'reviewed')} className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold">Mark reviewed</button>
                                <button onClick={() => openReportActionModal(report.reportId || report.report_id, 'dismissed')} className="px-3 py-2 rounded-lg bg-gray-600 text-white text-xs font-semibold">Dismiss</button>
                                <button onClick={() => openRemoveCommentModal(report.reportId || report.report_id, report.commentId || report.comment_id)} className="px-3 py-2 rounded-lg bg-red-700 text-white text-xs font-semibold">Remove comment</button>
                            </div>
                        </article>
                    ))}
                    {!reportedComments.length && <p className="text-sm text-gray-400">No reported comments.</p>}
                </div>
            </section>

            {selectedPost && (
                <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
                    <button className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedPost(null)} />
                    <div className="relative w-full max-w-3xl max-h-[85vh] overflow-auto bg-[#141414] border border-emerald-900/40 rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-white">Submitted Post Details</h3>
                            <button onClick={() => setSelectedPost(null)} className="text-xs font-semibold text-gray-300 hover:text-white">Close</button>
                        </div>
                        <div className="space-y-3 text-sm">
                            <p className="text-emerald-200"><span className="font-semibold">User:</span> {selectedPost.author?.firstName} {selectedPost.author?.lastName} (@{selectedPost.author?.username})</p>
                            <p className="text-emerald-200"><span className="font-semibold">Submission Time:</span> {new Date(selectedPost.createdAt).toLocaleString()}</p>
                            <div>
                                <p className="text-emerald-300 mb-1 font-semibold">Full Content</p>
                                <p className="text-white whitespace-pre-wrap leading-relaxed">{selectedPost.content}</p>
                            </div>
                            {selectedPost.imageUrl && (
                                <div>
                                    <p className="text-emerald-300 mb-2 font-semibold">Attached Image</p>
                                    <img src={selectedPost.imageUrl} alt="submitted post" className="w-full max-h-[420px] object-contain rounded-xl border border-emerald-900/40" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={moderationModal.isOpen}
                title={moderationModal.action === 'approved' ? 'Approve This Post?' : 'Decline This Post?'}
                message={moderationModal.action === 'approved'
                    ? 'This post will be visible to all users once approved.'
                    : 'Declining this post requires a clear reason and the user will be notified.'}
                confirmLabel={moderationModal.action === 'approved' ? 'Approve Post' : 'Decline Post'}
                danger={moderationModal.action === 'declined'}
                requireInput={moderationModal.action === 'declined'}
                inputLabel="Decline Reason"
                inputPlaceholder="State the specific reason for rejection"
                inputValue={moderationModal.note}
                onInputChange={(value) => setModerationModal((prev) => ({ ...prev, note: value }))}
                confirmDisabled={moderationModal.action === 'declined' && !moderationModal.note.trim()}
                variant="moderation"
                onConfirm={confirmModeration}
                onClose={closeModerationModal}
            />

            <ConfirmationModal
                isOpen={removeModal.isOpen}
                title="Remove This Post?"
                message="This will permanently remove the post from the community feed. This action cannot be undone."
                confirmLabel="Remove Post"
                danger
                variant="moderation"
                onConfirm={removePost}
                onClose={closeRemoveModal}
            />

            <ConfirmationModal
                isOpen={reportActionModal.isOpen}
                title={reportActionModal.action === 'dismissed' ? 'Dismiss This Report?' : 'Mark This Report Reviewed?'}
                message={reportActionModal.action === 'dismissed'
                    ? 'This report will be dismissed and removed from the moderation queue.'
                    : 'This report will be marked as reviewed and removed from the moderation queue.'}
                confirmLabel={reportActionModal.action === 'dismissed' ? 'Dismiss Report' : 'Mark Reviewed'}
                variant="moderation"
                onConfirm={confirmReportAction}
                onClose={closeReportActionModal}
            />

            <ConfirmationModal
                isOpen={removeCommentModal.isOpen}
                title="Remove This Reported Comment?"
                message="Use this when the comment violates policy. This action permanently deletes the comment."
                confirmLabel="Remove Comment"
                danger
                variant="moderation"
                onConfirm={removeReportedComment}
                onClose={closeRemoveCommentModal}
            />
        </div>
    );
};

export default AdminCommunityModeration;