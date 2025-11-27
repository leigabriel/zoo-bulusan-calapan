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

const TicketIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
        <path d="M13 5v2"/>
        <path d="M13 17v2"/>
        <path d="M13 11v2"/>
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

const StaffLayout = ({ children }) => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/admin');
    };

    const menuItems = [
        { path: '/staff/dashboard', label: 'Dashboard', Icon: DashboardIcon },
        { path: '/staff/scanner', label: 'Ticket Scanner', Icon: TicketIcon }
    ];

    return (
        <div className="flex h-screen bg-gray-100">
            <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gradient-to-b from-teal-700 to-green-700 text-white transition-all duration-300 flex flex-col`}>
                <div className="p-4 flex items-center gap-3 border-b border-teal-600">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-teal-700">
                        <PawIcon />
                    </div>
                    {sidebarOpen && (
                        <div>
                            <h1 className="font-bold">Staff Portal</h1>
                            <p className="text-xs opacity-80">Zoo Bulusan</p>
                        </div>
                    )}
                </div>

                <nav className="flex-1 py-4">
                    {menuItems.map(item => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center px-4 py-3 mx-2 rounded-lg transition ${
                                location.pathname === item.path
                                    ? 'bg-white/20 border-l-4 border-yellow-400'
                                    : 'hover:bg-white/10'
                            }`}
                        >
                            <span className="w-6"><item.Icon /></span>
                            {sidebarOpen && <span className="ml-3">{item.label}</span>}
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-teal-600">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center font-bold text-green-900">
                            {user?.fullName?.charAt(0) || 'S'}
                        </div>
                        {sidebarOpen && (
                            <div>
                                <p className="font-medium">{user?.fullName}</p>
                                <p className="text-xs opacity-80 capitalize">{user?.role}</p>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => setShowLogoutModal(true)}
                        className="w-full py-2 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-lg font-medium hover:opacity-90 transition flex items-center justify-center gap-2"
                    >
                        {sidebarOpen ? (
                            <>
                                <LogoutIcon />
                                Logout
                            </>
                        ) : (
                            <LogoutIcon />
                        )}
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                        <MenuIcon />
                    </button>
                    <div className="flex items-center gap-4">
                        <span className="text-gray-600">Welcome, <strong>{user?.fullName}</strong></span>
                    </div>
                </header>

                <main className="flex-1 overflow-auto p-6">
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

export default StaffLayout;
