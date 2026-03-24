import { useEffect, useState } from 'react';
import { ReactLenis } from 'lenis/react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../../components/Header';
import PostForm from '../../components/features/community/PostForm';
import PostFeed from '../../components/features/community/PostFeed';
import PublicUserProfile from './PublicUserProfile';
import CommentSection from '../../components/features/community/CommentSection';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import { communityAPI, getProfileImageUrl } from '../../services/api-client';
import { useAuth } from '../../context/AuthContext';
import { notify } from '../../utils/toast';

const CommunityPage = () => {
    const { user } = useAuth();
    const [posts, setPosts] = useState([]);
    const [loadingPosts, setLoadingPosts] = useState(false);
    const [savingPost, setSavingPost] = useState(false);
    const [editingPost, setEditingPost] = useState(null);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [selectedPost, setSelectedPost] = useState(null);
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
            notify.error('Could not load community posts right now.');
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
            notify.error('Could not save your post right now.');
        } finally {
            setSavingPost(false);
        }
    };

    const scrollToFeed = () => {
        document.getElementById('community-feed')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <ReactLenis root>
            <div className="bg-[#ebebeb] text-[#212631] relative min-h-screen">
                <Header />

                {/* Intro Section */}
                <div className="sticky top-0 w-full h-[80vh] flex flex-col items-center justify-center overflow-hidden z-0">
                    <div className="absolute inset-0 bg-[#ffdd45]" />
                    <div className="relative z-10 flex flex-col items-center text-center px-4 w-full max-w-5xl">
                        <span className="text-[10px] tracking-[0.3em] uppercase font-bold text-[#212631]/40 mb-6 md:mb-10">
                            Zoo Bulusan Network
                        </span>
                        <h1 className="font-extrabold uppercase text-[#212631] leading-[0.85] tracking-tighter"
                            style={{ fontSize: 'clamp(50px, 12vw, 160px)' }}>
                            Community
                        </h1>
                        <p className="mt-8 md:mt-12 text-xs md:text-sm tracking-[0.1em] text-[#212631]/60 max-w-2xl font-semibold uppercase leading-relaxed mb-12">
                            Connect with fellow wildlife enthusiasts, share your experiences, and stay updated with the latest from the zoo.
                        </p>

                        <button
                            onClick={scrollToFeed}
                            className="px-8 py-4 bg-[#212631] text-[#ebebeb] border border-[#212631] text-[10px] tracking-[0.2em] uppercase font-black hover:bg-transparent hover:text-[#212631] transition-colors duration-300"
                        >
                            Share an Update
                        </button>
                    </div>

                    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 opacity-60 cursor-pointer hover:opacity-100 transition-opacity" onClick={scrollToFeed}>
                        <span className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#212631]">Scroll</span>
                        <motion.div
                            animate={{ y: [0, 8, 0] }}
                            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                            className="w-[1px] h-16 bg-gradient-to-b from-[#212631] to-transparent"
                        />
                    </div>
                </div>

                {/* Main Feed Section */}
                <main id="community-feed" className="relative z-10 w-full bg-[#ebebeb] border-t border-[#212631]/15">
                    <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_2fr] xl:grid-cols-[380px_1fr_380px] min-h-screen">

                        <div className="border-b lg:border-b-0 lg:border-r border-[#212631]/15 bg-[#ebebeb] relative">
                            <div className="sticky top-20 p-5 md:p-8 h-max">
                                <PostForm
                                    onSubmit={createOrUpdatePost}
                                    loading={savingPost}
                                    initialPost={editingPost}
                                    onCancelEdit={() => setEditingPost(null)}
                                    onBeforeSubmit={confirmPostSubmit}
                                />
                            </div>
                        </div>

                        <div className="bg-[#ebebeb] border-b xl:border-b-0 xl:border-r border-[#212631]/15 min-h-screen">
                            <div className="p-0 sm:p-5 md:p-8">
                                {loadingPosts ? (
                                    <div className="flex items-center justify-center py-32">
                                        <motion.div
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
                                        onEditPost={setEditingPost}
                                        onUserClick={setSelectedUserId}
                                        onPostClick={setSelectedPost}
                                        onConfirmDelete={confirmPostDelete}
                                    />
                                )}
                            </div>
                        </div>

                        <div className="hidden xl:block bg-[#ebebeb] relative">
                            <div className="sticky top-20 p-8 h-max">
                                {selectedUserId ? (
                                    <PublicUserProfile userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-center p-12 border border-[#212631]/15 bg-[#ebebeb]">
                                        <span className="text-[10px] tracking-[0.18em] uppercase font-bold text-[#212631]/55">
                                            Profile Viewer
                                        </span>
                                        <p className="mt-4 text-[10px] uppercase tracking-widest text-[#212631]/75 leading-relaxed">
                                            Select a user from the feed to view their profile information here.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </main>

                <AnimatePresence>
                    {selectedUserId && (
                        <div className="xl:hidden fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                                onClick={() => setSelectedUserId(null)}
                            />
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 20, opacity: 0 }}
                                className="relative z-10 w-full max-w-lg"
                            >
                                <PublicUserProfile userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {selectedPost && (
                        <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 md:p-6">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/60 backdrop-blur-md"
                                onClick={() => setSelectedPost(null)}
                            />
                            <motion.div
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 12 }}
                                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                                className="relative z-10 flex flex-col bg-[#ebebeb] border border-[#212631]/20 w-full h-full md:h-auto md:max-w-4xl md:max-h-[85vh] overflow-hidden"
                            >
                                <div className="flex items-center justify-between px-5 py-4 border-b border-[#212631]/15 shrink-0 bg-[#ebebeb]">
                                    <span className="text-[10px] tracking-[0.18em] uppercase font-bold text-[#212631]/70">
                                        Post Details
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
                                    <div className="flex items-center gap-4 mb-8 cursor-pointer group w-max"
                                        onClick={() => {
                                            setSelectedUserId(selectedPost.author.id);
                                            setSelectedPost(null);
                                        }}>
                                        <img
                                            src={getProfileImageUrl(selectedPost.author.profileImage) || 'https://via.placeholder.com/64x64?text=U'}
                                            alt="author"
                                            className="w-12 h-12 rounded-none object-cover grayscale group-hover:grayscale-0 transition-all border border-[#212631]/20"
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
                                        <div className="w-full overflow-hidden border border-[#212631]/15 mb-10 bg-[#212631]/5 flex justify-center">
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
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

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