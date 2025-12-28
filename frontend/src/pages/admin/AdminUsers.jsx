import { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api-client';
import { sanitizeInput, sanitizeEmail } from '../../utils/sanitize';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingUser, setEditingUser] = useState(null);
    const [form, setForm] = useState({ firstName: '', lastName: '', email: '', role: 'user' });

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

    const startEdit = (user) => {
        setEditingUser(user);
        setForm({ firstName: user.firstName || '', lastName: user.lastName || '', email: user.email || '', role: user.role || 'user' });
    };

    const saveUser = async () => {
        try {
            const payload = { ...form };
            let res;
            if (editingUser) {
                res = await adminAPI.updateUser(editingUser.id, payload);
            } else {
                res = await adminAPI.createUser(payload);
            }
            if (res.success) {
                await fetchUsers();
                setEditingUser(null);
                setForm({ firstName: '', lastName: '', email: '', role: 'user' });
            } else throw new Error(res.message || 'Save failed');
        } catch (err) { console.error(err); alert(err.message || 'Failed'); }
    };

    const removeUser = async (id) => {
        if (!confirm('Delete this user?')) return;
        try {
            const res = await adminAPI.deleteUser(id);
            if (res.success) setUsers(users.filter(u => u.id !== id));
            else throw new Error(res.message || 'Delete failed');
        } catch (err) { console.error(err); alert(err.message || 'Failed'); }
    };

    if (loading) return <div className="p-6">Loading users...</div>;
    if (error) return <div className="p-6 text-red-600">{error}</div>;

    return (
        <div className="p-6 bg-white rounded-2xl shadow-sm">
            <h2 className="text-xl font-bold mb-4">Manage Users</h2>
            <div className="mb-4">
                <input className="border p-2 mr-2" placeholder="First name" value={form.firstName} onChange={e => setForm({...form, firstName: sanitizeInput(e.target.value)})} />
                <input className="border p-2 mr-2" placeholder="Last name" value={form.lastName} onChange={e => setForm({...form, lastName: sanitizeInput(e.target.value)})} />
                <input className="border p-2 mr-2" placeholder="Email" value={form.email} onChange={e => setForm({...form, email: sanitizeEmail(e.target.value)})} />
                <select className="border p-2 mr-2" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                    <option value="user">User</option>
                    <option value="staff">Staff</option>
                    <option value="vet">Vet</option>
                    <option value="admin">Admin</option>
                </select>
                <button className="px-4 py-2 bg-green-600 text-white rounded" onClick={saveUser}>{editingUser ? 'Update' : 'Create'}</button>
                {editingUser && <button className="ml-2 px-3 py-2 bg-gray-200 rounded" onClick={() => { setEditingUser(null); setForm({ firstName: '', lastName: '', email: '', role: 'user' });}}>Cancel</button>}
            </div>

            <table className="w-full">
                <thead>
                    <tr className="text-left text-sm text-gray-600">
                        <th className="p-2">Name</th>
                        <th className="p-2">Email</th>
                        <th className="p-2">Role</th>
                        <th className="p-2">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(u => (
                        <tr key={u.id} className="border-t">
                            <td className="p-2">{u.firstName} {u.lastName}</td>
                            <td className="p-2">{u.email}</td>
                            <td className="p-2 capitalize">{u.role}</td>
                            <td className="p-2">
                                <button className="text-blue-600 mr-2" onClick={() => startEdit(u)}>Edit</button>
                                <button className="text-red-600" onClick={() => removeUser(u.id)}>Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default AdminUsers;
