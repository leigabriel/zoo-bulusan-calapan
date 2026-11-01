import { Edit as ReiconEdit, Leaf as ReiconLeaf, Plus as ReiconPlus, Search as ReiconSearch, Sort as ReiconSort, Trash as ReiconTrash, X as ReiconX } from 'reicon-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { plantAPI, adminAPI } from '../../services/api-client';
import ConfirmModal from '../../components/common/ConfirmModal';
import useScrollLock from '../../hooks/use-scroll-lock';
import { sanitizeInput } from '../../utils/sanitize';
import { notify } from '../../utils/toast';

const SearchIcon = () => (
    <ReiconSearch strokeWidth="2" className="w-4 h-4" />
);

const PlusIcon = () => (
    <ReiconPlus strokeWidth="2" className="w-5 h-5" />
);

const EditIcon = () => (
    <ReiconEdit strokeWidth="2" className="w-4 h-4" />
);

const TrashIcon = ({ className = 'w-4 h-4' }) => (
    <ReiconTrash strokeWidth="2" className={className} />
);

const CloseIcon = () => (
    <ReiconX strokeWidth="2" className="w-5 h-5" />
);

const PlantIcon = () => (
    <ReiconLeaf className="w-6 h-6" weight="Filled" />
);

const SortIcon = () => (
    <ReiconSort strokeWidth="2" className="w-4 h-4" />
);

// Mirrors the plants.category ENUM so every option can actually be saved.
const PLANT_CATEGORIES = ['trees', 'shrubs', 'flowers', 'ferns', 'grasses', 'palms', 'succulents', 'vines', 'herbs', 'aquatic'];

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const emptyForm = () => ({
    name: '',
    scientificName: '',
    category: 'trees',
    description: '',
    imageUrl: ''
});


const AdminPlants = ({ globalSearch = '' }) => {
    const [plants, setPlants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingPlant, setEditingPlant] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortField, setSortField] = useState('name');
    const [sortOrder, setSortOrder] = useState('asc');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [selectedIds, setSelectedIds] = useState([]);
    const [deleting, setDeleting] = useState(false);
    const [trashTarget, setTrashTarget] = useState(null);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const fileInputRef = useRef(null);

    useScrollLock(showModal);

    useEffect(() => { fetchPlants(); }, []);

    const fetchPlants = async () => {
        try {
            setLoading(true);
            const res = await plantAPI.getAll();
            if (res.success) setPlants(res.plants || []);
            else throw new Error(res.message || 'Failed to fetch plants');
        } catch (err) {
            setError(err.message || 'Error');
        } finally { setLoading(false); }
    };

    const openCreateModal = () => {
        setEditingPlant(null);
        setForm(emptyForm());
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setShowModal(true);
    };

    const openEditModal = (plant) => {
        setEditingPlant(plant);
        setForm({
            name: plant.name || '',
            scientificName: plant.scientific_name || '',
            category: plant.category || 'trees',
            description: plant.description || '',
            imageUrl: plant.image_url || ''
        });
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setShowModal(true);
    };

    const closeModal = useCallback(() => {
        setShowModal(false);
        setEditingPlant(null);
        setForm(emptyForm());
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, []);

    useEffect(() => {
        if (!showModal) return undefined;

        const handleKeyDown = (event) => {
            if (event.key === 'Escape' && !saving) closeModal();
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [showModal, saving, closeModal]);

    const handleImageFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            notify.error('Please choose a JPG, PNG, or WebP image.');
            e.target.value = '';
            return;
        }

        if (file.size > MAX_IMAGE_SIZE) {
            notify.error('Image must be 5 MB or smaller.');
            e.target.value = '';
            return;
        }

        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result);
        reader.readAsDataURL(file);
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview(null);
        setForm(prev => ({ ...prev, imageUrl: '' }));
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const savePlant = async (e) => {
        e.preventDefault();

        const name = form.name.trim();
        if (!name) {
            notify.error('Plant name is required.');
            return;
        }

        setSaving(true);
        try {
            let imageUrl = form.imageUrl;
            if (imageFile) {
                const uploadRes = await adminAPI.uploadPlantImage(imageFile);
                if (uploadRes.success) {
                    imageUrl = uploadRes.imageUrl;
                } else {
                    throw new Error(uploadRes.message || 'Failed to upload image');
                }
            }

            const plantData = {
                name,
                scientificName: form.scientificName.trim() || null,
                category: form.category,
                description: form.description.trim() || null,
                imageUrl: imageUrl || null
            };

            let res;
            if (editingPlant) {
                res = await plantAPI.update(editingPlant.id, plantData, 'admin');
            } else {
                res = await plantAPI.create(plantData, 'admin');
            }
            if (res.success) {
                await fetchPlants();
                notify.success(editingPlant ? 'Plant updated.' : 'Plant added.');
                closeModal();
            } else throw new Error(res.message || 'Save failed');
        } catch (err) {
            notify.error(err.message || "Couldn't save plant. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    // ==================== TRASH HANDLERS ====================

    const trashPlant = async (plant) => {
        try {
            const res = await adminAPI.deletePlant(plant.id);
            if (res.success) {
                setPlants(plants.filter(p => p.id !== plant.id));
                notify.success('Plant moved to trash.', {
                    action: {
                        label: 'Undo',
                        onClick: async () => {
                            try {
                                await adminAPI.restorePlant(plant.id);
                                setPlants(prev => [plant, ...prev]);
                                notify.success('Plant restored.');
                            } catch {
                                notify.error('Failed to restore plant');
                            }
                        },
                        successLabel: 'Restored'
                    }
                });
            }
        } catch {
            notify.error('Failed to move plant to trash');
        }
    };

    const handleConfirmTrash = async () => {
        if (!trashTarget) return;
        setDeleting(true);
        await trashPlant(trashTarget);
        setTrashTarget(null);
        setDeleting(false);
    };

    const handleConfirmBulkTrash = async () => {
        setDeleting(true);
        await trashSelected();
        setShowBulkModal(false);
        setDeleting(false);
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
            if (sortOrder === 'asc') return aVal.localeCompare(bVal);
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
        needsAttention: plants.filter(p => p.status === 'sick' || p.status === 'treatment').length,
        endangered: plants.filter(p => p.is_endangered).length,
    };

    const allFilteredSelected = filteredPlants.length > 0 && filteredPlants.every(p => selectedIds.includes(p.id));

    const toggleSelect = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        if (allFilteredSelected) setSelectedIds([]);
        else setSelectedIds([...new Set([...selectedIds, ...filteredPlants.map(p => p.id)])]);
    };

    const trashSelected = async () => {
        const selectedPlants = filteredPlants.filter(p => selectedIds.includes(p.id));
        if (selectedPlants.length === 0) return;
        try {
            await Promise.all(selectedPlants.map(p => adminAPI.deletePlant(p.id)));
            setPlants(prev => prev.filter(p => !selectedIds.includes(p.id)));
            setSelectedIds([]);
            const count = selectedPlants.length;
            notify.success(`${count} plant${count > 1 ? 's' : ''} moved to trash.`, {
                action: {
                    label: 'Undo',
                    onClick: async () => {
                        try {
                            await Promise.all(selectedPlants.map(p => adminAPI.restorePlant(p.id)));
                            setPlants(prev => [...selectedPlants, ...prev]);
                            notify.success('Plants restored.');
                        } catch {
                            notify.error('Failed to restore plants');
                        }
                    },
                    successLabel: 'Restored'
                }
            });
        } catch {
            notify.error('Failed to move plants to trash');
        }
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
                            <PlantIcon />
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
                                <SearchIcon />
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
                                <SortIcon />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={openCreateModal}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-300 via-green-400 to-green-500 text-gray-900 font-semibold rounded-xl transition-all shadow-lg shadow-green-300/50"
                        >
                            <PlusIcon />
                            Add Plant
                        </button>
                    </div>
                </div>

                {selectedIds.length > 0 && (
                    <div className="flex items-center justify-between gap-3 px-6 py-3 bg-green-50 border-b border-green-200">
                        <span className="text-sm font-medium text-gray-700">{selectedIds.length} selected</span>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setSelectedIds([])} className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition">
                                Cancel
                            </button>
                            <button onClick={() => setShowBulkModal(true)} className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-red-700 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg transition">
                                <ReiconTrash strokeWidth="2" className="w-4 h-4" /> Trash selected ({selectedIds.length})
                            </button>
                        </div>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-green-50">
                            <tr>
                                <th className="px-6 py-4 text-left w-12">
                                    <input type="checkbox" checked={allFilteredSelected} onChange={toggleSelectAll} className="w-4 h-4 accent-green-500 cursor-pointer" aria-label="Select all plants" />
                                </th>
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
                                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                                        {searchQuery || categoryFilter !== 'all' ? 'No plants match your filters' : 'No plants found'}
                                    </td>
                                </tr>
                            ) : (
                                filteredPlants.map(plant => (
                                    <tr key={plant.id} className="hover:bg-green-50/50 transition-colors">
                                        <td className="px-6 py-4 w-12">
                                            <input type="checkbox" checked={selectedIds.includes(plant.id)} onChange={() => toggleSelect(plant.id)} onClick={(e) => e.stopPropagation()} className="w-4 h-4 accent-green-500 cursor-pointer" aria-label={`Select ${plant.name}`} />
                                        </td>
                                        <td className="px-6 py-4 cursor-pointer" onClick={() => openEditModal(plant)}>
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
                                        <td className="px-6 py-4 text-gray-500 italic cursor-pointer" onClick={() => openEditModal(plant)}>{plant.scientific_name || '-'}</td>
                                        <td className="px-6 py-4 text-gray-700 cursor-pointer" onClick={() => openEditModal(plant)}>{plant.category || '-'}</td>
                                        <td className="px-6 py-4 text-gray-700 cursor-pointer" onClick={() => openEditModal(plant)}>{plant.location || '-'}</td>
                                        <td className="px-6 py-4 cursor-pointer" onClick={() => openEditModal(plant)}>
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
                                                    <EditIcon />
                                                </button>
                                                <button
                                                    onClick={(event) => { event.stopPropagation(); setTrashTarget(plant); }}
                                                    className="p-2 bg-green-50 hover:bg-red-500/10 border border-green-200 hover:border-red-500/50 text-gray-500 hover:text-red-700 rounded-lg transition-all"
                                                    title="Move to trash"
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

                <div className="px-6 py-4 border-t border-green-200 flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                        Showing {filteredPlants.length} of {plants.length} plants
                    </p>
                </div>
            </div>

            {trashTarget && (
                <ConfirmModal
                    title={`Delete ${trashTarget.name || 'Plant'}?`}
                    message={`Are you sure you want to move this plant to the trash? You can undo this action from the toast notification.`}
                    confirmLabel="Yes, Move to Trash"
                    loading={deleting}
                    onCancel={() => setTrashTarget(null)}
                    onConfirm={handleConfirmTrash}
                />
            )}

            {showBulkModal && (
                <ConfirmModal
                    title={`Delete ${selectedIds.length} Plants?`}
                    message={`Are you sure you want to move ${selectedIds.length} selected plants to the trash? You can undo this action from the toast notification.`}
                    confirmLabel="Yes, Move to Trash"
                    loading={deleting}
                    onCancel={() => setShowBulkModal(false)}
                    onConfirm={handleConfirmBulkTrash}
                />
            )}

            {showModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
                    onClick={(event) => {
                        if (event.target === event.currentTarget && !saving) closeModal();
                    }}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="plant-modal-title"
                        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-green-200 bg-white"
                    >
                        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-green-200 bg-white p-6">
                            <h3 id="plant-modal-title" className="text-xl font-bold text-gray-900">
                                {editingPlant ? 'Edit Plant' : 'Add New Plant'}
                            </h3>
                            <button
                                type="button"
                                onClick={closeModal}
                                className="rounded-lg p-2 text-gray-500 transition hover:bg-green-50 hover:text-gray-900"
                                aria-label="Close plant form"
                            >
                                <CloseIcon />
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
                                        maxLength={100}
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
                                        maxLength={150}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-2">Category</label>
                                <select
                                    value={form.category}
                                    onChange={e => setForm({ ...form, category: e.target.value })}
                                    className="w-full bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-green-400 transition-all capitalize"
                                >
                                    {PLANT_CATEGORIES.map(cat => (
                                        <option key={cat} value={cat} className="capitalize">{cat}</option>
                                    ))}
                                </select>
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
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={handleImageFileChange}
                                        className="w-full bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-green-400 file:text-gray-900 file:font-medium file:cursor-pointer hover:file:bg-green-400"
                                    />
                                    <p className="text-xs text-gray-500">JPG, PNG, or WebP. Maximum 5 MB.</p>
                                    {(imagePreview || form.imageUrl) && (
                                        <div className="relative">
                                            <img
                                                src={imagePreview || form.imageUrl}
                                                alt={form.name ? `${form.name} preview` : 'Plant image preview'}
                                                className="w-full h-40 object-cover rounded-xl"
                                                onError={(e) => { e.target.style.display = 'none'; }}
                                                onLoad={(e) => { e.target.style.display = 'block'; }}
                                            />
                                            <button
                                                type="button"
                                                onClick={handleRemoveImage}
                                                className="absolute top-2 right-2 p-1.5 bg-red-600 rounded-lg text-white hover:bg-red-700"
                                                aria-label="Remove image"
                                            >
                                                <ReiconX strokeWidth="2" className="w-4 h-4" />
                                            </button>
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
                                    className="flex-1 py-3 bg-gradient-to-r from-green-300 via-green-400 to-green-500 text-gray-900 font-semibold rounded-xl transition-all disabled:opacity-50"
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

export default AdminPlants;
