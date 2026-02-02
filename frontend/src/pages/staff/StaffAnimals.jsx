import { useState, useEffect } from 'react';
import { staffAPI } from '../../services/api-client';
import { sanitizeInput } from '../../utils/sanitize';

// Icons
const PawIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" className="w-5 h-5">
        <path d="M226.5 92.9c14.3 42.9-.3 86.2-32.6 96.8s-70.1-15.6-84.4-58.5s.3-86.2 32.6-96.8s70.1 15.6 84.4 58.5zM100.4 198.6c18.9 32.4 14.3 70.1-10.2 84.1s-59.7-.9-78.5-33.3S-2.7 179.3 21.8 165.3s59.7 .9 78.5 33.3zM69.2 401.2C121.6 259.9 214.7 224 256 224s134.4 35.9 186.8 177.2c3.6 9.7 5.2 20.1 5.2 30.5v1.6c0 25.8-20.9 46.7-46.7 46.7c-11.5 0-22.9-1.4-34-4.2l-88-22c-15.3-3.8-31.3-3.8-46.6 0l-88 22c-11.1 2.8-22.5 4.2-34 4.2C84.9 480 64 459.1 64 433.3v-1.6c0-10.4 1.6-20.8 5.2-30.5zM421.8 282.7c-24.5-14-29.1-51.7-10.2-84.1s54-47.3 78.5-33.3s29.1 51.7 10.2 84.1s-54 47.3-78.5 33.3zM310.1 189.7c-32.3-10.6-46.9-53.9-32.6-96.8s52.1-69.1 84.4-58.5s46.9 53.9 32.6 96.8s-52.1 69.1-84.4 58.5z"/>
    </svg>
);

const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
    </svg>
);

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
);

const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
);

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <polyline points="3 6 5 6 21 6"/>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    </svg>
);

const XIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
);

const StaffAnimals = () => {
    const [animals, setAnimals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [editingAnimal, setEditingAnimal] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        name: '', species: '', scientific_name: '', category: '', age: '', gender: '',
        status: 'healthy', enclosure: '', description: '', diet: '', habitat: '', imageUrl: ''
    });

    useEffect(() => { fetchAnimals(); }, []);

    const fetchAnimals = async () => {
        try {
            setLoading(true);
            const res = await staffAPI.getAnimals();
            if (res.success && res.animals) setAnimals(res.animals);
        } catch (err) {
            console.error('Error fetching animals:', err);
        } finally {
            setLoading(false);
        }
    };

    const openCreateModal = () => {
        setEditingAnimal(null);
        setForm({ name: '', species: '', scientific_name: '', category: '', age: '', gender: '',
            status: 'healthy', enclosure: '', description: '', diet: '', habitat: '', imageUrl: '' });
        setShowModal(true);
    };

    const openEditModal = (animal) => {
        setEditingAnimal(animal);
        setForm({
            name: animal.name || '', species: animal.species || '', scientific_name: animal.scientific_name || '',
            category: animal.category || '', age: animal.age || '', gender: animal.gender || '',
            status: animal.status || 'healthy', enclosure: animal.enclosure || '', description: animal.description || '',
            diet: animal.diet || '', habitat: animal.habitat || '', imageUrl: animal.image_url || ''
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingAnimal(null);
        setForm({ name: '', species: '', scientific_name: '', category: '', age: '', gender: '',
            status: 'healthy', enclosure: '', description: '', diet: '', habitat: '', imageUrl: '' });
    };

    const saveAnimal = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = { ...form, image_url: form.imageUrl };
            let res;
            if (editingAnimal) {
                res = await staffAPI.updateAnimal(editingAnimal.id, payload);
            } else {
                res = await staffAPI.createAnimal(payload);
            }
            if (res.success) {
                await fetchAnimals();
                closeModal();
            } else {
                alert(res.message || 'Failed to save animal');
            }
        } catch (err) {
            console.error(err);
            alert('Error saving animal');
        } finally {
            setSaving(false);
        }
    };

    const deleteAnimal = async (id) => {
        try {
            const res = await staffAPI.deleteAnimal(id);
            if (res.success) {
                setAnimals(animals.filter(a => a.id !== id));
                setDeleteConfirm(null);
            } else {
                alert(res.message || 'Failed to delete animal');
            }
        } catch (err) {
            console.error(err);
            alert('Error deleting animal');
        }
    };

    const getStatusBadge = (status) => {
        switch (status?.toLowerCase()) {
            case 'healthy': return 'bg-[#8cff65]/20 text-[#8cff65] border-[#8cff65]/30';
            case 'sick': return 'bg-red-500/20 text-red-400 border-red-500/30';
            case 'recovering': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            case 'quarantine': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };

    const categories = ['all', ...new Set(animals.map(a => a.category).filter(Boolean))];

    const filteredAnimals = animals.filter(animal => {
        const matchesSearch = animal.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            animal.species?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || animal.category === categoryFilter;
        const matchesStatus = statusFilter === 'all' || animal.status === statusFilter;
        return matchesSearch && matchesCategory && matchesStatus;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-10 h-10 border-4 border-[#8cff65] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Manage Animals</h1>
                    <p className="text-gray-400">Add, edit, and manage zoo animals</p>
                </div>
                <button onClick={openCreateModal} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#8cff65] to-[#4ade80] text-[#0a0a0a] font-semibold rounded-xl hover:from-[#9dff7a] hover:to-[#5ceb91] transition-all shadow-lg shadow-[#8cff65]/20">
                    <PlusIcon /> Add Animal
                </button>
            </div>

            {/* Filters */}
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-4 flex flex-wrap gap-4">
                <div className="flex items-center bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl px-4 py-2 flex-1 min-w-[200px]">
                    <SearchIcon />
                    <input type="text" placeholder="Search animals..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        className="ml-2 bg-transparent border-none outline-none text-white placeholder-gray-500 w-full" />
                </div>
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
                    className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl px-4 py-2 text-white outline-none capitalize">
                    {categories.map(cat => <option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</option>)}
                </select>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl px-4 py-2 text-white outline-none">
                    <option value="all">All Status</option>
                    <option value="healthy">Healthy</option>
                    <option value="sick">Sick</option>
                    <option value="recovering">Recovering</option>
                    <option value="quarantine">Quarantine</option>
                </select>
            </div>

            {/* Animals Table */}
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#0f0f0f] border-b border-[#2a2a2a]">
                            <tr>
                                <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm">Animal</th>
                                <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm">Species</th>
                                <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm">Category</th>
                                <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm">Status</th>
                                <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAnimals.length > 0 ? (
                                filteredAnimals.map(animal => (
                                    <tr key={animal.id} className="border-b border-[#2a2a2a] hover:bg-[#1e1e1e]/50 transition">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#0a0a0a] flex items-center justify-center">
                                                    {animal.image_url ? <img src={animal.image_url} alt={animal.name} className="w-full h-full object-cover" /> : <PawIcon />}
                                                </div>
                                                <span className="text-white font-medium">{animal.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-300">{animal.species}</td>
                                        <td className="px-6 py-4 text-gray-400 capitalize">{animal.category || '-'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-lg text-xs font-medium border capitalize ${getStatusBadge(animal.status)}`}>
                                                {animal.status || 'unknown'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => openEditModal(animal)} className="p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-500/20 transition"><EditIcon /></button>
                                                <button onClick={() => setDeleteConfirm(animal.id)} className="p-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/20 transition"><TrashIcon /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={5} className="text-center py-12 text-gray-500">No animals found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-[#2a2a2a] flex items-center justify-between">
                            <h3 className="text-xl font-bold text-white">{editingAnimal ? 'Edit Animal' : 'Add New Animal'}</h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-white transition"><XIcon /></button>
                        </div>
                        <form onSubmit={saveAnimal} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Name *</label>
                                    <input type="text" value={form.name} onChange={(e) => setForm({...form, name: sanitizeInput(e.target.value)})} required
                                        className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#8cff65]" />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Species *</label>
                                    <input type="text" value={form.species} onChange={(e) => setForm({...form, species: sanitizeInput(e.target.value)})} required
                                        className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#8cff65]" />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Category</label>
                                    <input type="text" value={form.category} onChange={(e) => setForm({...form, category: sanitizeInput(e.target.value)})}
                                        className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#8cff65]" placeholder="e.g. Mammal, Bird, Reptile" />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Status</label>
                                    <select value={form.status} onChange={(e) => setForm({...form, status: e.target.value})}
                                        className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#8cff65]">
                                        <option value="healthy">Healthy</option>
                                        <option value="sick">Sick</option>
                                        <option value="recovering">Recovering</option>
                                        <option value="quarantine">Quarantine</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Age</label>
                                    <input type="text" value={form.age} onChange={(e) => setForm({...form, age: sanitizeInput(e.target.value)})}
                                        className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#8cff65]" placeholder="e.g. 5 years" />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Gender</label>
                                    <select value={form.gender} onChange={(e) => setForm({...form, gender: e.target.value})}
                                        className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#8cff65]">
                                        <option value="">Select Gender</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="unknown">Unknown</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm text-gray-400 mb-2">Image URL</label>
                                    <input type="url" value={form.imageUrl} onChange={(e) => setForm({...form, imageUrl: e.target.value})}
                                        className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#8cff65]" placeholder="https://example.com/image.jpg" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm text-gray-400 mb-2">Description</label>
                                    <textarea value={form.description} onChange={(e) => setForm({...form, description: sanitizeInput(e.target.value)})} rows="3"
                                        className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#8cff65] resize-none" />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={closeModal} className="px-6 py-3 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white rounded-xl font-medium transition">Cancel</button>
                                <button type="submit" disabled={saving} className="px-6 py-3 bg-[#8cff65] hover:bg-[#7ae857] text-black rounded-xl font-medium transition disabled:opacity-50">
                                    {saving ? 'Saving...' : (editingAnimal ? 'Update Animal' : 'Add Animal')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold text-white mb-4">Confirm Delete</h3>
                        <p className="text-gray-400 mb-6">Are you sure you want to delete this animal? This action cannot be undone.</p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white rounded-xl transition">Cancel</button>
                            <button onClick={() => deleteAnimal(deleteConfirm)} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffAnimals;
