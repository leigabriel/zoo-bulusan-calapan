import { useEffect, useRef, useState } from 'react';
import { ReactLenis } from 'lenis/react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import Header from '../../components/Header';
import PostForm from '../../components/features/community/PostForm';
import PostFeed from '../../components/features/community/PostFeed';
import CommentSection from '../../components/features/community/CommentSection';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import { communityAPI, getProfileImageUrl } from '../../services/api-client';
import { useAuth } from '../../context/AuthContext';
import { notify } from '../../utils/toast';
import Footer from '../../components/Footer';

const CommunityPage = () => {
    const { user } = useAuth();
    const [posts, setPosts] = useState([]);
    const [loadingPosts, setLoadingPosts] = useState(false);
    const [savingPost, setSavingPost] = useState(false);
    const [editingPost, setEditingPost] = useState(null);
    const [postModalOpen, setPostModalOpen] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);
    const [commentOnly, setCommentOnly] = useState(false);
    const communityTitleRef = useRef(null);
    const communityLetterRefs = useRef([]);

    const animateCommunityTitle = (isHovering) => {
        const letters = communityLetterRefs.current.filter(Boolean);
        if (!letters.length) return;

        letters.forEach((letter, index) => {
            if (isHovering) {
                gsap.to(letter, {
                    y: index % 2 === 0 ? -12 - index : 10 + index,
                    rotate: index % 2 === 0 ? -5 - index : 4 + index,
                    scale: index % 3 === 0 ? 1.14 : 1.04,
                    color: index % 2 === 0 ? '#526f3c' : '#789c2b',
                    duration: 0.45 + index * 0.035,
                    delay: index * 0.035,
                    ease: 'power3.out',
                    overwrite: 'auto'
                });
            } else {
                gsap.to(letter, {
                    y: 0,
                    rotate: 0,
                    scale: 1,
                    color: '#000000',
                    duration: 0.65,
                    delay: index * 0.025,
                    ease: 'elastic.out(1, 0.45)',
                    overwrite: 'auto'
                });
            }
        });
    };
    const [confirmState, setConfirmState] = useState({
        isOpen: false,
        title: '',
        message: '',
        confirmLabel: 'Confirm',
        cancelLabel: 'Cancel',
        danger: false
    });

    const openConfirmation = ({
        title,
        message,
        confirmLabel = 'Confirm',
        cancelLabel = 'Cancel',
        danger = false
    }) => new Promise((resolve) => {
        setConfirmState({
            isOpen: true,
            title,
            message,
            confirmLabel,
            cancelLabel,
            danger,
            resolve
        });
    });

    const closeConfirmation = (confirmed) => {
        if (typeof confirmState.resolve === 'function') {
            confirmState.resolve(Boolean(confirmed));
        }
        setConfirmState({
            isOpen: false,
            title: '',
            message: '',
            confirmLabel: 'Confirm',
            cancelLabel: 'Cancel',
            danger: false
        });
    };

    const loadPosts = async () => {
        setLoadingPosts(true);
        try {
            const response = await communityAPI.getPosts(user?.role || 'user');
            setPosts(response.posts || []);
        } catch {
            notify.error("Couldn't load posts.");
        } finally {
            setLoadingPosts(false);
        }
    };

    useEffect(() => {
        loadPosts();
    }, []);

    const confirmPostSubmit = async ({ action }) => {
        const isUpdate = action === 'update';
        return openConfirmation({
            title: isUpdate ? 'Update This Post?' : 'Publish This Post?',
            message: isUpdate
                ? 'Your post update will be submitted and returned to moderation review.'
                : 'Your post will be submitted for moderation before it becomes visible to others.',
            confirmLabel: isUpdate ? 'Update Post' : 'Publish Post'
        });
    };

    const confirmPostDelete = async () => {
        return openConfirmation({
            title: 'Delete This Post?',
            message: 'This action cannot be undone.',
            confirmLabel: 'Delete Post',
            danger: true
        });
    };

    const confirmCommentAction = async ({ title, message, confirmLabel, danger = false }) => {
        return openConfirmation({ title, message, confirmLabel, danger });
    };

    const createOrUpdatePost = async ({ content, imageFile, removeImage }) => {
        setSavingPost(true);
        try {
            if (editingPost) {
                await communityAPI.updatePost(
                    editingPost.id,
                    { content, imageFile, removeImage },
                    user?.role || 'user'
                );
                notify.success('Post updated.');
                setEditingPost(null);
            } else {
                await communityAPI.createPost({ content, imageFile }, user?.role || 'user');
                notify.success('Post submitted.');
            }
            await loadPosts();
        } catch {
            notify.error('Please Try Again');
            return false;
        } finally {
            setSavingPost(false);
        }
    };

    return (
        <ReactLenis root>
            <div className="bg-[#f6f7f4] text-[#212631] relative min-h-screen">
                <Header />

                {/* Intro Section - Clean Style */}
                <div className="w-full min-h-[42vh] md:min-h-[54vh] flex flex-col items-center justify-center px-4 pt-20">
                    <p className="mb-5 rounded-full bg-[#c6fe69] px-4 py-2 text-xs font-bold uppercase tracking-[0.3em] text-[#212631]">Share the wild with us</p>
                    <h1
                        ref={communityTitleRef}
                        onMouseEnter={() => animateCommunityTitle(true)}
                        onMouseLeave={() => animateCommunityTitle(false)}
                        className="cursor-pointer text-[4rem] sm:text-[6rem] md:text-[9rem] lg:text-[11rem] leading-none tracking-tight text-black text-center break-words w-full"
                    >
                        {Array.from('Community').map((letter, index) => (
                            <span
                                key={`${letter}-${index}`}
                                ref={(element) => { communityLetterRefs.current[index] = element; }}
                                className="inline-block"
                                aria-hidden="true"
                            >
                                {letter}
                            </span>
                        ))}
                        <span className="sr-only">Community</span>
                    </h1>
                </div>

                {/* Main Feed Section */}
                <main id="community-feed" className="relative z-10 w-full bg-[#eef0ec] border-t border-[#212631]/10">
                    <div className="max-w-[820px] mx-auto min-h-screen">
                         <div className="bg-[#eef0ec] min-h-screen">
                             <div className="p-4 sm:p-6 md:p-8">
                                {loadingPosts ? (
                                    <div className="flex items-center justify-center py-32">
                                        <Motion.div
                                            className="w-5 h-5 rounded-full border-[1.5px] border-[#212631]/25 border-t-[#212631]"
                                            animate={{ rotate: 360 }}
                                            transition={{ repeat: Infinity, duration: 0.85, ease: 'linear' }}
                                        />
                                    </div>
                                ) : (
                                    <PostFeed
                                        posts={posts}
                                        currentUser={user}
                                        onRefresh={loadPosts}
                                         onEditPost={(post) => { setEditingPost(post); setPostModalOpen(true); }}
                                         onUpdatePost={(postId, changes) => setPosts((current) => current.map((post) => post.id === postId ? { ...post, ...changes } : post))}
                                         onPostClick={(post) => { setCommentOnly(false); setSelectedPost(post); }}
                                         onCommentClick={(post) => { setCommentOnly(true); setSelectedPost(post); }}
                                        onConfirmDelete={confirmPostDelete}
                                    />
                                )}
                            </div>
                        </div>

                    </div>
                </main>

                <button
                    type="button"
                    onClick={() => setPostModalOpen(true)}
                    className="group fixed left-3 top-[92px] z-[80] flex h-14 w-14 items-center justify-center rounded-full border border-[#212631]/10 bg-white/95 p-1.5 text-sm font-black text-[#212631] shadow-[0_10px_30px_rgba(33,38,49,0.16)] backdrop-blur-md transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(33,38,49,0.22)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c6fe69] sm:left-6 sm:top-[108px] sm:h-auto sm:w-auto sm:justify-start sm:gap-3 sm:pr-5"
                    aria-label="Create post"
                >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#212631] transition-colors group-hover:bg-[#5c7d16]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M12 2C6.49 2 2 6.49 2 12C2 17.51 6.49 22 12 22C17.51 22 22 17.51 22 12C22 6.49 17.51 2 12 2ZM16 12.75H12.75V16C12.75 16.41 12.41 16.75 12 16.75C11.59 16.75 11.25 16.41 11.25 16V12.75H8C7.59 12.75 7.25 12.41 7.25 12C7.25 11.59 7.59 11.25 8 11.25H11.25V8C11.25 7.59 11.59 7.25 12 7.25C12.41 7.25 12.75 7.59 12.75 8V11.25H16C16.41 11.25 16.75 11.59 16.75 12C16.75 12.41 16.41 12.75 16 12.75Z" fill="#c6fe59" />
                    </svg>
                    </span>
                    <span className="hidden whitespace-nowrap text-[11px] uppercase tracking-[0.16em] sm:inline">Create post</span>
                </button>

                <AnimatePresence>
                    {postModalOpen && (
                        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                            <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !savingPost && setPostModalOpen(false)} />
                            <Motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }} className="relative z-10 max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-xl sm:rounded-3xl sm:p-8">
                                <div className="mb-6 flex items-center justify-between"><h2 className="text-xl font-black">{editingPost ? 'Edit post' : 'Create post'}</h2><button onClick={() => !savingPost && setPostModalOpen(false)} className="rounded-full px-3 py-2 text-sm text-[#212631]/60 hover:bg-black/5">Close</button></div>
                                <PostForm onSubmit={async (data) => { const result = await createOrUpdatePost(data); if (result !== false) setPostModalOpen(false); return result; }} loading={savingPost} initialPost={editingPost} onCancelEdit={() => { setEditingPost(null); setPostModalOpen(false); }} onBeforeSubmit={confirmPostSubmit} />
                            </Motion.div>
                        </div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {selectedPost && (
                        <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 md:p-6">
                             <Motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/60 backdrop-blur-md"
                                onClick={() => setSelectedPost(null)}
                            />
                             <Motion.div
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 12 }}
                                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                                 className="relative z-10 flex flex-col rounded-t-3xl bg-white border border-[#212631]/10 w-full h-full md:h-auto md:max-w-4xl md:max-h-[85vh] overflow-hidden md:rounded-3xl"
                            >
                                <div className="flex items-center justify-between px-5 py-4 border-b border-[#212631]/15 shrink-0 bg-[#ebebeb]">
                                    <span className="text-[10px] tracking-[0.18em] uppercase font-bold text-[#212631]/70">
                                        {commentOnly ? 'Comments' : 'Post Details'}
                                    </span>
                                    <button
                                        onClick={() => setSelectedPost(null)}
                                        className="text-[#212631] opacity-70 hover:opacity-100 transition-opacity cursor-pointer flex items-center gap-2"
                                    >
                                        <span className="text-[10px] tracking-widest uppercase font-bold">Close</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                                            <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="overflow-y-auto flex-1 p-6 md:p-10">
                                    {commentOnly ? (
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#212631]/50">Community discussion</p>
                                            <h2 className="mt-2 mb-8 text-3xl font-black tracking-tight">Comments</h2>
                                            <CommentSection postId={selectedPost.id} currentUser={user} refreshTrigger={0} onRequireConfirmation={confirmCommentAction} />
                                        </div>
                                    ) : (
                                        <>
                                    <div className="flex items-center gap-4 mb-8 group w-max">
                                        <img
                                            src={getProfileImageUrl(selectedPost.author.profileImage) || 'https://via.placeholder.com/64x64?text=U'}
                                            alt="author"
                                             className="w-12 h-12 rounded-full object-cover transition-all border border-[#212631]/20"
                                        />
                                        <div className="flex flex-col">
                                            <span className="font-black uppercase text-[#212631] tracking-tight text-lg group-hover:underline">
                                                {selectedPost.author.firstName} {selectedPost.author.lastName}
                                            </span>
                                            <span className="text-[9px] tracking-[0.18em] uppercase font-bold text-[#212631]/65">
                                                {new Date(selectedPost.createdAt).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>

                                    <p className="text-xl md:text-3xl font-medium leading-[1.3] text-[#212631] whitespace-pre-wrap mb-10 tracking-tight">
                                        {selectedPost.content}
                                    </p>

                                    {selectedPost.imageUrl && (
                                         <div className="w-full overflow-hidden rounded-2xl border border-[#212631]/15 mb-10 bg-[#212631]/5 flex justify-center">
                                            <img src={selectedPost.imageUrl} alt="post" className="max-w-full h-auto max-h-[60vh] object-contain" />
                                        </div>
                                    )}

                                    <div className="pt-10 border-t border-[#212631]/15">
                                        <h3 className="font-black uppercase text-[#212631] tracking-tighter text-2xl mb-8">Discussion</h3>
                                        <CommentSection
                                            postId={selectedPost.id}
                                            currentUser={user}
                                            refreshTrigger={0}
                                            onRequireConfirmation={confirmCommentAction}
                                        />
                                    </div>
                                        </>
                                    )}
                                </div>
                             </Motion.div>
                        </div>
                    )}
                </AnimatePresence>

                <Footer />

                <ConfirmationModal
                    isOpen={confirmState.isOpen}
                    title={confirmState.title}
                    message={confirmState.message}
                    confirmLabel={confirmState.confirmLabel}
                    cancelLabel={confirmState.cancelLabel}
                    danger={confirmState.danger}
                    onConfirm={() => closeConfirmation(true)}
                    onClose={() => closeConfirmation(false)}
                />
            </div>
        </ReactLenis>
    );
};

export default CommunityPage;