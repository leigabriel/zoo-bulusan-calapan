import { Calendar as CalendarIcon, Search as SearchIcon, Plus as PlusIcon, Clock as ClockIcon, MapPoint as MapPinIcon, Users as UsersIcon, Edit as EditIcon, Trash as TrashIcon, X as CloseIcon, Image as ImageIcon } from 'reicon-react';
import { useState, useEffect, useRef } from 'react';
import { staffAPI } from '../../services/api-client';
import { sanitizeInput } from '../../utils/sanitize';
import { notify } from '../../utils/toast';


// Tag colors for events
const TAG_COLORS = [
    { name: 'Green', value: '#22c55e', bg: 'bg-green-500' },
    { name: 'Blue', value: '#60a5fa', bg: 'bg-blue-400' },
    { name: 'Purple', value: '#a78bfa', bg: 'bg-purple-400' },
    { name: 'Pink', value: '#f472b6', bg: 'bg-pink-400' },
    { name: 'Orange', value: '#fb923c', bg: 'bg-orange-400' },
    { name: 'Yellow', value: '#facc15', bg: 'bg-yellow-400' },
    { name: 'Red', value: '#f87171', bg: 'bg-red-400' },
    { name: 'Cyan', value: '#22d3ee', bg: 'bg-cyan-400' },
];

const StaffEvents = ({ globalSearch = '' }) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [showSaveConfirm, setShowSaveConfirm] = useState(false);
    const [confirmData, setConfirmData] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [imageInputMode, setImageInputMode] = useState('upload');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [form, setForm] = useState({
        title: '', description: '', eventDate: '', startTime: '', endTime: '',
        status: 'upcoming', imageUrl: '', color: '#22c55e'
    });

    // Undo state
    const [undoItem, setUndoItem] = useState(null);
    const undoTimeoutRef = useRef(null);

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
        setError('');
        const now = new Date();
        const todayLocal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        setForm({
            title: '', description: '', eventDate: todayLocal, startTime: '', endTime: '',
            status: 'upcoming', imageUrl: '', color: '#22c55e'
        });
        setImageInputMode('upload');
        setImageFile(null);
        setImagePreview(null);
        setShowModal(true);
    };

    const openEditModal = (event) => {
        setEditingEvent(event);
        setError('');
        const eventDate = event.event_date ? event.event_date.split('T')[0] : '';
        setForm({
            title: event.title || '',
            description: event.description || '',
            eventDate: eventDate,
            startTime: event.start_time || '',
            endTime: event.end_time || '',
            status: event.status || 'upcoming',
            imageUrl: event.image_url || '',
            color: event.color || '#22c55e'
        });
        setImageInputMode('upload');
        setImageFile(null);
        setImagePreview(null);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingEvent(null);
        setError('');
        setImageInputMode('upload');
        setImageFile(null);
        setImagePreview(null);
        setForm({
            title: '', description: '', eventDate: '', startTime: '', endTime: '',
            status: 'upcoming', imageUrl: '', color: '#22c55e'
        });
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

    const saveEvent = async (e) => {
        e.preventDefault();
        setError('');
        if (!form.title || !form.eventDate) {
            setError('Title and date are required.');
            return;
        }
        setConfirmData({
            isUpdate: !!editingEvent,
            title: form.title,
            eventDate: form.eventDate,
            status: form.status
        });
        setShowSaveConfirm(true);
    };

    const executeSave = async () => {
        setSaving(true);
        setError('');
        try {
            let imageUrl = form.imageUrl;
            if (imageInputMode === 'upload' && imageFile) {
                const uploadRes = await staffAPI.uploadEventImage(imageFile);
                if (uploadRes.success) {
                    imageUrl = uploadRes.imageUrl;
                } else {
                    notify.error(uploadRes.message || "Couldn't upload image.");
                    setSaving(false);
                    return;
                }
            }

            const eventData = {
                title: form.title,
                description: form.description,
                eventDate: form.eventDate,
                startTime: form.startTime || null,
                endTime: form.endTime || null,
                status: form.status,
                imageUrl: imageUrl,
                color: form.color
            };
            let res;
            if (editingEvent) {
                res = await staffAPI.updateEvent(editingEvent.id, eventData);
            } else {
                res = await staffAPI.createEvent(eventData);
            }
            if (res.success) {
                await fetchEvents();
                notify.success(editingEvent ? 'Event updated.' : 'Event added.');
                closeModal();
                setShowSaveConfirm(false);
                setConfirmData(null);
            } else {
                const message = res.message || "Couldn't save event.";
                setError(message);
                notify.error(message);
            }
        } catch (err) {
            console.error(err);
            const message = "Couldn't save event. Please try again.";
            setError(message);
            notify.error(message);
        } finally {
            setSaving(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status?.toLowerCase()) {
            case 'upcoming': return 'bg-blue-500/20 text-blue-700 border-blue-500/30';
            case 'ongoing': return 'bg-green-400/20 text-green-800 border-green-400/30';
            case 'completed': return 'bg-gray-500/20 text-gray-500 border-gray-500/30';
            case 'cancelled': return 'bg-red-500/20 text-red-700 border-red-500/30';
            default: return 'bg-gray-500/20 text-gray-500 border-gray-500/30';
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

    const trashEvent = async (event) => {
        try {
            const res = await staffAPI.deleteEvent(event.id);
            if (res.success) {
                setEvents(events.filter(e => e.id !== event.id));
                setUndoItem({ type: 'event', data: event });
                if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
                undoTimeoutRef.current = setTimeout(() => setUndoItem(null), 5000);
            }
        } catch {
            notify.error('Failed to move event to trash');
        }
    };

    const handleUndoTrash = async () => {
        if (!undoItem) return;
        try {
            await staffAPI.restoreEvent(undoItem.data.id);
            setEvents(prev => [undoItem.data, ...prev]);
            setUndoItem(null);
            if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
        } catch {
            notify.error('Failed to restore event');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-green-400 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-500">Loading events...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm">Total Events</p>
                                <p className="text-2xl font-bold text-gray-900">{eventStats.total}</p>
                            </div>
                            <div className="w-10 h-10 bg-green-400/10 rounded-xl flex items-center justify-center text-green-800">
                                <CalendarIcon className="w-5 h-5" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
                        <p className="text-gray-500 text-sm">Upcoming</p>
                        <p className="text-2xl font-bold text-blue-700">{eventStats.upcoming}</p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
                        <p className="text-gray-500 text-sm">Ongoing</p>
                        <p className="text-2xl font-bold text-green-800">{eventStats.ongoing}</p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
                        <p className="text-gray-500 text-sm">Completed</p>
                        <p className="text-2xl font-bold text-gray-500">{eventStats.completed}</p>
                    </div>
                </div>

            {/* Filters */}
            <div className="bg-white border border-green-200 rounded-2xl p-4">
                <div className="flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex flex-wrap gap-4 items-center flex-1">
                        <div className="flex items-center bg-green-50 border border-green-200 rounded-xl px-4 py-2 flex-1 min-w-[200px] max-w-sm">
                            <SearchIcon className="w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search events..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="ml-2 bg-transparent border-none outline-none text-gray-900 placeholder-gray-500 w-full"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-green-50 border border-green-200 rounded-xl px-4 py-2 text-gray-900 outline-none"
                        >
                            <option value="all">All Status</option>
                            <option value="upcoming">Upcoming</option>
                            <option value="ongoing">Ongoing</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={openCreateModal}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-300 via-green-400 to-green-500 text-gray-900 font-semibold rounded-xl hover:from-green-300 hover:via-green-400 hover:to-green-500 transition-all shadow-lg shadow-green-300/50"
                        >
                            <PlusIcon className="w-5 h-5" /> Add Event
                        </button>
                    </div>
                </div>
            </div>

            {/* Events Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredEvents.length > 0 ? (
                        filteredEvents.map(event => (
                            <div key={event.id} className="bg-white border border-green-200 rounded-2xl overflow-hidden hover:border-green-400/30 transition group">
                                {event.image_url && (
                                    <div className="h-40 bg-white overflow-hidden">
                                        <img
                                            src={event.image_url}
                                            alt={event.title}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}
                                <div className="p-5">
                                    <div className="flex items-start justify-between mb-3">
                                        <h3 className="text-lg font-bold text-gray-900">{event.title}</h3>
                                        <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${getStatusBadge(event.status)}`}>
                                            {event.status}
                                        </span>
                                    </div>
                                    <p className="text-gray-500 text-sm mb-4 line-clamp-2">{event.description}</p>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-2 text-gray-500">
                                            <CalendarIcon className="w-5 h-5" />
                                            <span>{formatDate(event.event_date)}</span>
                                        </div>
                                        {event.start_time && (
                                            <div className="flex items-center gap-2 text-gray-500">
                                                <ClockIcon className="w-4 h-4" />
                                                <span>{formatTime(event.start_time)} - {formatTime(event.end_time)}</span>
                                            </div>
                                        )}
                                        {event.location && (
                                            <div className="flex items-center gap-2 text-gray-500">
                                                <MapPinIcon className="w-4 h-4" />
                                                <span>{event.location}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 text-gray-500">
                                            <UsersIcon className="w-4 h-4" />
                                            <span>{event.registered_count || 0} / {event.capacity || '∞'} registered</span>
                                        </div>
                                    </div>
                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-green-200">
                                        <button
                                            onClick={() => openEditModal(event)}
                                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-50 hover:bg-green-50 border border-green-200 hover:border-green-400/50 text-gray-500 hover:text-green-800 rounded-lg transition-all text-sm"
                                        >
                                            <EditIcon className="w-4 h-4" /> Edit
                                        </button>
                                        <button
                                            onClick={() => trashEvent(event)}
                                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-50 hover:bg-red-500/10 border border-green-200 hover:border-red-500/50 text-gray-500 hover:text-red-700 rounded-lg transition-all text-sm"
                                        >
                                            <TrashIcon className="w-4 h-4" /> Delete
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
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white border border-green-200 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-5 border-b border-green-200">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editingEvent ? 'Edit Event' : 'New Event'}
                            </h2>
                            <button
                                onClick={closeModal}
                                className="text-gray-500 hover:text-gray-900 transition"
                            >
                                <CloseIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={saveEvent} className="p-5 space-y-4">
                            {error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-700 text-sm">
                                    {error}
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Title <span className="text-red-700">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: sanitizeInput(e.target.value) })}
                                    required
                                    className="w-full bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-green-400 transition"
                                    placeholder="Add title here"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: sanitizeInput(e.target.value) })}
                                    rows={3}
                                    className="w-full bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-green-400 transition resize-none"
                                    placeholder="Enter event description here"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <span className="flex items-center gap-2">
                                        <CalendarIcon className="w-5 h-5" />
                                        Date <span className="text-red-700">*</span>
                                    </span>
                                </label>
                                <input
                                    type="date"
                                    value={form.eventDate}
                                    onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
                                    required
                                    className="w-full bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-green-400 transition"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Start Time
                                    </label>
                                    <input
                                        type="time"
                                        value={form.startTime}
                                        onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                                        className="w-full bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-green-400 transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        End Time
                                    </label>
                                    <input
                                        type="time"
                                        value={form.endTime}
                                        onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                                        className="w-full bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-green-400 transition"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <span className="flex items-center gap-2">
                                        <ImageIcon strokeWidth="2" className="w-5 h-5" />
                                        Event Image
                                    </span>
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageFileChange}
                                    className="w-full bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-green-400 file:text-gray-900 file:font-medium file:cursor-pointer hover:file:bg-green-400 transition"
                                />
                                {(imagePreview || form.imageUrl) && (
                                    <div className="mt-2 rounded-lg overflow-hidden h-24 relative">
                                        <img
                                            src={imagePreview || form.imageUrl}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                            onError={(e) => { e.target.style.display = 'none'; }}
                                        />
                                        {imagePreview && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setImageFile(null);
                                                    setImagePreview(null);
                                                }}
                                                className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 transition"
                                            >
                                                <CloseIcon className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Tag Color</label>
                                <div className="flex gap-2 flex-wrap">
                                    {TAG_COLORS.map((color) => (
                                        <button
                                            key={color.value}
                                            type="button"
                                            onClick={() => setForm({ ...form, color: color.value })}
                                            className={`w-8 h-8 rounded-lg ${color.bg} transition-all ${form.color === color.value
                                                    ? 'ring-2 ring-white ring-offset-2 ring-offset-white'
                                                    : 'hover:scale-110'
                                                }`}
                                            title={color.name}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                <select
                                    value={form.status}
                                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                                    className="w-full bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-green-400 transition"
                                >
                                    <option value="upcoming">Upcoming</option>
                                    <option value="ongoing">Ongoing</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 px-4 py-3 bg-green-50 hover:bg-green-50 text-gray-900 rounded-xl font-medium transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-400 hover:bg-green-400 text-black rounded-xl font-medium transition disabled:opacity-50"
                                >
                                    {saving ? (
                                        <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                                    ) : editingEvent ? (
                                        <>
                                            <EditIcon className="w-4 h-4" />
                                            Update
                                        </>
                                    ) : (
                                        <>
                                            <PlusIcon className="w-5 h-5" />
                                            Add Event
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Save Confirmation Modal */}
            {showSaveConfirm && confirmData && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-white border border-green-200 rounded-2xl w-full max-w-md p-6">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 bg-green-400/20`}>
                            {confirmData.isUpdate ? <EditIcon className="w-4 h-4" /> : <PlusIcon className="w-5 h-5" />}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                            {confirmData.isUpdate ? 'Update Event' : 'Create Event'}
                        </h3>
                        <p className="text-gray-500 text-center mb-4">
                            {confirmData.isUpdate 
                                ? 'Are you sure you want to update this event?'
                                : 'Are you sure you want to create this event?'}
                        </p>
                        
                        <div className="bg-green-50 rounded-xl p-4 mb-6 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Title</span>
                                <span className="text-gray-900 font-medium">{confirmData.title}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Date</span>
                                <span className="text-gray-900 font-medium">
                                    {confirmData.eventDate ? new Date(confirmData.eventDate + 'T00:00:00').toLocaleDateString('en-US', {
                                        month: 'short', day: 'numeric', year: 'numeric'
                                    }) : '-'}
                                </span>
                            </div>
                            {confirmData.status && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Status</span>
                                    <span className="text-gray-900 font-medium capitalize">{confirmData.status}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowSaveConfirm(false);
                                    setConfirmData(null);
                                }}
                                className="flex-1 px-4 py-3 bg-green-50 hover:bg-green-50 text-gray-900 rounded-xl font-medium transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={executeSave}
                                disabled={saving}
                                className="flex-1 px-4 py-3 bg-green-400 hover:bg-green-400 text-black rounded-xl font-medium transition disabled:opacity-50"
                            >
                                {saving ? 'Processing...' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Undo Toast */}
            {undoItem && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-4 animate-slide-up">
                    <span className="text-sm">Event moved to trash</span>
                    <button onClick={handleUndoTrash} className="text-sm font-semibold text-green-400 hover:text-green-300 transition-colors">Undo</button>
                </div>
            )}
        </div>
    );
};

export default StaffEvents;
