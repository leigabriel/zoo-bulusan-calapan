import { useState, useEffect } from 'react';
import { staffAPI } from '../../services/api-client';
import { sanitizeInput } from '../../utils/sanitize';

// Icons
const UsersIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);

const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
    </svg>
);

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M12 5v14" />
        <path d="M5 12h14" />
    </svg>
);

const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
);

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <line x1="10" y1="11" x2="10" y2="17" />
        <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
);

const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);

const MailIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
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

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const TicketIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
        <path d="M13 5v2" />
        <path d="M13 17v2" />
        <path d="M13 11v2" />
    </svg>
);

const StaffUsers = ({ globalSearch = '' }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('user');
    const [selectedUser, setSelectedUser] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        firstName: '', lastName: '', email: '', username: '', password: '', phone: '', address: ''
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await staffAPI.getUsers();
            if (res.success && res.users) {
                // Filter out admin and staff users - staff can only manage regular users
                const regularUsers = res.users.filter(u => u.role === 'user');
                setUsers(regularUsers);
            }
        } catch (err) {
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    };

    const openCreateModal = () => {
        setEditingUser(null);
        setForm({ firstName: '', lastName: '', email: '', username: '', password: '', phone: '', address: '' });
        setShowModal(true);
    };

    const openEditModal = (user) => {
        setEditingUser(user);
        setForm({
            firstName: user.first_name || '',
            lastName: user.last_name || '',
            email: user.email || '',
            username: user.username || '',
            password: '',
            phone: user.phone || '',
            address: user.address || ''
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingUser(null);
        setForm({ firstName: '', lastName: '', email: '', username: '', password: '', phone: '', address: '' });
    };

    const saveUser = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const userData = {
                first_name: form.firstName,
                last_name: form.lastName,
                email: form.email,
                username: form.username,
                phone: form.phone,
                address: form.address,
                role: 'user' // Staff can only create regular users
            };
            if (form.password) userData.password = form.password;

            if (editingUser) {
                await staffAPI.updateUser(editingUser.id, userData);
            } else {
                if (!form.password) {
                    alert('Password is required for new users');
                    setSaving(false);
                    return;
                }
                await staffAPI.createUser(userData);
            }
            closeModal();
            fetchUsers();
        } catch (err) {
            console.error('Error saving user:', err);
            alert(err.message || 'Failed to save user');
        } finally {
            setSaving(false);
        }
    };

    const removeUser = async (userId) => {
        try {
            await staffAPI.deleteUser(userId);
            setDeleteConfirm(null);
            fetchUsers();
        } catch (err) {
            console.error('Error deleting user:', err);
            alert(err.message || 'Failed to delete user');
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

    const effectiveSearch = globalSearch || searchQuery;
    const filteredUsers = users.filter(user => {
        const matchesSearch = user.first_name?.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
            user.last_name?.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
            user.email?.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
            user.username?.toLowerCase().includes(effectiveSearch.toLowerCase());
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const userStats = {
        total: users.length,
        regularUsers: users.filter(u => u.role === 'user').length,
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
            <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-4">
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
                <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Regular Users</p>
                            <p className="text-2xl font-bold text-[#8cff65]">{userStats.regularUsers}</p>
                        </div>
                        <div className="w-10 h-10 bg-[#8cff65]/10 rounded-xl flex items-center justify-center text-[#8cff65]">
                            <UserIcon />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-4">
                <div className="flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex items-center bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-4 py-2 flex-1 min-w-[200px] max-w-sm">
                        <SearchIcon />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="ml-2 bg-transparent border-none outline-none text-white placeholder-gray-500 w-full"
                        />
                    </div>
                    <button
                        onClick={openCreateModal}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#8cff65] to-[#4ade80] text-[#0a0a0a] font-semibold rounded-xl hover:from-[#9dff7a] hover:to-[#5ceb91] transition-all shadow-lg shadow-[#8cff65]/20"
                    >
                        <PlusIcon /> Add User
                    </button>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#0f0f0f] border-b border-[#2a2a2a]">
                            <tr>
                                <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm">User</th>
                                <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm">Email</th>
                                <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm">Role</th>
                                <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm">Joined</th>
                                <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm">Tickets</th>
                                <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map(user => (
                                    <tr key={user.id} className="border-b border-[#2a2a2a] hover:bg-[#1e1e1e]/50 transition">
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
                                                <span>{user.ticket_count || 0}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setSelectedUser(user)}
                                                    className="p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-500/20 transition"
                                                    title="View Details"
                                                >
                                                    <UserIcon />
                                                </button>
                                                <button
                                                    onClick={() => openEditModal(user)}
                                                    className="p-2 bg-[#8cff65]/10 border border-[#8cff65]/30 rounded-lg text-[#8cff65] hover:bg-[#8cff65]/20 transition"
                                                    title="Edit User"
                                                >
                                                    <EditIcon />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirm(user)}
                                                    className="p-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/20 transition"
                                                    title="Delete User"
                                                >
                                                    <TrashIcon />
                                                </button>
                                            </div>
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
                {/* Table Footer */}
                <div className="px-6 py-3 border-t border-[#2a2a2a] text-sm text-gray-500">
                    Showing {filteredUsers.length} of {users.length} users
                </div>
            </div>

            {/* User Detail Modal */}
            {selectedUser && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl w-full max-w-md">
                        <div className="p-6 border-b border-[#2a2a2a] flex items-center justify-between">
                            <h3 className="text-xl font-bold text-white">User Details</h3>
                            <button
                                onClick={() => setSelectedUser(null)}
                                className="p-2 hover:bg-[#1e1e1e] rounded-lg text-gray-400 hover:text-white transition"
                            >
                                <CloseIcon />
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

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-[#2a2a2a] flex items-center justify-between sticky top-0 bg-[#141414]">
                            <h3 className="text-xl font-bold text-white">
                                {editingUser ? 'Edit User' : 'Add New User'}
                            </h3>
                            <button onClick={closeModal} className="p-2 hover:bg-[#1e1e1e] rounded-lg text-gray-400 hover:text-white transition">
                                <CloseIcon />
                            </button>
                        </div>
                        <form onSubmit={saveUser} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">First Name *</label>
                                    <input
                                        type="text"
                                        value={form.firstName}
                                        onChange={(e) => setForm({ ...form, firstName: sanitizeInput(e.target.value) })}
                                        required
                                        className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#8cff65]"
                                        placeholder="First name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Last Name *</label>
                                    <input
                                        type="text"
                                        value={form.lastName}
                                        onChange={(e) => setForm({ ...form, lastName: sanitizeInput(e.target.value) })}
                                        required
                                        className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#8cff65]"
                                        placeholder="Last name"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Username *</label>
                                <input
                                    type="text"
                                    value={form.username}
                                    onChange={(e) => setForm({ ...form, username: sanitizeInput(e.target.value) })}
                                    required
                                    className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#8cff65]"
                                    placeholder="Username"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Email *</label>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    required
                                    className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#8cff65]"
                                    placeholder="Email address"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Password {editingUser ? '(leave blank to keep current)' : '*'}
                                </label>
                                <input
                                    type="password"
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    required={!editingUser}
                                    className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#8cff65]"
                                    placeholder={editingUser ? 'Leave blank to keep current' : 'Password'}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Phone</label>
                                <input
                                    type="tel"
                                    value={form.phone}
                                    onChange={(e) => setForm({ ...form, phone: sanitizeInput(e.target.value) })}
                                    className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#8cff65]"
                                    placeholder="Phone number"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Address</label>
                                <textarea
                                    value={form.address}
                                    onChange={(e) => setForm({ ...form, address: sanitizeInput(e.target.value) })}
                                    rows="2"
                                    className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#8cff65] resize-none"
                                    placeholder="Address"
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={closeModal} className="flex-1 px-4 py-3 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white rounded-xl font-medium transition">
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving} className="flex-1 px-4 py-3 bg-[#8cff65] hover:bg-[#7ae857] text-[#0a0a0a] rounded-xl font-medium transition disabled:opacity-50">
                                    {saving ? 'Saving...' : (editingUser ? 'Update User' : 'Add User')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl w-full max-w-md p-6">
                        <h3 className="text-xl font-bold text-white mb-2">Delete User</h3>
                        <p className="text-gray-400 mb-6">
                            Are you sure you want to delete <span className="text-white font-medium">{deleteConfirm.first_name} {deleteConfirm.last_name}</span>? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-3 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white rounded-xl font-medium transition">
                                Cancel
                            </button>
                            <button onClick={() => removeUser(deleteConfirm.id)} className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffUsers;