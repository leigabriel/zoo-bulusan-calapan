import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../../services/api-client';

// Icons
const UsersIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);

const ActivityIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
);

const ClockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
    </svg>
);

const RefreshIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <polyline points="23 4 23 10 17 10" />
        <polyline points="1 20 1 14 7 14" />
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
);

const OnlineIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
        <circle cx="12" cy="12" r="10" />
    </svg>
);

const MessageIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
    </svg>
);

const TicketIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
    </svg>
);

const LoginIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
        <polyline points="10 17 15 12 10 7" />
        <line x1="15" y1="12" x2="3" y2="12" />
    </svg>
);

const getActionIcon = (actionType) => {
    switch (actionType) {
        case 'login':
        case 'logout':
            return <LoginIcon />;
        case 'message_reply':
            return <MessageIcon />;
        case 'reservation_update':
        case 'ticket_update':
            return <TicketIcon />;
        default:
            return <ActivityIcon />;
    }
};

const getActionColor = (actionType) => {
    switch (actionType) {
        case 'login':
            return 'text-green-400 bg-green-400/10';
        case 'logout':
            return 'text-gray-400 bg-gray-400/10';
        case 'message_reply':
            return 'text-blue-400 bg-blue-400/10';
        case 'reservation_update':
        case 'ticket_update':
            return 'text-purple-400 bg-purple-400/10';
        case 'animal_update':
        case 'plant_update':
            return 'text-emerald-400 bg-emerald-400/10';
        default:
            return 'text-gray-400 bg-gray-400/10';
    }
};

const getStatusColor = (status) => {
    switch (status) {
        case 'active':
            return 'bg-green-500';
        case 'away':
            return 'bg-yellow-500';
        case 'idle':
            return 'bg-gray-500';
        default:
            return 'bg-gray-500';
    }
};

const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
};

const AdminStaffMonitoring = () => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [lastRefresh, setLastRefresh] = useState(new Date());
    
    const [dashboardData, setDashboardData] = useState({
        overview: { totalStaff: 0, onlineNow: 0, totalActivities: 0 },
        activeSessions: [],
        recentActivities: [],
        staffMembers: [],
        dailyActivity: []
    });

    const [selectedStaff, setSelectedStaff] = useState(null);
    const [staffTimeline, setStaffTimeline] = useState([]);
    const [loadingTimeline, setLoadingTimeline] = useState(false);

    const [filterActionType, setFilterActionType] = useState('all');
    const [autoRefresh, setAutoRefresh] = useState(true);

    const fetchDashboardData = useCallback(async (showRefreshing = false) => {
        try {
            if (showRefreshing) setRefreshing(true);
            
            const response = await adminAPI.getMonitoringDashboard();
            
            if (response.success) {
                setDashboardData(response.data);
                setLastRefresh(new Date());
                setError(null);
            }
        } catch (err) {
            console.error('Error fetching monitoring data:', err);
            setError('Failed to load monitoring data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    const fetchStaffTimeline = async (staffId) => {
        try {
            setLoadingTimeline(true);
            const response = await adminAPI.getStaffTimeline(staffId);
            
            if (response.success) {
                setStaffTimeline(response.timeline);
            }
        } catch (err) {
            console.error('Error fetching staff timeline:', err);
        } finally {
            setLoadingTimeline(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    // Auto-refresh every 30 seconds
    useEffect(() => {
        if (!autoRefresh) return;
        
        const interval = setInterval(() => {
            fetchDashboardData(true);
        }, 30000);

        return () => clearInterval(interval);
    }, [autoRefresh, fetchDashboardData]);

    const handleStaffClick = (staff) => {
        setSelectedStaff(staff);
        fetchStaffTimeline(staff.id);
    };

    const filteredActivities = dashboardData.recentActivities.filter(activity => {
        if (filterActionType === 'all') return true;
        return activity.action_type === filterActionType;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-4 border-[#2a2a2a]"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#8cff65] animate-spin"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#8cff65]/10 rounded-xl flex items-center justify-center text-[#8cff65]">
                        <UsersIcon />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Staff Monitoring</h1>
                        <p className="text-sm text-gray-500">Real-time staff activity tracking</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <ClockIcon />
                        <span>Updated {formatTimeAgo(lastRefresh)}</span>
                    </div>
                    <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={autoRefresh}
                            onChange={(e) => setAutoRefresh(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-600 bg-[#1e1e1e] text-[#8cff65] focus:ring-[#8cff65]/50"
                        />
                        Auto-refresh
                    </label>
                    <button
                        onClick={() => fetchDashboardData(true)}
                        disabled={refreshing}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#8cff65] text-[#0a0a0a] font-semibold rounded-xl hover:bg-[#9dff7a] disabled:bg-gray-600 disabled:text-gray-400 transition-all"
                    >
                        <RefreshIcon className={refreshing ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400">
                    {error}
                </div>
            )}

            {/* Overview Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                            <UsersIcon />
                        </div>
                        <span className="text-gray-400 text-sm">Total Staff</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{dashboardData.overview.totalStaff}</p>
                </div>
                <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400">
                            <OnlineIcon />
                        </div>
                        <span className="text-gray-400 text-sm">Online Now</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{dashboardData.overview.onlineNow}</p>
                </div>
                <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                            <ActivityIcon />
                        </div>
                        <span className="text-gray-400 text-sm">Recent Activities</span>
                    </div>
                    <p className="text-3xl font-bold text-white">{dashboardData.overview.totalActivities}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Active Sessions */}
                <div className="lg:col-span-1 bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Active Sessions</h3>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                        {dashboardData.activeSessions.length === 0 ? (
                            <p className="text-gray-500 text-sm text-center py-8">No active sessions</p>
                        ) : (
                            dashboardData.activeSessions.map((session) => (
                                <div
                                    key={session.id}
                                    className="flex items-center gap-3 p-3 bg-[#1e1e1e] rounded-xl cursor-pointer hover:bg-[#252525] transition-colors"
                                    onClick={() => handleStaffClick({ id: session.staff_id, ...session })}
                                >
                                    <div className="relative">
                                        <div className="w-10 h-10 rounded-full bg-[#2a2a2a] flex items-center justify-center text-gray-400 font-semibold text-sm">
                                            {session.first_name?.[0]}{session.last_name?.[0]}
                                        </div>
                                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#141414] ${getStatusColor(session.status)}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white font-medium text-sm truncate">
                                            {session.first_name} {session.last_name}
                                        </p>
                                        <p className="text-gray-500 text-xs capitalize">{session.role}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-xs px-2 py-1 rounded-full capitalize ${
                                            session.status === 'active' ? 'bg-green-500/10 text-green-400' :
                                            session.status === 'away' ? 'bg-yellow-500/10 text-yellow-400' :
                                            'bg-gray-500/10 text-gray-400'
                                        }`}>
                                            {session.status}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Recent Activities */}
                <div className="lg:col-span-2 bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-white">Recent Activities</h3>
                        <select
                            value={filterActionType}
                            onChange={(e) => setFilterActionType(e.target.value)}
                            className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#8cff65]"
                        >
                            <option value="all">All Actions</option>
                            <option value="login">Logins</option>
                            <option value="logout">Logouts</option>
                            <option value="message_reply">Messages</option>
                            <option value="reservation_update">Reservations</option>
                            <option value="ticket_update">Tickets</option>
                            <option value="animal_update">Animals</option>
                            <option value="plant_update">Plants</option>
                        </select>
                    </div>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {filteredActivities.length === 0 ? (
                            <p className="text-gray-500 text-sm text-center py-8">No activities found</p>
                        ) : (
                            filteredActivities.map((activity) => (
                                <div key={activity.id} className="flex items-start gap-3 p-3 bg-[#1e1e1e] rounded-xl">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getActionColor(activity.action_type)}`}>
                                        {getActionIcon(activity.action_type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white text-sm">
                                            <span className="font-medium">{activity.first_name} {activity.last_name}</span>
                                            <span className="text-gray-400 ml-1">
                                                {activity.action_description || activity.action_type.replace('_', ' ')}
                                            </span>
                                        </p>
                                        <p className="text-gray-500 text-xs mt-0.5">{formatTimeAgo(activity.created_at)}</p>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full ${getActionColor(activity.action_type)}`}>
                                        {activity.action_type.replace('_', ' ')}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Staff Members Grid */}
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Staff Overview</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {dashboardData.staffMembers.map((staff) => (
                        <div
                            key={staff.id}
                            className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl p-4 hover:border-[#8cff65]/30 transition-all cursor-pointer"
                            onClick={() => handleStaffClick(staff)}
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-full bg-[#2a2a2a] flex items-center justify-center text-gray-400 font-semibold">
                                        {staff.firstName?.[0]}{staff.lastName?.[0]}
                                    </div>
                                    <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#1e1e1e] ${staff.isOnline ? 'bg-green-500' : 'bg-gray-500'}`} />
                                </div>
                                <div>
                                    <p className="text-white font-medium">{staff.firstName} {staff.lastName}</p>
                                    <p className="text-gray-500 text-xs capitalize">{staff.role}</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-400">This week</span>
                                <span className="text-[#8cff65] font-semibold">{staff.actionsThisWeek} actions</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Staff Timeline Modal */}
            {selectedStaff && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setSelectedStaff(null)}>
                    <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-[#2a2a2a] flex items-center justify-center text-gray-400 font-semibold">
                                    {selectedStaff.firstName?.[0] || selectedStaff.first_name?.[0]}
                                    {selectedStaff.lastName?.[0] || selectedStaff.last_name?.[0]}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">
                                        {selectedStaff.firstName || selectedStaff.first_name} {selectedStaff.lastName || selectedStaff.last_name}
                                    </h3>
                                    <p className="text-gray-500 text-sm">{selectedStaff.email}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedStaff(null)}
                                className="text-gray-500 hover:text-white transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        
                        <h4 className="text-white font-medium mb-3">Activity Timeline</h4>
                        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                            {loadingTimeline ? (
                                <div className="flex justify-center py-8">
                                    <div className="w-8 h-8 border-2 border-[#8cff65] border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : staffTimeline.length === 0 ? (
                                <p className="text-gray-500 text-sm text-center py-8">No activity recorded</p>
                            ) : (
                                staffTimeline.map((activity) => (
                                    <div key={activity.id} className="flex items-start gap-3 p-3 bg-[#1e1e1e] rounded-xl">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getActionColor(activity.action_type)}`}>
                                            {getActionIcon(activity.action_type)}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-white text-sm">{activity.action_description || activity.action_type.replace('_', ' ')}</p>
                                            <p className="text-gray-500 text-xs mt-0.5">{formatTimeAgo(activity.created_at)}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminStaffMonitoring;