import { Users as UsersIcon, User as UserIcon, Search as SearchIcon, Plus as PlusIcon, Envelope as MailIcon, Calendar as CalendarIcon, Ticket as TicketIcon, Edit as EditIcon, CheckCircle as UnbanIcon, Ban as BanIcon, Trash as TrashIcon, X as CloseIcon } from 'reicon-react';
import { useState, useEffect, useRef } from 'react';
import { staffAPI, getProfileImageUrl } from '../../services/api-client';
import { sanitizeInput } from '../../utils/sanitize';
import { notify } from '../../utils/toast';

// Icons

const StaffUsers = ({ globalSearch = '' }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter] = useState('user');
    const [selectedUser, setSelectedUser] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [suspendUser, setSuspendUser] = useState(null);
    const [suspendReason, setSuspendReason] = useState('');
    const [suspending, setSuspending] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        firstName: '', lastName: '', email: '', username: '', password: '', phone: '', address: ''
    });

    const [undoItem, setUndoItem] = useState(null);
    const undoTimeoutRef = useRef(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await staffAPI.getUsers();
            if (res.success && res.users) {
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
                role: 'user'
            };
            if (form.password) userData.password = form.password;

            if (editingUser) {
                await staffAPI.updateUser(editingUser.id, userData);
                notify.success('User updated.');
            } else {
                if (!form.password) {
                    notify.warning('Add a password first.');
                    setSaving(false);
                    return;
                }
                await staffAPI.createUser(userData);
                notify.success('User created.');
            }
            closeModal();
            fetchUsers();
        } catch (err) {
            notify.error(err.message || "Couldn't save user.");
        } finally {
            setSaving(false);
        }
    };

    const handleSuspendUser = async () => {
        if (!suspendUser || !suspendReason.trim()) {
            notify.warning('Provide a reason first.');
            return;
        }
        setSuspending(true);
        try {
            await staffAPI.suspendUser(suspendUser.id, suspendReason);
            notify.success('Account suspended.');
            setSuspendUser(null);
            setSuspendReason('');
            fetchUsers();
        } catch (err) {
            notify.error(err.message || "Couldn't update account.");
        } finally {
            setSuspending(false);
        }
    };

    const handleUnsuspendUser = async (userId) => {
        if (!confirm('Are you sure you want to unsuspend this user?')) return;
        try {
            await staffAPI.unsuspendUser(userId);
            notify.success('Account restored.');
            fetchUsers();
        } catch (err) {
            notify.error(err.message || "Couldn't restore account.");
        }
    };

    // ==================== TRASH HANDLERS ====================

    const trashUser = async (user) => {
        try {
            const res = await staffAPI.softDeleteUser(user.id);
            if (res.success) {
                setUsers(users.filter(u => u.id !== user.id));
                setUndoItem({ type: 'user', data: user });
                if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
                undoTimeoutRef.current = setTimeout(() => setUndoItem(null), 5000);
            }
        } catch {
            notify.error('Failed to move user to trash');
        }
    };

    const handleUndoTrash = async () => {
        if (!undoItem) return;
        try {
            await staffAPI.restoreUser(undoItem.data.id);
            setUsers(prev => [undoItem.data, ...prev]);
            setUndoItem(null);
            if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
        } catch {
            notify.error('Failed to restore user');
        }
    };

    const getRoleBadge = (role) => {
        switch (role?.toLowerCase()) {
            case 'admin': return 'bg-purple-500/20 text-purple-700 border-purple-500/30';
            case 'staff': return 'bg-blue-500/20 text-blue-700 border-blue-500/30';
            case 'user': return 'bg-green-400/20 text-green-800 border-green-400/30';
            default: return 'bg-gray-500/20 text-gray-500 border-gray-500/30';
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
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
                    <div className="w-10 h-10 border-4 border-green-400 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-500">Loading users...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                <div className="bg-white border border-green-200 rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">Total Users</p>
                            <p className="text-2xl font-bold text-gray-900">{userStats.total}</p>
                        </div>
                        <div className="w-10 h-10 bg-green-400/10 rounded-xl flex items-center justify-center text-green-800">
                            <UsersIcon className="w-5 h-5" />
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-green-200 rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">Regular Users</p>
                            <p className="text-2xl font-bold text-green-800">{userStats.regularUsers}</p>
                        </div>
                        <div className="w-10 h-10 bg-green-400/10 rounded-xl flex items-center justify-center text-green-800">
                            <UserIcon className="w-5 h-5" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white border border-green-200 rounded-2xl p-4">
                <div className="flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex items-center bg-green-50 border border-green-200 rounded-xl px-4 py-2 flex-1 min-w-[200px] max-w-sm">
                        <SearchIcon className="w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="ml-2 bg-transparent border-none outline-none text-gray-900 placeholder-gray-500 w-full"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={openCreateModal}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-300 via-green-400 to-green-500 text-gray-900 font-semibold rounded-xl hover:from-green-300 hover:via-green-400 hover:to-green-500 transition-all shadow-lg shadow-green-300/50"
                        >
                            <PlusIcon className="w-5 h-5" /> Add User
                        </button>
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white border border-green-200 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-green-50 border-b border-green-200">
                            <tr>
                                <th className="text-left px-6 py-4 text-gray-500 font-medium text-sm">User</th>
                                <th className="text-left px-6 py-4 text-gray-500 font-medium text-sm">Email</th>
                                <th className="text-left px-6 py-4 text-gray-500 font-medium text-sm">Role</th>
                                <th className="text-left px-6 py-4 text-gray-500 font-medium text-sm">Status</th>
                                <th className="text-left px-6 py-4 text-gray-500 font-medium text-sm">Joined</th>
                                <th className="text-left px-6 py-4 text-gray-500 font-medium text-sm">Tickets</th>
                                <th className="text-left px-6 py-4 text-gray-500 font-medium text-sm">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.length > 0 ? (
                                    filteredUsers.map(user => (
                                        <tr key={user.id} className="border-b border-green-200 hover:bg-green-50/50 transition">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full overflow-hidden bg-white flex items-center justify-center border border-green-200">
                                                        {user.profile_image ? (
                                                            <img src={getProfileImageUrl(user.profile_image)} alt={user.first_name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="text-green-800 font-medium">{user.first_name?.charAt(0)}{user.last_name?.charAt(0)}</span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-gray-900 font-medium">{user.first_name} {user.last_name}</p>
                                                        <p className="text-gray-500 text-sm">@{user.username}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-gray-500">
                                                    <MailIcon className="w-4 h-4" />
                                                    <span>{user.email}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-lg text-xs font-medium border capitalize ${getRoleBadge(user.role)}`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-lg text-xs font-medium border ${user.is_suspended ? 'bg-red-500/20 text-red-700 border-red-500/30' : 'bg-green-400/20 text-green-800 border-green-400/30'}`}>
                                                    {user.is_suspended ? 'Suspended' : 'Active'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-gray-500">
                                                    <CalendarIcon className="w-4 h-4" />
                                                    <span>{formatDate(user.created_at)}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-gray-500">
                                                    <TicketIcon className="w-4 h-4" />
                                                    <span>{user.ticket_count || 0}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => setSelectedUser(user)} className="p-2 bg-green-400/10 border border-green-400/30 rounded-lg text-green-800 hover:bg-green-400/20 transition" title="View Details">
                                                        <UserIcon className="w-5 h-5" />
                                                    </button>
                                                    <button onClick={() => openEditModal(user)} className="p-2 bg-green-400/10 border border-green-400/30 rounded-lg text-green-800 hover:bg-green-400/20 transition" title="Edit User">
                                                        <EditIcon className="w-4 h-4" />
                                                    </button>
                                                    {user.is_suspended ? (
                                                        <button onClick={() => handleUnsuspendUser(user.id)} className="p-2 bg-green-400/10 border border-green-400/30 rounded-lg text-green-800 hover:bg-green-400/20 transition" title="Unsuspend User">
                                                            <UnbanIcon className="w-4 h-4" />
                                                        </button>
                                                    ) : (
                                                        <button onClick={() => setSuspendUser(user)} className="p-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-700 hover:bg-red-500/20 transition" title="Suspend User">
                                                            <BanIcon className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <button onClick={() => trashUser(user)} className="p-2 bg-green-50 hover:bg-red-500/10 border border-green-200 hover:border-red-500/50 text-gray-500 hover:text-red-700 rounded-lg transition-all" title="Move to trash">
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="text-center py-12 text-gray-500">
                                            No users found
                                        </td>
                                    </tr>
                                )
                            }
                        </tbody>
                    </table>
                </div>
                <div className="px-6 py-3 border-t border-green-200 text-sm text-gray-500">
                    Showing {filteredUsers.length} of {users.length} users
                </div>
            </div>

            {/* Undo Toast */}
            {undoItem && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-4 animate-slide-up">
                    <span className="text-sm">User moved to trash</span>
                    <button
                        onClick={handleUndoTrash}
                        className="text-sm font-semibold text-green-400 hover:text-green-300 transition-colors"
                    >
                        Undo
                    </button>
                </div>
            )}

            {/* User Detail Modal */}
            {selectedUser && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white border border-green-200 rounded-2xl w-full max-w-md">
                        <div className="p-6 border-b border-green-200 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-gray-900">User Details</h3>
                            <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-green-50 rounded-lg text-gray-500 hover:text-gray-900 transition">
                                <CloseIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full overflow-hidden bg-white flex items-center justify-center border border-green-200">
                                    {selectedUser.profile_image ? (
                                        <img src={getProfileImageUrl(selectedUser.profile_image)} alt={selectedUser.first_name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-green-800 font-bold text-xl">{selectedUser.first_name?.charAt(0)}{selectedUser.last_name?.charAt(0)}</span>
                                    )}
                                </div>
                                <div>
                                    <h4 className="text-gray-900 font-bold text-lg">{selectedUser.first_name} {selectedUser.last_name}</h4>
                                    <p className="text-gray-500">@{selectedUser.username}</p>
                                    <span className={`px-3 py-1 rounded-lg text-xs font-medium border capitalize inline-block mt-2 ${getRoleBadge(selectedUser.role)}`}>{selectedUser.role}</span>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-gray-500"><MailIcon className="w-4 h-4" /><span>{selectedUser.email}</span></div>
                                <div className="flex items-center gap-3 text-gray-500"><CalendarIcon className="w-4 h-4" /><span>Joined {formatDate(selectedUser.created_at)}</span></div>
                                <div className="flex items-center gap-3 text-gray-500"><TicketIcon className="w-4 h-4" /><span>{selectedUser.ticket_count || 0} ticket purchases</span></div>
                            </div>
                            {selectedUser.address && (
                                <div><p className="text-gray-500 text-sm mb-1">Address</p><p className="text-gray-700">{selectedUser.address}</p></div>
                            )}
                            {selectedUser.phone && (
                                <div><p className="text-gray-500 text-sm mb-1">Phone</p><p className="text-gray-700">{selectedUser.phone}</p></div>
                            )}
                        </div>
                        <div className="p-6 border-t border-green-200">
                            <button onClick={() => setSelectedUser(null)} className="w-full py-3 bg-green-50 rounded-xl text-gray-900 hover:bg-green-50 transition">Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white border border-green-200 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-green-200 flex items-center justify-between sticky top-0 bg-white">
                            <h3 className="text-xl font-bold text-gray-900">{editingUser ? 'Edit User' : 'Add New User'}</h3>
                            <button onClick={closeModal} className="p-2 hover:bg-green-50 rounded-lg text-gray-500 hover:text-gray-900 transition"><CloseIcon className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={saveUser} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-2">First Name *</label>
                                    <input type="text" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: sanitizeInput(e.target.value) })} required className="w-full bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-green-400" placeholder="First name" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-2">Last Name *</label>
                                    <input type="text" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: sanitizeInput(e.target.value) })} required className="w-full bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-green-400" placeholder="Last name" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-2">Username *</label>
                                <input type="text" value={form.username} onChange={(e) => setForm({ ...form, username: sanitizeInput(e.target.value) })} required className="w-full bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-green-400" placeholder="Username" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-2">Email *</label>
                                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="w-full bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-green-400" placeholder="Email address" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-2">Password {editingUser ? '(leave blank to keep current)' : '*'}</label>
                                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editingUser} className="w-full bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-green-400" placeholder={editingUser ? 'Leave blank to keep current' : 'Password'} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-2">Phone</label>
                                <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: sanitizeInput(e.target.value) })} className="w-full bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-green-400" placeholder="Phone number" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-2">Address</label>
                                <textarea value={form.address} onChange={(e) => setForm({ ...form, address: sanitizeInput(e.target.value) })} rows="2" className="w-full bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-green-400 resize-none" placeholder="Address" />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={closeModal} className="flex-1 px-4 py-3 bg-green-50 hover:bg-green-50 text-gray-900 rounded-xl font-medium transition">Cancel</button>
                                <button type="submit" disabled={saving} className="flex-1 px-4 py-3 bg-green-400 hover:bg-green-400 text-gray-900 rounded-xl font-medium transition disabled:opacity-50">
                                    {saving ? 'Saving...' : (editingUser ? 'Update User' : 'Add User')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Suspend Confirmation Modal */}
            {suspendUser && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white border border-green-200 rounded-2xl w-full max-w-md p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Suspend User</h3>
                        <p className="text-gray-500 mb-4">Are you sure you want to suspend <span className="text-gray-900 font-medium">{suspendUser.first_name} {suspendUser.last_name}</span>?</p>
                        <div className="mb-4">
                            <label className="block text-sm text-gray-500 mb-2">Reason for suspension *</label>
                            <textarea value={suspendReason} onChange={(e) => setSuspendReason(e.target.value)} placeholder="Enter the reason for suspending this user..." className="w-full px-4 py-3 bg-white border border-green-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:border-green-400/50 resize-none" rows={3} />
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => { setSuspendUser(null); setSuspendReason(''); }} className="flex-1 px-4 py-3 bg-green-50 hover:bg-green-50 text-gray-900 rounded-xl font-medium transition">Cancel</button>
                            <button onClick={handleSuspendUser} disabled={suspending || !suspendReason.trim()} className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition disabled:opacity-50 disabled:cursor-not-allowed">
                                {suspending ? 'Suspending...' : 'Suspend'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffUsers;
