import { useCallback, useEffect, useState } from 'react';
import { communityAPI } from '../../services/api-client';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import { notify } from '../../utils/toast';
import { formatSafeDate } from '../../utils/format-date';
import { Check, ChevronRight, FileText, Flag, Library, Search, Trash2, X } from 'lucide-react';

const AdminCommunityModeration = ({ role = 'admin' }) => {
    const [pendingPosts, setPendingPosts] = useState([]);
    const [allPosts, setAllPosts] = useState([]);
    const [reportedComments, setReportedComments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('pending');
    const [searchQuery, setSearchQuery] = useState('');
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

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [postsRes, allPostsRes, reportsRes] = await Promise.all([
                communityAPI.getPendingPosts(role),
                communityAPI.getAllPostsForModeration(role),
                communityAPI.getReportedComments(role)
            ]);
            setPendingPosts(postsRes.posts || []);
            setAllPosts(allPostsRes.posts || []);
            setReportedComments(reportsRes.reports || []);
        } catch {
            notify.error("Couldn't load moderation data.");
        } finally {
            setLoading(false);
        }
    }, [role]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const reviewPost = async (postId, action, note = '') => {
        try {
            await communityAPI.reviewPost(postId, action, note, role);
            notify.success(action === 'approved' ? 'Post approved.' : 'Post declined.');
            await loadData();
        } catch {
            notify.error("Couldn't update post status.");
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
            notify.warning('Provide a reason first.');
            return;
        }

        await reviewPost(postId, action, note.trim());
        closeModerationModal();
    };

    const reviewReport = async (reportId, action) => {
        try {
            await communityAPI.reviewReport(reportId, action, role);
            notify.success('Report updated.');
            await loadData();
        } catch {
            notify.error("Couldn't update report.");
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
            await communityAPI.deleteComment(removeCommentModal.commentId, role);
            await communityAPI.reviewReport(removeCommentModal.reportId, 'reviewed', role);
            notify.success('Comment removed.');
            closeRemoveCommentModal();
            await loadData();
        } catch {
            notify.error("Couldn't remove comment.");
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
            await communityAPI.deletePost(removeModal.postId, role);
            notify.success('Post removed.');
            closeRemoveModal();
            await loadData();
        } catch {
            notify.error("Couldn't remove post.");
        }
    };

    const getStatusBadgeClass = (status) => {
        if (status === 'approved') return 'bg-green-50 text-green-700 border border-green-200';
        if (status === 'declined') return 'bg-red-50 text-red-700 border border-red-200';
        return 'bg-amber-50 text-amber-700 border border-amber-200';
    };

    const normalizedSearch = searchQuery.trim().toLowerCase();
    const matchesSearch = (...values) => !normalizedSearch || values.some((value) => String(value || '').toLowerCase().includes(normalizedSearch));
    const visiblePendingPosts = pendingPosts.filter((post) => matchesSearch(post.content, post.author?.firstName, post.author?.lastName, post.author?.username, post.userId));
    const visibleAllPosts = allPosts.filter((post) => matchesSearch(post.content, post.status, post.author?.firstName, post.author?.lastName, post.author?.username, post.userId));
    const visibleReports = reportedComments.filter((report) => matchesSearch(
        report.reason,
        report.commentText || report.comment_text,
        report.reporter?.username || report.reporter_username,
        report.commentAuthor?.username || report.comment_username
    ));
    const tabs = [
        { id: 'pending', label: 'Pending posts', count: pendingPosts.length, icon: FileText },
        { id: 'reports', label: 'Reported comments', count: reportedComments.length, icon: Flag },
        { id: 'library', label: 'Post library', count: allPosts.length, icon: Library }
    ];
    const activeMeta = tabs.find((tab) => tab.id === activeTab);
    const visibleCount = activeTab === 'pending' ? visiblePendingPosts.length : activeTab === 'reports' ? visibleReports.length : visibleAllPosts.length;

    return (
        <div className="space-y-5">
            <header className="overflow-hidden rounded-2xl border border-green-400 bg-gradient-to-r from-green-300 via-green-400 to-green-500 p-5 text-gray-900 shadow-sm sm:p-7">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-green-950">{role === 'admin' ? 'Admin tools' : 'Staff tools'}</p>
                <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div><h1 className="text-2xl font-bold sm:text-3xl">Community Moderation</h1><p className="mt-1 max-w-xl text-sm text-green-950/80">Review submissions, resolve reports, and manage published community content.</p></div>
                    <div className="flex gap-2 text-xs font-bold"><span className="rounded-full bg-white/30 px-3 py-2 ring-1 ring-green-900/15">{pendingPosts.length} awaiting review</span><span className="rounded-full bg-red-100/70 px-3 py-2 text-red-900 ring-1 ring-red-700/20">{reportedComments.length} reports</span></div>
                </div>
            </header>

            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 p-3 sm:p-4">
                    <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Moderation queues">
                        {tabs.map((tab) => { const Icon = tab.icon; return <button key={tab.id} type="button" role="tab" aria-selected={activeTab === tab.id} onClick={() => { setActiveTab(tab.id); setSearchQuery(''); }} className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${activeTab === tab.id ? 'bg-emerald-900 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}><Icon className="h-4 w-4" /><span>{tab.label}</span><span className={`rounded-full px-2 py-0.5 text-[11px] ${activeTab === tab.id ? 'bg-white/15' : 'bg-gray-100'}`}>{tab.count}</span></button>; })}
                    </div>
                </div>
                <div className="flex flex-col gap-3 border-b border-gray-100 bg-gray-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div><h2 className="font-bold text-gray-900">{activeMeta.label}</h2><p className="text-xs text-gray-500">{activeTab === 'pending' ? 'Posts waiting for a moderation decision' : activeTab === 'reports' ? 'Resolve reports or remove harmful comments' : 'Browse the complete community publishing history'}</p></div>
                    <label className="relative block w-full sm:w-72"><span className="sr-only">Search {activeMeta.label}</span><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder={`Search ${activeMeta.label.toLowerCase()}...`} className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-9 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />{searchQuery && <button type="button" aria-label="Clear search" onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"><X className="h-4 w-4" /></button>}</label>
                </div>
                <div className="p-3 sm:p-4">
                    {loading && <div className="py-12 text-center text-sm text-gray-500">Loading moderation queue...</div>}
                    {!loading && <div className="grid gap-3 xl:grid-cols-2">
                        {activeTab === 'pending' && visiblePendingPosts.map((post) => <article key={post.id} className="flex flex-col rounded-xl border border-amber-200 bg-amber-50/40 p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-bold text-gray-900">{post.author?.firstName} {post.author?.lastName}</p><p className="truncate text-xs text-gray-500">@{post.author?.username} · User #{post.userId}</p></div><time className="shrink-0 text-[11px] text-gray-500">{formatSafeDate(post.createdAt, { dateStyle: 'medium' })}</time></div><p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-gray-700">{post.content}</p>{post.imageUrl && <p className="mt-2 text-xs font-semibold text-emerald-700">Image attached</p>}<div className="mt-auto flex flex-wrap gap-2 pt-4"><button onClick={() => setSelectedPost(post)} className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50">Details <ChevronRight className="h-3.5 w-3.5" /></button><button onClick={() => openModerationModal(post.id, 'approved')} className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-800"><Check className="h-3.5 w-3.5" /> Accept</button><button onClick={() => openModerationModal(post.id, 'declined')} className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-red-700 px-3 py-2 text-xs font-bold text-white hover:bg-red-800"><X className="h-3.5 w-3.5" /> Decline</button></div></article>)}
                        {activeTab === 'library' && visibleAllPosts.map((post) => <article key={post.id} className="flex flex-col rounded-xl border border-gray-200 p-4 transition hover:border-emerald-200 hover:shadow-sm"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-bold text-gray-900">{post.author?.firstName} {post.author?.lastName}</p><p className="truncate text-xs text-gray-500">@{post.author?.username} · {formatSafeDate(post.createdAt, { dateStyle: 'medium' })}</p></div><span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${getStatusBadgeClass(post.status)}`}>{post.status}</span></div><p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-gray-700">{post.content}</p><div className="mt-auto flex gap-2 pt-4"><button onClick={() => setSelectedPost(post)} className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50">Details <ChevronRight className="h-3.5 w-3.5" /></button><button onClick={() => openRemoveModal(post.id)} className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100"><Trash2 className="h-3.5 w-3.5" /> Remove</button></div></article>)}
                        {activeTab === 'reports' && visibleReports.map((report) => <article key={report.reportId || report.report_id} className="flex flex-col rounded-xl border border-red-200 bg-red-50/30 p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-red-700">{report.reason || 'Reported comment'}</p><p className="mt-1 text-xs text-gray-500">Comment by @{report.commentAuthor?.username || report.comment_username}</p></div><Flag className="h-4 w-4 shrink-0 text-red-500" /></div><blockquote className="mt-3 border-l-2 border-red-300 pl-3 text-sm leading-6 text-gray-800">{report.commentText || report.comment_text}</blockquote><p className="mt-3 text-[11px] text-gray-500">Reported by {report.reporter?.firstName || report.reporter_first_name} {report.reporter?.lastName || report.reporter_last_name} (@{report.reporter?.username || report.reporter_username})</p><div className="mt-auto grid grid-cols-1 gap-2 pt-4 sm:grid-cols-3"><button onClick={() => openReportActionModal(report.reportId || report.report_id, 'reviewed')} className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-800">Mark reviewed</button><button onClick={() => openReportActionModal(report.reportId || report.report_id, 'dismissed')} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50">Dismiss</button><button onClick={() => openRemoveCommentModal(report.reportId || report.report_id, report.commentId || report.comment_id)} className="rounded-lg bg-red-700 px-3 py-2 text-xs font-bold text-white hover:bg-red-800">Remove comment</button></div></article>)}
                    </div>}
                    {!loading && visibleCount === 0 && <div className="py-14 text-center"><div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-gray-100"><Search className="h-5 w-5 text-gray-400" /></div><p className="mt-3 text-sm font-semibold text-gray-700">{searchQuery ? 'No matching results' : `No ${activeMeta.label.toLowerCase()}`}</p><p className="mt-1 text-xs text-gray-500">{searchQuery ? 'Try a different name, username, or keyword.' : 'This queue is currently clear.'}</p></div>}
                </div>
            </section>

            {selectedPost && (
                <div className="fixed inset-0 z-[210] flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="post-detail-title">
                    <button type="button" aria-label="Close post details" className="absolute inset-0 bg-gray-950/65 backdrop-blur-sm" onClick={() => setSelectedPost(null)} />
                    <article className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/20 bg-white shadow-2xl">
                        <header className="flex items-start justify-between gap-4 border-b border-gray-200 bg-emerald-950 px-5 py-4 text-white sm:px-6"><div><p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-300">Post review</p><h2 id="post-detail-title" className="mt-1 text-xl font-bold">Submitted content</h2></div><button type="button" onClick={() => setSelectedPost(null)} className="rounded-full p-2 text-emerald-100 hover:bg-white/10 hover:text-white" aria-label="Close"><X className="h-5 w-5" /></button></header>
                        <div className="overflow-y-auto"><div className="grid border-b border-gray-200 bg-gray-50 sm:grid-cols-2"><div className="px-5 py-3 sm:px-6"><p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Submitted by</p><p className="mt-1 text-sm font-semibold text-gray-900">{selectedPost.author?.firstName} {selectedPost.author?.lastName} <span className="font-normal text-gray-500">@{selectedPost.author?.username}</span></p></div><div className="border-t border-gray-200 px-5 py-3 sm:border-l sm:border-t-0 sm:px-6"><p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Submission time</p><p className="mt-1 text-sm font-semibold text-gray-900">{formatSafeDate(selectedPost.createdAt, { dateStyle: 'medium', timeStyle: 'short' })}</p></div></div><div className="space-y-6 p-5 sm:p-6"><section aria-labelledby="post-content-label"><h3 id="post-content-label" className="text-xs font-bold uppercase tracking-wider text-emerald-800">Post content</h3><p className="mt-3 whitespace-pre-wrap text-[15px] leading-7 text-gray-800">{selectedPost.content}</p></section>{selectedPost.imageUrl && <figure><figcaption className="mb-3 text-xs font-bold uppercase tracking-wider text-emerald-800">Attached image</figcaption><div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-100"><img src={selectedPost.imageUrl} alt="Image attached to the submitted post" className="max-h-[460px] w-full object-contain" /></div></figure>}</div></div>
                    </article>
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
                onConfirm={confirmModeration}
                onClose={closeModerationModal}
            />

            <ConfirmationModal
                isOpen={removeModal.isOpen}
                title="Remove This Post?"
                message="This will permanently remove the post from the community feed. This action cannot be undone."
                confirmLabel="Remove Post"
                danger
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
                onConfirm={confirmReportAction}
                onClose={closeReportActionModal}
            />

            <ConfirmationModal
                isOpen={removeCommentModal.isOpen}
                title="Remove This Reported Comment?"
                message="Use this when the comment violates policy. This action permanently deletes the comment."
                confirmLabel="Remove Comment"
                danger
                onConfirm={removeReportedComment}
                onClose={closeRemoveCommentModal}
            />
        </div>
    );
};

export default AdminCommunityModeration;
