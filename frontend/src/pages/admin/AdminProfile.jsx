import { Calendar as ReiconCalendar, Camera as ReiconCamera, Envelope as ReiconEnvelope, Save as ReiconSave, ShieldCheck as ReiconShieldCheck, User as ReiconUser } from 'reicon-react';
import { useState, useEffect, useRef } from 'react';
import { authAPI, getProfileImageUrl } from '../../services/api-client';
import { useAuth } from '../../context/AuthContext';
import { sanitizeInput } from '../../utils/sanitize';
import { notify } from '../../utils/toast';


const AdminProfile = () => {
    const { user, updateUser } = useAuth();
    const fileInputRef = useRef(null);
    const [form, setForm] = useState({ firstName: '', lastName: '', email: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
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
                notify.error("Couldn't load profile.");
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
        try {
            if (profileImage) {
                const imageRes = await authAPI.uploadProfileImage(profileImage, 'admin');
                if (!imageRes?.success) {
                    throw new Error(imageRes?.message || "Couldn't upload photo.");
                }
            }

            const payload = { firstName: form.firstName, lastName: form.lastName };
            const res = await authAPI.updateProfile(payload, 'admin');
            if (res && res.success) {
                updateUser({ ...user, firstName: form.firstName, lastName: form.lastName });
                setProfileImage(null);
                notify.success('Profile updated.');
            } else {
                notify.error(res.message || "Couldn't save changes.");
            }
        } catch (err) {
            console.error(err);
            notify.error(err.message || "Couldn't save changes.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-green-400 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-500">Loading profile...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Profile Header Card */}
            <div className="bg-white border border-green-300 rounded-2xl overflow-hidden">
                {/* Banner */}
                <div className="h-32 bg-gradient-to-r from-green-300 via-green-400 to-green-500 relative">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjEiIGZpbGw9IiM4Y2ZmNjUiIGZpbGwtb3BhY2l0eT0iMC4xIi8+PC9nPjwvc3ZnPg==')] opacity-20"></div>
                </div>

                {/* Profile Info */}
                <div className="px-6 pb-6 -mt-16 relative">
                    <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4">
                        {/* Avatar */}
                        <div className="relative group">
                            <div className="w-28 h-28 rounded-full border-4 border-white bg-gradient-to-br from-green-300 via-green-400 to-green-500 flex items-center justify-center overflow-hidden">
                                {previewImage ? (
                                    <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-4xl font-bold text-gray-900">
                                        {form.firstName?.charAt(0) || 'A'}
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-0 right-0 w-9 h-9 bg-green-50 border border-green-300 rounded-full flex items-center justify-center text-gray-500 hover:text-green-800 hover:border-green-400 transition-all group-hover:scale-110"
                            >
                                <ReiconCamera className="w-5 h-5" />
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
                            <h2 className="text-2xl font-bold text-gray-900">
                                {form.firstName} {form.lastName}
                            </h2>
                            <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
                                <span className="px-3 py-1 bg-green-400/10 text-green-800 text-sm font-medium rounded-full flex items-center gap-1.5">
                                    <ReiconShieldCheck className="w-5 h-5" />
                                    Administrator
                                </span>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="flex gap-4 text-center">
                            <div className="px-4 py-2 bg-green-50 rounded-xl border border-green-300">
                                <p className="text-2xl font-bold text-gray-900">12</p>
                                <p className="text-xs text-gray-500">Events</p>
                            </div>
                            <div className="px-4 py-2 bg-green-50 rounded-xl border border-green-300">
                                <p className="text-2xl font-bold text-gray-900">48</p>
                                <p className="text-xs text-gray-500">Actions</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Profile Form */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Personal Information */}
                <div className="lg:col-span-2 bg-white border border-green-300 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <ReiconUser className="w-5 h-5" />
                        Personal Information
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* First Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-2">First Name</label>
                            <input
                                type="text"
                                value={form.firstName}
                                onChange={(e) => setForm({ ...form, firstName: sanitizeInput(e.target.value) })}
                                className="w-full bg-green-50 border border-green-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-200 transition-all"
                                placeholder="Enter first name"
                            />
                        </div>

                        {/* Last Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-500 mb-2">Last Name</label>
                            <input
                                type="text"
                                value={form.lastName}
                                onChange={(e) => setForm({ ...form, lastName: sanitizeInput(e.target.value) })}
                                className="w-full bg-green-50 border border-green-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-200 transition-all"
                                placeholder="Enter last name"
                            />
                        </div>

                        {/* Email */}
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-500 mb-2">Email Address</label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                                    <ReiconEnvelope className="w-5 h-5" />
                                </div>
                                <input
                                    type="email"
                                    value={form.email}
                                    readOnly
                                    className="w-full bg-green-50/50 border border-green-300 rounded-xl pl-12 pr-4 py-3 text-gray-500 cursor-not-allowed"
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
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-300 via-green-400 to-green-500 hover:shadow-lg hover:shadow-green-400/25 text-gray-900 font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-300/50"
                        >
                            <ReiconSave className="w-5 h-5" />
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>

                {/* Account Info Sidebar */}
                <div className="space-y-6">
                    {/* Account Status */}
                    <div className="bg-white border border-green-300 rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Account Status</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-500">Status</span>
                                <span className="flex items-center gap-1.5 text-green-800">
                                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                    Active
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-500">Role</span>
                                <span className="text-gray-900 capitalize">{user?.role || 'Admin'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-500">Verified</span>
                                <span className="text-green-800">Yes</span>
                            </div>
                        </div>
                    </div>

                    {/* Activity Log */}
                    <div className="bg-white border border-green-300 rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <ReiconCalendar className="w-5 h-5" />
                            Recent Activity
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-start gap-3 text-sm">
                                <div className="w-2 h-2 bg-green-400 rounded-full mt-1.5 flex-shrink-0"></div>
                                <div>
                                    <p className="text-gray-700">Logged in</p>
                                    <p className="text-gray-500 text-xs">Today, 10:30 AM</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 text-sm">
                                <div className="w-2 h-2 bg-blue-400 rounded-full mt-1.5 flex-shrink-0"></div>
                                <div>
                                    <p className="text-gray-700">Updated event</p>
                                    <p className="text-gray-500 text-xs">Yesterday, 3:45 PM</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 text-sm">
                                <div className="w-2 h-2 bg-yellow-400 rounded-full mt-1.5 flex-shrink-0"></div>
                                <div>
                                    <p className="text-gray-700">Created new user</p>
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
