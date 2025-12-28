import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LogoutModal from './common/LogoutModal';

const Header = () => {
    const { user, logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Track scroll position for header styling
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

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
        { path: '/about', label: 'About' }
    ];

    return (
        <>
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-md py-3' : 'bg-transparent py-5'}`}>
            <div className="container mx-auto px-6 lg:px-12">
                <div className="flex justify-between items-center">
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-200/50 flex items-center justify-center transition-transform group-hover:scale-105">
                            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                            </svg>
                        </div>
                        <span className={`text-xl font-bold tracking-tight transition-colors ${scrolled ? 'text-gray-900' : 'text-gray-800'}`}>
                            Bulusan
                        </span>
                    </Link>

                    <nav className="hidden md:flex items-center gap-1 bg-white/80 backdrop-blur-sm px-2 py-2 rounded-full shadow-sm border border-gray-100">
                        {navLinks.map((link) => (
                            <Link
                                key={link.label}
                                to={link.path}
                                className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                                    location.pathname === link.path 
                                        ? 'bg-gray-900 text-white shadow-sm' 
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    <div className="hidden md:flex items-center gap-3">
                        <Link to="/tickets">
                            <button className="bg-gray-900 hover:bg-gray-800 px-6 py-2.5 rounded-full text-white text-sm font-semibold flex items-center gap-2 transition-all duration-200 shadow-lg shadow-gray-900/20 hover:shadow-xl hover:shadow-gray-900/30 hover:-translate-y-0.5">
                                <span>Buy Tickets</span>
                            </button>
                        </Link>

                        {user ? (
                            <div className="relative">
                                <button
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    onKeyDown={(e) => e.key === 'Escape' && setShowUserMenu(false)}
                                    aria-haspopup="true"
                                    aria-expanded={showUserMenu}
                                    className="flex items-center gap-2 px-3 py-2 rounded-full bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-all duration-200 touch-target"
                                >
                                    <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm">
                                        {user.firstName?.charAt(0).toUpperCase() || user.username?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <span className="font-medium text-gray-700 text-sm">{user.firstName || user.username}</span>
                                    <svg className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {showUserMenu && (
                                    <div 
                                        className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-fade-in"
                                        role="menu"
                                        aria-orientation="vertical"
                                    >
                                        <div className="px-4 py-3 border-b border-gray-100">
                                            <p className="text-xs text-gray-500 uppercase tracking-wide">Signed in as</p>
                                            <p className="font-medium text-gray-800 truncate text-sm mt-1">{user.email}</p>
                                        </div>
                                            <Link
                                                to={(() => {
                                                    if (!user) return '/login';
                                                    if (user.role === 'admin') return '/admin/profile';
                                                    if (user.role === 'staff' || user.role === 'vet') return '/staff/profile';
                                                    return '/profile';
                                                })()}
                                                className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                                            >
                                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                            <span className="text-sm">My Profile</span>
                                        </Link>
                                            <Link
                                                to={user && user.role === 'user' ? '/my-tickets' : '/ticket-history'}
                                                className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                                            >
                                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                                            </svg>
                                            <span className="text-sm">My Tickets</span>
                                        </Link>
                                        <hr className="my-2 border-gray-100" />
                                        <button
                                            onClick={() => {
                                                setShowUserMenu(false);
                                                setShowLogoutModal(true);
                                            }}
                                            className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors w-full"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                            </svg>
                                            <span className="text-sm">Logout</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link to="/login">
                                <button className="px-5 py-2.5 rounded-full text-gray-700 text-sm font-medium bg-white hover:bg-gray-50 transition-all duration-200 border border-gray-200 flex items-center gap-2 shadow-sm">
                                    <span>Login</span>
                                </button>
                            </Link>
                        )}
                    </div>

                    <button
                        className="md:hidden p-2.5 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors touch-target"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                        aria-expanded={isMenuOpen}
                    >
                        {isMenuOpen ? (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        )}
                    </button>
                </div>

                {isMenuOpen && (
                    <div className="md:hidden pt-6 pb-4 mt-4 animate-fade-in bg-white rounded-2xl shadow-lg border border-gray-100 -mx-2 px-4">
                        <div className="flex flex-col gap-1">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.label}
                                    to={link.path}
                                    className={`font-medium py-3 px-4 rounded-xl transition-colors text-sm ${
                                        location.pathname === link.path 
                                            ? 'bg-gray-900 text-white' 
                                            : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    {link.label}
                                </Link>
                            ))}
                            <hr className="border-gray-100 my-3" />
                            <Link to="/tickets" className="flex items-center justify-center gap-2 bg-gray-900 text-white font-medium py-3 px-4 rounded-xl text-sm">
                                <span>Buy Tickets</span>
                            </Link>
                            {user ? (
                                <>
                                    <div className="px-4 py-3 flex items-center gap-3 bg-gray-50 rounded-xl">
                                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold shadow-sm">
                                            {user.fullName?.charAt(0).toUpperCase() || 'U'}
                                        </div>
                                        <span className="font-medium text-gray-800 text-sm">{user.fullName}</span>
                                    </div>
                                    <Link
                                        to={(() => {
                                            if (!user) return '/login';
                                            if (user.role === 'admin') return '/admin/profile';
                                            if (user.role === 'staff' || user.role === 'vet') return '/staff/profile';
                                            return '/profile';
                                        })()}
                                        className="flex items-center gap-3 text-gray-600 font-medium py-3 px-4 hover:bg-gray-50 rounded-xl text-sm"
                                    >
                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        <span>My Profile</span>
                                    </Link>
                                    <Link
                                        to={user && user.role === 'user' ? '/my-tickets' : '/ticket-history'}
                                        className="flex items-center gap-3 text-gray-600 font-medium py-3 px-4 hover:bg-gray-50 rounded-xl text-sm"
                                    >
                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                                        </svg>
                                        <span>My Tickets</span>
                                    </Link>
                                    <button
                                        onClick={() => setShowLogoutModal(true)}
                                        className="w-full text-left flex items-center gap-3 text-red-600 font-medium py-3 px-4 hover:bg-red-50 rounded-xl text-sm"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                        <span>Logout</span>
                                    </button>
                                </>
                            ) : (
                                <Link to="/login" className="flex items-center justify-center gap-2 text-gray-600 font-medium py-3 px-4 hover:bg-gray-50 rounded-xl border border-gray-200 text-sm">
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