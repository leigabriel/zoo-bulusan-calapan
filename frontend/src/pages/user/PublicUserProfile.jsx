import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { communityAPI, getProfileImageUrl } from '../../services/api-client';
import { useAuth } from '../../context/AuthContext';
import { notify } from '../../utils/toast';

const PublicUserProfile = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadProfile = async () => {
            setLoading(true);
            try {
                const response = await communityAPI.getUserProfile(userId, user?.role || 'user');
                setProfile(response.profile || null);
            } catch {
                notify.error('Could not load this profile right now.');
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, [userId]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-50">
            <Header />

            <main className="max-w-3xl mx-auto px-4 py-24 md:py-28">
                <button
                    onClick={() => navigate(-1)}
                    className="mb-5 px-4 py-2 rounded-xl bg-white border border-emerald-200 text-sm font-semibold text-emerald-700"
                >
                    Back
                </button>

                {loading && (
                    <div className="bg-white rounded-2xl border border-emerald-100 p-6 text-sm text-gray-500">Loading profile...</div>
                )}

                {!loading && profile && (
                    <section className="bg-white rounded-2xl border border-emerald-100 p-6 md:p-8 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                            <img
                                src={getProfileImageUrl(profile.profileImage) || 'https://via.placeholder.com/120x120?text=User'}
                                alt="profile"
                                className="w-24 h-24 rounded-full object-cover border border-emerald-200"
                            />
                            <div>
                                <h1 className="text-2xl md:text-3xl font-black text-gray-900">
                                    {profile.firstName} {profile.lastName}
                                </h1>
                                <p className="text-sm text-gray-600 mt-1">@{profile.username}</p>
                                <p className="text-sm text-gray-600 mt-1 capitalize">Role: {profile.role}</p>
                                <p className="text-xs text-gray-500 mt-2">Joined: {new Date(profile.joinedAt).toLocaleDateString()}</p>
                            </div>
                        </div>

                        <div className="mt-6">
                            <Link
                                to="/community"
                                className="inline-flex px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700"
                            >
                                Back to community
                            </Link>
                        </div>
                    </section>
                )}
            </main>

            <Footer />
        </div>
    );
};

export default PublicUserProfile;
