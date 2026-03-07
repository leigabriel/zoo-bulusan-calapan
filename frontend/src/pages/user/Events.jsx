import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import Header from '../../components/Header';
import { ReactLenis } from 'lenis/react';
import AIFloatingButton from '../../components/common/AIFloatingButton';
import { userAPI } from '../../services/api-client';

const DEFAULT_EVENT_IMAGES = [
    'https://images.unsplash.com/photo-1474511320723-9a56873571b7?w=800',
    'https://images.unsplash.com/photo-1534567153574-2b12153a87f0?w=800',
    'https://images.unsplash.com/photo-1544985361-b420d7a77043?w=800',
    'https://images.unsplash.com/photo-1497752531616-c3afd9760a11?w=800',
    'https://images.unsplash.com/photo-1551085254-e96b210db58a?w=800',
];

const BASE_BG = '#ebebeb';
const BASE_TEXT = '#212631';
const MODAL_BG = '#f4f4f4';
const DIVIDER = 'rgba(33,38,49,0.10)';
const DIVIDER_MD = 'rgba(33,38,49,0.14)';
const MUTED = 'rgba(33,38,49,0.50)';
const BODY_TEXT = 'rgba(33,38,49,0.75)';
const LABEL_TEXT = 'rgba(33,38,49,0.40)';
const GHOST = 'rgba(33,38,49,0.05)';

const STATUS_MAP = {
    upcoming: { label: 'Upcoming', border: '#15803d', color: '#15803d', bg: 'rgba(21,128,61,0.08)' },
    ongoing: { label: 'Ongoing', border: '#1d4ed8', color: '#1d4ed8', bg: 'rgba(29,78,216,0.08)' },
    past: { label: 'Past', border: 'rgba(33,38,49,0.30)', color: 'rgba(33,38,49,0.45)', bg: GHOST },
};

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const FILTERS = ['all', 'upcoming', 'ongoing', 'past'];

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
    </svg>
);

const ChevronLeft = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
);

const ChevronRight = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
);

const LocationIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 flex-shrink-0">
        <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" />
    </svg>
);

const ClockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 flex-shrink-0">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
    </svg>
);

const ArrowDiag = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
    </svg>
);

const StatusBadge = ({ status, size = 'sm' }) => {
    const tag = STATUS_MAP[status] || STATUS_MAP.upcoming;
    const sizing = size === 'sm'
        ? 'text-[8px] px-1.5 py-0.5'
        : 'text-[10px] md:text-xs px-2.5 py-1';
    return (
        <span
            className={`inline-block border uppercase tracking-wider font-semibold leading-none ${sizing}`}
            style={{ borderColor: tag.border, color: tag.color, backgroundColor: tag.bg }}
        >
            {tag.label}
        </span>
    );
};

const Events = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [filter, setFilter] = useState('all');
    const [calendarDate, setCalendarDate] = useState(new Date());

    useEffect(() => { fetchEvents(); }, []);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const response = await userAPI.getEvents(true);
            if (response.success && response.events) {
                const todayMidnight = new Date();
                todayMidnight.setHours(0, 0, 0, 0);

                const transformed = response.events.map((event, index) => {
                    const eventDate = formatDateFromDB(event.event_date);
                    const eventDateObj = new Date(eventDate + 'T00:00:00');

                    let computedStatus = event.status || 'upcoming';
                    if (eventDateObj < todayMidnight) computedStatus = 'past';
                    else if (eventDateObj.getTime() === todayMidnight.getTime()) computedStatus = 'ongoing';
                    else computedStatus = 'upcoming';

                    return {
                        id: event.id,
                        title: event.title,
                        description: event.description || '',
                        eventDate,
                        startTime: event.start_time,
                        endTime: event.end_time,
                        location: event.location || 'Zoo Bulusan',
                        status: computedStatus,
                        imageUrl: event.image_url || DEFAULT_EVENT_IMAGES[index % DEFAULT_EVENT_IMAGES.length],
                        tags: event.tags || [],
                    };
                });

                transformed.sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));
                setEvents(transformed);
            } else {
                setEvents([]);
            }
        } catch (err) {
            console.error(err);
            setError('Failed to load events.');
            setEvents([]);
        } finally {
            setLoading(false);
        }
    };

    const formatDateFromDB = (dateValue) => {
        if (!dateValue) return '';
        if (typeof dateValue === 'string' && dateValue.includes('T')) return dateValue.split('T')[0];
        const d = new Date(dateValue);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

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

    const MobileListRow = ({ event, index }) => {
        const { day, month, year } = parseDateParts(event.eventDate);
        const ref = useRef(null);
        const inView = useInView(ref, { once: true, margin: '-40px' });

        return (
            <motion.div
                ref={ref}
                initial={{ opacity: 0, y: 18 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: index * 0.05 }}
                onClick={() => setSelectedEvent(event)}
                onKeyDown={(e) => e.key === 'Enter' && setSelectedEvent(event)}
                className="group flex items-center gap-4 py-4 cursor-pointer border-b"
                style={{ borderColor: DIVIDER }}
                role="button"
                tabIndex={0}
                aria-label={`View details for ${event.title}`}
            >
                <div className="w-14 h-14 flex-shrink-0 overflow-hidden">
                    <motion.img
                        src={event.imageUrl}
                        alt={event.title}
                        className="w-full h-full object-cover"
                        whileHover={{ scale: 1.08 }}
                        transition={{ duration: 0.4 }}
                    />
                </div>

                <div className="w-10 flex-shrink-0 flex flex-col items-start">
                    <span className="text-lg font-bold leading-none tabular-nums" style={{ color: BASE_TEXT }}>{day}</span>
                    <span className="text-[10px] font-semibold leading-none mt-0.5" style={{ color: MUTED }}>{month}</span>
                    <span className="text-[9px] font-normal leading-none mt-0.5" style={{ color: LABEL_TEXT }}>{year}</span>
                </div>

                <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                    <h3
                        className="text-sm font-semibold leading-snug tracking-tight truncate group-hover:underline underline-offset-2"
                        style={{ color: BASE_TEXT, textDecorationColor: DIVIDER_MD }}
                    >
                        {event.title}
                    </h3>
                    <StatusBadge status={event.status} size="sm" />
                    <p className="text-[10px] font-normal flex items-center gap-1" style={{ color: MUTED }}>
                        <LocationIcon />
                        <span className="truncate">{event.location}</span>
                    </p>
                </div>

                <motion.div
                    className="flex-shrink-0"
                    style={{ color: LABEL_TEXT }}
                    whileHover={{ x: 2, y: -2, color: BASE_TEXT }}
                    transition={{ duration: 0.2 }}
                >
                    <ArrowDiag />
                </motion.div>
            </motion.div>
        );
    };

    const CalendarCell = ({ day }) => {
        const dayEvents = getEventsForDay(day);
        const isCurrentDay = isToday(day);

        return (
            <div
                className="border-r border-b flex flex-col min-h-[88px] lg:min-h-[112px]"
                style={{
                    borderColor: DIVIDER,
                    backgroundColor: day ? 'transparent' : GHOST,
                }}
            >
                {day && (
                    <>
                        <div className="px-1.5 pt-1.5 pb-0.5">
                            <span
                                className="inline-block text-[10px] lg:text-[11px] font-semibold tabular-nums leading-none"
                                style={{
                                    color: isCurrentDay ? BASE_BG : MUTED,
                                    backgroundColor: isCurrentDay ? BASE_TEXT : 'transparent',
                                    padding: isCurrentDay ? '2px 5px' : undefined,
                                }}
                            >
                                {day}
                            </span>
                        </div>

                        <div className="flex flex-col gap-1 px-1 pb-1.5 flex-1">
                            {dayEvents.slice(0, 2).map((event) => (
                                <motion.button
                                    key={event.id}
                                    onClick={() => setSelectedEvent(event)}
                                    className="w-full text-left overflow-hidden"
                                    whileHover={{ scale: 1.015 }}
                                    whileTap={{ scale: 0.98 }}
                                    transition={{ duration: 0.18 }}
                                    aria-label={`View ${event.title}`}
                                >
                                    <div className="w-full aspect-[4/3] overflow-hidden">
                                        <motion.img
                                            src={event.imageUrl}
                                            alt={event.title}
                                            className="w-full h-full object-cover"
                                            whileHover={{ scale: 1.1 }}
                                            transition={{ duration: 0.4 }}
                                        />
                                    </div>
                                    <p
                                        className="text-[8px] lg:text-[9px] font-semibold leading-tight line-clamp-1 mt-0.5 px-0.5"
                                        style={{ color: BASE_TEXT }}
                                    >
                                        {event.title}
                                    </p>
                                    <div className="px-0.5 mt-0.5">
                                        <StatusBadge status={event.status} size="sm" />
                                    </div>
                                </motion.button>
                            ))}
                            {dayEvents.length > 2 && (
                                <button
                                    onClick={() => setSelectedEvent(dayEvents[2])}
                                    className="text-[8px] font-semibold px-0.5 text-left"
                                    style={{ color: MUTED }}
                                >
                                    +{dayEvents.length - 2} more
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>
        );
    };

    return (
        <ReactLenis root>
            <div className="min-h-screen flex flex-col" style={{ backgroundColor: BASE_BG, color: BASE_TEXT }}>
                <Header />

                <section className="pt-24 md:pt-32 pb-0 px-4 md:px-8 lg:px-12 max-w-[1500px] mx-auto w-full">
                    <motion.p
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
                        className="text-[10px] md:text-xs uppercase tracking-[0.35em] font-normal mb-4 md:mb-6 flex items-center gap-2"
                        style={{ color: MUTED }}
                    >
                    </motion.p>

                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 md:gap-12 mb-8 md:mb-10">
                        <div className="flex-1 min-w-0">
                            <div className="overflow-hidden mb-1">
                                <motion.h1
                                    initial={{ y: '100%' }}
                                    animate={{ y: 0 }}
                                    transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
                                    className="text-5xl md:text-7xl lg:text-8xl xl:text-9xl font-normal uppercase tracking-tighter leading-[0.9]"
                                    style={{ color: BASE_TEXT }}
                                >
                                    Wildlife
                                </motion.h1>
                            </div>
                            <div className="overflow-hidden">
                                <motion.h1
                                    initial={{ y: '100%' }}
                                    animate={{ y: 0 }}
                                    transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
                                    className="text-5xl md:text-7xl lg:text-8xl xl:text-9xl font-normal uppercase tracking-tighter leading-[0.9]"
                                    style={{ color: LABEL_TEXT }}
                                >
                                    Events
                                </motion.h1>
                            </div>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.45 }}
                            className="flex flex-col gap-3 md:items-end shrink-0 md:pb-1"
                        >
                            <p className="text-xs md:text-sm leading-relaxed max-w-xs md:text-right font-normal" style={{ color: BODY_TEXT }}>
                                Experience unforgettable moments with our animals through live feedings, shows, and educational activities.
                            </p>
                            <div className="flex items-center gap-2 flex-wrap">
                                {[
                                    { value: events.length, label: 'Total' },
                                    { value: events.filter(e => e.status === 'ongoing').length, label: 'Ongoing' },
                                    { value: events.filter(e => e.status === 'upcoming').length, label: 'Upcoming' },
                                ].map(({ value, label }) => (
                                    <div
                                        key={label}
                                        className="flex items-center gap-1.5 px-3 py-1.5 border"
                                        style={{ borderColor: DIVIDER_MD, backgroundColor: GHOST }}
                                    >
                                        <span className="text-xs font-semibold tabular-nums" style={{ color: BASE_TEXT }}>{value}</span>
                                        <span className="text-[10px] uppercase tracking-wider font-normal" style={{ color: LABEL_TEXT }}>{label}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>

                    <motion.div
                        initial={{ scaleX: 0, originX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.35 }}
                        className="h-px"
                        style={{ backgroundColor: DIVIDER_MD }}
                    />
                </section>

                <div className="px-4 md:px-8 lg:px-12 max-w-[1500px] mx-auto w-full flex-grow pb-16 md:pb-24">

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.55 }}
                        className="flex items-center gap-0 mb-6 md:mb-8 overflow-x-auto no-scrollbar border-b"
                        style={{ borderColor: DIVIDER }}
                    >
                        {FILTERS.map(f => {
                            const active = filter === f;
                            const label = f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1);
                            return (
                                <motion.button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className="text-[10px] md:text-xs uppercase tracking-widest whitespace-nowrap px-4 md:px-6 py-3 md:py-4 font-semibold border-b-2 -mb-px"
                                    style={{
                                        borderColor: active ? BASE_TEXT : 'transparent',
                                        color: active ? BASE_TEXT : MUTED,
                                    }}
                                    whileHover={{ color: BASE_TEXT }}
                                    transition={{ duration: 0.15 }}
                                >
                                    {label}
                                </motion.button>
                            );
                        })}
                    </motion.div>

                    {loading && (
                        <div className="flex items-center justify-center py-40">
                            <motion.div
                                className="w-7 h-7 border-2 border-t-transparent rounded-full"
                                style={{ borderColor: BASE_TEXT, borderTopColor: 'transparent' }}
                                animate={{ rotate: 360 }}
                                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                            />
                        </div>
                    )}

                    {!loading && !error && (
                        <>
                            {/* ── DESKTOP / TABLET: Calendar Grid ── */}
                            <div className="hidden md:block">
                                <div className="flex items-center justify-between mb-5">
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-base lg:text-xl font-semibold tracking-tight" style={{ color: BASE_TEXT }}>
                                            {MONTHS[calMonth]}
                                        </h2>
                                        <span className="text-base lg:text-xl font-normal" style={{ color: LABEL_TEXT }}>
                                            {calYear}
                                        </span>
                                        {filter !== 'all' && (
                                            <span
                                                className="text-[10px] uppercase tracking-widest font-semibold px-2 py-0.5 border"
                                                style={{
                                                    borderColor: STATUS_MAP[filter]?.border || DIVIDER_MD,
                                                    color: STATUS_MAP[filter]?.color || MUTED,
                                                    backgroundColor: STATUS_MAP[filter]?.bg || GHOST,
                                                }}
                                            >
                                                {filter}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <motion.button
                                            onClick={prevMonth}
                                            className="p-2 border"
                                            style={{ borderColor: DIVIDER, color: MUTED, backgroundColor: 'transparent' }}
                                            whileHover={{ backgroundColor: GHOST, color: BASE_TEXT }}
                                            whileTap={{ scale: 0.95 }}
                                            transition={{ duration: 0.15 }}
                                            aria-label="Previous month"
                                        >
                                            <ChevronLeft />
                                        </motion.button>
                                        <motion.button
                                            onClick={() => setCalendarDate(new Date())}
                                            className="px-3 py-1.5 text-[10px] uppercase tracking-widest font-semibold border"
                                            style={{ borderColor: DIVIDER, color: MUTED, backgroundColor: 'transparent' }}
                                            whileHover={{ backgroundColor: GHOST, color: BASE_TEXT }}
                                            whileTap={{ scale: 0.95 }}
                                            transition={{ duration: 0.15 }}
                                        >
                                            Today
                                        </motion.button>
                                        <motion.button
                                            onClick={nextMonth}
                                            className="p-2 border"
                                            style={{ borderColor: DIVIDER, color: MUTED, backgroundColor: 'transparent' }}
                                            whileHover={{ backgroundColor: GHOST, color: BASE_TEXT }}
                                            whileTap={{ scale: 0.95 }}
                                            transition={{ duration: 0.15 }}
                                            aria-label="Next month"
                                        >
                                            <ChevronRight />
                                        </motion.button>
                                    </div>
                                </div>

                                <div
                                    className="grid grid-cols-7 border-t border-l"
                                    style={{ borderColor: DIVIDER }}
                                >
                                    {DAYS_SHORT.map(day => (
                                        <div
                                            key={day}
                                            className="px-2 py-2 border-r border-b"
                                            style={{ borderColor: DIVIDER, backgroundColor: GHOST }}
                                        >
                                            <span className="text-[9px] lg:text-[10px] uppercase tracking-widest font-semibold" style={{ color: LABEL_TEXT }}>
                                                {day}
                                            </span>
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
                                            {calendarCells.map((day, i) => (
                                                <CalendarCell key={i} day={day} />
                                            ))}
                                        </motion.div>
                                    </AnimatePresence>
                                </div>

                                {!hasAnyEventInMonth && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-center py-8"
                                    >
                                        <p className="text-xs uppercase tracking-widest font-semibold mb-1" style={{ color: LABEL_TEXT }}>
                                            No {filter === 'all' ? '' : filter} events in {MONTHS[calMonth]}
                                        </p>
                                        <p className="text-xs font-normal" style={{ color: LABEL_TEXT }}>
                                            Try navigating to another month or changing the filter above.
                                        </p>
                                    </motion.div>
                                )}
                            </div>

                            {/* ── MOBILE: List View ── */}
                            <div className="md:hidden">
                                {filteredEvents.length === 0 ? (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex flex-col items-center justify-center py-24 text-center gap-2"
                                    >
                                        <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: LABEL_TEXT }}>
                                            No events found
                                        </p>
                                        <p className="text-xs font-normal" style={{ color: LABEL_TEXT }}>
                                            Check back later for upcoming events.
                                        </p>
                                    </motion.div>
                                ) : (
                                    <>
                                        {upcomingFiltered.length > 0 && (
                                            <div className="mb-10">
                                                <div className="flex items-baseline justify-between mb-3">
                                                    <p className="text-[10px] uppercase tracking-[0.25em] font-semibold" style={{ color: MUTED }}>
                                                        {filter === 'all' ? 'Upcoming' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                                                    </p>
                                                    <span className="text-3xl font-normal" style={{ color: 'rgba(33,38,49,0.07)' }}>
                                                        {calYear}
                                                    </span>
                                                </div>
                                                {upcomingFiltered.map((event, i) => (
                                                    <MobileListRow key={event.id} event={event} index={i} />
                                                ))}
                                            </div>
                                        )}

                                        {pastFiltered.length > 0 && (
                                            <div>
                                                <div className="flex items-baseline justify-between mb-3 border-t pt-6" style={{ borderColor: DIVIDER }}>
                                                    <p className="text-[10px] uppercase tracking-[0.25em] font-semibold" style={{ color: MUTED }}>
                                                        Past Events
                                                    </p>
                                                    <span className="text-3xl font-normal" style={{ color: 'rgba(33,38,49,0.07)' }}>
                                                        {pastFiltered[0] ? new Date(pastFiltered[0].eventDate + 'T00:00:00').getFullYear() : ''}
                                                    </span>
                                                </div>
                                                {pastFiltered.map((event, i) => (
                                                    <MobileListRow key={event.id} event={event} index={i} />
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </>
                    )}
                </div>

                <AnimatePresence>
                    {selectedEvent && (
                        <motion.div
                            key="modal-backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="fixed inset-0 z-[100] flex items-end md:items-center justify-center backdrop-blur-sm"
                            style={{ backgroundColor: 'rgba(33,38,49,0.50)' }}
                            onClick={(e) => e.target === e.currentTarget && setSelectedEvent(null)}
                            role="dialog"
                            aria-modal="true"
                            aria-label={`Event details: ${selectedEvent.title}`}
                        >
                            <motion.div
                                key="modal-panel"
                                initial={{ opacity: 0, y: 40 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 40 }}
                                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                                className="w-full md:w-auto md:min-w-[540px] md:max-w-2xl lg:max-w-3xl overflow-hidden flex flex-col md:mx-6 md:rounded-sm shadow-2xl max-h-[92vh]"
                                style={{ backgroundColor: MODAL_BG }}
                            >
                                <div
                                    className="flex items-center justify-between px-5 md:px-8 py-4 flex-shrink-0 border-b"
                                    style={{ borderColor: DIVIDER }}
                                >
                                    <span className="text-[10px] md:text-xs uppercase tracking-[0.25em] font-semibold" style={{ color: MUTED }}>
                                        Event Details
                                    </span>
                                    <motion.button
                                        onClick={() => setSelectedEvent(null)}
                                        className="p-2 rounded-sm"
                                        style={{ color: MUTED, backgroundColor: 'transparent' }}
                                        whileHover={{ backgroundColor: GHOST, color: BASE_TEXT, rotate: 90 }}
                                        transition={{ duration: 0.2 }}
                                        aria-label="Close event details"
                                    >
                                        <CloseIcon />
                                    </motion.button>
                                </div>

                                <div className="overflow-y-auto flex-1">
                                    <motion.div
                                        className="w-full aspect-[16/8] overflow-hidden flex-shrink-0"
                                        style={{ backgroundColor: GHOST }}
                                        initial={{ scale: 1.05, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
                                    >
                                        <img
                                            src={selectedEvent.imageUrl}
                                            alt={selectedEvent.title}
                                            className="w-full h-full object-cover"
                                        />
                                    </motion.div>

                                    <div className="px-5 md:px-8 pt-6 pb-6 md:pt-8 md:pb-8">
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.35, delay: 0.18 }}
                                            className="flex items-start justify-between gap-4 mb-1"
                                        >
                                            <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold leading-tight tracking-tight" style={{ color: BASE_TEXT }}>
                                                {selectedEvent.title}
                                            </h2>
                                            <StatusBadge status={selectedEvent.status} size="lg" />
                                        </motion.div>

                                        <motion.p
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ duration: 0.35, delay: 0.24 }}
                                            className="text-xs md:text-sm font-normal mb-6 md:mb-8"
                                            style={{ color: MUTED }}
                                        >
                                            {formatDisplayDate(selectedEvent.eventDate)}
                                        </motion.p>

                                        <motion.div
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.35, delay: 0.3 }}
                                            className="grid grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8 p-4 md:p-5 border"
                                            style={{ backgroundColor: GHOST, borderColor: DIVIDER }}
                                        >
                                            <div>
                                                <h4 className="text-[9px] md:text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: LABEL_TEXT }}>
                                                    Time
                                                </h4>
                                                <p className="text-sm md:text-base font-semibold flex items-center gap-1.5" style={{ color: BASE_TEXT }}>
                                                    <ClockIcon />
                                                    {formatTime(selectedEvent.startTime) || '—'}
                                                </p>
                                                {selectedEvent.endTime && (
                                                    <p className="text-xs md:text-sm font-normal mt-1 pl-5" style={{ color: MUTED }}>
                                                        until {formatTime(selectedEvent.endTime)}
                                                    </p>
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="text-[9px] md:text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: LABEL_TEXT }}>
                                                    Location
                                                </h4>
                                                <p className="text-sm md:text-base font-semibold flex items-center gap-1.5 leading-snug" style={{ color: BASE_TEXT }}>
                                                    <LocationIcon />
                                                    {selectedEvent.location}
                                                </p>
                                            </div>
                                        </motion.div>

                                        <motion.div
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.35, delay: 0.36 }}
                                            className="mb-6 md:mb-8"
                                        >
                                            <h4 className="text-[9px] md:text-[10px] uppercase tracking-widest font-semibold mb-2 md:mb-3" style={{ color: LABEL_TEXT }}>
                                                About this Event
                                            </h4>
                                            <p className="text-sm md:text-base font-normal leading-relaxed" style={{ color: BODY_TEXT }}>
                                                {selectedEvent.description || `An exclusive wildlife experience at Zoo Bulusan Calapan.`}
                                            </p>
                                        </motion.div>

                                        {selectedEvent.tags && selectedEvent.tags.length > 0 && (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ duration: 0.35, delay: 0.42 }}
                                                className="flex flex-wrap gap-2"
                                            >
                                                {selectedEvent.tags.map((tag, i) => (
                                                    <span
                                                        key={i}
                                                        className="border text-[10px] md:text-xs uppercase tracking-wider px-2.5 py-1 font-normal"
                                                        style={{ borderColor: DIVIDER_MD, color: BODY_TEXT }}
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </motion.div>
                                        )}
                                    </div>
                                </div>

                                <div
                                    className="px-5 md:px-8 py-4 flex-shrink-0 border-t"
                                    style={{ backgroundColor: MODAL_BG, borderColor: DIVIDER }}
                                >
                                    <motion.button
                                        onClick={() => setSelectedEvent(null)}
                                        className="w-full py-3.5 text-xs md:text-sm uppercase tracking-[0.2em] font-semibold"
                                        style={{ backgroundColor: BASE_TEXT, color: BASE_BG }}
                                        whileHover={{ opacity: 0.82 }}
                                        whileTap={{ scale: 0.99 }}
                                        transition={{ duration: 0.15 }}
                                    >
                                        Close
                                    </motion.button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AIFloatingButton />
            </div>
        </ReactLenis>
    );
};

export default Events;