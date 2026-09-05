import { DollarCircle as ReiconDollarCircle, Leaf as ReiconLeaf, More as ReiconMore, Paw as ReiconPaw, Ticket as ReiconTicket, TrendDown as ReiconTrendDown, TrendUp as ReiconTrendUp, Users as ReiconUsers } from 'reicon-react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip
} from 'recharts';
import Chart from 'react-apexcharts';
import { useAuth } from '../../context/AuthContext';
import { adminAPI, getProfileImageUrl } from '../../services/api-client';


// Icons

const TicketIcon = () => (
    <ReiconTicket strokeWidth="2" className="w-6 h-6" />
);

const RevenueIcon = () => (
    <ReiconDollarCircle strokeWidth="2" className="w-6 h-6" />
);

const TrendDownIcon = () => (
    <ReiconTrendDown strokeWidth="2" className="w-4 h-4" />
);

const MoreIcon = () => (
    <ReiconMore className="w-5 h-5" weight="Filled" />
);

const AdminDashboard = () => {
    const { user } = useAuth();
    const [timeFilter, setTimeFilter] = useState('today');

    const [stats, setStats] = useState({
        totalUsers: 0,
        totalAnimals: 0,
        totalPlants: 0,
        totalTickets: 0,
        totalRevenue: 0,
        totalVisitors: 0,
        totalProfit: 0,
        ticketDistribution: [],
        revenueBreakdown: [],
        eventOverview: [],
        trends: {}
    });

    const [recentUsers, setRecentUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const [weeklyData, setWeeklyData] = useState([]);

    const normalizeWeeklyData = (data) => {
        if (!Array.isArray(data)) return [];
        return data.map((day, index) => ({
            day: day.day || day.dayName || ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][index] || '',
            date: day.date || '',
            visitors: Number(day.visitors ?? day.totalVisitors ?? day.visitorCount) || 0,
            revenue: Number(day.revenue ?? day.totalRevenue ?? day.amount) || 0
        }));
    };

    const maxVisitors = useMemo(() => Math.max(...weeklyData.map(d => d.visitors), 1), [weeklyData]);

    const weeklyCategories = useMemo(() => weeklyData.map(d => d.day), [weeklyData]);
    const weeklyRevenue = useMemo(() => weeklyData.map(d => d.revenue), [weeklyData]);
    const hasWeeklyActivity = useMemo(
        () => weeklyData.some(day => day.visitors > 0 || day.revenue > 0),
        [weeklyData]
    );

    const weeklyTotals = useMemo(() => {
        if (!weeklyData.length) {
            return {
                totalVisitors: 0,
                avgVisitors: 0,
                peakDay: { day: 'N/A', visitors: 0 },
                totalRevenue: 0
            };
        }

        const totalVisitors = weeklyData.reduce((sum, d) => sum + d.visitors, 0);
        const totalRevenue = weeklyData.reduce((sum, d) => sum + d.revenue, 0);
        const avgVisitors = Math.round(totalVisitors / 7);
        const peakDay = weeklyData.reduce((max, d) => d.visitors > max.visitors ? d : max, weeklyData[0]);

        return { totalVisitors, avgVisitors, peakDay, totalRevenue };
    }, [weeklyData]);

    const donutSeries = useMemo(() => [{
        data: stats.ticketDistribution.length
            ? stats.ticketDistribution.map(item => ({ x: item.type, y: item.count }))
            : [{ x: 'No tickets', y: 0 }]
    }], [stats.ticketDistribution]);

    const donutOptions = useMemo(() => ({
        chart: {
            type: 'donut',
            background: 'transparent',
        },
        labels: stats.ticketDistribution.length
            ? stats.ticketDistribution.map(item => item.type)
            : ['No tickets'],
        colors: ['#4ade80', '#22c55e', '#86efac'],
        legend: { show: false },
        dataLabels: { enabled: false },
        plotOptions: {
            pie: {
                donut: {
                    size: '70%',
                    labels: {
                        show: true,
                        total: {
                            show: true,
                            label: 'Total',
                            color: '#374151',
                            fontSize: '14px',
                            formatter: () => stats.totalTickets.toLocaleString()
                        },
                        value: {
                            color: '#111827',
                            fontSize: '24px',
                            fontWeight: 'bold'
                        }
                    }
                }
            }
        },
        stroke: { show: false },
        tooltip: {
            theme: 'light',
            y: { formatter: (val) => `${val} tickets` }
        },
        theme: { mode: 'light' }
    }), [stats.totalTickets, stats.ticketDistribution]);

    const revenueAreaOptions = useMemo(() => ({
        chart: {
            type: 'area',
            toolbar: { show: false },
            sparkline: { enabled: true },
            background: 'transparent'
        },
        colors: ['#4ade80'],
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.4,
                opacityTo: 0,
                stops: [0, 100]
            }
        },
        stroke: {
            curve: 'smooth',
            width: 2
        },
        tooltip: { 
            enabled: true,
            theme: 'light',
            y: { formatter: (val) => `₱${val.toLocaleString()}` }
        },
        xaxis: { categories: weeklyCategories },
        theme: { mode: 'light' }
    }), [weeklyCategories]);

    const revenueAreaSeries = useMemo(() => ([
        { name: 'Revenue', data: weeklyRevenue }
    ]), [weeklyRevenue]);

    const fetchDashboardData = useCallback(async () => {
        try {
            setLoading(true);

            const [dashboardRes, usersRes, animalsRes, plantsRes] = await Promise.all([
                adminAPI.getDashboard(timeFilter).catch(() => null),
                adminAPI.getUsers().catch(() => null),
                adminAPI.getAnimals?.().catch(() => null),
                adminAPI.getPlants?.().catch(() => null),
            ]);

            let updatedStats = {
                totalUsers: 0,
                totalAnimals: 0,
                totalPlants: 0,
                totalTickets: 0,
                totalRevenue: 0,
                totalVisitors: 0,
                totalProfit: 0,
                ticketDistribution: [],
                revenueBreakdown: [],
                eventOverview: [],
                trends: {}
            };

            if (dashboardRes?.success) {
                const s = dashboardRes.stats || dashboardRes.data || dashboardRes;

                updatedStats.totalUsers = Number(
                    s.totalUsers ?? s.total_users ?? s.usersCount
                ) || 0;

                updatedStats.totalAnimals = Number(
                    s.totalAnimals ?? s.total_animals ?? s.animalsCount
                ) || 0;

                updatedStats.totalPlants = Number(
                    s.totalPlants ?? s.total_plants ?? s.plantsCount
                ) || 0;

                updatedStats.totalTickets = Number(
                    s.totalTickets ?? s.total_tickets ?? s.ticketsCount
                ) || 0;

                updatedStats.totalRevenue = Number(
                    s.totalRevenue ?? s.total_revenue ?? s.revenue
                ) || 0;
                updatedStats.totalVisitors = Number(s.totalVisitors) || 0;
                updatedStats.totalProfit = Number(s.totalProfit) || 0;
                updatedStats.ticketDistribution = Array.isArray(s.ticketDistribution) ? s.ticketDistribution : [];
                updatedStats.revenueBreakdown = Array.isArray(s.revenueBreakdown) ? s.revenueBreakdown : [];
                updatedStats.eventOverview = Array.isArray(s.eventOverview) ? s.eventOverview : [];
                updatedStats.trends = s.trends || {};
                const liveWeeklyData = s.weeklyData ?? dashboardRes.data?.weeklyData ?? dashboardRes.data?.stats?.weeklyData;
                setWeeklyData(normalizeWeeklyData(liveWeeklyData));
            } else {
                setWeeklyData([]);
            }

            if (usersRes?.success && Array.isArray(usersRes.users)) {
                const normalized = usersRes.users.map(u => ({
                    id: u.id || u.user_id,
                    firstName: u.firstName || u.first_name || '',
                    lastName: u.lastName || u.last_name || '',
                    fullName:
                        u.fullName ||
                        `${u.firstName || u.first_name || ''} ${u.lastName || u.last_name || ''}`.trim(),
                    email: u.email,
                    role: u.role,
                    profileImage: u.profileImage || u.profile_image,
                    createdAt: u.createdAt || u.created_at
                }));

                setRecentUsers(normalized.slice(0, 6));
                updatedStats.totalUsers = normalized.length;
            }

            if ((!updatedStats.totalAnimals || updatedStats.totalAnimals === 0) && animalsRes?.success && Array.isArray(animalsRes.animals)) {
                updatedStats.totalAnimals = animalsRes.animals.length;
            }

            if ((!updatedStats.totalPlants || updatedStats.totalPlants === 0) && plantsRes?.success && Array.isArray(plantsRes.plants)) {
                updatedStats.totalPlants = plantsRes.plants.length;
            }

            setStats(updatedStats);

        } catch (error) {
            console.error('Dashboard fetch error:', error);
        } finally {
            setLoading(false);
        }
    }, [timeFilter]);

    useEffect(() => {
        fetchDashboardData();
        const refreshTimer = setInterval(fetchDashboardData, 30000);
        return () => clearInterval(refreshTimer);
    }, [fetchDashboardData]);

    // Stat Card Component
    const StatCard = ({ title, value, icon, trend, trendValue, trendLabel }) => (
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-green-300 via-green-400 to-green-500 p-5 shadow-lg shadow-green-400/30 transition-all duration-300 hover:scale-[1.01]">
            <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-white/30 backdrop-blur-sm flex items-center justify-center text-gray-900 border border-white/20">
                    {icon}
                </div>
                <button className="text-green-800 hover:text-gray-900 transition">
                    <MoreIcon />
                </button>
            </div>
            <p className="text-green-800/85 text-sm mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">{value}</p>
            <div className="flex items-center gap-2">
                <span className={`flex items-center gap-1 text-sm font-semibold ${trend === 'up' ? 'text-green-800' : 'text-rose-900'
                    }`}>
                    {trend === 'up' ? <ReiconTrendUp className="w-4 h-4" /> : <TrendDownIcon />}
                    {trendValue}
                </span>
                <span className="text-green-800/80 text-sm">{trendLabel}</span>
            </div>
        </div>
    );

    // Donut Chart Component
    const DonutChart = ({ total, label }) => {
        const segments = [
            { color: '#4ade80', value: 45 },
            { color: '#22c55e', value: 25 },
            { color: '#16a34a', value: 20 },
            { color: '#86efac', value: 10 },
        ];

        let cumulativePercent = 0;

        return (
            <div className="relative w-40 h-40 mx-auto">
                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                    {segments.map((segment, index) => {
                        const strokeDasharray = `${segment.value} ${100 - segment.value}`;
                        const strokeDashoffset = -cumulativePercent;
                        cumulativePercent += segment.value;

                        return (
                            <circle
                                key={index}
                                cx="18"
                                cy="18"
                                r="14"
                                fill="none"
                                stroke={segment.color}
                                strokeWidth="4"
                                strokeDasharray={strokeDasharray}
                                strokeDashoffset={strokeDashoffset}
                                className="transition-all duration-500"
                            />
                        );
                    })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-gray-900">{total}</span>
                    <span className="text-xs text-gray-500">{label}</span>
                </div>
            </div>
        );
    };

    // Mini Bar Chart for Revenue
    const MiniBarChart = ({ data }) => (
        <div className="flex items-end gap-1 h-16">
            {data.map((item, index) => (
                <div
                    key={index}
                    className="flex-1 bg-gradient-to-t from-green-300 via-green-400 to-green-500 rounded-t opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
                    style={{ height: `${(item.visitors / maxVisitors) * 100}%` }}
                    title={`${item.day}: ${item.visitors} visitors`}
                />
            ))}
        </div>
    );

    // Area Chart Component
    const AreaChart = () => {
        const points = weeklyData.map((d, i) => ({
            x: (i / (weeklyData.length - 1)) * 100,
            y: 100 - (d.revenue / 8000) * 100
        }));

        const pathD = points.map((p, i) =>
            `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
        ).join(' ');

        const areaD = `${pathD} L 100 100 L 0 100 Z`;

        return (
            <svg viewBox="0 0 100 100" className="w-full h-24" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#86efac" stopOpacity="0.3" />
                        <stop offset="50%" stopColor="#4ade80" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                    </linearGradient>
                </defs>
                <path d={areaD} fill="url(#areaGradient)" />
                <path d={pathD} fill="none" stroke="#4ade80" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                {points.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r="2" fill="#4ade80" className="hover:r-3 transition-all" />
                ))}
            </svg>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-4 border-green-300"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-green-400 animate-spin"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.fullName?.split(' ')[0] || 'Admin'} 👋</h1>
                    <p className="text-gray-500">Here&apos;s what&apos;s happening with your zoo today.</p>
                </div>
                <div className="flex items-center gap-2">
                    <select 
                        value={timeFilter}
                        onChange={(e) => setTimeFilter(e.target.value)}
                        className="bg-green-50 border border-green-300 rounded-xl px-4 py-2 text-sm text-gray-900 focus:outline-none focus:border-green-400"
                    >
                        <option value="today">Today</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                        <option value="year">This Year</option>
                    </select>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard
                    title="Total Users"
                    value={stats.totalUsers.toLocaleString()}
                    icon={<ReiconUsers className="w-6 h-6" />}
                    trend="up"
                    trendValue="Live"
                    trendLabel="database total"
                />
                <StatCard
                    title="Total Animals"
                    value={stats.totalAnimals.toLocaleString()}
                    icon={<ReiconPaw className="w-6 h-6" />}
                    trend="up"
                    trendValue="Live"
                    trendLabel="database total"
                />
                <StatCard
                    title="Total Plants"
                    value={stats.totalPlants.toLocaleString()}
                    icon={<ReiconLeaf className="w-6 h-6" />}
                    trend="up"
                    trendValue="Live"
                    trendLabel="database total"
                />
                <StatCard
                    title="Tickets Sold"
                    value={stats.totalTickets.toLocaleString()}
                    icon={<TicketIcon />}
                    trend="up"
                    trendValue={`${stats.trends?.tickets >= 0 ? '+' : ''}${stats.trends?.tickets || 0}%`}
                    trendLabel="vs previous period"
                />
                <StatCard
                    title="Revenue"
                    value={`₱${stats.totalRevenue.toLocaleString()}`}
                    icon={<RevenueIcon />}
                    trend="up"
                    trendValue={`${stats.trends?.revenue >= 0 ? '+' : ''}${stats.trends?.revenue || 0}%`}
                    trendLabel="vs previous period"
                />
            </div>

            {/* Middle Section - Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Weekly traffic and revenue are intentionally separate metrics. */}
                <div className="lg:col-span-2 rounded-2xl border border-green-300 bg-white p-6">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Weekly Overview</h3>
                            <p className="text-sm text-gray-500">Unique site visitors and revenue for the last 7 days</p>
                        </div>
                        <span className="rounded-full bg-green-50 px-3 py-1 text-[11px] font-semibold text-green-800">Live tracking</span>
                    </div>

                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                        <div className="rounded-2xl border border-green-100 bg-green-50/40 p-4">
                            <div className="mb-2 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-bold text-gray-900">Visitor traffic</p>
                                    <p className="text-xs text-gray-500">Unique visitors per day</p>
                                </div>
                                <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                            </div>
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={weeklyData} margin={{ top: 10, right: 4, left: -20, bottom: 0 }}>
                                    <CartesianGrid vertical={false} stroke="#d1fae5" strokeDasharray="4 4" />
                                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                                    <Tooltip formatter={(value) => [`${value} visitors`, 'Visitors']} contentStyle={{ borderRadius: 12, border: '1px solid #d1fae5' }} />
                                    <Bar dataKey="visitors" name="Visitors" fill="#4ade80" radius={[6, 6, 0, 0]} minPointSize={4} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="rounded-2xl border border-lime-100 bg-lime-50/40 p-4">
                            <div className="mb-2 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-bold text-gray-900">Revenue trend</p>
                                    <p className="text-xs text-gray-500">Ticket revenue per day</p>
                                </div>
                                <span className="h-2.5 w-2.5 rounded-full bg-lime-500" />
                            </div>
                            <ResponsiveContainer width="100%" height={220}>
                                <LineChart data={weeklyData} margin={{ top: 10, right: 8, left: 4, bottom: 0 }}>
                                    <CartesianGrid vertical={false} stroke="#ecfccb" strokeDasharray="4 4" />
                                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} tickFormatter={(value) => `₱${value}`} />
                                    <Tooltip formatter={(value) => [`₱${Number(value).toLocaleString()}`, 'Revenue']} contentStyle={{ borderRadius: 12, border: '1px solid #ecfccb' }} />
                                    <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#4ade80" strokeWidth={3} dot={{ r: 4, fill: '#4ade80', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {!hasWeeklyActivity && <p className="mt-3 text-center text-xs text-gray-400">No site visits or revenue have been recorded this week yet.</p>}

                    {/* Summary Stats */}
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-green-300">
                        <div>
                            <p className="text-gray-500 text-sm">Total Visitors</p>
                            <p className="text-xl font-bold text-gray-900">{weeklyTotals.totalVisitors.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm">Avg. per day</p>
                            <p className="text-xl font-bold text-gray-900">{weeklyTotals.avgVisitors.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm">Peak Day</p>
                            <p className="text-xl font-bold text-green-800">{weeklyTotals.peakDay.day}</p>
                        </div>
                    </div>
                </div>

                {/* Ticket Distribution */}
                <div className="bg-white border border-green-300 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900">Ticket Types</h3>
                        <button className="text-gray-500 hover:text-gray-900 transition">
                            <MoreIcon />
                        </button>
                    </div>

                    {/* ApexCharts Donut */}
                    <div className="flex justify-center">
                        <Chart
                            options={donutOptions}
                            series={donutSeries}
                            type="donut"
                            width="180"
                        />
                    </div>

                    {/* Legend */}
                    <div className="mt-4 space-y-3">
                        {stats.ticketDistribution.map((item, index) => {
                            const total = stats.ticketDistribution.reduce((sum, entry) => sum + entry.count, 0);
                            return <div key={item.type} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ['#4ade80', '#22c55e', '#86efac'][index] }}></div>
                                    <span className="text-sm text-gray-700">{item.type}</span>
                                </div>
                                <span className="text-sm font-medium text-gray-900">{total ? Math.round((item.count / total) * 100) : 0}%</span>
                            </div>;
                        })}
                        {!stats.ticketDistribution.length && <p className="text-sm text-gray-500 text-center">No ticket sales for this period</p>}
                    </div>
                </div>
            </div>

            {/* Revenue & New Customers Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* New Customers Card */}
                <div className="bg-white border border-green-300 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                            <ReiconUsers className="w-6 h-6" />
                        </div>
                        <span className="text-green-800 text-sm font-medium flex items-center gap-1">
                            Live
                        </span>
                    </div>
                    <p className="text-gray-500 text-sm">Visitors</p>
                    <p className="text-3xl font-bold text-gray-900 mb-1">{stats.totalVisitors.toLocaleString()}</p>
                    <p className="text-gray-500 text-sm">Selected period</p>
                </div>

                {/* Total Profit Card */}
                <div className="bg-white border border-green-300 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-gray-500 text-sm">Total Profit</p>
                        <span className="text-green-800 text-sm font-medium flex items-center gap-1">
                            Live
                        </span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 mb-2">₱{stats.totalProfit.toLocaleString()}</p>
                    <p className="text-gray-500 text-sm mb-2">Selected period revenue</p>
                    <Chart
                        options={revenueAreaOptions}
                        series={revenueAreaSeries}
                        type="area"
                        height={80}
                    />
                </div>

                {/* Revenue Breakdown */}
                <div className="bg-white border border-green-300 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Revenue Breakdown</h3>
                    <div className="space-y-4">
                        {stats.revenueBreakdown.map(item => {
                            const percentage = stats.totalProfit ? Math.round((item.amount / stats.totalProfit) * 100) : 0;
                            return <div key={item.source}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-500">{item.source}</span>
                                    <span className="text-gray-900 font-medium">₱{item.amount.toLocaleString()}</span>
                                </div>
                                <div className="h-2 bg-green-50 rounded-full overflow-hidden">
                                    <div className="h-full bg-green-400 rounded-full" style={{ width: `${percentage}%` }}></div>
                                </div>
                            </div>;
                        })}
                        {!stats.revenueBreakdown.length && <p className="text-sm text-gray-500">No revenue recorded for this period</p>}
                    </div>
                </div>
            </div>

            {/* Upcoming Event Overview */}
            <div className="bg-white border border-green-300 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Event Overview</h3>
                        <p className="text-sm text-gray-500">Upcoming events and live registrations</p>
                    </div>
                    <Link to="/admin/events" className="text-sm text-green-800 font-medium">View events</Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    {stats.eventOverview.map(event => <div key={event.id} className="rounded-xl bg-green-50 p-4">
                        <p className="font-semibold text-gray-900 truncate">{event.title}</p>
                        <p className="text-xs text-gray-500 mt-1">{new Date(event.event_date).toLocaleDateString()}</p>
                        <p className="text-sm text-gray-700 mt-3">{event.registrations} registrations</p>
                        <p className="text-sm font-medium text-green-800">₱{event.revenue.toLocaleString()}</p>
                    </div>)}
                    {!stats.eventOverview.length && <p className="text-sm text-gray-500">No upcoming events.</p>}
                </div>
            </div>

            {/* Recently Registered Users */}
            <div className="bg-white border border-green-300 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Recently Registered Users</h3>
                        <p className="text-sm text-gray-500">New users who joined this week</p>
                    </div>
                    <Link
                        to="/admin/users"
                        className="px-4 py-2 bg-green-400 hover:bg-green-400 text-black font-medium rounded-xl transition-colors"
                    >
                        View All
                    </Link>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left border-b border-green-300">
                                <th className="pb-4 text-sm font-semibold text-gray-500">User</th>
                                <th className="pb-4 text-sm font-semibold text-gray-500">Email</th>
                                <th className="pb-4 text-sm font-semibold text-gray-500">Role</th>
                                <th className="pb-4 text-sm font-semibold text-gray-500">Joined</th>
                                <th className="pb-4 text-sm font-semibold text-gray-500">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-green-200">
                            {recentUsers.map((u) => (
                                <tr key={u.id} className="hover:bg-green-50 transition-colors">
                                    <td className="py-4">
                                        <div className="flex items-center gap-3">
                                            {getProfileImageUrl(u.profileImage) ? (
                                                <img
                                                    src={getProfileImageUrl(u.profileImage)}
                                                    alt={u.fullName || 'User'}
                                                    className="w-10 h-10 rounded-full object-cover"
                                                    referrerPolicy="no-referrer"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = '';
                                                        e.target.style.display = 'none';
                                                        if (e.target.nextElementSibling) {
                                                            e.target.nextElementSibling.style.display = 'flex';
                                                        }
                                                    }}
                                                />
                                            ) : null}
                                            <div 
                                                className="w-10 h-10 rounded-full bg-green-400 flex items-center justify-center text-gray-900 font-bold"
                                                style={{ display: getProfileImageUrl(u.profileImage) ? 'none' : 'flex' }}
                                            >
                                                {(u.fullName || u.firstName || 'U').charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{u.fullName || `${u.firstName} ${u.lastName}`.trim() || 'Unknown'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 text-gray-700">{u.email || '-'}</td>
                                    <td className="py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${u.role === 'admin'
                                                ? 'bg-purple-500/20 text-purple-700 border border-purple-500/30'
                                                : u.role === 'staff'
                                                    ? 'bg-blue-500/20 text-blue-700 border border-blue-500/30'
                                                    : 'bg-gray-500/20 text-gray-500 border border-gray-500/30'
                                            }`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="py-4 text-gray-500 text-sm">
                                        {new Date(u.createdAt).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
                                    </td>
                                    <td className="py-4">
                                        <span className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-green-400"></span>
                                            <span className="text-sm text-gray-500">Active</span>
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {recentUsers.length === 0 && (
                    <div className="text-center py-8">
                        <p className="text-gray-500">No recent users found</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
