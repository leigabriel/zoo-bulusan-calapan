import { useEffect, useState } from 'react';
import { plantAPI, staffAPI } from '../../services/api-client';
import { sanitizeInput } from '../../utils/sanitize';
import { notify } from '../../utils/toast';

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

const PlantIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path fillRule="evenodd" d="M12.963 2.286a.75.75 0 00-1.071-.136 9.742 9.742 0 00-3.539 6.177A7.547 7.547 0 016.648 6.61a.75.75 0 00-1.152-.082A9 9 0 1015.68 4.534a7.46 7.46 0 01-2.717-2.248zM15.75 14.25a3.75 3.75 0 11-7.313-1.172c.628.465 1.35.81 2.133 1a5.99 5.99 0 011.925-3.546 3.75 3.75 0 013.255 3.718z" clipRule="evenodd" />
    </svg>
);

const SortIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M11 5h10" />
        <path d="M11 9h7" />
        <path d="M11 13h4" />
        <path d="m3 17 3 3 3-3" />
        <path d="M6 18V4" />
    </svg>
);

const StaffPlants = ({ globalSearch = '' }) => {
    const [plants, setPlants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingPlant, setEditingPlant] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortField, setSortField] = useState('name');
    const [sortOrder, setSortOrder] = useState('asc');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [form, setForm] = useState({
        name: '',
        scientificName: '',
        category: 'trees',
        description: '',
        location: '',
        status: 'healthy',
        imageUrl: ''
    });
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [imageInputMode, setImageInputMode] = useState('url');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    const categoryOptions = ['trees', 'shrubs', 'flowers', 'ferns', 'palms', 'succulents', 'aquatic', 'medicinal'];
    const statusOptions = ['healthy', 'growing', 'dormant', 'sick', 'treatment'];

    useEffect(() => { fetchPlants(); }, []);

    const fetchPlants = async () => {
        try {
            setLoading(true);
            const res = await plantAPI.getAll();
            if (res.success) setPlants(res.plants || []);
            else throw new Error(res.message || 'Failed to fetch plants');
        } catch (err) {
            console.error(err);
            setError(err.message || 'Error');
        } finally { setLoading(false); }
    };

    const openCreateModal = () => {
        setEditingPlant(null);
        setForm({
            name: '',
            scientificName: '',
            category: 'trees',
            description: '',
            location: '',
            status: 'healthy',
            imageUrl: ''
        });
        setImageInputMode('url');
        setImageFile(null);
        setImagePreview(null);
        setShowModal(true);
    };

    const openEditModal = (plant) => {
        setEditingPlant(plant);
        setForm({
            name: plant.name || '',
            scientificName: plant.scientific_name || '',
            category: plant.category || 'trees',
            description: plant.description || '',
            location: plant.location || '',
            status: plant.status || 'healthy',
            imageUrl: plant.image_url || ''
        });
        setImageInputMode('url');
        setImageFile(null);
        setImagePreview(null);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingPlant(null);
        setForm({
            name: '',
            scientificName: '',
            category: 'trees',
            description: '',
            location: '',
            status: 'healthy',
            imageUrl: ''
        });
        setImageInputMode('url');
        setImageFile(null);
        setImagePreview(null);
    };

    const handleImageFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const savePlant = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            let imageUrl = form.imageUrl;

            // if file was selected for upload, upload it first
            if (imageInputMode === 'upload' && imageFile) {
                const uploadRes = await staffAPI.uploadPlantImage(imageFile);
                if (uploadRes.success) {
                    imageUrl = uploadRes.imageUrl;
                } else {
                    throw new Error(uploadRes.message || 'Failed to upload image');
                }
            }

            const plantData = {
                name: form.name,
                scientificName: form.scientificName,
                category: form.category,
                description: form.description,
                location: form.location,
                status: form.status,
                imageUrl: imageUrl
            };

            let res;
            if (editingPlant) {
                res = await plantAPI.update(editingPlant.id, plantData, 'staff');
            } else {
                res = await plantAPI.create(plantData, 'staff');
            }
            if (res.success) {
                await fetchPlants();
                closeModal();
            } else throw new Error(res.message || 'Save failed');
        } catch (err) {
            console.error(err);
            notify.error(err.message || 'We could not save this plant right now.');
        } finally {
            setSaving(false);
        }
    };

    const removePlant = async (id) => {
        try {
            const res = await plantAPI.delete(id, 'staff');
            if (res.success) {
                setPlants(plants.filter(p => p.id !== id));
                setDeleteConfirm(null);
            } else throw new Error(res.message || 'Delete failed');
        } catch (err) {
            console.error(err);
            notify.error(err.message || 'We could not remove this plant right now.');
        }
    };

    const getStatusBadgeColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'healthy': return 'bg-[#8cff65]/20 text-[#8cff65] border-[#8cff65]/30';
            case 'growing': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'dormant': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
            case 'sick': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            case 'treatment': return 'bg-red-500/20 text-red-400 border-red-500/30';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };

    const uniqueCategories = [...new Set(plants.map(p => p.category).filter(Boolean))];
    const effectiveSearch = globalSearch || searchQuery;

    const filteredPlants = plants
        .filter(plant => {
            const matchesSearch =
                plant.name?.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
                plant.scientific_name?.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
                plant.category?.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
                plant.location?.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
                plant.description?.toLowerCase().includes(effectiveSearch.toLowerCase());
            const matchesCategory = categoryFilter === 'all' || plant.category === categoryFilter;
            return matchesSearch && matchesCategory;
        })
        .sort((a, b) => {
            const aVal = (a[sortField] || '').toString().toLowerCase();
            const bVal = (b[sortField] || '').toString().toLowerCase();
            if (sortOrder === 'asc') {
                return aVal.localeCompare(bVal);
            }
            return bVal.localeCompare(aVal);
        });

    const toggleSort = (field) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    const plantCounts = {
        total: plants.length,
        healthy: plants.filter(p => p.status === 'healthy').length,
        needsAttention: plants.filter(p => p.status === 'needs_attention').length,
        endangered: plants.filter(p => p.is_endangered).length,
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-[#8cff65] border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-400">Loading plants...</span>
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#8cff65]/10 rounded-xl flex items-center justify-center text-[#8cff65]">
                            <PlantIcon />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{plantCounts.total}</p>
                            <p className="text-xs text-gray-500">Total Plants</p>
                        </div>
                    </div>
                </div>
                <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#8cff65]/10 rounded-xl flex items-center justify-center text-[#8cff65]">
                            <span className="text-lg font-bold">H</span>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{plantCounts.healthy}</p>
                            <p className="text-xs text-gray-500">Healthy</p>
                        </div>
                    </div>
                </div>
                <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center text-yellow-400">
                            <span className="text-lg font-bold">!</span>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{plantCounts.needsAttention}</p>
                            <p className="text-xs text-gray-500">Needs Attention</p>
                        </div>
                    </div>
                </div>
                <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center text-red-400">
                            <span className="text-lg font-bold">E</span>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{plantCounts.endangered}</p>
                            <p className="text-xs text-gray-500">Endangered</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-[#2a2a2a] flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 flex-wrap">
                        <div className="relative flex-1 min-w-[200px] max-w-sm">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                <SearchIcon />
                            </div>
                            <input
                                type="text"
                                placeholder="Search plants..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#8cff65] focus:ring-1 focus:ring-[#8cff65]/20 transition-all"
                            />
                        </div>

                        <div className="relative">
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="appearance-none bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl py-2.5 px-4 pr-8 text-sm text-white focus:outline-none focus:border-[#8cff65] cursor-pointer"
                            >
                                <option value="all">All Categories</option>
                                {uniqueCategories.map(category => (
                                    <option key={category} value={category}>{category}</option>
                                ))}
                            </select>
                        </div>

                        <div className="relative">
                            <select
                                value={`${sortField}-${sortOrder}`}
                                onChange={(e) => {
                                    const [field, order] = e.target.value.split('-');
                                    setSortField(field);
                                    setSortOrder(order);
                                }}
                                className="appearance-none bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl py-2.5 pl-10 pr-8 text-sm text-white focus:outline-none focus:border-[#8cff65] cursor-pointer"
                            >
                                <option value="name-asc">Name (A-Z)</option>
                                <option value="name-desc">Name (Z-A)</option>
                                <option value="category-asc">Category (A-Z)</option>
                                <option value="category-desc">Category (Z-A)</option>
                                <option value="location-asc">Location (A-Z)</option>
                                <option value="location-desc">Location (Z-A)</option>
                            </select>
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                                <SortIcon />
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={openCreateModal}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#8cff65] to-[#4ade80] text-[#0a0a0a] font-semibold rounded-xl hover:from-[#9dff7a] hover:to-[#5ceb91] transition-all shadow-lg shadow-[#8cff65]/20"
                    >
                        <PlusIcon />
                        Add Plant
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#1e1e1e]">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => toggleSort('name')}>
                                    <div className="flex items-center gap-2">
                                        Name
                                        {sortField === 'name' && <span className="text-[#8cff65]">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                                    </div>
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Scientific Name</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => toggleSort('category')}>
                                    <div className="flex items-center gap-2">
                                        Category
                                        {sortField === 'category' && <span className="text-[#8cff65]">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                                    </div>
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => toggleSort('location')}>
                                    <div className="flex items-center gap-2">
                                        Location
                                        {sortField === 'location' && <span className="text-[#8cff65]">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                                    </div>
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2a2a2a]">
                            {filteredPlants.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                        {searchQuery || categoryFilter !== 'all' ? 'No plants match your filters' : 'No plants found'}
                                    </td>
                                </tr>
                            ) : (
                                filteredPlants.map(plant => (
                                    <tr key={plant.id} className="hover:bg-[#1e1e1e]/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8cff65] to-[#4ade80] flex items-center justify-center text-[#0a0a0a] font-bold overflow-hidden">
                                                    {plant.image_url ? (
                                                        <img src={plant.image_url} alt={plant.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        (plant.name || 'P').charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-white">{plant.name}</p>
                                                    {plant.is_endangered && (
                                                        <span className="text-[10px] text-red-400 font-medium">Endangered</span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-400 italic">{plant.scientific_name || '-'}</td>
                                        <td className="px-6 py-4 text-gray-300">{plant.category || '-'}</td>
                                        <td className="px-6 py-4 text-gray-300">{plant.location || '-'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border capitalize ${getStatusBadgeColor(plant.status)}`}>
                                                {plant.status?.replace('_', ' ') || 'unknown'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openEditModal(plant)}
                                                    className="p-2 bg-[#1e1e1e] hover:bg-[#2a2a2a] border border-[#2a2a2a] hover:border-[#8cff65]/50 text-gray-400 hover:text-[#8cff65] rounded-lg transition-all"
                                                    title="Edit plant"
                                                >
                                                    <EditIcon />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirm(plant)}
                                                    className="p-2 bg-[#1e1e1e] hover:bg-red-500/10 border border-[#2a2a2a] hover:border-red-500/50 text-gray-400 hover:text-red-400 rounded-lg transition-all"
                                                    title="Delete plant"
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

                <div className="px-6 py-4 border-t border-[#2a2a2a] flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                        Showing {filteredPlants.length} of {plants.length} plants
                    </p>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-[#2a2a2a] flex items-center justify-between sticky top-0 bg-[#141414]">
                            <h3 className="text-xl font-bold text-white">
                                {editingPlant ? 'Edit Plant' : 'Add New Plant'}
                            </h3>
                            <button onClick={closeModal} className="p-2 hover:bg-[#1e1e1e] rounded-lg text-gray-400 hover:text-white transition">
                                <CloseIcon />
                            </button>
                        </div>

                        <form onSubmit={savePlant} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Name *</label>
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={e => setForm({ ...form, name: sanitizeInput(e.target.value) })}
                                        className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#8cff65] transition-all"
                                        placeholder="e.g., Narra Tree"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Scientific Name</label>
                                    <input
                                        type="text"
                                        value={form.scientificName}
                                        onChange={e => setForm({ ...form, scientificName: sanitizeInput(e.target.value) })}
                                        className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#8cff65] transition-all italic"
                                        placeholder="e.g., Pterocarpus indicus"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Category</label>
                                    <select
                                        value={form.category}
                                        onChange={e => setForm({ ...form, category: e.target.value })}
                                        className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#8cff65] transition-all capitalize"
                                    >
                                        {categoryOptions.map(cat => (
                                            <option key={cat} value={cat} className="capitalize">{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Status</label>
                                    <select
                                        value={form.status}
                                        onChange={e => setForm({ ...form, status: e.target.value })}
                                        className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#8cff65] transition-all capitalize"
                                    >
                                        {statusOptions.map(s => (
                                            <option key={s} value={s} className="capitalize">{s}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Location</label>
                                    <input
                                        type="text"
                                        value={form.location}
                                        onChange={e => setForm({ ...form, location: sanitizeInput(e.target.value) })}
                                        className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#8cff65] transition-all"
                                        placeholder="e.g., Garden Area A"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
                                <textarea
                                    value={form.description}
                                    onChange={e => setForm({ ...form, description: sanitizeInput(e.target.value) })}
                                    className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#8cff65] transition-all resize-none"
                                    placeholder="Enter plant description..."
                                    rows={3}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Image</label>

                                {/* toggle between url and upload */}
                                <div className="flex gap-2 mb-3">
                                    <button
                                        type="button"
                                        onClick={() => setImageInputMode('url')}
                                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${imageInputMode === 'url'
                                                ? 'bg-[#8cff65] text-black'
                                                : 'bg-[#1e1e1e] border border-[#2a2a2a] text-gray-400 hover:text-white'
                                            }`}
                                    >
                                        URL
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setImageInputMode('upload')}
                                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${imageInputMode === 'upload'
                                                ? 'bg-[#8cff65] text-black'
                                                : 'bg-[#1e1e1e] border border-[#2a2a2a] text-gray-400 hover:text-white'
                                            }`}
                                    >
                                        Upload
                                    </button>
                                </div>

                                {imageInputMode === 'url' ? (
                                    <input
                                        type="url"
                                        value={form.imageUrl}
                                        onChange={e => setForm({ ...form, imageUrl: e.target.value })}
                                        className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#8cff65] transition-all"
                                        placeholder="https://example.com/image.jpg"
                                    />
                                ) : (
                                    <div className="space-y-3">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageFileChange}
                                            className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#8cff65] file:text-black file:font-medium file:cursor-pointer hover:file:bg-[#7ae857]"
                                        />
                                        {imagePreview && (
                                            <div className="relative">
                                                <img
                                                    src={imagePreview}
                                                    alt="Preview"
                                                    className="w-full h-40 object-cover rounded-xl"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setImageFile(null);
                                                        setImagePreview(null);
                                                    }}
                                                    className="absolute top-2 right-2 p-1.5 bg-red-500 rounded-lg text-white hover:bg-red-600"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                                                        <line x1="18" y1="6" x2="6" y2="18" />
                                                        <line x1="6" y1="6" x2="18" y2="18" />
                                                    </svg>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* url preview */}
                                {imageInputMode === 'url' && form.imageUrl && (
                                    <div className="mt-3">
                                        <img
                                            src={form.imageUrl}
                                            alt="Preview"
                                            className="w-full h-40 object-cover rounded-xl"
                                            onError={(e) => e.target.style.display = 'none'}
                                            onLoad={(e) => e.target.style.display = 'block'}
                                        />
                                    </div>
                                )}
                            </div>

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
                                    {saving ? 'Saving...' : (editingPlant ? 'Update' : 'Add Plant')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl w-full max-w-sm p-6 text-center">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-red-400">
                            <TrashIcon />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Delete Plant?</h3>
                        <p className="text-gray-400 mb-6">
                            Are you sure you want to delete <span className="text-white font-medium">{deleteConfirm.name}</span>? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 py-3 bg-[#1e1e1e] hover:bg-[#2a2a2a] text-gray-300 font-medium rounded-xl transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => removePlant(deleteConfirm.id)}
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

export default StaffPlants;
