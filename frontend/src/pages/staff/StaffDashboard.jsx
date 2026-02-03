import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { staffAPI } from '../../services/api-client';

// Icons
const TicketIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
        <path d="M13 5v2" />
        <path d="M13 17v2" />
        <path d="M13 11v2" />
    </svg>
);

const ClockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
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

const AnimalIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" className="w-6 h-6">
        <path d="M226.5 92.9c14.3 42.9-.3 86.2-32.6 96.8s-70.1-15.6-84.4-58.5s.3-86.2 32.6-96.8s70.1 15.6 84.4 58.5zM100.4 198.6c18.9 32.4 14.3 70.1-10.2 84.1s-59.7-.9-78.5-33.3S-2.7 179.3 21.8 165.3s59.7 .9 78.5 33.3zM69.2 401.2C121.6 259.9 214.7 224 256 224s134.4 35.9 186.8 177.2c3.6 9.7 5.2 20.1 5.2 30.5v1.6c0 25.8-20.9 46.7-46.7 46.7c-11.5 0-22.9-1.4-34-4.2l-88-22c-15.3-3.8-31.3-3.8-46.6 0l-88 22c-11.1 2.8-22.5 4.2-34 4.2C84.9 480 64 459.1 64 433.3v-1.6c0-10.4 1.6-20.8 5.2-30.5zM421.8 282.7c-24.5-14-29.1-51.7-10.2-84.1s54-47.3 78.5-33.3s29.1 51.7 10.2 84.1s-54 47.3-78.5 33.3zM310.1 189.7c-32.3-10.6-46.9-53.9-32.6-96.8s52.1-69.1 84.4-58.5s46.9 53.9 32.6 96.8s-52.1 69.1-84.4 58.5z" />
    </svg>
);

const ScannerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M3 7V5a2 2 0 0 1 2-2h2" />
        <path d="M17 3h2a2 2 0 0 1 2 2v2" />
        <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
        <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
        <rect x="7" y="7" width="10" height="10" rx="1" />
    </svg>
);

const CalendarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
);

const TrendUpIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
    </svg>
);

const MoreIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <circle cx="12" cy="12" r="1" />
        <circle cx="12" cy="5" r="1" />
        <circle cx="12" cy="19" r="1" />
    </svg>
);

const StaffDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        todayTickets: 0,
        pendingValidations: 0,
        todayVisitors: 0,
        activeAnimals: 0,
        upcomingEvents: 0
    });
    const [recentTickets, setRecentTickets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [statsRes, ticketsRes] = await Promise.all([
                staffAPI.getDashboardStats(),
                staffAPI.getRecentTickets ? staffAPI.getRecentTickets() : Promise.resolve({ success: true, data: [] })
            ]);
            if (statsRes.success) setStats(statsRes.data);
            if (ticketsRes.success) setRecentTickets(ticketsRes.data || []);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Stat Card Component - matching admin design
    const StatCard = ({ title, value, icon, trend, trendValue }) => (
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
            {trend && (
                <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-sm font-medium text-[#8cff65]">
                        <TrendUpIcon />
                        {trendValue}
                    </span>
                    <span className="text-gray-500 text-sm">vs yesterday</span>
                </div>
            )}
        </div>
    );

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
            {/* Welcome Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Welcome back, {user?.firstName || user?.fullName || 'Staff'}!</h1>
                    <p className="text-gray-400">Here's what's happening at the zoo today</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        to="/staff/scanner"
                        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#8cff65] to-[#4ade80] text-[#0a0a0a] font-semibold rounded-xl hover:from-[#9dff7a] hover:to-[#5ceb91] transition-all shadow-lg shadow-[#8cff65]/20"
                    >
                        <ScannerIcon />
                        Scan Ticket
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Today's Tickets"
                    value={stats.todayTickets}
                    icon={<TicketIcon />}
                    trend={true}
                    trendValue="+12%"
                />
                <StatCard
                    title="Pending Validations"
                    value={stats.pendingValidations}
                    icon={<ClockIcon />}
                />
                <StatCard
                    title="Today's Visitors"
                    value={stats.todayVisitors}
                    icon={<UsersIcon />}
                    trend={true}
                    trendValue="+8%"
                />
                <StatCard
                    title="Active Animals"
                    value={stats.activeAnimals}
                    icon={<AnimalIcon />}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Quick Actions */}
                <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <Link
                            to="/staff/scanner"
                            className="p-4 bg-[#8cff65]/10 border border-[#8cff65]/30 rounded-xl text-center hover:bg-[#8cff65]/20 transition flex flex-col items-center"
                        >
                            <div className="text-[#8cff65] mb-2"><ScannerIcon /></div>
                            <p className="font-medium text-[#8cff65]">Scan Ticket</p>
                        </Link>
                        <Link
                            to="/staff/tickets"
                            className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl text-center hover:bg-blue-500/20 transition flex flex-col items-center"
                        >
                            <div className="text-blue-400 mb-2"><TicketIcon /></div>
                            <p className="font-medium text-blue-400">View Tickets</p>
                        </Link>
                        <Link
                            to="/staff/animals"
                            className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-center hover:bg-yellow-500/20 transition flex flex-col items-center"
                        >
                            <div className="text-yellow-400 mb-2"><AnimalIcon /></div>
                            <p className="font-medium text-yellow-400">Manage Animals</p>
                        </Link>
                        <Link
                            to="/staff/events"
                            className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl text-center hover:bg-purple-500/20 transition flex flex-col items-center"
                        >
                            <div className="text-purple-400 mb-2"><CalendarIcon /></div>
                            <p className="font-medium text-purple-400">Manage Events</p>
                        </Link>
                    </div>
                </div>

                {/* Recent Tickets */}
                <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-white">Recent Tickets</h3>
                        <Link to="/staff/tickets" className="text-[#8cff65] text-sm hover:underline">View all</Link>
                    </div>
                    <div className="space-y-3">
                        {recentTickets.length > 0 ? (
                            recentTickets.slice(0, 5).map(ticket => (
                                <div key={ticket.id} className="flex items-center justify-between p-3 bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl">
                                    <div>
                                        <p className="font-medium text-white font-mono">#{ticket.booking_reference || ticket.ticketCode}</p>
                                        <p className="text-sm text-gray-400">{ticket.user_name || ticket.visitorName}</p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${ticket.status === 'used' || ticket.status === 'validated'
                                            ? 'bg-[#8cff65]/20 text-[#8cff65] border-[#8cff65]/30'
                                            : ticket.status === 'pending' || ticket.status === 'confirmed'
                                                ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                                                : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                                        }`}>
                                        {ticket.status}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-gray-500 py-8">
                                <div className="flex justify-center mb-2"><TicketIcon /></div>
                                <p>No recent tickets</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Today's Schedule */}
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Today's Schedule</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-4 p-4 bg-[#8cff65]/10 border border-[#8cff65]/30 rounded-xl">
                        <div className="w-3 h-3 bg-[#8cff65] rounded-full animate-pulse"></div>
                        <div className="flex-1">
                            <p className="font-medium text-white">Morning Shift - Gate Duty</p>
                            <p className="text-sm text-gray-400">8:00 AM - 12:00 PM</p>
                        </div>
                        <span className="text-[#8cff65] text-sm font-medium px-3 py-1 bg-[#8cff65]/20 rounded-full">Active</span>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl">
                        <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                        <div className="flex-1">
                            <p className="font-medium text-white">Afternoon Shift - Ticket Booth</p>
                            <p className="text-sm text-gray-400">1:00 PM - 5:00 PM</p>
                        </div>
                        <span className="text-gray-400 text-sm font-medium">Upcoming</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StaffDashboard;