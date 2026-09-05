import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI, staffAPI, reservationAPI, communityAPI, getProfileImageUrl } from '../../services/api-client';
import { sanitizeInput } from '../../utils/sanitize';
import { notify } from '../../utils/toast';
import LogoutModal from '../common/LogoutModal';
import CollapsibleNavGroup from '../common/CollapsibleNavGroup';
import RoleCompanionFloatingButton from '../common/RoleCompanionFloatingButton';
import useScrollLock from '../../hooks/use-scroll-lock';
import {
    Home, Calendar, Ticket, Pet, Leaf, Message, Messages, ShieldCheck,
    Scan, Logout, Menu, Bell, CloseCircle, Lifebuoy, Checklist, Search, Setting, People,
    Sparkles, User, Trash
} from 'reicon-react';

const StaffLayout = ({ children }) => {
    const { user, logout, updateUser } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const searchRef = useRef(null);
    const searchInputRef = useRef(null);
    const mobileMenuRef = useRef(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);
    const [mobileHeaderMenuOpen, setMobileHeaderMenuOpen] = useState(false);
    const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
    const [dailyTaskPanelOpen, setDailyTaskPanelOpen] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [profileForm, setProfileForm] = useState({ firstName: '', lastName: '', email: '' });
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileSaving, setProfileSaving] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const [aiAssistOpen, setAiAssistOpen] = useState(false);
    const [openNavGroups, setOpenNavGroups] = useState({ main: true, management: true, communication: true });

    // Global search database state
    const [searchData, setSearchData] = useState({ animals: [], events: [], plants: [] });
    const [searchDataLoading, setSearchDataLoading] = useState(false);
    const [searchDataLoaded, setSearchDataLoaded] = useState(false);

    // Real notifications state
    const [notifications, setNotifications] = useState([]);
    const [notificationsLoading, setNotificationsLoading] = useState(false);
    const [activitySummary, setActivitySummary] = useState(null);
    const [dailyTaskStats, setDailyTaskStats] = useState({
        animals: 0,
        plants: 0,
        pendingTicketReservations: 0,
        pendingEventReservations: 0,
        pendingCommunityPosts: 0,
        reportedComments: 0
    });
    const [dailyTaskLoading, setDailyTaskLoading] = useState(false);
    const [dailyTaskDone, setDailyTaskDone] = useState({});
    const [dailyTaskHydrated, setDailyTaskHydrated] = useState(false);

    const getLocalDateKey = () => {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const todayKey = getLocalDateKey();
    const dailyTaskStorageKey = `staff_daily_task_completion_v1_${user?.id || 'anon'}`;

    const dailyTasks = useMemo(() => ([
        {
            id: 'animals',
            title: 'Check animal records',
            description: 'Review animal health and status updates.',
            path: '/staff/animals',
            count: dailyTaskStats.animals,
            countLabel: 'records'
        },
        {
            id: 'plants',
            title: 'Check plant records',
            description: 'Review plant condition and care updates.',
            path: '/staff/plants',
            count: dailyTaskStats.plants,
            countLabel: 'records'
        },
        {
            id: 'ticketReservations',
            title: 'Check ticket reservations',
            description: 'Handle pending ticket confirmations.',
            path: '/staff/reservations',
            count: dailyTaskStats.pendingTicketReservations,
            countLabel: 'pending'
        },
        {
            id: 'eventReservations',
            title: 'Check event reservations',
            description: 'Handle pending event confirmations.',
            path: '/staff/reservations',
            count: dailyTaskStats.pendingEventReservations,
            countLabel: 'pending'
        },
        {
            id: 'communityPosts',
            title: 'Check community posts',
            description: 'Moderate pending posts and reports.',
            path: '/staff/community-moderation',
            count: dailyTaskStats.pendingCommunityPosts + dailyTaskStats.reportedComments,
            countLabel: 'for review'
        }
    ]), [dailyTaskStats]);

    const completedTaskCount = dailyTasks.filter(task => dailyTaskDone[task.id]).length;

    // Fetch real notifications from API
    const fetchNotifications = async () => {
        try {
            setNotificationsLoading(true);
            const res = await staffAPI.getNotifications();
            if (res.success) {
                setNotifications(res.notifications || []);
                setActivitySummary(res.summary || null);
            }
        } catch (err) {
            // Error fetching notifications
        } finally {
            setNotificationsLoading(false);
        }
    };

    // Fetch notifications on mount and periodically
    useEffect(() => {
        fetchNotifications();
        // Refresh notifications every 30 seconds for real-time updates
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    // Fetch search database (animals, events, plants) on demand
    const searchDataFetchingRef = useRef(false);
    const fetchSearchData = useCallback(async () => {
        if (searchDataFetchingRef.current) return;
        searchDataFetchingRef.current = true;
        try {
            setSearchDataLoading(true);
            const [animalsRes, eventsRes, plantsRes] = await Promise.all([
                staffAPI.getAnimals().catch(() => ({ animals: [] })),
                staffAPI.getEvents().catch(() => ({ events: [] })),
                staffAPI.getPlants().catch(() => ({ plants: [] })),
            ]);
            setSearchData({
                animals: animalsRes?.animals || animalsRes?.data || [],
                events: eventsRes?.events || eventsRes?.data || [],
                plants: plantsRes?.plants || plantsRes?.data || [],
            });
            setSearchDataLoaded(true);
        } catch (err) {
            // Error fetching search data
        } finally {
            setSearchDataLoading(false);
            searchDataFetchingRef.current = false;
        }
    }, []);

    useEffect(() => {
        if (!user) return;

        const sendHeartbeat = async () => {
            try {
                await staffAPI.sendHeartbeat();
            } catch {
            }
        };

        sendHeartbeat();
        const heartbeatInterval = setInterval(sendHeartbeat, 60000);

        return () => clearInterval(heartbeatInterval);
    }, [user]);

    useEffect(() => {
        try {
            const raw = localStorage.getItem(dailyTaskStorageKey);
            if (!raw) {
                setDailyTaskDone({});
                return;
            }
            const parsed = JSON.parse(raw);
            if (parsed?.date === todayKey && parsed?.done && typeof parsed.done === 'object') {
                setDailyTaskDone(parsed.done);
            } else {
                setDailyTaskDone({});
            }
        } catch {
            setDailyTaskDone({});
        } finally {
            setDailyTaskHydrated(true);
        }
    }, [todayKey, dailyTaskStorageKey]);

    useEffect(() => {
        if (!dailyTaskHydrated) return;
        localStorage.setItem(dailyTaskStorageKey, JSON.stringify({ date: todayKey, done: dailyTaskDone }));
    }, [dailyTaskDone, todayKey, dailyTaskHydrated, dailyTaskStorageKey]);

    const markTaskCompleted = (taskId) => {
        setDailyTaskDone((prev) => {
            if (prev[taskId]) return prev;
            return { ...prev, [taskId]: true };
        });
    };

    const fetchDailyTaskStats = async () => {
        try {
            setDailyTaskLoading(true);
            const [animalsRes, plantsRes, ticketRes, eventRes, pendingPostsRes, reportsRes] = await Promise.all([
                staffAPI.getAnimals().catch(() => null),
                staffAPI.getPlants().catch(() => null),
                reservationAPI.getAllTicketReservations('staff').catch(() => null),
                reservationAPI.getAllEventReservations('staff').catch(() => null),
                communityAPI.getPendingPosts('staff').catch(() => null),
                communityAPI.getReportedComments('staff').catch(() => null)
            ]);

            const animals = animalsRes?.animals || animalsRes?.data || [];
            const plants = plantsRes?.plants || plantsRes?.data || [];
            const ticketReservations = ticketRes?.reservations || [];
            const eventReservations = eventRes?.reservations || [];
            const pendingPosts = pendingPostsRes?.posts || [];
            const reportedComments = reportsRes?.reports || [];

            setDailyTaskStats({
                animals: Array.isArray(animals) ? animals.length : 0,
                plants: Array.isArray(plants) ? plants.length : 0,
                pendingTicketReservations: Array.isArray(ticketReservations)
                    ? ticketReservations.filter((r) => r?.status === 'pending').length
                    : 0,
                pendingEventReservations: Array.isArray(eventReservations)
                    ? eventReservations.filter((r) => r?.status === 'pending').length
                    : 0,
                pendingCommunityPosts: Array.isArray(pendingPosts) ? pendingPosts.length : 0,
                reportedComments: Array.isArray(reportedComments) ? reportedComments.length : 0
            });
        } catch {
        } finally {
            setDailyTaskLoading(false);
        }
    };

    useEffect(() => {
        if (!dailyTaskPanelOpen) return;
        fetchDailyTaskStats();
    }, [dailyTaskPanelOpen]);

    // Generate recent activities from summary
    const recentActivities = useMemo(() => {
        if (!activitySummary) return [];
        const activities = [];

        if (activitySummary.tickets?.today > 0) {
            activities.push({
                id: 'tickets',
                icon: '🎟️',
                message: `${activitySummary.tickets.today} ticket${activitySummary.tickets.today > 1 ? 's' : ''} sold today.`,
                time: 'Today',
                color: 'green'
            });
        }

        if (activitySummary.pendingTickets > 0) {
            activities.push({
                id: 'pending',
                icon: '⏳',
                message: `${activitySummary.pendingTickets} ticket${activitySummary.pendingTickets > 1 ? 's' : ''} pending validation.`,
                time: 'Action needed',
                color: 'yellow'
            });
        }

        if (activitySummary.users?.today > 0) {
            activities.push({
                id: 'users',
                icon: '👤',
                message: `${activitySummary.users.today} new user${activitySummary.users.today > 1 ? 's' : ''} registered.`,
                time: 'Today',
                color: 'blue'
            });
        }

        if (activitySummary.events?.upcoming > 0) {
            activities.push({
                id: 'events',
                icon: '📅',
                message: `${activitySummary.events.upcoming} upcoming event${activitySummary.events.upcoming > 1 ? 's' : ''}.`,
                time: 'Scheduled',
                color: 'purple'
            });
        }

        return activities;
    }, [activitySummary]);

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
                    const imgUrl = res.user.profileImage || res.user.profile_image;
                    setPreviewImage(getProfileImageUrl(imgUrl));
                }
            } else if (user) {
                setProfileForm({
                    firstName: user.firstName || user.first_name || '',
                    lastName: user.lastName || user.last_name || '',
                    email: user.email || ''
                });
            }
        } catch (err) {
            notify.error("Couldn't load profile.");
        } finally {
            setProfileLoading(false);
        }
    };

    // Save profile changes
    const saveProfile = async () => {
        setProfileSaving(true);
        try {
            const payload = { firstName: profileForm.firstName, lastName: profileForm.lastName };
            const res = await authAPI.updateProfile(payload, 'staff');
            if (res && res.success) {
                updateUser({ ...user, firstName: profileForm.firstName, lastName: profileForm.lastName });
                notify.success('Profile updated.');
            } else {
                notify.error(res.message || "Couldn't save changes.");
            }
        } catch (err) {
            notify.error("Couldn't save changes.");
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

    const menuItems = [
        { path: '/staff/dashboard', label: 'Overview', Icon: Home },
        { path: '/staff/qr-scanner', label: 'QR Scanner', Icon: Scan },
    ];

    const managementItems = [
        { path: '/staff/events', label: 'Events', Icon: Calendar },
        { path: '/staff/reservations', label: 'Reservations', Icon: Ticket },
        { path: '/staff/animals', label: 'Manage Animals', Icon: Pet },
        { path: '/staff/plants', label: 'Manage Plants', Icon: Leaf },
    ];

    const communicationItems = [
        { path: '/staff/messages', label: 'Messages', Icon: Message },
        { path: '/staff/community-moderation', label: 'Community Moderation', Icon: ShieldCheck },
    ];

    const allMenuItems = [...menuItems, ...managementItems, ...communicationItems];
    const navGroups = [
        { key: 'main', label: 'Main', items: menuItems, Icon: Home },
        { key: 'management', label: 'Management', items: managementItems, Icon: Pet },
        { key: 'communication', label: 'Communication', items: communicationItems, Icon: Messages },
    ];
    const hasOpenOverlay = sidebarOpen || notificationPanelOpen || dailyTaskPanelOpen
        || showProfileModal || showLogoutModal || aiAssistOpen || showSearchDropdown;

    useScrollLock(hasOpenOverlay);

    // Global search items (pages + database)
    const filteredSearchItems = useMemo(() => {
        if (!searchQuery.trim()) return [];
        const query = searchQuery.toLowerCase();
        const results = [];

        // 1. Search pages
        const pageResults = allMenuItems.filter(item =>
            item.label.toLowerCase().includes(query)
        ).map(item => ({
            ...item,
            type: 'page',
            category: 'Pages',
        }));
        results.push(...pageResults);

        // 2. Search animals
        const animalResults = searchData.animals.filter(animal =>
            (animal.name || animal.commonName || '').toLowerCase().includes(query) ||
            (animal.species || '').toLowerCase().includes(query)
        ).slice(0, 5).map(animal => ({
            id: `animal-${animal.id || animal._id}`,
            label: animal.name || animal.commonName || 'Unknown Animal',
            sublabel: animal.species || 'Animal',
            path: '/staff/animals',
            Icon: Pet,
            type: 'data',
            category: 'Animals',
        }));
        results.push(...animalResults);

        // 3. Search events
        const eventResults = searchData.events.filter(event =>
            (event.name || event.title || '').toLowerCase().includes(query) ||
            (event.description || '').toLowerCase().includes(query)
        ).slice(0, 5).map(event => ({
            id: `event-${event.id || event._id}`,
            label: event.name || event.title || 'Unknown Event',
            sublabel: event.date ? new Date(event.date).toLocaleDateString() : 'Event',
            path: '/staff/events',
            Icon: Calendar,
            type: 'data',
            category: 'Events',
        }));
        results.push(...eventResults);

        // 4. Search plants
        const plantResults = searchData.plants.filter(plant =>
            (plant.name || plant.commonName || '').toLowerCase().includes(query) ||
            (plant.species || '').toLowerCase().includes(query)
        ).slice(0, 5).map(plant => ({
            id: `plant-${plant.id || plant._id}`,
            label: plant.name || plant.commonName || 'Unknown Plant',
            sublabel: plant.species || 'Plant',
            path: '/staff/plants',
            Icon: Leaf,
            type: 'data',
            category: 'Plants',
        }));
        results.push(...plantResults);

        return results.slice(0, 15);
    }, [searchQuery, allMenuItems, searchData]);

    const handleNavClick = () => {
        if (window.innerWidth < 1024) {
            setSidebarOpen(false);
        }
    };

    // Close sidebars on route change for mobile
    useEffect(() => {
        setSidebarOpen(false);
        setNotificationPanelOpen(false);
        setDailyTaskPanelOpen(false);
        setShowSearchDropdown(false);
        setMobileHeaderMenuOpen(false);
    }, [location.pathname]);

    // Close panels when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setShowSearchDropdown(false);
            }
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) {
                setMobileHeaderMenuOpen(false);
            }
            if (notificationPanelOpen && !e.target.closest('.notification-panel') && !e.target.closest('.notification-bell')) {
                setNotificationPanelOpen(false);
            }
            if (dailyTaskPanelOpen && !e.target.closest('.daily-task-panel') && !e.target.closest('.daily-task-btn')) {
                setDailyTaskPanelOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [notificationPanelOpen, dailyTaskPanelOpen]);

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden font-['JetBrains']">
            {/* Mobile overlay for left sidebar */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Notification Panel Overlay */}
            {(notificationPanelOpen || dailyTaskPanelOpen) && (
                <div
                    className="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm"
                    onClick={() => {
                        setNotificationPanelOpen(false);
                        setDailyTaskPanelOpen(false);
                    }}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar - matching Admin design system */}
            <aside
                className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} 
                    fixed lg:relative z-50 lg:z-auto w-64 bg-[#ebebeb] border-r border-gray-300 
                    transition-transform duration-300 flex flex-col h-full`}
                aria-label="Staff navigation"
            >
                {/* Logo Section */}
                <div className="p-3.5 flex items-center gap-3 border-b border-gray-300">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white">
                        <img src="/bz-url-logo.png" alt="Bz Logo" className="w-12 h-12 object-contain" />
                    </div>
                    <div>
                        <h1 className="font-bold text-gray-900 text-lg uppercase">Bulusan Zoo</h1>
                        <p className="text-xs text-gray-500">Staff Portal</p>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="ml-auto lg:hidden text-gray-400 hover:text-gray-900"
                    >
                        <CloseCircle size={20} />
                    </button>
                </div>

                {/* Navigation Menu */}
                <nav className="flex-1 px-3 py-4 overflow-y-auto" role="navigation">
                    {navGroups.map((group) => (
                        <CollapsibleNavGroup
                            key={group.key}
                            label={group.label}
                            items={group.items}
                            Icon={group.Icon}
                            open={openNavGroups[group.key]}
                            onToggle={() => setOpenNavGroups((current) => ({ ...current, [group.key]: !current[group.key] }))}
                            pathname={location.pathname}
                            onNavigate={handleNavClick}
                        />
                    ))}
                </nav>

                {/* Bottom Section - Help & Logout */}
                <div className="p-4 border-t border-gray-200 space-y-2">
                    <Link
                        to="/staff/help"
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${location.pathname === '/staff/help'
                                ? 'bg-green-50 text-green-700'
                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                            }`}
                    >
                        <Lifebuoy size={20} />
                        <span className="font-medium">Help Center</span>
                    </Link>

                    <div className="flex gap-2">
                        {/* <Link
                            to="/staff/settings"
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all duration-200 ${location.pathname === '/staff/settings'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300 hover:text-gray-900'
                                }`}
                        >
                            <Setting size={20} />
                        </Link> */}

                        <button
                            onClick={() => setShowLogoutModal(true)}
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-500 hover:bg-red-600 
                                rounded-xl font-medium text-white transition-all duration-200 
                                shadow-md shadow-red-500/20"
                            aria-label="Logout from staff portal"
                        >
                            <Logout size={20} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Header */}
                <header className="bg-[#ebebeb] border-b border-gray-300 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 relative">
                    {/* Mobile Header */}
                    <div className="flex items-center justify-between lg:hidden">
                        <div className="flex items-center gap-3 min-w-0">
                            <button
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 hover:text-gray-900 transition flex-shrink-0"
                                aria-label={sidebarOpen ? 'Close sidebar menu' : 'Open sidebar menu'}
                                aria-expanded={sidebarOpen}
                            >
                                <Menu size={22} />
                            </button>
                            <h2 className="text-base font-bold text-gray-900 truncate">
                                {allMenuItems.find(item => item.path === location.pathname)?.label ||
                                    (location.pathname === '/staff/help' ? 'Help Center' :
                                        location.pathname === '/staff/settings' ? 'Settings' : 'Staff Portal')}
                            </h2>
                        </div>
                        <div className="flex items-center gap-2" ref={mobileMenuRef}>
                            <button
                                onClick={() => setMobileHeaderMenuOpen(!mobileHeaderMenuOpen)}
                                className="relative p-2 hover:bg-gray-100 rounded-xl transition flex-shrink-0"
                                aria-label="Open menu"
                            >
                                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                    {(user?.firstName || user?.lastName || user?.fullName)?.charAt(0) || 'S'}
                                </div>
                                {unreadCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>
                            {mobileHeaderMenuOpen && (
                                <div className="absolute top-full right-3 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-[60] py-2">
                                    <button
                                        onClick={() => { setMobileHeaderMenuOpen(false); setNotificationPanelOpen(true); }}
                                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                                    >
                                        <Bell size={18} className="text-gray-400" />
                                        <span className="text-sm text-gray-700">Notifications</span>
                                        {unreadCount > 0 && (
                                            <span className="ml-auto text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">{unreadCount}</span>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => { setMobileHeaderMenuOpen(false); setAiAssistOpen(true); }}
                                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                                    >
                                        <Sparkles size={18} className="text-gray-400" />
                                        <span className="text-sm text-gray-700">AI Assist</span>
                                    </button>
                                    <button
                                        onClick={() => { setMobileHeaderMenuOpen(false); setDailyTaskPanelOpen(true); }}
                                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                                    >
                                        <Checklist size={18} className="text-gray-400" />
                                        <span className="text-sm text-gray-700">Daily Tasks</span>
                                        <span className="ml-auto text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">{completedTaskCount}/{dailyTasks.length}</span>
                                    </button>
                                    <Link
                                        to="/staff/trash"
                                        onClick={() => setMobileHeaderMenuOpen(false)}
                                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                                    >
                                        <Trash size={18} className="text-gray-400" />
                                        <span className="text-sm text-gray-700">Trash</span>
                                    </Link>
                                    <button
                                        onClick={() => { setMobileHeaderMenuOpen(false); openProfileModal(); }}
                                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                                    >
                                        <User size={18} className="text-gray-400" />
                                        <span className="text-sm text-gray-700">Profile</span>
                                    </button>
                                    <div className="border-t border-gray-100 mt-1 pt-1">
                                        <button
                                            onClick={() => { setMobileHeaderMenuOpen(false); setShowLogoutModal(true); }}
                                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                                        >
                                            <Logout size={18} className="text-red-500" />
                                            <span className="text-sm text-red-600">Sign Out</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Desktop Header */}
                    <div className="hidden lg:flex items-center">
                        <div className="flex items-center gap-4 min-w-0 w-64 flex-shrink-0">
                            <h2 className="text-xl font-bold text-gray-900 truncate">
                                {allMenuItems.find(item => item.path === location.pathname)?.label ||
                                    (location.pathname === '/staff/help' ? 'Help Center' :
                                        location.pathname === '/staff/settings' ? 'Settings' : 'Staff Portal')}
                            </h2>
                        </div>
                        {/* Centered Search */}
                        <div className="flex-1 flex justify-center px-4">
                            <div className="relative w-full max-w-md" ref={searchRef}>
                                <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 focus-within:border-green-500 focus-within:ring-1 focus-within:ring-green-500/20 transition-all">
                                    <Search size={16} className="text-gray-400 flex-shrink-0" />
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            if (e.target.value.trim()) {
                                                setShowSearchDropdown(true);
                                                fetchSearchData();
                                            } else {
                                                setShowSearchDropdown(false);
                                            }
                                        }}
                                        onFocus={() => {
                                            if (searchQuery.trim()) {
                                                setShowSearchDropdown(true);
                                                fetchSearchData();
                                            }
                                        }}
                                        placeholder="Search pages, animals, events..."
                                        className="bg-transparent border-none outline-none text-sm text-gray-900 placeholder-gray-400 w-full"
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => { setSearchQuery(''); setShowSearchDropdown(false); }}
                                            className="text-gray-400 hover:text-gray-600"
                                        >
                                            <CloseCircle size={14} />
                                        </button>
                                    )}
                                </div>
                                {showSearchDropdown && searchQuery.trim() && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-[60] max-h-80 overflow-y-auto w-96">
                                        {searchDataLoading && filteredSearchItems.length === 0 ? (
                                            <div className="px-4 py-6 text-center text-gray-500">
                                                <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                                <p className="text-sm">Searching...</p>
                                            </div>
                                        ) : filteredSearchItems.length > 0 ? (
                                            <>
                                                {filteredSearchItems.filter(i => i.type === 'page').length > 0 && (
                                                    <div>
                                                        <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                                                            <p className="text-xs font-semibold text-gray-500 uppercase">Pages</p>
                                                        </div>
                                                        {filteredSearchItems.filter(i => i.type === 'page').map((item) => (
                                                            <Link
                                                                key={item.path}
                                                                to={item.path}
                                                                onClick={() => { setSearchQuery(''); setShowSearchDropdown(false); handleNavClick(); }}
                                                                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                                                            >
                                                                <item.Icon size={18} className="text-gray-400 flex-shrink-0" />
                                                                <div className="min-w-0">
                                                                    <p className="text-sm font-medium text-gray-900 truncate">{item.label}</p>
                                                                    <p className="text-xs text-gray-500 truncate">{item.path}</p>
                                                                </div>
                                                            </Link>
                                                        ))}
                                                    </div>
                                                )}
                                                {['Animals', 'Events', 'Plants'].map(category => {
                                                    const items = filteredSearchItems.filter(i => i.category === category);
                                                    if (items.length === 0) return null;
                                                    return (
                                                        <div key={category}>
                                                            <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 border-t">
                                                                <p className="text-xs font-semibold text-gray-500 uppercase">{category}</p>
                                                            </div>
                                                            {items.map((item) => (
                                                                <Link
                                                                    key={item.id}
                                                                    to={item.path}
                                                                    onClick={() => { setSearchQuery(''); setShowSearchDropdown(false); handleNavClick(); }}
                                                                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                                                                >
                                                                    <item.Icon size={18} className="text-gray-400 flex-shrink-0" />
                                                                    <div className="min-w-0 flex-1">
                                                                        <p className="text-sm font-medium text-gray-900 truncate">{item.label}</p>
                                                                        <p className="text-xs text-gray-500 truncate">{item.sublabel}</p>
                                                                    </div>
                                                                    <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded font-medium flex-shrink-0">{category}</span>
                                                                </Link>
                                                            ))}
                                                        </div>
                                                    );
                                                })}
                                            </>
                                        ) : (
                                            <div className="px-4 py-6 text-center text-gray-500">
                                                <Search size={24} className="mx-auto mb-2 text-gray-300" />
                                                <p className="text-sm">No results found</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        {/* Right icons */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                                type="button"
                                onClick={() => setAiAssistOpen(true)}
                                className="p-2.5 hover:bg-gray-100 rounded-xl text-gray-500 hover:text-gray-900 transition"
                                aria-label="Open AI Assist"
                            >
                                <Sparkles size={20} />
                            </button>
                            <button
                                onClick={() => setNotificationPanelOpen(!notificationPanelOpen)}
                                className="notification-bell relative p-2.5 hover:bg-gray-100 rounded-xl text-gray-500 hover:text-gray-900 transition"
                                aria-label="Toggle notifications"
                            >
                                <Bell size={20} />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1 right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => navigate('/staff/trash')}
                                className="p-2.5 hover:bg-gray-100 rounded-xl text-gray-500 hover:text-gray-900 transition"
                                aria-label="Trash"
                            >
                                <Trash size={20} />
                            </button>
                            <button
                                onClick={() => setDailyTaskPanelOpen(!dailyTaskPanelOpen)}
                                className="daily-task-btn relative p-2.5 hover:bg-gray-100 rounded-xl text-gray-500 hover:text-gray-900 transition"
                                aria-label="Toggle daily tasks"
                            >
                                <Checklist size={20} />
                                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-green-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                                    {completedTaskCount}/{dailyTasks.length}
                                </span>
                            </button>
                            <button
                                onClick={openProfileModal}
                                className="p-1 hover:bg-gray-100 rounded-xl transition"
                                aria-label="Open profile"
                            >
                                <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                    {(user?.firstName || user?.lastName || user?.fullName)?.charAt(0) || 'S'}
                                </div>
                            </button>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className={`flex-1 p-4 lg:p-6 bg-gray-50 ${hasOpenOverlay ? 'overflow-hidden' : 'overflow-auto'}`}>
                    {typeof children === 'function' ? children({ globalSearch: searchQuery }) :
                        React.Children.map(children, child =>
                            React.isValidElement(child) ? React.cloneElement(child, { globalSearch: searchQuery }) : child
                        )}
                </main>
            </div>

            <aside
                className={`daily-task-panel fixed right-0 top-0 z-50 w-full sm:w-96 h-full bg-white border-l border-gray-200 flex flex-col overscroll-contain
                    transform transition-transform duration-300 ease-in-out ${dailyTaskPanelOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
                aria-label="Daily tasks panel"
            >
                <div className="p-5 flex items-center justify-between border-b border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Checklist size={20} />
                        Daily Tasks
                    </h3>
                    <button
                        onClick={() => setDailyTaskPanelOpen(false)}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-900 transition"
                    >
                        <CloseCircle size={20} />
                    </button>
                </div>

                <div className="px-5 py-3 border-b border-gray-200">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                        <span>Progress</span>
                        <span>{completedTaskCount} of {dailyTasks.length} completed</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div
                            className="h-full bg-green-500 rounded-full transition-all duration-300"
                            style={{ width: `${(completedTaskCount / dailyTasks.length) * 100}%` }}
                        />
                    </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 space-y-3">
                    {dailyTaskLoading && (
                        <div className="text-sm text-gray-500 p-4 bg-gray-50 rounded-xl border border-gray-200">
                            Loading daily task data...
                        </div>
                    )}
                    {dailyTasks.map((task) => (
                        <div key={task.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50">
                            <div className="flex items-start gap-3">
                                <button
                                    onClick={() => markTaskCompleted(task.id)}
                                    className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition ${dailyTaskDone[task.id]
                                            ? 'bg-green-500 border-green-500 text-white'
                                            : 'border-gray-300 text-transparent hover:border-green-500'
                                        }`}
                                    aria-label={`Mark ${task.title} complete`}
                                >
                                    ✓
                                </button>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium ${dailyTaskDone[task.id] ? 'text-green-700' : 'text-gray-900'}`}>
                                        {task.title}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">{task.description}</p>
                                    <div className="mt-2 flex items-center justify-between">
                                        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 border border-green-200">
                                            {task.count} {task.countLabel}
                                        </span>
                                        <button
                                            onClick={() => {
                                                markTaskCompleted(task.id);
                                                setDailyTaskPanelOpen(false);
                                                navigate(task.path);
                                            }}
                                            className="text-xs font-semibold text-green-600 hover:text-green-700 transition"
                                        >
                                            Open page
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </aside>

            {/* Slide-in Notification Panel */}
            <aside
                className={`notification-panel fixed right-0 top-0 z-50 w-full sm:w-[420px] max-w-lg h-full bg-white border-l border-gray-200 flex flex-col overscroll-contain
                    transform transition-transform duration-300 ease-in-out ${notificationPanelOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
                aria-label="Notifications panel"
            >
                {/* Notifications Header */}
                <div className="p-5 flex items-center justify-between border-b border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Bell size={20} />
                        Notifications
                        {unreadCount > 0 && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                {unreadCount} new
                            </span>
                        )}
                    </h3>
                    <button
                        onClick={() => setNotificationPanelOpen(false)}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-900 transition"
                    >
                        <CloseCircle size={20} />
                    </button>
                </div>

                {/* Notifications List */}
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 space-y-3">
                    {notifications.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <Bell size={32} />
                            <p className="mt-2">No notifications</p>
                        </div>
                    ) : (
                        notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`p-4 rounded-xl border transition-all cursor-pointer hover:border-green-300 ${notification.read
                                        ? 'bg-gray-50 border-gray-100'
                                        : 'bg-green-50 border-green-200'
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${notification.read ? 'bg-gray-300' : 'bg-green-500'
                                        }`}></div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm ${notification.read ? 'text-gray-500' : 'text-gray-900'}`}>
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
                <div className="border-t border-gray-200 p-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Recent Activities</h4>
                    <div className="space-y-3">
                        {recentActivities.map((activity) => (
                            <div key={activity.id} className="flex items-center gap-3 text-sm">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${activity.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                                        activity.color === 'green' ? 'bg-green-100 text-green-600' :
                                            'bg-yellow-100 text-yellow-600'
                                    }`}>
                                    <span className="text-xs">{activity.icon}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-gray-700 truncate">{activity.message}</p>
                                    <p className="text-xs text-gray-500">{activity.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Mark All Read Button */}
                <div className="border-t border-gray-200 p-4">
                    <button className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 rounded-xl text-sm font-medium transition">
                        Mark all as read
                    </button>
                </div>
            </aside>

            {/* Profile Modal */}
            {showProfileModal && (
                <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto overscroll-contain shadow-xl">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-5 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900">Staff Profile</h2>
                            <button
                                onClick={() => setShowProfileModal(false)}
                                className="text-gray-400 hover:text-gray-900 transition"
                            >
                                <CloseCircle size={20} />
                            </button>
                        </div>

                        {profileLoading ? (
                            <div className="flex items-center justify-center p-12">
                                <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : (
                            <div className="p-5 space-y-5">
                                {/* Avatar */}
                                <div className="flex justify-center">
                                    <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center overflow-hidden">
                                        {previewImage ? (
                                            <img
                                                src={previewImage}
                                                alt="Profile"
                                                className="w-full h-full object-cover"
                                                referrerPolicy="no-referrer"
                                                onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
                                            />
                                        ) : (
                                            <span className="text-4xl font-bold text-white">
                                                {profileForm.firstName?.charAt(0) || 'S'}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Role Badge */}
                                <div className="flex justify-center">
                                    <span className="px-4 py-1.5 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                                        Staff Member
                                    </span>
                                </div>

                                {/* First Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                                    <input
                                        type="text"
                                        value={profileForm.firstName}
                                        onChange={(e) => setProfileForm({ ...profileForm, firstName: sanitizeInput(e.target.value) })}
                                        className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/20 transition-all"
                                        placeholder="Enter first name"
                                    />
                                </div>

                                {/* Last Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                                    <input
                                        type="text"
                                        value={profileForm.lastName}
                                        onChange={(e) => setProfileForm({ ...profileForm, lastName: sanitizeInput(e.target.value) })}
                                        className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/20 transition-all"
                                        placeholder="Enter last name"
                                    />
                                </div>

                                {/* Email (Read-only) */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                                    <input
                                        type="email"
                                        value={profileForm.email}
                                        readOnly
                                        className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-gray-500 cursor-not-allowed"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                                </div>

                                {/* Account Status */}
                                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600">Status</span>
                                        <span className="flex items-center gap-1.5 text-green-600">
                                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                            Active
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600">Role</span>
                                        <span className="text-gray-900 capitalize">{user?.role || 'Staff'}</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => setShowProfileModal(false)}
                                        className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-medium transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={saveProfile}
                                        disabled={profileSaving}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition disabled:opacity-50"
                                    >
                                        {profileSaving ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
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

            <RoleCompanionFloatingButton role="staff" open={aiAssistOpen} onOpenChange={setAiAssistOpen} hideTrigger />

        </div>
    );
};

export default StaffLayout;
