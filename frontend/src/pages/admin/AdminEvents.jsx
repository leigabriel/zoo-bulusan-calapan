import { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { adminAPI } from '../../services/api-client';

// Icons
const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <line x1="12" y1="5" x2="12" y2="19"/>
        <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
);

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
);

const CalendarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
);

const ClockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
    </svg>
);

const LocationIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
        <circle cx="12" cy="10" r="3"/>
    </svg>
);

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <polyline points="3 6 5 6 21 6"/>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    </svg>
);

const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
);

const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
    </svg>
);

// Tag colors for events
const TAG_COLORS = [
    { name: 'Green', value: '#22c55e', bg: 'bg-green-500' },
    { name: 'Blue', value: '#3b82f6', bg: 'bg-blue-500' },
    { name: 'Purple', value: '#a855f7', bg: 'bg-purple-500' },
    { name: 'Red', value: '#ef4444', bg: 'bg-red-500' },
    { name: 'Yellow', value: '#eab308', bg: 'bg-yellow-500' },
    { name: 'Pink', value: '#ec4899', bg: 'bg-pink-500' },
    { name: 'Teal', value: '#14b8a6', bg: 'bg-teal-500' },
    { name: 'Orange', value: '#f97316', bg: 'bg-orange-500' },
];

const AdminEvents = () => {
    const calendarRef = useRef(null);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // 'create', 'edit', 'view'
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [currentView, setCurrentView] = useState('dayGridMonth');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        eventDate: '',
        startTime: '',
        endTime: '',
        imageUrl: '',
        color: '#22c55e',
        status: 'upcoming'
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await adminAPI.getEvents();
            if (response.success && response.events) {
                // Transform events for FullCalendar with proper date formatting
                const calendarEvents = response.events.map(event => {
                    // Handle date - ensure it's in YYYY-MM-DD format
                    const eventDate = typeof event.event_date === 'string' 
                        ? event.event_date.split('T')[0] 
                        : new Date(event.event_date).toISOString().split('T')[0];
                    
                    return {
                        id: event.id.toString(),
                        title: event.title,
                        start: event.start_time 
                            ? `${eventDate}T${event.start_time}`
                            : eventDate,
                        end: event.end_time 
                            ? `${eventDate}T${event.end_time}`
                            : null,
                        backgroundColor: event.color || '#22c55e',
                        borderColor: event.color || '#22c55e',
                        extendedProps: {
                            description: event.description,
                            imageUrl: event.image_url,
                            status: event.status,
                            eventDate: eventDate,
                            startTime: event.start_time,
                            endTime: event.end_time,
                            color: event.color || '#22c55e'
                        }
                    };
                });
                setEvents(calendarEvents);
            } else {
                setEvents([]);
            }
        } catch (err) {
            console.error('Error fetching events:', err);
            setError('Failed to load events');
            setEvents([]);
        } finally {
            setLoading(false);
        }
    };

    // Handle clicking on a date in the calendar
    const handleDateClick = (arg) => {
        // Check if there are any events on this date
        const clickedDate = arg.dateStr;
        const eventsOnDate = events.filter(e => {
            const eventDate = e.extendedProps.eventDate;
            return eventDate === clickedDate;
        });

        if (eventsOnDate.length > 0) {
            // If there are events, show the first event in view mode
            const event = eventsOnDate[0];
            setSelectedEvent(event);
            setFormData({
                title: event.title,
                description: event.extendedProps.description || '',
                eventDate: event.extendedProps.eventDate,
                startTime: event.extendedProps.startTime || '',
                endTime: event.extendedProps.endTime || '',
                imageUrl: event.extendedProps.imageUrl || '',
                color: event.extendedProps.color || '#22c55e',
                status: event.extendedProps.status || 'upcoming'
            });
            setModalMode('view');
            setShowModal(true);
        } else {
            // If no events, open create form with selected date
            setSelectedEvent(null);
            setFormData({
                title: '',
                description: '',
                eventDate: clickedDate,
                startTime: '09:00',
                endTime: '10:00',
                imageUrl: '',
                color: '#22c55e',
                status: 'upcoming'
            });
            setModalMode('create');
            setShowModal(true);
        }
    };

    // Handle clicking on an event in the calendar
    const handleEventClick = (arg) => {
        const event = arg.event;
        setSelectedEvent(event);
        setFormData({
            title: event.title,
            description: event.extendedProps.description || '',
            eventDate: event.extendedProps.eventDate,
            startTime: event.extendedProps.startTime || '',
            endTime: event.extendedProps.endTime || '',
            imageUrl: event.extendedProps.imageUrl || '',
            color: event.extendedProps.color || '#22c55e',
            status: event.extendedProps.status || 'upcoming'
        });
        setModalMode('view');
        setShowModal(true);
    };

    // Switch to edit mode
    const handleEditMode = () => {
        setModalMode('edit');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        if (!formData.title || !formData.eventDate) {
            setError('Title and date are required');
            return;
        }

        setSaving(true);
        try {
            const eventData = {
                title: formData.title,
                description: formData.description,
                eventDate: formData.eventDate,
                startTime: formData.startTime || null,
                endTime: formData.endTime || null,
                imageUrl: formData.imageUrl || null,
                color: formData.color,
                status: formData.status
            };

            if (selectedEvent && modalMode === 'edit') {
                // Update existing event
                const response = await adminAPI.updateEvent(selectedEvent.id, eventData);
                if (response.success) {
                    await fetchEvents();
                    setShowModal(false);
                    resetForm();
                }
            } else {
                // Create new event
                const response = await adminAPI.createEvent(eventData);
                if (response.success) {
                    await fetchEvents();
                    setShowModal(false);
                    resetForm();
                }
            }
        } catch (err) {
            console.error('Error saving event:', err);
            setError(err.message || 'Failed to save event');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedEvent) return;
        
        if (!window.confirm('Are you sure you want to delete this event?')) return;

        setSaving(true);
        try {
            const response = await adminAPI.deleteEvent(selectedEvent.id);
            if (response.success) {
                await fetchEvents();
                setShowModal(false);
                resetForm();
            }
        } catch (err) {
            console.error('Error deleting event:', err);
            setError(err.message || 'Failed to delete event');
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setSelectedEvent(null);
        setModalMode('create');
        setFormData({
            title: '',
            description: '',
            eventDate: '',
            startTime: '',
            endTime: '',
            imageUrl: '',
            color: '#22c55e',
            status: 'upcoming'
        });
        setError('');
    };

    const handleViewChange = (view) => {
        setCurrentView(view);
        const calendarApi = calendarRef.current?.getApi();
        if (calendarApi) {
            calendarApi.changeView(view);
        }
    };

    // Format time for display
    const formatTime = (time) => {
        if (!time) return '';
        const [hours, minutes] = time.split(':');
        const h = parseInt(hours, 10);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const hour12 = h % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
    };

    // Format date for display
    const formatDisplayDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Get upcoming and ongoing events for sidebar
    const upcomingOngoingEvents = events
        .filter(e => e.extendedProps.status === 'upcoming' || e.extendedProps.status === 'ongoing')
        .filter(e => new Date(e.extendedProps.eventDate + 'T00:00:00') >= new Date(new Date().toDateString()))
        .sort((a, b) => new Date(a.start) - new Date(b.start))
        .slice(0, 8);

    // Get status badge style
    const getStatusStyle = (status) => {
        switch (status) {
            case 'ongoing':
                return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'upcoming':
                return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'completed':
                return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
            case 'cancelled':
                return 'bg-red-500/20 text-red-400 border-red-500/30';
            default:
                return 'bg-green-500/20 text-green-400 border-green-500/30';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-4 border-[#2a2a2a]"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#8cff65] animate-spin"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Events Management</h1>
                    <p className="text-gray-400">Create and manage zoo events</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* View Switcher */}
                    <div className="flex bg-[#1e1e1e] rounded-xl p-1 border border-[#2a2a2a]">
                        {[
                            { value: 'dayGridMonth', label: 'Month' },
                            { value: 'timeGridWeek', label: 'Week' },
                            { value: 'timeGridDay', label: 'Day' },
                            { value: 'listWeek', label: 'List' },
                        ].map(view => (
                            <button
                                key={view.value}
                                onClick={() => handleViewChange(view.value)}
                                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                                    currentView === view.value
                                        ? 'bg-[#8cff65] text-black'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                {view.label}
                            </button>
                        ))}
                    </div>
                    
                    {/* Add Event Button */}
                    <button
                        onClick={() => {
                            resetForm();
                            setFormData(prev => ({
                                ...prev,
                                eventDate: new Date().toISOString().split('T')[0]
                            }));
                            setModalMode('create');
                            setShowModal(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-[#8cff65] hover:bg-[#7ae857] text-black font-medium rounded-xl transition-colors"
                    >
                        <PlusIcon />
                        <span>New Event</span>
                    </button>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                {/* Calendar */}
                <div className="xl:col-span-3 bg-[#141414] border border-[#2a2a2a] rounded-2xl p-4 sm:p-6">
                    <style>{`
                        .fc {
                            --fc-border-color: #2a2a2a;
                            --fc-button-bg-color: #1e1e1e;
                            --fc-button-border-color: #2a2a2a;
                            --fc-button-text-color: #fff;
                            --fc-button-hover-bg-color: #2a2a2a;
                            --fc-button-hover-border-color: #3a3a3a;
                            --fc-button-active-bg-color: #8cff65;
                            --fc-button-active-border-color: #8cff65;
                            --fc-today-bg-color: rgba(140, 255, 101, 0.1);
                            --fc-page-bg-color: #141414;
                            --fc-neutral-bg-color: #1e1e1e;
                            --fc-list-event-hover-bg-color: #1e1e1e;
                            --fc-highlight-color: rgba(140, 255, 101, 0.2);
                        }
                        .fc .fc-toolbar-title {
                            color: #fff;
                            font-size: 1.25rem;
                            font-weight: 600;
                        }
                        .fc .fc-col-header-cell-cushion {
                            color: #9ca3af;
                            font-weight: 500;
                            padding: 12px 4px;
                        }
                        .fc .fc-daygrid-day-number {
                            color: #9ca3af;
                            padding: 8px;
                        }
                        .fc .fc-daygrid-day.fc-day-today .fc-daygrid-day-number {
                            color: #8cff65;
                            font-weight: 600;
                        }
                        .fc .fc-daygrid-day-frame {
                            min-height: 100px;
                        }
                        .fc .fc-daygrid-day:hover {
                            background-color: rgba(140, 255, 101, 0.05);
                            cursor: pointer;
                        }
                        .fc .fc-event {
                            border-radius: 6px;
                            padding: 2px 6px;
                            font-size: 0.75rem;
                            font-weight: 500;
                            border: none;
                            cursor: pointer;
                            color: #ffffff !important;
                        }
                        .fc .fc-event .fc-event-title {
                            color: #ffffff !important;
                        }
                        .fc .fc-event .fc-event-time {
                            color: #ffffff !important;
                        }
                        .fc-daygrid-event-dot {
                            border-color:  !important;
                        }
                        .fc .fc-event:hover {
                            opacity: 0.9;
                        }
                        .fc .fc-button {
                            border-radius: 8px !important;
                            padding: 8px 16px !important;
                            font-weight: 500 !important;
                            text-transform: capitalize !important;
                        }
                        .fc .fc-button-primary:not(:disabled).fc-button-active {
                            color: #000 !important;
                        }
                        .fc .fc-timegrid-slot-label-cushion {
                            color: #9ca3af;
                        }
                        .fc .fc-timegrid-axis-cushion {
                            color: #9ca3af;
                        }
                        .fc .fc-list-day-cushion {
                            background-color: #1e1e1e !important;
                        }
                        .fc .fc-list-day-text, .fc .fc-list-day-side-text {
                            color: #fff !important;
                        }
                        .fc .fc-list-event-time {
                            color: #9ca3af;
                        }
                        .fc .fc-list-event-title {
                            color: #fff;
                        }
                        .fc-theme-standard td, .fc-theme-standard th {
                            border-color: #2a2a2a;
                        }
                        .fc-scrollgrid {
                            border-color: #2a2a2a !important;
                        }
                        .fc .fc-scrollgrid-section > * {
                            border-color: #2a2a2a;
                        }
                        .fc-day-other .fc-daygrid-day-number {
                            color: #4a4a4a !important;
                        }
                        /* Indicate dates with events */
                        .fc .fc-daygrid-day.fc-day-has-event {
                            position: relative;
                        }
                    `}</style>
                    <FullCalendar
                        ref={calendarRef}
                        plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
                        initialView={currentView}
                        headerToolbar={{
                            left: 'prev,next today',
                            center: 'title',
                            right: ''
                        }}
                        events={events}
                        editable={true}
                        selectable={true}
                        selectMirror={true}
                        dayMaxEvents={3}
                        weekends={true}
                        dateClick={handleDateClick}
                        eventClick={handleEventClick}
                        eventDrop={async (info) => {
                            // Handle drag and drop
                            const newDate = info.event.start.toISOString().split('T')[0];
                            try {
                                await adminAPI.updateEvent(info.event.id, {
                                    ...info.event.extendedProps,
                                    title: info.event.title,
                                    eventDate: newDate,
                                });
                                await fetchEvents();
                            } catch (err) {
                                console.error('Error updating event:', err);
                                info.revert();
                            }
                        }}
                        height="auto"
                        contentHeight={600}
                    />
                </div>

                {/* Sidebar - Upcoming & Ongoing Events */}
                <div className="xl:col-span-1 space-y-6">
                    {/* Upcoming/Ongoing Events Panel */}
                    <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-5">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <CalendarIcon />
                            Upcoming Events
                        </h3>
                        
                        {upcomingOngoingEvents.length === 0 ? (
                            <div className="text-center py-8">
                                <div className="text-gray-500 mb-2">
                                    <CalendarIcon />
                                </div>
                                <p className="text-gray-500 text-sm">No upcoming events</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {upcomingOngoingEvents.map((event) => (
                                    <div
                                        key={event.id}
                                        onClick={() => {
                                            setSelectedEvent(event);
                                            setFormData({
                                                title: event.title,
                                                description: event.extendedProps.description || '',
                                                eventDate: event.extendedProps.eventDate,
                                                startTime: event.extendedProps.startTime || '',
                                                endTime: event.extendedProps.endTime || '',
                                                imageUrl: event.extendedProps.imageUrl || '',
                                                color: event.extendedProps.color || '#22c55e',
                                                status: event.extendedProps.status || 'upcoming'
                                            });
                                            setModalMode('view');
                                            setShowModal(true);
                                        }}
                                        className="p-3 bg-[#1e1e1e] rounded-xl hover:bg-[#252525] transition cursor-pointer border-l-4 group"
                                        style={{ borderColor: event.backgroundColor }}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="font-medium text-white text-sm group-hover:text-[#8cff65] transition line-clamp-1">
                                                {event.title}
                                            </p>
                                            <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full border capitalize whitespace-nowrap ${getStatusStyle(event.extendedProps.status)}`}>
                                                {event.extendedProps.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
                                            <span className="flex items-center gap-1">
                                                <CalendarIcon />
                                                {new Date(event.extendedProps.eventDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </span>
                                            {event.extendedProps.startTime && (
                                                <span className="flex items-center gap-1">
                                                    <ClockIcon />
                                                    {formatTime(event.extendedProps.startTime)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Quick Stats */}
                    <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-5">
                        <h3 className="text-lg font-semibold text-white mb-4">Event Stats</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-[#1e1e1e] rounded-xl">
                                <span className="text-gray-400 text-sm">Total Events</span>
                                <span className="text-white font-bold">{events.length}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-xl border border-green-500/20">
                                <span className="text-green-400 text-sm">Upcoming</span>
                                <span className="text-green-400 font-bold">
                                    {events.filter(e => e.extendedProps.status === 'upcoming').length}
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                                <span className="text-blue-400 text-sm">Ongoing</span>
                                <span className="text-blue-400 font-bold">
                                    {events.filter(e => e.extendedProps.status === 'ongoing').length}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Event Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-5 border-b border-[#2a2a2a]">
                            <h2 className="text-xl font-bold text-white">
                                {modalMode === 'view' ? 'Event Details' : modalMode === 'edit' ? 'Edit Event' : 'New Event'}
                            </h2>
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    resetForm();
                                }}
                                className="text-gray-400 hover:text-white transition"
                            >
                                <CloseIcon />
                            </button>
                        </div>

                        {/* Modal Body */}
                        {modalMode === 'view' ? (
                            /* View Mode */
                            <div className="p-5 space-y-4">
                                {/* Color indicator bar */}
                                <div 
                                    className="h-2 rounded-full -mx-5 -mt-5"
                                    style={{ backgroundColor: formData.color }}
                                />
                                
                                {/* Title */}
                                <div className="mt-4">
                                    <h3 className="text-2xl font-bold text-white">{formData.title}</h3>
                                    <span className={`inline-block mt-2 px-3 py-1 text-xs font-medium rounded-full border capitalize ${getStatusStyle(formData.status)}`}>
                                        {formData.status}
                                    </span>
                                </div>

                                {/* Date & Time */}
                                <div className="flex items-center gap-3 text-gray-300">
                                    <CalendarIcon />
                                    <span>{formatDisplayDate(formData.eventDate)}</span>
                                </div>
                                
                                {formData.startTime && (
                                    <div className="flex items-center gap-3 text-gray-300">
                                        <ClockIcon />
                                        <span>
                                            {formatTime(formData.startTime)}
                                            {formData.endTime && ` - ${formatTime(formData.endTime)}`}
                                        </span>
                                    </div>
                                )}

                                {formData.imageUrl && (
                                    <div className="mt-4 rounded-xl overflow-hidden">
                                        <img 
                                            src={formData.imageUrl} 
                                            alt="Event" 
                                            className="w-full h-40 object-cover"
                                            onError={(e) => { e.target.style.display = 'none'; }}
                                        />
                                    </div>
                                )}

                                {formData.description && (
                                    <div className="pt-4 border-t border-[#2a2a2a]">
                                        <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-line">
                                            {formData.description}
                                        </p>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={handleDelete}
                                        disabled={saving}
                                        className="flex items-center gap-2 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl font-medium transition disabled:opacity-50"
                                    >
                                        <TrashIcon />
                                        Delete
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowModal(false);
                                            resetForm();
                                        }}
                                        className="flex-1 px-4 py-3 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white rounded-xl font-medium transition"
                                    >
                                        Close
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleEditMode}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#8cff65] hover:bg-[#7ae857] text-black rounded-xl font-medium transition"
                                    >
                                        <EditIcon />
                                        Edit
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* Create/Edit Mode */
                            <form onSubmit={handleSubmit} className="p-5 space-y-4">
                                {error && (
                                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                                        {error}
                                    </div>
                                )}

                                {/* Title */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Title <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="Add title here"
                                        className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#8cff65] transition"
                                        required
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Enter event description here"
                                        rows={3}
                                        className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#8cff65] transition resize-none"
                                    />
                                </div>

                                {/* Date */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        <span className="flex items-center gap-2">
                                            <CalendarIcon />
                                            Date <span className="text-red-400">*</span>
                                        </span>
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.eventDate}
                                        onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                                        className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#8cff65] transition"
                                        required
                                    />
                                </div>

                                {/* Time */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Start Time
                                        </label>
                                        <input
                                            type="time"
                                            value={formData.startTime}
                                            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                            className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#8cff65] transition"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            End Time
                                        </label>
                                        <input
                                            type="time"
                                            value={formData.endTime}
                                            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                            className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#8cff65] transition"
                                        />
                                    </div>
                                </div>

                                {/* Event Image URL */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        <span className="flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                                <circle cx="8.5" cy="8.5" r="1.5"/>
                                                <polyline points="21 15 16 10 5 21"/>
                                            </svg>
                                            Event Image URL
                                        </span>
                                    </label>
                                    <input
                                        type="url"
                                        value={formData.imageUrl}
                                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                        placeholder="https://example.com/image.jpg"
                                        className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#8cff65] transition"
                                    />
                                    {formData.imageUrl && (
                                        <div className="mt-2 rounded-lg overflow-hidden h-24">
                                            <img 
                                                src={formData.imageUrl} 
                                                alt="Preview" 
                                                className="w-full h-full object-cover"
                                                onError={(e) => { e.target.style.display = 'none'; }}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Tag Color */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Tag Color
                                    </label>
                                    <div className="flex gap-2 flex-wrap">
                                        {TAG_COLORS.map((color) => (
                                            <button
                                                key={color.value}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, color: color.value })}
                                                className={`w-8 h-8 rounded-lg ${color.bg} transition-all ${
                                                    formData.color === color.value
                                                        ? 'ring-2 ring-white ring-offset-2 ring-offset-[#141414]'
                                                        : 'hover:scale-110'
                                                }`}
                                                title={color.name}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Status */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Status
                                    </label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#8cff65] transition"
                                    >
                                        <option value="upcoming">Upcoming</option>
                                        <option value="ongoing">Ongoing</option>
                                        <option value="completed">Completed</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 pt-4">
                                    {modalMode === 'edit' && (
                                        <button
                                            type="button"
                                            onClick={handleDelete}
                                            disabled={saving}
                                            className="flex items-center gap-2 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl font-medium transition disabled:opacity-50"
                                        >
                                            <TrashIcon />
                                            Delete
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowModal(false);
                                            resetForm();
                                        }}
                                        className="flex-1 px-4 py-3 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white rounded-xl font-medium transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#8cff65] hover:bg-[#7ae857] text-black rounded-xl font-medium transition disabled:opacity-50"
                                    >
                                        {saving ? (
                                            <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                                        ) : modalMode === 'edit' ? (
                                            <>
                                                <EditIcon />
                                                Update
                                            </>
                                        ) : (
                                            <>
                                                <PlusIcon />
                                                Add Event
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminEvents;
