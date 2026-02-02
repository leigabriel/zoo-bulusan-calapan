import { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api-client';
import { sanitizeInput } from '../../utils/sanitize';

// Icons
const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <circle cx="11" cy="11" r="8"/>
        <path d="m21 21-4.3-4.3"/>
    </svg>
);

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <line x1="12" y1="5" x2="12" y2="19"/>
        <line x1="5" y1="12" x2="19" y2="12"/>
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
        <line x1="10" y1="11" x2="10" y2="17"/>
        <line x1="14" y1="11" x2="14" y2="17"/>
    </svg>
);

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
);

const AnimalsHeaderIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" className="w-6 h-6">
        <path d="M226.5 92.9c14.3 42.9-.3 86.2-32.6 96.8s-70.1-15.6-84.4-58.5s.3-86.2 32.6-96.8s70.1 15.6 84.4 58.5zM100.4 198.6c18.9 32.4 14.3 70.1-10.2 84.1s-59.7-.9-78.5-33.3S-2.7 179.3 21.8 165.3s59.7 .9 78.5 33.3zM69.2 401.2C121.6 259.9 214.7 224 256 224s134.4 35.9 186.8 177.2c3.6 9.7 5.2 20.1 5.2 30.5v1.6c0 25.8-20.9 46.7-46.7 46.7c-11.5 0-22.9-1.4-34-4.2l-88-22c-15.3-3.8-31.3-3.8-46.6 0l-88 22c-11.1 2.8-22.5 4.2-34 4.2C84.9 480 64 459.1 64 433.3v-1.6c0-10.4 1.6-20.8 5.2-30.5zM421.8 282.7c-24.5-14-29.1-51.7-10.2-84.1s54-47.3 78.5-33.3s29.1 51.7 10.2 84.1s-54 47.3-78.5 33.3zM310.1 189.7c-32.3-10.6-46.9-53.9-32.6-96.8s52.1-69.1 84.4-58.5s46.9 53.9 32.6 96.8s-52.1 69.1-84.4 58.5z"/>
    </svg>
);

const SortIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M11 5h10"/>
        <path d="M11 9h7"/>
        <path d="M11 13h4"/>
        <path d="m3 17 3 3 3-3"/>
        <path d="M6 18V4"/>
    </svg>
);

const AdminAnimals = ({ globalSearch = '' }) => {
    const [animals, setAnimals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingAnimal, setEditingAnimal] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortField, setSortField] = useState('name');
    const [sortOrder, setSortOrder] = useState('asc');
    const [speciesFilter, setSpeciesFilter] = useState('all');
    const [form, setForm] = useState({ 
        name: '', 
        species: '', 
        exhibit: '', 
        description: '', 
        imageUrl: '', 
        status: 'healthy' 
    });
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [imageInputMode, setImageInputMode] = useState('url'); // 'url' or 'upload'
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    useEffect(() => { fetchAnimals(); }, []);

    const fetchAnimals = async () => {
        try {
            setLoading(true);
            const res = await adminAPI.getAnimals();
            if (res.success) setAnimals(res.animals || []);
            else throw new Error(res.message || 'Failed to fetch animals');
        } catch (err) {
            console.error(err);
            setError(err.message || 'Error');
        } finally { setLoading(false); }
    };

    const openCreateModal = () => {
        setEditingAnimal(null);
        setForm({ name: '', species: '', exhibit: '', description: '', imageUrl: '', status: 'healthy' });
        setShowModal(true);
    };

    const openEditModal = (animal) => {
        setEditingAnimal(animal);
        setForm({ 
            name: animal.name || '', 
            species: animal.species || '', 
            exhibit: animal.habitat || animal.exhibit || '', 
            description: animal.description || '', 
            imageUrl: animal.image_url || animal.imageUrl || '', 
            status: animal.status || 'healthy'
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingAnimal(null);
        setForm({ name: '', species: '', exhibit: '', description: '', imageUrl: '', status: 'healthy' });
        setImageInputMode('url');
        setImageFile(null);
        setImagePreview(null);
    };

    const handleImageFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            // Create preview URL
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const saveAnimal = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            let imageUrl = form.imageUrl;
            
            // If file was selected for upload, upload it first
            if (imageInputMode === 'upload' && imageFile) {
                const uploadRes = await adminAPI.uploadImage(imageFile);
                if (uploadRes.success) {
                    imageUrl = uploadRes.imageUrl;
                } else {
                    throw new Error(uploadRes.message || 'Failed to upload image');
                }
            }
            
            const animalData = { ...form, imageUrl };
            
            let res;
            if (editingAnimal) {
                res = await adminAPI.updateAnimal(editingAnimal.id, animalData);
            } else {
                res = await adminAPI.createAnimal(animalData);
            }
            if (res.success) {
                await fetchAnimals();
                closeModal();
            } else throw new Error(res.message || 'Save failed');
        } catch (err) { 
            console.error(err); 
            alert(err.message || 'Failed to save animal'); 
        } finally {
            setSaving(false);
        }
    };

    const removeAnimal = async (id) => {
        try {
            const res = await adminAPI.deleteAnimal(id);
            if (res.success) {
                setAnimals(animals.filter(a => a.id !== id));
                setDeleteConfirm(null);
            } else throw new Error(res.message || 'Delete failed');
        } catch (err) { 
            console.error(err); 
            alert(err.message || 'Failed to delete animal'); 
        }
    };

    const getStatusBadgeColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'healthy': return 'bg-[#8cff65]/20 text-[#8cff65] border-[#8cff65]/30';
            case 'sick': return 'bg-red-500/20 text-red-400 border-red-500/30';
            case 'recovering': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            case 'quarantine': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };

    // Get unique species for filter
    const uniqueSpecies = [...new Set(animals.map(a => a.species).filter(Boolean))];

    // Use globalSearch or local searchQuery
    const effectiveSearch = globalSearch || searchQuery;

    // Filter and sort animals
    const filteredAnimals = animals
        .filter(animal => {
            const matchesSearch = 
                animal.name?.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
                animal.species?.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
                (animal.habitat || animal.exhibit || '').toLowerCase().includes(effectiveSearch.toLowerCase()) ||
                animal.description?.toLowerCase().includes(effectiveSearch.toLowerCase());
            const matchesSpecies = speciesFilter === 'all' || animal.species === speciesFilter;
            return matchesSearch && matchesSpecies;
        })
        .sort((a, b) => {
            let aVal, bVal;
            if (sortField === 'exhibit') {
                aVal = (a.habitat || a.exhibit || '').toString().toLowerCase();
                bVal = (b.habitat || b.exhibit || '').toString().toLowerCase();
            } else {
                aVal = (a[sortField] || '').toString().toLowerCase();
                bVal = (b[sortField] || '').toString().toLowerCase();
            }
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

    const animalCounts = {
        total: animals.length,
        healthy: animals.filter(a => a.status === 'healthy').length,
        sick: animals.filter(a => a.status === 'sick').length,
        other: animals.filter(a => !['healthy', 'sick'].includes(a.status)).length,
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-[#8cff65] border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-400">Loading animals...</span>
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
                            <AnimalsHeaderIcon />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{animalCounts.total}</p>
                            <p className="text-xs text-gray-500">Total Animals</p>
                        </div>
                    </div>
                </div>
                <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#8cff65]/10 rounded-xl flex items-center justify-center text-[#8cff65]">
                            <span className="text-lg font-bold">H</span>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{animalCounts.healthy}</p>
                            <p className="text-xs text-gray-500">Healthy</p>
                        </div>
                    </div>
                </div>
                <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center text-red-400">
                            <span className="text-lg font-bold">S</span>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{animalCounts.sick}</p>
                            <p className="text-xs text-gray-500">Sick</p>
                        </div>
                    </div>
                </div>
                <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center text-yellow-400">
                            <span className="text-lg font-bold">O</span>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{animalCounts.other}</p>
                            <p className="text-xs text-gray-500">Other Status</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Card */}
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-[#2a2a2a] flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 flex-wrap">
                        {/* Search */}
                        <div className="relative flex-1 min-w-[200px] max-w-sm">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                <SearchIcon />
                            </div>
                            <input
                                type="text"
                                placeholder="Search animals..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#8cff65] focus:ring-1 focus:ring-[#8cff65]/20 transition-all"
                            />
                        </div>

                        {/* Species Filter */}
                        <div className="relative">
                            <select
                                value={speciesFilter}
                                onChange={(e) => setSpeciesFilter(e.target.value)}
                                className="appearance-none bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl py-2.5 px-4 pr-8 text-sm text-white focus:outline-none focus:border-[#8cff65] cursor-pointer"
                            >
                                <option value="all">All Species</option>
                                {uniqueSpecies.map(species => (
                                    <option key={species} value={species}>{species}</option>
                                ))}
                            </select>
                        </div>

                        {/* Sort Dropdown */}
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
                                <option value="species-asc">Species (A-Z)</option>
                                <option value="species-desc">Species (Z-A)</option>
                                <option value="exhibit-asc">Exhibit (A-Z)</option>
                                <option value="exhibit-desc">Exhibit (Z-A)</option>
                            </select>
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                                <SortIcon />
                            </div>
                        </div>
                    </div>

                    {/* Add Animal Button */}
                    <button
                        onClick={openCreateModal}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#8cff65] to-[#4ade80] text-[#0a0a0a] font-semibold rounded-xl hover:from-[#9dff7a] hover:to-[#5ceb91] transition-all shadow-lg shadow-[#8cff65]/20"
                    >
                        <PlusIcon />
                        Add Animal
                    </button>
                </div>

                {/* Animals Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#1e1e1e]">
                            <tr>
                                <th 
                                    className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white"
                                    onClick={() => toggleSort('name')}
                                >
                                    <div className="flex items-center gap-2">
                                        Name
                                        {sortField === 'name' && (
                                            <span className="text-[#8cff65]">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </div>
                                </th>
                                <th 
                                    className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white"
                                    onClick={() => toggleSort('species')}
                                >
                                    <div className="flex items-center gap-2">
                                        Species
                                        {sortField === 'species' && (
                                            <span className="text-[#8cff65]">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </div>
                                </th>
                                <th 
                                    className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white"
                                    onClick={() => toggleSort('exhibit')}
                                >
                                    <div className="flex items-center gap-2">
                                        Exhibit/Habitat
                                        {sortField === 'exhibit' && (
                                            <span className="text-[#8cff65]">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </div>
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Description</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2a2a2a]">
                            {filteredAnimals.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                        {searchQuery || speciesFilter !== 'all' ? 'No animals match your filters' : 'No animals found'}
                                    </td>
                                </tr>
                            ) : (
                                filteredAnimals.map(animal => (
                                    <tr key={animal.id} className="hover:bg-[#1e1e1e]/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8cff65] to-[#4ade80] flex items-center justify-center text-[#0a0a0a] font-bold overflow-hidden">
                                                    {animal.image_url ? (
                                                        <img src={animal.image_url} alt={animal.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        (animal.name || 'A').charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                                <p className="font-medium text-white">{animal.name}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-300">{animal.species}</td>
                                        <td className="px-6 py-4 text-gray-300">{animal.habitat || animal.exhibit}</td>
                                        <td className="px-6 py-4 text-gray-400 max-w-xs truncate">{animal.description}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border capitalize ${getStatusBadgeColor(animal.status)}`}>
                                                {animal.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openEditModal(animal)}
                                                    className="p-2 bg-[#1e1e1e] hover:bg-[#2a2a2a] border border-[#2a2a2a] hover:border-[#8cff65]/50 text-gray-400 hover:text-[#8cff65] rounded-lg transition-all"
                                                    title="Edit animal"
                                                >
                                                    <EditIcon />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirm(animal)}
                                                    className="p-2 bg-[#1e1e1e] hover:bg-red-500/10 border border-[#2a2a2a] hover:border-red-500/50 text-gray-400 hover:text-red-400 rounded-lg transition-all"
                                                    title="Delete animal"
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
                        Showing {filteredAnimals.length} of {animals.length} animals
                    </p>
                </div>
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-[#2a2a2a] flex items-center justify-between sticky top-0 bg-[#141414]">
                            <h3 className="text-xl font-bold text-white">
                                {editingAnimal ? 'Edit Animal' : 'Add New Animal'}
                            </h3>
                            <button
                                onClick={closeModal}
                                className="p-2 hover:bg-[#1e1e1e] rounded-lg text-gray-400 hover:text-white transition"
                            >
                                <CloseIcon />
                            </button>
                        </div>

                        {/* Modal Form */}
                        <form onSubmit={saveAnimal} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Name *</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={e => setForm({...form, name: sanitizeInput(e.target.value)})}
                                    className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#8cff65] transition-all"
                                    placeholder="e.g., African Lion"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Species *</label>
                                    <input
                                        type="text"
                                        value={form.species}
                                        onChange={e => setForm({...form, species: sanitizeInput(e.target.value)})}
                                        className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#8cff65] transition-all"
                                        placeholder="e.g., Panthera leo"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Exhibit/Habitat *</label>
                                    <input
                                        type="text"
                                        value={form.exhibit}
                                        onChange={e => setForm({...form, exhibit: sanitizeInput(e.target.value)})}
                                        className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#8cff65] transition-all"
                                        placeholder="e.g., Savanna Zone"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
                                <textarea
                                    value={form.description}
                                    onChange={e => setForm({...form, description: sanitizeInput(e.target.value)})}
                                    className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#8cff65] transition-all resize-none"
                                    placeholder="Enter animal description..."
                                    rows={3}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Image</label>
                                
                                {/* Toggle between URL and Upload */}
                                <div className="flex gap-2 mb-3">
                                    <button
                                        type="button"
                                        onClick={() => setImageInputMode('url')}
                                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
                                            imageInputMode === 'url'
                                                ? 'bg-[#8cff65] text-black'
                                                : 'bg-[#1e1e1e] border border-[#2a2a2a] text-gray-400 hover:text-white'
                                        }`}
                                    >
                                        URL
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setImageInputMode('upload')}
                                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
                                            imageInputMode === 'upload'
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
                                        onChange={e => setForm({...form, imageUrl: e.target.value})}
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
                                                        <line x1="18" y1="6" x2="6" y2="18"/>
                                                        <line x1="6" y1="6" x2="18" y2="18"/>
                                                    </svg>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                                
                                {/* URL Preview */}
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

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Status</label>
                                <select
                                    value={form.status}
                                    onChange={e => setForm({...form, status: e.target.value})}
                                    className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#8cff65] transition-all cursor-pointer"
                                >
                                    <option value="healthy">Healthy</option>
                                    <option value="sick">Sick</option>
                                    <option value="recovering">Recovering</option>
                                    <option value="quarantine">Quarantine</option>
                                </select>
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
                                    {saving ? 'Saving...' : (editingAnimal ? 'Update' : 'Add Animal')}
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
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-red-400">
                            <TrashIcon />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Delete Animal?</h3>
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
                                onClick={() => removeAnimal(deleteConfirm.id)}
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

export default AdminAnimals;
