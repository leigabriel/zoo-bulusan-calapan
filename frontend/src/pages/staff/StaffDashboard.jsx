import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { staffAPI } from '../../services/api-client';

const TicketIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
        <path d="M13 5v2"/>
        <path d="M13 17v2"/>
        <path d="M13 11v2"/>
    </svg>
);

const ClockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
    </svg>
);

const UsersIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
);

const AnimalIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <circle cx="11" cy="4" r="2"/>
        <circle cx="18" cy="8" r="2"/>
        <circle cx="20" cy="16" r="2"/>
        <path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/>
    </svg>
);

const ScannerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
        <path d="M17 3h2a2 2 0 0 1 2 2v2"/>
        <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
        <path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
        <rect x="7" y="7" width="10" height="10" rx="1"/>
    </svg>
);

const PawIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <circle cx="11" cy="4" r="2"/>
        <circle cx="18" cy="8" r="2"/>
        <circle cx="20" cy="16" r="2"/>
        <path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/>
    </svg>
);

const CalendarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
);

const StaffDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        todayTickets: 0,
        pendingValidations: 0,
        todayVisitors: 0,
        activeAnimals: 0
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
                staffAPI.getRecentTickets()
            ]);
            if (statsRes.success) setStats(statsRes.data);
            if (ticketsRes.success) setRecentTickets(ticketsRes.data);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const StatCard = ({ title, value, icon, color, link }) => (
        <Link to={link || '#'} className={`bg-white p-6 rounded-2xl shadow-sm border-l-4 ${color} hover:shadow-md transition`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-500 text-sm">{title}</p>
                    <p className="text-3xl font-bold text-gray-800">{value}</p>
                </div>
                <div className={`${color.replace('border-', 'text-')}`}>{icon}</div>
            </div>
        </Link>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Staff Dashboard</h1>
                <p className="text-gray-500">Welcome back, {user?.fullName}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Today's Tickets" 
                    value={stats.todayTickets} 
                    icon={<TicketIcon />} 
                    color="border-blue-500"
                    link="/staff/tickets"
                />
                <StatCard 
                    title="Pending Validations" 
                    value={stats.pendingValidations} 
                    icon={<ClockIcon />} 
                    color="border-yellow-500"
                    link="/staff/scanner"
                />
                <StatCard 
                    title="Today's Visitors" 
                    value={stats.todayVisitors} 
                    icon={<UsersIcon />} 
                    color="border-green-500"
                />
                <StatCard 
                    title="Active Animals" 
                    value={stats.activeAnimals} 
                    icon={<AnimalIcon />} 
                    color="border-purple-500"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-800">Quick Actions</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Link 
                            to="/staff/scanner" 
                            className="p-4 bg-green-50 rounded-xl text-center hover:bg-green-100 transition flex flex-col items-center"
                        >
                            <div className="text-green-600 mb-2"><ScannerIcon /></div>
                            <p className="font-medium text-green-700">Scan Ticket</p>
                        </Link>
                        <Link 
                            to="/staff/tickets" 
                            className="p-4 bg-blue-50 rounded-xl text-center hover:bg-blue-100 transition flex flex-col items-center"
                        >
                            <div className="text-blue-600 mb-2"><TicketIcon /></div>
                            <p className="font-medium text-blue-700">View Tickets</p>
                        </Link>
                        <Link 
                            to="/staff/animals" 
                            className="p-4 bg-yellow-50 rounded-xl text-center hover:bg-yellow-100 transition flex flex-col items-center"
                        >
                            <div className="text-yellow-600 mb-2"><PawIcon /></div>
                            <p className="font-medium text-yellow-700">Animal List</p>
                        </Link>
                        <Link 
                            to="/staff/schedule" 
                            className="p-4 bg-purple-50 rounded-xl text-center hover:bg-purple-100 transition flex flex-col items-center"
                        >
                            <div className="text-purple-600 mb-2"><CalendarIcon /></div>
                            <p className="font-medium text-purple-700">My Schedule</p>
                        </Link>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-800">Recent Tickets</h3>
                        <Link to="/staff/tickets" className="text-green-600 text-sm hover:underline">View all</Link>
                    </div>
                    <div className="space-y-3">
                        {recentTickets.length > 0 ? (
                            recentTickets.map(ticket => (
                                <div key={ticket.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                    <div>
                                        <p className="font-medium text-gray-800">#{ticket.ticketCode}</p>
                                        <p className="text-sm text-gray-500">{ticket.visitorName}</p>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        ticket.status === 'validated' ? 'bg-green-100 text-green-700' :
                                        ticket.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-gray-100 text-gray-700'
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

            <div className="bg-white p-6 rounded-2xl shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Today's Schedule</h3>
                <div className="space-y-3">
                    <div className="flex items-center gap-4 p-3 bg-green-50 rounded-xl">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div className="flex-1">
                            <p className="font-medium text-gray-800">Morning Shift - Gate Duty</p>
                            <p className="text-sm text-gray-500">8:00 AM - 12:00 PM</p>
                        </div>
                        <span className="text-green-600 text-sm font-medium">Active</span>
                    </div>
                    <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                        <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                        <div className="flex-1">
                            <p className="font-medium text-gray-800">Afternoon Shift - Ticket Booth</p>
                            <p className="text-sm text-gray-500">1:00 PM - 5:00 PM</p>
                        </div>
                        <span className="text-gray-500 text-sm">Upcoming</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StaffDashboard;
