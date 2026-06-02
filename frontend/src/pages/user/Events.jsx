import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { ReactLenis } from 'lenis/react';
import AIFloatingButton from '../../components/common/AIFloatingButton';
import { userAPI, reservationAPI } from '../../services/api-client';
import { useAuth } from '../../hooks/use-auth';
import { sanitizeInput, sanitizeEmail, sanitizePhone } from '../../utils/sanitize';
import { notify } from '../../utils/toast';

gsap.registerPlugin(ScrollTrigger);

const DEFAULT_EVENT_IMAGES = [
    'https://images.unsplash.com/photo-1474511320723-9a56873571b7?w=800',
    'https://images.unsplash.com/photo-1534567153574-2b12153a87f0?w=800',
    'https://images.unsplash.com/photo-1544985361-b420d7a77043?w=800',
    'https://images.unsplash.com/photo-1497752531616-c3afd9760a11?w=800',
    'https://images.unsplash.com/photo-1551085254-e96b210db58a?w=800',
];

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const FILTERS = ['all', 'upcoming', 'ongoing', 'past'];

const Icons = {
    Close: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
        </svg>
    ),
    ChevronLeft: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
    ),
    ChevronRight: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
    ),
    Location: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 flex-shrink-0">
            <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" />
        </svg>
    ),
    Clock: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 flex-shrink-0">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
        </svg>
    ),
    Check: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
        </svg>
    )
};

const StatusBadge = ({ status }) => {
    return (
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium uppercase tracking-widest ${status === 'past' ? 'bg-gray-100 text-gray-500' : 'bg-black text-white'}`}>
            {status}
        </span>
    );
};

const Events = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const containerRef = useRef(null);

    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [filter, setFilter] = useState('all');
    const [calendarDate, setCalendarDate] = useState(new Date());

    const [eventForm, setEventForm] = useState({
        venueEventName: '', venueEventDate: '', venueEventTime: '',
        venueEventDescription: '', numberOfParticipants: 1,
        participantName: '', participantEmail: '', participantPhone: '', notes: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [confirmationData, setConfirmationData] = useState(null);

    useEffect(() => {
        if (user) {
            const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
            setEventForm(prev => ({ ...prev, participantName: fullName, participantEmail: user.email || '' }));
        }
    }, [user]);

    useEffect(() => {
        if (selectedEvent || showSubmitConfirm || showConfirmation) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [selectedEvent, showSubmitConfirm, showConfirmation]);

    const formatDateFromDB = (dateValue) => {
        if (!dateValue) return '';
        if (typeof dateValue === 'string' && dateValue.includes('T')) return dateValue.split('T')[0];
        const d = new Date(dateValue);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const fetchEvents = useCallback(async (showLoading = true) => {
        try {
            if (showLoading) setLoading(true);
            const response = await userAPI.getEvents(true);
            if (response.success && response.events) {
                const todayMidnight = new Date();
                todayMidnight.setHours(0, 0, 0, 0);

                const transformed = response.events.map((event, index) => {
                    const eventDate = formatDateFromDB(event.event_date || event.date);
                    const eventDateObj = new Date(eventDate + 'T00:00:00');

                    let computedStatus = event.status || 'upcoming';
                    if (eventDateObj < todayMidnight) computedStatus = 'past';
                    else if (eventDateObj.getTime() === todayMidnight.getTime()) computedStatus = 'ongoing';
                    else computedStatus = 'upcoming';

                    return {
                        id: event.id,
                        title: event.title || event.name,
                        description: event.description || '',
                        eventDate,
                        startTime: event.start_time || event.time,
                        endTime: event.end_time,
                        location: event.location || 'Zoo Bulusan',
                        status: computedStatus,
                        imageUrl: event.image_url || DEFAULT_EVENT_IMAGES[index % DEFAULT_EVENT_IMAGES.length],
                        tags: event.tags || ['Wildlife', 'Education'],
                    };
                });

                transformed.sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));
                setEvents(transformed);
            } else {
                setEvents([]);
            }
        } catch (err) {
            console.error(err);
            if (showLoading) setError('Failed to load events.');
            setEvents([]);
        } finally {
            if (showLoading) setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEvents();
        const pollInterval = setInterval(() => fetchEvents(false), 60000);
        return () => clearInterval(pollInterval);
    }, [fetchEvents]);

    useEffect(() => {
        if (!loading) {
            const ctx = gsap.context(() => {
                gsap.fromTo('.section-anim',
                    { y: 40, opacity: 0 },
                    {
                        scrollTrigger: {
                            trigger: '.section-anim',
                            start: 'top 85%',
                        },
                        y: 0,
                        opacity: 1,
                        duration: 0.8,
                        ease: 'power3.out'
                    }
                );
            }, containerRef);
            return () => ctx.revert();
        }
    }, [loading, events, filter, calendarDate]);

    const formatTime = (time) => {
        if (!time) return '';
        const [hours, minutes] = time.split(':');
        const h = parseInt(hours, 10);
        return `${h % 12 || 12}:${minutes} ${h >= 12 ? 'PM' : 'AM'}`;
    };

    const formatDisplayDate = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric',
        });
    };

    const getMinDate = () => new Date().toISOString().split('T')[0];

    const calYear = calendarDate.getFullYear();
    const calMonth = calendarDate.getMonth();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay();

    const calendarCells = [];
    for (let i = 0; i < firstDayOfWeek; i++) calendarCells.push(null);
    for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);

    const isToday = (day) => {
        const now = new Date();
        return day === now.getDate() && calMonth === now.getMonth() && calYear === now.getFullYear();
    };

    const getFilteredEvents = () => {
        if (filter === 'all') return events;
        return events.filter(e => e.status === filter);
    };

    const filteredEvents = getFilteredEvents();

    const getEventsForDay = (day) => {
        if (!day) return [];
        const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return filteredEvents.filter(e => e.eventDate === dateStr);
    };

    const hasAnyEventInMonth = calendarCells.some(day => day && getEventsForDay(day).length > 0);

    const prevMonth = () => setCalendarDate(new Date(calYear, calMonth - 1, 1));
    const nextMonth = () => setCalendarDate(new Date(calYear, calMonth + 1, 1));

    const handleSubmitAttempt = (e) => {
        e.preventDefault();
        if (!isAuthenticated) {
            notify.warning('Please authenticate to submit a reservation request.');
            navigate('/login');
            return;
        }
        if (!eventForm.venueEventName || !eventForm.venueEventDate) {
            notify.warning('Please provide the event name and date.');
            return;
        }
        setShowSubmitConfirm(true);
    };

    const confirmSubmit = async () => {
        setShowSubmitConfirm(false);
        setIsSubmitting(true);
        try {
            const res = await reservationAPI.createEventReservation({
                venueEventName: eventForm.venueEventName,
                venueEventDate: eventForm.venueEventDate,
                venueEventTime: eventForm.venueEventTime,
                venueEventDescription: eventForm.venueEventDescription,
                participantName: eventForm.participantName,
                participantEmail: eventForm.participantEmail,
                participantPhone: eventForm.participantPhone,
                numberOfParticipants: parseInt(eventForm.numberOfParticipants) || 1,
                notes: eventForm.notes
            });
            if (res.success) {
                setConfirmationData({
                    type: 'event',
                    reference: res.reservationReference,
                    eventName: eventForm.venueEventName,
                    eventDate: eventForm.venueEventDate,
                    participants: eventForm.numberOfParticipants
                });
                setShowConfirmation(true);
                const fullName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '';
                setEventForm({
                    venueEventName: '', venueEventDate: '', venueEventTime: '',
                    venueEventDescription: '', numberOfParticipants: 1,
                    participantName: fullName, participantEmail: user?.email || '',
                    participantPhone: '', notes: ''
                });
            } else {
                throw new Error(res.message || 'Failed to create reservation');
            }
        } catch (err) {
            notify.error(err.message || 'We could not complete your reservation. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ReactLenis root>
            <div ref={containerRef} className="min-h-screen bg-white text-black">
                <Header />

                <div className="w-full min-h-[40vh] md:min-h-[60vh] flex flex-col items-center justify-center px-4 pt-24 pb-8">
                    <h1 className="text-[3.5rem] sm:text-[6rem] md:text-[9rem] lg:text-[11rem] leading-none tracking-tight text-black text-center break-words w-full">
                        Events
                    </h1>
                </div>

                <div className="max-w-8xl mx-auto px-4 md:px-8 pb-20 md:pb-32">
                    <div className="flex flex-wrap gap-2 md:gap-4 justify-center mb-10 md:mb-16">
                        {FILTERS.map(f => {
                            const active = filter === f;
                            return (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`text-xs md:text-xs uppercase tracking-widest px-0.5 py-2 md:px-4 md:py-3 font-bold transition-colors rounded-full border-2 ${active ? 'border-black bg-black text-white' : 'border-gray-200 text-gray-500 hover:border-black hover:text-black'}`}
                                >
                                    {f === 'all' ? 'All Events' : f}
                                </button>
                            );
                        })}
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-40">
                            <div className="w-8 h-8 border-2 border-gray-200 border-t-black rounded-full animate-spin" />
                        </div>
                    ) : (
                        <div className="section-anim bg-white border border-gray-200 rounded-xl md:rounded-2xl shadow-sm overflow-hidden">
                            <div className="flex flex-col sm:flex-row items-center justify-between p-4 md:p-8 border-b border-gray-200 gap-4">
                                <h2 className="text-2xl sm:text-3xl md:text-4xl text-black">
                                    {MONTHS[calMonth]} {calYear}
                                </h2>
                                <div className="flex items-center gap-2 md:gap-4">
                                    <button onClick={prevMonth} className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full border border-gray-200 hover:bg-gray-50 transition-colors">
                                        <Icons.ChevronLeft />
                                    </button>
                                    <button onClick={() => setCalendarDate(new Date())} className="px-4 md:px-6 h-10 md:h-12 rounded-full border border-gray-200 hover:bg-gray-50 text-[10px] md:text-xs font-bold uppercase tracking-widest transition-colors">
                                        Today
                                    </button>
                                    <button onClick={nextMonth} className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full border border-gray-200 hover:bg-gray-50 transition-colors">
                                        <Icons.ChevronRight />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
                                {DAYS_SHORT.map(day => (
                                    <div key={day} className="py-2 md:py-4 text-center border-r border-gray-200 last:border-r-0">
                                        <span className="text-[10px] md:text-xs uppercase tracking-widest font-bold text-gray-400">{day}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-7 bg-[#F2F0EB]">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={`${calYear}-${calMonth}-${filter}`}
                                        className="contents"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        {calendarCells.map((day, i) => {
                                            const dayEvents = getEventsForDay(day);
                                            const isCurrentDay = isToday(day);
                                            const featuredEvent = dayEvents[0];

                                            return (
                                                <div
                                                    key={i}
                                                    className={`min-h-[120px] sm:min-h-[150px] md:min-h-[220px] border-r border-b border-gray-300 relative overflow-hidden group ${day ? 'hover:bg-black/5 cursor-pointer transition-colors' : 'bg-transparent'}`}
                                                    onClick={() => featuredEvent && setSelectedEvent(featuredEvent)}
                                                >
                                                    {day && (
                                                        <>
                                                            {featuredEvent && featuredEvent.imageUrl ? (
                                                                <div className="absolute inset-0 w-full h-full">
                                                                    <img
                                                                        src={featuredEvent.imageUrl}
                                                                        alt={featuredEvent.title}
                                                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                                    />
                                                                    <div className="absolute top-3 left-3 md:top-4 md:left-4 z-10">
                                                                        <span className={`inline-flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full text-[10px] sm:text-xs font-bold ${isCurrentDay ? 'bg-blue-600 text-white' : 'bg-black text-white shadow-md'}`}>
                                                                            {day}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="p-3 md:p-4 h-full flex flex-col">
                                                                    <span className={`inline-flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 text-[10px] sm:text-xs font-bold mb-3 md:mb-4 ${dayEvents.length > 0 || isCurrentDay ? 'bg-black text-white rounded-full' : 'text-black'}`}>
                                                                        {day}
                                                                    </span>

                                                                    {dayEvents.length > 0 && (
                                                                        <div className="flex flex-col gap-3 mt-1">
                                                                            {dayEvents.map((event) => (
                                                                                <div key={event.id} className="text-left w-full group-hover:opacity-80 transition-opacity">
                                                                                    <div className="font-medium text-[10px] sm:text-[11px] md:text-sm text-black leading-tight">
                                                                                        {event.title}
                                                                                    </div>
                                                                                    <div className="text-[9px] sm:text-[10px] md:text-xs text-gray-500 mt-1 uppercase tracking-widest">
                                                                                        {formatTime(event.startTime)}
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            {!hasAnyEventInMonth && (
                                <div className="p-8 md:p-12 text-center text-gray-400 text-xs md:text-sm tracking-widest uppercase">
                                    No events scheduled for this month.
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <section className="bg-[#c6fe69] py-16 md:py-32 px-4 border-t border-gray-200">
                    <div className="max-w-4xl mx-auto section-anim">
                        <div className="text-center mb-10 md:mb-16">
                            <h2 className="text-3xl md:text-5xl lg:text-6xl text-black mb-4">Plan Your Own Event</h2>
                            <p className="text-gray-500 text-sm md:text-lg px-4">Book our venue for your private gatherings and educational tours.</p>
                        </div>

                        <form onSubmit={handleSubmitAttempt} className="bg-white p-6 sm:p-8 md:p-12 rounded-xl md:rounded-2xl shadow-sm border border-gray-200">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-6 md:mb-8">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-gray-500">Event Name *</label>
                                    <input
                                        type="text"
                                        value={eventForm.venueEventName}
                                        onChange={e => setEventForm({ ...eventForm, venueEventName: sanitizeInput(e.target.value) })}
                                        className="border-b border-gray-300 py-2 md:py-3 text-sm md:text-base text-black font-medium focus:border-black outline-none bg-transparent transition-colors rounded-none"
                                        placeholder="E.g., Corporate Retreat"
                                        required
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-gray-500">Estimated Attendees *</label>
                                    <input
                                        type="number"
                                        value={eventForm.numberOfParticipants}
                                        onChange={e => setEventForm({ ...eventForm, numberOfParticipants: e.target.value })}
                                        min="1" max="500"
                                        className="border-b border-gray-300 py-2 md:py-3 text-sm md:text-base text-black font-medium focus:border-black outline-none bg-transparent transition-colors rounded-none"
                                        required
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-gray-500">Event Date *</label>
                                    <input
                                        type="date"
                                        value={eventForm.venueEventDate}
                                        onChange={e => setEventForm({ ...eventForm, venueEventDate: e.target.value })}
                                        min={getMinDate()}
                                        className="border-b border-gray-300 py-2 md:py-3 text-sm md:text-base text-black font-medium focus:border-black outline-none bg-transparent transition-colors rounded-none"
                                        required
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-gray-500">Event Time</label>
                                    <input
                                        type="time"
                                        value={eventForm.venueEventTime}
                                        onChange={e => setEventForm({ ...eventForm, venueEventTime: e.target.value })}
                                        className="border-b border-gray-300 py-2 md:py-3 text-sm md:text-base text-black font-medium focus:border-black outline-none bg-transparent transition-colors rounded-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-6 md:mb-8 pt-6 md:pt-8 border-t border-gray-100">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-gray-500">Full Name *</label>
                                    <input
                                        type="text"
                                        value={eventForm.participantName}
                                        onChange={e => setEventForm({ ...eventForm, participantName: sanitizeInput(e.target.value) })}
                                        className="border-b border-gray-300 py-2 md:py-3 text-sm md:text-base text-black font-medium focus:border-black outline-none bg-transparent transition-colors rounded-none"
                                        placeholder="John Doe"
                                        required
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-gray-500">Email Address *</label>
                                    <input
                                        type="email"
                                        value={eventForm.participantEmail}
                                        onChange={e => setEventForm({ ...eventForm, participantEmail: sanitizeEmail(e.target.value) })}
                                        className="border-b border-gray-300 py-2 md:py-3 text-sm md:text-base text-black font-medium focus:border-black outline-none bg-transparent transition-colors rounded-none"
                                        placeholder="john@example.com"
                                        required
                                    />
                                </div>
                                <div className="flex flex-col gap-2 md:col-span-2">
                                    <label className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-gray-500">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={eventForm.participantPhone}
                                        onChange={e => setEventForm({ ...eventForm, participantPhone: sanitizePhone(e.target.value) })}
                                        className="border-b border-gray-300 py-2 md:py-3 text-sm md:text-base text-black font-medium focus:border-black outline-none bg-transparent transition-colors rounded-none"
                                        placeholder="+63 900 000 0000"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 mb-10 md:mb-12">
                                <label className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-gray-500">Additional Details & Requirements</label>
                                <textarea
                                    value={eventForm.venueEventDescription}
                                    onChange={e => setEventForm({ ...eventForm, venueEventDescription: sanitizeInput(e.target.value) })}
                                    className="border-b border-gray-300 py-2 md:py-3 text-sm md:text-base text-black font-medium focus:border-black outline-none bg-transparent transition-colors min-h-[80px] md:min-h-[100px] resize-y rounded-none"
                                    placeholder="Please describe your event setup, specific requests, or questions..."
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-4 md:py-5 bg-black text-white rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest hover:bg-gray-800 disabled:opacity-50 transition-colors"
                            >
                                {isSubmitting ? 'Processing...' : 'Submit Request'}
                            </button>
                        </form>
                    </div>
                </section>

                <AnimatePresence>
                    {selectedEvent && (
                        <motion.div
                            key="modal-backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-8"
                            onClick={(e) => e.target === e.currentTarget && setSelectedEvent(null)}
                        >
                            <motion.div
                                key="modal-panel"
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
                                className="w-full md:max-w-5xl bg-white rounded-xl md:rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
                            >
                                <div className="w-full md:w-1/2 h-48 sm:h-64 md:h-auto relative bg-gray-100 flex-shrink-0">
                                    <img src={selectedEvent.imageUrl} alt={selectedEvent.title} className="absolute inset-0 w-full h-full object-cover" />
                                </div>
                                <div className="w-full md:w-1/2 p-6 md:p-12 flex flex-col overflow-y-auto">
                                    <div className="flex justify-between items-start mb-6 md:mb-8">
                                        <StatusBadge status={selectedEvent.status} />
                                        <button
                                            onClick={() => setSelectedEvent(null)}
                                            className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                                        >
                                            <Icons.Close />
                                        </button>
                                    </div>

                                    <h2 className="text-3xl sm:text-4xl md:text-5xl text-black leading-none mb-3 md:mb-4 break-words">
                                        {selectedEvent.title}
                                    </h2>
                                    <p className="text-gray-500 uppercase tracking-widest text-xs md:text-sm mb-6 md:mb-8">
                                        {formatDisplayDate(selectedEvent.eventDate)}
                                    </p>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 mb-6 md:mb-8 border-t border-gray-200 pt-6 md:pt-8">
                                        <div>
                                            <h4 className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Time</h4>
                                            <p className="text-black font-medium text-sm md:text-base flex items-center gap-2">
                                                <Icons.Clock />
                                                {formatTime(selectedEvent.startTime) || '—'}
                                                {selectedEvent.endTime && <span className="text-gray-500">to {formatTime(selectedEvent.endTime)}</span>}
                                            </p>
                                        </div>
                                        <div>
                                            <h4 className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Location</h4>
                                            <p className="text-black font-medium text-sm md:text-base flex items-center gap-2">
                                                <Icons.Location />
                                                {selectedEvent.location}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mb-6 md:mb-8">
                                        <h4 className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 md:mb-4">About this Event</h4>
                                        <p className="text-gray-700 text-sm md:text-base leading-relaxed">
                                            {selectedEvent.description || 'Join us for an immersive wildlife experience. Learn directly from our experts and connect with nature.'}
                                        </p>
                                    </div>

                                    {selectedEvent.tags && selectedEvent.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-auto">
                                            {selectedEvent.tags.map((tag, i) => (
                                                <span key={i} className="px-3 py-1 md:px-4 md:py-2 bg-gray-100 rounded-full text-[10px] md:text-xs font-medium text-gray-600">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {showSubmitConfirm && (
                        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white rounded-2xl w-full max-w-md relative z-10 overflow-hidden shadow-2xl p-6 md:p-8 text-center"
                            >
                                <div className="w-12 h-12 md:w-16 md:h-16 mx-auto bg-black text-white rounded-full flex items-center justify-center mb-4 md:mb-6"><Icons.Check /></div>
                                <h3 className="text-2xl md:text-3xl mb-2 text-black">Verify Details</h3>
                                <p className="text-gray-500 text-sm mb-6 md:mb-8">Please ensure the information below is correct.</p>

                                <div className="space-y-3 md:space-y-4 mb-6 md:mb-8 text-left bg-gray-50 p-4 md:p-6 rounded-xl border border-gray-100 text-sm md:text-base">
                                    <div className="flex justify-between border-b border-gray-200 pb-2">
                                        <span className="text-[10px] md:text-xs font-bold uppercase text-gray-400">Event</span>
                                        <span className="font-medium text-black truncate max-w-[150px] sm:max-w-[200px]">{eventForm.venueEventName}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-gray-200 pb-2">
                                        <span className="text-[10px] md:text-xs font-bold uppercase text-gray-400">Date</span>
                                        <span className="font-medium text-black">{formatDateFromDB(eventForm.venueEventDate)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[10px] md:text-xs font-bold uppercase text-gray-400">Attendees</span>
                                        <span className="font-medium text-black">{eventForm.numberOfParticipants}</span>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                                    <button onClick={() => setShowSubmitConfirm(false)} className="flex-1 py-3 md:py-4 rounded-full border border-gray-200 text-[10px] md:text-xs font-bold uppercase tracking-widest text-black hover:bg-gray-50">Return</button>
                                    <button onClick={confirmSubmit} disabled={isSubmitting} className="flex-1 py-3 md:py-4 rounded-full bg-black text-white text-[10px] md:text-xs font-bold uppercase tracking-widest hover:bg-gray-800 disabled:opacity-50">
                                        {isSubmitting ? 'Wait...' : 'Confirm'}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {showConfirmation && confirmationData && (
                        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                            <motion.div
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                                className="bg-white rounded-2xl w-full max-w-md p-8 md:p-10 relative z-10 text-center shadow-2xl"
                            >
                                <div className="mb-4 md:mb-6 text-green-500 flex justify-center"><Icons.Check /></div>
                                <h3 className="text-3xl md:text-4xl mb-2 text-black">Confirmed</h3>
                                <p className="text-gray-500 text-sm mb-6 md:mb-8">Your reservation request has been received.</p>

                                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 md:p-6 mb-6 md:mb-8">
                                    <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-gray-400 block mb-2">Reference ID</span>
                                    <span className="text-xl md:text-2xl text-black">{confirmationData.reference}</span>
                                </div>

                                <div className="space-y-3">
                                    <button onClick={() => { setShowConfirmation(false); navigate('/reservations'); }} className="w-full py-3 md:py-4 bg-black text-white rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest hover:bg-gray-800">
                                        Manage Bookings
                                    </button>
                                    <button onClick={() => setShowConfirmation(false)} className="w-full py-3 md:py-4 border border-gray-200 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest text-black hover:bg-gray-50">
                                        Dismiss
                                    </button>
                                </div>
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

export default Events;