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
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
    ),
    ChevronRight: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
    ),
    Location: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 flex-shrink-0">
            <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" />
        </svg>
    ),
    Clock: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 flex-shrink-0">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
        </svg>
    ),
    ArrowDiag: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
        </svg>
    ),
    Check: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-[#212631]">
            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
        </svg>
    )
};

const StatusBadge = ({ status, size = 'sm' }) => {
    const sizing = size === 'sm' ? 'text-[8px] px-2 py-1' : 'text-[10px] md:text-xs px-3 py-1.5';
    return (
        <span className={`inline-block border rounded-full uppercase tracking-widest font-normal leading-none ${sizing} border-[#212631] text-[#212631] ${status === 'past' ? 'opacity-40' : ''}`}>
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
                        location: event.location || 'Zoo Bulusan Venue',
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
                gsap.fromTo('.hero-anim',
                    { y: 30, opacity: 0 },
                    { y: 0, opacity: 1, duration: 1, stagger: 0.1, ease: 'power3.out' }
                );

                gsap.utils.toArray('.event-anim').forEach((el) => {
                    gsap.fromTo(el,
                        { y: 30, opacity: 0 },
                        {
                            scrollTrigger: {
                                trigger: el,
                                start: 'top 95%'
                            },
                            y: 0, opacity: 1, duration: 0.6, ease: 'power2.out'
                        }
                    );
                });
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

    const parseDateParts = (dateStr) => {
        if (!dateStr) return { day: '', month: '', year: '' };
        const d = new Date(dateStr + 'T00:00:00');
        return {
            day: String(d.getDate()).padStart(2, '0'),
            month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
            year: String(d.getFullYear()),
        };
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

    const upcomingFiltered = filteredEvents.filter(e => e.status !== 'past');
    const pastFiltered = filteredEvents.filter(e => e.status === 'past');

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
            <div ref={containerRef} className="min-h-screen flex flex-col bg-[#ebebeb] text-[#212631]">
                <Header />

                <section className="pt-24 md:pt-32 pb-8 px-4 md:px-8 lg:px-12 max-w-[1600px] mx-auto w-full border-b border-[#212631]/10">
                    <p className="hero-anim inline-block bg-[#212631]/5 px-4 py-1.5 rounded-full text-[10px] md:text-xs uppercase tracking-[0.35em] font-normal mb-4 md:mb-6 text-[#212631]/50">
                        Zoo Bulusan Network
                    </p>

                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 md:gap-12 mb-10">
                        <div className="flex-1 min-w-0">
                            <div className="overflow-hidden rounded-3xl">
                                <h1 className="hero-anim text-5xl md:text-7xl lg:text-8xl xl:text-9xl font-normal uppercase tracking-tighter leading-[0.9] text-[#212631]">
                                    Activities &
                                </h1>
                            </div>
                            <div className="overflow-hidden rounded-3xl">
                                <h1 className="hero-anim text-5xl md:text-7xl lg:text-8xl xl:text-9xl font-normal uppercase tracking-tighter leading-[0.9] text-[#26bc61]">
                                    Events
                                </h1>
                            </div>
                        </div>

                        <div className="hero-anim flex flex-col gap-4 md:items-end shrink-0">
                            <p className="text-[10px] md:text-xs uppercase tracking-widest font-normal leading-relaxed max-w-xs md:text-right text-[#212631]/60">
                                Experience unforgettable moments with our animals through live feedings, shows, and educational activities.
                            </p>
                            <div className="flex items-center gap-2 flex-wrap mt-2">
                                {[
                                    { value: events.length, label: 'Total' },
                                    { value: events.filter(e => e.status === 'ongoing').length, label: 'Ongoing' },
                                    { value: events.filter(e => e.status === 'upcoming').length, label: 'Upcoming' },
                                ].map(({ value, label }) => (
                                    <div key={label} className="flex items-center gap-2 px-4 py-2 border border-[#212631]/20 bg-[#212631]/5 rounded-full">
                                        <span className="text-sm font-normal tabular-nums text-[#212631]">{value}</span>
                                        <span className="text-[9px] uppercase tracking-widest font-normal text-[#212631]/50">{label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <div className="px-4 md:px-8 lg:px-12 max-w-[1600px] mx-auto w-full pt-8 pb-20">
                    <div className="hero-anim flex items-center gap-2 mb-8 overflow-x-auto no-scrollbar pb-2">
                        {FILTERS.map(f => {
                            const active = filter === f;
                            const label = f === 'all' ? 'All Events' : f;
                            return (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`text-[9px] md:text-[10px] uppercase tracking-[0.2em] px-6 py-3 font-normal border transition-colors whitespace-nowrap rounded-full ${active ? 'border-[#212631] bg-[#212631] text-[#ebebeb]' : 'border-[#212631]/20 text-[#212631]/50 hover:bg-[#212631]/10 hover:text-[#212631]'}`}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>

                    {loading && (
                        <div className="flex items-center justify-center py-40">
                            <motion.div
                                className="w-8 h-8 border-2 border-[#212631]/20 border-t-[#212631] rounded-full"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                            />
                        </div>
                    )}

                    {!loading && !error && (
                        <>
                            <div className="hidden md:block event-anim">
                                <div className="flex items-center justify-between mb-6 bg-[#ebebeb] border border-[#212631]/20 p-4 rounded-3xl">
                                    <div className="flex items-center gap-4 px-2">
                                        <h2 className="text-2xl font-normal uppercase tracking-tighter text-[#212631]">
                                            {MONTHS[calMonth]}
                                        </h2>
                                        <span className="text-lg font-normal text-[#212631]/40 tracking-widest mt-1">
                                            {calYear}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={prevMonth} className="w-10 h-10 rounded-full flex items-center justify-center border border-[#212631]/20 text-[#212631] hover:bg-[#212631] hover:text-[#ebebeb] transition-colors cursor-pointer">
                                            <Icons.ChevronLeft />
                                        </button>
                                        <button onClick={() => setCalendarDate(new Date())} className="px-6 h-10 rounded-full flex items-center justify-center text-[10px] uppercase tracking-widest font-normal border border-[#212631]/20 text-[#212631] hover:bg-[#212631] hover:text-[#ebebeb] transition-colors cursor-pointer">
                                            Today
                                        </button>
                                        <button onClick={nextMonth} className="w-10 h-10 rounded-full flex items-center justify-center border border-[#212631]/20 text-[#212631] hover:bg-[#212631] hover:text-[#ebebeb] transition-colors cursor-pointer">
                                            <Icons.ChevronRight />
                                        </button>
                                    </div>
                                </div>

                                <div className="rounded-3xl overflow-hidden border border-[#212631]/10">
                                    <div className="grid grid-cols-7 bg-[#ebebeb]">
                                        {DAYS_SHORT.map(day => (
                                            <div key={day} className="px-4 py-3 border-r border-b border-[#212631]/10 bg-[#212631]/5 text-center">
                                                <span className="text-[10px] uppercase tracking-widest font-normal text-[#212631]/60">{day}</span>
                                            </div>
                                        ))}

                                        <AnimatePresence mode="wait">
                                            <motion.div
                                                key={`${calYear}-${calMonth}-${filter}`}
                                                className="contents"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                {calendarCells.map((day, i) => {
                                                    const dayEvents = getEventsForDay(day);
                                                    const isCurrentDay = isToday(day);

                                                    return (
                                                        <div key={i} className={`border-r border-b border-[#212631]/10 flex flex-col min-h-[100px] lg:min-h-[140px] rounded-xl ${day ? 'bg-[#ebebeb] hover:bg-[#212631]/5 transition-colors' : 'bg-[#212631]/5'}`}>
                                                            {day && (
                                                                <>
                                                                    <div className="px-2 pt-2 pb-1">
                                                                        <span className={`inline-block text-[10px] lg:text-xs font-normal uppercase tracking-tighter leading-none rounded-full ${isCurrentDay ? 'bg-[#212631] text-[#ebebeb] px-2 py-1' : 'text-[#212631] px-1'}`}>
                                                                            {day}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex flex-col gap-1.5 px-1.5 pb-2 flex-1">
                                                                        {dayEvents.slice(0, 2).map((event) => (
                                                                            <button
                                                                                key={event.id}
                                                                                onClick={() => setSelectedEvent(event)}
                                                                                className="w-full text-left overflow-hidden border border-[#212631]/20 bg-[#ebebeb] rounded-xl group flex items-center gap-2 p-1 cursor-pointer hover:bg-white transition-colors"
                                                                            >
                                                                                <div className="w-8 h-8 flex-shrink-0 border border-[#212631]/10 overflow-hidden rounded-lg">
                                                                                    <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all rounded-lg" />
                                                                                </div>
                                                                                <div className="flex flex-col flex-1 min-w-0">
                                                                                    <span className="text-[8px] lg:text-[9px] font-normal uppercase tracking-tight text-[#212631] truncate block">
                                                                                        {event.title}
                                                                                    </span>
                                                                                    <span className="text-[7px] uppercase font-normal tracking-widest text-[#212631]/50 mt-0.5 block truncate">
                                                                                        {formatTime(event.startTime)}
                                                                                    </span>
                                                                                </div>
                                                                            </button>
                                                                        ))}
                                                                        {dayEvents.length > 2 && (
                                                                            <button
                                                                                onClick={() => setSelectedEvent(dayEvents[2])}
                                                                                className="text-[8px] font-normal uppercase tracking-widest px-1 text-left text-[#212631]/60 hover:text-[#212631] transition-colors mt-1 rounded-full cursor-pointer"
                                                                            >
                                                                                +{dayEvents.length - 2} More
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </motion.div>
                                        </AnimatePresence>
                                    </div>

                                    {!hasAnyEventInMonth && (
                                        <div className="text-center py-16 bg-[#ebebeb] rounded-b-3xl">
                                            <p className="text-[10px] uppercase tracking-widest font-normal text-[#212631]/40 mb-1">
                                                No {filter === 'all' ? '' : filter} events in {MONTHS[calMonth]}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="md:hidden bg-[#ebebeb] border border-[#212631]/10 p-4 rounded-3xl">
                                {filteredEvents.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-center gap-2">
                                        <p className="text-[10px] font-normal uppercase tracking-widest text-[#212631]/40">No events found</p>
                                    </div>
                                ) : (
                                    <>
                                        {upcomingFiltered.length > 0 && (
                                            <div className="mb-10">
                                                <div className="flex items-end justify-between mb-4 border-b border-[#212631]/20 pb-2">
                                                    <p className="text-[10px] uppercase tracking-[0.25em] font-normal text-[#212631]">
                                                        {filter === 'all' ? 'Upcoming' : filter}
                                                    </p>
                                                    <span className="text-lg font-normal text-[#212631]/20">{calYear}</span>
                                                </div>
                                                {upcomingFiltered.map((event) => {
                                                    const { day, month, year } = parseDateParts(event.eventDate);
                                                    return (
                                                        <div
                                                            key={event.id}
                                                            onClick={() => setSelectedEvent(event)}
                                                            onKeyDown={(e) => e.key === 'Enter' && setSelectedEvent(event)}
                                                            className="event-anim group flex items-center gap-4 py-4 cursor-pointer border-b border-[#212631]/10 hover:bg-[#212631]/5 transition-colors rounded-2xl px-2"
                                                            role="button"
                                                            tabIndex={0}
                                                        >
                                                            <div className="w-14 h-14 flex-shrink-0 overflow-hidden border border-[#212631]/20 rounded-xl">
                                                                <img
                                                                    src={event.imageUrl}
                                                                    alt={event.title}
                                                                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 rounded-xl"
                                                                />
                                                            </div>

                                                            <div className="w-10 flex-shrink-0 flex flex-col items-start">
                                                                <span className="text-lg font-normal leading-none tabular-nums text-[#212631]">{day}</span>
                                                                <span className="text-[10px] font-normal uppercase leading-none mt-0.5 text-[#212631]/60">{month}</span>
                                                                <span className="text-[9px] font-normal leading-none mt-0.5 text-[#212631]/40">{year}</span>
                                                            </div>

                                                            <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                                                                <h3 className="text-sm font-normal uppercase tracking-tight truncate group-hover:underline underline-offset-2 text-[#212631]">
                                                                    {event.title}
                                                                </h3>
                                                                <div><StatusBadge status={event.status} size="sm" /></div>
                                                                <p className="text-[9px] uppercase tracking-widest font-normal flex items-center gap-1 text-[#212631]/60">
                                                                    <Icons.Location />
                                                                    <span className="truncate">{event.location}</span>
                                                                </p>
                                                            </div>

                                                            <div className="flex-shrink-0 text-[#212631]/40 group-hover:text-[#212631] transition-colors pr-2">
                                                                <Icons.ArrowDiag />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {pastFiltered.length > 0 && (
                                            <div>
                                                <div className="flex items-end justify-between mb-4 border-b border-[#212631]/20 pb-2 pt-6">
                                                    <p className="text-[10px] uppercase tracking-[0.25em] font-normal text-[#212631]/50">Past Events</p>
                                                </div>
                                                {pastFiltered.map((event) => {
                                                    const { day, month, year } = parseDateParts(event.eventDate);
                                                    return (
                                                        <div
                                                            key={event.id}
                                                            onClick={() => setSelectedEvent(event)}
                                                            onKeyDown={(e) => e.key === 'Enter' && setSelectedEvent(event)}
                                                            className="event-anim group flex items-center gap-4 py-4 cursor-pointer border-b border-[#212631]/10 hover:bg-[#212631]/5 transition-colors rounded-2xl px-2"
                                                            role="button"
                                                            tabIndex={0}
                                                        >
                                                            <div className="w-14 h-14 flex-shrink-0 overflow-hidden border border-[#212631]/20 rounded-xl">
                                                                <img
                                                                    src={event.imageUrl}
                                                                    alt={event.title}
                                                                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 rounded-xl"
                                                                />
                                                            </div>

                                                            <div className="w-10 flex-shrink-0 flex flex-col items-start">
                                                                <span className="text-lg font-normal leading-none tabular-nums text-[#212631]">{day}</span>
                                                                <span className="text-[10px] font-normal uppercase leading-none mt-0.5 text-[#212631]/60">{month}</span>
                                                                <span className="text-[9px] font-normal leading-none mt-0.5 text-[#212631]/40">{year}</span>
                                                            </div>

                                                            <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                                                                <h3 className="text-sm font-normal uppercase tracking-tight truncate group-hover:underline underline-offset-2 text-[#212631]">
                                                                    {event.title}
                                                                </h3>
                                                                <div><StatusBadge status={event.status} size="sm" /></div>
                                                                <p className="text-[9px] uppercase tracking-widest font-normal flex items-center gap-1 text-[#212631]/60">
                                                                    <Icons.Location />
                                                                    <span className="truncate">{event.location}</span>
                                                                </p>
                                                            </div>

                                                            <div className="flex-shrink-0 text-[#212631]/40 group-hover:text-[#212631] transition-colors pr-2">
                                                                <Icons.ArrowDiag />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </>
                    )}
                </div>

                <section id="book-event" className="w-full bg-[#ffdd45] border-t border-[#212631]/10 pt-20 pb-40 px-4 md:px-8 relative z-10 rounded-t-3xl">
                    <div className="max-w-4xl mx-auto flex flex-col items-center event-anim">
                        <div className="text-center mb-16">
                            <span className="text-[10px] tracking-[0.3em] uppercase font-normal text-[#212631]/40 mb-4 block bg-[#212631]/5 px-4 py-1.5 rounded-full w-fit mx-auto">Venue Protocol</span>
                            <h2 className="text-4xl md:text-6xl font-normal uppercase tracking-tighter text-[#212631] mb-6">Plan Your Own Event</h2>
                            <p className="text-sm tracking-widest uppercase font-normal text-[#212631]/60 leading-relaxed max-w-2xl mx-auto">
                                Secure a spot for private gatherings, educational tours, or custom programs at Zoo Bulusan.
                            </p>
                        </div>

                        <div className="w-full border border-[#212631]/20 p-8 md:p-12 bg-[#ebebeb] shadow-2xl relative rounded-3xl">
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#26bc61]" />
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-8 h-8 rounded-full bg-[#26bc61]" />

                            <form onSubmit={handleSubmitAttempt} className="flex flex-col gap-8 w-full z-10 relative">
                                <div className="flex flex-col gap-6">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[9px] tracking-[0.2em] uppercase font-normal text-[#212631]/60 px-2">Event Designation *</label>
                                        <input
                                            type="text"
                                            value={eventForm.venueEventName}
                                            onChange={e => setEventForm({ ...eventForm, venueEventName: sanitizeInput(e.target.value) })}
                                            className="w-full bg-[#212631]/5 border border-[#212631]/20 p-4 rounded-2xl text-sm font-normal uppercase tracking-tight text-[#212631] focus:border-[#212631] outline-none transition-colors placeholder:text-[#212631]/30"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[9px] tracking-[0.2em] uppercase font-normal text-[#212631]/60 px-2">Event Date *</label>
                                            <input
                                                type="date"
                                                value={eventForm.venueEventDate}
                                                onChange={e => setEventForm({ ...eventForm, venueEventDate: e.target.value })}
                                                min={getMinDate()}
                                                className="w-full bg-[#212631]/5 border border-[#212631]/20 p-4 rounded-2xl text-sm font-normal uppercase tracking-wider text-[#212631] focus:border-[#212631] outline-none transition-colors h-[54px]"
                                                required
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[9px] tracking-[0.2em] uppercase font-normal text-[#212631]/60 px-2">Event Time</label>
                                            <input
                                                type="time"
                                                value={eventForm.venueEventTime}
                                                onChange={e => setEventForm({ ...eventForm, venueEventTime: e.target.value })}
                                                className="w-full bg-[#212631]/5 border border-[#212631]/20 p-4 rounded-2xl text-sm font-normal uppercase tracking-wider text-[#212631] focus:border-[#212631] outline-none transition-colors h-[54px]"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[9px] tracking-[0.2em] uppercase font-normal text-[#212631]/60 px-2">Headcount (Max 500) *</label>
                                            <input
                                                type="number"
                                                value={eventForm.numberOfParticipants}
                                                onChange={e => setEventForm({ ...eventForm, numberOfParticipants: e.target.value })}
                                                min="1" max="500"
                                                className="w-full bg-[#212631]/5 border border-[#212631]/20 p-4 rounded-2xl text-sm font-normal uppercase tracking-tight text-[#212631] focus:border-[#212631] outline-none transition-colors"
                                                required
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[9px] tracking-[0.2em] uppercase font-normal text-[#212631]/60 px-2">Contact Phone</label>
                                            <input
                                                type="tel"
                                                value={eventForm.participantPhone}
                                                onChange={e => setEventForm({ ...eventForm, participantPhone: sanitizePhone(e.target.value) })}
                                                className="w-full bg-[#212631]/5 border border-[#212631]/20 p-4 rounded-2xl text-sm font-normal uppercase tracking-tight text-[#212631] focus:border-[#212631] outline-none transition-colors"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[9px] tracking-[0.2em] uppercase font-normal text-[#212631]/60 px-2">Organizer Name *</label>
                                            <input
                                                type="text"
                                                value={eventForm.participantName}
                                                onChange={e => setEventForm({ ...eventForm, participantName: sanitizeInput(e.target.value) })}
                                                className="w-full bg-[#212631]/5 border border-[#212631]/20 p-4 rounded-2xl text-sm font-normal uppercase tracking-tight text-[#212631] focus:border-[#212631] outline-none transition-colors"
                                                required
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[9px] tracking-[0.2em] uppercase font-normal text-[#212631]/60 px-2">Organizer Email *</label>
                                            <input
                                                type="email"
                                                value={eventForm.participantEmail}
                                                onChange={e => setEventForm({ ...eventForm, participantEmail: sanitizeEmail(e.target.value) })}
                                                className="w-full bg-[#212631]/5 border border-[#212631]/20 p-4 rounded-2xl text-sm font-normal uppercase tracking-tight text-[#212631] focus:border-[#212631] outline-none transition-colors"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label className="text-[9px] tracking-[0.2em] uppercase font-normal text-[#212631]/60 px-2">Event Details & Requirements</label>
                                        <textarea
                                            value={eventForm.venueEventDescription}
                                            onChange={e => setEventForm({ ...eventForm, venueEventDescription: sanitizeInput(e.target.value) })}
                                            className="w-full bg-[#212631]/5 border border-[#212631]/20 p-4 rounded-2xl text-sm font-normal text-[#212631] focus:border-[#212631] outline-none transition-colors resize-y min-h-[120px]"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-6 pt-6 border-t border-[#212631]/10">
                                    <label className="flex items-start gap-4 cursor-pointer group px-2">
                                        <div className="mt-0.5 relative flex items-center justify-center">
                                            <input
                                                type="checkbox"
                                                required
                                                className="peer appearance-none w-5 h-5 border rounded-md border-[#212631]/40 checked:bg-[#212631] checked:border-[#212631] transition-all cursor-pointer bg-transparent"
                                            />
                                            <svg className="absolute w-3 h-3 text-[#ebebeb] pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 14 10" fill="none">
                                                <path d="M1 5L5 9L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </div>
                                        <p className="text-[10px] tracking-[0.18em] uppercase font-normal text-[#212631]/50 leading-relaxed pt-0.5">
                                            I acknowledge the <a href="#" className="text-[#212631] hover:underline">Terms of Service</a> &amp; <a href="#" className="text-[#212631] hover:underline">Privacy Policy</a>.
                                        </p>
                                    </label>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full py-5 bg-[#212631] text-[#ebebeb] rounded-full border border-[#212631] text-[10px] tracking-[0.2em] uppercase font-normal hover:bg-transparent hover:text-[#212631] disabled:opacity-50 disabled:pointer-events-none transition-colors cursor-pointer"
                                    >
                                        {isSubmitting ? 'Processing Request...' : 'Submit Event Request'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </section>

                <AnimatePresence>
                    {selectedEvent && (
                        <motion.div
                            key="modal-backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="fixed inset-0 z-[200] flex items-end md:items-center justify-center bg-[#212631]/80 backdrop-blur-md p-0 md:p-6"
                            onClick={(e) => e.target === e.currentTarget && setSelectedEvent(null)}
                        >
                            <motion.div
                                key="modal-panel"
                                initial={{ opacity: 0, y: 40 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 40 }}
                                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                                className="w-full md:max-w-3xl overflow-hidden flex flex-col bg-[#ebebeb] rounded-t-3xl md:rounded-3xl border border-[#212631]/20 shadow-2xl max-h-[92vh]"
                            >
                                <div className="flex items-center justify-between px-6 py-4 border-b border-[#212631]/20 shrink-0 bg-[#ebebeb]">
                                    <span className="text-[10px] tracking-[0.2em] uppercase font-normal text-[#212631]/60 px-2 py-1 bg-[#212631]/5 rounded-full">
                                        Event Details
                                    </span>
                                    <button
                                        onClick={() => setSelectedEvent(null)}
                                        className="w-8 h-8 rounded-full flex items-center justify-center border border-[#212631]/20 text-[#212631] hover:bg-[#212631] hover:text-[#ebebeb] transition-colors cursor-pointer"
                                    >
                                        <Icons.Close />
                                    </button>
                                </div>

                                <div className="overflow-y-auto flex-1 flex flex-col">
                                    <div className="w-full aspect-[16/7] overflow-hidden flex-shrink-0 border-b border-[#212631]/20 rounded-t-3xl md:rounded-none">
                                        <img src={selectedEvent.imageUrl} alt={selectedEvent.title} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" />
                                    </div>

                                    <div className="p-8 md:p-10 flex flex-col gap-6">
                                        <div className="flex flex-col gap-3 border-b border-[#212631]/20 pb-6">
                                            <div className="flex items-start justify-between gap-4">
                                                <h2 className="text-3xl md:text-5xl font-normal uppercase tracking-tighter text-[#212631] leading-[0.9]">
                                                    {selectedEvent.title}
                                                </h2>
                                                <StatusBadge status={selectedEvent.status} size="lg" />
                                            </div>
                                            <p className="text-[10px] uppercase tracking-widest font-normal text-[#212631]/50">
                                                {formatDisplayDate(selectedEvent.eventDate)}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 border border-[#212631]/20 bg-[#212631]/5 p-5 rounded-2xl">
                                            <div className="flex flex-col gap-2">
                                                <h4 className="text-[9px] uppercase tracking-widest font-normal text-[#212631]/40 px-2">Time</h4>
                                                <p className="text-xs font-normal uppercase flex items-center gap-1.5 text-[#212631] px-2">
                                                    <Icons.Clock />
                                                    {formatTime(selectedEvent.startTime) || '—'}
                                                    {selectedEvent.endTime && (
                                                        <span className="text-[9px] text-[#212631]/50 ml-2">
                                                            Until {formatTime(selectedEvent.endTime)}
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <h4 className="text-[9px] uppercase tracking-widest font-normal text-[#212631]/40 px-2">Location</h4>
                                                <p className="text-xs font-normal uppercase flex items-center gap-1.5 text-[#212631] truncate px-2">
                                                    <Icons.Location />
                                                    {selectedEvent.location}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-3 bg-[#ebebeb] p-6 rounded-2xl border border-[#212631]/10">
                                            <h4 className="text-[9px] uppercase tracking-widest font-normal text-[#212631]/40">About this Event</h4>
                                            <p className="text-sm font-normal leading-relaxed text-[#212631]/70 whitespace-pre-wrap">
                                                {selectedEvent.description || 'Join us for an immersive wildlife experience. Learn directly from our experts and connect with nature.'}
                                            </p>
                                        </div>

                                        {selectedEvent.tags && selectedEvent.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-2 pt-2">
                                                {selectedEvent.tags.map((tag, i) => (
                                                    <span key={i} className="border border-[#212631]/20 rounded-full text-[9px] uppercase tracking-widest font-normal px-4 py-1.5 bg-[#ebebeb] text-[#212631]/60">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {showSubmitConfirm && (
                        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-[#212631]/80 backdrop-blur-md"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-[#ebebeb] border border-[#212631]/20 rounded-3xl w-full max-w-md relative z-10 flex flex-col overflow-hidden shadow-2xl"
                            >
                                <div className="p-8 border-b border-[#212631]/20 flex flex-col items-center text-center">
                                    <div className="w-12 h-12 rounded-full bg-[#212631] text-[#ebebeb] flex items-center justify-center mb-6">
                                        <Icons.Check />
                                    </div>
                                    <h3 className="text-2xl font-normal uppercase tracking-tighter text-[#212631] mb-2">Verify Details</h3>
                                    <p className="text-[10px] tracking-[0.18em] uppercase font-normal text-[#212631]/50 leading-relaxed">
                                        Ensure submitted information is accurate.
                                    </p>
                                </div>

                                <div className="p-8 bg-[#212631]/5 flex flex-col gap-4">
                                    {[
                                        { label: 'Type', value: 'Venue' },
                                        { label: 'Event', value: eventForm.venueEventName },
                                        { label: 'Date', value: formatDateFromDB(eventForm.venueEventDate) },
                                        { label: 'Pax', value: eventForm.numberOfParticipants },
                                    ].map(({ label, value }) => (
                                        <div key={label} className="flex justify-between items-center bg-white/50 p-3 rounded-2xl">
                                            <span className="text-[9px] tracking-widest uppercase font-normal text-[#212631]/50 px-2">{label}</span>
                                            <span className="text-[10px] font-normal uppercase text-[#212631] truncate max-w-[150px] px-2">{value}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="p-8 border-t border-[#212631]/20 flex gap-4 bg-[#ebebeb]">
                                    <button
                                        onClick={() => setShowSubmitConfirm(false)}
                                        className="flex-1 py-4 rounded-full border border-[#212631]/20 text-[9px] tracking-[0.18em] uppercase font-normal text-[#212631] hover:bg-[#212631]/5 transition-colors cursor-pointer"
                                    >
                                        Return
                                    </button>
                                    <button
                                        onClick={confirmSubmit}
                                        disabled={isSubmitting}
                                        className="flex-1 py-4 rounded-full bg-[#212631] border border-[#212631] text-[9px] tracking-[0.18em] uppercase font-normal text-[#ebebeb] hover:bg-transparent hover:text-[#212631] disabled:opacity-50 transition-colors cursor-pointer"
                                    >
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
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-[#212631]/80 backdrop-blur-md"
                            />
                            <motion.div
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                                className="bg-[#ebebeb] rounded-3xl border border-[#212631]/20 w-full max-w-sm p-10 relative z-10 flex flex-col items-center text-center shadow-2xl"
                            >
                                <div className="mb-6 text-[#26bc61] bg-[#26bc61]/10 p-4 rounded-full"><Icons.Check /></div>
                                <h3 className="text-3xl font-normal uppercase tracking-tighter text-[#212631] mb-2">Confirmed</h3>
                                <p className="text-[10px] tracking-widest uppercase font-normal text-[#212631]/50 mb-8">Reservation securely logged.</p>

                                <div className="w-full border border-[#212631]/20 rounded-2xl bg-[#212631]/5 p-6 mb-8 flex flex-col items-center justify-center">
                                    <span className="text-[8px] tracking-[0.3em] uppercase font-normal text-[#212631]/40 mb-2">Reference ID</span>
                                    <span className="text-xl font-normal tracking-widest uppercase text-[#212631]">{confirmationData.reference}</span>
                                </div>

                                <div className="w-full flex flex-col gap-3">
                                    <button
                                        onClick={() => setShowConfirmation(false)}
                                        className="w-full rounded-full py-4 border border-[#212631]/20 text-[9px] tracking-[0.18em] uppercase font-normal text-[#212631] hover:bg-[#212631]/5 transition-colors cursor-pointer"
                                    >
                                        Dismiss
                                    </button>
                                    <button
                                        onClick={() => { setShowConfirmation(false); navigate('/reservations'); }}
                                        className="w-full rounded-full py-4 bg-[#212631] border border-[#212631] text-[9px] tracking-[0.18em] uppercase font-normal text-[#ebebeb] hover:bg-transparent hover:text-[#212631] transition-colors cursor-pointer"
                                    >
                                        Manage Bookings
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