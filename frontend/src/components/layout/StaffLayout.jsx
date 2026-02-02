import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api-client';
import { sanitizeInput } from '../../utils/sanitize';
import LogoutModal from '../common/LogoutModal';

// Icons matching Admin design system
const OverviewIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <rect x="3" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/>
    </svg>
);

const EventsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
);

const TicketsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
        <path d="M13 5v2"/>
        <path d="M13 17v2"/>
        <path d="M13 11v2"/>
    </svg>
);

const UsersIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
);

const AnimalsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" className="w-5 h-5">
        <path d="M226.5 92.9c14.3 42.9-.3 86.2-32.6 96.8s-70.1-15.6-84.4-58.5s.3-86.2 32.6-96.8s70.1 15.6 84.4 58.5zM100.4 198.6c18.9 32.4 14.3 70.1-10.2 84.1s-59.7-.9-78.5-33.3S-2.7 179.3 21.8 165.3s59.7 .9 78.5 33.3zM69.2 401.2C121.6 259.9 214.7 224 256 224s134.4 35.9 186.8 177.2c3.6 9.7 5.2 20.1 5.2 30.5v1.6c0 25.8-20.9 46.7-46.7 46.7c-11.5 0-22.9-1.4-34-4.2l-88-22c-15.3-3.8-31.3-3.8-46.6 0l-88 22c-11.1 2.8-22.5 4.2-34 4.2C84.9 480 64 459.1 64 433.3v-1.6c0-10.4 1.6-20.8 5.2-30.5zM421.8 282.7c-24.5-14-29.1-51.7-10.2-84.1s54-47.3 78.5-33.3s29.1 51.7 10.2 84.1s-54 47.3-78.5 33.3zM310.1 189.7c-32.3-10.6-46.9-53.9-32.6-96.8s52.1-69.1 84.4-58.5s46.9 53.9 32.6 96.8s-52.1 69.1-84.4 58.5z"/>
    </svg>
);

const ScannerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
        <path d="M17 3h2a2 2 0 0 1 2 2v2"/>
        <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
        <path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
        <rect x="7" y="7" width="10" height="10" rx="1"/>
    </svg>
);

const LogoutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
        <polyline points="16 17 21 12 16 7"/>
        <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
);

const MenuIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <line x1="3" y1="12" x2="21" y2="12"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
);

const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <circle cx="11" cy="11" r="8"/>
        <path d="m21 21-4.3-4.3"/>
    </svg>
);

const BellIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
);

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
);

const PawIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" className="w-7 h-7">
        <path d="M226.5 92.9c14.3 42.9-.3 86.2-32.6 96.8s-70.1-15.6-84.4-58.5s.3-86.2 32.6-96.8s70.1 15.6 84.4 58.5zM100.4 198.6c18.9 32.4 14.3 70.1-10.2 84.1s-59.7-.9-78.5-33.3S-2.7 179.3 21.8 165.3s59.7 .9 78.5 33.3zM69.2 401.2C121.6 259.9 214.7 224 256 224s134.4 35.9 186.8 177.2c3.6 9.7 5.2 20.1 5.2 30.5v1.6c0 25.8-20.9 46.7-46.7 46.7c-11.5 0-22.9-1.4-34-4.2l-88-22c-15.3-3.8-31.3-3.8-46.6 0l-88 22c-11.1 2.8-22.5 4.2-34 4.2C84.9 480 64 459.1 64 433.3v-1.6c0-10.4 1.6-20.8 5.2-30.5zM421.8 282.7c-24.5-14-29.1-51.7-10.2-84.1s54-47.3 78.5-33.3s29.1 51.7 10.2 84.1s-54 47.3-78.5 33.3zM310.1 189.7c-32.3-10.6-46.9-53.9-32.6-96.8s52.1-69.1 84.4-58.5s46.9 53.9 32.6 96.8s-52.1 69.1-84.4 58.5z"/>
    </svg>
);

const StaffLayout = ({ children }) => {
    const { user, logout, updateUser } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [profileForm, setProfileForm] = useState({ firstName: '', lastName: '', email: '' });
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });
    const [previewImage, setPreviewImage] = useState(null);

    const [notifications] = useState([
        { id: 1, type: 'ticket', message: 'New ticket requires validation', time: 'Just now', read: false },
        { id: 2, type: 'user', message: 'User checked in at gate', time: '5 minutes ago', read: false },
        { id: 3, type: 'alert', message: 'Feeding schedule reminder', time: '1 hour ago', read: true },
    ]);

    const recentActivities = [
        { id: 1, icon: '🎫', message: '12 Tickets validated today', time: '5 Minutes ago', color: 'green' },
        { id: 2, icon: '📷', message: 'Scanner session started', time: '30 Minutes ago', color: 'blue' },
        { id: 3, icon: '🦁', message: 'Animal feeding completed', time: '1 Hour ago', color: 'yellow' },
    ];

    // Load profile data when modal opens
    const loadProfile = async () => {
        try {
            setProfileLoading(true);
            const res = await authAPI.getProfile('staff');
            if (res && res.success && res.user) {
                setProfileForm({
                    firstName: res.user.firstName || res.user.first_name || '',
                    lastName: res.user.lastName || res.user.last_name || '',
                    email: res.user.email || ''
                });
                if (res.user.profileImage || res.user.profile_image) {
                    setPreviewImage(res.user.profileImage || res.user.profile_image);
                }
            } else if (user) {
                setProfileForm({
                    firstName: user.firstName || user.first_name || '',
                    lastName: user.lastName || user.last_name || '',
                    email: user.email || ''
                });
            }
        } catch (err) {
            console.error('Error loading profile', err);
            setProfileMessage({ type: 'error', text: 'Failed to load profile' });
        } finally {
            setProfileLoading(false);
        }
    };

    // Save profile changes
    const saveProfile = async () => {
        setProfileSaving(true);
        setProfileMessage({ type: '', text: '' });
        try {
            const payload = { firstName: profileForm.firstName, lastName: profileForm.lastName };
            const res = await authAPI.updateProfile(payload, 'staff');
            if (res && res.success) {
                updateUser({ ...user, firstName: profileForm.firstName, lastName: profileForm.lastName });
                setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });
                setTimeout(() => setProfileMessage({ type: '', text: '' }), 3000);
            } else {
                setProfileMessage({ type: 'error', text: res.message || 'Failed to update profile' });
            }
        } catch (err) {
            console.error(err);
            setProfileMessage({ type: 'error', text: 'Error updating profile' });
        } finally {
            setProfileSaving(false);
        }
    };

    // Open profile modal
    const openProfileModal = () => {
        setShowProfileModal(true);
        loadProfile();
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Staff navigation menu items - matching required navigation
    const menuItems = [
        { path: '/staff/dashboard', label: 'Dashboard', Icon: OverviewIcon },
        { path: '/staff/events', label: 'Events', Icon: EventsIcon },
        { path: '/staff/tickets', label: 'Tickets', Icon: TicketsIcon },
        { path: '/staff/animals', label: 'Manage Animals', Icon: AnimalsIcon },
        { path: '/staff/users', label: 'Manage Users', Icon: UsersIcon },
        { path: '/staff/scanner', label: 'Ticket Scanner', Icon: ScannerIcon },
    ];

    const handleNavClick = () => {
        if (window.innerWidth < 1024) {
            setSidebarOpen(false);
        }
    };

    // Close sidebars on route change for mobile
    useEffect(() => {
        setSidebarOpen(false);
        setNotificationPanelOpen(false);
    }, [location.pathname]);

    // Close notification panel when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (notificationPanelOpen && !e.target.closest('.notification-panel') && !e.target.closest('.notification-bell')) {
                setNotificationPanelOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [notificationPanelOpen]);

    const getPageTitle = () => {
        const currentItem = menuItems.find(item => location.pathname === item.path);
        return currentItem?.label || 'Staff Portal';
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="flex h-screen bg-[#0a0a0a]">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/70 z-40 lg:hidden backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
            
            {/* Sidebar - matching Admin design system */}
            <aside 
                className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} 
                    fixed lg:relative z-50 w-72 lg:w-72 
                    bg-gradient-to-b from-[#0f1a0f] to-[#0a0a0a] 
                    text-white transition-transform duration-300 flex flex-col h-full
                    border-r border-[#1a2f1a]`}
            >
                {/* Logo Section */}
                <div className="p-6 flex items-center gap-4 border-b border-[#1a2f1a]">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#8cff65] to-[#4ade80] rounded-xl flex items-center justify-center text-[#0a0a0a] shadow-lg shadow-[#8cff65]/20">
                        <PawIcon />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg text-white">Staff Portal</h1>
                        <p className="text-xs text-gray-400">Zoo Bulusan Calapan</p>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden ml-auto p-2 hover:bg-white/10 rounded-lg"
                    >
                        <CloseIcon />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-6 px-4 overflow-y-auto">
                    <div className="space-y-2">
                        {menuItems.map(item => (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={handleNavClick}
                                className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${
                                    location.pathname === item.path
                                        ? 'bg-[#8cff65]/10 text-[#8cff65] border border-[#8cff65]/30'
                                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                }`}
                            >
                                <span className={`w-6 ${location.pathname === item.path ? 'text-[#8cff65]' : 'text-gray-500 group-hover:text-white'}`}>
                                    <item.Icon />
                                </span>
                                <span className="ml-3 font-medium">{item.label}</span>
                                {location.pathname === item.path && (
                                    <span className="ml-auto w-1.5 h-1.5 bg-[#8cff65] rounded-full"></span>
                                )}
                            </Link>
                        ))}
                    </div>
                </nav>

                {/* User Profile Section */}
                <div className="p-4 border-t border-[#1a2f1a]">
                    <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-white/5">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#8cff65] to-[#4ade80] rounded-full flex items-center justify-center font-bold text-[#0a0a0a]">
                            {user?.fullName?.charAt(0) || user?.firstName?.charAt(0) || 'S'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-white truncate">{user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Staff'}</p>
                            <p className="text-xs text-gray-400 capitalize">{user?.role || 'staff'}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowLogoutModal(true)}
                        className="w-full py-3 bg-gradient-to-r from-red-500/20 to-orange-500/20 
                            border border-red-500/30 rounded-xl font-medium 
                            text-red-400 hover:bg-red-500/30 transition flex items-center justify-center gap-2"
                    >
                        <LogoutIcon />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="bg-[#0f0f0f] border-b border-[#1a1a1a] px-4 lg:px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="p-2 hover:bg-white/10 rounded-xl lg:hidden text-white"
                            >
                                <MenuIcon />
                            </button>
                            <div className="hidden sm:block">
                                <h2 className="text-xl font-bold text-white">{getPageTitle()}</h2>
                                <p className="text-sm text-gray-400">
                                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            {/* Search */}
                            <div className="hidden md:flex items-center bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2">
                                <SearchIcon />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="ml-2 bg-transparent border-none outline-none text-white placeholder-gray-500 w-40 lg:w-60"
                                />
                            </div>

                            {/* Notifications */}
                            <button
                                onClick={() => setNotificationPanelOpen(!notificationPanelOpen)}
                                className="notification-bell relative p-2 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition"
                            >
                                <BellIcon />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#8cff65] text-[#0a0a0a] text-xs font-bold rounded-full flex items-center justify-center">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>

                            {/* Profile */}
                            <button
                                onClick={openProfileModal}
                                className="hidden sm:flex items-center gap-3 pl-3 border-l border-[#2a2a2a] hover:bg-white/5 px-3 py-2 rounded-xl transition"
                            >
                                <div className="w-9 h-9 bg-gradient-to-br from-[#8cff65] to-[#4ade80] rounded-full flex items-center justify-center font-bold text-[#0a0a0a] text-sm">
                                    {user?.fullName?.charAt(0) || user?.firstName?.charAt(0) || 'S'}
                                </div>
                                <div className="hidden lg:block text-left">
                                    <p className="text-sm font-medium text-white">{user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Staff'}</p>
                                    <p className="text-xs text-gray-400">View profile</p>
                                </div>
                            </button>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 overflow-auto p-4 lg:p-6 bg-[#0a0a0a]">
                    {children}
                </main>
            </div>

            {/* Notification Panel Overlay */}
            {notificationPanelOpen && (
                <div 
                    className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
                    onClick={() => setNotificationPanelOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Slide-in Notification Panel */}
            <aside
                className={`notification-panel fixed right-0 top-0 z-50 w-80 sm:w-96 h-full bg-[#141414] border-l border-[#2a2a2a] 
                    transform transition-transform duration-300 ease-in-out ${
                    notificationPanelOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
                aria-label="Notifications panel"
            >
                {/* Notifications Header */}
                <div className="p-5 flex items-center justify-between border-b border-[#2a2a2a]">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <BellIcon />
                        Notifications
                        {unreadCount > 0 && (
                            <span className="px-2 py-0.5 bg-[#8cff65]/20 text-[#8cff65] text-xs font-medium rounded-full">
                                {unreadCount} new
                            </span>
                        )}
                    </h3>
                    <button 
                        onClick={() => setNotificationPanelOpen(false)}
                        className="p-2 hover:bg-[#1e1e1e] rounded-lg text-gray-400 hover:text-white transition"
                    >
                        <CloseIcon />
                    </button>
                </div>

                {/* Notifications List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: 'calc(100vh - 280px)' }}>
                    {notifications.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <BellIcon />
                            <p className="mt-2">No notifications</p>
                        </div>
                    ) : (
                        notifications.map((notification) => (
                            <div 
                                key={notification.id}
                                className={`p-4 rounded-xl border transition-all cursor-pointer hover:border-[#8cff65]/30 ${
                                    notification.read 
                                        ? 'bg-[#1e1e1e] border-[#2a2a2a]' 
                                        : 'bg-[#8cff65]/5 border-[#8cff65]/20'
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${
                                        notification.read ? 'bg-gray-500' : 'bg-[#8cff65]'
                                    }`}></div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm ${notification.read ? 'text-gray-400' : 'text-white'}`}>
                                            {notification.message}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Activities Section */}
                <div className="border-t border-[#2a2a2a] p-4">
                    <h4 className="text-sm font-semibold text-white mb-3">Recent Activities</h4>
                    <div className="space-y-3">
                        {recentActivities.map((activity) => (
                            <div key={activity.id} className="flex items-center gap-3 text-sm">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                    activity.color === 'blue' ? 'bg-blue-500/20' :
                                    activity.color === 'green' ? 'bg-green-500/20' :
                                    'bg-yellow-500/20'
                                }`}>
                                    <span className={`text-xs ${
                                        activity.color === 'blue' ? 'text-blue-400' :
                                        activity.color === 'green' ? 'text-green-400' :
                                        'text-yellow-400'
                                    }`}>{activity.icon}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-gray-300 truncate">{activity.message}</p>
                                    <p className="text-xs text-gray-500">{activity.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Mark All Read Button */}
                <div className="border-t border-[#2a2a2a] p-4">
                    <button className="w-full py-2.5 bg-[#1e1e1e] hover:bg-[#2a2a2a] text-gray-400 hover:text-white rounded-xl text-sm font-medium transition">
                        Mark all as read
                    </button>
                </div>
            </aside>

            {/* Profile Modal */}
            {showProfileModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-5 border-b border-[#2a2a2a]">
                            <h2 className="text-xl font-bold text-white">Staff Profile</h2>
                            <button
                                onClick={() => setShowProfileModal(false)}
                                className="text-gray-400 hover:text-white transition"
                            >
                                <CloseIcon />
                            </button>
                        </div>

                        {profileLoading ? (
                            <div className="flex items-center justify-center p-12">
                                <div className="w-10 h-10 border-4 border-[#8cff65] border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : (
                            <div className="p-5 space-y-5">
                                {/* Success/Error Message */}
                                {profileMessage.text && (
                                    <div className={`flex items-center gap-3 p-3 rounded-xl border text-sm ${
                                        profileMessage.type === 'success' 
                                            ? 'bg-[#8cff65]/10 border-[#8cff65]/30 text-[#8cff65]' 
                                            : 'bg-red-500/10 border-red-500/30 text-red-400'
                                    }`}>
                                        <span>{profileMessage.text}</span>
                                    </div>
                                )}

                                {/* Avatar */}
                                <div className="flex justify-center">
                                    <div className="w-24 h-24 bg-gradient-to-br from-[#8cff65] to-[#4ade80] rounded-full flex items-center justify-center overflow-hidden">
                                        {previewImage ? (
                                            <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-4xl font-bold text-[#0a0a0a]">
                                                {profileForm.firstName?.charAt(0) || 'S'}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Role Badge */}
                                <div className="flex justify-center">
                                    <span className="px-4 py-1.5 bg-blue-500/10 text-blue-400 text-sm font-medium rounded-full">
                                        Staff Member
                                    </span>
                                </div>

                                {/* First Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">First Name</label>
                                    <input
                                        type="text"
                                        value={profileForm.firstName}
                                        onChange={(e) => setProfileForm({ ...profileForm, firstName: sanitizeInput(e.target.value) })}
                                        className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#8cff65] focus:ring-1 focus:ring-[#8cff65]/20 transition-all"
                                        placeholder="Enter first name"
                                    />
                                </div>

                                {/* Last Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Last Name</label>
                                    <input
                                        type="text"
                                        value={profileForm.lastName}
                                        onChange={(e) => setProfileForm({ ...profileForm, lastName: sanitizeInput(e.target.value) })}
                                        className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#8cff65] focus:ring-1 focus:ring-[#8cff65]/20 transition-all"
                                        placeholder="Enter last name"
                                    />
                                </div>

                                {/* Email (Read-only) */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
                                    <input
                                        type="email"
                                        value={profileForm.email}
                                        readOnly
                                        className="w-full bg-[#1e1e1e]/50 border border-[#2a2a2a] rounded-xl px-4 py-3 text-gray-400 cursor-not-allowed"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                                </div>

                                {/* Account Status */}
                                <div className="p-4 bg-[#1e1e1e] rounded-xl space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-400">Status</span>
                                        <span className="flex items-center gap-1.5 text-[#8cff65]">
                                            <div className="w-2 h-2 bg-[#8cff65] rounded-full animate-pulse"></div>
                                            Active
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-400">Role</span>
                                        <span className="text-white capitalize">{user?.role || 'Staff'}</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => setShowProfileModal(false)}
                                        className="flex-1 px-4 py-3 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white rounded-xl font-medium transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={saveProfile}
                                        disabled={profileSaving}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#8cff65] hover:bg-[#7ae857] text-black rounded-xl font-medium transition disabled:opacity-50"
                                    >
                                        {profileSaving ? (
                                            <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                                        ) : (
                                            'Save Changes'
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            <LogoutModal
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                onConfirm={handleLogout}
            />
        </div>
    );
};

export default StaffLayout;
