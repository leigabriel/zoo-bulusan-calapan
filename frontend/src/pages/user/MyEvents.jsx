import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { ReactLenis } from 'lenis/react';
import { motion, AnimatePresence } from 'framer-motion';
import AIFloatingButton from '../../components/common/AIFloatingButton';
import { reservationAPI } from '../../services/api-client';
import { useAuth } from '../../hooks/use-auth';
import { sanitizeInput, sanitizePhone } from '../../utils/sanitize';
import { notify } from '../../utils/toast';
import useScrollLock from '../../hooks/use-scroll-lock';

const Icons = {
    Close: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
        </svg>
    ),
    Calendar: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path fillRule="evenodd" d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 3v1.5h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V7.5a3 3 0 013-3H6V3a.75.75 0 01.75-.75zm13.5 9a1.5 1.5 0 00-1.5-1.5H5.25a1.5 1.5 0 00-1.5 1.5v7.5a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5v-7.5z" clipRule="evenodd" />
        </svg>
    ),
    Clock: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
        </svg>
    ),
    Users: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M8.25 6.75a3.75 3.75 0 117.5 0 3.75 3.75 0 01-7.5 0zM15.75 8.25a3 3 0 116 0 3 3 0 01-6 0zM2.25 9.75a3 3 0 116 0 3 3 0 01-6 0zM6.31 15.117A6.745 6.745 0 0112 12a6.745 6.745 0 016.709 7.498.75.75 0 01-.372.568A12.696 12.696 0 0112 21.75c-2.305 0-4.47-.612-6.337-1.684a.75.75 0 01-.372-.568 6.787 6.787 0 011.019-4.38z" clipRule="evenodd" />
        </svg>
    ),
    Edit: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32L19.513 8.2z" clipRule="evenodd" />
        </svg>
    ),
    Check: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
        </svg>
    )
};

const STATUS_STYLES = {
    confirmed: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    pending: 'bg-amber-50 text-amber-700 border border-amber-200',
    completed: 'bg-sky-50 text-sky-700 border border-sky-200',
    cancelled: 'bg-rose-50 text-rose-700 border border-rose-200'
};

const MyEvents = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingEvent, setEditingEvent] = useState(null);
    const [form, setForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [photoUpload, setPhotoUpload] = useState(null);
    const [photoUploading, setPhotoUploading] = useState(false);

    useEffect(() => {
        fetchHostedEvents();
    }, []);

    useScrollLock(Boolean(editingEvent || showConfirm));

    const fetchHostedEvents = async (showLoading = true) => {
        try {
            if (showLoading) setLoading(true);
            const res = await reservationAPI.getMyHostedEvents();
            if (res.success) {
                setEvents(res.reservations || []);
            }
        } catch (err) {
            notify.error(err.message || 'Failed to load hosted events.');
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    const formatDisplayDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric',
        });
    };

    const formatTime = (time) => {
        if (!time) return '';
        const [hours, minutes] = time.split(':');
        const h = parseInt(hours, 10);
        return `${h % 12 || 12}:${minutes} ${h >= 12 ? 'PM' : 'AM'}`;
    };

    const openEdit = (event) => {
        setEditingEvent(event);
        setForm({
            venueEventName: event.venue_event_name || '',
            venueEventDate: event.venue_event_date || '',
            venueEventStartTime: event.venue_event_time || '',
            venueEventEndTime: event.venue_event_end_time || '',
            venueEventDescription: event.venue_event_description || '',
            numberOfParticipants: event.number_of_participants || 1,
            notes: event.notes || ''
        });
    };

    const saveChanges = async () => {
        if (!form.venueEventName || !form.venueEventDate) {
            notify.warning('Provide name and date.');
            return;
        }
        setSaving(true);
        try {
            const res = await reservationAPI.updateHostedEvent(editingEvent.id, {
                venueEventName: form.venueEventName,
                venueEventDate: form.venueEventDate,
                venueEventStartTime: form.venueEventStartTime,
                venueEventEndTime: form.venueEventEndTime,
                venueEventDescription: form.venueEventDescription,
                numberOfParticipants: parseInt(form.numberOfParticipants) || 1,
                notes: form.notes
            });
            if (res.success) {
                notify.success('Event updated.');
                setShowConfirm(true);
                setEditingEvent(null);
                fetchHostedEvents(false);
            } else {
                throw new Error(res.message || "Couldn't update event.");
            }
        } catch (err) {
            notify.error(err.message || "Couldn't update event.");
        } finally {
            setSaving(false);
        }
    };

    const getMinDate = () => new Date().toISOString().split('T')[0];

    const handlePhotoFileChange = (e, event) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setPhotoUpload({ id: event.id, file, preview: reader.result });
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const uploadPhoto = async () => {
        if (!photoUpload) return;
        setPhotoUploading(true);
        try {
            const res = await reservationAPI.uploadHostedEventImage(photoUpload.id, photoUpload.file);
            if (res.success) {
                notify.success('Photo updated.');
                setPhotoUpload(null);
                fetchHostedEvents(false);
            } else {
                throw new Error(res.message || "Couldn't upload photo.");
            }
        } catch (err) {
            notify.error(err.message || "Couldn't upload photo.");
        } finally {
            setPhotoUploading(false);
        }
    };

    return (
        <ReactLenis root>
            <div className="min-h-screen bg-white text-black">
                <Header />

                <div className="w-full min-h-[40vh] md:min-h-[50vh] flex flex-col items-center justify-center px-4 pt-24 pb-8 text-center">
                    <span className="text-[10px] tracking-[0.3em] uppercase font-bold text-black/40 mb-6">
                        Zoo Bulusan · Host Dashboard
                    </span>
                    <h1 className="text-[3.5rem] sm:text-[6rem] md:text-[8rem] lg:text-[10rem] leading-none tracking-tight text-black text-center break-words w-full">
                        My Events
                    </h1>
                    <p className="mt-6 text-gray-500 text-sm md:text-base max-w-xl">
                        Manage and update the details of your confirmed event reservations.
                    </p>
                </div>

                <div className="max-w-6xl mx-auto px-4 md:px-8 pb-20 md:pb-32">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl md:text-2xl font-bold text-black">
                            {events.length > 0 ? `Your Hosted Events (${events.length})` : 'Your Hosted Events'}
                        </h2>
                        <button
                            onClick={() => navigate('/reservations')}
                            className="px-4 py-2 text-[10px] md:text-xs font-bold uppercase tracking-widest rounded-full border border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                            ← Back to Reservations
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-40">
                            <div className="w-8 h-8 border-2 border-gray-200 border-t-black rounded-full animate-spin" />
                        </div>
                    ) : events.length === 0 ? (
                        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-12 md:p-20 text-center">
                            <div className="w-16 h-16 mx-auto bg-white text-gray-300 rounded-full flex items-center justify-center mb-4 shadow-sm">
                                <Icons.Calendar />
                            </div>
                            <h3 className="text-lg md:text-xl font-bold text-black mb-2">No confirmed events yet</h3>
                            <p className="text-gray-500 text-sm mb-6">
                                Once your event reservation is confirmed, you will be able to edit its details here.
                            </p>
                            <button
                                onClick={() => navigate('/events')}
                                className="px-6 py-3 bg-black text-white rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors"
                            >
                                Explore Events
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {events.map((event) => {
                                const isUploadingThis = photoUpload && photoUpload.id === event.id;
                                return (
                                    <div key={event.id} className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                                        <div className="p-6 md:p-8 flex flex-col h-full">
                                            <div className="relative -mt-6 -mx-6 md:-mt-8 md:-mx-8 mb-6 h-40 md:h-44 bg-gray-100 overflow-hidden">
                                                <img
                                                    src={isUploadingThis ? photoUpload.preview : (event.event_image_url || '/images/event-img-placeholder.jpg')}
                                                    alt={event.venue_event_name || event.event_title || 'Event'}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => { e.target.src = '/images/event-img-placeholder.jpg'; }}
                                                />
                                                {isUploadingThis ? (
                                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                                        <div className="bg-white rounded-xl p-4 flex flex-col items-center gap-3 mx-4">
                                                            <p className="text-xs font-bold uppercase tracking-widest text-gray-700">Replace placeholder photo?</p>
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => setPhotoUpload(null)}
                                                                    disabled={photoUploading}
                                                                    className="px-4 py-2 rounded-full border border-gray-200 text-[10px] font-bold uppercase tracking-widest text-black hover:bg-gray-50 disabled:opacity-50"
                                                                >
                                                                    Cancel
                                                                </button>
                                                                <button
                                                                    onClick={uploadPhoto}
                                                                    disabled={photoUploading}
                                                                    className="px-4 py-2 rounded-full bg-black text-white text-[10px] font-bold uppercase tracking-widest hover:bg-gray-800 disabled:opacity-50"
                                                                >
                                                                    {photoUploading ? 'Uploading...' : 'Save Photo'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <label className="absolute bottom-3 right-3 flex items-center gap-2 px-3 py-2 bg-black/70 text-white text-[10px] font-bold uppercase tracking-widest rounded-full cursor-pointer hover:bg-black/90 transition-colors backdrop-blur-sm">
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                                                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                                            <circle cx="12" cy="13" r="4" />
                                                        </svg>
                                                        <span>Change Photo</span>
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="hidden"
                                                            onChange={(e) => handlePhotoFileChange(e, event)}
                                                        />
                                                    </label>
                                                )}
                                            </div>
                                            <div className="flex items-start justify-between gap-4 mb-4">
                                                <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0">
                                                    <Icons.Calendar />
                                                </div>
                                                <span className={`text-[10px] uppercase font-bold px-3 py-1 rounded-full ${STATUS_STYLES[event.status] || STATUS_STYLES.pending}`}>
                                                    {event.status}
                                                </span>
                                            </div>

                                            <h3 className="text-xl md:text-2xl font-bold text-black leading-tight mb-3 break-words">
                                                {event.venue_event_name || event.event_title || 'Untitled Event'}
                                            </h3>

                                            <div className="flex flex-col gap-2 text-sm text-gray-600 mb-6">
                                                <p className="flex items-center gap-2">
                                                    <Icons.Calendar />
                                                    {formatDisplayDate(event.venue_event_date)}
                                                </p>
                                                {(event.venue_event_time || event.venue_event_end_time) && (
                                                    <p className="flex items-center gap-2">
                                                        <Icons.Clock />
                                                        {formatTime(event.venue_event_time) || '—'}
                                                        {event.venue_event_end_time && <span>to {formatTime(event.venue_event_end_time)}</span>}
                                                    </p>
                                                )}
                                                <p className="flex items-center gap-2">
                                                    <Icons.Users />
                                                    {event.number_of_participants || 1} participant{event.number_of_participants !== 1 ? 's' : ''}
                                                </p>
                                            </div>

                                            <div className="mt-auto">
                                                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mb-4">
                                                    <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400 block mb-1">Reference ID</span>
                                                    <span className="font-mono text-sm text-black">{event.reservation_reference}</span>
                                                </div>
                                                <button
                                                    onClick={() => openEdit(event)}
                                                    className="w-full py-3.5 bg-black text-white rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <Icons.Edit />
                                                    Edit Event Details
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <AnimatePresence>
                    {editingEvent && (
                        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 md:p-8">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                            <motion.div
                                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                                transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
                                className="relative z-10 w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                            >
                                <div className="flex items-center justify-between px-6 md:px-8 py-5 border-b border-gray-200">
                                    <div>
                                        <h3 className="text-xl md:text-2xl font-bold text-black">Edit Event Details</h3>
                                        <p className="text-gray-400 text-xs uppercase tracking-widest font-semibold mt-1">
                                            {editingEvent.reservation_reference}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setEditingEvent(null)}
                                        className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                                    >
                                        <Icons.Close />
                                    </button>
                                </div>

                                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-6 md:p-8 space-y-6" data-lenis-prevent>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-gray-500">Event Name *</label>
                                        <input
                                            type="text"
                                            value={form.venueEventName}
                                            onChange={e => setForm({ ...form, venueEventName: sanitizeInput(e.target.value) })}
                                            className="border-b border-gray-300 py-2 md:py-3 text-sm md:text-base text-black font-medium focus:border-black outline-none bg-transparent transition-colors rounded-none"
                                            placeholder="E.g., Corporate Retreat"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-gray-500">Event Date *</label>
                                            <input
                                                type="date"
                                                value={form.venueEventDate}
                                                onChange={e => setForm({ ...form, venueEventDate: e.target.value })}
                                                min={getMinDate()}
                                                className="border-b border-gray-300 py-2 md:py-3 text-sm md:text-base text-black font-medium focus:border-black outline-none bg-transparent transition-colors rounded-none"
                                                required
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-gray-500">Estimated Attendees *</label>
                                            <input
                                                type="number"
                                                value={form.numberOfParticipants}
                                                onChange={e => setForm({ ...form, numberOfParticipants: e.target.value })}
                                                min="1" max="500"
                                                className="border-b border-gray-300 py-2 md:py-3 text-sm md:text-base text-black font-medium focus:border-black outline-none bg-transparent transition-colors rounded-none"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-gray-500">Start Time</label>
                                            <input
                                                type="time"
                                                value={form.venueEventStartTime}
                                                onChange={e => setForm({ ...form, venueEventStartTime: e.target.value })}
                                                className="border-b border-gray-300 py-2 md:py-3 text-sm md:text-base text-black font-medium focus:border-black outline-none bg-transparent transition-colors rounded-none"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-gray-500">End Time</label>
                                            <input
                                                type="time"
                                                value={form.venueEventEndTime}
                                                onChange={e => setForm({ ...form, venueEventEndTime: e.target.value })}
                                                className="border-b border-gray-300 py-2 md:py-3 text-sm md:text-base text-black font-medium focus:border-black outline-none bg-transparent transition-colors rounded-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-gray-500">Description & Requirements</label>
                                        <textarea
                                            value={form.venueEventDescription}
                                            onChange={e => setForm({ ...form, venueEventDescription: sanitizeInput(e.target.value) })}
                                            className="border-b border-gray-300 py-2 md:py-3 text-sm md:text-base text-black font-medium focus:border-black outline-none bg-transparent transition-colors min-h-[80px] resize-y rounded-none"
                                            placeholder="Describe your event setup, schedule, or special requests..."
                                        />
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-gray-500">Notes</label>
                                        <textarea
                                            value={form.notes}
                                            onChange={e => setForm({ ...form, notes: sanitizeInput(e.target.value) })}
                                            className="border-b border-gray-300 py-2 md:py-3 text-sm md:text-base text-black font-medium focus:border-black outline-none bg-transparent transition-colors min-h-[60px] resize-y rounded-none"
                                            placeholder="Any additional notes for the zoo staff..."
                                        />
                                    </div>
                                </div>

                                <div className="px-6 md:px-8 py-5 border-t border-gray-200 flex flex-col sm:flex-row gap-3">
                                    <button
                                        onClick={() => setEditingEvent(null)}
                                        className="flex-1 py-3.5 rounded-full border border-gray-200 text-[10px] md:text-xs font-bold uppercase tracking-widest text-black hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={saveChanges}
                                        disabled={saving}
                                        className="flex-1 py-3.5 rounded-full bg-black text-white text-[10px] md:text-xs font-bold uppercase tracking-widest hover:bg-gray-800 disabled:opacity-50 transition-colors"
                                    >
                                        {saving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {showConfirm && (
                        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                            <motion.div
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                                className="bg-white rounded-2xl w-full max-w-md p-8 md:p-10 relative z-10 text-center shadow-2xl"
                            >
                                <div className="mb-4 md:mb-6 text-green-500 flex justify-center"><Icons.Check /></div>
                                <h3 className="text-3xl md:text-4xl mb-2 text-black">Updated</h3>
                                <p className="text-gray-500 text-sm mb-6 md:mb-8">Your event details have been updated successfully.</p>
                                <button
                                    onClick={() => setShowConfirm(false)}
                                    className="w-full py-3 md:py-4 bg-black text-white rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest hover:bg-gray-800"
                                >
                                    Done
                                </button>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                <Footer />
                <AIFloatingButton />
            </div>
        </ReactLenis>
    );
};

export default MyEvents;
