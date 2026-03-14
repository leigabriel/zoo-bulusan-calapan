import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProfileImageUrl, messageAPI, userAPI, reservationAPI } from '../services/api-client';
import LogoutModal from './common/LogoutModal';
import AnimalClassifier from './features/ai-scanner/AnimalClassifier';
import ReservationHistoryPanel from './features/ReservationHistoryPanel';

const MINIZOO_GAME_URL = import.meta.env.VITE_MINIZOO_GAME_URL || 'https://minizoo.vercel.app/';

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
    about: 'https://cdn-icons-png.flaticon.com/128/3916/3916708.png',
};

const NAV_LINKS = [
    { path: '/', label: 'Home', iconUrl: ICONS.home },
    { path: '/animals', label: 'Animals', iconUrl: ICONS.animals },
    { path: '/plants', label: 'Plants', iconUrl: ICONS.plants },
    { path: '/events', label: 'Events', iconUrl: ICONS.events },
    { path: '/community', label: 'Community', iconUrl: ICONS.messages },
    { path: '/about', label: 'About', iconUrl: ICONS.about },
];

const IconBtn = ({ src, alt, onClick, badge, className = '' }) => (
    <button
        onClick={onClick}
        className={`relative flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0 ${className}`}
    >
        <img src={src} alt={alt} className="w-[18px] h-[18px] object-contain opacity-55" />
        {badge > 0 && (
            <span className="absolute top-0.5 right-0.5 min-w-[15px] h-[15px] px-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white leading-none">
                {badge > 9 ? '9+' : badge}
            </span>
        )}
    </button>
);

const CloseBtn = ({ onClick }) => (
    <button
        onClick={onClick}
        className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
    >
        <img src={ICONS.close} alt="Close" className="w-3.5 h-3.5 object-contain opacity-40" />
    </button>
);

const SectionLabel = ({ label }) => (
    <p className="px-1 pt-5 pb-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{label}</p>
);

const MenuItem = ({ iconUrl, label, badge, danger, to, onClick, onClose, isLast }) => {
    const inner = (
        <span className={`flex items-center gap-3 px-4 py-3 transition-colors group ${danger ? 'hover:bg-red-50/60' : 'hover:bg-gray-50'} ${!isLast ? 'border-b border-gray-50' : ''}`}>
            <span className={`w-8 h-8 flex items-center justify-center rounded-xl flex-shrink-0 ${danger ? 'bg-red-50' : 'bg-gray-50'}`}>
                <img
                    src={iconUrl}
                    alt={label}
                    className="w-[15px] h-[15px] object-contain"
                    style={danger ? { filter: 'invert(30%) sepia(80%) saturate(700%) hue-rotate(330deg)' } : { opacity: 0.5 }}
                />
            </span>
            <span className={`text-[13px] font-medium flex-1 text-left leading-none ${danger ? 'text-red-500' : 'text-gray-700'}`}>
                {label}
            </span>
            {badge && (
                <span className="px-1.5 py-0.5 bg-emerald-700 text-white rounded text-[9px] font-semibold uppercase tracking-wide flex-shrink-0">
                    {badge}
                </span>
            )}
        </span>
    );
    if (to) return <Link to={to} onClick={onClose} className="block">{inner}</Link>;
    return <button onClick={onClick} className="w-full">{inner}</button>;
};

const Header = () => {
    const { user, logout, loading: authLoading } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showSidePanel, setShowSidePanel] = useState(false);
    const [showAIScanner, setShowAIScanner] = useState(false);
    const [showScannerConfirm, setShowScannerConfirm] = useState(false);
    const [showHistoryPanel, setShowHistoryPanel] = useState(false);
    const [showNotificationPanel, setShowNotificationPanel] = useState(false);
    const [showMiniZooGame, setShowMiniZooGame] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [readNotificationIds, setReadNotificationIds] = useState(() => {
        try {
            const saved = localStorage.getItem('readNotificationIds');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });
    const [notificationLoading, setNotificationLoading] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [isNavVisible, setIsNavVisible] = useState(true);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [emailSubject, setEmailSubject] = useState('');
    const [emailMessage, setEmailMessage] = useState('');
    const [emailLoading, setEmailLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [emailError, setEmailError] = useState('');
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const sidePanelRef = useRef(null);
    const aiScannerRef = useRef(null);
    const notificationPanelRef = useRef(null);
    const lastScrollY = useRef(0);

    useEffect(() => {
        const onScroll = () => {
            const currentScrollY = window.scrollY;
            if (currentScrollY > lastScrollY.current && currentScrollY > 56 && !isMenuOpen) {
                setIsNavVisible(false);
            } else {
                setIsNavVisible(true);
            }
            setScrolled(currentScrollY > 20);
            lastScrollY.current = currentScrollY;
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, [isMenuOpen]);

    useEffect(() => {
        setIsMenuOpen(false);
        if (location.state?.openSidePanel) {
            setShowSidePanel(true);
            window.history.replaceState({}, document.title);
        } else {
            setShowSidePanel(false);
        }
    }, [location]);

    const useOutsideClick = (ref, isOpen, setter) => {
        useEffect(() => {
            const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setter(false); };
            if (isOpen) {
                document.addEventListener('mousedown', handler);
                document.body.style.overflow = 'hidden';
            }
            return () => {
                document.removeEventListener('mousedown', handler);
                document.body.style.overflow = 'unset';
            };
        }, [isOpen, ref, setter]);
    };

    useOutsideClick(sidePanelRef, showSidePanel, setShowSidePanel);
    useOutsideClick(notificationPanelRef, showNotificationPanel, setShowNotificationPanel);

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape') {
                setShowSidePanel(false);
                if (showAIScanner && !showScannerConfirm) {
                    setShowScannerConfirm(true);
                }
                setShowNotificationPanel(false);
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [showAIScanner, showScannerConfirm]);

    const fetchNotifications = useCallback(async (showLoading = true) => {
        if (!user) return;
        if (showLoading) setNotificationLoading(true);
        try {
            const notifs = [];
            const [eventsRes, messagesRes, reservationsRes, dbNotificationsRes] = await Promise.all([
                userAPI.getEvents(false).catch(() => ({ success: false })),
                messageAPI.getMyMessages().catch(() => ({ success: false })),
                reservationAPI.getMyTicketReservations().catch(() => ({ success: false })),
                userAPI.getNotifications().catch(() => ({ success: false }))
            ]);

            if (dbNotificationsRes?.success && Array.isArray(dbNotificationsRes.notifications)) {
                dbNotificationsRes.notifications.forEach((notification) => notifs.push({
                    id: notification.id,
                    type: notification.type || 'message',
                    title: notification.title || 'Notification',
                    message: notification.message,
                    time: notification.createdAt,
                    path: notification.link || null,
                    read: Boolean(notification.read)
                }));
            }
            if (eventsRes?.success && eventsRes.events) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                eventsRes.events
                    .filter(e => new Date(e.event_date || e.start_date) >= today)
                    .slice(0, 3)
                    .forEach(e => notifs.push({
                        id: `event-${e.id}`, type: 'event', title: e.title,
                        message: `Upcoming: ${e.event_date ? new Date(e.event_date).toLocaleDateString() : 'Soon'}`,
                        time: e.event_date || e.start_date, path: '/events',
                    }));
            }
            if (messagesRes?.success && messagesRes.messages) {
                messagesRes.messages.filter(m => m.admin_response).slice(0, 3).forEach(m => notifs.push({
                    id: `message-${m.id}`, type: 'message', title: m.subject,
                    message: 'Admin has responded to your message',
                    time: m.responded_at || m.created_at, path: '/my-messages',
                }));
            }
            if (reservationsRes?.success && reservationsRes.reservations) {
                reservationsRes.reservations
                    .filter(r => r.status === 'confirmed' || r.status === 'pending')
                    .slice(0, 3)
                    .forEach(r => notifs.push({
                        id: `reservation-${r.id}`, type: 'reservation',
                        title: `Reservation #${r.booking_reference || r.id}`,
                        message: r.status === 'confirmed'
                            ? `Confirmed for ${new Date(r.visit_date).toLocaleDateString()}`
                            : 'Pending confirmation',
                        time: r.created_at, path: null, action: 'openReservationHistory',
                    }));
            }
            notifs.sort((a, b) => new Date(b.time) - new Date(a.time));
            setNotifications(notifs);
            setReadNotificationIds((prev) => {
                const serverReadIds = notifs
                    .filter((notification) => notification.read)
                    .map((notification) => notification.id);
                return [...new Set([...prev, ...serverReadIds])];
            });
        } catch (err) {
        } finally {
            setNotificationLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) fetchNotifications(false);
        let pollInterval = null;
        if (user) {
            pollInterval = setInterval(() => {
                fetchNotifications(false);
            }, 30000);
        }
        return () => {
            if (pollInterval) clearInterval(pollInterval);
        };
    }, [user, fetchNotifications]);

    useEffect(() => {
        localStorage.setItem('readNotificationIds', JSON.stringify(readNotificationIds));
    }, [readNotificationIds]);

    const unreadCount = notifications.filter(n => !readNotificationIds.includes(n.id)).length;

    const markNotificationRead = async (notificationId) => {
        if (!readNotificationIds.includes(notificationId)) {
            setReadNotificationIds(prev => [...prev, notificationId]);
        }

        if (typeof notificationId === 'number') {
            try {
                await userAPI.markNotificationRead(notificationId);
            } catch {
            }
        }
    };

    const markAllNotificationsRead = async () => {
        const allIds = notifications.map(n => n.id);
        setReadNotificationIds(prev => [...new Set([...prev, ...allIds])]);

        try {
            await userAPI.markAllNotificationsRead();
        } catch {
        }
    };

    const handleNotificationClick = async (notif) => {
        await markNotificationRead(notif.id);
        setShowNotificationPanel(false);
        if (notif.action === 'openReservationHistory') {
            setShowHistoryPanel(true);
        } else if (notif.path) {
            navigate(notif.path);
        }
    };

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 500));
            logout();
            setShowLogoutModal(false);
            navigate('/login');
        } catch (error) {
        } finally {
            setIsLoggingOut(false);
        }
    };

    const closeSidePanel = () => setShowSidePanel(false);
    const openNotifications = () => { setShowNotificationPanel(true); fetchNotifications(); };
    const openEmailModal = () => { closeSidePanel(); setShowEmailModal(true); setEmailSent(false); setEmailError(''); };

    const handleSendEmail = async () => {
        if (!emailSubject.trim() || !emailMessage.trim()) { setEmailError('Please fill in both fields'); return; }
        setEmailLoading(true);
        setEmailError('');
        try {
            await messageAPI.sendMessage({ recipientType: 'admin', subject: emailSubject, content: emailMessage });
            setEmailSent(true);
            setEmailSubject('');
            setEmailMessage('');
        } catch (e) {
            setEmailError(e.message || 'Failed to send message');
        } finally {
            setEmailLoading(false);
        }
    };

    const getProfilePath = () => {
        if (!user) return '/login';
        if (user.role === 'admin') return '/admin/profile';
        if (user.role === 'staff') return '/staff/profile';
        return '/profile';
    };

    const handleOpenReservationHistory = () => { closeSidePanel(); setShowHistoryPanel(true); };
    const handleOpenMiniZooGame = () => { closeSidePanel(); setShowMiniZooGame(true); };
    const handleConfirmMiniZooGame = () => {
        setShowMiniZooGame(false);
        window.open(MINIZOO_GAME_URL, '_blank', 'noopener,noreferrer');
    };

    const quickItems = [
        ...(user?.role === 'admin' ? [{ iconUrl: ICONS.setting, label: 'Admin Dashboard', path: '/admin/dashboard' }] : []),
        ...(user?.role === 'staff' ? [{ iconUrl: ICONS.setting, label: 'Staff Dashboard', path: '/staff/dashboard' }] : []),
    ];

    const accountItems = [
        { iconUrl: ICONS.profile, label: 'My Account', path: getProfilePath() },
        { iconUrl: ICONS.ticket, label: 'My Reservation', action: handleOpenReservationHistory },
        { iconUrl: ICONS.messages, label: 'Messages', path: '/my-messages' },
    ];

    const exploreItems = [
        { iconUrl: ICONS.wildlife, label: 'Wildlife Origins', path: '/map' },
        { iconUrl: ICONS.game, label: 'Mini Zoo Game', action: handleOpenMiniZooGame },
    ];

    const avatarSrc = getProfileImageUrl(user?.profileImage || user?.profile_image) || '/profile-img/default-avatar.svg';
    const displayName = user?.firstName || user?.username;

    return (
        <>
            <header
                className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ease-in-out ${isNavVisible ? 'translate-y-0' : '-translate-y-full'}`}
                style={{ paddingTop: 'env(safe-area-inset-top)' }}
            >
                <div className="mx-auto px-4 sm:px-6 lg:px-10 max-w-[1800px]" style={{ height: '56px' }}>
                    <div className="flex items-center h-full">
                        <div className="flex items-center flex-shrink-0 w-[180px]">
                            <Link to="/" className="flex items-center" onClick={() => setIsMenuOpen(false)}>
                                <img src="https://cdn-icons-png.flaticon.com/128/12801/12801273.png" alt="Logo" className="w-6 h-6 object-contain mr-2" />
                                <span className="text-[18px] font-bold text-[#212631] tracking-tight">
                                    BULUSAN ZOO
                                </span>
                            </Link>
                        </div>

                        <nav className="hidden md:flex flex-1 items-center justify-center">
                            <div className="flex items-center gap-0.5 bg-[#212631] rounded-full px-1.5 py-1.5">
                                {NAV_LINKS.map((link) => (
                                    <Link
                                        key={link.path}
                                        to={link.path}
                                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                        className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-all duration-150 whitespace-nowrap ${location.pathname === link.path
                                            ? 'bg-[#ebebeb] text-gray-900 shadow-sm'
                                            : 'text-[#ebebeb]/80 hover:text-gray-200'
                                            }`}
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                            </div>
                        </nav>

                        <div className="hidden md:flex items-center justify-end gap-2 flex-shrink-0 w-[180px]">
                            <Link to="/reservations">
                                <button className="px-4 py-1.5 rounded-full bg-gray-900 text-white text-[13px] font-medium hover:bg-gray-700 transition-colors whitespace-nowrap">
                                    Reserve
                                </button>
                            </Link>
                            {user && (
                                <IconBtn src={ICONS.notification} alt="Notifications" onClick={openNotifications} badge={unreadCount} />
                            )}
                            {authLoading ? (
                                <div className="flex items-center gap-2 px-4 py-1.5">
                                    <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                                </div>
                            ) : user ? (
                                <button
                                    onClick={() => setShowSidePanel(true)}
                                    className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 transition-all"
                                >
                                    <img
                                        src={avatarSrc}
                                        alt="Profile"
                                        className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                                        referrerPolicy="no-referrer"
                                        onError={(e) => { e.target.onerror = null; e.target.src = '/profile-img/default-avatar.svg'; }}
                                    />
                                    <span className="text-[13px] font-medium text-gray-700 hidden lg:block max-w-[80px] truncate">
                                        {displayName}
                                    </span>
                                </button>
                            ) : (
                                <Link to="/login">
                                    <button className="px-4 py-1.5 rounded-full text-[13px] font-medium text-gray-700 border border-gray-200 bg-white hover:bg-gray-50 transition-colors">
                                        Login
                                    </button>
                                </Link>
                            )}
                        </div>

                        <div className="flex md:hidden items-center gap-1 ml-auto">
                            <Link to="/reservations" className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0">
                                <img src={ICONS.ticket} alt="Reserve" className="w-[18px] h-[18px] object-contain opacity-55" />
                            </Link>
                            <IconBtn src={ICONS.notification} alt="Notifications" onClick={openNotifications} badge={unreadCount} />
                            <IconBtn src={isMenuOpen ? ICONS.close : ICONS.menu} alt="Menu" onClick={() => setIsMenuOpen(!isMenuOpen)} />
                        </div>
                    </div>
                </div>

                <div
                    className={`md:hidden absolute top-full left-0 w-full bg-white border-t border-gray-100 shadow-xl overflow-hidden transition-all duration-300 ease-in-out origin-top flex flex-col ${isMenuOpen ? 'max-h-[80vh] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}
                >
                    <div className="flex flex-col p-4 gap-1">
                        {user && (
                            <button
                                onClick={() => { setIsMenuOpen(false); setShowSidePanel(true); }}
                                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 hover:bg-gray-100 transition-colors text-left mb-2"
                            >
                                <img
                                    src={avatarSrc}
                                    alt="Profile"
                                    className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                                    referrerPolicy="no-referrer"
                                    onError={(e) => { e.target.onerror = null; e.target.src = '/profile-img/default-avatar.svg'; }}
                                />
                                <div className="min-w-0">
                                    <p className="text-[13px] font-semibold text-gray-900 truncate">{displayName}</p>
                                    <p className="text-[11px] text-gray-400 mt-0.5">View Account</p>
                                </div>
                            </button>
                        )}
                        {NAV_LINKS.map((link) => {
                            const active = location.pathname === link.path;
                            return (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    onClick={() => { setIsMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${active ? 'bg-gray-900' : 'hover:bg-gray-50'}`}
                                >
                                    <img
                                        src={link.iconUrl}
                                        alt={link.label}
                                        className="w-4 h-4 object-contain flex-shrink-0"
                                        style={{ opacity: active ? 1 : 0.45, filter: active ? 'brightness(0) invert(1)' : 'none' }}
                                    />
                                    <span className={`text-[13px] font-medium ${active ? 'text-white' : 'text-gray-600'}`}>
                                        {link.label}
                                    </span>
                                </Link>
                            );
                        })}
                        {authLoading ? (
                            <div className="flex items-center justify-center py-3 mt-2">
                                <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                            </div>
                        ) : !user ? (
                            <Link to="/login" onClick={() => setIsMenuOpen(false)} className="mt-2">
                                <button className="w-full py-3 rounded-xl bg-gray-900 text-white text-[13px] font-medium">
                                    Login / Sign Up
                                </button>
                            </Link>
                        ) : (
                            <button
                                onClick={() => { setIsMenuOpen(false); setShowLogoutModal(true); }}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors mt-2"
                            >
                                <img
                                    src={ICONS.logout}
                                    alt="Sign Out"
                                    className="w-4 h-4 object-contain flex-shrink-0"
                                    style={{ filter: 'invert(30%) sepia(80%) saturate(700%) hue-rotate(330deg) opacity(0.75)' }}
                                />
                                <span className="text-[13px] font-medium">Sign Out</span>
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <div className={`fixed inset-0 z-[120] flex justify-end transition-all duration-300 ${showSidePanel ? 'visible' : 'invisible'}`}>
                <div
                    className={`absolute inset-0 bg-black/25 backdrop-blur-[2px] transition-opacity duration-300 ${showSidePanel ? 'opacity-100' : 'opacity-0'}`}
                    onClick={closeSidePanel}
                />
                <div
                    ref={sidePanelRef}
                    className={`w-full h-full md:w-[300px] bg-gray-50 shadow-2xl flex flex-col transform transition-transform duration-300 relative ${showSidePanel ? 'translate-x-0' : 'translate-x-full'}`}
                    role="dialog"
                    aria-modal="true"
                >
                    <div className="flex-shrink-0 px-5 pt-5 pb-4 bg-white border-b border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[13px] font-semibold text-gray-800">Account</span>
                            <CloseBtn onClick={closeSidePanel} />
                        </div>
                        {user && (
                            <div className="flex items-center gap-3">
                                <img
                                    src={avatarSrc}
                                    alt="Profile"
                                    className="w-11 h-11 rounded-full object-cover border border-gray-100 flex-shrink-0"
                                    referrerPolicy="no-referrer"
                                    onError={(e) => { e.target.onerror = null; e.target.src = '/profile-img/default-avatar.svg'; }}
                                />
                                <div className="min-w-0">
                                    <p className="text-[13px] font-semibold text-gray-900 truncate">{displayName}</p>
                                    <p className="text-[11px] text-gray-400 truncate mt-0.5">{user.email}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto px-4 pb-6">
                        {quickItems.length > 0 && (
                            <>
                                <SectionLabel label="Quick Access" />
                                <div className="rounded-xl overflow-hidden border border-gray-100 bg-white">
                                    {quickItems.map((item, i) => (
                                        <MenuItem key={i} iconUrl={item.iconUrl} label={item.label} to={item.path} onClose={closeSidePanel} isLast={i === quickItems.length - 1} />
                                    ))}
                                </div>
                            </>
                        )}

                        <SectionLabel label="Account" />
                        <div className="rounded-xl overflow-hidden border border-gray-100 bg-white">
                            {accountItems.map((item, i) => (
                                <MenuItem key={i} iconUrl={item.iconUrl} label={item.label} to={item.path} onClick={item.action} onClose={closeSidePanel} isLast={i === accountItems.length - 1} />
                            ))}
                        </div>

                        <SectionLabel label="Explore" />
                        <div className="rounded-xl overflow-hidden border border-gray-100 bg-white">
                            {exploreItems.map((item, i) => (
                                <MenuItem key={i} iconUrl={item.iconUrl} label={item.label} to={item.path} onClick={item.action} onClose={closeSidePanel} isLast={i === exploreItems.length - 1} />
                            ))}
                        </div>

                        <SectionLabel label="Preferences & AI" />
                        <div className="rounded-xl overflow-hidden border border-gray-100 bg-white">
                            <MenuItem iconUrl={ICONS.setting} label="Settings" to="/settings" onClose={closeSidePanel} isLast={false} />
                            <MenuItem
                                iconUrl={ICONS.camera}
                                label="AI Animal Scanner"
                                badge="New"
                                onClick={() => { closeSidePanel(); setShowAIScanner(true); }}
                                isLast={true}
                            />
                        </div>

                        <SectionLabel label="Help" />
                        <div className="rounded-xl overflow-hidden border border-gray-100 bg-white">
                            <MenuItem iconUrl={ICONS.help} label="Help Center" to="/help" onClose={closeSidePanel} isLast={false} />
                            <MenuItem iconUrl={ICONS.support} label="Contact Support" onClick={openEmailModal} isLast={false} />
                            <MenuItem
                                iconUrl={ICONS.logout}
                                label="Sign Out"
                                danger
                                onClick={() => { closeSidePanel(); setShowLogoutModal(true); }}
                                isLast={true}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className={`fixed inset-0 z-[110] flex justify-end transition-all duration-300 ${showAIScanner ? 'visible' : 'invisible'}`}>
                <div
                    className={`absolute inset-0 bg-black/25 backdrop-blur-[2px] transition-opacity duration-300 ${showAIScanner ? 'opacity-100' : 'opacity-0'}`}
                    onClick={() => { if (showAIScanner) setShowScannerConfirm(true); }}
                />
                <div
                    ref={aiScannerRef}
                    className={`relative w-full md:w-1/2 h-full bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ${showAIScanner ? 'translate-x-0' : 'translate-x-full'}`}
                    role="dialog"
                    aria-modal="true"
                >
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 flex-shrink-0">
                        <div className="w-8 h-8 bg-emerald-700 rounded-lg flex items-center justify-center flex-shrink-0">
                            <img src={ICONS.camera} alt="AI" className="w-4 h-4 object-contain brightness-0 invert" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-gray-900">AI Animal Scanner</p>
                            <p className="text-[11px] text-gray-400">Identify animals with AI</p>
                        </div>
                        <CloseBtn onClick={() => setShowScannerConfirm(true)} />
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {showAIScanner && <AnimalClassifier embedded={true} />}
                    </div>

                    {showScannerConfirm && (
                        <div className="absolute inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                                <h3 className="text-[15px] font-bold text-gray-900 mb-2">Close AI Scanner?</h3>
                                <p className="text-[13px] text-gray-500 mb-6">Are you sure you want to close the scanner? Any unsaved captures will be lost.</p>
                                <div className="flex gap-3">
                                    <button onClick={() => setShowScannerConfirm(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-700 text-[13px] font-semibold rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
                                    <button onClick={() => { setShowScannerConfirm(false); setShowAIScanner(false); }} className="flex-1 py-2.5 bg-red-500 text-white text-[13px] font-semibold rounded-xl hover:bg-red-600 transition-colors">Close</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className={`fixed inset-0 z-[130] flex items-center justify-center p-4 transition-all duration-300 ${showEmailModal ? 'visible' : 'invisible'}`}>
                <div
                    className={`absolute inset-0 bg-black/25 backdrop-blur-[2px] transition-opacity duration-300 ${showEmailModal ? 'opacity-100' : 'opacity-0'}`}
                    onClick={() => { setShowEmailModal(false); setEmailSubject(''); setEmailMessage(''); setEmailError(''); }}
                />
                <div className={`bg-white rounded-2xl shadow-xl w-full max-w-sm relative transform transition-all duration-300 ${showEmailModal ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-4 opacity-0'}`}>
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                        <span className="text-[13px] font-semibold text-gray-900">Contact Support</span>
                        <CloseBtn onClick={() => { setShowEmailModal(false); setEmailSubject(''); setEmailMessage(''); setEmailError(''); }} />
                    </div>
                    <div className="p-5">
                        {emailSent ? (
                            <div className="flex flex-col items-center text-center py-5 gap-3">
                                <div className="w-11 h-11 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center">
                                    <span className="text-emerald-600 text-base font-bold">✓</span>
                                </div>
                                <div>
                                    <p className="text-[13px] font-semibold text-gray-900">Message Sent</p>
                                    <p className="text-[11px] text-gray-400 mt-0.5">We'll respond as soon as possible.</p>
                                </div>
                                <button
                                    onClick={() => { setShowEmailModal(false); setEmailSent(false); }}
                                    className="w-full py-2.5 bg-gray-900 text-white text-[13px] font-medium rounded-lg hover:bg-gray-700 transition-colors mt-2"
                                >
                                    Close
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4">
                                {emailError && (
                                    <p className="text-[11px] text-red-500 bg-red-50 px-3 py-2 rounded-lg">{emailError}</p>
                                )}
                                <div>
                                    <label className="block text-[11px] font-medium text-gray-500 mb-1.5">Subject</label>
                                    <input
                                        type="text"
                                        value={emailSubject}
                                        onChange={(e) => setEmailSubject(e.target.value)}
                                        placeholder="What's this about?"
                                        className="w-full px-3 py-2.5 text-[13px] border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-400 focus:border-gray-400 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-medium text-gray-500 mb-1.5">Message</label>
                                    <textarea
                                        value={emailMessage}
                                        onChange={(e) => setEmailMessage(e.target.value)}
                                        placeholder="Describe your issue..."
                                        rows={4}
                                        className="w-full px-3 py-2.5 text-[13px] border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-400 focus:border-gray-400 outline-none resize-none transition-all"
                                    />
                                </div>
                                <button
                                    onClick={handleSendEmail}
                                    disabled={emailLoading || !emailSubject.trim() || !emailMessage.trim()}
                                    className="w-full py-2.5 bg-gray-900 text-white text-[13px] font-medium rounded-lg hover:bg-gray-700 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                                >
                                    {emailLoading ? 'Sending…' : 'Send Message'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className={`fixed inset-0 z-[120] overflow-hidden transition-all duration-300 ${showNotificationPanel ? 'visible' : 'invisible'}`}>
                <div
                    className={`absolute inset-0 bg-black/25 backdrop-blur-[2px] transition-opacity duration-300 ${showNotificationPanel ? 'opacity-100' : 'opacity-0'}`}
                    onClick={() => setShowNotificationPanel(false)}
                />
                <div
                    ref={notificationPanelRef}
                    className={`absolute right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ${showNotificationPanel ? 'translate-x-0' : 'translate-x-full'}`}
                >
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <span className="text-[13px] font-semibold text-gray-900">Notifications</span>
                            {unreadCount > 0 && (
                                <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">
                                    {unreadCount}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllNotificationsRead}
                                    className="text-[11px] font-medium text-emerald-600 hover:text-emerald-700 transition-colors px-2 py-1 rounded hover:bg-emerald-50"
                                >
                                    Mark all read
                                </button>
                            )}
                            <CloseBtn onClick={() => setShowNotificationPanel(false)} />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">
                        {notificationLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <span className="text-[13px] text-gray-400">Loading…</span>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-2">
                                <div className="w-11 h-11 bg-gray-50 rounded-full flex items-center justify-center">
                                    <img src={ICONS.notification} alt="" className="w-5 h-5 object-contain opacity-25" />
                                </div>
                                <p className="text-[13px] font-medium text-gray-500">No notifications</p>
                                <p className="text-[11px] text-gray-400">You're all caught up!</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {notifications.map((notif) => {
                                    const isRead = readNotificationIds.includes(notif.id);
                                    return (
                                        <button
                                            key={notif.id}
                                            className={`w-full text-left flex items-start gap-3 p-3.5 rounded-xl border transition-all ${isRead
                                                ? 'border-gray-50 bg-gray-50/50 hover:bg-gray-100'
                                                : 'border-emerald-100 bg-emerald-50/30 hover:bg-emerald-50'
                                                }`}
                                            onClick={() => handleNotificationClick(notif)}
                                        >
                                            <div className={`relative w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${notif.type === 'event' ? 'bg-emerald-50' :
                                                notif.type === 'reservation' ? 'bg-orange-50' : 'bg-gray-50'
                                                }`}>
                                                <img
                                                    src={notif.type === 'event' ? ICONS.events : notif.type === 'reservation' ? ICONS.ticket : ICONS.messages}
                                                    alt=""
                                                    className="w-4 h-4 object-contain opacity-55"
                                                />
                                                {!isRead && (
                                                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full"></span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-[13px] font-medium truncate ${isRead ? 'text-gray-500' : 'text-gray-800'}`}>{notif.title}</p>
                                                <p className={`text-[11px] mt-0.5 leading-relaxed ${isRead ? 'text-gray-400' : 'text-gray-500'}`}>{notif.message}</p>
                                                <p className="text-[10px] text-gray-300 mt-1.5">
                                                    {notif.time
                                                        ? new Date(notif.time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                                                        : 'Recently'}
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

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

            {showMiniZooGame && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setShowMiniZooGame(false)}
                    />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center">
                                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Mini Zoo Game</h3>
                            <p className="text-gray-600 text-sm mb-6">
                                You are about to open the Mini Zoo Game in a new tab. Do you want to continue?
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowMiniZooGame(false)}
                                    className="flex-1 py-2.5 px-4 border border-gray-200 rounded-xl font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmMiniZooGame}
                                    className="flex-1 py-2.5 px-4 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors"
                                >
                                    Continue
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Header;