import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LogoutModal from '../common/LogoutModal';

// Icons
const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <circle cx="11" cy="11" r="8"/>
        <path d="m21 21-4.3-4.3"/>
    </svg>
);

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

const AnalyticsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
);

const ReportsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
);

const HelpIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="12" cy="12" r="10"/>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
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

const AdminLayout = ({ children }) => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Mock notifications - replace with real data from your API
    const [notifications] = useState([
        { id: 1, type: 'user', message: '56 New users registered.', time: 'Just now', read: false },
        { id: 2, type: 'ticket', message: '132 Tickets purchased.', time: '59 Minutes ago', read: false },
        { id: 3, type: 'alert', message: 'System maintenance scheduled.', time: '2 Hours ago', read: true },
        { id: 4, type: 'message', message: '5 Unread messages.', time: 'Today, 11:59 PM', read: true },
    ]);

    const handleLogout = () => {
        logout();
        navigate('/admin');
    };

    const menuItems = [
        { path: '/admin/dashboard', label: 'Overview', Icon: OverviewIcon },
        { path: '/admin/events', label: 'Events', Icon: EventsIcon },
        { path: '/admin/tickets', label: 'Tickets', Icon: TicketsIcon },
        { path: '/admin/users', label: 'Manage Users', Icon: UsersIcon },
        { path: '/admin/analytics', label: 'Analytics', Icon: AnalyticsIcon },
        { path: '/admin/reports', label: 'Reports', Icon: ReportsIcon },
    ];

    const handleNavClick = () => {
        if (window.innerWidth < 1024) {
            setSidebarOpen(false);
        }
    };

    // Close sidebars on route change for mobile
    useEffect(() => {
        setSidebarOpen(false);
        setRightSidebarOpen(false);
    }, [location.pathname]);

    return (
        <div className="flex h-screen bg-[#0a0a0a] overflow-hidden">
            {/* Mobile overlay for left sidebar */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Mobile overlay for right sidebar */}
            {rightSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 z-40 xl:hidden backdrop-blur-sm"
                    onClick={() => setRightSidebarOpen(false)}
                    aria-hidden="true"
                />
            )}
            
            {/* Left Sidebar */}
            <aside 
                className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} 
                    fixed lg:relative z-50 lg:z-auto w-64 bg-[#141414] border-r border-[#2a2a2a] 
                    transition-transform duration-300 flex flex-col h-full`}
                aria-label="Admin navigation"
            >
                {/* Logo Section */}
                <div className="p-5 flex items-center gap-3 border-b border-[#2a2a2a]">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#8cff65] to-[#4ade80] rounded-xl flex items-center justify-center text-[#0a0a0a]">
                        <PawIcon />
                    </div>
                    <div>
                        <h1 className="font-bold text-white text-lg">Zoo Bulusan</h1>
                        <p className="text-xs text-gray-500">Admin Panel</p>
                    </div>
                    <button 
                        onClick={() => setSidebarOpen(false)}
                        className="ml-auto lg:hidden text-gray-400 hover:text-white"
                    >
                        <CloseIcon />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="p-4">
                    <div className="relative">
                        <SearchIcon />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl py-2.5 pl-10 pr-4 
                                text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#8cff65] 
                                focus:ring-1 focus:ring-[#8cff65]/20 transition-all"
                        />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                            <SearchIcon />
                        </div>
                        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-1 
                            px-2 py-0.5 text-xs text-gray-500 bg-[#2a2a2a] rounded border border-[#3a3a3a]">
                            ⌘K
                        </kbd>
                    </div>
                </div>

                {/* Navigation Menu */}
                <nav className="flex-1 px-3 py-2 overflow-y-auto" role="navigation">
                    <p className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Dashboards
                    </p>
                    {menuItems.map(item => (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={handleNavClick}
                            className={`flex items-center gap-3 px-3 py-2.5 mb-1 rounded-xl transition-all duration-200 group ${
                                location.pathname === item.path
                                    ? 'bg-[#8cff65]/10 text-[#8cff65] border-l-2 border-[#8cff65]'
                                    : 'text-gray-400 hover:bg-[#1e1e1e] hover:text-white'
                            }`}
                            aria-current={location.pathname === item.path ? 'page' : undefined}
                        >
                            <span className={`transition-colors ${
                                location.pathname === item.path ? 'text-[#8cff65]' : 'text-gray-500 group-hover:text-white'
                            }`}>
                                <item.Icon />
                            </span>
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    ))}
                </nav>

                {/* Bottom Section - Help & Logout */}
                <div className="p-4 border-t border-[#2a2a2a] space-y-2">
                    <Link
                        to="/admin/help"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:bg-[#1e1e1e] hover:text-white transition-all"
                    >
                        <HelpIcon />
                        <span className="font-medium">Help Center</span>
                    </Link>
                    
                    {/* User Profile Card */}
                    <div className="flex items-center gap-3 p-3 bg-[#1e1e1e] rounded-xl mt-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#8cff65] to-[#4ade80] rounded-full flex items-center justify-center font-bold text-[#0a0a0a]">
                            {user?.fullName?.charAt(0) || user?.firstName?.charAt(0) || 'A'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-white truncate">{user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`}</p>
                            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowLogoutModal(true)}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-red-600 to-red-500 
                            hover:from-red-500 hover:to-red-400 rounded-xl font-medium text-white transition-all duration-200 
                            shadow-lg shadow-red-500/20"
                        aria-label="Logout from admin panel"
                    >
                        <LogoutIcon />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Header */}
                <header className="bg-[#141414] border-b border-[#2a2a2a] px-4 lg:px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 hover:bg-[#1e1e1e] rounded-xl text-gray-400 hover:text-white transition lg:hidden"
                            aria-label={sidebarOpen ? 'Close sidebar menu' : 'Open sidebar menu'}
                            aria-expanded={sidebarOpen}
                        >
                            <MenuIcon />
                        </button>
                        <div>
                            <h2 className="text-xl font-bold text-white">
                                {menuItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
                            </h2>
                            <p className="text-sm text-gray-500">
                                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Notification Bell - Mobile toggle for right sidebar */}
                        <button
                            onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
                            className="relative p-2 hover:bg-[#1e1e1e] rounded-xl text-gray-400 hover:text-white transition xl:hidden"
                            aria-label="Toggle notifications"
                        >
                            <BellIcon />
                            {notifications.some(n => !n.read) && (
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#8cff65] rounded-full"></span>
                            )}
                        </button>

                        {/* Profile Button */}
                        <button
                            onClick={() => navigate('/admin/profile')}
                            className="flex items-center gap-3 hover:bg-[#1e1e1e] px-3 py-2 rounded-xl transition"
                        >
                            <div className="w-9 h-9 bg-gradient-to-br from-[#8cff65] to-[#4ade80] rounded-full flex items-center justify-center text-[#0a0a0a] font-bold">
                                {(user?.firstName || user?.lastName || user?.fullName)?.charAt(0) || 'A'}
                            </div>
                            <div className="text-left hidden md:block">
                                <div className="text-sm text-white font-medium">{user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`}</div>
                                <div className="text-xs text-gray-500">View profile</div>
                            </div>
                        </button>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 overflow-auto p-4 lg:p-6 bg-[#0a0a0a]">
                    {children}
                </main>
            </div>

            {/* Right Sidebar - Notifications */}
            <aside
                className={`${rightSidebarOpen ? 'translate-x-0' : 'translate-x-full xl:translate-x-0'} 
                    fixed xl:relative right-0 z-50 xl:z-auto w-80 bg-[#141414] border-l border-[#2a2a2a] 
                    transition-transform duration-300 flex flex-col h-full`}
                aria-label="Notifications panel"
            >
                {/* Notifications Header */}
                <div className="p-5 flex items-center justify-between border-b border-[#2a2a2a]">
                    <h3 className="text-lg font-bold text-white">Notifications</h3>
                    <button 
                        onClick={() => setRightSidebarOpen(false)}
                        className="xl:hidden text-gray-400 hover:text-white"
                    >
                        <CloseIcon />
                    </button>
                </div>

                {/* Notifications List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {notifications.map((notification) => (
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
                    ))}
                </div>

                {/* Activities Section */}
                <div className="border-t border-[#2a2a2a] p-4">
                    <h4 className="text-sm font-semibold text-white mb-3">Recent Activities</h4>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm">
                            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                                <span className="text-blue-400 text-xs">📝</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-gray-300 truncate">Changed the dashboard style.</p>
                                <p className="text-xs text-gray-500">2 Minutes ago</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                                <span className="text-green-400 text-xs">✓</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-gray-300 truncate">177 New animals added.</p>
                                <p className="text-xs text-gray-500">57 Minutes ago</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                                <span className="text-yellow-400 text-xs">📦</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-gray-300 truncate">11 Products have been archived.</p>
                                <p className="text-xs text-gray-500">1 Day ago</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Contacts */}
                <div className="border-t border-[#2a2a2a] p-4">
                    <h4 className="text-sm font-semibold text-white mb-3">Quick Contacts</h4>
                    <div className="space-y-2">
                        {['Daniel Craig', 'Kate Morrison', 'Elisabeth Wayne'].map((name, index) => (
                            <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#1e1e1e] cursor-pointer transition">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-xs text-white
                                    ${index === 0 ? 'bg-purple-500' : index === 1 ? 'bg-pink-500' : 'bg-blue-500'}`}>
                                    {name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <span className="text-sm text-gray-300">{name}</span>
                                <div className="ml-auto flex gap-1">
                                    <span className="w-6 h-6 rounded bg-[#2a2a2a] flex items-center justify-center text-gray-400 text-xs hover:bg-[#8cff65] hover:text-black transition cursor-pointer">
                                        💬
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </aside>
            
            <LogoutModal
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                onConfirm={handleLogout}
            />
        </div>
    );
};

export default AdminLayout;
