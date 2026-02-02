import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api-client';

// Icons
const UsersIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
);

const AnimalIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" className="w-6 h-6">
        <path d="M226.5 92.9c14.3 42.9-.3 86.2-32.6 96.8s-70.1-15.6-84.4-58.5s.3-86.2 32.6-96.8s70.1 15.6 84.4 58.5zM100.4 198.6c18.9 32.4 14.3 70.1-10.2 84.1s-59.7-.9-78.5-33.3S-2.7 179.3 21.8 165.3s59.7 .9 78.5 33.3zM69.2 401.2C121.6 259.9 214.7 224 256 224s134.4 35.9 186.8 177.2c3.6 9.7 5.2 20.1 5.2 30.5v1.6c0 25.8-20.9 46.7-46.7 46.7c-11.5 0-22.9-1.4-34-4.2l-88-22c-15.3-3.8-31.3-3.8-46.6 0l-88 22c-11.1 2.8-22.5 4.2-34 4.2C84.9 480 64 459.1 64 433.3v-1.6c0-10.4 1.6-20.8 5.2-30.5zM421.8 282.7c-24.5-14-29.1-51.7-10.2-84.1s54-47.3 78.5-33.3s29.1 51.7 10.2 84.1s-54 47.3-78.5 33.3zM310.1 189.7c-32.3-10.6-46.9-53.9-32.6-96.8s52.1-69.1 84.4-58.5s46.9 53.9 32.6 96.8s-52.1 69.1-84.4 58.5z"/>
    </svg>
);

const TicketIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
        <path d="M13 5v2"/>
        <path d="M13 17v2"/>
        <path d="M13 11v2"/>
    </svg>
);

const RevenueIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <circle cx="12" cy="12" r="10"/>
        <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/>
        <path d="M12 18V6"/>
    </svg>
);

const TrendUpIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
        <polyline points="17 6 23 6 23 12"/>
    </svg>
);

const TrendDownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
        <polyline points="17 18 23 18 23 12"/>
    </svg>
);

const MoreIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <circle cx="12" cy="12" r="1"/>
        <circle cx="12" cy="5" r="1"/>
        <circle cx="12" cy="19" r="1"/>
    </svg>
);

const AdminDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalAnimals: 0,
        totalTickets: 0,
        totalRevenue: 0
    });
    const [recentUsers, setRecentUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Mock weekly data for charts
    const weeklyData = [
        { day: 'Mon', visitors: 120, revenue: 2400 },
        { day: 'Tue', visitors: 180, revenue: 3600 },
        { day: 'Wed', visitors: 150, revenue: 3000 },
        { day: 'Thu', visitors: 220, revenue: 4400 },
        { day: 'Fri', visitors: 280, revenue: 5600 },
        { day: 'Sat', visitors: 350, revenue: 7000 },
        { day: 'Sun', visitors: 310, revenue: 6200 },
    ];

    const maxVisitors = Math.max(...weeklyData.map(d => d.visitors));

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [statsRes, usersRes] = await Promise.all([
                adminAPI.getDashboard(),
                adminAPI.getUsers(),
            ]);

            if (statsRes && statsRes.success) {
                const s = statsRes.stats || {};
                setStats({
                    totalUsers: Number(s.totalUsers || 0),
                    totalAnimals: Number(s.totalAnimals || 0),
                    totalTickets: Number(s.totalTickets || 0),
                    totalRevenue: Number(s.totalRevenue || 0)
                });
            }

            if (usersRes && usersRes.success) {
                const normalized = (usersRes.users || []).map(u => ({
                    id: u.id || u.user_id,
                    firstName: u.firstName || u.first_name || '',
                    lastName: u.lastName || u.last_name || '',
                    fullName: u.fullName || `${u.firstName || u.first_name || ''} ${u.lastName || u.last_name || ''}`.trim(),
                    email: u.email,
                    role: u.role,
                    profileImage: u.profileImage || u.profile_image,
                    createdAt: u.createdAt || u.created_at
                }));
                setRecentUsers(normalized.slice(0, 6));
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Stat Card Component
    const StatCard = ({ title, value, icon, trend, trendValue, trendLabel }) => (
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-5 hover:border-[#8cff65]/30 transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-[#8cff65]/10 flex items-center justify-center text-[#8cff65]">
                    {icon}
                </div>
                <button className="text-gray-500 hover:text-white transition">
                    <MoreIcon />
                </button>
            </div>
            <p className="text-gray-400 text-sm mb-1">{title}</p>
            <p className="text-3xl font-bold text-white mb-2">{value}</p>
            <div className="flex items-center gap-2">
                <span className={`flex items-center gap-1 text-sm font-medium ${
                    trend === 'up' ? 'text-[#8cff65]' : 'text-red-400'
                }`}>
                    {trend === 'up' ? <TrendUpIcon /> : <TrendDownIcon />}
                    {trendValue}
                </span>
                <span className="text-gray-500 text-sm">{trendLabel}</span>
            </div>
        </div>
    );

    // Donut Chart Component
    const DonutChart = ({ data, total, label }) => {
        const segments = [
            { color: '#8cff65', value: 45 },
            { color: '#22c55e', value: 25 },
            { color: '#4ade80', value: 20 },
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
                    <span className="text-2xl font-bold text-white">{total}</span>
                    <span className="text-xs text-gray-400">{label}</span>
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
                    className="flex-1 bg-gradient-to-t from-[#8cff65] to-[#4ade80] rounded-t opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
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
                        <stop offset="0%" stopColor="#8cff65" stopOpacity="0.3"/>
                        <stop offset="100%" stopColor="#8cff65" stopOpacity="0"/>
                    </linearGradient>
                </defs>
                <path d={areaD} fill="url(#areaGradient)"/>
                <path d={pathD} fill="none" stroke="#8cff65" strokeWidth="2" vectorEffect="non-scaling-stroke"/>
                {points.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r="2" fill="#8cff65" className="hover:r-3 transition-all"/>
                ))}
            </svg>
        );
    };

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
                <div>
                    <h1 className="text-2xl font-bold text-white">Welcome back, {user?.fullName?.split(' ')[0] || 'Admin'} 👋</h1>
                    <p className="text-gray-400">Here&apos;s what&apos;s happening with your zoo today.</p>
                </div>
                <div className="flex items-center gap-2">
                    <select className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-[#8cff65]">
                        <option>Today</option>
                        <option>This Week</option>
                        <option>This Month</option>
                        <option>This Year</option>
                    </select>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard 
                    title="Total Users" 
                    value={stats.totalUsers.toLocaleString()} 
                    icon={<UsersIcon />} 
                    trend="up"
                    trendValue="12.5%"
                    trendLabel="vs last month"
                />
                <StatCard 
                    title="Total Animals" 
                    value={stats.totalAnimals.toLocaleString()} 
                    icon={<AnimalIcon />} 
                    trend="up"
                    trendValue="3.2%"
                    trendLabel="vs last month"
                />
                <StatCard 
                    title="Tickets Sold" 
                    value={stats.totalTickets.toLocaleString()} 
                    icon={<TicketIcon />} 
                    trend="up"
                    trendValue="8.1%"
                    trendLabel="vs last month"
                />
                <StatCard 
                    title="Revenue" 
                    value={`₱${stats.totalRevenue.toLocaleString()}`} 
                    icon={<RevenueIcon />} 
                    trend="up"
                    trendValue="15.3%"
                    trendLabel="vs last month"
                />
            </div>

            {/* Middle Section - Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Weekly Visitors Chart */}
                <div className="lg:col-span-2 bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-white">Weekly Overview</h3>
                            <p className="text-sm text-gray-400">Visitor statistics for this week</p>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-[#8cff65]"></div>
                                <span className="text-gray-400">Visitors</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-[#4ade80]"></div>
                                <span className="text-gray-400">Revenue</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Bar Chart */}
                    <div className="h-48 flex items-end gap-3 mb-4">
                        {weeklyData.map((item, index) => (
                            <div key={index} className="flex-1 flex flex-col items-center gap-2">
                                <div className="w-full flex flex-col items-center gap-1" style={{ height: '160px' }}>
                                    <div 
                                        className="w-full max-w-[40px] bg-gradient-to-t from-[#8cff65] to-[#4ade80] rounded-t-lg transition-all duration-500 hover:opacity-80"
                                        style={{ height: `${(item.visitors / maxVisitors) * 100}%` }}
                                    />
                                </div>
                                <span className="text-xs text-gray-500">{item.day}</span>
                            </div>
                        ))}
                    </div>

                    {/* Summary Stats */}
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[#2a2a2a]">
                        <div>
                            <p className="text-gray-400 text-sm">Total Visitors</p>
                            <p className="text-xl font-bold text-white">1,610</p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm">Avg. per day</p>
                            <p className="text-xl font-bold text-white">230</p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm">Peak Day</p>
                            <p className="text-xl font-bold text-[#8cff65]">Saturday</p>
                        </div>
                    </div>
                </div>

                {/* Ticket Distribution */}
                <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-white">Ticket Types</h3>
                        <button className="text-gray-500 hover:text-white transition">
                            <MoreIcon />
                        </button>
                    </div>
                    
                    <DonutChart data={[]} total={stats.totalTickets} label="Total Tickets" />
                    
                    {/* Legend */}
                    <div className="mt-6 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-[#8cff65]"></div>
                                <span className="text-sm text-gray-300">Adult</span>
                            </div>
                            <span className="text-sm font-medium text-white">45%</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-[#22c55e]"></div>
                                <span className="text-sm text-gray-300">Children</span>
                            </div>
                            <span className="text-sm font-medium text-white">25%</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-[#4ade80]"></div>
                                <span className="text-sm text-gray-300">Senior</span>
                            </div>
                            <span className="text-sm font-medium text-white">20%</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-[#86efac]"></div>
                                <span className="text-sm text-gray-300">Student</span>
                            </div>
                            <span className="text-sm font-medium text-white">10%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Revenue & New Customers Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* New Customers Card */}
                <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                            <UsersIcon />
                        </div>
                        <span className="text-[#8cff65] text-sm font-medium flex items-center gap-1">
                            <TrendUpIcon /> +12%
                        </span>
                    </div>
                    <p className="text-gray-400 text-sm">New Visitors</p>
                    <p className="text-3xl font-bold text-white mb-1">862</p>
                    <p className="text-gray-500 text-sm">Last Week</p>
                </div>

                {/* Total Profit Card */}
                <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-gray-400 text-sm">Total Profit</p>
                        <span className="text-[#8cff65] text-sm font-medium flex items-center gap-1">
                            <TrendUpIcon /> +42%
                        </span>
                    </div>
                    <p className="text-3xl font-bold text-white mb-4">₱{(stats.totalRevenue * 0.3).toLocaleString()}</p>
                    <p className="text-gray-500 text-sm mb-2">Weekly Profit</p>
                    <AreaChart />
                </div>

                {/* Revenue Breakdown */}
                <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Revenue Breakdown</h3>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-400">Ticket Sales</span>
                                <span className="text-white font-medium">₱55,640</span>
                            </div>
                            <div className="h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
                                <div className="h-full w-[65%] bg-[#8cff65] rounded-full"></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-400">Merchandise</span>
                                <span className="text-white font-medium">₱11,420</span>
                            </div>
                            <div className="h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
                                <div className="h-full w-[25%] bg-[#4ade80] rounded-full"></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-400">Food & Beverages</span>
                                <span className="text-white font-medium">₱8,540</span>
                            </div>
                            <div className="h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
                                <div className="h-full w-[18%] bg-[#22c55e] rounded-full"></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-400">Special Events</span>
                                <span className="text-white font-medium">₱2,120</span>
                            </div>
                            <div className="h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
                                <div className="h-full w-[8%] bg-[#86efac] rounded-full"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recently Registered Users */}
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-white">Recently Registered Users</h3>
                        <p className="text-sm text-gray-400">New users who joined this week</p>
                    </div>
                    <Link 
                        to="/admin/users" 
                        className="px-4 py-2 bg-[#8cff65] hover:bg-[#7ae857] text-black font-medium rounded-xl transition-colors"
                    >
                        View All
                    </Link>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left border-b border-[#2a2a2a]">
                                <th className="pb-4 text-sm font-semibold text-gray-400">User</th>
                                <th className="pb-4 text-sm font-semibold text-gray-400">Email</th>
                                <th className="pb-4 text-sm font-semibold text-gray-400">Role</th>
                                <th className="pb-4 text-sm font-semibold text-gray-400">Joined</th>
                                <th className="pb-4 text-sm font-semibold text-gray-400">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2a2a2a]">
                            {recentUsers.map((u) => (
                                <tr key={u.id} className="hover:bg-[#1e1e1e] transition-colors">
                                    <td className="py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-green-400 flex items-center justify-center text-gray-700 font-bold">
                                                {u.fullName?.substring(0, 1).toUpperCase() || 'U'}
                                            </div>
                                            <div>
                                                <p className="font-medium text-white">{u.fullName}</p>
                                                {/* <p className="text-xs text-gray-500">ID: {u.id}</p> */}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 text-gray-300">{u.email}</td>
                                    <td className="py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                                            u.role === 'admin' 
                                                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                                                : u.role === 'staff' 
                                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                                : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                                        }`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="py-4 text-gray-400 text-sm">
                                        {new Date(u.createdAt).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
                                    </td>
                                    <td className="py-4">
                                        <span className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-[#8cff65]"></span>
                                            <span className="text-sm text-gray-400">Active</span>
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