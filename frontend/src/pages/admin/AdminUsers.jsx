import { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api-client';
import { sanitizeInput, sanitizeEmail } from '../../utils/sanitize';

// Icons
const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
    </svg>
);

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
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

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const UsersHeaderIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);

const FilterIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
);

const AdminUsers = ({ globalSearch = '' }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingUser, setEditingUser] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [form, setForm] = useState({ firstName: '', lastName: '', username: '', email: '', role: 'user', password: '' });
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    // Combine local and global search
    const effectiveSearch = globalSearch || searchQuery;

    useEffect(() => { fetchUsers(); }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await adminAPI.getUsers();
            if (res.success) setUsers(res.users || []);
            else throw new Error(res.message || 'Failed to fetch users');
        } catch (err) {
            console.error(err);
            setError(err.message || 'Error');
        } finally { setLoading(false); }
    };

    const openCreateModal = () => {
        setEditingUser(null);
        setForm({ firstName: '', lastName: '', username: '', email: '', role: 'user', password: '' });
        setShowModal(true);
    };

    const openEditModal = (user) => {
        setEditingUser(user);
        setForm({
            firstName: user.firstName || user.first_name || '',
            lastName: user.lastName || user.last_name || '',
            username: user.username || '',
            email: user.email || '',
            role: user.role || 'user',
            password: ''
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingUser(null);
        setForm({ firstName: '', lastName: '', username: '', email: '', role: 'user', password: '' });
    };

    const saveUser = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = { ...form };
            if (!payload.password) delete payload.password;
            let res;
            if (editingUser) {
                res = await adminAPI.updateUser(editingUser.id, payload);
            } else {
                res = await adminAPI.createUser(payload);
            }
            if (res.success) {
                await fetchUsers();
                closeModal();
            } else throw new Error(res.message || 'Save failed');
        } catch (err) {
            console.error(err);
            alert(err.message || 'Failed to save user');
        } finally {
            setSaving(false);
        }
    };

    const removeUser = async (id) => {
        try {
            const res = await adminAPI.deleteUser(id);
            if (res.success) {
                setUsers(users.filter(u => u.id !== id));
                setDeleteConfirm(null);
            } else throw new Error(res.message || 'Delete failed');
        } catch (err) {
            console.error(err);
            alert(err.message || 'Failed to delete user');
        }
    };

    const getRoleBadgeColor = (role) => {
        switch (role?.toLowerCase()) {
            case 'admin': return 'bg-[#8cff65]/20 text-[#8cff65] border-[#8cff65]/30';
            case 'staff': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'vet': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };

    const filteredUsers = users.filter(user => {
        // Exclude admin users - only show staff and regular users
        if (user.role === 'admin') return false;

        const fullName = `${user.firstName || user.first_name || ''} ${user.lastName || user.last_name || ''}`.toLowerCase();
        const matchesSearch = fullName.includes(effectiveSearch.toLowerCase()) ||
            user.email?.toLowerCase().includes(effectiveSearch.toLowerCase());
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const userCounts = {
        total: users.filter(u => u.role !== 'admin').length,
        staff: users.filter(u => u.role === 'staff').length,
        vet: users.filter(u => u.role === 'vet').length,
        user: users.filter(u => u.role === 'user').length,
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

    if (error) {
        return (
            <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
                {error}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#8cff65]/10 rounded-xl flex items-center justify-center text-[#8cff65]">
                            <UsersHeaderIcon />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{userCounts.total}</p>
                            <p className="text-xs text-gray-500">Total Users</p>
                        </div>
                    </div>
                </div>
                <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400">
                            <span className="text-lg font-bold">S</span>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{userCounts.staff}</p>
                            <p className="text-xs text-gray-500">Staff</p>
                        </div>
                    </div>
                </div>
                <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400">
                            <span className="text-lg font-bold">V</span>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{userCounts.vet}</p>
                            <p className="text-xs text-gray-500">Vets</p>
                        </div>
                    </div>
                </div>
                <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-500/10 rounded-xl flex items-center justify-center text-gray-400">
                            <span className="text-lg font-bold">U</span>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{userCounts.user}</p>
                            <p className="text-xs text-gray-500">Regular Users</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Card */}
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-[#2a2a2a] flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                        {/* Search */}
                        <div className="relative flex-1 max-w-sm">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                <SearchIcon />
                            </div>
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#8cff65] focus:ring-1 focus:ring-[#8cff65]/20 transition-all"
                            />
                        </div>

                        {/* Role Filter */}
                        <div className="relative">
                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className="appearance-none bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl py-2.5 pl-10 pr-8 text-sm text-white focus:outline-none focus:border-[#8cff65] cursor-pointer"
                            >
                                <option value="all">All Roles</option>
                                <option value="staff">Staff</option>
                                <option value="vet">Vet</option>
                                <option value="user">User</option>
                            </select>
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                                <FilterIcon />
                            </div>
                        </div>
                    </div>

                    {/* Add User Button */}
                    <button
                        onClick={openCreateModal}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#8cff65] to-[#4ade80] text-[#0a0a0a] font-semibold rounded-xl hover:from-[#9dff7a] hover:to-[#5ceb91] transition-all shadow-lg shadow-[#8cff65]/20"
                    >
                        <PlusIcon />
                        Add User
                    </button>
                </div>

                {/* Users Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#1e1e1e]">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">User</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2a2a2a]">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                        {searchQuery || roleFilter !== 'all' ? 'No users match your filters' : 'No users found'}
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map(user => (
                                    <tr key={user.id} className="hover:bg-[#1e1e1e]/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8cff65] to-[#4ade80] flex items-center justify-center text-[#0a0a0a] font-bold">
                                                    {(user.firstName || user.first_name || 'U').charAt(0).toUpperCase()}
                                                </div>
                                                <p className="font-medium text-white">
                                                    {user.firstName || user.first_name} {user.lastName || user.last_name}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-300">{user.email}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border capitalize ${getRoleBadgeColor(user.role)}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1.5 text-[#8cff65] text-sm">
                                                <div className="w-2 h-2 bg-[#8cff65] rounded-full"></div>
                                                Active
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openEditModal(user)}
                                                    className="p-2 bg-[#1e1e1e] hover:bg-[#2a2a2a] border border-[#2a2a2a] hover:border-[#8cff65]/50 text-gray-400 hover:text-[#8cff65] rounded-lg transition-all"
                                                    title="Edit user"
                                                >
                                                    <EditIcon />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirm(user)}
                                                    className="p-2 bg-[#1e1e1e] hover:bg-red-500/10 border border-[#2a2a2a] hover:border-red-500/50 text-gray-400 hover:text-red-400 rounded-lg transition-all"
                                                    title="Delete user"
                                                >
                                                    <TrashIcon />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Table Footer */}
                <div className="px-6 py-4 border-t border-[#2a2a2a] flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                        Showing {filteredUsers.length} of {users.length} users
                    </p>
                </div>
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl w-full max-w-md">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-[#2a2a2a] flex items-center justify-between">
                            <h3 className="text-xl font-bold text-white">
                                {editingUser ? 'Edit User' : 'Create New User'}
                            </h3>
                            <button
                                onClick={closeModal}
                                className="p-2 hover:bg-[#1e1e1e] rounded-lg text-gray-400 hover:text-white transition"
                            >
                                <CloseIcon />
                            </button>
                        </div>

                        {/* Modal Form */}
                        <form onSubmit={saveUser} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">First Name</label>
                                    <input
                                        type="text"
                                        value={form.firstName}
                                        onChange={e => setForm({ ...form, firstName: sanitizeInput(e.target.value) })}
                                        className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#8cff65] transition-all"
                                        placeholder="John"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Last Name</label>
                                    <input
                                        type="text"
                                        value={form.lastName}
                                        onChange={e => setForm({ ...form, lastName: sanitizeInput(e.target.value) })}
                                        className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#8cff65] transition-all"
                                        placeholder="Doe"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Username</label>
                                <input
                                    type="text"
                                    value={form.username}
                                    onChange={e => setForm({ ...form, username: sanitizeInput(e.target.value) })}
                                    className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#8cff65] transition-all"
                                    placeholder="johndoe123"
                                    required
                                    disabled={!!editingUser}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={e => setForm({ ...form, email: sanitizeEmail(e.target.value) })}
                                    className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#8cff65] transition-all"
                                    placeholder="john@example.com"
                                    required
                                    disabled={!!editingUser}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Role</label>
                                <select
                                    value={form.role}
                                    onChange={e => setForm({ ...form, role: e.target.value })}
                                    className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#8cff65] transition-all cursor-pointer"
                                >
                                    <option value="user">User</option>
                                    <option value="staff">Staff</option>
                                    <option value="vet">Vet</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                            {!editingUser && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Password</label>
                                    <input
                                        type="password"
                                        value={form.password}
                                        onChange={e => setForm({ ...form, password: e.target.value })}
                                        className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#8cff65] transition-all"
                                        placeholder="••••••••"
                                        required={!editingUser}
                                    />
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 py-3 bg-[#1e1e1e] hover:bg-[#2a2a2a] text-gray-300 font-medium rounded-xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 py-3 bg-gradient-to-r from-[#8cff65] to-[#4ade80] text-[#0a0a0a] font-semibold rounded-xl hover:from-[#9dff7a] hover:to-[#5ceb91] transition-all disabled:opacity-50"
                                >
                                    {saving ? 'Saving...' : (editingUser ? 'Update' : 'Create')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl w-full max-w-sm p-6 text-center">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <TrashIcon />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Delete User?</h3>
                        <p className="text-gray-400 mb-6">
                            Are you sure you want to delete <span className="text-white font-medium">{deleteConfirm.firstName || deleteConfirm.first_name} {deleteConfirm.lastName || deleteConfirm.last_name}</span>? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 py-3 bg-[#1e1e1e] hover:bg-[#2a2a2a] text-gray-300 font-medium rounded-xl transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => removeUser(deleteConfirm.id)}
                                className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-semibold rounded-xl transition-all"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsers;