import { useState, useEffect, useRef } from 'react';
import { staffAPI } from '../../services/api-client';
import { notify } from '../../utils/toast';

const RestoreIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M4 9a9 9 0 0116.36-5.36M20 15a9 9 0 01-16.36 5.36" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const CloseCircle = ({ onClick }) => (
  <svg className="w-5 h-5 cursor-pointer hover:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" onClick={onClick}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const TYPE_BADGES = {
  User: 'bg-blue-100 text-blue-700',
  Animal: 'bg-amber-100 text-amber-700',
  Plant: 'bg-emerald-100 text-emerald-700',
  Event: 'bg-purple-100 text-purple-700',
};

const TABS = ['All', 'Users', 'Animals', 'Plants', 'Events'];

const StaffTrash = () => {
  const [trashItems, setTrashItems] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const undoTimers = useRef({});

  useEffect(() => {
    fetchTrashItems();
    return () => {
      const timers = undoTimers.current;
      Object.values(timers).forEach(clearTimeout);
    };
  }, []);

  const fetchTrashItems = async () => {
    setLoading(true);
    try {
      const [users, animals, plants, events] = await Promise.all([
        staffAPI.getTrashUsers(),
        staffAPI.getTrashAnimals(),
        staffAPI.getTrashPlants(),
        staffAPI.getTrashEvents(),
      ]);

      const all = [
        ...(users.data || []).map(u => ({
          id: u.id,
          name: u.name || u.username || `User #${u.id}`,
          type: 'User',
          deleted_at: u.deleted_at,
          deleted_by: u.deleted_by || '—',
          original: u,
        })),
        ...(animals.data || []).map(a => ({
          id: a.id,
          name: a.name || `Animal #${a.id}`,
          type: 'Animal',
          deleted_at: a.deleted_at,
          deleted_by: a.deleted_by || '—',
          original: a,
        })),
        ...(plants.data || []).map(p => ({
          id: p.id,
          name: p.name || `Plant #${p.id}`,
          type: 'Plant',
          deleted_at: p.deleted_at,
          deleted_by: p.deleted_by || '—',
          original: p,
        })),
        ...(events.data || []).map(e => ({
          id: e.id,
          name: e.title || e.name || `Event #${e.id}`,
          type: 'Event',
          deleted_at: e.deleted_at,
          deleted_by: e.deleted_by || '—',
          original: e,
        })),
      ];

      all.sort((a, b) => new Date(b.deleted_at) - new Date(a.deleted_at));
      setTrashItems(all);
    } catch {
      notify('Failed to load trash items', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filtered = activeTab === 'All'
    ? trashItems
    : trashItems.filter(i => i.type === activeTab.replace(/s$/, ''));

  const toggleSelect = (key) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(i => `${i.type}-${i.id}`)));
    }
  };

  const restoreItem = async (item, undoable = true) => {
    const key = `${item.type}-${item.id}`;
    try {
      if (item.type === 'User') await staffAPI.restoreUser(item.id);
      else if (item.type === 'Animal') await staffAPI.restoreAnimal(item.id);
      else if (item.type === 'Plant') await staffAPI.restorePlant(item.id);
      else if (item.type === 'Event') await staffAPI.restoreEvent(item.id);

      setTrashItems(prev => prev.filter(i => `${i.type}-${i.id}` !== key));
      setSelected(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });

      if (undoable) {
        notify(
          <div className="flex items-center gap-3">
            <span className="flex-1">
              <strong>{item.name}</strong> restored.
            </span>
            <button
              onClick={() => undoRestore(item)}
              className="text-sm font-semibold text-blue-600 hover:text-blue-800 underline"
            >
              Undo
            </button>
          </div>,
          'success',
          { duration: 5000, id: `restore-${key}` }
        );

        undoTimers.current[key] = setTimeout(() => {
          delete undoTimers.current[key];
        }, 5000);
      }
    } catch {
      notify(`Failed to restore ${item.name}`, 'error');
    }
  };

  const undoRestore = async (item) => {
    try {
      const key = `${item.type}-${item.id}`;
      if (undoTimers.current[key]) {
        clearTimeout(undoTimers.current[key]);
        delete undoTimers.current[key];
      }

      if (item.type === 'User') await staffAPI.softDeleteUser(item.id);
      else if (item.type === 'Animal') await staffAPI.deleteAnimal(item.id);
      else if (item.type === 'Plant') await staffAPI.deletePlant(item.id);
      else if (item.type === 'Event') await staffAPI.deleteEvent(item.id);

      setTrashItems(prev => [item, ...prev].sort((a, b) => new Date(b.deleted_at) - new Date(a.deleted_at)));
      notify(`${item.name} moved back to trash`, 'info');
    } catch {
      notify('Failed to undo restore', 'error');
    }
  };

  const restoreSelected = async () => {
    const keys = [...selected];
    const items = keys.map(k => trashItems.find(i => `${i.type}-${i.id}` === k)).filter(Boolean);

    for (const item of items) {
      await restoreItem(item, false);
    }

    notify(`${items.length} item(s) restored`, 'success');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const tabCounts = {
    All: trashItems.length,
    Users: trashItems.filter(i => i.type === 'User').length,
    Animals: trashItems.filter(i => i.type === 'Animal').length,
    Plants: trashItems.filter(i => i.type === 'Plant').length,
    Events: trashItems.filter(i => i.type === 'Event').length,
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="text-gray-400">
            <TrashIcon />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Trash</h1>
          <span className="ml-2 text-sm text-gray-500">{trashItems.length} items</span>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl shadow-sm p-1 mb-6 border border-gray-100">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setSelected(new Set()); }}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-green-600 text-white shadow'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab}
              <span className={`ml-1.5 text-xs ${activeTab === tab ? 'text-green-200' : 'text-gray-400'}`}>
                {tabCounts[tab]}
              </span>
            </button>
          ))}
        </div>

        {/* Batch actions bar */}
        {selected.size > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 flex items-center gap-4 animate-in fade-in">
            <span className="text-sm font-medium text-green-800">
              {selected.size} item(s) selected
            </span>
            <button
              onClick={restoreSelected}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <RestoreIcon />
              Restore Selected
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <CloseCircle onClick={() => setSelected(new Set())} />
              Cancel
            </button>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-400">
              <div className="inline-block w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mb-3" />
              <p>Loading trash...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <TrashIcon />
              <p className="mt-3 text-lg font-medium">Trash is empty</p>
              <p className="text-sm">No deleted items to show.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={selected.size === filtered.length && filtered.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                  </th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Deleted At</th>
                  <th className="px-4 py-3">Deleted By</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(item => {
                  const key = `${item.type}-${item.id}`;
                  return (
                    <tr key={key} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(key)}
                          onChange={() => toggleSelect(key)}
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-800">{item.name}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${TYPE_BADGES[item.type]}`}>
                          {item.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatDate(item.deleted_at)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {item.deleted_by}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => restoreItem(item)}
                          className="inline-flex items-center gap-1.5 bg-green-50 hover:bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                          title="Restore"
                        >
                          <RestoreIcon />
                          Restore
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffTrash;
