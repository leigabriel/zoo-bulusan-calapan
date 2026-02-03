import { useState, useEffect } from 'react';
import { staffAPI } from '../../services/api-client';
import { sanitizeInput } from '../../utils/sanitize';

// Icons
const CalendarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
);

const ClockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
    </svg>
);

const MapPinIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
    </svg>
);

const UsersIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
    </svg>
);

const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
    </svg>
);

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
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
    </svg>
);

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const StaffEvents = ({ globalSearch = '' }) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        title: '', description: '', eventDate: '', startTime: '', endTime: '',
        location: '', capacity: '', status: 'upcoming', imageUrl: ''
    });

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const res = await staffAPI.getEvents();
            if (res.success && res.events) {
                setEvents(res.events);
            }
        } catch (err) {
            console.error('Error fetching events:', err);
        } finally {
            setLoading(false);
        }
    };

    const openCreateModal = () => {
        setEditingEvent(null);
        setForm({
            title: '', description: '', eventDate: '', startTime: '', endTime: '',
            location: '', capacity: '', status: 'upcoming', imageUrl: ''
        });
        setShowModal(true);
    };

    const openEditModal = (event) => {
        setEditingEvent(event);
        const eventDate = event.event_date ? event.event_date.split('T')[0] : '';
        setForm({
            title: event.title || '',
            description: event.description || '',
            eventDate: eventDate,
            startTime: event.start_time || '',
            endTime: event.end_time || '',
            location: event.location || '',
            capacity: event.capacity || '',
            status: event.status || 'upcoming',
            imageUrl: event.image_url || ''
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingEvent(null);
        setForm({
            title: '', description: '', eventDate: '', startTime: '', endTime: '',
            location: '', capacity: '', status: 'upcoming', imageUrl: ''
        });
    };

    const saveEvent = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const eventData = {
                title: form.title,
                description: form.description,
                event_date: form.eventDate,
                start_time: form.startTime,
                end_time: form.endTime,
                location: form.location,
                capacity: form.capacity ? parseInt(form.capacity) : null,
                status: form.status,
                image_url: form.imageUrl
            };
            let res;
            if (editingEvent) {
                res = await staffAPI.updateEvent(editingEvent.id, eventData);
            } else {
                res = await staffAPI.createEvent(eventData);
            }
            if (res.success) {
                await fetchEvents();
                closeModal();
            } else {
                alert(res.message || 'Failed to save event');
            }
        } catch (err) {
            console.error(err);
            alert('Error saving event');
        } finally {
            setSaving(false);
        }
    };

    const removeEvent = async (id) => {
        try {
            const res = await staffAPI.deleteEvent(id);
            if (res.success) {
                setEvents(events.filter(e => e.id !== id));
                setDeleteConfirm(null);
            } else {
                alert(res.message || 'Failed to delete event');
            }
        } catch (err) {
            console.error(err);
            alert('Error deleting event');
        }
    };

    const getStatusBadge = (status) => {
        switch (status?.toLowerCase()) {
            case 'upcoming': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'ongoing': return 'bg-[#8cff65]/20 text-[#8cff65] border-[#8cff65]/30';
            case 'completed': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
            case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return '-';
        return new Date(`2000-01-01T${timeStr}`).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const effectiveSearch = globalSearch || searchQuery;

    const filteredEvents = events.filter(event => {
        const matchesSearch = event.title?.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
            event.description?.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
            event.location?.toLowerCase().includes(effectiveSearch.toLowerCase());
        const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const eventStats = {
        total: events.length,
        upcoming: events.filter(e => e.status === 'upcoming').length,
        ongoing: events.filter(e => e.status === 'ongoing').length,
        completed: events.filter(e => e.status === 'completed').length,
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-[#8cff65] border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-400">Loading events...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Total Events</p>
                            <p className="text-2xl font-bold text-white">{eventStats.total}</p>
                        </div>
                        <div className="w-10 h-10 bg-[#8cff65]/10 rounded-xl flex items-center justify-center text-[#8cff65]">
                            <CalendarIcon />
                        </div>
                    </div>
                </div>
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4">
                    <p className="text-gray-400 text-sm">Upcoming</p>
                    <p className="text-2xl font-bold text-blue-400">{eventStats.upcoming}</p>
                </div>
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4">
                    <p className="text-gray-400 text-sm">Ongoing</p>
                    <p className="text-2xl font-bold text-[#8cff65]">{eventStats.ongoing}</p>
                </div>
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4">
                    <p className="text-gray-400 text-sm">Completed</p>
                    <p className="text-2xl font-bold text-gray-400">{eventStats.completed}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-4">
                <div className="flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex flex-wrap gap-4 items-center flex-1">
                        <div className="flex items-center bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-4 py-2 flex-1 min-w-[200px] max-w-sm">
                            <SearchIcon />
                            <input
                                type="text"
                                placeholder="Search events..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="ml-2 bg-transparent border-none outline-none text-white placeholder-gray-500 w-full"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-4 py-2 text-white outline-none"
                        >
                            <option value="all">All Status</option>
                            <option value="upcoming">Upcoming</option>
                            <option value="ongoing">Ongoing</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                    <button
                        onClick={openCreateModal}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#8cff65] to-[#4ade80] text-[#0a0a0a] font-semibold rounded-xl hover:from-[#9dff7a] hover:to-[#5ceb91] transition-all shadow-lg shadow-[#8cff65]/20"
                    >
                        <PlusIcon /> Add Event
                    </button>
                </div>
            </div>

            {/* Events Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.length > 0 ? (
                    filteredEvents.map(event => (
                        <div key={event.id} className="bg-[#141414] border border-[#2a2a2a] rounded-2xl overflow-hidden hover:border-[#8cff65]/30 transition group">
                            {event.image_url && (
                                <div className="h-40 bg-[#0a0a0a] overflow-hidden">
                                    <img
                                        src={event.image_url}
                                        alt={event.title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}
                            <div className="p-5">
                                <div className="flex items-start justify-between mb-3">
                                    <h3 className="text-lg font-bold text-white">{event.title}</h3>
                                    <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${getStatusBadge(event.status)}`}>
                                        {event.status}
                                    </span>
                                </div>
                                <p className="text-gray-400 text-sm mb-4 line-clamp-2">{event.description}</p>
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <CalendarIcon />
                                        <span>{formatDate(event.event_date)}</span>
                                    </div>
                                    {event.start_time && (
                                        <div className="flex items-center gap-2 text-gray-400">
                                            <ClockIcon />
                                            <span>{formatTime(event.start_time)} - {formatTime(event.end_time)}</span>
                                        </div>
                                    )}
                                    {event.location && (
                                        <div className="flex items-center gap-2 text-gray-400">
                                            <MapPinIcon />
                                            <span>{event.location}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <UsersIcon />
                                        <span>{event.registered_count || 0} / {event.capacity || '∞'} registered</span>
                                    </div>
                                </div>
                                {/* Action Buttons */}
                                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[#2a2a2a]">
                                    <button
                                        onClick={() => openEditModal(event)}
                                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#1e1e1e] hover:bg-[#2a2a2a] border border-[#2a2a2a] hover:border-[#8cff65]/50 text-gray-400 hover:text-[#8cff65] rounded-lg transition-all text-sm"
                                    >
                                        <EditIcon /> Edit
                                    </button>
                                    <button
                                        onClick={() => setDeleteConfirm(event)}
                                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#1e1e1e] hover:bg-red-500/10 border border-[#2a2a2a] hover:border-red-500/50 text-gray-400 hover:text-red-400 rounded-lg transition-all text-sm"
                                    >
                                        <TrashIcon /> Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        No events found
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-[#2a2a2a] flex items-center justify-between sticky top-0 bg-[#141414]">
                            <h3 className="text-xl font-bold text-white">
                                {editingEvent ? 'Edit Event' : 'Add New Event'}
                            </h3>
                            <button onClick={closeModal} className="p-2 hover:bg-[#1e1e1e] rounded-lg text-gray-400 hover:text-white transition">
                                <CloseIcon />
                            </button>
                        </div>
                        <form onSubmit={saveEvent} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Title *</label>
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: sanitizeInput(e.target.value) })}
                                    required
                                    className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#8cff65]"
                                    placeholder="Event title"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Date *</label>
                                    <input
                                        type="date"
                                        value={form.eventDate}
                                        onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
                                        required
                                        className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#8cff65]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Status</label>
                                    <select
                                        value={form.status}
                                        onChange={(e) => setForm({ ...form, status: e.target.value })}
                                        className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#8cff65]"
                                    >
                                        <option value="upcoming">Upcoming</option>
                                        <option value="ongoing">Ongoing</option>
                                        <option value="completed">Completed</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Start Time</label>
                                    <input
                                        type="time"
                                        value={form.startTime}
                                        onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                                        className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#8cff65]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">End Time</label>
                                    <input
                                        type="time"
                                        value={form.endTime}
                                        onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                                        className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#8cff65]"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Location</label>
                                    <input
                                        type="text"
                                        value={form.location}
                                        onChange={(e) => setForm({ ...form, location: sanitizeInput(e.target.value) })}
                                        className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#8cff65]"
                                        placeholder="Event location"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Capacity</label>
                                    <input
                                        type="number"
                                        value={form.capacity}
                                        onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                                        className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#8cff65]"
                                        placeholder="Max attendees"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Image URL</label>
                                <input
                                    type="url"
                                    value={form.imageUrl}
                                    onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                                    className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#8cff65]"
                                    placeholder="https://example.com/image.jpg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
                                <textarea
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: sanitizeInput(e.target.value) })}
                                    rows="3"
                                    className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#8cff65] resize-none"
                                    placeholder="Event description..."
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={closeModal} className="flex-1 px-4 py-3 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white rounded-xl font-medium transition">
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving} className="flex-1 px-4 py-3 bg-[#8cff65] hover:bg-[#7ae857] text-[#0a0a0a] rounded-xl font-medium transition disabled:opacity-50">
                                    {saving ? 'Saving...' : (editingEvent ? 'Update Event' : 'Add Event')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl w-full max-w-md p-6">
                        <h3 className="text-xl font-bold text-white mb-2">Delete Event</h3>
                        <p className="text-gray-400 mb-6">
                            Are you sure you want to delete <span className="text-white font-medium">{deleteConfirm.title}</span>? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-3 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white rounded-xl font-medium transition">
                                Cancel
                            </button>
                            <button onClick={() => removeEvent(deleteConfirm.id)} className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffEvents;