import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LogoutModal from './common/LogoutModal';

const Header = () => {
    const { user, logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showSidePanel, setShowSidePanel] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const sidePanelRef = useRef(null);

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
        // Check if we should open side panel from navigation state
        if (location.state?.openSidePanel) {
            setShowSidePanel(true);
            // Clear the state so it doesn't persist on refresh
            window.history.replaceState({}, document.title);
        } else {
            setShowSidePanel(false);
        }
    }, [location]);

    // Close side panel when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (sidePanelRef.current && !sidePanelRef.current.contains(event.target)) {
                setShowSidePanel(false);
            }
        };

        if (showSidePanel) {
            document.addEventListener('mousedown', handleClickOutside);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.body.style.overflow = 'unset';
        };
    }, [showSidePanel]);

    // Handle escape key to close panel
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') setShowSidePanel(false);
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, []);

    const handleLogout = () => {
        logout();
        setShowLogoutModal(false);
        navigate('/');
    };

    const navLinks = [
        { path: '/', label: 'Home' },
        { path: '/animals', label: 'Animals' },
        { path: '/events', label: 'Events' },
        { path: '/about', label: 'About' }
    ];

    const getProfilePath = () => {
        if (!user) return '/login';
        if (user.role === 'admin') return '/admin/profile';
        if (user.role === 'staff' || user.role === 'vet') return '/staff/profile';
        return '/profile';
    };

    const getTicketsPath = () => {
        return user && user.role === 'user' ? '/my-tickets' : '/ticket-history';
    };

    // Side panel menu items
    const sideMenuItems = [
        {
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            ),
            label: 'My Account',
            path: getProfilePath(),
            description: 'View and edit your profile'
        },
        {
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
            ),
            label: 'My Tickets',
            path: getTicketsPath(),
            description: 'View your ticket history'
        },
        {
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            label: 'Wildlife Origins 🌍',
            path: '/map',
            description: 'Explore where animals come from'
        },
        {
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            ),
            label: 'Settings',
            path: '/settings',
            description: 'Manage your preferences'
        }
    ];

    // Admin-specific menu items
    const adminMenuItems = user?.role === 'admin' ? [
        {
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
            ),
            label: 'Admin Dashboard',
            path: '/admin/dashboard',
            description: 'Access admin controls'
        }
    ] : [];

    // Staff-specific menu items
    const staffMenuItems = (user?.role === 'staff' || user?.role === 'vet') ? [
        {
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
            ),
            label: 'Staff Dashboard',
            path: '/staff/dashboard',
            description: 'Access staff controls'
        }
    ] : [];

    return (
        <>
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/20 shadow-md py-3 backdrop-blur-2xl' : 'bg-transparent py-5'}`}>
            <div className="container mx-auto px-6 lg:px-12">
                <div className="flex justify-between items-center">
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-200/50 flex items-center justify-center transition-transform group-hover:scale-105">
                            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                            </svg>
                        </div>
                        <span className={`text-xl font-bold tracking-tight transition-colors ${scrolled ? 'text-gray-900' : 'text-gray-800'}`}>
                            BULUSAN ZOO
                        </span>
                    </Link>

                    <nav className="hidden md:flex items-center gap-1 bg-white/80 backdrop-blur-md px-2 py-2 rounded-full shadow-sm border border-gray-100">
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
                            <button
                                onClick={() => setShowSidePanel(true)}
                                aria-label="Open account menu"
                                className="flex items-center gap-2 px-3 py-2 rounded-full bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-all duration-200 touch-target"
                            >
                                <img 
                                    src={(user.profileImage || user.profile_image) 
                                        ? ((user.profileImage || user.profile_image).startsWith('http') 
                                            ? (user.profileImage || user.profile_image) 
                                            : `/profile-img/${user.profileImage || user.profile_image}`)
                                        : '/profile-img/default-avatar.svg'
                                    } 
                                    alt="Profile" 
                                    className="w-8 h-8 rounded-full object-cover shadow-sm"
                                    onError={(e) => { e.target.onerror = null; e.target.src = '/profile-img/default-avatar.svg'; }}
                                />
                                <span className="font-medium text-gray-700 text-sm hidden lg:block">{user.firstName || user.username}</span>
                                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
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
                                <button
                                    onClick={() => {
                                        setIsMenuOpen(false);
                                        setShowSidePanel(true);
                                    }}
                                    className="flex items-center gap-3 bg-gray-50 font-medium py-3 px-4 rounded-xl text-sm mt-2"
                                >
                                    <img 
                                        src={(user.profileImage || user.profile_image) 
                                            ? ((user.profileImage || user.profile_image).startsWith('http') 
                                                ? (user.profileImage || user.profile_image) 
                                                : `/profile-img/${user.profileImage || user.profile_image}`)
                                            : '/profile-img/default-avatar.svg'
                                        } 
                                        alt="Profile" 
                                        className="w-10 h-10 rounded-full object-cover shadow-sm"
                                        onError={(e) => { e.target.onerror = null; e.target.src = '/profile-img/default-avatar.svg'; }}
                                    />
                                    <div className="flex-1 text-left">
                                        <span className="font-medium text-gray-800 block">{user.firstName || user.username}</span>
                                        <span className="text-xs text-gray-500">Tap to view account</span>
                                    </div>
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
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

        {/* Side Panel Overlay */}
        {showSidePanel && (
            <div className="fixed inset-0 z-[100] flex justify-end">
                {/* Backdrop */}
                <div 
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
                    onClick={() => setShowSidePanel(false)}
                />
                
                {/* Side Panel */}
                <div 
                    ref={sidePanelRef}
                    className="relative w-full max-w-sm sm:max-w-md bg-white h-full shadow-2xl animate-slide-in-right overflow-hidden flex flex-col"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="side-panel-title"
                >
                    {/* Panel Header */}
                    <div className="p-4 sm:p-6 border-b border-gray-100 bg-gradient-to-br from-emerald-500 to-teal-600">
                        <div className="flex items-center justify-between mb-4">
                            <h2 id="side-panel-title" className="text-lg font-semibold text-white">Account</h2>
                            <button
                                onClick={() => setShowSidePanel(false)}
                                className="p-2 hover:bg-white/20 rounded-xl transition-colors text-white"
                                aria-label="Close panel"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        {/* User Info */}
                        {user && (
                            <div className="flex items-center gap-3">
                                <img 
                                    src={(user.profileImage || user.profile_image) 
                                        ? ((user.profileImage || user.profile_image).startsWith('http') 
                                            ? (user.profileImage || user.profile_image) 
                                            : `/profile-img/${user.profileImage || user.profile_image}`)
                                        : '/profile-img/default-avatar.svg'
                                    } 
                                    alt="Profile" 
                                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover shadow-lg"
                                    onError={(e) => { e.target.onerror = null; e.target.src = '/profile-img/default-avatar.svg'; }}
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-white text-base sm:text-lg truncate">
                                        {user.firstName || user.username}
                                    </p>
                                    <p className="text-emerald-100 text-xs sm:text-sm truncate">{user.email}</p>
                                    <span className="inline-block mt-1 px-2 py-0.5 bg-white/20 rounded-full text-xs text-white capitalize">
                                        {user.role}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Panel Content */}
                    <div className="flex-1 overflow-y-auto p-3 sm:p-4">
                        {/* Admin/Staff Quick Access */}
                        {(adminMenuItems.length > 0 || staffMenuItems.length > 0) && (
                            <div className="mb-4">
                                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2 px-2">Quick Access</p>
                                <div className="space-y-1">
                                    {[...adminMenuItems, ...staffMenuItems].map((item, index) => (
                                        <Link
                                            key={index}
                                            to={item.path}
                                            onClick={() => setShowSidePanel(false)}
                                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-emerald-50 transition-all duration-200 group"
                                        >
                                            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                                {item.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-800 text-sm">{item.label}</p>
                                                <p className="text-xs text-gray-500 truncate">{item.description}</p>
                                            </div>
                                            <svg className="w-4 h-4 text-gray-400 group-hover:text-emerald-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                            </svg>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Main Menu Items */}
                        <div className="mb-4">
                            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2 px-2">Menu</p>
                            <div className="space-y-1">
                                {sideMenuItems.map((item, index) => (
                                    <Link
                                        key={index}
                                        to={item.path}
                                        onClick={() => setShowSidePanel(false)}
                                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all duration-200 group"
                                    >
                                        <div className="w-10 h-10 bg-gray-100 text-gray-600 rounded-xl flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                                            {item.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-800 text-sm">{item.label}</p>
                                            <p className="text-xs text-gray-500 truncate">{item.description}</p>
                                        </div>
                                        <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                        </svg>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* AI Features */}
                        <div className="mb-4">
                            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2 px-2">AI Features</p>
                            <Link
                                to="/classifier"
                                onClick={() => setShowSidePanel(false)}
                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-purple-50 transition-all duration-200 group"
                            >
                                <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-colors">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-800 text-sm">AI Animal Scanner</p>
                                    <p className="text-xs text-gray-500 truncate">Identify animals with AI</p>
                                </div>
                                <span className="px-2 py-0.5 bg-purple-100 text-purple-600 rounded-full text-xs font-medium">New</span>
                            </Link>
                        </div>
                    </div>

                    {/* Panel Footer */}
                    <div className="p-3 sm:p-4 border-t border-gray-100 bg-gray-50">
                        {/* Help Link */}
                        <Link
                            to="/help"
                            onClick={() => setShowSidePanel(false)}
                            className="w-full flex items-center justify-center gap-2 p-3 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors font-medium text-sm mb-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Help Center</span>
                        </Link>
                        <button
                            onClick={() => {
                                setShowSidePanel(false);
                                setShowLogoutModal(true);
                            }}
                            className="w-full flex items-center justify-center gap-2 p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium text-sm"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span>Sign Out</span>
                        </button>
                    </div>
                </div>
            </div>
        )}
        
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