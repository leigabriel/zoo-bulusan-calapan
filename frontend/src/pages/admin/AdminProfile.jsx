import { useState, useEffect, useRef } from 'react';
import { authAPI, getProfileImageUrl } from '../../services/api-client';
import { useAuth } from '../../context/AuthContext';
import { sanitizeInput } from '../../utils/sanitize';

// Icons
const CameraIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="4" />
    </svg>
);

const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);

const MailIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
    </svg>
);

const ShieldIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
);

const CalendarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
);

const SaveIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
        <polyline points="17 21 17 13 7 13 7 21" />
        <polyline points="7 3 7 8 15 8" />
    </svg>
);

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const AdminProfile = () => {
    const { user, updateUser } = useAuth();
    const fileInputRef = useRef(null);
    const [form, setForm] = useState({ firstName: '', lastName: '', email: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [profileImage, setProfileImage] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const res = await authAPI.getProfile('admin');
                if (res && res.success && res.user) {
                    setForm({
                        firstName: res.user.firstName || res.user.first_name || '',
                        lastName: res.user.lastName || res.user.last_name || '',
                        email: res.user.email || ''
                    });
                    if (res.user.profileImage || res.user.profile_image) {
                        const imgUrl = res.user.profileImage || res.user.profile_image;
                        setPreviewImage(getProfileImageUrl(imgUrl));
                    }
                } else if (user) {
                    setForm({
                        firstName: user.firstName || user.first_name || '',
                        lastName: user.lastName || user.last_name || '',
                        email: user.email || ''
                    });
                }
            } catch (err) {
                console.error('Error loading admin profile', err);
                setMessage({ type: 'error', text: 'Failed to load profile' });
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [user]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfileImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const save = async () => {
        setSaving(true);
        setMessage({ type: '', text: '' });
        try {
            const payload = { firstName: form.firstName, lastName: form.lastName };
            const res = await authAPI.updateProfile(payload, 'admin');
            if (res && res.success) {
                updateUser({ ...user, firstName: form.firstName, lastName: form.lastName });
                setMessage({ type: 'success', text: 'Profile updated successfully!' });
                setTimeout(() => setMessage({ type: '', text: '' }), 3000);
            } else {
                setMessage({ type: 'error', text: res.message || 'Failed to update profile' });
            }
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'Error updating profile' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-[#8cff65] border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-400">Loading profile...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Success/Error Message */}
            {message.text && (
                <div className={`flex items-center gap-3 p-4 rounded-xl border ${message.type === 'success'
                        ? 'bg-[#8cff65]/10 border-[#8cff65]/30 text-[#8cff65]'
                        : 'bg-red-500/10 border-red-500/30 text-red-400'
                    }`}>
                    {message.type === 'success' ? <CheckIcon /> : null}
                    <span>{message.text}</span>
                </div>
            )}

            {/* Profile Header Card */}
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl overflow-hidden">
                {/* Banner */}
                <div className="h-32 bg-gradient-to-r from-[#8cff65]/20 via-[#4ade80]/10 to-[#141414] relative">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjEiIGZpbGw9IiM4Y2ZmNjUiIGZpbGwtb3BhY2l0eT0iMC4xIi8+PC9nPjwvc3ZnPg==')] opacity-50"></div>
                </div>

                {/* Profile Info */}
                <div className="px-6 pb-6 -mt-16 relative">
                    <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4">
                        {/* Avatar */}
                        <div className="relative group">
                            <div className="w-28 h-28 rounded-full border-4 border-[#141414] bg-gradient-to-br from-[#8cff65] to-[#4ade80] flex items-center justify-center overflow-hidden">
                                {previewImage ? (
                                    <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-4xl font-bold text-[#0a0a0a]">
                                        {form.firstName?.charAt(0) || 'A'}
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-0 right-0 w-9 h-9 bg-[#1e1e1e] border border-[#2a2a2a] rounded-full flex items-center justify-center text-gray-400 hover:text-[#8cff65] hover:border-[#8cff65] transition-all group-hover:scale-110"
                            >
                                <CameraIcon />
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="hidden"
                            />
                        </div>

                        {/* Name & Role */}
                        <div className="text-center sm:text-left flex-1">
                            <h2 className="text-2xl font-bold text-white">
                                {form.firstName} {form.lastName}
                            </h2>
                            <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
                                <span className="px-3 py-1 bg-[#8cff65]/10 text-[#8cff65] text-sm font-medium rounded-full flex items-center gap-1.5">
                                    <ShieldIcon />
                                    Administrator
                                </span>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="flex gap-4 text-center">
                            <div className="px-4 py-2 bg-[#1e1e1e] rounded-xl border border-[#2a2a2a]">
                                <p className="text-2xl font-bold text-white">12</p>
                                <p className="text-xs text-gray-500">Events</p>
                            </div>
                            <div className="px-4 py-2 bg-[#1e1e1e] rounded-xl border border-[#2a2a2a]">
                                <p className="text-2xl font-bold text-white">48</p>
                                <p className="text-xs text-gray-500">Actions</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Profile Form */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Personal Information */}
                <div className="lg:col-span-2 bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <UserIcon />
                        Personal Information
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* First Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">First Name</label>
                            <input
                                type="text"
                                value={form.firstName}
                                onChange={(e) => setForm({ ...form, firstName: sanitizeInput(e.target.value) })}
                                className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#8cff65] focus:ring-1 focus:ring-[#8cff65]/20 transition-all"
                                placeholder="Enter first name"
                            />
                        </div>

                        {/* Last Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Last Name</label>
                            <input
                                type="text"
                                value={form.lastName}
                                onChange={(e) => setForm({ ...form, lastName: sanitizeInput(e.target.value) })}
                                className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#8cff65] focus:ring-1 focus:ring-[#8cff65]/20 transition-all"
                                placeholder="Enter last name"
                            />
                        </div>

                        {/* Email */}
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                                    <MailIcon />
                                </div>
                                <input
                                    type="email"
                                    value={form.email}
                                    readOnly
                                    className="w-full bg-[#1e1e1e]/50 border border-[#2a2a2a] rounded-xl pl-12 pr-4 py-3 text-gray-400 cursor-not-allowed"
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-2">Email cannot be changed</p>
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={save}
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#8cff65] to-[#4ade80] hover:from-[#9dff7a] hover:to-[#5ceb91] text-[#0a0a0a] font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#8cff65]/20"
                        >
                            <SaveIcon />
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>

                {/* Account Info Sidebar */}
                <div className="space-y-6">
                    {/* Account Status */}
                    <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-white mb-4">Account Status</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400">Status</span>
                                <span className="flex items-center gap-1.5 text-[#8cff65]">
                                    <div className="w-2 h-2 bg-[#8cff65] rounded-full animate-pulse"></div>
                                    Active
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400">Role</span>
                                <span className="text-white capitalize">{user?.role || 'Admin'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-400">Verified</span>
                                <span className="text-[#8cff65]">Yes</span>
                            </div>
                        </div>
                    </div>

                    {/* Activity Log */}
                    <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <CalendarIcon />
                            Recent Activity
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-start gap-3 text-sm">
                                <div className="w-2 h-2 bg-[#8cff65] rounded-full mt-1.5 flex-shrink-0"></div>
                                <div>
                                    <p className="text-gray-300">Logged in</p>
                                    <p className="text-gray-500 text-xs">Today, 10:30 AM</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 text-sm">
                                <div className="w-2 h-2 bg-blue-400 rounded-full mt-1.5 flex-shrink-0"></div>
                                <div>
                                    <p className="text-gray-300">Updated event</p>
                                    <p className="text-gray-500 text-xs">Yesterday, 3:45 PM</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 text-sm">
                                <div className="w-2 h-2 bg-yellow-400 rounded-full mt-1.5 flex-shrink-0"></div>
                                <div>
                                    <p className="text-gray-300">Created new user</p>
                                    <p className="text-gray-500 text-xs">2 days ago</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminProfile;