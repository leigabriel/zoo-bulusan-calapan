import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api-client';
import Chart from 'react-apexcharts';

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

const Analytics = () => {
    const [timeRange, setTimeRange] = useState('week');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalAnimals: 0,
        totalTickets: 0,
        totalRevenue: 0,
        todayTickets: 0,
        todayRevenue: 0,
        ticketGrowth: 0,
        revenueGrowth: 0,
        upcomingEvents: 0,
    });
    const [weeklyData, setWeeklyData] = useState([]);
    const [monthlyData, setMonthlyData] = useState([]);
    const [ticketDistribution, setTicketDistribution] = useState([]);

    useEffect(() => {
        const loadAnalytics = async () => {
            setLoading(true);
            try {
                const response = await adminAPI.getAnalytics(timeRange);
                
                if (response.success && response.data) {
                    const { summary, weeklyData: weekly, monthlyData: monthly, ticketDistribution: distribution } = response.data;
                    
                    setStats({
                        totalUsers: summary.totalUsers || 0,
                        totalAnimals: summary.totalAnimals || 0,
                        totalTickets: summary.totalTickets || 0,
                        totalRevenue: summary.totalRevenue || 0,
                        todayTickets: summary.todayTickets || 0,
                        todayRevenue: summary.todayRevenue || 0,
                        ticketGrowth: summary.ticketGrowth || 0,
                        revenueGrowth: summary.revenueGrowth || 0,
                        upcomingEvents: summary.upcomingEvents || 0,
                    });
                    
                    // Fill missing days with empty data for consistent display
                    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                    const filledWeekly = days.map(day => {
                        const found = weekly?.find(d => d.day === day);
                        return found || { day, tickets: 0, visitors: 0, revenue: 0 };
                    });
                    setWeeklyData(filledWeekly);
                    
                    setMonthlyData(monthly || []);
                    setTicketDistribution(distribution || []);
                }
            } catch (error) {
                console.error('Error loading analytics:', error);
                // Set fallback empty data
                setWeeklyData([
                    { day: 'Mon', tickets: 0, visitors: 0, revenue: 0 },
                    { day: 'Tue', tickets: 0, visitors: 0, revenue: 0 },
                    { day: 'Wed', tickets: 0, visitors: 0, revenue: 0 },
                    { day: 'Thu', tickets: 0, visitors: 0, revenue: 0 },
                    { day: 'Fri', tickets: 0, visitors: 0, revenue: 0 },
                    { day: 'Sat', tickets: 0, visitors: 0, revenue: 0 },
                    { day: 'Sun', tickets: 0, visitors: 0, revenue: 0 },
                ]);
            } finally {
                setLoading(false);
            }
        };
        loadAnalytics();
    }, [timeRange]);

    // Weekly Ticket Sales Chart Configuration (Interactive Bar Chart)
    const weeklyChartOptions = {
        chart: {
            type: 'bar',
            toolbar: { show: false },
            background: 'transparent',
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 800,
            },
        },
        plotOptions: {
            bar: {
                borderRadius: 8,
                columnWidth: '60%',
                distributed: false,
            }
        },
        dataLabels: { enabled: false },
        colors: ['#8cff65'],
        xaxis: {
            categories: weeklyData.map(d => d.day),
            labels: { style: { colors: '#9ca3af', fontSize: '12px' } },
            axisBorder: { show: false },
            axisTicks: { show: false },
        },
        yaxis: {
            labels: { style: { colors: '#9ca3af', fontSize: '12px' } },
        },
        grid: {
            borderColor: '#2a2a2a',
            strokeDashArray: 4,
        },
        tooltip: {
            enabled: true,
            theme: 'dark',
            y: {
                formatter: (val) => `${val} tickets`,
            },
            custom: function({ series, seriesIndex, dataPointIndex, w }) {
                const data = weeklyData[dataPointIndex];
                return `
                    <div style="background: #1e1e1e; border: 1px solid #3a3a3a; border-radius: 8px; padding: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
                        <div style="color: #8cff65; font-weight: bold; font-size: 14px;">${data?.day || 'N/A'}</div>
                        <div style="color: white; margin-top: 4px;">Tickets: <span style="font-weight: 600;">${data?.tickets || 0}</span></div>
                        <div style="color: #9ca3af;">Revenue: <span style="color: #8cff65;">₱${data?.revenue?.toLocaleString() || 0}</span></div>
                    </div>
                `;
            }
        },
        states: {
            hover: {
                filter: {
                    type: 'lighten',
                    value: 0.15,
                }
            }
        }
    };

    const weeklyChartSeries = [{
        name: 'Tickets',
        data: weeklyData.map(d => d.tickets)
    }];

    // Monthly Revenue Chart Configuration (Interactive Line/Area Chart)
    const monthlyChartOptions = {
        chart: {
            type: 'area',
            toolbar: { show: false },
            background: 'transparent',
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 800,
            },
            zoom: { enabled: false }
        },
        stroke: {
            curve: 'smooth',
            width: 3,
        },
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.45,
                opacityTo: 0.05,
                stops: [0, 100]
            }
        },
        colors: ['#a855f7'],
        dataLabels: { enabled: false },
        xaxis: {
            categories: monthlyData.map(d => d.month?.substring(0, 3) || 'N/A'),
            labels: { style: { colors: '#9ca3af', fontSize: '12px' } },
            axisBorder: { show: false },
            axisTicks: { show: false },
        },
        yaxis: {
            labels: {
                style: { colors: '#9ca3af', fontSize: '12px' },
                formatter: (val) => `₱${(val / 1000).toFixed(0)}K`
            },
        },
        grid: {
            borderColor: '#2a2a2a',
            strokeDashArray: 4,
        },
        tooltip: {
            enabled: true,
            theme: 'dark',
            y: {
                formatter: (val) => `₱${val?.toLocaleString() || 0}`,
            },
            custom: function({ series, seriesIndex, dataPointIndex, w }) {
                const data = monthlyData[dataPointIndex];
                return `
                    <div style="background: #1e1e1e; border: 1px solid #3a3a3a; border-radius: 8px; padding: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
                        <div style="color: #a855f7; font-weight: bold; font-size: 14px;">${data?.month || 'N/A'}</div>
                        <div style="color: white; margin-top: 4px;">Revenue: <span style="color: #a855f7; font-weight: 600;">₱${data?.revenue?.toLocaleString() || 0}</span></div>
                        <div style="color: #9ca3af;">Tickets: ${data?.tickets || 0}</div>
                    </div>
                `;
            }
        },
        markers: {
            size: 5,
            colors: ['#a855f7'],
            strokeColors: '#1e1e1e',
            strokeWidth: 2,
            hover: {
                size: 8,
            }
        }
    };

    const monthlyChartSeries = [{
        name: 'Revenue',
        data: monthlyData.map(d => d.revenue || 0)
    }];

    // Ticket Distribution Donut Chart Configuration
    const distributionChartOptions = {
        chart: {
            type: 'donut',
            background: 'transparent',
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 800,
            },
        },
        labels: ticketDistribution.map(d => d.type || 'Unknown'),
        colors: ['#8cff65', '#60a5fa', '#a855f7', '#fbbf24', '#f87171'],
        legend: {
            position: 'bottom',
            labels: { colors: '#9ca3af' },
            markers: { strokeWidth: 0 }
        },
        dataLabels: {
            enabled: true,
            style: {
                fontSize: '14px',
                fontWeight: 'bold',
            },
            dropShadow: { enabled: false }
        },
        plotOptions: {
            pie: {
                donut: {
                    size: '65%',
                    labels: {
                        show: true,
                        name: {
                            show: true,
                            color: '#9ca3af',
                        },
                        value: {
                            show: true,
                            color: '#ffffff',
                            fontSize: '20px',
                            fontWeight: 'bold',
                        },
                        total: {
                            show: true,
                            label: 'Total',
                            color: '#9ca3af',
                            formatter: function (w) {
                                return w.globals.seriesTotals.reduce((a, b) => a + b, 0);
                            }
                        }
                    }
                }
            }
        },
        tooltip: {
            enabled: true,
            theme: 'dark',
            y: {
                formatter: (val) => `${val} tickets`,
            }
        },
        stroke: {
            show: false
        }
    };

    const distributionChartSeries = ticketDistribution.map(d => d.count || 0);

    // Calculate total for ticket distribution percentage
    const totalDistribution = ticketDistribution.reduce((acc, d) => acc + (d.count || 0), 0);

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
                <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-5 hover:border-[#3a3a3a] transition-all cursor-pointer group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                            <UsersIcon />
                        </div>
                    </div>
                    <h3 className="text-3xl font-bold text-white">{stats.totalUsers.toLocaleString()}</h3>
                    <p className="text-gray-500 text-sm mt-1">Total Users</p>
                </div>

                {/* Tickets Sold */}
                <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-5 hover:border-[#3a3a3a] transition-all cursor-pointer group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-[#8cff65]/10 rounded-xl flex items-center justify-center text-[#8cff65] group-hover:scale-110 transition-transform">
                            <TicketIcon />
                        </div>
                        <span className={`flex items-center gap-1 text-sm font-medium ${stats.ticketGrowth >= 0 ? 'text-[#8cff65]' : 'text-red-400'}`}>
                            {stats.ticketGrowth >= 0 ? <TrendUpIcon /> : <TrendDownIcon />}
                            {Math.abs(stats.ticketGrowth)}%
                        </span>
                    </div>
                    <h3 className="text-3xl font-bold text-white">{stats.totalTickets.toLocaleString()}</h3>
                    <p className="text-gray-500 text-sm mt-1">Tickets Sold</p>
                    <p className="text-gray-400 text-xs mt-2">{stats.todayTickets} today</p>
                </div>

                {/* Revenue */}
                <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-5 hover:border-[#3a3a3a] transition-all cursor-pointer group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                            <RevenueIcon />
                        </div>
                        <span className={`flex items-center gap-1 text-sm font-medium ${stats.revenueGrowth >= 0 ? 'text-[#8cff65]' : 'text-red-400'}`}>
                            {stats.revenueGrowth >= 0 ? <TrendUpIcon /> : <TrendDownIcon />}
                            {Math.abs(stats.revenueGrowth)}%
                        </span>
                    </div>
                    <h3 className="text-3xl font-bold text-white">₱{stats.totalRevenue.toLocaleString()}</h3>
                    <p className="text-gray-500 text-sm mt-1">Total Revenue</p>
                    <p className="text-gray-400 text-xs mt-2">₱{stats.todayRevenue.toLocaleString()} today</p>
                </div>

                {/* Upcoming Events */}
                <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-5 hover:border-[#3a3a3a] transition-all cursor-pointer group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center text-yellow-400 group-hover:scale-110 transition-transform">
                            <EventsIcon />
                        </div>
                    </div>
                    <h3 className="text-3xl font-bold text-white">{stats.upcomingEvents}</h3>
                    <p className="text-gray-500 text-sm mt-1">Upcoming Events</p>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Weekly Ticket Sales Chart */}
                <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6 hover:border-[#3a3a3a] transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-white">Weekly Ticket Sales</h3>
                            <p className="text-sm text-gray-500">Tickets sold per day this week</p>
                        </div>
                    </div>
                    <div className="h-64">
                        <Chart
                            options={weeklyChartOptions}
                            series={weeklyChartSeries}
                            type="bar"
                            height="100%"
                        />
                    </div>
                </div>

                {/* Revenue Trend Chart */}
                <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6 hover:border-[#3a3a3a] transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-white">Revenue Trend</h3>
                            <p className="text-sm text-gray-500">Monthly revenue overview</p>
                        </div>
                    </div>
                    <div className="h-64">
                        {monthlyData.length > 0 ? (
                            <Chart
                                options={monthlyChartOptions}
                                series={monthlyChartSeries}
                                type="area"
                                height="100%"
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500">
                                No monthly data available
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Ticket Types Distribution - Donut Chart */}
                <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6 hover:border-[#3a3a3a] transition-all">
                    <h3 className="text-lg font-bold text-white mb-4">Ticket Distribution</h3>
                    {ticketDistribution.length > 0 ? (
                        <div className="h-64">
                            <Chart
                                options={distributionChartOptions}
                                series={distributionChartSeries}
                                type="donut"
                                height="100%"
                            />
                        </div>
                    ) : (
                        <div className="h-64 flex flex-col items-center justify-center text-gray-500">
                            <TicketIcon />
                            <span className="mt-2">No ticket data available</span>
                        </div>
                    )}
                </div>

                {/* Ticket Types List */}
                <div className="lg:col-span-2 bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6 hover:border-[#3a3a3a] transition-all">
                    <h3 className="text-lg font-bold text-white mb-6">Ticket Types Breakdown</h3>
                    {ticketDistribution.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-[#2a2a2a]">
                                        <th className="pb-3">Type</th>
                                        <th className="pb-3 text-right">Count</th>
                                        <th className="pb-3 text-right">Revenue</th>
                                        <th className="pb-3 text-right">Share</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#2a2a2a]">
                                    {ticketDistribution.map((ticket, index) => {
                                        const colors = ['#8cff65', '#60a5fa', '#a855f7', '#fbbf24', '#f87171'];
                                        const percentage = totalDistribution > 0 
                                            ? ((ticket.count / totalDistribution) * 100).toFixed(1) 
                                            : 0;
                                        return (
                                            <tr key={index} className="hover:bg-[#1e1e1e]/50 transition-colors">
                                                <td className="py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div 
                                                            className="w-3 h-3 rounded-full"
                                                            style={{ backgroundColor: colors[index % colors.length] }}
                                                        />
                                                        <span className="text-white font-medium capitalize">
                                                            {ticket.type || 'Unknown'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-4 text-right text-gray-300">{ticket.count}</td>
                                                <td className="py-4 text-right text-white font-medium">
                                                    ₱{(ticket.revenue || 0).toLocaleString()}
                                                </td>
                                                <td className="py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <div className="w-16 bg-[#1e1e1e] rounded-full h-2">
                                                            <div
                                                                className="h-full rounded-full transition-all duration-500"
                                                                style={{ 
                                                                    width: `${percentage}%`,
                                                                    backgroundColor: colors[index % colors.length]
                                                                }}
                                                            />
                                                        </div>
                                                        <span className="text-gray-400 text-sm w-12 text-right">
                                                            {percentage}%
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-48 text-gray-500">
                            No ticket distribution data available
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Analytics;
