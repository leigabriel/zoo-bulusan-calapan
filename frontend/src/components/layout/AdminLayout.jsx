import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LogoutModal from '../common/LogoutModal';

const DashboardIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <rect x="3" y="3" width="7" height="7"/>
        <rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/>
    </svg>
);

const ChartIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
);

const ReportIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
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

const PawIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.5-4.317.5-6 1.786 2.5 4.5 3.5 6.5 4.5 1 .5 2 1 2 2.5a2.5 2.5 0 0 1-2.5 2.5c-1.5 0-2.5-1-2.5-2.5 0-1.5 1.5-2 2-3-.5 1-2 2-3 2a2.5 2.5 0 0 0 2.5 2.5c1.5 0 2.5-1 2.5-2.5 0-.5-.5-1-1-1.5-.5-.5-1.5-.5-2 0-.5.5-.5 1.5 0 2s1.5.5 2 0"/>
    </svg>
);

const AdminLayout = ({ children }) => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/admin');
    };

    const menuItems = [
        { path: '/admin/dashboard', label: 'Dashboard', Icon: DashboardIcon },
        { path: '/admin/analytics', label: 'Animal Analytics', Icon: ChartIcon },
        { path: '/admin/reports', label: 'Reports', Icon: ReportIcon },
        { path: '/admin/users', label: 'Manage Users', Icon: UsersIcon }
    ];

    // Close sidebar when route changes on mobile
    const handleNavClick = () => {
        if (window.innerWidth < 768) {
            setSidebarOpen(false);
        }
    };

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                    aria-hidden="true"
                />
            )}
            
            {/* Sidebar */}
            <aside 
                className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} fixed md:relative z-50 md:z-auto w-64 md:w-64 bg-gradient-to-b from-green-800 to-teal-700 text-white transition-transform duration-300 flex flex-col h-full`}
                aria-label="Admin navigation"
            >
                <div className="p-4 flex items-center gap-3 border-b border-green-600">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-green-700">
                        <PawIcon />
                    </div>
                    {sidebarOpen && (
                        <div>
                            <h1 className="font-bold">Admin Panel</h1>
                            <p className="text-xs opacity-80">Zoo Bulusan</p>
                        </div>
                    )}
                </div>

                <nav className="flex-1 py-4" role="navigation">
                    {menuItems.map(item => (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={handleNavClick}
                            className={`flex items-center px-4 py-3 mx-2 rounded-lg transition touch-target ${
                                location.pathname === item.path
                                    ? 'bg-white/20 border-l-4 border-yellow-400'
                                    : 'hover:bg-white/10'
                            }`}
                            aria-current={location.pathname === item.path ? 'page' : undefined}
                        >
                            <span className="w-6"><item.Icon /></span>
                            <span className="ml-3">{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-green-600">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center font-bold text-green-900">
                            {user?.fullName?.charAt(0) || 'A'}
                        </div>
                        <div>
                            <p className="font-medium">{user?.fullName}</p>
                            <p className="text-xs opacity-80 capitalize">{user?.role}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowLogoutModal(true)}
                        className="w-full py-2 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-lg font-medium hover:opacity-90 transition flex items-center justify-center gap-2 touch-target"
                        aria-label="Logout from admin panel"
                    >
                        <LogoutIcon />
                        Logout
                    </button>
                </div>
            </aside>

            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white shadow-sm px-4 md:px-6 py-4 flex justify-between items-center">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 hover:bg-gray-100 rounded-lg touch-target"
                        aria-label={sidebarOpen ? 'Close sidebar menu' : 'Open sidebar menu'}
                        aria-expanded={sidebarOpen}
                    >
                        <MenuIcon />
                    </button>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/admin/profile')}
                            className="flex items-center gap-3 hover:bg-gray-50 px-3 py-2 rounded-md"
                        >
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold">
                                {(user?.firstName || user?.lastName || user?.fullName)?.charAt(0) || 'A'}
                            </div>
                            <div className="text-left hidden sm:block">
                                <div className="text-sm text-gray-700 font-medium">{user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`}</div>
                                <div className="text-xs text-gray-500">View profile</div>
                            </div>
                        </button>
                    </div>
                </header>

                <main className="flex-1 overflow-auto p-4 md:p-6">
                    {children}
                </main>
            </div>
            
            <LogoutModal
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                onConfirm={handleLogout}
            />
        </div>
    );
};

export default AdminLayout;
