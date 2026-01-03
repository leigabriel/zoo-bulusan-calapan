import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api-client';
import { sanitizeInput, sanitizePhone } from '../../utils/sanitize';

const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-20 h-20">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
    </svg>
);

const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
);

const SaveIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
        <polyline points="17 21 17 13 7 13 7 21"/>
        <polyline points="7 3 7 8 15 8"/>
    </svg>
);

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
        <polyline points="3 6 5 6 21 6"/>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        <line x1="10" y1="11" x2="10" y2="17"/>
        <line x1="14" y1="11" x2="14" y2="17"/>
    </svg>
);

const LockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
);

const UserProfile = () => {
    const { user, logout, updateUser } = useAuth();
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phoneNumber: '',
        gender: '',
        birthday: ''
    });

    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                phoneNumber: user.phoneNumber || '',
                gender: user.gender || 'prefer_not_to_say',
                birthday: user.birthday ? user.birthday.split('T')[0] : ''
            });
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        let sanitizedValue = value;
        
        if (name === 'phoneNumber') {
            sanitizedValue = sanitizePhone(value);
        } else if (name !== 'gender' && name !== 'birthday') {
            sanitizedValue = sanitizeInput(value);
        }
        
        setFormData({ ...formData, [name]: sanitizedValue });
    };

    const handleSave = async () => {
        setLoading(true);
        setMessage({ text: '', type: '' });

        try {
            const response = await authAPI.updateProfile(formData);
            if (response.success) {
                // Update auth context and storage so UI reflects new profile immediately
                if (response.user) {
                    updateUser(response.user);
                }
                setMessage({ text: 'Profile updated successfully!', type: 'success' });
                setIsEditing(false);
            } else {
                setMessage({ text: response.message || 'Failed to update profile', type: 'error' });
            }
        } catch (error) {
            setMessage({ text: error.message || 'An error occurred', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage({ text: 'New passwords do not match', type: 'error' });
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setMessage({ text: 'Password must be at least 6 characters', type: 'error' });
            return;
        }

        setLoading(true);
        try {
            const response = await authAPI.updatePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });

            if (response.success) {
                setMessage({ text: 'Password changed successfully!', type: 'success' });
                setShowPasswordModal(false);
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                setMessage({ text: response.message || 'Failed to change password', type: 'error' });
            }
        } catch (error) {
            setMessage({ text: error.message || 'An error occurred', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!deletePassword) {
            setMessage({ text: 'Please enter your password to confirm', type: 'error' });
            return;
        }

        setLoading(true);
        try {
            const response = await authAPI.deleteAccount({ password: deletePassword });
            if (response.success) {
                logout();
                navigate('/login', { state: { message: 'Your account has been deleted.' } });
            } else {
                setMessage({ text: response.message || 'Failed to delete account', type: 'error' });
            }
        } catch (error) {
            setMessage({ text: error.message || 'An error occurred', type: 'error' });
        } finally {
            setLoading(false);
            setShowDeleteModal(false);
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <p>Please log in to view your profile.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Floating Navigation */}
            <div className="fixed top-4 left-4 right-4 z-50 flex justify-between items-center pointer-events-none">
                <button
                    onClick={() => navigate('/', { state: { openSidePanel: true } })}
                    className="pointer-events-auto flex items-center gap-2 px-4 py-2.5 bg-white/90 backdrop-blur-sm text-gray-700 rounded-full shadow-lg hover:bg-white hover:shadow-xl transition-all duration-300 font-medium"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="hidden sm:inline">Back</span>
                </button>
                <Link
                    to="/"
                    className="pointer-events-auto flex items-center gap-2 px-4 py-2.5 bg-white/90 backdrop-blur-sm text-gray-700 rounded-full shadow-lg hover:bg-white hover:shadow-xl transition-all duration-300 font-medium"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <span className="hidden sm:inline">Home</span>
                </Link>
            </div>
            
            {/* Hero Section - matching design system */}
            <section className="relative text-white py-20 pt-24 bg-cover bg-center" style={{ backgroundImage: 'linear-gradient(135deg, rgba(16,185,129,0.92), rgba(20,184,166,0.92)), url(https://images.unsplash.com/photo-1564349683136-77e08dba1ef7)' }}>
                <div className="container mx-auto px-4 text-center relative z-10">
                    <div className="w-28 h-28 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                        <UserIcon />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-2 tracking-tight">
                        {user.firstName} {user.lastName}
                    </h1>
                    <p className="opacity-90 text-lg">@{user.username}</p>
                    <span className="inline-block mt-3 px-5 py-1.5 bg-white/20 rounded-full text-sm capitalize font-medium backdrop-blur-sm">
                        {user.role}
                    </span>
                </div>
            </section>

            <section className="py-12 container mx-auto px-4 max-w-4xl flex-grow">
                {message.text && (
                    <div className={`mb-6 p-4 rounded-xl ${
                        message.type === 'success' 
                            ? 'bg-green-100 text-green-700 border border-green-300' 
                            : 'bg-red-100 text-red-700 border border-red-300'
                    }`}>
                        {message.text}
                    </div>
                )}

                <div className="bg-white rounded-3xl shadow-lg overflow-hidden border border-gray-100">
                    <div className="p-6 border-b flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-gray-800">Profile Information</h2>
                        {!isEditing ? (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full font-semibold hover:shadow-lg transition-all"
                            >
                                <EditIcon /> Edit Profile
                            </button>
                        ) : (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition disabled:opacity-50"
                                >
                                    <SaveIcon /> {loading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="p-6 space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">First Name</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    />
                                ) : (
                                    <p className="text-gray-800 font-medium">{user.firstName}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Last Name</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    />
                                ) : (
                                    <p className="text-gray-800 font-medium">{user.lastName}</p>
                                )}
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Username</label>
                                <p className="text-gray-800 font-medium">@{user.username}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                                <p className="text-gray-800 font-medium">{user.email}</p>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Phone Number</label>
                                {isEditing ? (
                                    <input
                                        type="tel"
                                        name="phoneNumber"
                                        value={formData.phoneNumber}
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                        placeholder="09123456789"
                                    />
                                ) : (
                                    <p className="text-gray-800 font-medium">{user.phoneNumber || 'Not provided'}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Gender</label>
                                {isEditing ? (
                                    <select
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                                    >
                                        <option value="prefer_not_to_say">Prefer not to say</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                ) : (
                                    <p className="text-gray-800 font-medium capitalize">{user.gender?.replace('_', ' ') || 'Not provided'}</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Birthday</label>
                            {isEditing ? (
                                <input
                                    type="date"
                                    name="birthday"
                                    value={formData.birthday}
                                    onChange={handleChange}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                />
                            ) : (
                                <p className="text-gray-800 font-medium">
                                    {user.birthday ? new Date(user.birthday).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not provided'}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-6 bg-white rounded-2xl shadow-lg p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Account Settings</h3>
                    <div className="flex flex-wrap gap-4">
                        <button
                            onClick={() => setShowPasswordModal(true)}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                        >
                            <LockIcon /> Change Password
                        </button>
                        <button
                            onClick={() => setShowDeleteModal(true)}
                            className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition"
                        >
                            <TrashIcon /> Delete Account
                        </button>
                    </div>
                </div>
            </section>

            {showPasswordModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
                        <h3 className="text-xl font-bold mb-4">Change Password</h3>
                        <div className="space-y-4">
                            <input
                                type="password"
                                placeholder="Current Password"
                                value={passwordData.currentPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                className="w-full p-3 border rounded-lg"
                            />
                            <input
                                type="password"
                                placeholder="New Password"
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                className="w-full p-3 border rounded-lg"
                            />
                            <input
                                type="password"
                                placeholder="Confirm New Password"
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                className="w-full p-3 border rounded-lg"
                            />
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowPasswordModal(false)} className="flex-1 px-4 py-2 border rounded-lg">Cancel</button>
                            <button onClick={handlePasswordChange} disabled={loading} className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50">
                                {loading ? 'Changing...' : 'Change Password'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
                        <h3 className="text-xl font-bold text-red-600 mb-2">Delete Account</h3>
                        <p className="text-gray-600 mb-4">This action cannot be undone. Enter your password to confirm.</p>
                        <input
                            type="password"
                            placeholder="Enter your password"
                            value={deletePassword}
                            onChange={(e) => setDeletePassword(e.target.value)}
                            className="w-full p-3 border rounded-lg mb-4"
                        />
                        <div className="flex gap-3">
                            <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-4 py-2 border rounded-lg">Cancel</button>
                            <button onClick={handleDeleteAccount} disabled={loading} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg disabled:opacity-50">
                                {loading ? 'Deleting...' : 'Delete Account'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserProfile;
