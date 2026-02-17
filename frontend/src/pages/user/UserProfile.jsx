import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI, getProfileImageUrl as resolveProfileImageUrl } from '../../services/api-client';
import { sanitizeInput } from '../../utils/sanitize';

const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-16 h-16 text-gray-300">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
);

const CameraIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="4" />
    </svg>
);

const VerifiedIcon = () => (
    <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
        <path d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.64.304 1.24.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
    </svg>
);

const UserProfile = () => {
    const { user, logout, updateUser } = useAuth();
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

    const [imagePreview, setImagePreview] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: ''
    });

    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.firstName || '',
                lastName: user.lastName || ''
            });
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: sanitizeInput(value) });
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setSelectedFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result);
        reader.readAsDataURL(file);
    };

    const handleImageUpload = async () => {
        if (!selectedFile) return;
        setUploadingImage(true);
        try {
            const response = await authAPI.uploadProfileImage(selectedFile);
            if (response.success) {
                if (response.user) updateUser(response.user);
                setSelectedFile(null);
                setImagePreview(null);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setUploadingImage(false);
        }
    };

    const handleRemoveImage = async () => {
        setUploadingImage(true);
        try {
            const response = await authAPI.deleteProfileImage();
            if (response.success) {
                updateUser({ ...user, profileImage: null, profile_image: null });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setUploadingImage(false);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const response = await authAPI.updateProfile(formData);
            if (response.success) {
                if (response.user) updateUser(response.user);
                setIsEditing(false);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) return;
        setLoading(true);
        try {
            const response = await authAPI.updatePassword(passwordData);
            if (response.success) {
                setShowPasswordModal(false);
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const getProfileImageUrl = () => {
        if (imagePreview) return imagePreview;
        return resolveProfileImageUrl(user?.profileImage || user?.profile_image);
    };

    if (!user) return null;

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex flex-col items-center">
            <div className="w-full min-h-screen bg-white flex flex-col">

                <div className="relative h-48 sm:h-64 bg-[#F2F4F7] overflow-hidden">
                    <img
                        src="https://i.pinimg.com/736x/cf/be/f7/cfbef7ee6088cac3e2e6c01cfe57bfed.jpg"
                        className="w-full h-full object-cover opacity-60"
                        alt="Header"
                    />
                    <div className="absolute top-6 left-6 z-10">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 px-4 py-2 bg-white shadow-sm rounded-full text-sm font-bold text-gray-700 hover:bg-gray-50 transition active:scale-95"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                            Back
                        </button>
                    </div>
                </div>

                <div className="w-full max-w-5xl mx-auto px-6 sm:px-10 flex-grow">
                    <div className="flex flex-col sm:flex-row justify-between items-start -mt-16 sm:-mt-20 mb-12 gap-6 relative z-10">
                        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6">
                            <div className="relative group">
                                <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-[6px] border-white shadow-xl overflow-hidden bg-gray-100">
                                    {getProfileImageUrl() ? (
                                        <img src={getProfileImageUrl()} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-50"><UserIcon /></div>
                                    )}
                                </div>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute bottom-2 right-2 p-2 bg-white border border-gray-100 rounded-full shadow-lg text-gray-700 hover:text-emerald-600 transition"
                                >
                                    <CameraIcon />
                                </button>
                                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                            </div>
                            <div className="pb-2 text-center sm:text-left">
                                <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                                    <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
                                        {user.firstName} {user.lastName}
                                    </h1>
                                    <VerifiedIcon />
                                </div>
                                <p className="text-lg text-gray-400 font-medium">@{user.username}</p>
                                {(user?.profileImage || user?.profile_image) && !selectedFile && (
                                    <button onClick={handleRemoveImage} className="text-sm text-red-500 font-bold hover:underline mt-2">Remove photo</button>
                                )}
                            </div>
                        </div>
                        <div className="sm:mt-24 w-full sm:w-auto">
                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                className="w-full sm:w-auto px-8 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50 transition"
                            >
                                {isEditing ? 'Cancel' : 'Edit profile'}
                            </button>
                        </div>
                    </div>

                    <div className="h-px bg-gray-100 mb-12 w-full"></div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pb-20">
                        <div className="lg:col-span-4">
                            <h3 className="text-lg font-bold text-gray-900">Personal information</h3>
                            <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                                Manage your personal details and account settings to keep your profile up to date.
                            </p>
                        </div>

                        <div className="lg:col-span-8 space-y-10">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 ml-1">First name</label>
                                    <input
                                        name="firstName"
                                        value={isEditing ? formData.firstName : user.firstName}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition disabled:bg-gray-50 disabled:text-gray-400"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 ml-1">Last name</label>
                                    <input
                                        name="lastName"
                                        value={isEditing ? formData.lastName : user.lastName}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition disabled:bg-gray-50 disabled:text-gray-400"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 ml-1">Email address</label>
                                <input
                                    value={user.email}
                                    disabled
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-400 outline-none cursor-not-allowed"
                                />
                            </div>

                            {isEditing && (
                                <button onClick={handleSave} disabled={loading} className="w-full py-3.5 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition active:scale-[0.99] disabled:opacity-50">
                                    {loading ? 'Processing...' : 'Save Changes'}
                                </button>
                            )}

                            <div className="pt-8 border-t border-gray-50">
                                <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Security & Session</h3>
                                <div className="flex flex-wrap gap-4">
                                    <button
                                        onClick={() => setShowPasswordModal(true)}
                                        className="flex-1 sm:flex-none px-6 py-2.5 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 transition"
                                    >
                                        Change Password
                                    </button>
                                    <button
                                        onClick={logout}
                                        className="flex-1 sm:flex-none px-6 py-2.5 border border-red-100 rounded-lg text-sm font-bold text-red-600 hover:bg-red-50 transition"
                                    >
                                        Logout
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {selectedFile && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-6 px-8 py-4 bg-white rounded-full shadow-2xl border border-gray-100 z-50 animate-in slide-in-from-bottom-10">
                    <p className="text-sm font-extrabold text-gray-900">Update photo?</p>
                    <div className="flex gap-2">
                        <button onClick={() => { setSelectedFile(null); setImagePreview(null); }} className="px-4 py-2 text-sm font-bold text-gray-400">Cancel</button>
                        <button onClick={handleImageUpload} disabled={uploadingImage} className="bg-emerald-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg shadow-emerald-100">Update</button>
                    </div>
                </div>
            )}

            {showPasswordModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-md p-4">
                    <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl">
                        <h3 className="text-2xl font-black text-gray-900 mb-6">Security</h3>
                        <div className="space-y-4">
                            <input type="password" placeholder="Current Password" value={passwordData.currentPassword} onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} className="w-full px-5 py-3.5 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-emerald-500 transition-all" />
                            <input type="password" placeholder="New Password" value={passwordData.newPassword} onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} className="w-full px-5 py-3.5 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-emerald-500 transition-all" />
                            <input type="password" placeholder="Confirm New Password" value={passwordData.confirmPassword} onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} className="w-full px-5 py-3.5 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-emerald-500 transition-all" />
                        </div>
                        <div className="flex gap-3 mt-10">
                            <button onClick={() => setShowPasswordModal(false)} className="flex-1 py-3.5 border border-gray-200 rounded-xl font-bold text-gray-400 hover:bg-gray-50 transition">Cancel</button>
                            <button onClick={handlePasswordChange} disabled={loading} className="flex-1 py-3.5 bg-emerald-600 text-white rounded-xl font-bold shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition">Update</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserProfile;