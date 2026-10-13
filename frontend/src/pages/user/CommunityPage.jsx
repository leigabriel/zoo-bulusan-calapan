import { useCallback, useEffect, useState } from 'react';
import { PAGE_BG_GRADIENT } from '../../config/page-gradient';
import { ReactLenis } from 'lenis/react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import Header from '../../components/Header';
import PostForm from '../../components/features/community/PostForm';
import PostFeed from '../../components/features/community/PostFeed';
import CommentSection from '../../components/features/community/CommentSection';
import SignInModal from '../../components/features/community/SignInModal';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import { communityAPI, getProfileImageUrl } from '../../services/api-client';
import { useAuth } from '../../context/AuthContext';
import { notify } from '../../utils/toast';
import { Plus, X } from 'reicon-react';
import Footer from '../../components/Footer';
import useScrollLock from '../../hooks/use-scroll-lock';

const CommunityPage = () => {
    const { user } = useAuth();
    const isGuest = !user;
    const [posts, setPosts] = useState([]);
    const [loadingPosts, setLoadingPosts] = useState(false);
    const [savingPost, setSavingPost] = useState(false);
    const [editingPost, setEditingPost] = useState(null);
    const [postModalOpen, setPostModalOpen] = useState(false);
    const [signInOpen, setSignInOpen] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);
    const [commentOnly, setCommentOnly] = useState(false);
    useScrollLock(postModalOpen || signInOpen || Boolean(selectedPost));

    // Guests read freely but must sign in before any write action.
    const requireAuth = useCallback(() => {
        if (user) return false;
        setSignInOpen(true);
        return true;
    }, [user]);

    const openPostComposer = () => {
        if (requireAuth()) return;
        setEditingPost(null);
        setPostModalOpen(true);
    };

    useEffect(() => {
        if (!postModalOpen && !signInOpen && !selectedPost) return undefined;
        const focusTimer = window.setTimeout(() => {
            document.querySelector('[data-community-modal-close]')?.focus();
        }, 0);
        const handleKeyDown = (event) => {
            if (event.key !== 'Escape') return;
            if (selectedPost) setSelectedPost(null);
            else if (signInOpen) setSignInOpen(false);
            else if (!savingPost) setPostModalOpen(false);
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            window.clearTimeout(focusTimer);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [postModalOpen, savingPost, selectedPost, signInOpen]);
    const [confirmState, setConfirmState] = useState({
        isOpen: false,
        title: '',
        message: '',
        confirmLabel: 'Confirm',
        cancelLabel: 'Cancel',
        danger: false,
        requireInput: false,
        inputValue: ''
    });

    const openConfirmation = ({
        title,
        message,
        confirmLabel = 'Confirm',
        cancelLabel = 'Cancel',
        danger = false,
        requireInput = false,
        inputLabel = 'Reason',
        inputPlaceholder = 'Enter details'
    }) => new Promise((resolve) => {
        setConfirmState({
            isOpen: true,
            title,
            message,
            confirmLabel,
            cancelLabel,
            danger,
            requireInput,
            inputLabel,
            inputPlaceholder,
            inputValue: '',
            resolve
        });
    });

    const closeConfirmation = (confirmed) => {
        if (typeof confirmState.resolve === 'function') {
            confirmState.resolve(confirmed && confirmState.requireInput ? confirmState.inputValue.trim() : Boolean(confirmed));
        }
        setConfirmState({
            isOpen: false,
            title: '',
            message: '',
            confirmLabel: 'Confirm',
            cancelLabel: 'Cancel',
            danger: false,
            requireInput: false,
            inputValue: ''
        });
    };

    const loadPosts = useCallback(async () => {
        setLoadingPosts(true);
        try {
            const response = await communityAPI.getPosts(user?.role || 'user');
            setPosts(response.posts || []);
        } catch {
            notify.error("Couldn't load posts.");
        } finally {
            setLoadingPosts(false);
        }
    }, [user?.role]);

    useEffect(() => {
        loadPosts();
    }, [loadPosts]);

    const confirmPostDelete = async () => {
        return openConfirmation({
            title: 'Delete This Post?',
            message: 'This action cannot be undone.',
            confirmLabel: 'Delete Post',
            danger: true
        });
    };

    const confirmCommentAction = async (options) => {
        return openConfirmation(options);
    };

    const createOrUpdatePost = async ({ content, imageFiles, removeImage }) => {
        setSavingPost(true);
        try {
            if (editingPost) {
                await communityAPI.updatePost(
                    editingPost.id,
                    { content, imageFile: imageFiles?.[0], removeImage },
                    user?.role || 'user'
                );
                notify.success('Post updated.');
                setEditingPost(null);
            } else {
                await communityAPI.createPost({ content, imageFiles }, user?.role || 'user');
                notify.success('Your post is live.');
            }
            await loadPosts();
        } catch (error) {
            notify.error(error.message || "Couldn't save post.");
            return false;
        } finally {
            setSavingPost(false);
        }
    };

    return (
        <ReactLenis root>
            <div className={`text-black relative min-h-screen ${PAGE_BG_GRADIENT}`}>
                <Header />

                {/* Intro Section */}
                <div className="w-full min-h-[42vh] md:min-h-[54vh] flex flex-col items-center justify-center px-4 pt-20">
                    <p className="mb-6 text-xs font-bold uppercase tracking-[0.3em] text-black/50">Share the wild with us</p>
                    <h1 className="text-[4rem] sm:text-[6rem] md:text-[9rem] lg:text-[11rem] leading-none tracking-tight text-black text-center break-words w-full">
                        Community
                    </h1>
                </div>

                {/* Main Feed Section */}
                <main id="community-feed" className="relative z-10 w-full">
                    <div className="max-w-[820px] mx-auto min-h-screen">
                         <div className="min-h-screen">
                             <div className="p-4 sm:p-6 md:p-8">
                                {loadingPosts ? (
                                    <div className="flex items-center justify-center py-32">
                                        <Motion.div
                                            className="w-5 h-5 rounded-full border-[1.5px] border-black/25 border-t-black"
                                            animate={{ rotate: 360 }}
                                            transition={{ repeat: Infinity, duration: 0.85, ease: 'linear' }}
                                        />
                                    </div>
                                ) : (
                                    <PostFeed
                                        posts={posts}
                                        currentUser={user}
                                        isGuest={isGuest}
                                        onRequireAuth={requireAuth}
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
                    onClick={openPostComposer}
                    className="fixed left-3 top-[76px] z-[80] flex h-12 w-12 items-center justify-center rounded-md border border-gray-600 bg-black p-1.5 text-sm font-black text-white transition-colors hover:bg-black/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black sm:left-6 sm:top-[96px] sm:h-auto sm:w-auto sm:justify-start sm:gap-3 sm:pr-5"
                    aria-label={isGuest ? 'Sign in to post' : 'Create post'}
                >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center">
                    <Plus className="h-6 w-6 text-white" aria-hidden="true" />
                    </span>
                    <span className="hidden whitespace-nowrap text-[11px] uppercase tracking-[0.16em] text-white sm:inline">{isGuest ? 'Sign in to post' : 'Create post'}</span>
                </button>

                <AnimatePresence>
                    {postModalOpen && (
                        <div className="fixed inset-0 z-[150] flex items-center justify-center overscroll-contain p-4" role="dialog" aria-modal="true" aria-labelledby="community-post-form-title">
                            <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !savingPost && setPostModalOpen(false)} />
                            <Motion.div data-lenis-prevent initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }} className="relative z-10 max-h-[92dvh] w-full overflow-y-auto overscroll-contain rounded-t-md bg-white p-4 shadow-2xl sm:max-w-xl sm:rounded-md sm:border sm:border-gray-600 sm:p-8">
                                <div className="mb-6 flex items-center justify-between"><h2 id="community-post-form-title" className="text-xl font-black">{editingPost ? 'Edit post' : 'Create post'}</h2><button data-community-modal-close onClick={() => !savingPost && setPostModalOpen(false)} className="rounded-full px-3 py-2 text-sm text-[#212631]/60 hover:bg-black/5">Close</button></div>
                                <PostForm onSubmit={async (data) => { const result = await createOrUpdatePost(data); if (result !== false) setPostModalOpen(false); return result; }} loading={savingPost} initialPost={editingPost} onCancelEdit={() => { setEditingPost(null); setPostModalOpen(false); }} />
                            </Motion.div>
                        </div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {selectedPost && (
                        <div className="fixed inset-0 z-[200] flex items-center justify-center overscroll-contain p-0 md:p-6" role="dialog" aria-modal="true" aria-labelledby="community-post-dialog-title">
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
                                  className="relative z-10 flex flex-col bg-white w-full h-full md:h-auto md:max-w-4xl md:max-h-[85vh] overflow-hidden overscroll-contain md:rounded-md md:border md:border-gray-600"
                            >
                                <div className="flex items-center justify-between px-4 py-3 sm:px-5 sm:py-4 border-b border-gray-600 shrink-0 bg-white">
                                    <span id="community-post-dialog-title" className="text-[10px] tracking-[0.18em] uppercase font-bold text-black/70">
                                        {commentOnly ? 'Comments' : 'Post Details'}
                                    </span>
                                    <button
                                        data-community-modal-close
                                        onClick={() => setSelectedPost(null)}
                                        className="text-black opacity-70 hover:opacity-100 transition-opacity cursor-pointer flex items-center gap-2"
                                    >
                                        <span className="text-[10px] tracking-widest uppercase font-bold">Close</span>
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                </div>

                                <div data-lenis-prevent className="overflow-y-auto overscroll-contain flex-1 p-4 sm:p-6 md:p-10">
                                    {commentOnly ? (
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-black/50">Community discussion</p>
                                            <h2 className="mt-2 mb-8 text-3xl font-black tracking-tight">Comments</h2>
                                            <CommentSection postId={selectedPost.id} currentUser={user} isGuest={isGuest} onRequireAuth={requireAuth} refreshTrigger={0} onRequireConfirmation={confirmCommentAction} />
                                        </div>
                                    ) : (
                                        <>
                                    <div className="flex items-center gap-4 mb-8 w-max">
                                        <img
                                            src={getProfileImageUrl(selectedPost.author.profileImage) || 'https://via.placeholder.com/64x64?text=U'}
                                            alt="author"
                                             className="w-12 h-12 rounded-full object-cover"
                                        />
                                        <div className="flex flex-col">
                                            <span className="font-black uppercase text-black tracking-tight text-lg">
                                                {selectedPost.author.firstName} {selectedPost.author.lastName}
                                            </span>
                                            <span className="text-[9px] tracking-[0.18em] uppercase font-bold text-black/60">
                                                {new Date(selectedPost.createdAt).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>

                                    <p className="text-xl md:text-3xl font-medium leading-[1.3] text-black whitespace-pre-wrap mb-10 tracking-tight">
                                        {selectedPost.content}
                                    </p>

                                    {selectedPost.imageUrl && (
                                         <div className="w-full overflow-hidden mb-10 bg-black/[0.03] flex justify-center">
                                            <img src={selectedPost.imageUrl} alt="post" className="max-w-full h-auto max-h-[60vh] object-contain" />
                                        </div>
                                    )}

                                    <div className="pt-10 border-t border-black/10">
                                        <h3 className="font-black uppercase text-black tracking-tighter text-2xl mb-8">Discussion</h3>
                                        <CommentSection
                                            postId={selectedPost.id}
                                            currentUser={user}
                                            isGuest={isGuest}
                                            onRequireAuth={requireAuth}
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

                <SignInModal isOpen={signInOpen} onClose={() => setSignInOpen(false)} />

                <Footer />

                <ConfirmationModal
                    isOpen={confirmState.isOpen}
                    title={confirmState.title}
                    message={confirmState.message}
                    confirmLabel={confirmState.confirmLabel}
                    cancelLabel={confirmState.cancelLabel}
                    danger={confirmState.danger}
                    requireInput={confirmState.requireInput}
                    inputLabel={confirmState.inputLabel}
                    inputPlaceholder={confirmState.inputPlaceholder}
                    inputValue={confirmState.inputValue}
                    onInputChange={(inputValue) => setConfirmState((current) => ({ ...current, inputValue }))}
                    confirmDisabled={confirmState.requireInput && !confirmState.inputValue.trim()}
                    onConfirm={() => closeConfirmation(true)}
                    onClose={() => closeConfirmation(false)}
                />
            </div>
        </ReactLenis>
    );
};

export default CommunityPage;
