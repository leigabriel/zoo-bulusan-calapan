import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProfileImageUrl, messageAPI, userAPI, reservationAPI } from '../services/api-client';
import LogoutModal from './common/LogoutModal';
import AnimalClassifier from './features/ai-scanner/AnimalClassifier';
import ReservationHistoryPanel from './features/ReservationHistoryPanel';

const Header = () => {
    const { user, logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showSidePanel, setShowSidePanel] = useState(false);
    const [showAIScanner, setShowAIScanner] = useState(false);
    const [showHistoryPanel, setShowHistoryPanel] = useState(false);
    const [showNotificationPanel, setShowNotificationPanel] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [notificationLoading, setNotificationLoading] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [emailSubject, setEmailSubject] = useState('');
    const [emailMessage, setEmailMessage] = useState('');
    const [emailLoading, setEmailLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [emailError, setEmailError] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const sidePanelRef = useRef(null);
    const aiScannerRef = useRef(null);
    const notificationPanelRef = useRef(null);

    const ICONS = {
        home: 'https://cdn-icons-png.flaticon.com/128/3917/3917743.png',
        animals: 'https://cdn-icons-png.flaticon.com/128/5527/5527836.png',
        plants: 'https://cdn-icons-png.flaticon.com/128/19009/19009811.png',
        events: 'https://cdn-icons-png.flaticon.com/128/9586/9586200.png',
        notification: 'https://cdn-icons-png.flaticon.com/128/3917/3917256.png',
        menu: 'https://cdn-icons-png.flaticon.com/128/3917/3917762.png',
        close: 'https://cdn-icons-png.flaticon.com/128/4338/4338828.png',
        ticket: 'https://cdn-icons-png.flaticon.com/128/14703/14703145.png',
        profile: 'https://cdn-icons-png.flaticon.com/128/3917/3917796.png',
        messages: 'https://cdn-icons-png.flaticon.com/128/3916/3916613.png',
        wildlife: 'https://cdn-icons-png.flaticon.com/128/9585/9585894.png',
        game: 'https://cdn-icons-png.flaticon.com/128/17390/17390411.png',
        setting: 'https://cdn-icons-png.flaticon.com/128/17586/17586903.png',
        camera: 'https://cdn-icons-png.flaticon.com/128/3917/3917085.png',
        help: 'https://cdn-icons-png.flaticon.com/128/3916/3916708.png',
        support: 'https://cdn-icons-png.flaticon.com/128/16850/16850034.png',
        logout: 'https://cdn-icons-png.flaticon.com/128/17720/17720307.png',
        login: 'https://cdn-icons-png.flaticon.com/128/5528/5528158.png',
        about: 'https://cdn-icons-png.flaticon.com/128/3916/3916708.png'
    };

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        setIsMenuOpen(false);
        if (location.state?.openSidePanel) {
            setShowSidePanel(true);
            window.history.replaceState({}, document.title);
        } else {
            setShowSidePanel(false);
        }
    }, [location]);

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

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (aiScannerRef.current && !aiScannerRef.current.contains(event.target)) {
                setShowAIScanner(false);
            }
        };

        if (showAIScanner) {
            document.addEventListener('mousedown', handleClickOutside);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.body.style.overflow = 'unset';
        };
    }, [showAIScanner]);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                setShowSidePanel(false);
                setShowAIScanner(false);
                setShowNotificationPanel(false);
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationPanelRef.current && !notificationPanelRef.current.contains(event.target)) {
                setShowNotificationPanel(false);
            }
        };

        if (showNotificationPanel) {
            document.addEventListener('mousedown', handleClickOutside);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.body.style.overflow = 'unset';
        };
    }, [showNotificationPanel]);

    const fetchNotifications = useCallback(async (showLoading = true) => {
        if (!user) return;
        if (showLoading) setNotificationLoading(true);
        try {
            const notifs = [];
            const [eventsRes, messagesRes, reservationsRes] = await Promise.all([
                userAPI.getEvents(false).catch(() => ({ success: false })),
                messageAPI.getMyMessages().catch(() => ({ success: false })),
                reservationAPI.getMyTicketReservations().catch(() => ({ success: false }))
            ]);
            if (eventsRes?.success && eventsRes.events) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const upcomingEvents = eventsRes.events
                    .filter(event => {
                        const eventDate = new Date(event.event_date || event.start_date);
                        return eventDate >= today;
                    })
                    .slice(0, 3)
                    .map(event => ({
                        id: `event-${event.id}`,
                        type: 'event',
                        title: event.title,
                        message: `Upcoming event: ${event.event_date ? new Date(event.event_date).toLocaleDateString() : 'Soon'}`,
                        time: event.event_date || event.start_date,
                        path: '/events'
                    }));
                notifs.push(...upcomingEvents);
            }
            if (messagesRes?.success && messagesRes.messages) {
                const repliedMessages = messagesRes.messages
                    .filter(msg => msg.admin_response)
                    .slice(0, 3)
                    .map(msg => ({
                        id: `message-${msg.id}`,
                        type: 'message',
                        title: msg.subject,
                        message: 'Admin has responded to your message',
                        time: msg.responded_at || msg.created_at,
                        path: '/my-messages'
                    }));
                notifs.push(...repliedMessages);
            }
            if (reservationsRes?.success && reservationsRes.reservations) {
                const upcomingReservations = reservationsRes.reservations
                    .filter(r => r.status === 'confirmed' || r.status === 'pending')
                    .slice(0, 3)
                    .map(reservation => ({
                        id: `reservation-${reservation.id}`,
                        type: 'reservation',
                        title: `Reservation #${reservation.booking_reference || reservation.id}`,
                        message: reservation.status === 'confirmed'
                            ? `Confirmed for ${new Date(reservation.visit_date).toLocaleDateString()}`
                            : 'Pending confirmation',
                        time: reservation.created_at,
                        path: null,
                        action: 'openReservationHistory'
                    }));
                notifs.push(...upcomingReservations);
            }
            notifs.sort((a, b) => new Date(b.time) - new Date(a.time));
            setNotifications(notifs);
        } catch (err) {
            console.error(err);
        } finally {
            setNotificationLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchNotifications(false);
        }
    }, [user, fetchNotifications]);

    const handleOpenNotifications = () => {
        setShowNotificationPanel(true);
        fetchNotifications();
    };

    const handleLogout = () => {
        logout();
        setShowLogoutModal(false);
        navigate('/');
    };

    const navLinks = [
        { path: '/', label: 'Home', iconUrl: ICONS.home },
        { path: '/animals', label: 'Animals', iconUrl: ICONS.animals },
        { path: '/plants', label: 'Plants', iconUrl: ICONS.plants },
        { path: '/events', label: 'Events', iconUrl: ICONS.events },
        { path: '/about', label: 'About', iconUrl: ICONS.about }
    ];

    const getProfilePath = () => {
        if (!user) return '/login';
        if (user.role === 'admin') return '/admin/profile';
        if (user.role === 'staff') return '/staff/profile';
        return '/profile';
    };

    const handleOpenReservationHistory = () => {
        setShowSidePanel(false);
        setShowHistoryPanel(true);
    };

    const handleSendEmail = async () => {
        if (!emailSubject.trim() || !emailMessage.trim()) {
            setEmailError('Please fill in both subject and message');
            return;
        }
        setEmailLoading(true);
        setEmailError('');
        try {
            await messageAPI.sendMessage({
                recipientType: 'admin',
                subject: emailSubject,
                content: emailMessage
            });
            setEmailSent(true);
            setEmailSubject('');
            setEmailMessage('');
        } catch (error) {
            setEmailError(error.message || 'Failed to send message');
        } finally {
            setEmailLoading(false);
        }
    };

    const accountMenuItems = [
        {
            iconUrl: ICONS.profile,
            label: 'My Account',
            path: getProfilePath()
        },
        {
            iconUrl: ICONS.ticket,
            label: 'My Reservation',
            action: handleOpenReservationHistory
        },
        {
            iconUrl: ICONS.messages,
            label: 'Messages',
            path: '/my-messages'
        }
    ];

    const exploreMenuItems = [
        {
            iconUrl: ICONS.wildlife,
            label: 'Wildlife Origins',
            path: '/map'
        },
        {
            iconUrl: ICONS.game,
            label: 'Mini Zoo Game',
            path: '/mini-zoo-game'
        }
    ];

    const settingsMenuItems = [
        {
            iconUrl: ICONS.setting,
            label: 'Settings',
            path: '/settings'
        }
    ];

    const adminMenuItems = user?.role === 'admin' ? [
        {
            iconUrl: ICONS.setting,
            label: 'Admin Dashboard',
            path: '/admin/dashboard'
        }
    ] : [];

    const staffMenuItems = (user?.role === 'staff') ? [
        {
            iconUrl: ICONS.setting,
            label: 'Staff Dashboard',
            path: '/staff/dashboard'
        }
    ] : [];

    return (
        <>
            <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 shadow-sm py-2 backdrop-blur-2xl' : 'bg-white/90 py-3'} md:bg-transparent md:py-5`}>
                <div className="container mx-auto px-4 lg:px-12 flex justify-between items-center w-full h-14">
                    <Link to="/" className="flex items-center">
                        <span className="text-[22px] md:text-2xl font-extrabold tracking-tight text-[#08140e]" style={{ fontFamily: '"Segoe Script", "cursive"' }}>
                            Bulusan Zoo
                        </span>
                    </Link>

                    <nav className="hidden md:flex uppercase items-center gap-1 bg-white/80 backdrop-blur-md px-2 py-2 rounded-full shadow-sm border border-gray-100">
                        {navLinks.map((link) => (
                            <Link
                                key={link.label}
                                to={link.path}
                                className={`px-5 py-2 rounded-full text-sm font-bold transition-all duration-200 ${location.pathname === link.path
                                        ? 'bg-green-800 text-white shadow-sm'
                                        : 'text-gray-600 hover:text-green-800 hover:bg-green-50'
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    <div className="hidden md:flex items-center gap-3">
                        <Link to="/reservations">
                            <button className="bg-gray-900 hover:bg-gray-800 px-6 py-2.5 rounded-full text-white text-sm font-bold flex items-center gap-2 transition-all duration-200 shadow-lg shadow-gray-900/20 hover:shadow-xl hover:shadow-gray-900/30 hover:-translate-y-0.5">
                                <span>MAKE RESERVATION</span>
                            </button>
                        </Link>

                        {user && (
                            <button
                                onClick={handleOpenNotifications}
                                className="relative p-2.5 rounded-full bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-all duration-200"
                            >
                                <img src={ICONS.notification} alt="Notifications" className="w-5 h-5 object-contain" />
                                {notifications.length > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#f8312f] text-white text-xs rounded-full flex items-center justify-center font-bold">
                                        {notifications.length > 9 ? '9+' : notifications.length}
                                    </span>
                                )}
                            </button>
                        )}

                        {user ? (
                            <button
                                onClick={() => setShowSidePanel(true)}
                                className="flex items-center gap-2 px-3 py-2 rounded-full bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-all duration-200"
                            >
                                <img
                                    src={getProfileImageUrl(user.profileImage || user.profile_image) || '/profile-img/default-avatar.svg'}
                                    alt="Profile"
                                    className="w-8 h-8 rounded-full object-cover shadow-sm"
                                    onError={(e) => { e.target.onerror = null; e.target.src = '/profile-img/default-avatar.svg'; }}
                                />
                                <span className="font-bold text-gray-800 text-sm hidden lg:block">{user.firstName || user.username}</span>
                            </button>
                        ) : (
                            <Link to="/login">
                                <button className="px-5 py-2.5 rounded-full text-gray-800 text-sm font-bold bg-white hover:bg-gray-50 transition-all duration-200 border border-gray-200 flex items-center shadow-sm">
                                    Login
                                </button>
                            </Link>
                        )}
                    </div>

                    <div className="flex md:hidden items-center gap-5">
                        <Link to="/reservations" className="flex items-center justify-center p-1">
                            <img src={ICONS.ticket} alt="Reservation" className="w-6 h-6 object-contain" />
                        </Link>

                        <button onClick={handleOpenNotifications} className="relative flex items-center justify-center p-1">
                            <img src={ICONS.notification} alt="Notifications" className="w-6 h-6 object-contain" />
                            {notifications.length > 0 && (
                                <span className="absolute top-0 right-0 translate-x-1/4 -translate-y-1/4 w-[18px] h-[18px] bg-[#f8312f] text-white text-[10px] rounded-full flex items-center justify-center font-bold border-[1.5px] border-white">
                                    {notifications.length > 9 ? '9+' : notifications.length}
                                </span>
                            )}
                        </button>

                        <button
                            className="flex items-center justify-center p-1"
                            onClick={() => setIsMenuOpen(true)}
                        >
                            <img src={ICONS.menu} alt="Menu" className="w-6 h-6 object-contain" />
                        </button>
                    </div>
                </div>
            </header>

            {isMenuOpen && (
                <div className="fixed inset-0 z-[120] bg-white flex flex-col animate-fade-in md:hidden">
                    <div className="flex justify-between items-center px-4 h-[60px] border-b border-gray-100 flex-shrink-0">
                        <span className="text-[22px] font-extrabold tracking-tight text-[#08140e]" style={{ fontFamily: '"Segoe Script", "cursive"' }}>
                            Bulusan Zoo
                        </span>
                        <button onClick={() => setIsMenuOpen(false)} className="p-2 touch-target">
                            <img src={ICONS.close} alt="Close Menu" className="w-6 h-6 object-contain" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 py-8 flex flex-col">
                        {user ? (
                            <div
                                onClick={() => {
                                    setIsMenuOpen(false);
                                    setShowSidePanel(true);
                                }}
                                className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl mb-8 border border-gray-100 shadow-sm active:scale-[0.98] transition-transform cursor-pointer"
                            >
                                <img
                                    src={getProfileImageUrl(user.profileImage || user.profile_image) || '/profile-img/default-avatar.svg'}
                                    alt="Profile"
                                    className="w-14 h-14 rounded-full object-cover shadow-sm bg-white"
                                    onError={(e) => { e.target.onerror = null; e.target.src = '/profile-img/default-avatar.svg'; }}
                                />
                                <div className="flex-1 min-w-0">
                                    <span className="font-bold text-gray-900 text-lg block truncate">{user.firstName || user.username}</span>
                                    <span className="text-sm text-green-800 font-bold">View Profile & Settings</span>
                                </div>
                            </div>
                        ) : (
                            <div className="mb-8">
                                <Link
                                    to="/login"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="w-full flex items-center justify-center bg-green-800 text-white font-bold py-4 rounded-xl shadow-md active:bg-green-900 transition-colors text-lg"
                                >
                                    Login / Sign Up
                                </Link>
                            </div>
                        )}

                        <nav className="flex flex-col gap-2 flex-1">
                            {navLinks.map((link) => {
                                const isActive = location.pathname === link.path;
                                return (
                                    <Link
                                        key={link.label}
                                        to={link.path}
                                        onClick={() => setIsMenuOpen(false)}
                                        className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${isActive
                                                ? 'bg-green-50 text-green-800 font-bold'
                                                : 'text-gray-700 font-bold hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isActive ? 'bg-green-100' : 'bg-gray-100'}`}>
                                            <img src={link.iconUrl} alt={link.label} className="w-6 h-6 object-contain" />
                                        </div>
                                        <span className="text-xl">{link.label}</span>
                                    </Link>
                                );
                            })}
                        </nav>

                        {user && (
                            <div className="mt-8 pt-6 border-t border-gray-100">
                                <button
                                    onClick={() => {
                                        setIsMenuOpen(false);
                                        setShowLogoutModal(true);
                                    }}
                                    className="flex items-center gap-4 p-4 w-full text-red-600 font-bold rounded-2xl hover:bg-red-50 transition-colors"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                                        <img src={ICONS.logout} alt="Logout" className="w-6 h-6 object-contain" />
                                    </div>
                                    <span className="text-xl">Sign Out</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {showSidePanel && (
                <div className="fixed inset-0 z-[120] flex md:justify-end bg-white md:bg-black/40 backdrop-blur-sm animate-fade-in">
                    <div
                        ref={sidePanelRef}
                        className="w-full h-full md:w-[400px] bg-gray-50 shadow-2xl flex flex-col"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="side-panel-title"
                    >
                        <div className="bg-white px-6 pt-8 pb-6 border-b border-gray-200 z-10 shadow-sm">
                            <div className="flex items-center justify-between mb-8">
                                <h2 id="side-panel-title" className="text-2xl font-extrabold text-gray-900 tracking-tight">Account</h2>
                                <button
                                    onClick={() => setShowSidePanel(false)}
                                    className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <img src={ICONS.close} alt="Close" className="w-5 h-5 object-contain" />
                                </button>
                            </div>

                            {user && (
                                <div className="flex items-center gap-5">
                                    <img
                                        src={getProfileImageUrl(user.profileImage || user.profile_image) || '/profile-img/default-avatar.svg'}
                                        alt="Profile"
                                        className="w-20 h-20 rounded-full object-cover shadow-sm border border-gray-100"
                                        onError={(e) => { e.target.onerror = null; e.target.src = '/profile-img/default-avatar.svg'; }}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-extrabold text-gray-900 text-xl truncate">
                                            {user.firstName || user.username}
                                        </p>
                                        <p className="text-gray-500 text-sm truncate font-medium mt-0.5">{user.email}</p>
                                        {/* <span className="inline-block mt-2.5 px-3 py-1 bg-green-800 text-white rounded-lg text-xs font-bold tracking-widest uppercase shadow-sm">
                                            {user.role}
                                        </span> */}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                            {(adminMenuItems.length > 0 || staffMenuItems.length > 0) && (
                                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-5 py-3.5 bg-gray-50/80 border-b border-gray-100">Quick Access</p>
                                    <div className="flex flex-col">
                                        {[...adminMenuItems, ...staffMenuItems].map((item, index) => (
                                            <Link
                                                key={index}
                                                to={item.path}
                                                onClick={() => setShowSidePanel(false)}
                                                className={`flex items-center gap-4 p-4.5 hover:bg-gray-50 transition-colors group ${index !== [...adminMenuItems, ...staffMenuItems].length - 1 ? 'border-b border-gray-100' : ''}`}
                                            >
                                                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-green-50 transition-colors">
                                                    <img src={item.iconUrl} alt={item.label} className="w-5 h-5 object-contain" />
                                                </div>
                                                <p className="font-bold text-gray-800 text-[15px]">{item.label}</p>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-5 py-3.5 bg-gray-50/80 border-b border-gray-100">Account Settings</p>
                                <div className="flex flex-col">
                                    {accountMenuItems.map((item, index) => (
                                        item.action ? (
                                            <button
                                                key={index}
                                                onClick={item.action}
                                                className={`flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors group text-left ${index !== accountMenuItems.length - 1 ? 'border-b border-gray-100' : ''}`}
                                            >
                                                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-green-50 transition-colors">
                                                    <img src={item.iconUrl} alt={item.label} className="w-5 h-5 object-contain" />
                                                </div>
                                                <p className="font-bold text-gray-800 text-[15px]">{item.label}</p>
                                            </button>
                                        ) : (
                                            <Link
                                                key={index}
                                                to={item.path}
                                                onClick={() => setShowSidePanel(false)}
                                                className={`flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors group ${index !== accountMenuItems.length - 1 ? 'border-b border-gray-100' : ''}`}
                                            >
                                                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-green-50 transition-colors">
                                                    <img src={item.iconUrl} alt={item.label} className="w-5 h-5 object-contain" />
                                                </div>
                                                <p className="font-bold text-gray-800 text-[15px]">{item.label}</p>
                                            </Link>
                                        )
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-5 py-3.5 bg-gray-50/80 border-b border-gray-100">Explore</p>
                                <div className="flex flex-col">
                                    {exploreMenuItems.map((item, index) => (
                                        <Link
                                            key={index}
                                            to={item.path}
                                            onClick={() => setShowSidePanel(false)}
                                            className={`flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors group ${index !== exploreMenuItems.length - 1 ? 'border-b border-gray-100' : ''}`}
                                        >
                                            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-green-50 transition-colors">
                                                <img src={item.iconUrl} alt={item.label} className="w-5 h-5 object-contain" />
                                            </div>
                                            <p className="font-bold text-gray-800 text-[15px]">{item.label}</p>
                                        </Link>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-5 py-3.5 bg-gray-50/80 border-b border-gray-100">Preferences & AI</p>
                                <div className="flex flex-col">
                                    {settingsMenuItems.map((item, index) => (
                                        <Link
                                            key={`settings-${index}`}
                                            to={item.path}
                                            onClick={() => setShowSidePanel(false)}
                                            className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors group border-b border-gray-100"
                                        >
                                            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-green-50 transition-colors">
                                                <img src={item.iconUrl} alt={item.label} className="w-5 h-5 object-contain" />
                                            </div>
                                            <p className="font-bold text-gray-800 text-[15px]">{item.label}</p>
                                        </Link>
                                    ))}

                                    <button
                                        onClick={() => {
                                            setShowSidePanel(false);
                                            setShowAIScanner(true);
                                        }}
                                        className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors group text-left"
                                    >
                                        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-green-50 transition-colors">
                                            <img src={ICONS.camera} alt="AI Scanner" className="w-5 h-5 object-contain" />
                                        </div>
                                        <div className="flex-1 flex items-center justify-between">
                                            <p className="font-bold text-gray-800 text-[15px]">AI Animal Scanner</p>
                                            <span className="px-2 py-1 bg-green-800 text-white rounded-md text-[10px] font-bold uppercase tracking-wider">New</span>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm pb-2">
                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-5 py-3.5 bg-gray-50/80 border-b border-gray-100">Help & Support</p>
                                <div className="flex flex-col">
                                    <Link
                                        to="/help"
                                        onClick={() => setShowSidePanel(false)}
                                        className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors group border-b border-gray-100"
                                    >
                                        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-green-50 transition-colors">
                                            <img src={ICONS.help} alt="Help Center" className="w-5 h-5 object-contain" />
                                        </div>
                                        <p className="font-bold text-gray-800 text-[15px]">Help Center</p>
                                    </Link>

                                    <button
                                        onClick={() => {
                                            setShowSidePanel(false);
                                            setShowEmailModal(true);
                                            setEmailSent(false);
                                            setEmailError('');
                                        }}
                                        className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors group text-left border-b border-gray-100"
                                    >
                                        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-green-50 transition-colors">
                                            <img src={ICONS.support} alt="Contact Support" className="w-5 h-5 object-contain" />
                                        </div>
                                        <p className="font-bold text-gray-800 text-[15px]">Contact Support</p>
                                    </button>

                                    <button
                                        onClick={() => {
                                            setShowSidePanel(false);
                                            setShowLogoutModal(true);
                                        }}
                                        className="flex items-center gap-4 px-5 py-4 hover:bg-red-50 transition-colors group text-left"
                                    >
                                        <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center group-hover:bg-red-100 transition-colors">
                                            <img src={ICONS.logout} alt="Logout" className="w-5 h-5 object-contain" />
                                        </div>
                                        <p className="font-bold text-red-600 text-[15px]">Sign Out</p>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showAIScanner && (
                <div className="fixed inset-0 z-[100] flex justify-end">
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
                        onClick={() => setShowAIScanner(false)}
                    />

                    <div
                        ref={aiScannerRef}
                        className="relative w-full max-w-lg bg-white h-full shadow-2xl animate-slide-in-right overflow-hidden flex flex-col"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="ai-scanner-title"
                    >
                        <div className="p-4 border-b border-gray-100 bg-green-800 flex-shrink-0">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                        <img src={ICONS.camera} alt="AI Icon" className="w-5 h-5 object-contain brightness-0 invert" />
                                    </div>
                                    <div>
                                        <h2 id="ai-scanner-title" className="text-lg font-bold text-white">AI Animal Scanner</h2>
                                        <p className="text-green-200 text-xs font-medium">Identify animals with AI</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowAIScanner(false)}
                                    className="p-2 hover:bg-white/20 rounded-xl transition-colors text-white"
                                >
                                    <img src={ICONS.close} alt="Close" className="w-5 h-5 object-contain brightness-0 invert" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            <AnimalClassifier embedded={true} />
                        </div>
                    </div>
                </div>
            )}

            {showEmailModal && (
                <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50 rounded-t-2xl">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-gray-200">
                                    <img src={ICONS.support} alt="Email Icon" className="w-5 h-5 object-contain" />
                                </div>
                                <h2 className="text-lg font-extrabold text-gray-900">Contact Support</h2>
                            </div>
                            <button
                                onClick={() => {
                                    setShowEmailModal(false);
                                    setEmailSubject('');
                                    setEmailMessage('');
                                    setEmailError('');
                                }}
                                className="p-2 bg-white border border-gray-200 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <img src={ICONS.close} alt="Close" className="w-4 h-4 object-contain" />
                            </button>
                        </div>
                        <div className="p-5 overflow-y-auto">
                            {emailSent ? (
                                <div className="text-center py-8">
                                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-100">
                                        <span className="text-3xl">🎉</span>
                                    </div>
                                    <h3 className="text-xl font-extrabold text-gray-900 mb-2">Message Sent!</h3>
                                    <p className="text-gray-600 mb-6 font-medium">Your message has been sent to the admin team. They will respond as soon as possible.</p>
                                    <button
                                        onClick={() => {
                                            setShowEmailModal(false);
                                            setEmailSent(false);
                                        }}
                                        className="w-full py-3.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <p className="text-gray-600 mb-5 font-medium text-sm">
                                        Send a message to our support team. We'll get back to you as soon as possible.
                                    </p>
                                    {emailError && (
                                        <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-bold">
                                            {emailError}
                                        </div>
                                    )}
                                    <div className="mb-4">
                                        <label className="block text-sm font-bold text-gray-800 mb-1.5">Subject</label>
                                        <input
                                            type="text"
                                            value={emailSubject}
                                            onChange={(e) => setEmailSubject(e.target.value)}
                                            placeholder="..."
                                            className="w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-800 focus:border-transparent outline-none transition-all font-medium"
                                        />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-bold text-gray-800 mb-1.5">Message</label>
                                        <textarea
                                            value={emailMessage}
                                            onChange={(e) => setEmailMessage(e.target.value)}
                                            placeholder="Describe your issue or question in detail..."
                                            rows={5}
                                            className="w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-800 focus:border-transparent resize-none outline-none transition-all font-medium"
                                        />
                                    </div>
                                    <button
                                        onClick={handleSendEmail}
                                        disabled={emailLoading || !emailSubject.trim() || !emailMessage.trim()}
                                        className="w-full bg-green-800 text-white py-3.5 rounded-xl font-bold hover:bg-green-900 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                                    >
                                        {emailLoading ? (
                                            <span>Sending...</span>
                                        ) : (
                                            <span>Send Message</span>
                                        )}
                                    </button>
                                </>
                            )}
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

            <ReservationHistoryPanel
                isOpen={showHistoryPanel}
                onClose={() => setShowHistoryPanel(false)}
            />

            {showNotificationPanel && (
                <div className="fixed inset-0 z-[120] overflow-hidden">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setShowNotificationPanel(false)}
                    />
                    <div
                        ref={notificationPanelRef}
                        className="absolute right-0 top-0 h-full w-full max-w-md bg-gray-50 shadow-2xl transform transition-transform duration-300 ease-out animate-slide-in-right flex flex-col"
                    >
                        <div className="flex items-center justify-between p-5 bg-white border-b border-gray-200 flex-shrink-0 z-10 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                    <img src={ICONS.notification} alt="Notification" className="w-5 h-5 object-contain" />
                                </div>
                                <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">Notifications</h2>
                            </div>
                            <button
                                onClick={() => setShowNotificationPanel(false)}
                                className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <img src={ICONS.close} alt="Close" className="w-5 h-5 object-contain" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5">
                            {notificationLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <span className="font-bold text-gray-400">Loading...</span>
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 shadow-sm">
                                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                                        <img src={ICONS.notification} alt="Empty" className="w-8 h-8 object-contain opacity-40" />
                                    </div>
                                    <h3 className="text-gray-900 font-extrabold text-lg mb-1">No notifications</h3>
                                    <p className="text-gray-500 text-sm font-medium">You're all caught up!</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {notifications.map((notif) => (
                                        <div
                                            key={notif.id}
                                            className="p-4 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-green-200 transition-all cursor-pointer group"
                                            onClick={() => {
                                                setShowNotificationPanel(false);
                                                if (notif.action === 'openReservationHistory') {
                                                    setShowHistoryPanel(true);
                                                } else if (notif.path) {
                                                    navigate(notif.path);
                                                }
                                            }}
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${notif.type === 'event' ? 'bg-green-100' :
                                                        notif.type === 'reservation' ? 'bg-orange-100' : 'bg-gray-100'
                                                    }`}>
                                                    <img src={notif.type === 'event' ? ICONS.events : notif.type === 'reservation' ? ICONS.ticket : ICONS.messages} alt="Type" className="w-6 h-6 object-contain" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-extrabold text-gray-900 text-[15px] truncate mb-0.5 group-hover:text-green-800 transition-colors">{notif.title}</h4>
                                                    <p className="text-gray-600 text-sm leading-snug font-medium">{notif.message}</p>
                                                    <p className="text-gray-400 text-xs mt-2 font-bold">
                                                        {notif.time ? new Date(notif.time).toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        }) : 'Recently'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Header;