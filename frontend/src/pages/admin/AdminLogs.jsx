import { useState, useEffect, useCallback } from 'react';
import { ClipboardList, Users, Activity, Filter, ChevronLeft, ChevronRight, Refresh, Search } from 'reicon-react';
import { adminAPI, getProfileImageUrl } from '../../services/api-client';
import { formatSafeDate } from '../../utils/format-date';
import { describeUserAgent } from '../../utils/user-agent';

const staffActionLabels = {
    login: 'Login',
    logout: 'Logout',
    message_reply: 'Message Reply',
    reservation_update: 'Reservation Update',
    reservation_cancel: 'Reservation Cancel',
    reservation_archive: 'Reservation Archive',
    reservation_unarchive: 'Reservation Unarchive',
    ticket_update: 'Ticket Update',
    animal_update: 'Animal Update',
    plant_update: 'Plant Update',
    event_update: 'Event Update',
    user_update: 'User Update',
    appeal_review: 'Appeal Review',
    payment_config_update: 'Payment Config Update',
    ticket_payment_config_update: 'Ticket Payment Config Update',
    model_upload: 'Model Upload',
    walk_in_sale: 'Walk-in Sale',
    walk_in_check_in: 'Walk-in Check-in',
    walk_in_void: 'Walk-in Void',
    walk_in_trash: 'Walk-in Trash',
    print_requested: 'Print Receipt',
    reprint_requested: 'Reprint Receipt',
    print_failed: 'Print Failed',
    other: 'Other',
};

const userActionLabels = {
    register: 'Register',
    login: 'Login',
    logout: 'Logout',
    profile_update: 'Profile Update',
    password_change: 'Password Change',
    ticket_reservation: 'Ticket Reservation',
    ticket_purchase: 'Ticket Purchase',
    event_reservation: 'Event Reservation',
    ticket_archive: 'Ticket Archive',
    ticket_unarchive: 'Ticket Unarchive',
    event_archive: 'Event Archive',
    event_unarchive: 'Event Unarchive',
    event_update: 'Event Update',
    message_sent: 'Message Sent',
    message_delete: 'Message Delete',
    post_create: 'Post Create',
    post_update: 'Post Update',
    post_delete: 'Post Delete',
    post_like: 'Post Like',
    comment_create: 'Comment Create',
    comment_update: 'Comment Update',
    comment_delete: 'Comment Delete',
    comment_heart: 'Comment Heart',
    comment_report: 'Comment Report',
    appeal_submit: 'Appeal Submit',
    refund_request: 'Refund Request',
    payment_checkout: 'Payment Checkout',
    payment_method_update: 'Payment Method Update',
    prediction_create: 'Prediction Create',
    settings_update: 'Settings Update',
    account_delete: 'Account Delete',
    other: 'Other',
};

const actionTypeColors = {
    login: 'bg-green-50 text-green-700 border border-green-200',
    logout: 'bg-gray-50 text-gray-600 border border-gray-200',
    register: 'bg-green-50 text-green-700 border border-green-200',
    message_reply: 'bg-sky-50 text-sky-700 border border-sky-200',
    message_sent: 'bg-cyan-50 text-cyan-700 border border-cyan-200',
    reservation_update: 'bg-violet-50 text-violet-700 border border-violet-200',
    ticket_update: 'bg-violet-50 text-violet-700 border border-violet-200',
    ticket_reservation: 'bg-orange-50 text-orange-700 border border-orange-200',
    event_reservation: 'bg-pink-50 text-pink-700 border border-pink-200',
    animal_update: 'bg-green-50 text-green-700 border border-green-200',
    plant_update: 'bg-lime-50 text-lime-700 border border-lime-200',
    event_update: 'bg-amber-50 text-amber-700 border border-amber-200',
    user_update: 'bg-blue-50 text-blue-700 border border-blue-200',
    profile_update: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
    password_change: 'bg-red-50 text-red-700 border border-red-200',
    post_create: 'bg-purple-50 text-purple-700 border border-purple-200',
    post_delete: 'bg-red-50 text-red-700 border border-red-200',
    comment_create: 'bg-cyan-50 text-cyan-700 border border-cyan-200',
    comment_delete: 'bg-red-50 text-red-700 border border-red-200',
    comment_report: 'bg-rose-50 text-rose-700 border border-rose-200',
    account_delete: 'bg-red-50 text-red-700 border border-red-200',
    other: 'bg-gray-50 text-gray-600 border border-gray-200',
};

const roleLabels = {
    admin: 'Admin',
    staff: 'Staff',
    user: 'Visitor'
};

const roleStyles = {
    admin: 'bg-purple-50 text-purple-700 border-purple-200',
    staff: 'bg-sky-50 text-sky-700 border-sky-200',
    user: 'bg-green-50 text-green-700 border-green-200'
};

const staffActionTypes = ['all', 'login', 'logout', 'message_reply', 'reservation_update', 'ticket_update', 'animal_update', 'plant_update', 'event_update', 'user_update', 'other'];

// One request shape per tab. The "all" tab merges admin, staff and visitor
// activity server-side, so the page shows a single chronological stream.
const LOG_REQUESTS = {
    all: adminAPI.getAllLogs,
    staff: adminAPI.getStaffLogs,
    user: adminAPI.getUserLogs
};
const userActionTypes = ['all', 'register', 'login', 'logout', 'profile_update', 'password_change', 'settings_update', 'ticket_purchase', 'ticket_reservation', 'event_reservation', 'ticket_archive', 'ticket_unarchive', 'event_archive', 'event_unarchive', 'event_update', 'payment_checkout', 'payment_method_update', 'refund_request', 'message_sent', 'message_delete', 'post_create', 'post_update', 'post_delete', 'post_like', 'comment_create', 'comment_update', 'comment_delete', 'comment_heart', 'comment_report', 'appeal_submit', 'prediction_create', 'account_delete', 'other'];

const ALL_ACTION_LABELS = { ...staffActionLabels, ...userActionLabels };

const formatIdentifier = (value) => value
    ? value.replaceAll('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase())
    : 'Unknown';

const formatTimeAgo = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;
    return date.toLocaleDateString();
};

const formatClockTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const AdminLogs = () => {
    const [activeTab, setActiveTab] = useState('all');
    const [logs, setLogs] = useState({ all: [], staff: [], user: [] });
    const [totals, setTotals] = useState({ all: 0, staff: 0, user: 0 });
    const [summary, setSummary] = useState({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [actionFilter, setActionFilter] = useState('all');
    const [roleFilter, setRoleFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [offset, setOffset] = useState(0);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const limit = 20;

    const fetchLogs = useCallback(async (nextOffset = 0, tab = activeTab, showRefreshing = false) => {
        const request = LOG_REQUESTS[tab];
        if (!request) return;
        try {
            if (showRefreshing) setRefreshing(true);
            const data = await request({
                limit,
                offset: nextOffset,
                actionType: actionFilter === 'all' ? '' : actionFilter,
                // A visitor tab has no admins or staff in it to filter for.
                role: tab === 'staff' ? (roleFilter === 'user' ? '' : roleFilter) : roleFilter,
                search,
                startDate,
                endDate
            });
            setLogs(previous => ({ ...previous, [tab]: Array.isArray(data.logs) ? data.logs : [] }));
            setTotals(previous => ({ ...previous, [tab]: Number(data.total) || 0 }));
            setError('');
        } catch (requestError) {
            setLogs(previous => ({ ...previous, [tab]: [] }));
            setTotals(previous => ({ ...previous, [tab]: 0 }));
            setError(requestError.message || 'Could not load activity logs.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [activeTab, actionFilter, roleFilter, search, startDate, endDate]);

    const fetchSummary = useCallback(async () => {
        try {
            const data = await adminAPI.getLogsSummary();
            setSummary(data.summary || {});
        } catch (requestError) {
            setError(requestError.message || 'Could not load the logs summary.');
        }
    }, []);

    useEffect(() => {
        setLoading(true);
        setOffset(0);
        fetchLogs(0, activeTab);
        fetchSummary();
    }, [activeTab, fetchLogs, fetchSummary]);

    const handleRefresh = () => {
        fetchLogs(offset, activeTab, true);
        fetchSummary();
    };

    const currentLogs = logs[activeTab] || [];
    const currentTotal = totals[activeTab] || 0;
    const totalPages = Math.ceil(currentTotal / limit);
    const labels = activeTab === 'all' ? ALL_ACTION_LABELS : (activeTab === 'user' ? userActionLabels : staffActionLabels);
    const observedActions = activeTab === 'all'
        ? [...(summary.staffActionBreakdown || []), ...(summary.userActionBreakdown || [])]
        : (activeTab === 'staff' ? summary.staffActionBreakdown : summary.userActionBreakdown);
    const configuredActionTypes = activeTab === 'user' ? userActionTypes : staffActionTypes;
    const actionTypes = ['all', ...new Set([
        ...configuredActionTypes.filter(type => type !== 'all'),
        ...(observedActions || []).map(item => item.action_type).filter(Boolean)
    ])];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-4 border-green-200"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-green-400 animate-spin"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-green-400/15 text-green-800 flex items-center justify-center">
                        <ClipboardList size={22} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Logs</h1>
                        <p className="text-sm text-gray-500">Every action by admins, staff and visitors, with device and location details.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-400 text-black font-semibold hover:bg-green-400 disabled:bg-gray-300 transition"
                    >
                        <Refresh size={16} className={refreshing ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>
            </div>

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white border border-green-200 rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-gray-500 text-xs mb-2"><Activity size={14} /> Total Activity</div>
                    <p className="text-2xl font-bold text-gray-900">{summary.totalActivity ?? 0}</p>
                </div>
                <div className="bg-white border border-green-200 rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-gray-500 text-xs mb-2"><Activity size={14} /> Admin &amp; Staff Actions</div>
                    <p className="text-2xl font-bold text-gray-900">{summary.totalStaffActions || 0}</p>
                </div>
                <div className="bg-white border border-green-200 rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-gray-500 text-xs mb-2"><Users size={14} /> Visitor Actions</div>
                    <p className="text-2xl font-bold text-gray-900">{summary.totalUserActions || 0}</p>
                </div>
                <div className="bg-white border border-green-200 rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-gray-500 text-xs mb-2"><Users size={14} /> Total Users</div>
                    <p className="text-2xl font-bold text-gray-900">{summary.totalUsers || 0}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
                {[
                    { key: 'all', label: 'All Activity' },
                    { key: 'staff', label: 'Admin & Staff' },
                    { key: 'user', label: 'Visitors' }
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => { setActiveTab(tab.key); setActionFilter('all'); setRoleFilter('all'); setOffset(0); }}
                        className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition ${
                            activeTab === tab.key
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                    <Filter size={16} className="text-gray-400" />
                    <select
                        value={actionFilter}
                        onChange={(e) => { setActionFilter(e.target.value); setOffset(0); }}
                        aria-label="Filter by action"
                        className="bg-white border border-green-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-green-400"
                    >
                        {actionTypes.map((type) => (
                            <option key={type} value={type}>
                                {type === 'all' ? 'All Actions' : (labels[type] || formatIdentifier(type))}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <Users size={16} className="text-gray-400" />
                    <select
                        value={roleFilter}
                        onChange={(e) => { setRoleFilter(e.target.value); setOffset(0); }}
                        aria-label="Filter by role"
                        className="bg-white border border-green-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-green-400"
                    >
                        <option value="all">All Roles</option>
                        {(activeTab === 'user' ? ['user'] : ['admin', 'staff', 'user']).map(role => (
                            <option key={role} value={role}>{roleLabels[role]}s</option>
                        ))}
                    </select>
                </div>
                <div className="relative">
                    <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setOffset(0); }}
                        placeholder="Search user, action, description, IP or device"
                        aria-label="Search activity"
                        className="bg-white border border-green-200 rounded-lg pl-9 pr-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-green-400"
                    />
                </div>
                <input
                    type="date"
                    value={startDate}
                    onChange={(e) => { setStartDate(e.target.value); setOffset(0); }}
                    aria-label="Start date"
                    className="bg-white border border-green-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-green-400"
                />
                <input
                    type="date"
                    value={endDate}
                    onChange={(e) => { setEndDate(e.target.value); setOffset(0); }}
                    aria-label="End date"
                    className="bg-white border border-green-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-green-400"
                />
                {(startDate || endDate || roleFilter !== 'all' || search || actionFilter !== 'all') && (
                    <button
                        onClick={() => { setStartDate(''); setEndDate(''); setRoleFilter('all'); setSearch(''); setActionFilter('all'); setOffset(0); }}
                        className="text-sm text-gray-500 hover:text-gray-900 underline"
                    >
                        Clear filters
                    </button>
                )}
                <span className="text-xs text-gray-400 ml-auto">{currentTotal} total entries</span>
            </div>

            {/* Logs Table */}
            <div className="bg-white border border-green-200 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-green-50 border-b border-green-200">
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Time</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">IP Address</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Device</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {currentLogs.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-5 py-12 text-center text-gray-500">
                                        No logs found.
                                    </td>
                                </tr>
                            ) : (
                                currentLogs.map((log) => {
                                    const device = describeUserAgent(log.user_agent);
                                    const role = log.role || (log.source === 'staff' ? 'staff' : 'user');
                                    const name = log.actor_name || `${log.first_name || ''} ${log.last_name || ''}`.trim() || 'Deleted account';
                                    const handle = log.username ? `@${log.username}` : (log.email || log.actor_email || '');
                                    return (
                                        <tr key={`${log.source}-${log.id}`} className="hover:bg-green-50/50 transition align-top">
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full overflow-hidden bg-green-100 flex items-center justify-center text-green-700 text-xs font-bold flex-shrink-0">
                                                        {log.profile_image ? (
                                                            <img
                                                                src={getProfileImageUrl(log.profile_image)}
                                                                alt={name}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => { e.target.style.display = 'none'; }}
                                                            />
                                                        ) : (
                                                            <span className="flex items-center justify-center w-full h-full">
                                                                {`${log.first_name?.[0] || ''}${log.last_name?.[0] || name.charAt(0)}`}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
                                                        <p className="text-xs text-gray-500 truncate">{handle}</p>
                                                        <span className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold ${roleStyles[role] || roleStyles.user}`}>
                                                            {roleLabels[role] || role}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${actionTypeColors[log.action_type] || 'bg-gray-50 text-gray-600 border border-gray-200'}`}>
                                                    {labels[log.action_type] || formatIdentifier(log.action_type)}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3">
                                                <p className="text-sm text-gray-600 max-w-xs" title={log.action_description}>{log.action_description || '-'}</p>
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="text-xs text-gray-700 whitespace-nowrap">{formatSafeDate(log.created_at, { dateStyle: 'medium' })}</div>
                                                <div className="text-[10px] text-gray-400 whitespace-nowrap">{formatTimeAgo(log.created_at)}</div>
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="text-xs font-mono text-gray-700 whitespace-nowrap">{formatClockTime(log.created_at)}</div>
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="text-xs font-mono text-gray-700 whitespace-nowrap">{log.ip_address || '-'}</div>
                                            </td>
                                            <td className="px-5 py-3 hidden lg:table-cell">
                                                <div className="text-xs text-gray-700 whitespace-nowrap" title={log.user_agent || 'No device information recorded'}>
                                                    {device.label}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-5 py-3 border-t border-green-200 bg-green-50/50">
                        <button
                            onClick={() => { const newOffset = Math.max(0, offset - limit); setOffset(newOffset); fetchLogs(newOffset, activeTab); }}
                            disabled={offset === 0}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition"
                        >
                            <ChevronLeft size={16} /> Previous
                        </button>
                        <span className="text-xs text-gray-500">
                            Page {Math.floor(offset / limit) + 1} of {totalPages}
                        </span>
                        <button
                            onClick={() => { const newOffset = offset + limit; setOffset(newOffset); fetchLogs(newOffset, activeTab); }}
                            disabled={offset + limit >= currentTotal}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition"
                        >
                            Next <ChevronRight size={16} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminLogs;