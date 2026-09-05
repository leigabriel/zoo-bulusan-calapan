import { More as MoreIcon, TrendUp as TrendUpIcon, Paw as PawIcon, Leaf as LeafIcon, Ticket as TicketIcon, ChevronRight as ChevronRightIcon } from 'reicon-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { staffAPI } from '../../services/api-client';


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
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-green-300 via-green-400 to-green-500 p-5 shadow-lg shadow-green-400/30 transition-all duration-300 hover:scale-[1.01]">
            <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-white/30 backdrop-blur-sm flex items-center justify-center text-gray-900 border border-white/20">
                    {icon}
                </div>
                    <button className="text-gray-900 hover:text-black transition">
                    <MoreIcon className="w-5 h-5" />
                </button>
            </div>
            <p className="text-gray-900 text-sm mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">{value}</p>
            {trend && (
                <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-sm font-semibold text-gray-900">
                        <TrendUpIcon className="w-4 h-4" />
                        {trendValue}
                    </span>
                    <span className="text-gray-900 text-sm">vs yesterday</span>
                </div>
            )}
        </div>
    );

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
            {/* Welcome Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.firstName || user?.fullName || 'Staff'}!</h1>
                    <p className="text-gray-500">Here's what's happening at the zoo today</p>
                </div>
                {/* QR scanner is available from staff navigation. */}
            </div>

            {/* Stats Grid - Only Total Animals, Total Plants, Total Reservations */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Total Animals"
                    value={stats.activeAnimals}
                    icon={<PawIcon className="w-6 h-6" />}
                    trend={true}
                    trendValue="+3%"
                />
                <StatCard
                    title="Total Plants"
                    value={stats.totalPlants}
                    icon={<LeafIcon className="w-6 h-6" />}
                    trend={true}
                    trendValue="+2%"
                />
                <StatCard
                    title="Total Reservations"
                    value={stats.todayTickets + stats.upcomingEvents}
                    icon={<TicketIcon className="w-6 h-6" />}
                    trend={true}
                    trendValue="+8%"
                />
            </div>

            {/* Activity Summary Card */}
            <div className="bg-white border border-green-200 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Your Activity Summary</h2>
                    <span className="text-xs text-gray-500">Last 7 days</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-green-50 rounded-xl p-4">
                        <p className="text-gray-500 text-sm">Today's Actions</p>
                        <p className="text-2xl font-bold text-green-800">{activitySummary.todayActions}</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4">
                        <p className="text-gray-500 text-sm">This Week</p>
                        <p className="text-2xl font-bold text-gray-900">{activitySummary.weekActions}</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4">
                        <p className="text-gray-500 text-sm">Last Activity</p>
                        <p className="text-sm font-medium text-gray-900 truncate">
                            {activitySummary.lastActivity || 'No recent activity'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Animals & Plants Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Animals Table */}
                <div className="bg-white border border-green-200 rounded-2xl overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b border-green-200">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <PawIcon className="w-6 h-6" />
                            Animals Overview
                        </h2>
                        <Link 
                            to="/staff/animals" 
                            className="text-sm text-green-800 hover:underline flex items-center gap-1"
                        >
                            View All
                            <ChevronRightIcon className="w-4 h-4" strokeWidth="2" />
                        </Link>
                    </div>
                    {recentAnimals.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-green-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Animal</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Species</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-green-200">
                                    {recentAnimals.map((animal, idx) => (
                                        <tr key={animal.id || idx} className="hover:bg-green-50/50 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-green-50 overflow-hidden flex-shrink-0">
                                                        {animal.image_url ? (
                                                            <img src={animal.image_url} alt={animal.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-gray-500">
                                                                <PawIcon className="w-6 h-6" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-gray-900 text-sm font-medium truncate">{animal.name}</p>
                                                        <p className="text-gray-500 text-xs truncate sm:hidden">{animal.species || animal.category || 'Unknown'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 text-sm hidden sm:table-cell">{animal.species || animal.category || 'Unknown'}</td>
                                            <td className="px-4 py-3 hidden md:table-cell">
                                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                                    animal.status === 'active' || animal.status === 'healthy' 
                                                        ? 'bg-green-400/20 text-green-800'
                                                        : animal.status === 'sick' || animal.status === 'treatment'
                                                        ? 'bg-yellow-500/20 text-yellow-700'
                                                        : 'bg-gray-500/20 text-gray-500'
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
                <div className="bg-white border border-green-200 rounded-2xl overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b border-green-200">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <LeafIcon className="w-6 h-6" />
                            Plants Overview
                        </h2>
                        <Link 
                            to="/staff/plants" 
                            className="text-sm text-green-800 hover:underline flex items-center gap-1"
                        >
                            View All
                            <ChevronRightIcon className="w-4 h-4" strokeWidth="2" />
                        </Link>
                    </div>
                    {recentPlants.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-green-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Plant</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Category</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-green-200">
                                    {recentPlants.map((plant, idx) => (
                                        <tr key={plant.id || idx} className="hover:bg-green-50/50 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-green-50 overflow-hidden flex-shrink-0">
                                                        {plant.image_url ? (
                                                            <img src={plant.image_url} alt={plant.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-gray-500">
                                                                <LeafIcon className="w-6 h-6" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-gray-900 text-sm font-medium truncate">{plant.name}</p>
                                                        <p className="text-gray-500 text-xs truncate sm:hidden">{plant.species || plant.category || 'Unknown'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 text-sm hidden sm:table-cell">{plant.species || plant.category || 'Unknown'}</td>
                                            <td className="px-4 py-3 hidden md:table-cell">
                                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                                    plant.status === 'healthy' || plant.status === 'active'
                                                        ? 'bg-green-400/20 text-green-800'
                                                        : plant.status === 'wilting' || plant.status === 'needs_care'
                                                        ? 'bg-yellow-500/20 text-yellow-700'
                                                        : 'bg-gray-500/20 text-gray-500'
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
