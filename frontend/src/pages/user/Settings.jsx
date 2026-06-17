import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { notify } from '../../utils/toast';
import { userAPI } from '../../services/api-client';
import LoadingSpinner from '../../components/common/LoadingSpinner';

// Icons
const Icons = {
    Back: () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
    ),
    Home: () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
    ),
    Bell: () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
    ),
    Activity: () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
    ),
    Help: () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    ChevronRight: () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
    ),
    Ticket: () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
    ),
    Message: () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
    ),
    Heart: () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
    )
};

const Settings = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState('notifications');
    const [isLoading, setIsLoading] = useState(true);
    
    // Notifications State
    const [notifications, setNotifications] = useState({
        emailNotifications: true,
        pushNotifications: true,
        eventReminders: true,
        ticketUpdates: true,
        marketingEmails: false
    });
    
    // Activities State
    const [activities, setActivities] = useState([]);
    const [activitiesLoading, setActivitiesLoading] = useState(false);
    const [activitiesError, setActivitiesError] = useState(null);

    useEffect(() => {
        if (!user) return;
        
        const fetchSettings = async () => {
            try {
                const response = await userAPI.getSettings();
                if (response.success && response.settings) {
                    setNotifications(prev => ({
                        ...prev,
                        ...response.settings
                    }));
                }
            } catch (error) {
                console.error("Failed to fetch settings:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSettings();
    }, [user]);

    const fetchActivities = async () => {
        setActivitiesLoading(true);
        setActivitiesError(null);
        try {
            const response = await userAPI.getActivities();
            if (response.success) {
                setActivities(response.activities || []);
            } else {
                setActivitiesError("Unable to load activity history.");
            }
        } catch (error) {
            console.error("Failed to fetch activities:", error);
            setActivitiesError("Unable to load activity history.");
        } finally {
            setActivitiesLoading(false);
        }
    };

    useEffect(() => {
        if (activeSection === 'activities' && user) {
            fetchActivities();
        }
    }, [activeSection, user]);

    const handleNotificationToggle = async (key, value) => {
        const newSettings = { ...notifications, [key]: value };
        setNotifications(newSettings);
        
        try {
            await userAPI.updateSettings(newSettings);
            notify.success('Settings updated successfully.');
        } catch (error) {
            console.error("Failed to save settings:", error);
            // Revert on failure
            setNotifications(notifications);
            notify.error('Failed to update settings. Please try again.');
        }
    };

    const menuItems = [
        { id: 'notifications', label: 'Notifications', icon: Icons.Bell, description: 'Manage your alerts' },
        { id: 'activities', label: 'Activity Log', icon: Icons.Activity, description: 'Your history & interactions' },
        { id: 'help', label: 'Need Help?', icon: Icons.Help, description: 'Support & FAQs' }
    ];

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="text-center bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Icons.Bell />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
                    <p className="text-gray-600 mb-6">Please log in to manage your settings and view your activities.</p>
                    <Link to="/login" className="block w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors">
                        Go to Login
                    </Link>
                </div>
            </div>
        );
    }

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return date.toLocaleDateString('en-US', options);
    };

    const getActivityIcon = (type) => {
        switch (type) {
            case 'ticket_reservation': return <Icons.Ticket />;
            case 'community_post':
            case 'community_comment': return <Icons.Message />;
            case 'community_like': return <Icons.Heart />;
            default: return <Icons.Activity />;
        }
    };

    const getActivityColor = (type) => {
        switch (type) {
            case 'ticket_reservation': return 'bg-blue-100 text-blue-600';
            case 'community_post': return 'bg-emerald-100 text-emerald-600';
            case 'community_comment': return 'bg-purple-100 text-purple-600';
            case 'community_like': return 'bg-red-100 text-red-600';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    const getActivityTitle = (activity) => {
        switch (activity.type) {
            case 'ticket_reservation': return `Reserved Ticket: ${activity.details || 'General Admission'}`;
            case 'community_post': return 'Created a Post';
            case 'community_comment': return 'Commented on a Post';
            case 'community_like': return 'Liked a Post';
            default: return 'Activity';
        }
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex items-center justify-center h-64">
                    <LoadingSpinner size="lg" />
                </div>
            );
        }

        switch (activeSection) {
            case 'notifications':
                return (
                    <div className="space-y-6 animate-fade-in">
                        <div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Notification Preferences</h3>
                            <p className="text-gray-500 mb-6 text-sm">Choose how you want us to communicate with you.</p>
                            
                            <div className="space-y-4">
                                {[
                                    { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive important updates via email' },
                                    { key: 'pushNotifications', label: 'In-App Notifications', desc: 'Alerts within the application' },
                                    { key: 'eventReminders', label: 'Event Reminders', desc: 'Get reminded about upcoming zoo events' },
                                    { key: 'ticketUpdates', label: 'Ticket Updates', desc: 'Updates about your bookings and reservations' },
                                    { key: 'marketingEmails', label: 'Promotions & News', desc: 'Special offers, newsletters and zoo updates' }
                                ].map(item => (
                                    <div key={item.key} className="flex items-start sm:items-center justify-between p-4 bg-gray-50 hover:bg-gray-100/50 rounded-xl transition-colors border border-gray-100">
                                        <div className="pr-4">
                                            <p className="font-semibold text-gray-800">{item.label}</p>
                                            <p className="text-sm text-gray-500 mt-0.5">{item.desc}</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1 sm:mt-0">
                                            <input
                                                type="checkbox"
                                                checked={notifications[item.key]}
                                                onChange={(e) => handleNotificationToggle(item.key, e.target.checked)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 border border-gray-200 peer-checked:border-emerald-500"></div>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case 'activities':
                return (
                    <div className="space-y-6 animate-fade-in">
                        <div className="flex justify-between items-end mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800 mb-2">Activity Log</h3>
                                <p className="text-gray-500 text-sm">A history of your recent interactions and bookings.</p>
                            </div>
                            <button 
                                onClick={fetchActivities} 
                                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                            >
                                Refresh
                            </button>
                        </div>
                        
                        {activitiesLoading ? (
                            <div className="flex flex-col items-center justify-center h-48 space-y-3">
                                <LoadingSpinner />
                                <p className="text-gray-500 text-sm animate-pulse">Loading your activity...</p>
                            </div>
                        ) : activitiesError ? (
                            <div className="p-6 bg-red-50 text-red-600 rounded-xl text-center border border-red-100">
                                <p>{activitiesError}</p>
                                <button 
                                    onClick={fetchActivities}
                                    className="mt-3 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium text-sm transition-colors"
                                >
                                    Try Again
                                </button>
                            </div>
                        ) : activities.length === 0 ? (
                            <div className="p-10 bg-gray-50 rounded-xl text-center border border-gray-100">
                                <div className="w-16 h-16 bg-gray-200 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Icons.Activity />
                                </div>
                                <p className="text-gray-600 font-medium">No activity yet</p>
                                <p className="text-sm text-gray-500 mt-1">When you book tickets or post in the community, it will show up here.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {activities.filter(Boolean).map((activity, index) => (
                                    <div key={activity.id ? `${activity.type || 'activity'}-${activity.id}` : `activity-${index}`} className="flex items-start gap-4 p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${getActivityColor(activity.type)}`}>
                                            {getActivityIcon(activity.type)}
                                        </div>
                                        <div className="flex-grow min-w-0">
                                            <p className="font-semibold text-gray-800 truncate">
                                                {getActivityTitle(activity)}
                                            </p>
                                            {activity.details && activity.type !== 'ticket_reservation' && (
                                                <p className="text-sm text-gray-600 mt-1 line-clamp-2 bg-gray-50 p-2 rounded-lg italic">
                                                    "{activity.details}"
                                                </p>
                                            )}
                                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 font-medium">
                                                <span>{formatDate(activity.created_at)}</span>
                                                {activity.status && (
                                                    <span className="capitalize px-2 py-0.5 bg-gray-100 rounded-md">
                                                        {activity.status.replace('_', ' ')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );

            case 'help':
                return (
                    <div className="space-y-6 animate-fade-in">
                        <div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Need Help?</h3>
                            <p className="text-gray-500 mb-6 text-sm">We're here to assist you with any questions or issues.</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div className="p-5 bg-emerald-50 rounded-xl border border-emerald-100">
                                    <h4 className="font-semibold text-emerald-800 mb-2">Contact Support</h4>
                                    <p className="text-emerald-600 text-sm mb-4">Email us directly for personalized assistance.</p>
                                    <a href="mailto:support@bulusanzoo.com" className="inline-block px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors">
                                        Email Support
                                    </a>
                                </div>
                                <div className="p-5 bg-blue-50 rounded-xl border border-blue-100">
                                    <h4 className="font-semibold text-blue-800 mb-2">Help Center</h4>
                                    <p className="text-blue-600 text-sm mb-4">Browse our FAQs and guides for quick answers.</p>
                                    <Link to="/help" className="inline-block px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                                        Visit Help Center
                                    </Link>
                                </div>
                            </div>

                            <div className="p-5 bg-gray-50 rounded-xl border border-gray-200">
                                <h4 className="font-semibold text-gray-800 mb-3">Frequently Asked Questions</h4>
                                <div className="space-y-3">
                                    <details className="group bg-white p-3 rounded-lg border border-gray-200 cursor-pointer">
                                        <summary className="font-medium text-sm text-gray-700">How do I get a refund for my ticket?</summary>
                                        <p className="text-sm text-gray-500 mt-2 pl-2">Refunds must be requested at least 24 hours before your visit date. Please contact support with your booking reference.</p>
                                    </details>
                                    <details className="group bg-white p-3 rounded-lg border border-gray-200 cursor-pointer">
                                        <summary className="font-medium text-sm text-gray-700">Can I change my visit date?</summary>
                                        <p className="text-sm text-gray-500 mt-2 pl-2">Yes, you can reschedule your visit up to 48 hours prior. Contact support to arrange a new date.</p>
                                    </details>
                                    <details className="group bg-white p-3 rounded-lg border border-gray-200 cursor-pointer">
                                        <summary className="font-medium text-sm text-gray-700">Do I need to print my tickets?</summary>
                                        <p className="text-sm text-gray-500 mt-2 pl-2">No, you can simply show the QR code on your mobile device at the entrance.</p>
                                    </details>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/50 flex flex-col">
            {/* Floating Navigation */}
            <div className="fixed top-4 left-4 right-4 z-50 flex justify-between items-center pointer-events-none">
                <button
                    onClick={() => navigate(-1)}
                    className="pointer-events-auto flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-md text-gray-700 rounded-full shadow-sm border border-gray-200 hover:bg-gray-50 hover:shadow-md transition-all duration-300 font-medium text-sm"
                >
                    <Icons.Back />
                    <span className="hidden sm:inline">Back</span>
                </button>
                <Link
                    to="/"
                    className="pointer-events-auto flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-md text-gray-700 rounded-full shadow-sm border border-gray-200 hover:bg-gray-50 hover:shadow-md transition-all duration-300 font-medium text-sm"
                >
                    <Icons.Home />
                    <span className="hidden sm:inline">Home</span>
                </Link>
            </div>

            {/* Hero Section */}
            <section className="relative text-white pt-28 pb-16 text-center bg-emerald-600">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1564349683136-77e08dba1ef7')] bg-cover bg-center mix-blend-overlay opacity-20"></div>
                <div className="relative z-10 px-4">
                    <h1 className="text-3xl md:text-4xl font-extrabold mb-3 tracking-tight">Account Settings</h1>
                    <p className="text-emerald-100 max-w-md mx-auto text-sm md:text-base">Manage your notifications and view your activity history.</p>
                </div>
            </section>

            {/* Main Content */}
            <div className="flex-grow container mx-auto px-4 py-8 max-w-5xl -mt-8 relative z-20">
                <div className="flex flex-col md:flex-row gap-6 lg:gap-8">
                    {/* Left Sidebar Menu */}
                    <div className="md:w-64 lg:w-72 flex-shrink-0">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-24">
                            {/* Mobile: Horizontal scroll */}
                            <div className="md:hidden flex overflow-x-auto p-3 gap-2 scrollbar-hide">
                                {menuItems.map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => setActiveSection(item.id)}
                                        className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${activeSection === item.id
                                                ? 'bg-emerald-500 text-white shadow-sm'
                                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        <item.icon />
                                        <span>{item.label}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Desktop: Vertical list */}
                            <div className="hidden md:block p-3">
                                <div className="px-3 pb-3 mb-2 border-b border-gray-100">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Menu</p>
                                </div>
                                {menuItems.map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => setActiveSection(item.id)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all mb-1 ${activeSection === item.id
                                                ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                                                : 'text-gray-600 hover:bg-gray-50 border-transparent'
                                            } border`}
                                    >
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${activeSection === item.id
                                                ? 'bg-emerald-500 text-white shadow-sm'
                                                : 'bg-gray-100 text-gray-500'
                                            }`}>
                                            <item.icon />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-semibold text-sm">{item.label}</p>
                                            <p className="text-xs text-gray-500 line-clamp-1">{item.description}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Content Panel */}
                    <div className="flex-grow">
                        <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-8 border border-gray-100 min-h-[500px]">
                            {renderContent()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
