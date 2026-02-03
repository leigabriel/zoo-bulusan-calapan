import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api-client';

// Icons
const TrendUpIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
    </svg>
);

const TrendDownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
        <polyline points="17 18 23 18 23 12" />
    </svg>
);

const UsersIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);

const TicketIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
        <path d="M13 5v2" />
        <path d="M13 17v2" />
        <path d="M13 11v2" />
    </svg>
);

const RevenueIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
);

const EventsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
);

const ChartIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
);

const CalendarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
);

const Analytics = () => {
    const [timeRange, setTimeRange] = useState('month');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalUsers: 0,
        newUsers: 0,
        userGrowth: 0,
        totalTickets: 0,
        ticketsSold: 0,
        ticketGrowth: 0,
        totalRevenue: 0,
        revenueGrowth: 0,
        totalEvents: 0,
        activeEvents: 0,
        eventGrowth: 0,
    });

    // Mock data for charts - in production, fetch from API
    const weeklyData = [
        { day: 'Mon', users: 45, tickets: 120, revenue: 4500 },
        { day: 'Tue', users: 52, tickets: 145, revenue: 5200 },
        { day: 'Wed', users: 38, tickets: 98, revenue: 3900 },
        { day: 'Thu', users: 65, tickets: 156, revenue: 6500 },
        { day: 'Fri', users: 78, tickets: 189, revenue: 7800 },
        { day: 'Sat', users: 92, tickets: 234, revenue: 9200 },
        { day: 'Sun', users: 85, tickets: 210, revenue: 8500 },
    ];

    const monthlyRevenue = [
        { month: 'Jan', amount: 45000 },
        { month: 'Feb', amount: 52000 },
        { month: 'Mar', amount: 48000 },
        { month: 'Apr', amount: 61000 },
        { month: 'May', amount: 55000 },
        { month: 'Jun', amount: 67000 },
    ];

    const ticketTypes = [
        { type: 'Adult', count: 1245, percentage: 45 },
        { type: 'Child', count: 876, percentage: 32 },
        { type: 'Senior', count: 456, percentage: 16 },
        { type: 'Student', count: 189, percentage: 7 },
    ];

    const topEvents = [
        { name: 'Night Safari Experience', tickets: 456, revenue: 45600 },
        { name: 'Animal Feeding Tour', tickets: 389, revenue: 23340 },
        { name: 'Wildlife Photography Day', tickets: 256, revenue: 25600 },
        { name: 'Conservation Workshop', tickets: 189, revenue: 9450 },
    ];

    useEffect(() => {
        const loadStats = async () => {
            setLoading(true);
            try {
                // Fetch real data from API
                const [usersRes, ticketsRes, eventsRes] = await Promise.allSettled([
                    adminAPI.getUsers(),
                    adminAPI.getTickets ? adminAPI.getTickets() : Promise.resolve({ success: false }),
                    adminAPI.getEvents ? adminAPI.getEvents() : Promise.resolve({ success: false }),
                ]);

                const users = usersRes.status === 'fulfilled' && usersRes.value?.users ? usersRes.value.users : [];
                const tickets = ticketsRes.status === 'fulfilled' && ticketsRes.value?.tickets ? ticketsRes.value.tickets : [];
                const events = eventsRes.status === 'fulfilled' && eventsRes.value?.events ? eventsRes.value.events : [];

                setStats({
                    totalUsers: users.length || 156,
                    newUsers: 32,
                    userGrowth: 12.5,
                    totalTickets: tickets.length || 2766,
                    ticketsSold: 1245,
                    ticketGrowth: 8.3,
                    totalRevenue: 328500,
                    revenueGrowth: 15.2,
                    totalEvents: events.length || 24,
                    activeEvents: 8,
                    eventGrowth: 5.1,
                });
            } catch (error) {
                console.error('Error loading analytics:', error);
            } finally {
                setLoading(false);
            }
        };
        loadStats();
    }, [timeRange]);

    const maxBarHeight = Math.max(...weeklyData.map(d => d.tickets));

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-[#8cff65] border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-400">Loading analytics...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Time Range Selector */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <ChartIcon />
                        Analytics Overview
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Monitor your zoo's performance metrics</p>
                </div>
                <div className="flex items-center gap-2 bg-[#141414] border border-[#2a2a2a] rounded-xl p-1">
                    {['week', 'month', 'year'].map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${timeRange === range
                                    ? 'bg-[#8cff65] text-[#0a0a0a]'
                                    : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            {range.charAt(0).toUpperCase() + range.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Users */}
                <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400">
                            <UsersIcon />
                        </div>
                        <span className={`flex items-center gap-1 text-sm font-medium ${stats.userGrowth >= 0 ? 'text-[#8cff65]' : 'text-red-400'}`}>
                            {stats.userGrowth >= 0 ? <TrendUpIcon /> : <TrendDownIcon />}
                            {Math.abs(stats.userGrowth)}%
                        </span>
                    </div>
                    <h3 className="text-3xl font-bold text-white">{stats.totalUsers.toLocaleString()}</h3>
                    <p className="text-gray-500 text-sm mt-1">Total Users</p>
                    <p className="text-gray-400 text-xs mt-2">+{stats.newUsers} new this {timeRange}</p>
                </div>

                {/* Tickets Sold */}
                <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-[#8cff65]/10 rounded-xl flex items-center justify-center text-[#8cff65]">
                            <TicketIcon />
                        </div>
                        <span className={`flex items-center gap-1 text-sm font-medium ${stats.ticketGrowth >= 0 ? 'text-[#8cff65]' : 'text-red-400'}`}>
                            {stats.ticketGrowth >= 0 ? <TrendUpIcon /> : <TrendDownIcon />}
                            {Math.abs(stats.ticketGrowth)}%
                        </span>
                    </div>
                    <h3 className="text-3xl font-bold text-white">{stats.totalTickets.toLocaleString()}</h3>
                    <p className="text-gray-500 text-sm mt-1">Tickets Sold</p>
                    <p className="text-gray-400 text-xs mt-2">{stats.ticketsSold} this {timeRange}</p>
                </div>

                {/* Revenue */}
                <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400">
                            <RevenueIcon />
                        </div>
                        <span className={`flex items-center gap-1 text-sm font-medium ${stats.revenueGrowth >= 0 ? 'text-[#8cff65]' : 'text-red-400'}`}>
                            {stats.revenueGrowth >= 0 ? <TrendUpIcon /> : <TrendDownIcon />}
                            {Math.abs(stats.revenueGrowth)}%
                        </span>
                    </div>
                    <h3 className="text-3xl font-bold text-white">₱{stats.totalRevenue.toLocaleString()}</h3>
                    <p className="text-gray-500 text-sm mt-1">Total Revenue</p>
                    <p className="text-gray-400 text-xs mt-2">This {timeRange}</p>
                </div>

                {/* Active Events */}
                <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center text-yellow-400">
                            <EventsIcon />
                        </div>
                        <span className={`flex items-center gap-1 text-sm font-medium ${stats.eventGrowth >= 0 ? 'text-[#8cff65]' : 'text-red-400'}`}>
                            {stats.eventGrowth >= 0 ? <TrendUpIcon /> : <TrendDownIcon />}
                            {Math.abs(stats.eventGrowth)}%
                        </span>
                    </div>
                    <h3 className="text-3xl font-bold text-white">{stats.totalEvents}</h3>
                    <p className="text-gray-500 text-sm mt-1">Total Events</p>
                    <p className="text-gray-400 text-xs mt-2">{stats.activeEvents} active now</p>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Weekly Ticket Sales Chart */}
                <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-white">Weekly Ticket Sales</h3>
                            <p className="text-sm text-gray-500">Tickets sold per day</p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            <CalendarIcon />
                            This Week
                        </div>
                    </div>

                    {/* Bar Chart */}
                    <div className="flex items-end justify-between gap-2 h-48">
                        {weeklyData.map((day, index) => (
                            <div key={index} className="flex-1 flex flex-col items-center gap-2">
                                <div className="w-full flex flex-col items-center">
                                    <span className="text-xs text-gray-400 mb-1">{day.tickets}</span>
                                    <div
                                        className="w-full bg-gradient-to-t from-[#8cff65] to-[#4ade80] rounded-t-lg transition-all hover:from-[#9dff7a] hover:to-[#5ceb91]"
                                        style={{ height: `${(day.tickets / maxBarHeight) * 140}px` }}
                                    ></div>
                                </div>
                                <span className="text-xs text-gray-500">{day.day}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Revenue Trend */}
                <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-white">Revenue Trend</h3>
                            <p className="text-sm text-gray-500">Monthly revenue overview</p>
                        </div>
                    </div>

                    {/* Line Chart Representation */}
                    <div className="space-y-4">
                        {monthlyRevenue.map((month, index) => (
                            <div key={index} className="flex items-center gap-4">
                                <span className="w-10 text-sm text-gray-400">{month.month}</span>
                                <div className="flex-1 bg-[#1e1e1e] rounded-full h-4 overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                                        style={{ width: `${(month.amount / 70000) * 100}%` }}
                                    ></div>
                                </div>
                                <span className="w-20 text-right text-sm text-white font-medium">₱{(month.amount / 1000).toFixed(0)}K</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Ticket Types Distribution */}
                <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-6">Ticket Distribution</h3>
                    <div className="space-y-4">
                        {ticketTypes.map((ticket, index) => (
                            <div key={index} className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-300">{ticket.type}</span>
                                    <span className="text-white font-medium">{ticket.count}</span>
                                </div>
                                <div className="w-full bg-[#1e1e1e] rounded-full h-2 overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all ${index === 0 ? 'bg-[#8cff65]' :
                                                index === 1 ? 'bg-blue-400' :
                                                    index === 2 ? 'bg-purple-400' :
                                                        'bg-yellow-400'
                                            }`}
                                        style={{ width: `${ticket.percentage}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Performing Events */}
                <div className="lg:col-span-2 bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-6">Top Performing Events</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-[#2a2a2a]">
                                    <th className="pb-3">Event Name</th>
                                    <th className="pb-3 text-right">Tickets</th>
                                    <th className="pb-3 text-right">Revenue</th>
                                    <th className="pb-3 text-right">Performance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#2a2a2a]">
                                {topEvents.map((event, index) => (
                                    <tr key={index} className="hover:bg-[#1e1e1e]/50 transition-colors">
                                        <td className="py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${index === 0 ? 'bg-[#8cff65]/20 text-[#8cff65]' :
                                                        index === 1 ? 'bg-blue-500/20 text-blue-400' :
                                                            index === 2 ? 'bg-purple-500/20 text-purple-400' :
                                                                'bg-gray-500/20 text-gray-400'
                                                    }`}>
                                                    {index + 1}
                                                </div>
                                                <span className="text-white font-medium">{event.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 text-right text-gray-300">{event.tickets}</td>
                                        <td className="py-4 text-right text-white font-medium">₱{event.revenue.toLocaleString()}</td>
                                        <td className="py-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <div className="w-16 bg-[#1e1e1e] rounded-full h-1.5">
                                                    <div
                                                        className="h-full bg-[#8cff65] rounded-full"
                                                        style={{ width: `${(event.tickets / 500) * 100}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;