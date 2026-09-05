import { useState, useEffect, useCallback } from 'react';
import { ClipboardList, Users, Activity, Filter, ChevronLeft, ChevronRight, Refresh } from 'reicon-react';
import { adminAPI } from '../../services/api-client';

const staffActionLabels = {
    login: 'Login',
    logout: 'Logout',
    message_reply: 'Message Reply',
    reservation_update: 'Reservation Update',
    ticket_update: 'Ticket Update',
    animal_update: 'Animal Update',
    plant_update: 'Plant Update',
    event_update: 'Event Update',
    user_update: 'User Update',
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
    login: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    logout: 'bg-gray-50 text-gray-600 border border-gray-200',
    register: 'bg-teal-50 text-teal-700 border border-teal-200',
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

const staffActionTypes = ['all', 'login', 'logout', 'message_reply', 'reservation_update', 'ticket_update', 'animal_update', 'plant_update', 'event_update', 'user_update', 'other'];
const userActionTypes = ['all', 'register', 'login', 'logout', 'profile_update', 'password_change', 'settings_update', 'ticket_purchase', 'ticket_reservation', 'event_reservation', 'ticket_archive', 'ticket_unarchive', 'event_archive', 'event_unarchive', 'event_update', 'payment_checkout', 'payment_method_update', 'refund_request', 'message_sent', 'message_delete', 'post_create', 'post_update', 'post_delete', 'post_like', 'comment_create', 'comment_update', 'comment_delete', 'comment_heart', 'comment_report', 'appeal_submit', 'prediction_create', 'account_delete', 'other'];

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

const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
};

const AdminLogs = () => {
    const [activeTab, setActiveTab] = useState('staff');
    const [staffLogs, setStaffLogs] = useState([]);
    const [userLogs, setUserLogs] = useState([]);
    const [summary, setSummary] = useState({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [staffFilter, setStaffFilter] = useState('all');
    const [userFilter, setUserFilter] = useState('all');
    const [staffOffset, setStaffOffset] = useState(0);
    const [userOffset, setUserOffset] = useState(0);
    const [staffTotal, setStaffTotal] = useState(0);
    const [userTotal, setUserTotal] = useState(0);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const limit = 20;

    const fetchStaffLogs = useCallback(async (offset = 0, showRefreshing = false) => {
        try {
            if (showRefreshing) setRefreshing(true);
            const data = await adminAPI.getStaffLogs({
                limit,
                offset,
                actionType: staffFilter === 'all' ? '' : staffFilter,
                startDate,
                endDate
            });
            setStaffLogs(Array.isArray(data.logs) ? data.logs : []);
            setStaffTotal(Number(data.total) || 0);
            setError('');
        } catch (requestError) {
            setStaffLogs([]);
            setStaffTotal(0);
            setError(requestError.message || 'Could not load staff logs.');
        } finally { setLoading(false); setRefreshing(false); }
    }, [staffFilter, startDate, endDate]);

    const fetchUserLogs = useCallback(async (offset = 0, showRefreshing = false) => {
        try {
            if (showRefreshing) setRefreshing(true);
            const data = await adminAPI.getUserLogs({
                limit,
                offset,
                actionType: userFilter === 'all' ? '' : userFilter,
                startDate,
                endDate
            });
            setUserLogs(Array.isArray(data.logs) ? data.logs : []);
            setUserTotal(Number(data.total) || 0);
            setError('');
        } catch (requestError) {
            setUserLogs([]);
            setUserTotal(0);
            setError(requestError.message || 'Could not load user logs.');
        } finally { setLoading(false); setRefreshing(false); }
    }, [userFilter, startDate, endDate]);

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
        setStaffOffset(0);
        setUserOffset(0);
        fetchStaffLogs(0);
        fetchUserLogs(0);
        fetchSummary();
    }, [fetchStaffLogs, fetchUserLogs, fetchSummary]);

    const handleRefresh = () => {
        if (activeTab === 'staff') fetchStaffLogs(staffOffset, true);
        else fetchUserLogs(userOffset, true);
        fetchSummary();
    };

    const currentLogs = activeTab === 'staff' ? staffLogs : userLogs;
    const currentTotal = activeTab === 'staff' ? staffTotal : userTotal;
    const currentOffset = activeTab === 'staff' ? staffOffset : userOffset;
    const setOffset = activeTab === 'staff' ? setStaffOffset : setUserOffset;
    const currentFilter = activeTab === 'staff' ? staffFilter : userFilter;
    const setFilter = activeTab === 'staff' ? setStaffFilter : setUserFilter;
    const actionTypes = activeTab === 'staff' ? staffActionTypes : userActionTypes;
    const fetchFn = activeTab === 'staff' ? fetchStaffLogs : fetchUserLogs;
    const totalPages = Math.ceil(currentTotal / limit);
    const labels = activeTab === 'staff' ? staffActionLabels : userActionLabels;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-4 border-green-200"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-green-500 animate-spin"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-green-500/15 text-green-600 flex items-center justify-center">
                        <ClipboardList size={22} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Logs</h1>
                        <p className="text-sm text-gray-500">Activity logs for all staff and users.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-500 text-black font-semibold hover:bg-green-400 disabled:bg-gray-300 transition"
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
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-white border border-green-200 rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-gray-500 text-xs mb-2"><Activity size={14} /> Staff Actions</div>
                    <p className="text-2xl font-bold text-gray-900">{summary.totalStaffActions || 0}</p>
                </div>
                <div className="bg-white border border-green-200 rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-gray-500 text-xs mb-2"><Users size={14} /> User Actions</div>
                    <p className="text-2xl font-bold text-gray-900">{summary.totalUserActions || 0}</p>
                </div>
                <div className="bg-white border border-green-200 rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-gray-500 text-xs mb-2"><Users size={14} /> Total Users</div>
                    <p className="text-2xl font-bold text-gray-900">{summary.totalUsers || 0}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
                <button
                    onClick={() => setActiveTab('staff')}
                    className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition ${
                        activeTab === 'staff'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Staff Logs
                </button>
                <button
                    onClick={() => setActiveTab('users')}
                    className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition ${
                        activeTab === 'users'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    User Logs
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                    <Filter size={16} className="text-gray-400" />
                    <select
                        value={currentFilter}
                        onChange={(e) => { setFilter(e.target.value); setOffset(0); }}
                        className="bg-white border border-green-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-green-500"
                    >
                        {actionTypes.map((type) => (
                            <option key={type} value={type}>
                                {type === 'all' ? 'All Actions' : (labels[type] || type)}
                            </option>
                        ))}
                    </select>
                </div>
                <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-white border border-green-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-green-500"
                />
                <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-white border border-green-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-green-500"
                />
                {(startDate || endDate || currentFilter !== 'all') && (
                    <button
                        onClick={() => { setStartDate(''); setEndDate(''); setFilter('all'); setOffset(0); }}
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
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Description</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Entity</th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {currentLogs.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-5 py-12 text-center text-gray-500">
                                        No logs found.
                                    </td>
                                </tr>
                            ) : (
                                currentLogs.map((log, index) => (
                                    <tr key={log.id || index} className="hover:bg-green-50/50 transition">
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xs font-bold flex-shrink-0">
                                                    {log.first_name?.[0] || log.actor_name?.[0] || '?'}{log.last_name?.[0] || ''}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">{log.actor_name || `${log.first_name || ''} ${log.last_name || ''}`.trim() || 'Deleted user'}</p>
                                                    <p className="text-xs text-gray-500 truncate">{log.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${actionTypeColors[log.action_type] || 'bg-gray-50 text-gray-600 border border-gray-200'}`}>
                                                {labels[log.action_type] || log.action_type}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 hidden md:table-cell">
                                            <p className="text-sm text-gray-600 max-w-xs truncate">{log.action_description}</p>
                                        </td>
                                        <td className="px-5 py-3 hidden lg:table-cell">
                                            {log.entity_type && (
                                                <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded border border-gray-200">
                                                    {log.entity_type}{log.entity_id ? ` #${log.entity_id}` : ''}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3">
                                            <div className="text-xs text-gray-500" title={formatDateTime(log.created_at)}>
                                                {formatTimeAgo(log.created_at)}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-5 py-3 border-t border-green-200 bg-green-50/50">
                        <button
                            onClick={() => { const newOffset = Math.max(0, currentOffset - limit); setOffset(newOffset); fetchFn(newOffset); }}
                            disabled={currentOffset === 0}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition"
                        >
                            <ChevronLeft size={16} /> Previous
                        </button>
                        <span className="text-xs text-gray-500">
                            Page {Math.floor(currentOffset / limit) + 1} of {totalPages}
                        </span>
                        <button
                            onClick={() => { const newOffset = currentOffset + limit; setOffset(newOffset); fetchFn(newOffset); }}
                            disabled={currentOffset + limit >= currentTotal}
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
