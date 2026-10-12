import { useEffect, useRef, useState } from 'react';
import { communityAPI, getProfileImageUrl } from '../../../services/api-client';
import { notify } from '../../../utils/toast';
import PostReportModal from './PostReportModal';

const PostFeed = ({ posts, currentUser, onRefresh, onUpdatePost, onEditPost, onPostClick, onCommentClick, onConfirmDelete }) => {

    const [openMenuId, setOpenMenuId] = useState(null);
    const [reportTarget, setReportTarget] = useState(null);
    const [reportLoading, setReportLoading] = useState(false);
    // One node per post, not a single ref: a shared ref only ever holds the last card's
    // wrapper, so the outside-click guard misfired on every other card and unmounted the
    // dropdown on mousedown before the click could reach the menu item.
    const menuRefs = useRef({});

    useEffect(() => {
        if (openMenuId === null) return undefined;

        const handlePointerDown = (event) => {
            const insideMenu = Object.values(menuRefs.current)
                .some((node) => node && node.contains(event.target));
            if (!insideMenu) setOpenMenuId(null);
        };
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') setOpenMenuId(null);
        };

        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [openMenuId]);

    const submitReport = async (reason, detail) => {
        if (!reportTarget) return;
        try {
            setReportLoading(true);
            await communityAPI.reportPost(reportTarget.id, reason, detail, currentUser?.role || 'user');
            setReportTarget(null);
            setOpenMenuId(null);
            notify.success("Thanks for reporting. We'll review this post.");
        } catch {
            notify.error("Couldn't submit your report.");
        } finally {
            setReportLoading(false);
        }
    };

    const togglePostLike = async (postId, e) => {
        e.stopPropagation();
        try {
            const result = await communityAPI.togglePostLike(postId, currentUser?.role || 'user');
            onUpdatePost?.(postId, { likedByViewer: result.liked, likeCount: result.likeCount });
            notify.success(result.liked ? 'Post liked.' : 'Like removed.');
        } catch {
            notify.error("Couldn't update like.");
        }
    };

    const deletePost = async (postId, e) => {
        e.stopPropagation();
        if (onConfirmDelete) {
            const confirmed = await onConfirmDelete(postId);
            if (!confirmed) return;
        }
        try {
            await communityAPI.deletePost(postId, currentUser?.role || 'user');
            notify.success('Post removed.');
            onRefresh();
        } catch {
            notify.error("Couldn't remove post.");
        }
    };

    const handleEditClick = (post, e) => {
        e.stopPropagation();
        onEditPost(post);
    };

    const sharePost = async (post, e) => {
        e.stopPropagation();
        const url = `${window.location.origin}/community#post-${post.id}`;

        try {
            if (navigator.share) {
                await navigator.share({ title: 'Zoo Community', text: post.content, url });
                notify.success('Post shared.');
                return;
            }
            if (!navigator.clipboard) throw new Error('Clipboard is unavailable.');
            await navigator.clipboard.writeText(url);
            notify.success('Post link copied.');
        } catch (error) {
            if (error.name !== 'AbortError') notify.error(error.message || "Couldn't share post.");
        }
    };

    return (
        <div className="flex flex-col gap-6 md:gap-8">
            {posts.map((post) => {
                const isOwner = post.isOwner === true;

                return (
                    <article
                        key={post.id}
                        className="min-w-0 bg-white border border-[#212631]/10 rounded-3xl overflow-hidden cursor-pointer group flex flex-col shadow-sm hover:shadow-md hover:border-[#212631]/20 transition-all"
                        onClick={() => onPostClick && onPostClick(post)}
                    >
                        <div className="flex items-start justify-between gap-3 p-4 sm:p-5 md:p-6 border-b border-[#212631]/15">
                            <div
                                className="flex items-center gap-4 cursor-pointer"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <img
                                    src={getProfileImageUrl(post.author.profileImage) || 'https://via.placeholder.com/56x56?text=U'}
                                    alt="author"
                                    className="w-10 h-10 rounded-full object-cover border border-[#212631]/20 transition-all duration-300"
                                />
                                <div className="flex flex-col">
                                    <p className="text-sm font-black uppercase text-[#212631] tracking-tight hover:underline">
                                        {post.author.firstName} {post.author.lastName}
                                    </p>
                                    <p className="text-[9px] tracking-[0.18em] uppercase font-bold text-[#212631]/65">
                                        {new Date(post.createdAt).toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            {!isOwner && (
                                <div
                                    ref={(node) => {
                                        if (node) menuRefs.current[post.id] = node;
                                        else delete menuRefs.current[post.id];
                                    }}
                                    className="relative shrink-0"
                                >
                                    <button
                                        type="button"
                                        aria-haspopup="menu"
                                        aria-expanded={openMenuId === post.id}
                                        aria-label="Post options"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenMenuId(openMenuId === post.id ? null : post.id);
                                        }}
                                        className="flex h-8 w-8 items-center justify-center rounded-full text-[#212631]/55 transition-colors hover:bg-[#212631]/5 hover:text-[#212631]"
                                    >
                                        <span aria-hidden="true" className="text-lg leading-none">&#8942;</span>
                                    </button>

                                    {openMenuId === post.id && (
                                        <div
                                            role="menu"
                                            onClick={(e) => e.stopPropagation()}
                                            className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-xl border border-[#212631]/15 bg-white py-1 shadow-lg"
                                        >
                                            <button
                                                type="button"
                                                role="menuitem"
                                                onClick={() => {
                                                    setOpenMenuId(null);
                                                    setReportTarget(post);
                                                }}
                                                className="block w-full px-4 py-2 text-left text-xs font-bold uppercase tracking-[0.12em] text-red-700 transition-colors hover:bg-red-50"
                                            >
                                                Report post
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                        </div>

                        <div className="p-5 md:p-6">
                            <p className="text-lg md:text-xl text-[#212631] font-medium leading-relaxed whitespace-pre-wrap tracking-tight">
                                {post.content}
                            </p>
                        </div>

                        {post.imageUrl && (
                            <div className="border-t border-b border-[#212631]/15 bg-[#212631]/5 flex items-center justify-center overflow-hidden">
                                <img src={post.imageUrl} alt="post" className="w-full h-auto max-h-[600px] object-cover" />
                            </div>
                        )}

                         <div className="flex flex-wrap items-center justify-between gap-2 p-3 sm:p-4 md:p-5 bg-[#ebebeb] border-t border-[#212631]/15 mt-auto">
                             <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                                <button
                                    className="flex min-h-14 min-w-14 items-center gap-2 rounded-full px-3 text-base font-semibold text-[#212631]/70 hover:bg-[#212631]/5 hover:text-[#212631] transition-colors"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (onCommentClick) onCommentClick(post);
                                    }}
                                >
                                     <svg className="h-7 w-7 sm:h-8 sm:w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                                    </svg>
                                         {post.commentCount || 0}
                                </button>

                                <button
                                    onClick={(e) => togglePostLike(post.id, e)}
                                    className={`flex min-h-14 min-w-14 items-center gap-2 rounded-full px-3 text-base font-semibold transition-colors ${post.likedByViewer ? 'text-red-600' : 'text-[#212631]/70 hover:bg-red-50 hover:text-red-600'}`}
                                >
                                     <svg className={`h-7 w-7 sm:h-8 sm:w-8 ${post.likedByViewer ? 'fill-red-600' : 'fill-none'}`} stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                                    </svg>
                                     {post.likeCount || 0}
                                 </button>
                                  <button onClick={(e) => sharePost(post, e)} className="flex min-h-14 min-w-14 items-center justify-center rounded-full text-base font-semibold text-[#212631]/70 hover:bg-[#212631]/5 hover:text-[#212631]" aria-label="Share post">
                                     <svg className="h-7 w-7 sm:h-8 sm:w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M7 17 17 7m0 0H9m8 0v8" /></svg>
                                 </button>
                            </div>

                            {isOwner && (
                                <div className="flex gap-4">
                                    <button
                                        onClick={(e) => handleEditClick(post, e)}
                                        className="text-[9px] tracking-[0.18em] uppercase font-black text-[#212631]/70 hover:text-[#212631] transition-colors"
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
                <div className="border border-[#212631]/10 rounded-3xl p-10 sm:p-16 flex flex-col items-center justify-center text-center bg-white">
                    <p className="text-2xl font-black uppercase tracking-tighter text-[#212631]/60 mb-2">No Posts Yet</p>
                    <p className="text-[10px] tracking-[0.18em] uppercase font-bold text-[#212631]/75">Be the first to share something.</p>
                </div>
            )}

            <PostReportModal
                isOpen={Boolean(reportTarget)}
                onClose={() => setReportTarget(null)}
                onSubmit={submitReport}
                loading={reportLoading}
            />
        </div>
    );
};

export default PostFeed;
