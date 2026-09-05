import { Leaf as PlantIcon, Search as SearchIcon, Sort as SortIcon, Plus as PlusIcon, Edit as EditIcon, Trash as TrashIcon, X as CloseIcon } from 'reicon-react';
import { useEffect, useState, useRef } from 'react';
import { plantAPI, staffAPI } from '../../services/api-client';
import { sanitizeInput } from '../../utils/sanitize';
import { notify } from '../../utils/toast';

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
    const [imageInputMode, setImageInputMode] = useState('upload');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    const [undoItem, setUndoItem] = useState(null);
    const undoTimeoutRef = useRef(null);

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

    const trashPlant = async (plant) => {
        try {
            const res = await staffAPI.deletePlant(plant.id);
            if (res.success) {
                setPlants(plants.filter(p => p.id !== plant.id));
                setUndoItem({ type: 'plant', data: plant });
                if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
                undoTimeoutRef.current = setTimeout(() => setUndoItem(null), 5000);
            }
        } catch {
            notify.error('Failed to move plant to trash');
        }
    };

    const handleUndoTrash = async () => {
        if (!undoItem) return;
        try {
            await staffAPI.restorePlant(undoItem.data.id);
            setPlants(prev => [undoItem.data, ...prev]);
            setUndoItem(null);
            if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
        } catch {
            notify.error('Failed to restore plant');
        }
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
        setImageInputMode('upload');
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
        setImageInputMode('upload');
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
        setImageInputMode('upload');
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
                notify.success(editingPlant ? 'Plant updated.' : 'Plant added.');
                closeModal();
            } else throw new Error(res.message || 'Save failed');
        } catch (err) {
            console.error(err);
            notify.error(err.message || "Couldn't save plant. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const getStatusBadgeColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'healthy': return 'bg-green-400/20 text-green-800 border-green-400/30';
            case 'growing': return 'bg-blue-500/20 text-blue-700 border-blue-500/30';
            case 'dormant': return 'bg-gray-500/20 text-gray-500 border-gray-500/30';
            case 'sick': return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30';
            case 'treatment': return 'bg-red-500/20 text-red-700 border-red-500/30';
            default: return 'bg-gray-500/20 text-gray-500 border-gray-500/30';
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
                    <div className="w-10 h-10 border-4 border-green-400 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-500">Loading plants...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-xl text-red-700">
                {error}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border border-green-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-400/10 rounded-xl flex items-center justify-center text-green-800">
                            <PlantIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{plantCounts.total}</p>
                            <p className="text-xs text-gray-500">Total Plants</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-green-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-400/10 rounded-xl flex items-center justify-center text-green-800">
                            <span className="text-lg font-bold">H</span>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{plantCounts.healthy}</p>
                            <p className="text-xs text-gray-500">Healthy</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-green-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center text-yellow-700">
                            <span className="text-lg font-bold">!</span>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{plantCounts.needsAttention}</p>
                            <p className="text-xs text-gray-500">Needs Attention</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-green-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center text-red-700">
                            <span className="text-lg font-bold">E</span>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{plantCounts.endangered}</p>
                            <p className="text-xs text-gray-500">Endangered</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-green-200 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-green-200 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 flex-wrap">
                        <div className="relative flex-1 min-w-[200px] max-w-sm">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                <SearchIcon className="w-4 h-4" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search plants..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-green-50 border border-green-200 rounded-xl py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-200 transition-all"
                            />
                        </div>

                        <div className="relative">
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="appearance-none bg-green-50 border border-green-200 rounded-xl py-2.5 px-4 pr-8 text-sm text-gray-900 focus:outline-none focus:border-green-400 cursor-pointer"
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
                                className="appearance-none bg-green-50 border border-green-200 rounded-xl py-2.5 pl-10 pr-8 text-sm text-gray-900 focus:outline-none focus:border-green-400 cursor-pointer"
                            >
                                <option value="name-asc">Name (A-Z)</option>
                                <option value="name-desc">Name (Z-A)</option>
                                <option value="category-asc">Category (A-Z)</option>
                                <option value="category-desc">Category (Z-A)</option>
                                <option value="location-asc">Location (A-Z)</option>
                                <option value="location-desc">Location (Z-A)</option>
                            </select>
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                                <SortIcon className="w-4 h-4" />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={openCreateModal}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-300 via-green-400 to-green-500 text-gray-900 font-semibold rounded-xl hover:from-green-300 hover:via-green-400 hover:to-green-500 transition-all shadow-lg shadow-green-300/50"
                        >
                            <PlusIcon className="w-5 h-5" />
                            Add Plant
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-green-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-900" onClick={() => toggleSort('name')}>
                                    <div className="flex items-center gap-2">
                                        Name
                                        {sortField === 'name' && <span className="text-green-800">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                                    </div>
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Scientific Name</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-900" onClick={() => toggleSort('category')}>
                                    <div className="flex items-center gap-2">
                                        Category
                                        {sortField === 'category' && <span className="text-green-800">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                                    </div>
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-900" onClick={() => toggleSort('location')}>
                                    <div className="flex items-center gap-2">
                                        Location
                                        {sortField === 'location' && <span className="text-green-800">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                                    </div>
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-green-200">
                            {filteredPlants.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                        {searchQuery || categoryFilter !== 'all' ? 'No plants match your filters' : 'No plants found'}
                                    </td>
                                </tr>
                            ) : (
                                filteredPlants.map(plant => (
                                    <tr key={plant.id} className="cursor-pointer hover:bg-green-50/50 transition-colors" title="Open plant details">
                                        <td className="px-6 py-4" onClick={() => openEditModal(plant)}>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-300 via-green-400 to-green-500 flex items-center justify-center text-gray-900 font-bold overflow-hidden">
                                                    {plant.image_url ? (
                                                        <img src={plant.image_url} alt={plant.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        (plant.name || 'P').charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{plant.name}</p>
                                                    {plant.is_endangered && (
                                                        <span className="text-[10px] text-red-700 font-medium">Endangered</span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 italic" onClick={() => openEditModal(plant)}>{plant.scientific_name || '-'}</td>
                                        <td className="px-6 py-4 text-gray-700" onClick={() => openEditModal(plant)}>{plant.category || '-'}</td>
                                        <td className="px-6 py-4 text-gray-700" onClick={() => openEditModal(plant)}>{plant.location || '-'}</td>
                                        <td className="px-6 py-4" onClick={() => openEditModal(plant)}>
                                            <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border capitalize ${getStatusBadgeColor(plant.status)}`}>
                                                {plant.status?.replace('_', ' ') || 'unknown'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={(event) => { event.stopPropagation(); openEditModal(plant); }}
                                                    className="p-2 bg-green-50 hover:bg-green-50 border border-green-200 hover:border-green-400/50 text-gray-500 hover:text-green-800 rounded-lg transition-all"
                                                    title="Edit plant"
                                                >
                                                    <EditIcon className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={(event) => { event.stopPropagation(); trashPlant(plant); }}
                                                    className="p-2 bg-green-50 hover:bg-red-500/10 border border-green-200 hover:border-red-500/50 text-gray-500 hover:text-red-700 rounded-lg transition-all"
                                                    title="Move to trash"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="px-6 py-4 border-t border-green-200 flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                        Showing {filteredPlants.length} of {plants.length} plant{plants.length !== 1 ? 's' : ''}
                    </p>
                </div>
            </div>

            {undoItem && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-4 animate-slide-up">
                    <span className="text-sm">Plant moved to trash</span>
                    <button onClick={handleUndoTrash} className="text-sm font-semibold text-green-400 hover:text-green-300 transition-colors">Undo</button>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white border border-green-200 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-green-200 flex items-center justify-between sticky top-0 bg-white">
                            <h3 className="text-xl font-bold text-gray-900">
                                {editingPlant ? 'Edit Plant' : 'Add New Plant'}
                            </h3>
                            <button onClick={closeModal} className="p-2 hover:bg-green-50 rounded-lg text-gray-500 hover:text-gray-900 transition">
                                <CloseIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={savePlant} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-2">Name *</label>
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={e => setForm({ ...form, name: sanitizeInput(e.target.value) })}
                                        className="w-full bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-green-400 transition-all"
                                        placeholder="e.g., Narra Tree"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-2">Scientific Name</label>
                                    <input
                                        type="text"
                                        value={form.scientificName}
                                        onChange={e => setForm({ ...form, scientificName: sanitizeInput(e.target.value) })}
                                        className="w-full bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-green-400 transition-all italic"
                                        placeholder="e.g., Pterocarpus indicus"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-2">Category</label>
                                    <select
                                        value={form.category}
                                        onChange={e => setForm({ ...form, category: e.target.value })}
                                        className="w-full bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-green-400 transition-all capitalize"
                                    >
                                        {categoryOptions.map(cat => (
                                            <option key={cat} value={cat} className="capitalize">{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-2">Status</label>
                                    <select
                                        value={form.status}
                                        onChange={e => setForm({ ...form, status: e.target.value })}
                                        className="w-full bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-green-400 transition-all capitalize"
                                    >
                                        {statusOptions.map(s => (
                                            <option key={s} value={s} className="capitalize">{s}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-2">Location</label>
                                    <input
                                        type="text"
                                        value={form.location}
                                        onChange={e => setForm({ ...form, location: sanitizeInput(e.target.value) })}
                                        className="w-full bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-green-400 transition-all"
                                        placeholder="e.g., Garden Area A"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-2">Description</label>
                                <textarea
                                    value={form.description}
                                    onChange={e => setForm({ ...form, description: sanitizeInput(e.target.value) })}
                                    className="w-full bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-green-400 transition-all resize-none"
                                    placeholder="Enter plant description..."
                                    rows={3}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-2">Image</label>

                                <div className="space-y-3">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageFileChange}
                                        className="w-full bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-green-400 file:text-gray-900 file:font-medium file:cursor-pointer hover:file:bg-green-400"
                                    />
                                    {(imagePreview || form.imageUrl) && (
                                        <div className="relative">
                                            <img
                                                src={imagePreview || form.imageUrl}
                                                alt="Preview"
                                                className="w-full h-40 object-cover rounded-xl"
                                                onError={(e) => e.target.style.display = 'none'}
                                                onLoad={(e) => e.target.style.display = 'block'}
                                            />
                                            {imagePreview && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setImageFile(null);
                                                        setImagePreview(null);
                                                    }}
                                                    className="absolute top-2 right-2 p-1.5 bg-red-600 rounded-lg text-white hover:bg-red-700"
                                                >
                                                    <CloseIcon strokeWidth="2" className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 py-3 bg-green-50 hover:bg-green-50 text-gray-700 font-medium rounded-xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 py-3 bg-gradient-to-r from-green-300 via-green-400 to-green-500 text-gray-900 font-semibold rounded-xl hover:from-green-300 hover:via-green-400 hover:to-green-500 transition-all disabled:opacity-50"
                                >
                                    {saving ? 'Saving...' : (editingPlant ? 'Update' : 'Add Plant')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffPlants;
