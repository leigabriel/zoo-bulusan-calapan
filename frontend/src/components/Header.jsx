import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProfileImageUrl, messageAPI, userAPI, reservationAPI } from '../services/api-client';
import LogoutModal from './common/LogoutModal';
import AnimalClassifier from './features/ai-scanner/AnimalClassifier';
import ReservationHistoryPanel from './features/ReservationHistoryPanel';
import Settings from '../pages/user/Settings';
import UserProfile from '../pages/user/UserProfile';
import useScrollLock from '../hooks/use-scroll-lock';
import {
    Home, Pet, Leaf, Calendar, Bell, Menu, CloseCircle, Ticket,
    People, Message, Globe, Game, Setting, Camera, Lifebuoy,
    Headset, Logout, Information, HandHeart
} from 'reicon-react';

const MINIZOO_GAME_URL = (typeof process !== 'undefined' && process.env && process.env.VITE_MINIZOO_GAME_URL) ? process.env.VITE_MINIZOO_GAME_URL : 'https://bulusanzootopia.vercel.app';

const ICON_COMPONENTS = {
    home: Home,
    animals: Pet,
    plants: Leaf,
    events: Calendar,
    notification: Bell,
    menu: Menu,
    close: CloseCircle,
    ticket: Ticket,
    profile: People,
    messages: Message,
    wildlife: Globe,
    game: Game,
    setting: Setting,
    camera: Camera,
    help: Lifebuoy,
    support: Headset,
    logout: Logout,
    about: Information,
    donation: HandHeart,
};

const NAV_LINKS = [
    { path: '/', label: 'Home', iconKey: 'home' },
    { path: '/animals', label: 'Animals', iconKey: 'animals' },
    { path: '/plants', label: 'Plants', iconKey: 'plants' },
    { path: '/events', label: 'Events', iconKey: 'events' },
    { path: '/community', label: 'Community', iconKey: 'messages' },
    { path: '/about', label: 'About', iconKey: 'about' },
];

const IconBtn = ({ iconKey, alt, onClick, badge, className = '' }) => {
    const IconComponent = ICON_COMPONENTS[iconKey];
    return (
        <button
            onClick={onClick}
            className={`relative flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0 ${className}`}
        >
            {IconComponent && <IconComponent size={18} className="opacity-55" />}
            {badge > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-[15px] h-[15px] px-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white leading-none">
                    {badge > 9 ? '9+' : badge}
                </span>
            )}
        </button>
    );
};

const CloseBtn = ({ onClick }) => (
    <button
        onClick={onClick}
        className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
    >
        <CloseCircle size={14} className="opacity-40" />
    </button>
);

const SectionLabel = ({ label }) => (
    <p className="px-1 pt-5 pb-2 text-[10px] font-bold text-gray-400 uppercase tracking-[0.16em]">{label}</p>
);

const MenuItem = ({ iconKey, label, badge, danger, to, onClick, onClose, isLast, onNavigate }) => {
    const IconComponent = ICON_COMPONENTS[iconKey];
    const inner = (
        <span className={`flex items-center gap-3 px-4 py-3 transition-colors group ${danger ? 'hover:bg-red-50/60' : 'hover:bg-[#ebebeb]'} ${!isLast ? 'border-b border-gray-50' : ''}`}>
            <span className={`w-8 h-8 flex items-center justify-center rounded-xl flex-shrink-0 ${danger ? 'bg-red-50' : 'bg-gray-50'}`}>
                {IconComponent && (
                    <IconComponent
                        size={15}
                        className={danger ? 'text-red-500' : 'opacity-50'}
                    />
                )}
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
    if (to) return (
        <Link to={to} onClick={(e) => { e.preventDefault(); onClose(); onNavigate(e, to); }} className="block">
            {inner}
        </Link>
    );
    return <button onClick={onClick} className="w-full">{inner}</button>;
};

const Header = () => {
    const { user, logout, loading: authLoading } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showSidePanel, setShowSidePanel] = useState(false);
    const [showAIScanner, setShowAIScanner] = useState(false);
    const [showHistoryPanel, setShowHistoryPanel] = useState(false);
    const [showSettingsPanel, setShowSettingsPanel] = useState(false);
    const [showProfilePanel, setShowProfilePanel] = useState(false);
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
    const [donationEnabled, setDonationEnabled] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const sidePanelRef = useRef(null);
    const notificationPanelRef = useRef(null);
    const lastScrollY = useRef(0);
    const hasOpenOverlay = isMenuOpen || showSidePanel || showAIScanner || showHistoryPanel
        || showSettingsPanel || showProfilePanel || showNotificationPanel || showMiniZooGame
        || showEmailModal || showLogoutModal;

    useScrollLock(hasOpenOverlay);

    const handleTransitionNavigate = (e, path) => {
        if (e) e.preventDefault();
        if (location.pathname === path) return;

        navigate(path);
        window.scrollTo(0, 0);
    };

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
        const loadDonationConfig = async () => {
            try {
                const res = await userAPI.getDonationConfig();
                if (res?.success && res.config) {
                    setDonationEnabled(Boolean(res.config.enabled));
                }
            } catch {
                setDonationEnabled(false);
            }
        };
        loadDonationConfig();
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

    const useOutsideClick = (ref, isOpen, setter) => {
        useEffect(() => {
            const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setter(false); };
            if (isOpen) {
                document.addEventListener('mousedown', handler);
            }
            return () => {
                document.removeEventListener('mousedown', handler);
            }
        }, [isOpen, ref, setter]);
    };

    useOutsideClick(sidePanelRef, showSidePanel, setShowSidePanel);
    useOutsideClick(notificationPanelRef, showNotificationPanel, setShowNotificationPanel);

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape') {
                setShowSidePanel(false);
                if (showAIScanner) setShowAIScanner(false);
                setShowNotificationPanel(false);
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [showAIScanner]);

    const fetchNotifications = useCallback(async (showLoading = true) => {
        if (!user) return;
        if (showLoading) setNotificationLoading(true);

        const formatSafeDate = (dateValue) => {
            if (!dateValue) return 'date to be announced';
            const parsed = new Date(dateValue);
            return Number.isNaN(parsed.getTime()) ? 'date to be announced' : parsed.toLocaleDateString();
        };

        const getReservationDate = (reservation) => {
            return reservation.reservation_date
                || reservation.visit_date
                || reservation.venue_event_date
                || reservation.event_date
                || null;
        };

        try {
            const notifs = [];
            const [eventsRes, messagesRes, ticketReservationsRes, eventReservationsRes, dbNotificationsRes] = await Promise.all([
                userAPI.getEvents(false).catch(() => ({ success: false })),
                messageAPI.getMyMessages().catch(() => ({ success: false })),
                reservationAPI.getMyTicketReservations().catch(() => ({ success: false })),
                reservationAPI.getMyEventReservations().catch(() => ({ success: false })),
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
            if (ticketReservationsRes?.success && ticketReservationsRes.reservations) {
                ticketReservationsRes.reservations
                    .filter(r => r.status === 'confirmed' || r.status === 'pending')
                    .slice(0, 3)
                    .forEach(r => notifs.push({
                        id: `reservation-ticket-${r.id}`,
                        type: 'reservation',
                        title: `Reservation #${r.booking_reference || r.reservation_reference || r.id}`,
                        message: r.status === 'confirmed'
                            ? `Confirmed for ${formatSafeDate(getReservationDate(r))}`
                            : 'Pending confirmation',
                        time: r.created_at,
                        path: null,
                        action: 'openReservationHistory',
                    }));
            }

            if (eventReservationsRes?.success && eventReservationsRes.reservations) {
                eventReservationsRes.reservations
                    .filter(r => r.status === 'confirmed' || r.status === 'pending')
                    .slice(0, 3)
                    .forEach(r => notifs.push({
                        id: `reservation-event-${r.id}`,
                        type: 'reservation',
                        title: `${r.venue_event_name || r.event_title || 'Event Reservation'} #${r.reservation_reference || r.id}`,
                        message: r.status === 'confirmed'
                            ? `Confirmed for ${formatSafeDate(getReservationDate(r))}`
                            : 'Pending confirmation',
                        time: r.created_at,
                        path: null,
                        action: 'openReservationHistory',
                    }));
            }
            notifs.sort((a, b) => new Date(b.time) - new Date(a.time));
            setNotifications(notifs);

            const serverReadIds = notifs
                .filter((notification) => notification.read)
                .map((notification) => notification.id);

            setReadNotificationIds((prev) => [...new Set([...prev, ...serverReadIds])]);
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
            handleTransitionNavigate(null, notif.path);
        }
    };

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 500));
            logout();
            setShowLogoutModal(false);
            handleTransitionNavigate(null, '/login');
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

    const handleOpenReservationHistory = () => { closeSidePanel(); setShowHistoryPanel(true); };
    const handleOpenSettings = () => { setShowSettingsPanel(true); };
    const handleOpenProfile = () => { setShowProfilePanel(true); };
    const handleOpenMiniZooGame = () => { setShowMiniZooGame(true); };
    const handleConfirmMiniZooGame = () => {
        setShowMiniZooGame(false);
        window.open(MINIZOO_GAME_URL, '_blank', 'noopener,noreferrer');
    };

    const quickItems = [
        ...(user?.role === 'admin' ? [{ iconKey: 'setting', label: 'Admin Dashboard', path: '/admin/dashboard' }] : []),
        ...(user?.role === 'staff' ? [{ iconKey: 'setting', label: 'Staff Dashboard', path: '/staff/dashboard' }] : []),
    ];

    const accountItems = [
        { iconKey: 'ticket', label: 'Reservations', action: handleOpenReservationHistory },
        { iconKey: 'events', label: 'My Events', path: '/my-events' },
        { iconKey: 'messages', label: 'My Messages', path: '/my-messages' },
    ];

    const exploreItems = [
        { iconKey: 'wildlife', label: 'Wildlife Origins', path: '/map' },
        { iconKey: 'game', label: 'Mini Zoo Game', action: handleOpenMiniZooGame },
        ...(donationEnabled ? [{ iconKey: 'donation', label: 'Donate', path: '/donation' }] : []),
    ];

    const avatarSrc = getProfileImageUrl(user?.profileImage || user?.profile_image) || '/profile-img/default-avatar.svg';
    const displayName = user?.fullName || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.username || 'Zoo visitor';
    const profileEmail = user?.email || 'Update your email address';

    return (
        <>
            <header
                className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ease-in-out ${isNavVisible ? 'translate-y-0' : '-translate-y-full'}`}
                style={{ paddingTop: 'env(safe-area-inset-top)' }}
            >
                <div className="mx-auto px-4 sm:px-6 lg:px-10 max-w-[1800px]" style={{ height: '56px' }}>
                    <div className="flex items-center h-full">
                        <div className="flex min-w-0 flex-shrink-0 items-center lg:w-[180px]">
                            <Link to="/" className="flex min-w-0 items-center" onClick={(e) => { e.preventDefault(); setIsMenuOpen(false); handleTransitionNavigate(e, '/'); }}>
                                <img src="/bz-url-logo.png" alt="Logo" className="w-7 h-7 object-contain mr-2" />
                                <span className="whitespace-nowrap text-[18px] font-bold text-[#212631] tracking-tight">
                                    BULUSAN ZOO
                                </span>
                            </Link>
                        </div>

                        <nav className="hidden lg:flex flex-1 items-center justify-center">
                            <div className="flex items-center border border-gray-500 shadow-md shadow-gray-400 gap-0.5 bg-green-400 rounded-full px-1.5 py-1.5">
                                {NAV_LINKS.map((link) => (
                                    <Link
                                        key={link.path}
                                        to={link.path}
                                        onClick={(e) => { e.preventDefault(); handleTransitionNavigate(e, link.path); }}
                                        className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-all duration-150 whitespace-nowrap ${location.pathname === link.path
                                            ? 'bg-[#000] text-gray-100 shadow-sm'
                                            : 'text-[#000]/50 hover:text-gray-800'
                                            }`}
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                            </div>
                        </nav>

                        <div className="hidden w-[180px] flex-shrink-0 items-center justify-end gap-2 lg:flex xl:w-[260px]">
                            <Link to="/reservations" onClick={(e) => { e.preventDefault(); handleTransitionNavigate(e, '/reservations'); }}>
                                <button className="px-4 py-1.5 rounded-full bg-gray-900 text-white text-[13px] font-medium hover:bg-gray-700 transition-colors whitespace-nowrap">
                                    Reserve
                                </button>
                            </Link>
                            {user && (
                                <IconBtn iconKey="notification" alt="Notifications" onClick={openNotifications} badge={unreadCount} />
                            )}
                            {authLoading ? (
                                <div className="flex items-center gap-2 px-4 py-1.5">
                                    <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                                </div>
                            ) : user ? (
                                <button
                                    onClick={() => setShowSidePanel(true)}
                                    className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border border-gray-200 bg-white hover:border-gray-500 hover:bg-green-400 transition-all"
                                >
                                    <img
                                        src={avatarSrc}
                                        alt="Profile"
                                        className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                                        referrerPolicy="no-referrer"
                                        onError={(e) => { e.target.onerror = null; e.target.src = '/profile-img/default-avatar.svg'; }}
                                    />
                                    <span className="hidden max-w-[80px] truncate text-[13px] font-medium text-gray-700 xl:block">
                                        {displayName}
                                    </span>
                                </button>
                            ) : (
                                <Link to="/login" onClick={(e) => { e.preventDefault(); handleTransitionNavigate(e, '/login'); }}>
                                    <button className="px-4 py-1.5 rounded-full text-[13px] font-medium text-gray-700 border border-gray-200 bg-white hover:bg-gray-50 transition-colors">
                                        Login
                                    </button>
                                </Link>
                            )}
                        </div>

                        <div className="ml-auto flex flex-shrink-0 items-center gap-1.5 lg:hidden">
                            {user && (
                                <IconBtn iconKey="notification" alt="Notifications" onClick={openNotifications} badge={unreadCount} />
                            )}
                            {user && (
                                <button
                                    onClick={() => setShowSidePanel(true)}
                                    className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0 overflow-hidden"
                                >
                                    <img
                                        src={avatarSrc}
                                        alt="Profile"
                                        className="w-7 h-7 rounded-full object-cover"
                                        referrerPolicy="no-referrer"
                                        onError={(e) => { e.target.onerror = null; e.target.src = '/profile-img/default-avatar.svg'; }}
                                    />
                                </button>
                            )}
                            <IconBtn iconKey={isMenuOpen ? 'close' : 'menu'} alt="Menu" onClick={() => setIsMenuOpen(!isMenuOpen)} />
                        </div>
                    </div>
                </div>

                <div
                    className={`absolute left-0 top-full flex w-full origin-top flex-col overflow-y-auto overscroll-contain border-t border-gray-100 bg-white shadow-xl transition-all duration-300 ease-in-out lg:hidden ${isMenuOpen ? 'max-h-[calc(100dvh-56px)] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}
                    data-lenis-prevent
                >
                    <div className="flex flex-col p-4 gap-4">
                        <div>
                            <div className="rounded-xl overflow-hidden border border-gray-100">
                                {NAV_LINKS.map((link) => {
                                    const active = location.pathname === link.path;
                                    const LinkIcon = ICON_COMPONENTS[link.iconKey];
                                    return (
                                        <Link
                                            key={link.path}
                                            to={link.path}
                                            onClick={(e) => { e.preventDefault(); setIsMenuOpen(false); handleTransitionNavigate(e, link.path); }}
                                            className={`flex items-center gap-3 px-4 py-3 transition-colors ${active ? 'bg-[#ebebeb]' : 'hover:bg-gray-50'}`}
                                        >
                                            {LinkIcon && (
                                                <LinkIcon
                                                    size={16}
                                                    className={`flex-shrink-0 ${active ? 'opacity-100' : 'opacity-45'}`}
                                                />
                                            )}
                                            <span className={`text-[13px] font-medium ${active ? 'text-[#000]' : 'text-gray-600'}`}>
                                                {link.label}
                                            </span>
                                        </Link>
                                    );
                                })}
                                <Link
                                    to="/reservations"
                                    onClick={(e) => { e.preventDefault(); setIsMenuOpen(false); handleTransitionNavigate(e, '/reservations'); }}
                                    className={`flex items-center gap-3 px-4 py-3 border-t border-gray-100 transition-colors ${location.pathname === '/reservations' ? 'bg-green-400' : 'hover:bg-gray-50'}`}
                                >
                                    <Ticket size={16} className={`flex-shrink-0 ${location.pathname === '/reservations' ? 'opacity-100' : 'opacity-45'}`} />
                                    <span className={`text-[13px] font-medium ${location.pathname === '/reservations' ? 'text-[#000]' : 'text-gray-600'}`}>
                                        Reserve
                                    </span>
                                </Link>
                            </div>
                        </div>

                        {authLoading ? (
                            <div className="flex items-center justify-center py-3">
                                <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                            </div>
                        ) : !user ? (
                            <Link to="/login" onClick={(e) => { e.preventDefault(); setIsMenuOpen(false); handleTransitionNavigate(e, '/login'); }}>
                                <button className="w-full py-3 rounded-xl bg-gray-900 text-white text-[13px] font-medium">
                                    Login / Sign Up
                                </button>
                            </Link>
                        ) : (
                            <button
                                onClick={() => { setIsMenuOpen(false); setShowLogoutModal(true); }}
                                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
                            >
                                <Logout
                                    size={16}
                                    className="flex-shrink-0 text-red-500 opacity-75"
                                />
                                <span className="text-[13px] font-medium">Sign Out</span>
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <div className={`fixed inset-0 z-[120] flex justify-end transition-all duration-300 ${showSidePanel ? 'visible' : 'invisible'}`}>
                <div
                    className={`absolute inset-0 bg-black/20 backdrop-blur-md transition-opacity duration-300 ${showSidePanel ? 'opacity-100' : 'opacity-0'}`}
                    onClick={closeSidePanel}
                />
                <div
                    ref={sidePanelRef}
                    className={`w-full h-full sm:max-w-[360px] bg-[#fbfdfb] shadow-2xl flex flex-col transform transition-transform duration-300 relative ${showSidePanel ? 'translate-x-0' : 'translate-x-full'}`}
                    role="dialog"
                    aria-modal="true"
                    aria-label="User navigation panel"
                >
                    <div className="relative flex-shrink-0 overflow-hidden border-b border-emerald-100 bg-white px-5 pb-5 pt-5">
                        <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-[#c6fe69]/40 blur-2xl" />
                        <div className="relative flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">Your space</p>
                                <h2 className="mt-1 text-lg font-bold tracking-tight text-[#172018]">Quick access</h2>
                            </div>
                            <CloseBtn onClick={closeSidePanel} />
                        </div>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6" data-lenis-prevent>
                        {quickItems.length > 0 && (
                            <>
                                <SectionLabel label="Quick Access" />
                                <div className="rounded-xl overflow-hidden border border-gray-200 bg-white">
                                    {quickItems.map((item, i) => (
                                        <MenuItem key={i} iconKey={item.iconKey} label={item.label} to={item.path} onClose={closeSidePanel} onNavigate={handleTransitionNavigate} isLast={i === quickItems.length - 1} />
                                    ))}
                                </div>
                            </>
                        )}

                        <SectionLabel label="Account" />
                        <div className="rounded-xl overflow-hidden border border-gray-200 bg-white">
                            {accountItems.map((item, i) => (
                                <MenuItem key={i} iconKey={item.iconKey} label={item.label} to={item.path} onClick={item.action} onClose={closeSidePanel} onNavigate={handleTransitionNavigate} isLast={i === accountItems.length - 1} />
                            ))}
                        </div>

                        <SectionLabel label="Explore" />
                        <div className="rounded-xl overflow-hidden border border-gray-200 bg-white">
                            {exploreItems.map((item, i) => (
                                <MenuItem key={i} iconKey={item.iconKey} label={item.label} to={item.path} onClick={item.action} onClose={closeSidePanel} onNavigate={handleTransitionNavigate} isLast={i === exploreItems.length - 1} />
                            ))}
                        </div>

                        <SectionLabel label="Tools & Preferences" />
                        <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm shadow-gray-100/70">
                            <MenuItem iconKey="setting" label="Settings" onClick={handleOpenSettings} isLast={false} />
                            <MenuItem
                                iconKey="camera"
                                label="AI Animal Scanner"
                                badge="New"
                                onClick={() => { closeSidePanel(); setShowAIScanner(true); }}
                                isLast={true}
                            />
                        </div>

                         <SectionLabel label="Support" />
                         <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm shadow-gray-100/70">
                             <MenuItem iconKey="help" label="Help Center" to="/help" onClose={closeSidePanel} onNavigate={handleTransitionNavigate} isLast={false} />
                             <MenuItem iconKey="support" label="Contact Support" onClick={openEmailModal} isLast={true} />
                         </div>
                         <div className="mt-5 space-y-3 border-t border-emerald-100 pt-5">
                             {user ? (
                                  <button
                                      type="button"
                                      onClick={handleOpenProfile}
                                  className="group flex w-full items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3 text-left transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50/50 hover:shadow-md hover:shadow-emerald-100/70"
                                     aria-label={`Open profile for ${displayName}`}
                                 >
                                     <img
                                         src={avatarSrc}
                                         alt=""
                                         className="h-11 w-11 flex-shrink-0 rounded-2xl border-2 border-white object-cover shadow-sm"
                                         referrerPolicy="no-referrer"
                                         onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/profile-img/default-avatar.svg'; }}
                                     />
                                     <span className="min-w-0 flex-1">
                                         <span className="block truncate text-[13px] font-bold text-[#172018]">{displayName}</span>
                                         <span className="mt-0.5 block truncate text-[11px] text-gray-500">{profileEmail}</span>
                                           <span className="mt-1 block text-[10px] font-bold uppercase tracking-wider text-emerald-700">View profile</span>
                                     </span>
                                     <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-white text-gray-400 shadow-sm transition-colors group-hover:text-green-400" aria-hidden="true">›</span>
                                  </button>
                             ) : (
                                 <Link to="/login" onClick={closeSidePanel} className="block rounded-2xl bg-[#172018] px-4 py-3 text-center text-[13px] font-semibold text-white transition-colors hover:bg-green-400">
                                     Sign in to your account
                                 </Link>
                             )}
                             <button
                                 type="button"
                                 onClick={() => { closeSidePanel(); setShowLogoutModal(true); }}
                                  className="flex w-full items-center gap-3 rounded-xl bg-red-300 px-3 py-2.5 text-red-900 transition-colors hover:bg-red-400"
                             >
                                 <Logout
                                     size={16}
                                     className="flex-shrink-0 text-red-900 opacity-75"
                                 />
                                 <span className="text-[13px] font-medium">Sign Out</span>
                             </button>
                         </div>
                     </div>
              </div>
              </div>

              <div className={`fixed inset-0 z-[125] flex justify-end transition-all duration-300 ${showSettingsPanel ? 'visible' : 'invisible'}`}>
                  <div className={`absolute inset-0 bg-black/25 backdrop-blur-[2px] transition-opacity duration-300 ${showSettingsPanel ? 'opacity-100' : 'opacity-0'}`} onClick={() => { setShowSettingsPanel(false); if (user) setShowSidePanel(true); }} />
                  <div className={`relative h-full w-full overflow-y-auto overscroll-contain bg-white shadow-2xl transition-transform duration-300 ease-out sm:w-1/2 sm:min-w-[420px] sm:max-w-[720px] ${showSettingsPanel ? 'translate-x-0' : 'translate-x-full'}`} role="dialog" aria-modal="true" aria-label="Account settings" data-lenis-prevent>
                      <Settings embedded onClose={() => { setShowSettingsPanel(false); if (user) setShowSidePanel(true); }} />
                  </div>
              </div>

              <div className={`fixed inset-0 z-[125] flex justify-end transition-all duration-300 ${showProfilePanel ? 'visible' : 'invisible'}`}>
                  <div className={`absolute inset-0 bg-black/25 backdrop-blur-[2px] transition-opacity duration-300 ${showProfilePanel ? 'opacity-100' : 'opacity-0'}`} onClick={() => { setShowProfilePanel(false); if (user) setShowSidePanel(true); }} />
                  <div className={`relative h-full w-full overflow-y-auto overscroll-contain bg-white shadow-2xl transition-transform duration-300 ease-out sm:w-1/2 sm:min-w-[420px] sm:max-w-[720px] ${showProfilePanel ? 'translate-x-0' : 'translate-x-full'}`} role="dialog" aria-modal="true" aria-label="User profile" data-lenis-prevent>
                      <UserProfile embedded onClose={() => { setShowProfilePanel(false); if (user) setShowSidePanel(true); }} />
                  </div>
              </div>

              <div className={`fixed inset-0 z-[110] flex justify-end transition-all duration-300 ${showAIScanner ? 'visible' : 'invisible'}`}>
                <div
                    className={`absolute inset-0 bg-black/25 backdrop-blur-[2px] transition-opacity duration-300 ${showAIScanner ? 'opacity-100' : 'opacity-0'}`}
                    onClick={() => { setShowAIScanner(false); if (user) setShowSidePanel(true); }}
                />
                <div
                    className={`relative w-full max-w-2xl h-full bg-[#f7faf7] shadow-2xl flex flex-col transform transition-transform duration-300 ${showAIScanner ? 'translate-x-0' : 'translate-x-full'}`}
                    role="dialog"
                    aria-modal="true"
                >
                    <div className="flex items-center gap-3 px-4 sm:px-6 py-4 border-b border-emerald-100/80 bg-white flex-shrink-0">
                        <div className="w-10 h-10 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                            <img src="/animal-scan.svg" alt="" className="w-9 h-9 object-contain" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900">AI Animal Scanner</p>
                            <p className="text-[11px] text-slate-500">Identify animals from a photo</p>
                        </div>
                        <CloseBtn onClick={() => { setShowAIScanner(false); if (user) setShowSidePanel(true); }} />
                    </div>
                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain" data-lenis-prevent>
                        {showAIScanner && <AnimalClassifier embedded={true} />}
                    </div>
                </div>
            </div>

            <div className={`fixed inset-0 z-[130] flex items-center justify-center p-4 transition-all duration-300 ${showEmailModal ? 'visible' : 'invisible'}`}>
                <div
                    className={`absolute inset-0 bg-black/25 backdrop-blur-[2px] transition-opacity duration-300 ${showEmailModal ? 'opacity-100' : 'opacity-0'}`}
                    onClick={() => { setShowEmailModal(false); setEmailSubject(''); setEmailMessage(''); setEmailError(''); }}
                />
                <div className={`max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain bg-white rounded-2xl shadow-xl w-full max-w-sm relative transform transition-all duration-300 ${showEmailModal ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-4 opacity-0'}`} data-lenis-prevent>
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
                    className={`absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ${showNotificationPanel ? 'translate-x-0' : 'translate-x-full'}`}
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
                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4" data-lenis-prevent>
                        {notificationLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <span className="text-[13px] text-gray-400">Loading…</span>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-2">
                                <div className="w-11 h-11 bg-gray-50 rounded-full flex items-center justify-center">
                                    <Bell size={20} className="opacity-25" />
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
                                                {notif.type === 'event' ? (
                                                    <Calendar size={16} className="opacity-55" />
                                                ) : notif.type === 'reservation' ? (
                                                    <Ticket size={16} className="opacity-55" />
                                                ) : (
                                                    <Message size={16} className="opacity-55" />
                                                )}
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
                        onClick={() => { setShowMiniZooGame(false); if (user) setShowSidePanel(true); }}
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
                                    onClick={() => { setShowMiniZooGame(false); if (user) setShowSidePanel(true); }}
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
