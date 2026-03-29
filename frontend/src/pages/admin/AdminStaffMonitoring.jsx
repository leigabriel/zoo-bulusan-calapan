import { useState, useEffect, useCallback, useMemo } from 'react';
import { adminAPI, reservationAPI } from '../../services/api-client';

const UsersIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);

const ActivityIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
);

const ClockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
    </svg>
);

const RefreshIcon = ({ className = '' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-4 h-4 ${className}`}>
        <polyline points="23 4 23 10 17 10" />
        <polyline points="1 20 1 14 7 14" />
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
);

const ShieldIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    </svg>
);

const LoginIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
        <polyline points="10 17 15 12 10 7" />
        <line x1="15" y1="12" x2="3" y2="12" />
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

const getActionPresentation = (actionType) => {
    switch (actionType) {
        case 'login':
            return {
                icon: <LoginIcon />,
                chip: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30',
                iconWrap: 'bg-emerald-500/15 text-emerald-300',
                label: 'Login',
                responsibility: 'Access Control'
            };
        case 'logout':
            return {
                icon: <LoginIcon />,
                chip: 'bg-slate-500/10 text-slate-300 border border-slate-500/30',
                iconWrap: 'bg-slate-500/15 text-slate-300',
                label: 'Logout',
                responsibility: 'Access Control'
            };
        case 'message_reply':
            return {
                icon: <MessageIcon />,
                chip: 'bg-sky-500/10 text-sky-300 border border-sky-500/30',
                iconWrap: 'bg-sky-500/15 text-sky-300',
                label: 'Message Reply',
                responsibility: 'Support Desk'
            };
        case 'reservation_update':
        case 'ticket_update':
            return {
                icon: <TicketIcon />,
                chip: 'bg-violet-500/10 text-violet-300 border border-violet-500/30',
                iconWrap: 'bg-violet-500/15 text-violet-300',
                label: 'Reservation Action',
                responsibility: 'Reservation Confirmation Desk'
            };
        case 'animal_update':
            return {
                icon: <ActivityIcon />,
                chip: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30',
                iconWrap: 'bg-emerald-500/15 text-emerald-300',
                label: 'Animal Update',
                responsibility: 'Animal Records'
            };
        case 'plant_update':
            return {
                icon: <ActivityIcon />,
                chip: 'bg-green-500/10 text-green-300 border border-green-500/30',
                iconWrap: 'bg-green-500/15 text-green-300',
                label: 'Plant Update',
                responsibility: 'Plant Records'
            };
        default:
            return {
                icon: <ActivityIcon />,
                chip: 'bg-gray-500/10 text-gray-300 border border-gray-500/30',
                iconWrap: 'bg-gray-500/15 text-gray-300',
                label: 'Staff Action',
                responsibility: 'Operations'
            };
    }
};

const getPresenceDot = (status) => {
    if (status === 'active') return 'bg-emerald-400';
    if (status === 'away') return 'bg-amber-400';
    return 'bg-gray-500';
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
    const [reservationRefs, setReservationRefs] = useState({});

    const fetchDashboardData = useCallback(async (showRefreshing = false) => {
        try {
            if (showRefreshing) setRefreshing(true);
            const response = await adminAPI.getMonitoringDashboard();
            if (response.success) {
                setDashboardData(response.data || {});
                setLastRefresh(new Date());
                setError(null);
            }
        } catch {
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
                setStaffTimeline(Array.isArray(response.timeline) ? response.timeline : []);
            }
        } catch {
            setStaffTimeline([]);
        } finally {
            setLoadingTimeline(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    useEffect(() => {
        if (!autoRefresh) return;
        const interval = setInterval(() => fetchDashboardData(true), 30000);
        return () => clearInterval(interval);
    }, [autoRefresh, fetchDashboardData]);

    const fetchReservationReferences = useCallback(async () => {
        try {
            const [ticketRes, eventRes] = await Promise.all([
                reservationAPI.getAllTicketReservations('admin').catch(() => null),
                reservationAPI.getAllEventReservations('admin').catch(() => null)
            ]);

            const ticketReservations = Array.isArray(ticketRes?.reservations) ? ticketRes.reservations : [];
            const eventReservations = Array.isArray(eventRes?.reservations) ? eventRes.reservations : [];

            const byId = {};
            ticketReservations.forEach((r) => {
                byId[`reservation:${r.id}`] = {
                    reference: r.reservation_reference || r.booking_reference || `Ticket #${r.id}`,
                    confirmedById: r.confirmed_by || null,
                    type: 'ticket'
                };
            });
            eventReservations.forEach((r) => {
                byId[`event:${r.id}`] = {
                    reference: r.reservation_reference || `Event #${r.id}`,
                    confirmedById: r.confirmed_by || null,
                    type: 'event'
                };
                byId[`reservation:${r.id}`] = byId[`reservation:${r.id}`] || {
                    reference: r.reservation_reference || `Event #${r.id}`,
                    confirmedById: r.confirmed_by || null,
                    type: 'event'
                };
            });

            setReservationRefs(byId);
        } catch {
            setReservationRefs({});
        }
    }, []);

    useEffect(() => {
        fetchReservationReferences();
    }, [fetchReservationReferences]);

    const handleStaffClick = (staff) => {
        setSelectedStaff(staff);
        fetchStaffTimeline(staff.id);
    };

    const filteredActivities = useMemo(() => {
        const list = Array.isArray(dashboardData.recentActivities) ? dashboardData.recentActivities : [];
        if (filterActionType === 'all') return list;
        return list.filter((activity) => activity.action_type === filterActionType);
    }, [dashboardData.recentActivities, filterActionType]);

    const onlineStaffIds = useMemo(() => {
        const sessions = Array.isArray(dashboardData.activeSessions) ? dashboardData.activeSessions : [];
        return new Set(
            sessions
                .filter((s) => (Number(s.inactive_minutes) || 0) < 15)
                .map((s) => Number(s.staff_id))
                .filter((id) => Number.isFinite(id))
        );
    }, [dashboardData.activeSessions]);

    const staffNameById = useMemo(() => {
        const names = {};
        (dashboardData.staffMembers || []).forEach((s) => {
            names[s.id] = `${s.firstName || ''} ${s.lastName || ''}`.trim() || `Staff #${s.id}`;
        });
        (dashboardData.activeSessions || []).forEach((s) => {
            if (!names[s.staff_id]) {
                names[s.staff_id] = `${s.first_name || ''} ${s.last_name || ''}`.trim() || `Staff #${s.staff_id}`;
            }
        });
        return names;
    }, [dashboardData.staffMembers, dashboardData.activeSessions]);

    const getReservationContext = (activity) => {
        if (!['reservation_update', 'ticket_update'].includes(activity.action_type)) {
            return null;
        }
        const key = `${activity.entity_type || 'reservation'}:${activity.entity_id}`;
        const fallbackKey = `reservation:${activity.entity_id}`;
        const reservation = reservationRefs[key] || reservationRefs[fallbackKey] || null;
        if (!reservation) return null;

        const responsible = reservation.confirmedById
            ? (staffNameById[reservation.confirmedById] || `Staff #${reservation.confirmedById}`)
            : 'Not confirmed yet';

        return {
            reference: reservation.reference,
            responsible,
            type: reservation.type
        };
    };

    const reservationActions = filteredActivities.filter((a) => ['reservation_update', 'ticket_update'].includes(a.action_type)).length;

    const actionTypeOptions = [
        { value: 'all', label: 'All Actions' },
        { value: 'login', label: 'Logins' },
        { value: 'logout', label: 'Logouts' },
        { value: 'message_reply', label: 'Messages' },
        { value: 'reservation_update', label: 'Reservations' },
        { value: 'ticket_update', label: 'Tickets' },
        { value: 'animal_update', label: 'Animals' },
        { value: 'plant_update', label: 'Plants' }
    ];

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
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-[#8cff65]/15 text-[#8cff65] flex items-center justify-center">
                        <ShieldIcon />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Staff Monitoring</h1>
                        <p className="text-sm text-gray-400">Track responsibility, accountability, and real-time staff execution.</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 text-xs text-gray-400 px-3 py-2 bg-[#141414] border border-[#2a2a2a] rounded-xl">
                        <ClockIcon />
                        Updated {formatTimeAgo(lastRefresh)}
                    </div>
                    <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer px-3 py-2 bg-[#141414] border border-[#2a2a2a] rounded-xl">
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
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#8cff65] text-black font-semibold hover:bg-[#9dff7a] disabled:bg-gray-600 disabled:text-gray-300 transition"
                    >
                        <RefreshIcon className={refreshing ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-300">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-5">
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-3"><UsersIcon /> Total Staff</div>
                    <p className="text-3xl font-bold text-white">{dashboardData.overview?.totalStaff || 0}</p>
                </div>
                <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-5">
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-3"><ActivityIcon /> Online Now</div>
                    <p className="text-3xl font-bold text-white">{dashboardData.overview?.onlineNow || 0}</p>
                </div>
                <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-5">
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-3"><ActivityIcon /> Logged Activities</div>
                    <p className="text-3xl font-bold text-white">{dashboardData.overview?.totalActivities || 0}</p>
                </div>
                <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-5">
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-3"><TicketIcon /> Reservation Actions</div>
                    <p className="text-3xl font-bold text-white">{reservationActions}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-white">Connected Activity Feed</h3>
                            <p className="text-sm text-gray-400">See who performed each task and which responsibility area it belongs to.</p>
                        </div>
                        <select
                            value={filterActionType}
                            onChange={(e) => setFilterActionType(e.target.value)}
                            className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#8cff65]"
                        >
                            {actionTypeOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                        {filteredActivities.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-8">No activity found for this filter.</p>
                        ) : (
                            filteredActivities.map((activity) => {
                                const style = getActionPresentation(activity.action_type);
                                return (
                                    <div key={activity.id} className="p-4 rounded-xl bg-[#1b1b1b] border border-[#2a2a2a] hover:border-[#8cff65]/30 transition">
                                        <div className="flex items-start gap-3">
                                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${style.iconWrap}`}>
                                                {style.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-white">
                                                    <span className="font-semibold">{activity.first_name} {activity.last_name}</span>
                                                    <span className="text-gray-300"> {activity.action_description || style.label}</span>
                                                </p>
                                                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                                    <span className={`px-2 py-1 rounded-full ${style.chip}`}>{style.label}</span>
                                                    <span className="px-2 py-1 rounded-full bg-[#242424] text-gray-300 border border-[#2f2f2f]">
                                                        Responsibility: {style.responsibility}
                                                    </span>
                                                    {activity.entity_type && (
                                                        <span className="px-2 py-1 rounded-full bg-[#242424] text-gray-300 border border-[#2f2f2f]">
                                                            {activity.entity_type}{activity.entity_id ? ` #${activity.entity_id}` : ''}
                                                        </span>
                                                    )}
                                                    {getReservationContext(activity) && (
                                                        <span className="px-2 py-1 rounded-full bg-[#2a2134] text-violet-200 border border-violet-700/50">
                                                            {getReservationContext(activity).type === 'ticket' ? 'Ticket' : 'Event'} {getReservationContext(activity).reference}
                                                        </span>
                                                    )}
                                                    {getReservationContext(activity) && (
                                                        <span className="px-2 py-1 rounded-full bg-[#253021] text-emerald-200 border border-emerald-700/40">
                                                            Responsible: {getReservationContext(activity).responsible}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500 mt-2">{formatTimeAgo(activity.created_at)}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-1">Daily Activity Trend</h3>
                    <p className="text-sm text-gray-400 mb-4">Staff activity count and participating staff by day.</p>
                    <div className="space-y-3">
                        {(dashboardData.dailyActivity || []).length === 0 ? (
                            <p className="text-sm text-gray-500 py-6 text-center">No daily data available.</p>
                        ) : (
                            dashboardData.dailyActivity.map((day) => {
                                const max = Math.max(...(dashboardData.dailyActivity || []).map((d) => Number(d.count) || 0), 1);
                                const width = `${Math.max(10, Math.round(((Number(day.count) || 0) / max) * 100))}%`;
                                return (
                                    <div key={day.date}>
                                        <div className="flex items-center justify-between text-xs mb-1">
                                            <span className="text-gray-300">{new Date(day.date).toLocaleDateString()}</span>
                                            <span className="text-gray-400">{day.count} actions • {day.active_staff} staff</span>
                                        </div>
                                        <div className="h-2 rounded-full bg-[#1e1e1e] overflow-hidden">
                                            <div className="h-full rounded-full bg-gradient-to-r from-[#8cff65] to-emerald-500" style={{ width }} />
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Staff Accountability Board</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[430px] overflow-y-auto pr-1">
                        {(dashboardData.staffMembers || []).map((staff) => (
                            <button
                                key={staff.id}
                                type="button"
                                onClick={() => handleStaffClick(staff)}
                                className="text-left p-4 rounded-xl border border-[#2a2a2a] bg-[#1b1b1b] hover:border-[#8cff65]/35 transition"
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="relative">
                                        <div className="w-11 h-11 rounded-full bg-[#2a2a2a] flex items-center justify-center text-gray-300 font-semibold">
                                            {staff.firstName?.[0]}{staff.lastName?.[0]}
                                        </div>
                                        <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#1b1b1b] ${onlineStaffIds.has(Number(staff.id)) ? 'bg-emerald-400' : 'bg-gray-500'}`}></span>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-white truncate">{staff.firstName} {staff.lastName}</p>
                                        <p className="text-xs text-gray-500 capitalize truncate">{staff.role}</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-400">Actions this week</span>
                                    <span className="text-[#8cff65] font-semibold">{staff.actionsThisWeek || 0}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Live Sessions</h3>
                    <div className="space-y-3 max-h-[430px] overflow-y-auto pr-1">
                        {(dashboardData.activeSessions || []).length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-8">No active sessions.</p>
                        ) : (
                            dashboardData.activeSessions.map((session) => (
                                <button
                                    key={session.id}
                                    type="button"
                                    onClick={() => handleStaffClick({ id: session.staff_id, ...session })}
                                    className="w-full text-left p-3 rounded-xl bg-[#1b1b1b] border border-[#2a2a2a] hover:border-[#8cff65]/35 transition"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <div className="w-10 h-10 rounded-full bg-[#2a2a2a] flex items-center justify-center text-gray-300 text-sm font-semibold">
                                                {session.first_name?.[0]}{session.last_name?.[0]}
                                            </div>
                                            <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#1b1b1b] ${getPresenceDot(session.status)}`}></span>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm text-white font-medium truncate">{session.first_name} {session.last_name}</p>
                                            <p className="text-xs text-gray-500 capitalize">{session.role}</p>
                                        </div>
                                        <span className="text-xs text-gray-400 capitalize">{session.status}</span>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {selectedStaff && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setSelectedStaff(null)}>
                    <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6 w-full max-w-2xl max-h-[85vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-[#2a2a2a] flex items-center justify-center text-gray-300 font-semibold">
                                    {(selectedStaff.firstName || selectedStaff.first_name || '')?.[0]}
                                    {(selectedStaff.lastName || selectedStaff.last_name || '')?.[0]}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">
                                        {selectedStaff.firstName || selectedStaff.first_name} {selectedStaff.lastName || selectedStaff.last_name}
                                    </h3>
                                    <p className="text-sm text-gray-500">{selectedStaff.email}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedStaff(null)}
                                className="text-gray-500 hover:text-white transition"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>

                        <h4 className="text-white font-semibold mb-3">Activity Timeline</h4>
                        <div className="space-y-3 max-h-[58vh] overflow-y-auto pr-1">
                            {loadingTimeline ? (
                                <div className="flex justify-center py-8">
                                    <div className="w-8 h-8 border-2 border-[#8cff65] border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : staffTimeline.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-8">No activity recorded.</p>
                            ) : (
                                staffTimeline.map((activity) => {
                                    const style = getActionPresentation(activity.action_type);
                                    return (
                                        <div key={activity.id} className="p-4 rounded-xl border border-[#2a2a2a] bg-[#1b1b1b]">
                                            <div className="flex items-start gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${style.iconWrap}`}>
                                                    {style.icon}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm text-white">{activity.action_description || style.label}</p>
                                                    <div className="mt-2 flex flex-wrap gap-2">
                                                        <span className={`text-xs px-2 py-1 rounded-full ${style.chip}`}>{style.label}</span>
                                                        <span className="text-xs px-2 py-1 rounded-full bg-[#242424] text-gray-300 border border-[#2f2f2f]">
                                                            Responsibility: {style.responsibility}
                                                        </span>
                                                        {activity.entity_type && (
                                                            <span className="text-xs px-2 py-1 rounded-full bg-[#242424] text-gray-300 border border-[#2f2f2f]">
                                                                {activity.entity_type}{activity.entity_id ? ` #${activity.entity_id}` : ''}
                                                            </span>
                                                        )}
                                                        {getReservationContext(activity) && (
                                                            <span className="text-xs px-2 py-1 rounded-full bg-[#2a2134] text-violet-200 border border-violet-700/50">
                                                                {getReservationContext(activity).type === 'ticket' ? 'Ticket' : 'Event'} {getReservationContext(activity).reference}
                                                            </span>
                                                        )}
                                                        {getReservationContext(activity) && (
                                                            <span className="text-xs px-2 py-1 rounded-full bg-[#253021] text-emerald-200 border border-emerald-700/40">
                                                                Responsible: {getReservationContext(activity).responsible}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-2">{formatTimeAgo(activity.created_at)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminStaffMonitoring;