import { useEffect, useState } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import PostForm from '../../components/features/community/PostForm';
import PostFeed from '../../components/features/community/PostFeed';
import { communityAPI } from '../../services/api-client';
import { useAuth } from '../../context/AuthContext';
import { notify } from '../../utils/toast';

const CommunityPage = () => {
    const { user } = useAuth();
    const [posts, setPosts] = useState([]);
    const [loadingPosts, setLoadingPosts] = useState(false);
    const [savingPost, setSavingPost] = useState(false);
    const [editingPost, setEditingPost] = useState(null);

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

    const createOrUpdatePost = async ({ content, imageFile, removeImage }) => {
        setSavingPost(true);
        try {
            if (editingPost) {
                await communityAPI.updatePost(
                    editingPost.id,
                    { content, imageFile, removeImage },
                    user?.role || 'user'
                );
                notify.success('Post updated. It is now pending review.');
                setEditingPost(null);
            } else {
                await communityAPI.createPost({ content, imageFile }, user?.role || 'user');
                notify.success('Post submitted. Waiting for moderation.');
            }
            await loadPosts();
        } catch {
            notify.error('Could not save your post right now.');
        } finally {
            setSavingPost(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-50">
            <Header />

            <main className="max-w-4xl mx-auto px-4 py-24 md:py-28">
                <section className="mb-6">
                    <h1 className="text-3xl md:text-4xl font-black text-gray-900">Community</h1>
                    <p className="text-sm md:text-base text-gray-600 mt-2">
                        Share updates, discuss with fellow visitors, and connect with the Zoo Bulusan community.
                    </p>
                </section>

                <PostForm
                    onSubmit={createOrUpdatePost}
                    loading={savingPost}
                    initialPost={editingPost}
                    onCancelEdit={() => setEditingPost(null)}
                />

                {loadingPosts ? (
                    <div className="mt-5 bg-white rounded-2xl border border-emerald-100 p-6 text-sm text-gray-500">
                        Loading community feed...
                    </div>
                ) : (
                    <PostFeed
                        posts={posts}
                        currentUser={user}
                        onRefresh={loadPosts}
                        onEditPost={setEditingPost}
                    />
                )}
            </main>

            <Footer />
        </div>
    );
};

export default CommunityPage;
