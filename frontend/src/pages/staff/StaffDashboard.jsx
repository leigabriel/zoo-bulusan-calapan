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

const PlantIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M12 22c-4.97 0-9-4.03-9-9 0-3.92 2.51-7.26 6-8.48V2h6v2.52c3.49 1.22 6 4.56 6 8.48 0 4.97-4.03 9-9 9zm-1-4.5v-4.09c-1.18-.45-2-1.59-2-2.91 0-1.66 1.34-3 3-3s3 1.34 3 3c0 1.32-.82 2.46-2 2.91v4.09c2.28-.46 4-2.48 4-4.91 0-2.76-2.24-5-5-5s-5 2.24-5 5c0 2.43 1.72 4.45 4 4.91z" />
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
        totalPlants: 0,
        upcomingEvents: 0
    });
    const [recentTickets, setRecentTickets] = useState([]);
    const [recentAnimals, setRecentAnimals] = useState([]);
    const [recentPlants, setRecentPlants] = useState([]);
    const [activitySummary, setActivitySummary] = useState({
        todayActions: 0,
        weekActions: 0,
        lastActivity: null
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            const [
                statsRes,
                ticketsRes,
                animalsRes,
                plantsRes
            ] = await Promise.all([
                staffAPI.getDashboardStats().catch(() => null),
                staffAPI.getRecentTickets
                    ? staffAPI.getRecentTickets().catch(() => null)
                    : Promise.resolve({ success: true, data: [] }),
                staffAPI.getAnimals?.().catch(() => null),
                staffAPI.getPlants?.().catch(() => null)
            ]);

            let updatedStats = {
                todayTickets: 0,
                pendingValidations: 0,
                todayVisitors: 0,
                activeAnimals: 0,
                totalPlants: 0,
                upcomingEvents: 0
            };

            if (statsRes?.success) {
                const d = statsRes.data || statsRes.stats || statsRes;

                updatedStats.todayTickets = Number(
                    d.todayTickets ?? d.today_tickets ?? d.ticketsToday
                ) || 0;

                updatedStats.pendingValidations = Number(
                    d.pendingValidations ?? d.pending_validations ?? d.pendingCount
                ) || 0;

                updatedStats.todayVisitors = Number(
                    d.todayVisitors ?? d.today_visitors ?? d.visitorsToday
                ) || 0;

                updatedStats.activeAnimals = Number(
                    d.activeAnimals ?? d.active_animals ?? d.animalsCount
                ) || 0;

                updatedStats.totalPlants = Number(
                    d.totalPlants ?? d.total_plants ?? d.plantsCount
                ) || 0;

                updatedStats.upcomingEvents = Number(
                    d.upcomingEvents ?? d.upcoming_events ?? d.eventsCount
                ) || 0;
            }

            // Always populate animals preview if data is available
            if (animalsRes?.success && Array.isArray(animalsRes.animals || animalsRes.data)) {
                const animalsArray = animalsRes.animals || animalsRes.data;
                // Update stats count if not already set from dashboard stats
                if (!updatedStats.activeAnimals || updatedStats.activeAnimals === 0) {
                    updatedStats.activeAnimals = animalsArray.length;
                }
                // Get 4 most recent animals for preview
                setRecentAnimals(animalsArray.slice(0, 4));
            }

            // Always populate plants preview if data is available
            if (plantsRes?.success && Array.isArray(plantsRes.plants || plantsRes.data)) {
                const plantsArray = plantsRes.plants || plantsRes.data;
                // Update stats count if not already set from dashboard stats
                if (!updatedStats.totalPlants || updatedStats.totalPlants === 0) {
                    updatedStats.totalPlants = plantsArray.length;
                }
                // Get 4 most recent plants for preview
                setRecentPlants(plantsArray.slice(0, 4));
            }

            if (ticketsRes?.success) {
                setRecentTickets(ticketsRes.data || ticketsRes.tickets || []);
            }

            // Fetch activity summary for this staff member
            try {
                const activityRes = await staffAPI.getMyActivitySummary?.().catch(() => null);
                if (activityRes?.success) {
                    setActivitySummary({
                        todayActions: activityRes.todayActions || 0,
                        weekActions: activityRes.weekActions || 0,
                        lastActivity: activityRes.lastActivity || null
                    });
                }
            } catch (activityErr) {
                console.error('Error fetching activity summary:', activityErr);
            }

            setStats(updatedStats);

        } catch (error) {
            console.error('Dashboard fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    // Stat Card Component - matching admin design
    const StatCard = ({ title, value, icon, trend, trendValue }) => (
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-500 via-emerald-700 to-emerald-900 p-5 shadow-lg shadow-emerald-900/30 transition-all duration-300 hover:scale-[1.01]">
            <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-white border border-white/20">
                    {icon}
                </div>
                <button className="text-emerald-100/80 hover:text-white transition">
                    <MoreIcon />
                </button>
            </div>
            <p className="text-emerald-50/85 text-sm mb-1">{title}</p>
            <p className="text-3xl font-bold text-white mb-2 tracking-tight">{value}</p>
            {trend && (
                <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-sm font-semibold text-emerald-100">
                        <TrendUpIcon />
                        {trendValue}
                    </span>
                    <span className="text-emerald-50/80 text-sm">vs yesterday</span>
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
            </div>

            {/* Stats Grid - Only Total Animals, Total Plants, Total Reservations */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Total Animals"
                    value={stats.activeAnimals}
                    icon={<AnimalIcon />}
                    trend={true}
                    trendValue="+3%"
                />
                <StatCard
                    title="Total Plants"
                    value={stats.totalPlants}
                    icon={<PlantIcon />}
                    trend={true}
                    trendValue="+2%"
                />
                <StatCard
                    title="Total Reservations"
                    value={stats.todayTickets + stats.upcomingEvents}
                    icon={<TicketIcon />}
                    trend={true}
                    trendValue="+8%"
                />
            </div>

            {/* Activity Summary Card */}
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white">Your Activity Summary</h2>
                    <span className="text-xs text-gray-500">Last 7 days</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-[#1a1a1a] rounded-xl p-4">
                        <p className="text-gray-400 text-sm">Today's Actions</p>
                        <p className="text-2xl font-bold text-[#8cff65]">{activitySummary.todayActions}</p>
                    </div>
                    <div className="bg-[#1a1a1a] rounded-xl p-4">
                        <p className="text-gray-400 text-sm">This Week</p>
                        <p className="text-2xl font-bold text-white">{activitySummary.weekActions}</p>
                    </div>
                    <div className="bg-[#1a1a1a] rounded-xl p-4">
                        <p className="text-gray-400 text-sm">Last Activity</p>
                        <p className="text-sm font-medium text-white truncate">
                            {activitySummary.lastActivity || 'No recent activity'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Animals & Plants Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Animals Table */}
                <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b border-[#2a2a2a]">
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            <AnimalIcon />
                            Animals Overview
                        </h2>
                        <Link 
                            to="/staff/animals" 
                            className="text-sm text-[#8cff65] hover:underline flex items-center gap-1"
                        >
                            View All
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>
                    {recentAnimals.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-[#1a1a1a]">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Animal</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Species</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#2a2a2a]">
                                    {recentAnimals.map((animal, idx) => (
                                        <tr key={animal.id || idx} className="hover:bg-[#1e1e1e]/50 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-[#2a2a2a] overflow-hidden flex-shrink-0">
                                                        {animal.image_url ? (
                                                            <img src={animal.image_url} alt={animal.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-gray-500">
                                                                <AnimalIcon />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-white text-sm font-medium truncate">{animal.name}</p>
                                                        <p className="text-gray-500 text-xs truncate sm:hidden">{animal.species || animal.category || 'Unknown'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-400 text-sm hidden sm:table-cell">{animal.species || animal.category || 'Unknown'}</td>
                                            <td className="px-4 py-3 hidden md:table-cell">
                                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                                    animal.status === 'active' || animal.status === 'healthy' 
                                                        ? 'bg-[#8cff65]/20 text-[#8cff65]' 
                                                        : animal.status === 'sick' || animal.status === 'treatment'
                                                        ? 'bg-yellow-500/20 text-yellow-400'
                                                        : 'bg-gray-500/20 text-gray-400'
                                                }`}>
                                                    {animal.status || 'Active'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-8 text-center text-gray-500">No animals to display</div>
                    )}
                </div>

                {/* Plants Table */}
                <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b border-[#2a2a2a]">
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            <PlantIcon />
                            Plants Overview
                        </h2>
                        <Link 
                            to="/staff/plants" 
                            className="text-sm text-[#8cff65] hover:underline flex items-center gap-1"
                        >
                            View All
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>
                    {recentPlants.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-[#1a1a1a]">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Plant</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Category</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#2a2a2a]">
                                    {recentPlants.map((plant, idx) => (
                                        <tr key={plant.id || idx} className="hover:bg-[#1e1e1e]/50 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-[#2a2a2a] overflow-hidden flex-shrink-0">
                                                        {plant.image_url ? (
                                                            <img src={plant.image_url} alt={plant.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-gray-500">
                                                                <PlantIcon />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-white text-sm font-medium truncate">{plant.name}</p>
                                                        <p className="text-gray-500 text-xs truncate sm:hidden">{plant.species || plant.category || 'Unknown'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-400 text-sm hidden sm:table-cell">{plant.species || plant.category || 'Unknown'}</td>
                                            <td className="px-4 py-3 hidden md:table-cell">
                                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                                    plant.status === 'healthy' || plant.status === 'active'
                                                        ? 'bg-[#8cff65]/20 text-[#8cff65]' 
                                                        : plant.status === 'wilting' || plant.status === 'needs_care'
                                                        ? 'bg-yellow-500/20 text-yellow-400'
                                                        : 'bg-gray-500/20 text-gray-400'
                                                }`}>
                                                    {plant.status || 'Healthy'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-8 text-center text-gray-500">No plants to display</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StaffDashboard;
