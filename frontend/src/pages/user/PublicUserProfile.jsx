import { useEffect, useState } from 'react';
import { communityAPI, getProfileImageUrl } from '../../services/api-client';
import { useAuth } from '../../context/AuthContext';
import { notify } from '../../utils/toast';

const PublicUserProfile = ({ userId, onClose }) => {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!userId) return;

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

    if (loading) {
        return (
            <div className="bg-[#ebebeb] border border-[#212631]/10 w-full animate-pulse flex flex-col">
                <div className="h-48 bg-[#212631]/5 border-b border-[#212631]/10 w-full"></div>
                <div className="p-8 flex flex-col items-center text-center">
                    <div className="w-24 h-24 bg-[#212631]/10 rounded-none -mt-20 mb-6 border border-[#212631]/10"></div>
                    <div className="h-6 bg-[#212631]/10 w-2/3 mb-4"></div>
                    <div className="h-3 bg-[#212631]/10 w-1/2"></div>
                </div>
            </div>
        );
    }

    if (!profile) return null;

    return (
        <section className="bg-[#ebebeb] border border-[#212631]/10 w-full flex flex-col">
            <div className="h-40 bg-[#212631]/5 border-b border-[#212631]/10 w-full relative overflow-hidden flex items-center justify-center">
                <span className="text-[120px] font-black uppercase text-[#212631]/5 tracking-tighter absolute">
                    {profile.firstName[0]}
                </span>
            </div>

            <div className="px-6 pb-8 flex flex-col items-center text-center relative">
                <img
                    src={getProfileImageUrl(profile.profileImage) || 'https://via.placeholder.com/150x150?text=U'}
                    alt="profile"
                    className="w-24 h-24 rounded-none object-cover border border-[#212631]/20 bg-[#ebebeb] -mt-12 mb-5 grayscale hover:grayscale-0 transition-all duration-300"
                />

                <h1 className="text-2xl font-black uppercase text-[#212631] tracking-tighter leading-none mb-2">
                    {profile.firstName} {profile.lastName}
                </h1>
                <p className="text-[10px] tracking-[0.18em] uppercase font-bold text-[#212631]/40 mb-8">
                    @{profile.username}
                </p>

                <div className="flex flex-col w-full border-t border-[#212631]/10">
                    <div className="flex justify-between items-center py-4 border-b border-[#212631]/10">
                        <span className="text-[9px] tracking-[0.18em] uppercase font-bold text-[#212631]/40">Role</span>
                        <span className="text-[10px] tracking-widest font-black uppercase text-[#212631]">{profile.role}</span>
                    </div>
                    <div className="flex justify-between items-center py-4 border-b border-[#212631]/10">
                        <span className="text-[9px] tracking-[0.18em] uppercase font-bold text-[#212631]/40">Joined</span>
                        <span className="text-[10px] tracking-widest font-black uppercase text-[#212631]">
                            {new Date(profile.joinedAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                        </span>
                    </div>
                </div>

                {onClose && (
                    <button
                        onClick={onClose}
                        className="mt-8 w-full py-3 border border-[#212631]/20 text-[10px] tracking-[0.18em] uppercase font-black text-[#212631] hover:bg-[#212631] hover:text-[#ebebeb] transition-colors cursor-pointer"
                    >
                        Close Profile
                    </button>
                )}
            </div>
        </section>
    );
};

export default PublicUserProfile;