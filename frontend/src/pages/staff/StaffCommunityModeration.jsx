import { useEffect, useState } from 'react';
import { communityAPI } from '../../services/api-client';
import { notify } from '../../utils/toast';

const StaffCommunityModeration = () => {
    const [pendingPosts, setPendingPosts] = useState([]);
    const [reportedComments, setReportedComments] = useState([]);
    const [loading, setLoading] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            const [postsRes, reportsRes] = await Promise.all([
                communityAPI.getPendingPosts('staff'),
                communityAPI.getReportedComments('staff')
            ]);
            setPendingPosts(postsRes.posts || []);
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

    const reviewPost = async (postId, action) => {
        try {
            await communityAPI.reviewPost(postId, action, '', 'staff');
            notify.success(action === 'approved' ? 'Post approved.' : 'Post declined.');
            await loadData();
        } catch {
            notify.error('Could not update this post right now.');
        }
    };

    const reviewReport = async (reportId, action) => {
        try {
            await communityAPI.reviewReport(reportId, action, 'staff');
            notify.success('Comment report updated.');
            await loadData();
        } catch {
            notify.error('Could not update this report right now.');
        }
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
                            <p className="text-sm text-white whitespace-pre-wrap">{post.content}</p>
                            {post.imageUrl && <img src={post.imageUrl} alt="post" className="mt-3 w-full max-h-80 object-cover rounded-lg" />}
                            <div className="mt-3 flex gap-2">
                                <button onClick={() => reviewPost(post.id, 'approved')} className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold">Accept</button>
                                <button onClick={() => reviewPost(post.id, 'declined')} className="px-3 py-2 rounded-lg bg-red-600 text-white text-xs font-semibold">Decline</button>
                            </div>
                        </article>
                    ))}
                    {!pendingPosts.length && <p className="text-sm text-gray-400">No pending posts.</p>}
                </div>
            </section>

            <section className="bg-[#141414] rounded-2xl border border-emerald-900/40 p-5">
                <h2 className="text-lg font-bold text-white mb-4">Reported Comments ({reportedComments.length})</h2>
                <div className="space-y-4">
                    {reportedComments.map((report) => (
                        <article key={report.report_id} className="rounded-xl border border-amber-700/40 p-4 bg-black/20">
                            <p className="text-xs text-amber-300">Reason: {report.reason}</p>
                            <p className="text-sm text-white mt-2">{report.comment_text}</p>
                            <div className="mt-3 flex gap-2">
                                <button onClick={() => reviewReport(report.report_id, 'reviewed')} className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold">Mark reviewed</button>
                                <button onClick={() => reviewReport(report.report_id, 'dismissed')} className="px-3 py-2 rounded-lg bg-gray-600 text-white text-xs font-semibold">Dismiss</button>
                            </div>
                        </article>
                    ))}
                    {!reportedComments.length && <p className="text-sm text-gray-400">No reported comments.</p>}
                </div>
            </section>
        </div>
    );
};

export default StaffCommunityModeration;
