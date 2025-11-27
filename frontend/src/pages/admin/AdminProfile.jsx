import { useState, useEffect } from 'react';
import { authAPI } from '../../services/api-client';
import { useAuth } from '../../context/AuthContext';

const AdminProfile = () => {
    const { user, updateUser } = useAuth();
    const [form, setForm] = useState({ firstName: '', lastName: '', email: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                // fetch admin profile using admin token
                const res = await authAPI.getProfile('admin');
                if (res && res.success && res.user) {
                    setForm({
                        firstName: res.user.firstName || res.user.first_name || '',
                        lastName: res.user.lastName || res.user.last_name || '',
                        email: res.user.email || ''
                    });
                } else if (user) {
                    setForm({ firstName: user.firstName || user.first_name || '', lastName: user.lastName || user.last_name || '', email: user.email || '' });
                }
            } catch (err) {
                console.error('Error loading admin profile', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [user]);

    const save = async () => {
        setSaving(true);
        try {
            const payload = { firstName: form.firstName, lastName: form.lastName };
            const res = await authAPI.updateProfile(payload, 'admin');
            if (res && res.success) {
                // refresh local auth context if necessary
                updateUser({ ...user, firstName: form.firstName, lastName: form.lastName });
                alert('Profile updated');
            } else {
                alert(res.message || 'Failed to update');
            }
        } catch (err) {
            console.error(err);
            alert('Error updating profile');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-6">Loading...</div>;

    return (
        <div className="p-6 bg-white rounded-2xl shadow-sm">
            <h2 className="text-xl font-bold mb-4">Admin Profile</h2>
            <div className="grid gap-4 max-w-xl">
                <input className="border p-2" placeholder="First name" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} />
                <input className="border p-2" placeholder="Last name" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} />
                <input className="border p-2 bg-gray-50" placeholder="Email" value={form.email} readOnly />
                <div>
                    <button onClick={save} className="px-4 py-2 bg-green-600 text-white rounded" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
                </div>
            </div>
        </div>
    );
};

export default AdminProfile;
