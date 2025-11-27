import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api-client';
import AnimalAnalytics from './AnimalAnalytics';

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
        <line x1="12" y1="1" x2="12" y2="23"/>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
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

const ChartIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
);

const AdminDashboard = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalAnimals: 0,
        totalTickets: 0,
        totalRevenue: 0
    });
    const [recentUsers, setRecentUsers] = useState([]);
    const [animals, setAnimals] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            // Use api-client names and response shapes
            const [statsRes, usersRes, animalsRes] = await Promise.all([
                adminAPI.getDashboard(), // returns { success, stats }
                adminAPI.getUsers(),     // returns { success, users }
                adminAPI.getAnimals()    // returns { success, animals }
            ]);

            if (statsRes && statsRes.success) {
                // ensure numeric defaults and safe access
                const s = statsRes.stats || {};
                setStats({
                    totalUsers: Number(s.totalUsers || 0),
                    totalAnimals: Number(s.totalAnimals || 0),
                    totalTickets: Number(s.totalTickets || 0),
                    totalRevenue: Number(s.totalRevenue || 0)
                });
            }

            if (usersRes && usersRes.success) {
                // normalize user shape (backend may return snake_case fields)
                const normalized = (usersRes.users || []).map(u => ({
                    id: u.id || u.user_id,
                    firstName: u.firstName || u.first_name || '',
                    lastName: u.lastName || u.last_name || '',
                    fullName: u.fullName || `${u.firstName || u.first_name || ''} ${u.lastName || u.last_name || ''}`.trim(),
                    email: u.email,
                    role: u.role,
                    createdAt: u.createdAt || u.created_at
                }));
                setRecentUsers(normalized.slice(0, 5));
            }

            if (animalsRes && animalsRes.success) setAnimals(animalsRes.animals || (animalsRes.data || []));
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const deleteAnimal = async (id) => {
        if (!window.confirm('Delete this animal?')) return;
        try {
            const response = await adminAPI.deleteAnimal(id);
            if (response.success) {
                setAnimals(animals.filter(a => a.id !== id));
            }
        } catch (error) {
            console.error('Error deleting animal:', error);
        }
    };

    const StatCard = ({ title, value, icon, color }) => (
        <div className={`bg-white p-6 rounded-2xl shadow-sm border-l-4 ${color}`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-500 text-sm">{title}</p>
                    <p className="text-3xl font-bold text-gray-800">{value}</p>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color.replace('border-', 'bg-').replace('-500', '-100')} ${color.replace('border-', 'text-')}`}>
                    {icon}
                </div>
            </div>
        </div>
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
                    <p className="text-gray-500">Welcome back, {user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`}</p>
                </div>
                <div className="flex gap-2">
                    {['overview', 'animals', 'analytics', 'users'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-lg font-medium capitalize transition ${
                                activeTab === tab ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {activeTab === 'overview' && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard title="Total Users" value={stats.totalUsers} icon={<UsersIcon />} color="border-blue-500" />
                        <StatCard title="Total Animals" value={stats.totalAnimals} icon={<AnimalIcon />} color="border-green-500" />
                        <StatCard title="Tickets Sold" value={stats.totalTickets} icon={<TicketIcon />} color="border-yellow-500" />
                        <StatCard title="Revenue" value={`₱${stats.totalRevenue?.toLocaleString()}`} icon={<RevenueIcon />} color="border-purple-500" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-gray-800">Recent Users</h3>
                                <Link to="/admin/users" className="text-green-600 text-sm hover:underline">View all</Link>
                            </div>
                            <div className="space-y-3">
                                {recentUsers.map(u => (
                                    <div key={u.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold">
                                            {u.fullName?.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-800">{u.fullName}</p>
                                            <p className="text-sm text-gray-500">{u.email}</p>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                            u.role === 'staff' ? 'bg-blue-100 text-blue-700' :
                                            'bg-gray-100 text-gray-700'
                                        }`}>
                                            {u.role}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <Link to="/admin/animals/add" className="p-4 bg-green-50 rounded-xl text-center hover:bg-green-100 transition flex flex-col items-center">
                                    <div className="text-green-600 mb-2"><AnimalIcon /></div>
                                    <p className="font-medium text-green-700">Add Animal</p>
                                </Link>
                                <Link to="/admin/events/add" className="p-4 bg-blue-50 rounded-xl text-center hover:bg-blue-100 transition flex flex-col items-center">
                                    <div className="text-blue-600 mb-2"><CalendarIcon /></div>
                                    <p className="font-medium text-blue-700">Add Event</p>
                                </Link>
                                <Link to="/admin/reports" className="p-4 bg-yellow-50 rounded-xl text-center hover:bg-yellow-100 transition flex flex-col items-center">
                                    <div className="text-yellow-600 mb-2"><ChartIcon /></div>
                                    <p className="font-medium text-yellow-700">View Reports</p>
                                </Link>
                                <Link to="/admin/users" className="p-4 bg-purple-50 rounded-xl text-center hover:bg-purple-100 transition flex flex-col items-center">
                                    <div className="text-purple-600 mb-2"><UsersIcon /></div>
                                    <p className="font-medium text-purple-700">Manage Users</p>
                                </Link>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {activeTab === 'animals' && (
                <div className="bg-white p-6 rounded-2xl shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-gray-800">Animal Management</h3>
                        <Link to="/admin/animals/add" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                            + Add Animal
                        </Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="p-3 text-left text-gray-600">ID</th>
                                    <th className="p-3 text-left text-gray-600">Name</th>
                                    <th className="p-3 text-left text-gray-600">Species</th>
                                    <th className="p-3 text-left text-gray-600">Status</th>
                                    <th className="p-3 text-left text-gray-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {animals.map(animal => (
                                    <tr key={animal.id} className="hover:bg-gray-50">
                                        <td className="p-3">{animal.id}</td>
                                        <td className="p-3 font-medium">{animal.name}</td>
                                        <td className="p-3 text-gray-600">{animal.species}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                animal.status === 'healthy' ? 'bg-green-100 text-green-700' :
                                                animal.status === 'sick' ? 'bg-red-100 text-red-700' :
                                                'bg-yellow-100 text-yellow-700'
                                            }`}>
                                                {animal.status}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            <button onClick={() => deleteAnimal(animal.id)} className="text-red-500 hover:text-red-700">
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'analytics' && <AnimalAnalytics />}

            {activeTab === 'users' && (
                <div className="bg-white p-6 rounded-2xl shadow-sm">
                    <h3 className="text-xl font-bold text-gray-800 mb-6">User Management</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="p-3 text-left text-gray-600">User</th>
                                    <th className="p-3 text-left text-gray-600">Email</th>
                                    <th className="p-3 text-left text-gray-600">Role</th>
                                    <th className="p-3 text-left text-gray-600">Joined</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {recentUsers.map(u => (
                                    <tr key={u.id} className="hover:bg-gray-50">
                                        <td className="p-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-sm font-bold">
                                                    {u.fullName?.substring(0, 2).toUpperCase()}
                                                </div>
                                                <span className="font-medium">{u.fullName}</span>
                                            </div>
                                        </td>
                                        <td className="p-3 text-gray-600">{u.email}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                                                u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                                u.role === 'staff' ? 'bg-blue-100 text-blue-700' :
                                                'bg-gray-100 text-gray-700'
                                            }`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="p-3 text-gray-500 text-sm">
                                            {new Date(u.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;