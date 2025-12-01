import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LogoutModal from './common/LogoutModal';

const Header = () => {
    const { user, logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        setIsMenuOpen(false);
        setShowUserMenu(false);
    }, [location]);

    const handleLogout = () => {
        logout();
        setShowLogoutModal(false);
        navigate('/');
    };

    const navLinks = [
        { path: '/', label: 'Home' },
        { path: '/animals', label: 'Animals' },
        { path: '/events', label: 'Events' },
        { path: '/map', label: 'Map' },
        { path: '/about', label: 'About Us' }
    ];

    return (
        <>
        <header className="bg-white/70 backdrop-blur-sm shadow-lg sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4">
                <div className="flex justify-between items-center">
                    <Link to="/" className="flex items-center gap-3">
                        <div className="p-3 rounded-full bg-gradient-to-r from-green-600 to-teal-500 shadow-md flex items-center justify-center">
                            <img
                                src="https://cdn-icons-png.flaticon.com/128/5068/5068980.png"
                                alt="Logo"
                                className="w-6 h-6 invert brightness-0 filter"
                            />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-green-800">Bulusan Wildlife</h1>
                            <p className="text-green-700 text-sm">AI-Powered Nature Park</p>
                        </div>
                    </Link>

                    <nav className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.label}
                                to={link.path}
                                className={`font-medium transition relative ${location.pathname === link.path ? 'text-green-600 font-bold' : 'text-[#2D5A27] hover:text-green-600'}`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    <div className="hidden md:flex items-center gap-4">
                        <Link to="/tickets">
                            <button className="bg-gradient-to-r from-green-600 to-teal-600 px-5 py-2 rounded-lg text-white font-semibold flex items-center gap-2 hover:opacity-90 transition shadow-sm">
                                <img src="https://cdn-icons-png.flaticon.com/128/3916/3916655.png" alt="Ticket" className="w-4 h-4 invert brightness-0 filter" />
                                <span>Buy Tickets</span>
                            </button>
                        </Link>

                        {user ? (
                            <div className="relative">
                                <button
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-50 border border-green-200 hover:bg-green-100 transition"
                                >
                                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
                                        {user.firstName?.charAt(0).toUpperCase() || user.username?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <span className="font-medium text-green-800">{user.firstName || user.username}</span>
                                    <svg className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {showUserMenu && (
                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 animate-fade-in">
                                        <div className="px-4 py-3 border-b border-gray-100">
                                            <p className="text-sm text-gray-500">Signed in as</p>
                                            <p className="font-medium text-gray-800 truncate">{user.email}</p>
                                        </div>
                                            <Link
                                                to={(() => {
                                                    if (!user) return '/login';
                                                    if (user.role === 'admin') return '/admin/profile';
                                                    if (user.role === 'staff' || user.role === 'vet') return '/staff/profile';
                                                    return '/profile';
                                                })()}
                                                className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-green-50 transition"
                                            >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                            <span>My Profile</span>
                                        </Link>
                                            <Link
                                                to={user && user.role === 'user' ? '/my-tickets' : '/ticket-history'}
                                                className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-green-50 transition"
                                            >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                                            </svg>
                                            <span>My Tickets</span>
                                        </Link>
                                        <hr className="my-2" />
                                        <button
                                            onClick={() => {
                                                setShowUserMenu(false);
                                                setShowLogoutModal(true);
                                            }}
                                            className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition w-full"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                            </svg>
                                            <span>Logout</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link to="/login">
                                <button className="px-5 py-2 rounded-lg text-green-800 font-medium bg-white hover:bg-green-50 transition border border-green-300 flex items-center gap-2">
                                        <img src="https://cdn-icons-png.flaticon.com/128/15005/15005336.png" alt="Login" className="w-4 h-4" />
                                    <span>Login</span>
                                </button>
                            </Link>
                        )}
                    </div>

                    <button
                        className="md:hidden p-2 text-green-800"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        <img
                            src={isMenuOpen ? "/icons/close.svg" : "/icons/menu.svg"}
                            alt="Menu"
                            className="w-8 h-8"
                        />
                    </button>
                </div>

                {isMenuOpen && (
                    <div className="md:hidden pt-4 pb-2 border-t border-gray-100 mt-4 animate-fade-in">
                        <div className="flex flex-col gap-4">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.label}
                                    to={link.path}
                                    className="text-[#2D5A27] font-medium py-2 px-4 hover:bg-green-50 rounded-lg"
                                >
                                    {link.label}
                                </Link>
                            ))}
                            <hr className="border-gray-100 my-2" />
                            <Link to="/tickets" className="flex items-center gap-2 text-[#2D5A27] font-medium py-2 px-4 hover:bg-green-50 rounded-lg">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                                </svg>
                                <span>Buy Tickets</span>
                            </Link>
                            {user ? (
                                <>
                                    <div className="px-4 py-2 flex items-center gap-2 text-green-800 font-medium">
                                        <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
                                            {user.fullName?.charAt(0).toUpperCase() || 'U'}
                                        </div>
                                        <span>{user.fullName}</span>
                                    </div>
                                    <Link
                                        to={(() => {
                                            if (!user) return '/login';
                                            if (user.role === 'admin') return '/admin/profile';
                                            if (user.role === 'staff' || user.role === 'vet') return '/staff/profile';
                                            return '/profile';
                                        })()}
                                        className="flex items-center gap-2 text-[#2D5A27] font-medium py-2 px-4 hover:bg-green-50 rounded-lg"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        <span>My Profile</span>
                                    </Link>
                                    <Link
                                        to={user && user.role === 'user' ? '/my-tickets' : '/ticket-history'}
                                        className="flex items-center gap-2 text-[#2D5A27] font-medium py-2 px-4 hover:bg-green-50 rounded-lg"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                                        </svg>
                                        <span>My Tickets</span>
                                    </Link>
                                    <button
                                        onClick={() => setShowLogoutModal(true)}
                                        className="w-full text-left flex items-center gap-2 text-red-600 font-medium py-2 px-4 hover:bg-red-50 rounded-lg"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                        <span>Logout</span>
                                    </button>
                                </>
                            ) : (
                                <Link to="/login" className="flex items-center gap-2 text-[#2D5A27] font-medium py-2 px-4 hover:bg-green-50 rounded-lg">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                    </svg>
                                    <span>Login</span>
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </header>
        
        <LogoutModal
            isOpen={showLogoutModal}
            onClose={() => setShowLogoutModal(false)}
            onConfirm={handleLogout}
            userName={user?.firstName || user?.username || 'User'}
        />
    </>
    );
};

export default Header;