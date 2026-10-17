import { useEffect, useRef, useState } from 'react';
import { communityAPI, getProfileImageUrl } from '../../../services/api-client';
import { notify } from '../../../utils/toast';
import PostReportModal from './PostReportModal';

// Two taps closer together than this count as a double-tap. Long enough to be forgiving of a
// shaky thumb, short enough that a deliberate second tap does not feel laggy.
const DOUBLE_TAP_MS = 240;

// Instagram-style gallery: swipe / arrows move between photos, dots show position.
// A single photo renders as a plain image with no controls.
const PostCarousel = ({ postId, images }) => {
    const [index, setIndex] = useState(0);
    const touchStartX = useRef(null);

    useEffect(() => {
        setIndex(0);
    }, [postId, images.length]);

    if (images.length === 1) {
        return (
            <div className="bg-black/[0.03] flex items-center justify-center overflow-hidden">
                <img src={images[0]} alt="Post photo" className="w-full h-auto max-h-[600px] object-cover" />
            </div>
        );
    }

    const go = (delta) => setIndex((current) => (current + delta + images.length) % images.length);

    return (
        <div
            className="relative bg-black/[0.03] overflow-hidden select-none"
            onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
            onTouchEnd={(e) => {
                if (touchStartX.current === null) return;
                const delta = e.changedTouches[0].clientX - touchStartX.current;
                if (Math.abs(delta) > 40) go(delta < 0 ? 1 : -1);
                touchStartX.current = null;
            }}
        >
            <div
                className="flex transition-transform duration-300 ease-out"
                style={{ transform: `translateX(-${index * 100}%)` }}
            >
                {images.map((src, i) => (
                    <img
                        key={`${src}-${i}`}
                        src={src}
                        alt={`Post photo ${i + 1} of ${images.length}`}
                        className="w-full shrink-0 h-auto max-h-[600px] object-cover"
                        draggable={false}
                    />
                ))}
            </div>

            <button
                type="button"
                onClick={(e) => { e.stopPropagation(); go(-1); }}
                aria-label="Previous photo"
                className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
            >
                <span aria-hidden="true">&#8249;</span>
            </button>
            <button
                type="button"
                onClick={(e) => { e.stopPropagation(); go(1); }}
                aria-label="Next photo"
                className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
            >
                <span aria-hidden="true">&#8250;</span>
            </button>

            <div className="pointer-events-none absolute inset-x-0 bottom-3 flex items-center justify-center gap-1.5">
                {images.map((_, i) => (
                    <span
                        key={i}
                        aria-current={i === index}
                        className={`rounded-full transition-all ${i === index ? 'h-2 w-2 bg-white' : 'h-1.5 w-1.5 bg-white/60'}`}
                    />
                ))}
            </div>

            <span className="absolute right-3 top-3 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-bold text-white">
                {index + 1}/{images.length}
            </span>
        </div>
    );
};

const PostFeed = ({ posts, currentUser, isGuest = false, onRequireAuth, onRefresh, onUpdatePost, onEditPost, onPostClick, onCommentClick, onConfirmDelete }) => {

    const [openMenuId, setOpenMenuId] = useState(null);
    const [reportTarget, setReportTarget] = useState(null);
    const [reportLoading, setReportLoading] = useState(false);
    // Post id whose heart burst is currently playing, or null.
    const [burstId, setBurstId] = useState(null);
    // Double-tap state. The first tap is held here rather than acted on immediately, so a single
    // tap still opens the post while a second tap inside the window turns the pair into a heart.
    const lastTapRef = useRef({ id: null, at: 0 });
    const tapTimerRef = useRef(null);
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
        if (isGuest && onRequireAuth?.()) {
            setReportTarget(null);
            return;
        }
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
        if (isGuest && onRequireAuth?.()) return;
        try {
            const result = await communityAPI.togglePostLike(postId, currentUser?.role || 'user');
            onUpdatePost?.(postId, { likedByViewer: result.liked, likeCount: result.likeCount });
        } catch {
            notify.error("Couldn't update like.");
        }
    };

    // Double-tap always hearts, never un-hearts. Toggling would mean a second double-tap on an
    // already-liked post silently removed the like, which is not what a double-tap means.
    const heartPost = async (post) => {
        if (isGuest && onRequireAuth?.()) return;

        setBurstId(post.id);
        window.setTimeout(() => setBurstId((current) => (current === post.id ? null : current)), 900);

        if (post.likedByViewer) return;

        try {
            const result = await communityAPI.togglePostLike(post.id, currentUser?.role || 'user');
            onUpdatePost?.(post.id, { likedByViewer: result.liked, likeCount: result.likeCount });
        } catch {
            notify.error("Couldn't update like.");
        }
    };

    // A tap opens the post, unless a second tap lands inside DOUBLE_TAP_MS — then the pair is a
    // double-tap and the pending open is cancelled in favour of the heart. Handling both in the
    // click (rather than onClick + onDoubleClick) means the second tap acts the moment it
    // arrives, and a pending timer can still be cancelled.
    const handleCardTap = (post, e) => {
        // Buttons, the overflow menu, and the attach label own their own clicks.
        if (e.target.closest('button, a, label, input')) return;

        const now = Date.now();
        const tap = lastTapRef.current;

        if (tap.id === post.id && now - tap.at < DOUBLE_TAP_MS) {
            window.clearTimeout(tapTimerRef.current);
            lastTapRef.current = { id: null, at: 0 };
            heartPost(post);
            return;
        }

        lastTapRef.current = { id: post.id, at: now };
        tapTimerRef.current = window.setTimeout(() => onPostClick?.(post), DOUBLE_TAP_MS);
    };

    // A pending open must not fire into a post that has since been deleted or re-rendered.
    useEffect(() => () => window.clearTimeout(tapTimerRef.current), []);

    const deletePost = async (postId, e) => {
        e.stopPropagation();
        // The removal itself is handed to the confirmation dialog, which awaits it while showing
        // its busy state. Doing the request here instead would mean the dialog closed before the
        // post was actually gone, leaving a card on screen that no longer exists.
        const remove = async () => {
            await communityAPI.deletePost(postId, currentUser?.role || 'user');
            notify.success('Post removed.');
            onRefresh();
        };

        if (onConfirmDelete) {
            const confirmed = await onConfirmDelete(remove);
            if (!confirmed) return;
            return;
        }

        try {
            await remove();
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
        if (isGuest && onRequireAuth?.()) return;
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
                const images = Array.isArray(post.images) && post.images.length
                    ? post.images
                    : (post.imageUrl ? [post.imageUrl] : []);

                return (
                    <article
                        key={post.id}
                        className="min-w-0 bg-white overflow-hidden cursor-pointer group flex flex-col relative rounded-md border border-gray-600"
                        onClick={(e) => handleCardTap(post, e)}
                    >
                        {/* Heart burst sits above the card content and is purely decorative:
                            pointer-events-none keeps it from swallowing the taps that triggered it. */}
                        {burstId === post.id && (
                            <span
                                aria-hidden="true"
                                className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
                            >
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="#ef4444"
                                    className="h-24 w-24 animate-[heart-burst_900ms_ease-out_forwards] drop-shadow-lg"
                                >
                                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                </svg>
                            </span>
                        )}
                        <div className="flex items-start justify-between gap-3 px-4 py-4 sm:px-5 sm:py-5">
                            <div
                                className="flex items-center gap-4 cursor-pointer"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <img
                                    src={getProfileImageUrl(post.author.profileImage) || 'https://via.placeholder.com/56x56?text=U'}
                                    alt="author"
                                    className="w-10 h-10 rounded-full object-cover"
                                />
                                <div className="flex flex-col">
                                    <p className="text-sm font-black uppercase text-black tracking-tight">
                                        {post.author.firstName} {post.author.lastName}
                                    </p>
                                    <p className="text-[9px] tracking-[0.18em] uppercase font-bold text-black/60">
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
                                            className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-md border border-gray-600 bg-white py-1 shadow-lg"
                                        >
                                            <button
                                                type="button"
                                                role="menuitem"
                                                onClick={() => {
                                                    setOpenMenuId(null);
                                                    setReportTarget(post);
                                                }}
                                                className="block w-full px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.12em] text-red-700 transition-colors hover:bg-red-50"
                                            >
                                                Report post
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                        </div>

                        <div className="px-4 py-2 sm:px-5 sm:py-3">
                            <p className="text-lg md:text-xl text-black font-medium leading-relaxed whitespace-pre-wrap tracking-tight">
                                {post.content}
                            </p>
                        </div>

                        {images.length > 0 && (
                            <PostCarousel postId={post.id} images={images} />
                        )}

                         <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-5 mt-auto">
                             <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                                <button
                                    disabled={!onCommentClick}
                                    title={onCommentClick ? 'View comments' : 'Comments unavailable here'}
                                    className="flex min-h-11 min-w-11 items-center gap-2 px-3 text-base font-semibold text-black/70 hover:bg-black/5 hover:text-black transition-colors disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent"
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
                                    className={`flex min-h-11 min-w-11 items-center gap-2 px-3 text-base font-semibold transition-colors ${post.likedByViewer ? 'text-red-600' : 'text-black/70 hover:bg-red-50 hover:text-red-600'}`}
                                >
                                     <svg className={`h-7 w-7 sm:h-8 sm:w-8 ${post.likedByViewer ? 'fill-red-600' : 'fill-none'}`} stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                                    </svg>
                                     {post.likeCount || 0}
                                 </button>
                                  <button onClick={(e) => sharePost(post, e)} className="flex min-h-11 min-w-11 items-center justify-center text-base font-semibold text-black/70 hover:bg-black/5 hover:text-black" aria-label="Share post">
                                     <svg className="h-7 w-7 sm:h-8 sm:w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M7 17 17 7m0 0H9m8 0v8" /></svg>
                                 </button>
                            </div>

                            {isOwner && (
                                <div className="flex gap-4">
                                    <button
                                        onClick={(e) => handleEditClick(post, e)}
                                        className="text-[9px] tracking-[0.18em] uppercase font-black text-black/70 hover:text-black transition-colors"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={(e) => deletePost(post.id, e)}
                                        className="text-[9px] tracking-[0.18em] uppercase font-black text-red-600 hover:text-red-700 transition-colors"
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
                <div className="rounded-md border border-gray-600 p-10 sm:p-16 flex flex-col items-center justify-center text-center bg-white">
                    <p className="text-2xl font-black uppercase tracking-tighter text-black/60 mb-2">No Posts Yet</p>
                    <p className="text-[10px] tracking-[0.18em] uppercase font-bold text-black/60">Be the first to share something.</p>
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
