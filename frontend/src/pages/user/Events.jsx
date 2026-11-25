import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { PAGE_BG_GRADIENT } from '../../config/page-gradient';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { ReactLenis } from 'lenis/react';
import AIFloatingButton from '../../components/common/AIFloatingButton';
import { userAPI } from '../../services/api-client';
import useScrollLock from '../../hooks/use-scroll-lock';
import EventViews, { ViewToggle } from '../../components/features/events/EventViews';
import { X, Location, Clock, Users } from 'reicon-react';
import usePageMetadata from '../../hooks/use-page-metadata';
import { handleEventImageError, resolveEventImageUrl } from '../../utils/event-images';

gsap.registerPlugin(ScrollTrigger);

const FILTERS = ['all', 'upcoming', 'ongoing', 'past'];

// Remembers whether the visitor last read events as a calendar, a list or a grid.
const VIEW_STORAGE_KEY = 'bulusan_zoo_events_view';

// First-time visitors start with the list, which reads well on phones and needs no month navigation.
const DEFAULT_VIEW = 'list';

const Icons = {
    Close: () => <X className="w-5 h-5" />,
    Location: () => <Location className="w-4 h-4 flex-shrink-0" />,
    Clock: () => <Clock className="w-4 h-4 flex-shrink-0" />,
    Users: () => <Users className="w-4 h-4 flex-shrink-0" />
};

const StatusBadge = ({ status }) => {
    return (
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium uppercase tracking-widest ${status === 'past' ? 'bg-gray-100 text-gray-500' : 'bg-black text-white'}`}>
            {status}
        </span>
    );
};

const Events = () => {
    usePageMetadata('Events | Bulusan Zoo', 'Upcoming events, tours and activities at Bulusan Zoo in Calapan City, Oriental Mindoro.', 'https://bulusanzoo.com/events');
    const containerRef = useRef(null);

    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [, setError] = useState('');
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [filter, setFilter] = useState('all');
    const [view, setView] = useState(() => {
        try {
            const stored = window.localStorage.getItem(VIEW_STORAGE_KEY);
            // Mirrors the ids in EventViews' VIEWS; kept as literals so this file stays a plain
            // consumer and the view module exports components only.
            return ['calendar', 'list', 'grid'].includes(stored) ? stored : DEFAULT_VIEW;
        } catch {
            // Private browsing or a blocked storage partition: the default view is fine.
            return DEFAULT_VIEW;
        }
    });
    const [calendarDate, setCalendarDate] = useState(new Date());

    useScrollLock(Boolean(selectedEvent));

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
                        location: event.location || 'Bulusan Zoo',
                        headcount: Number(event.capacity) > 0 ? Number(event.capacity) : null,
                        status: computedStatus,
                        imageUrl: resolveEventImageUrl(event.image_url, index),
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

    const changeView = (next) => {
        setView(next);
        // Remembering the choice is a nicety, never a reason to fail the interaction.
        try {
            window.localStorage.setItem(VIEW_STORAGE_KEY, next);
        } catch {
            // Storage unavailable; the view still changes for this session.
        }
    };

    const filteredEvents = useMemo(
        () => (filter === 'all' ? events : events.filter((e) => e.status === filter)),
        [events, filter]
    );

    return (
        <ReactLenis root>
            <div ref={containerRef} className={`min-h-dvh text-black ${PAGE_BG_GRADIENT}`}>
                <Header />

                <div className="w-full min-h-[40vh] md:min-h-[60vh] flex flex-col items-center justify-center px-4 pt-24 pb-8">
                    <h1 className="w-full max-w-full text-center text-[clamp(3.5rem,12vw,11rem)] font-bold leading-[1.05] tracking-tight text-black">Events</h1>
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
                        <>
                            <div className="section-anim flex justify-center mb-8 md:mb-12">
                                <ViewToggle view={view} onViewChange={changeView} count={filteredEvents.length} />
                            </div>
                            <div className="section-anim">
                                <EventViews
                                    view={view}
                                    events={filteredEvents}
                                    calendarDate={calendarDate}
                                    onCalendarDateChange={setCalendarDate}
                                    onSelect={setSelectedEvent}
                                />
                            </div>
                        </>
                    )}
                </div>

                <AnimatePresence>
                    {selectedEvent && (
                        <Motion.div
                            key="modal-backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            role="dialog"
                            aria-modal="true"
                            aria-label="Event details"
                            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-8"
                            onClick={(e) => e.target === e.currentTarget && setSelectedEvent(null)}
                        >
                            <Motion.div
                                key="modal-panel"
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
                                className="w-full md:max-w-5xl bg-white rounded-xl md:rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
                            >
                                <div className="w-full md:w-1/2 h-48 sm:h-64 md:h-auto relative bg-gray-100 flex-shrink-0">
                                    <img src={selectedEvent.imageUrl} alt={selectedEvent.title} onError={handleEventImageError} className="absolute inset-0 w-full h-full object-cover" />
                                </div>
                                <div className="w-full md:w-1/2 p-6 md:p-12 flex flex-col overflow-y-auto overscroll-contain" data-lenis-prevent>
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

                                    <div className={`grid grid-cols-1 ${selectedEvent.headcount ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-4 sm:gap-8 mb-6 md:mb-8 border-t border-gray-200 pt-6 md:pt-8`}>
                                        <div>
                                            <h4 className="text-[11px] md:text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Time</h4>
                                            <p className="text-black font-medium text-sm md:text-base flex items-center gap-2">
                                                <Icons.Clock />
                                                {formatTime(selectedEvent.startTime) || '—'}
                                                {selectedEvent.endTime && <span className="text-gray-500">to {formatTime(selectedEvent.endTime)}</span>}
                                            </p>
                                        </div>
                                        <div>
                                            <h4 className="text-[11px] md:text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Location</h4>
                                            <p className="text-black font-medium text-sm md:text-base flex items-center gap-2">
                                                <Icons.Location />
                                                {selectedEvent.location}
                                            </p>
                                        </div>
                                        {selectedEvent.headcount ? (
                                            <div>
                                                <h4 className="text-[11px] md:text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Headcount</h4>
                                                <p className="text-black font-medium text-sm md:text-base flex items-center gap-2">
                                                    <Icons.Users />
                                                    {selectedEvent.headcount} {selectedEvent.headcount === 1 ? 'person' : 'people'}
                                                </p>
                                            </div>
                                        ) : null}
                                    </div>

                                    <div className="mb-6 md:mb-8">
                                        <h4 className="text-[11px] md:text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 md:mb-4">About this Event</h4>
                                        <p className="text-gray-700 text-sm md:text-base leading-relaxed">
                                            {selectedEvent.description || 'Join us for an immersive wildlife experience. Learn directly from our experts and connect with nature.'}
                                        </p>
                                    </div>

                                    {selectedEvent.tags && selectedEvent.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-auto">
                                            {selectedEvent.tags.map((tag, i) => (
                                                <span key={i} className="px-3 py-1 md:px-4 md:py-2 bg-gray-100 rounded-full text-[11px] md:text-xs font-medium text-gray-600">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </Motion.div>
                        </Motion.div>
                    )}
                </AnimatePresence>

                <Footer />
                <AIFloatingButton />
            </div>
        </ReactLenis>
    );
};

export default Events;
