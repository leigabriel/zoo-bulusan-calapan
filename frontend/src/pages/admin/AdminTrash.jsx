import { useState, useEffect, useRef, useCallback } from 'react';
import { adminAPI } from '../../services/api-client';
import { notify } from '../../utils/toast';

const RestoreIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
    </svg>
);

const TrashIcon = ({ className = 'w-4 h-4' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <line x1="10" y1="11" x2="10" y2="17" />
        <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
);

const CloseCircle = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
);

const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
    </svg>
);

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const TrashHeaderIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
);

const getEntityName = (item) => {
    if (item.type === 'User') {
        return `${item.first_name || ''} ${item.last_name || ''}`.trim() || item.username || item.email || 'Unknown User';
    }
    if (item.type === 'Animal') {
        return item.common_name || item.commonName || item.name || item.scientific_name || 'Unknown Animal';
    }
    if (item.type === 'Plant') {
        return item.common_name || item.commonName || item.name || item.scientific_name || 'Unknown Plant';
    }
    if (item.type === 'Event') {
        return item.title || item.name || 'Unknown Event';
    }
    return 'Unknown';
};

const getEntitySubtitle = (item) => {
    if (item.type === 'User') return item.email || `@${item.username}`;
    if (item.type === 'Animal') return item.species || item.scientific_name || '';
    if (item.type === 'Plant') return item.species || item.scientific_name || '';
    if (item.type === 'Event') return item.description ? item.description.slice(0, 60) + (item.description.length > 60 ? '...' : '') : '';
    return '';
};

const entityTypeBadgeColors = {
    User: 'bg-blue-500/20 text-blue-600 border-blue-500/30',
    Animal: 'bg-amber-500/20 text-amber-600 border-amber-500/30',
    Plant: 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30',
    Event: 'bg-purple-500/20 text-purple-600 border-purple-500/30',
};

const AdminTrash = () => {
    const [trashedItems, setTrashedItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);
    const [undoToast, setUndoToast] = useState(null);
    const undoTimeoutRef = useRef(null);

    // Permanent delete modal
    const [showPermDeleteModal, setShowPermDeleteModal] = useState(false);
    const [permDeletePassword, setPermDeletePassword] = useState('');
    const [permDeleteLoading, setPermDeleteLoading] = useState(false);
    const [permDeleteTargets, setPermDeleteTargets] = useState([]); // array of { id, type }

    const tabs = ['All', 'Users', 'Animals', 'Plants', 'Events'];
    const tabToType = { Users: 'User', Animals: 'Animal', Plants: 'Plant', Events: 'Event' };

    const fetchAllTrash = useCallback(async () => {
        setLoading(true);
        try {
            const [usersRes, animalsRes, plantsRes, eventsRes] = await Promise.all([
                adminAPI.getTrashUsers(),
                adminAPI.getTrashAnimals(),
                adminAPI.getTrashPlants(),
                adminAPI.getTrashEvents(),
            ]);

            const items = [];

            if (usersRes.success && usersRes.users) {
                usersRes.users.forEach(u => items.push({ ...u, type: 'User' }));
            }
            if (animalsRes.success && animalsRes.animals) {
                animalsRes.animals.forEach(a => items.push({ ...a, type: 'Animal' }));
            }
            if (plantsRes.success && plantsRes.plants) {
                plantsRes.plants.forEach(p => items.push({ ...p, type: 'Plant' }));
            }
            if (eventsRes.success && eventsRes.events) {
                eventsRes.events.forEach(e => items.push({ ...e, type: 'Event' }));
            }

            items.sort((a, b) => new Date(b.deleted_at) - new Date(a.deleted_at));
            setTrashedItems(items);
        } catch (err) {
            console.error('Failed to fetch trash:', err);
            notify.error('Failed to load trash items');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAllTrash(); }, [fetchAllTrash]);

    useEffect(() => {
        return () => { if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current); };
    }, []);

    const filteredItems = trashedItems.filter(item => {
        const matchesTab = activeTab === 'All' || item.type === tabToType[activeTab];
        if (!matchesTab) return false;
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return getEntityName(item).toLowerCase().includes(q) ||
            (item.email && item.email.toLowerCase().includes(q)) ||
            (item.username && item.username.toLowerCase().includes(q));
    });

    const tabCounts = {
        All: trashedItems.length,
        Users: trashedItems.filter(i => i.type === 'User').length,
        Animals: trashedItems.filter(i => i.type === 'Animal').length,
        Plants: trashedItems.filter(i => i.type === 'Plant').length,
        Events: trashedItems.filter(i => i.type === 'Event').length,
    };

    const toggleSelect = (globalId) => {
        setSelectedIds(prev =>
            prev.includes(globalId) ? prev.filter(id => id !== globalId) : [...prev, globalId]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredItems.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredItems.map(item => `${item.type}-${item.id}`));
        }
    };

    const clearSelection = () => setSelectedIds([]);

    const showToast = (message) => {
        setUndoToast(message);
        if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
        undoTimeoutRef.current = setTimeout(() => setUndoToast(null), 5000);
    };

    const handleRestore = async (item) => {
        try {
            const restoreFn = {
                User: () => adminAPI.restoreUser(item.id),
                Animal: () => adminAPI.restoreAnimal(item.id),
                Plant: () => adminAPI.restorePlant(item.id),
                Event: () => adminAPI.restoreEvent(item.id),
            }[item.type];

            if (!restoreFn) return;
            await restoreFn();

            setTrashedItems(prev => prev.filter(i => !(i.type === item.type && i.id === item.id)));
            setSelectedIds(prev => prev.filter(id => id !== `${item.type}-${item.id}`));
            showToast(`${item.type} "${getEntityName(item)}" restored`);
        } catch (err) {
            notify.error(err.message || `Failed to restore ${item.type.toLowerCase()}`);
        }
    };

    const handleRestoreSelected = async () => {
        if (selectedIds.length === 0) return;
        const selectedItems = trashedItems.filter(i => selectedIds.includes(`${i.type}-${i.id}`));
        const grouped = {};
        selectedItems.forEach(item => {
            if (!grouped[item.type]) grouped[item.type] = [];
            grouped[item.type].push(item.id);
        });

        try {
            await Promise.all([
                grouped.User && adminAPI.restoreMultipleUsers(grouped.User),
                grouped.Animal && adminAPI.restoreMultipleAnimals(grouped.Animal),
                grouped.Plant && adminAPI.restoreMultiplePlants(grouped.Plant),
                grouped.Event && adminAPI.restoreMultipleEvents(grouped.Event),
            ].filter(Boolean));

            setTrashedItems(prev => prev.filter(i => !selectedIds.includes(`${i.type}-${i.id}`)));
            const count = selectedIds.length;
            setSelectedIds([]);
            showToast(`${count} item(s) restored`);
        } catch (err) {
            notify.error(err.message || 'Failed to restore selected items');
        }
    };

    const openPermDeleteModal = (targets) => {
        setPermDeleteTargets(targets);
        setPermDeletePassword('');
        setShowPermDeleteModal(true);
    };

    const handlePermanentDelete = async () => {
        if (!permDeletePassword) return;
        setPermDeleteLoading(true);
        try {
            const grouped = {};
            permDeleteTargets.forEach(({ id, type }) => {
                if (!grouped[type]) grouped[type] = [];
                grouped[type].push(id);
            });

            await Promise.all([
                grouped.User && adminAPI.permanentDeleteMultipleUsers(grouped.User, permDeletePassword),
                grouped.Animal && adminAPI.permanentDeleteMultipleAnimals(grouped.Animal, permDeletePassword),
                grouped.Plant && adminAPI.permanentDeleteMultiplePlants(grouped.Plant, permDeletePassword),
                grouped.Event && adminAPI.permanentDeleteMultipleEvents(grouped.Event, permDeletePassword),
            ].filter(Boolean));

            setTrashedItems(prev =>
                prev.filter(i => !permDeleteTargets.some(t => t.type === i.type && t.id === i.id))
            );
            setSelectedIds(prev =>
                prev.filter(id => !permDeleteTargets.some(t => `${t.type}-${t.id}` === id))
            );
            notify.success(`${permDeleteTargets.length} item(s) permanently deleted`);
            setShowPermDeleteModal(false);
            setPermDeletePassword('');
        } catch (err) {
            notify.error(err.message || 'Incorrect password or deletion failed');
        } finally {
            setPermDeleteLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-500">Loading trash...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border border-green-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center text-green-600">
                            <TrashHeaderIcon />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{trashedItems.length}</p>
                            <p className="text-xs text-gray-500">Total Trashed</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-green-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-600">
                            <span className="text-lg font-bold">U</span>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{tabCounts.Users}</p>
                            <p className="text-xs text-gray-500">Users</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-green-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-600">
                            <span className="text-lg font-bold">A</span>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{tabCounts.Animals}</p>
                            <p className="text-xs text-gray-500">Animals</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-green-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-600">
                            <span className="text-lg font-bold">P</span>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{tabCounts.Plants}</p>
                            <p className="text-xs text-gray-500">Plants</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Card */}
            <div className="bg-white border border-green-200 rounded-2xl overflow-hidden">
                {/* Tabs */}
                <div className="border-b border-green-200">
                    <div className="flex overflow-x-auto">
                        {tabs.map(tab => (
                            <button
                                key={tab}
                                onClick={() => { setActiveTab(tab); setSelectedIds([]); }}
                                className={`flex items-center gap-2 px-6 py-3.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                                    activeTab === tab
                                        ? 'border-green-500 text-green-600 bg-green-50/50'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-green-50/30'
                                }`}
                            >
                                {tab}
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                    activeTab === tab ? 'bg-green-500/20 text-green-600' : 'bg-gray-100 text-gray-500'
                                }`}>
                                    {tabCounts[tab]}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Toolbar */}
                <div className="p-4 border-b border-green-200 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="relative flex-1 max-w-sm">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                            <SearchIcon />
                        </div>
                        <input
                            type="text"
                            placeholder="Search trash..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-green-50 border border-green-200 rounded-xl py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-200 transition-all"
                        />
                    </div>

                    {/* Batch Actions */}
                    {selectedIds.length > 0 && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleRestoreSelected}
                                className="flex items-center gap-2 px-4 py-2.5 bg-green-500/10 border border-green-500/30 text-green-600 font-medium rounded-xl hover:bg-green-500/20 transition-all"
                            >
                                <RestoreIcon />
                                Restore ({selectedIds.length})
                            </button>
                            <button
                                onClick={() => {
                                    const targets = trashedItems
                                        .filter(i => selectedIds.includes(`${i.type}-${i.id}`))
                                        .map(i => ({ id: i.id, type: i.type }));
                                    openPermDeleteModal(targets);
                                }}
                                className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 border border-red-500/30 text-red-500 font-medium rounded-xl hover:bg-red-500/20 transition-all"
                            >
                                <TrashIcon />
                                Delete ({selectedIds.length})
                            </button>
                            <button
                                onClick={clearSelection}
                                className="p-2.5 bg-green-50 border border-green-200 text-gray-500 rounded-xl hover:bg-green-100 transition-all"
                                title="Cancel selection"
                            >
                                <CloseCircle />
                            </button>
                        </div>
                    )}
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-green-50">
                                <th className="px-4 py-4 w-12">
                                    <input
                                        type="checkbox"
                                        checked={filteredItems.length > 0 && selectedIds.length === filteredItems.length}
                                        onChange={toggleSelectAll}
                                        className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                                    />
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Deleted At</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Deleted By</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-green-200">
                            {filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-16 text-center">
                                        <TrashIcon className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                                        <p className="text-gray-500 font-medium">Trash is empty</p>
                                        <p className="text-gray-400 text-sm mt-1">No trashed items found</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredItems.map(item => {
                                    const globalId = `${item.type}-${item.id}`;
                                    return (
                                        <tr key={globalId} className="hover:bg-green-50/50 transition-colors">
                                            <td className="px-4 py-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(globalId)}
                                                    onChange={() => toggleSelect(globalId)}
                                                    className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-medium text-gray-900">{getEntityName(item)}</p>
                                                    {getEntitySubtitle(item) && (
                                                        <p className="text-gray-500 text-sm">{getEntitySubtitle(item)}</p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${entityTypeBadgeColors[item.type]}`}>
                                                    {item.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {item.deleted_at ? new Date(item.deleted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {item.deleted_by_name || item.deleted_by || '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleRestore(item)}
                                                        className="p-2 bg-green-50 hover:bg-green-500/10 border border-green-200 hover:border-green-500/50 text-gray-500 hover:text-green-600 rounded-lg transition-all"
                                                        title="Restore"
                                                    >
                                                        <RestoreIcon />
                                                    </button>
                                                    <button
                                                        onClick={() => openPermDeleteModal([{ id: item.id, type: item.type }])}
                                                        className="p-2 bg-green-50 hover:bg-red-500/10 border border-green-200 hover:border-red-500/50 text-gray-500 hover:text-red-400 rounded-lg transition-all"
                                                        title="Permanently delete"
                                                    >
                                                        <TrashIcon />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Table Footer */}
                <div className="px-6 py-4 border-t border-green-200">
                    <p className="text-sm text-gray-500">
                        Showing {filteredItems.length} of {trashedItems.length} trashed item(s)
                    </p>
                </div>
            </div>

            {/* Undo Toast */}
            {undoToast && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-4">
                    <span className="text-sm">{undoToast}</span>
                    <button
                        onClick={() => {
                            if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
                            setUndoToast(null);
                        }}
                        className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <CloseIcon />
                    </button>
                </div>
            )}

            {/* Permanent Delete Modal */}
            {showPermDeleteModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white border border-red-200 rounded-2xl w-full max-w-md">
                        <div className="p-6 border-b border-red-200">
                            <h3 className="text-xl font-bold text-gray-900">Permanent Delete</h3>
                            <p className="text-gray-500 text-sm mt-1">
                                This action <span className="text-red-500 font-medium">cannot be undone</span>.
                                {' '}{permDeleteTargets.length === 1
                                    ? `This ${permDeleteTargets[0]?.type.toLowerCase()} will be permanently deleted.`
                                    : `${permDeleteTargets.length} item(s) will be permanently deleted.`}
                            </p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-2">Enter your password to confirm</label>
                                <input
                                    type="password"
                                    value={permDeletePassword}
                                    onChange={(e) => setPermDeletePassword(e.target.value)}
                                    placeholder="Your password"
                                    className="w-full px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:border-red-500/50 transition-all"
                                    autoFocus
                                    onKeyDown={(e) => e.key === 'Enter' && handlePermanentDelete()}
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => { setShowPermDeleteModal(false); setPermDeletePassword(''); }}
                                    className="flex-1 py-3 bg-green-50 hover:bg-green-50 text-gray-700 font-medium rounded-xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handlePermanentDelete}
                                    disabled={!permDeletePassword || permDeleteLoading}
                                    className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-all disabled:opacity-50"
                                >
                                    {permDeleteLoading ? 'Deleting...' : 'Permanently Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminTrash;
