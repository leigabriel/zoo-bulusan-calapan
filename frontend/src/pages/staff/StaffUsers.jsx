import { useState, useEffect } from 'react';
import { staffAPI } from '../../services/api-client';

// Icons
const UsersIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
);

const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <circle cx="11" cy="11" r="8"/>
        <path d="m21 21-4.3-4.3"/>
    </svg>
);

const RefreshIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M23 4v6h-6"/>
        <path d="M1 20v-6h6"/>
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
    </svg>
);

const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
    </svg>
);

const MailIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
        <polyline points="22,6 12,13 2,6"/>
    </svg>
);

const CalendarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
);

const XIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
);

const TicketIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
        <path d="M13 5v2"/>
        <path d="M13 17v2"/>
        <path d="M13 11v2"/>
    </svg>
);

const StaffUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('user');
    const [selectedUser, setSelectedUser] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await staffAPI.getUsers();
            if (res.success && res.users) {
                setUsers(res.users);
            }
        } catch (err) {
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    };

    const getRoleBadge = (role) => {
        switch (role?.toLowerCase()) {
            case 'admin': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
            case 'staff': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'vet': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
            case 'user': return 'bg-[#8cff65]/20 text-[#8cff65] border-[#8cff65]/30';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.username?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const userStats = {
        total: users.length,
        regularUsers: users.filter(u => u.role === 'user').length,
        staff: users.filter(u => u.role === 'staff').length,
        vets: users.filter(u => u.role === 'vet').length,
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-[#8cff65] border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-400">Loading users...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Total Users</p>
                            <p className="text-2xl font-bold text-white">{userStats.total}</p>
                        </div>
                        <div className="w-10 h-10 bg-[#8cff65]/10 rounded-xl flex items-center justify-center text-[#8cff65]">
                            <UsersIcon />
                        </div>
                    </div>
                </div>
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4">
                    <p className="text-gray-400 text-sm">Regular Users</p>
                    <p className="text-2xl font-bold text-[#8cff65]">{userStats.regularUsers}</p>
                </div>
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4">
                    <p className="text-gray-400 text-sm">Staff Members</p>
                    <p className="text-2xl font-bold text-blue-400">{userStats.staff}</p>
                </div>
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4">
                    <p className="text-gray-400 text-sm">Veterinarians</p>
                    <p className="text-2xl font-bold text-orange-400">{userStats.vets}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4">
                <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex items-center bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl px-4 py-2 flex-1 min-w-[200px]">
                        <SearchIcon />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="ml-2 bg-transparent border-none outline-none text-white placeholder-gray-500 w-full"
                        />
                    </div>
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl px-4 py-2 text-white outline-none capitalize"
                    >
                        <option value="all">All Roles</option>
                        <option value="user">Users Only</option>
                        <option value="staff">Staff Only</option>
                        <option value="vet">Vets Only</option>
                    </select>
                    <button
                        onClick={fetchUsers}
                        className="flex items-center gap-2 px-4 py-2 bg-[#8cff65]/10 border border-[#8cff65]/30 rounded-xl text-[#8cff65] hover:bg-[#8cff65]/20 transition"
                    >
                        <RefreshIcon />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#0f0f0f] border-b border-[#2a2a2a]">
                            <tr>
                                <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm">User</th>
                                <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm">Email</th>
                                <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm">Role</th>
                                <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm">Joined</th>
                                <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm">Ticket Purchases</th>
                                <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map(user => (
                                    <tr key={user.id} className="border-b border-[#2a2a2a] hover:bg-[#0f0f0f]/50 transition">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full overflow-hidden bg-[#0a0a0a] flex items-center justify-center border border-[#2a2a2a]">
                                                    {user.profile_image ? (
                                                        <img 
                                                            src={user.profile_image} 
                                                            alt={user.first_name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <span className="text-[#8cff65] font-medium">
                                                            {user.first_name?.charAt(0)}{user.last_name?.charAt(0)}
                                                        </span>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-white font-medium">{user.first_name} {user.last_name}</p>
                                                    <p className="text-gray-500 text-sm">@{user.username}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-gray-400">
                                                <MailIcon />
                                                <span>{user.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-lg text-xs font-medium border capitalize ${getRoleBadge(user.role)}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-gray-400">
                                                <CalendarIcon />
                                                <span>{formatDate(user.created_at)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-gray-400">
                                                <TicketIcon />
                                                <span>{user.ticket_count || 0} tickets</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => setSelectedUser(user)}
                                                className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-500/20 transition text-sm"
                                            >
                                                <UserIcon />
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="text-center py-12 text-gray-500">
                                        No users found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* User Detail Modal */}
            {selectedUser && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl w-full max-w-md">
                        <div className="p-6 border-b border-[#2a2a2a] flex items-center justify-between">
                            <h3 className="text-xl font-bold text-white">User Details</h3>
                            <button
                                onClick={() => setSelectedUser(null)}
                                className="text-gray-400 hover:text-white transition"
                            >
                                <XIcon />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full overflow-hidden bg-[#0a0a0a] flex items-center justify-center border border-[#2a2a2a]">
                                    {selectedUser.profile_image ? (
                                        <img 
                                            src={selectedUser.profile_image}
                                            alt={selectedUser.first_name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-[#8cff65] font-bold text-xl">
                                            {selectedUser.first_name?.charAt(0)}{selectedUser.last_name?.charAt(0)}
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <h4 className="text-white font-bold text-lg">{selectedUser.first_name} {selectedUser.last_name}</h4>
                                    <p className="text-gray-500">@{selectedUser.username}</p>
                                    <span className={`px-3 py-1 rounded-lg text-xs font-medium border capitalize inline-block mt-2 ${getRoleBadge(selectedUser.role)}`}>
                                        {selectedUser.role}
                                    </span>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-gray-400">
                                    <MailIcon />
                                    <span>{selectedUser.email}</span>
                                </div>
                                <div className="flex items-center gap-3 text-gray-400">
                                    <CalendarIcon />
                                    <span>Joined {formatDate(selectedUser.created_at)}</span>
                                </div>
                                <div className="flex items-center gap-3 text-gray-400">
                                    <TicketIcon />
                                    <span>{selectedUser.ticket_count || 0} ticket purchases</span>
                                </div>
                            </div>
                            {selectedUser.address && (
                                <div>
                                    <p className="text-gray-500 text-sm mb-1">Address</p>
                                    <p className="text-gray-300">{selectedUser.address}</p>
                                </div>
                            )}
                            {selectedUser.phone && (
                                <div>
                                    <p className="text-gray-500 text-sm mb-1">Phone</p>
                                    <p className="text-gray-300">{selectedUser.phone}</p>
                                </div>
                            )}
                        </div>
                        <div className="p-6 border-t border-[#2a2a2a]">
                            <button
                                onClick={() => setSelectedUser(null)}
                                className="w-full py-3 bg-[#2a2a2a] rounded-xl text-white hover:bg-[#3a3a3a] transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffUsers;
