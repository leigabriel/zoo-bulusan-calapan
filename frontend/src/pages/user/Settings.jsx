import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

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
    Lock: () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
    ),
    Eye: () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
    ),
    Globe: () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
    ),
    Moon: () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
    ),
    Shield: () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
    ),
    Database: () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
        </svg>
    ),
    Trash: () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
    ),
    ChevronRight: () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
    ),
    Help: () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    Document: () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
    )
};

const Settings = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState('preferences');
    const [message, setMessage] = useState({ text: '', type: '' });
    
    // Settings state
    const [settings, setSettings] = useState({
        notifications: {
            emailNotifications: true,
            pushNotifications: true,
            eventReminders: true,
            ticketUpdates: true,
            marketingEmails: false
        },
        privacy: {
            profileVisibility: 'public',
            showActivityStatus: true,
            shareAnimalDex: true
        },
        preferences: {
            language: 'en',
            theme: 'light',
            measurementUnit: 'metric'
        }
    });

    const updateSetting = (category, key, value) => {
        setSettings(prev => ({
            ...prev,
            [category]: {
                ...prev[category],
                [key]: value
            }
        }));
        setMessage({ text: 'Settings updated successfully!', type: 'success' });
        setTimeout(() => setMessage({ text: '', type: '' }), 2000);
    };

    const menuItems = [
        { id: 'preferences', label: 'Preferences', icon: Icons.Globe, description: 'Language, theme & display' },
        { id: 'notifications', label: 'Notifications', icon: Icons.Bell, description: 'Manage your alerts' },
        { id: 'privacy', label: 'Privacy', icon: Icons.Eye, description: 'Control your data' },
        { id: 'security', label: 'Security', icon: Icons.Lock, description: 'Password & authentication' },
        { id: 'data', label: 'Data Management', icon: Icons.Database, description: 'Download or delete data' }
    ];

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <p className="text-gray-600 mb-4">Please log in to access settings.</p>
                    <Link to="/login" className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-medium">
                        Go to Login
                    </Link>
                </div>
            </div>
        );
    }

    const renderContent = () => {
        switch (activeSection) {
            case 'preferences':
                return (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Display Preferences</h3>
                            <div className="space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-xl gap-3">
                                    <div>
                                        <p className="font-medium text-gray-800">Language</p>
                                        <p className="text-sm text-gray-500">Choose your preferred language</p>
                                    </div>
                                    <select
                                        value={settings.preferences.language}
                                        onChange={(e) => updateSetting('preferences', 'language', e.target.value)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent w-full sm:w-auto"
                                    >
                                        <option value="en">English</option>
                                        <option value="fil">Filipino</option>
                                        <option value="es">Español</option>
                                    </select>
                                </div>
                                
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-xl gap-3">
                                    <div>
                                        <p className="font-medium text-gray-800">Theme</p>
                                        <p className="text-sm text-gray-500">Select your preferred theme</p>
                                    </div>
                                    <select
                                        value={settings.preferences.theme}
                                        onChange={(e) => updateSetting('preferences', 'theme', e.target.value)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent w-full sm:w-auto"
                                    >
                                        <option value="light">Light</option>
                                        <option value="dark">Dark</option>
                                        <option value="system">System</option>
                                    </select>
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-xl gap-3">
                                    <div>
                                        <p className="font-medium text-gray-800">Measurement Units</p>
                                        <p className="text-sm text-gray-500">For animal data display</p>
                                    </div>
                                    <select
                                        value={settings.preferences.measurementUnit}
                                        onChange={(e) => updateSetting('preferences', 'measurementUnit', e.target.value)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent w-full sm:w-auto"
                                    >
                                        <option value="metric">Metric (kg, cm)</option>
                                        <option value="imperial">Imperial (lb, in)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'notifications':
                return (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Notification Settings</h3>
                            <div className="space-y-4">
                                {[
                                    { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive updates via email' },
                                    { key: 'pushNotifications', label: 'Push Notifications', desc: 'Browser notifications' },
                                    { key: 'eventReminders', label: 'Event Reminders', desc: 'Get reminded about zoo events' },
                                    { key: 'ticketUpdates', label: 'Ticket Updates', desc: 'Updates about your bookings' },
                                    { key: 'marketingEmails', label: 'Marketing Emails', desc: 'Promotional offers and news' }
                                ].map(item => (
                                    <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                        <div>
                                            <p className="font-medium text-gray-800">{item.label}</p>
                                            <p className="text-sm text-gray-500">{item.desc}</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={settings.notifications[item.key]}
                                                onChange={(e) => updateSetting('notifications', item.key, e.target.checked)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case 'privacy':
                return (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Privacy Settings</h3>
                            <div className="space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-xl gap-3">
                                    <div>
                                        <p className="font-medium text-gray-800">Profile Visibility</p>
                                        <p className="text-sm text-gray-500">Who can see your profile</p>
                                    </div>
                                    <select
                                        value={settings.privacy.profileVisibility}
                                        onChange={(e) => updateSetting('privacy', 'profileVisibility', e.target.value)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent w-full sm:w-auto"
                                    >
                                        <option value="public">Public</option>
                                        <option value="friends">Friends Only</option>
                                        <option value="private">Private</option>
                                    </select>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                    <div>
                                        <p className="font-medium text-gray-800">Show Activity Status</p>
                                        <p className="text-sm text-gray-500">Let others see when you're active</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={settings.privacy.showActivityStatus}
                                            onChange={(e) => updateSetting('privacy', 'showActivityStatus', e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                    <div>
                                        <p className="font-medium text-gray-800">Share AnimalDex Progress</p>
                                        <p className="text-sm text-gray-500">Allow others to see your discoveries</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={settings.privacy.shareAnimalDex}
                                            onChange={(e) => updateSetting('privacy', 'shareAnimalDex', e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                            <div className="flex items-start gap-3">
                                <Icons.Shield />
                                <div>
                                    <p className="font-medium text-blue-800">Your Privacy Matters</p>
                                    <p className="text-sm text-blue-600 mt-1">We never share your personal data with third parties without your consent.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'security':
                return (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Security Settings</h3>
                            <div className="space-y-4">
                                <button
                                    onClick={() => navigate('/profile')}
                                    className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                                            <Icons.Lock />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-medium text-gray-800">Change Password</p>
                                            <p className="text-sm text-gray-500">Update your account password</p>
                                        </div>
                                    </div>
                                    <Icons.ChevronRight />
                                </button>

                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                                            <Icons.Shield />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-800">Two-Factor Authentication</p>
                                            <p className="text-sm text-gray-500">Add an extra layer of security</p>
                                        </div>
                                    </div>
                                    <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm font-medium rounded-full">Coming Soon</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                            <div className="flex items-start gap-3">
                                <Icons.Shield />
                                <div>
                                    <p className="font-medium text-amber-800">Security Tips</p>
                                    <ul className="text-sm text-amber-700 mt-1 list-disc list-inside space-y-1">
                                        <li>Use a strong, unique password</li>
                                        <li>Never share your login credentials</li>
                                        <li>Log out from shared devices</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'data':
                return (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Data Management</h3>
                            <div className="space-y-4">
                                <button className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                                            <Icons.Database />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-medium text-gray-800">Download My Data</p>
                                            <p className="text-sm text-gray-500">Get a copy of your data</p>
                                        </div>
                                    </div>
                                    <Icons.ChevronRight />
                                </button>

                                <button className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
                                            <Icons.Document />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-medium text-gray-800">Request Data Report</p>
                                            <p className="text-sm text-gray-500">Full report of your activity</p>
                                        </div>
                                    </div>
                                    <Icons.ChevronRight />
                                </button>

                                <button
                                    onClick={() => navigate('/profile')}
                                    className="w-full flex items-center justify-between p-4 bg-red-50 rounded-xl hover:bg-red-100 transition-colors border border-red-100"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600">
                                            <Icons.Trash />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-medium text-red-700">Delete Account</p>
                                            <p className="text-sm text-red-500">Permanently delete your account</p>
                                        </div>
                                    </div>
                                    <Icons.ChevronRight />
                                </button>
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Floating Navigation */}
            <div className="fixed top-4 left-4 right-4 z-50 flex justify-between items-center pointer-events-none">
                <button
                    onClick={() => navigate('/', { state: { openSidePanel: true } })}
                    className="pointer-events-auto flex items-center gap-2 px-4 py-2.5 bg-white/90 backdrop-blur-sm text-gray-700 rounded-full shadow-lg hover:bg-white hover:shadow-xl transition-all duration-300 font-medium"
                >
                    <Icons.Back />
                    <span className="hidden sm:inline">Back</span>
                </button>
                <Link
                    to="/"
                    className="pointer-events-auto flex items-center gap-2 px-4 py-2.5 bg-white/90 backdrop-blur-sm text-gray-700 rounded-full shadow-lg hover:bg-white hover:shadow-xl transition-all duration-300 font-medium"
                >
                    <Icons.Home />
                    <span className="hidden sm:inline">Home</span>
                </Link>
            </div>

            {/* Hero Section */}
            <section className="relative text-white py-20 pt-24 text-center bg-cover bg-center" style={{ backgroundImage: 'linear-gradient(135deg, rgba(16,185,129,0.92), rgba(20,184,166,0.92)), url(https://images.unsplash.com/photo-1564349683136-77e08dba1ef7)' }}>
                <div className="relative z-10">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Settings</h1>
                    <p className="text-lg max-w-xl mx-auto opacity-90 font-light">Customize your experience and manage your preferences</p>
                </div>
            </section>

            {/* Main Content */}
            <div className="flex-grow container mx-auto px-4 py-8 max-w-6xl">
                {message.text && (
                    <div className={`mb-6 p-4 rounded-xl ${
                        message.type === 'success' 
                            ? 'bg-green-100 text-green-700 border border-green-300' 
                            : 'bg-red-100 text-red-700 border border-red-300'
                    }`}>
                        {message.text}
                    </div>
                )}

                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left Sidebar Menu - On mobile, show as horizontal scroll */}
                    <div className="lg:w-80 flex-shrink-0">
                        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                            {/* Mobile: Horizontal scroll */}
                            <div className="lg:hidden flex overflow-x-auto p-2 gap-2 scrollbar-hide">
                                {menuItems.map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => setActiveSection(item.id)}
                                        className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                                            activeSection === item.id
                                                ? 'bg-emerald-500 text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        <item.icon />
                                        <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
                                    </button>
                                ))}
                            </div>
                            
                            {/* Desktop: Vertical list */}
                            <div className="hidden lg:block p-2">
                                {menuItems.map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => setActiveSection(item.id)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all mb-1 ${
                                            activeSection === item.id
                                                ? 'bg-emerald-50 text-emerald-700'
                                                : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                            activeSection === item.id
                                                ? 'bg-emerald-500 text-white'
                                                : 'bg-gray-100 text-gray-600'
                                        }`}>
                                            <item.icon />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-medium">{item.label}</p>
                                            <p className="text-xs text-gray-500">{item.description}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Help Link in sidebar for desktop */}
                        <div className="hidden lg:block mt-4">
                            <Link
                                to="/help"
                                className="flex items-center gap-3 p-4 bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all group"
                            >
                                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                    <Icons.Help />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-800">Need Help?</p>
                                    <p className="text-xs text-gray-500">Visit our help center</p>
                                </div>
                            </Link>
                        </div>
                    </div>

                    {/* Right Content Panel */}
                    <div className="flex-grow">
                        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100 min-h-[400px]">
                            {renderContent()}
                        </div>
                    </div>
                </div>

                {/* Mobile Help Link */}
                <div className="lg:hidden mt-6">
                    <Link
                        to="/help"
                        className="flex items-center gap-3 p-4 bg-white rounded-2xl shadow-lg border border-gray-100"
                    >
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                            <Icons.Help />
                        </div>
                        <div className="flex-grow">
                            <p className="font-medium text-gray-800">Need Help?</p>
                            <p className="text-xs text-gray-500">Visit our help center</p>
                        </div>
                        <Icons.ChevronRight />
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Settings;
