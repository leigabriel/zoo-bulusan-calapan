import { useMemo } from 'react';
import { motion as Motion } from 'framer-motion';
import { Calendar, Grid, List } from 'reicon-react';

// The three ways the visitor can read the same filtered set of events. Kept out of Events.jsx
// so the page stays about data, submission and modals while this file owns presentation.

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Icons are stored as elements rather than component references: rendering a component held in
// a variable trips no-unused-vars under this project's ESLint config, and the elements are
// identical either way since these three icons take no props.
const ICON_CLASS = 'h-4 w-4';

const VIEWS = [
    { id: 'calendar', label: 'Calendar', icon: <Calendar className={ICON_CLASS} aria-hidden="true" /> },
    { id: 'list', label: 'List', icon: <List className={ICON_CLASS} aria-hidden="true" /> },
    { id: 'grid', label: 'Grid', icon: <Grid className={ICON_CLASS} aria-hidden="true" /> }
];

// Events are grouped by date in list view, so grouping needs a stable, sortable key.
const dateKey = (event) => event.eventDate || '';

const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = String(time).split(':');
    const h = parseInt(hours, 10);
    if (Number.isNaN(h)) return '';
    return `${h % 12 || 12}:${minutes} ${h >= 12 ? 'PM' : 'AM'}`;
};

const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
};

const StatusBadge = ({ status }) => (
    <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${status === 'past' ? 'bg-gray-100 text-gray-500' : 'bg-black text-white'}`}>
        {status}
    </span>
);

const EmptyState = ({ view }) => (
    <div className="px-6 py-20 text-center text-gray-400 text-xs md:text-sm tracking-widest uppercase">
        No events to show{view === 'calendar' ? ' for this month' : ''}.
    </div>
);

/* ---------------------------------------------------------------- view toggle */

export const ViewToggle = ({ view, onViewChange, count }) => (
    <div
        role="group"
        aria-label="Choose how events are displayed"
        className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white p-1"
    >
        {VIEWS.map(({ id, label, icon }) => {
            const active = view === id;
            return (
                <button
                    key={id}
                    type="button"
                    onClick={() => onViewChange(id)}
                    aria-pressed={active}
                    className={`flex items-center gap-2 rounded-full px-3 md:px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${active ? 'bg-black text-white' : 'text-gray-500 hover:text-black'}`}
                >
                    {icon}
                    <span className="hidden sm:inline">{label}</span>
                </button>
            );
        })}
        <span className="ml-1 hidden pr-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 md:inline">
            {count} {count === 1 ? 'event' : 'events'}
        </span>
    </div>
);

/* --------------------------------------------------------------- calendar view */

const CalendarView = ({ events, calendarDate, onCalendarDateChange, onSelect }) => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay();

    const cells = useMemo(() => {
        const list = [];
        for (let i = 0; i < firstDayOfWeek; i += 1) list.push(null);
        for (let d = 1; d <= daysInMonth; d += 1) list.push(d);
        return list;
    }, [firstDayOfWeek, daysInMonth]);

    const byDate = useMemo(() => {
        const map = new Map();
        events.forEach((event) => {
            const key = dateKey(event);
            if (!map.has(key)) map.set(key, []);
            map.get(key).push(event);
        });
        return map;
    }, [events]);

    const today = new Date();
    const isToday = (day) => day === today.getDate()
        && month === today.getMonth()
        && year === today.getFullYear();

    const shiftMonth = (delta) => onCalendarDateChange(new Date(year, month + delta, 1));
    const monthHasEvents = cells.some((day) => day && (byDate.get(`${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`)?.length));

    return (
        <div className="bg-white border border-gray-200 rounded-xl md:rounded-2xl shadow-sm overflow-hidden">
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 md:p-8 border-b border-gray-200 gap-4">
                <h2 className="text-2xl sm:text-3xl md:text-4xl text-black">
                    {MONTHS[month]} {year}
                </h2>
                <div className="flex items-center gap-2 md:gap-4">
                    <button type="button" onClick={() => shiftMonth(-1)} aria-label="Previous month" className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full border border-gray-200 hover:bg-gray-50 transition-colors">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <button type="button" onClick={() => onCalendarDateChange(new Date())} className="px-4 md:px-6 h-10 md:h-12 rounded-full border border-gray-200 hover:bg-gray-50 text-[10px] md:text-xs font-bold uppercase tracking-widest transition-colors">
                        Today
                    </button>
                    <button type="button" onClick={() => shiftMonth(1)} aria-label="Next month" className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full border border-gray-200 hover:bg-gray-50 transition-colors">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
                {DAYS_SHORT.map((day) => (
                    <div key={day} className="py-2 md:py-4 text-center border-r border-gray-200 last:border-r-0">
                        <span className="text-[10px] md:text-xs uppercase tracking-widest font-bold text-gray-400">{day}</span>
                    </div>
                ))}
            </div>

            {monthHasEvents ? (
                <div className="grid grid-cols-7 bg-[#F2F0EB]">
                    <Motion.div
                        key={`${year}-${month}`}
                        className="contents"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.25 }}
                    >
                        {cells.map((day, index) => {
                            const key = day
                                ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                                : null;
                            const dayEvents = key ? (byDate.get(key) || []) : [];
                            const todayCell = day && isToday(day);

                            return (
                                <div
                                    key={index}
                                    className={`min-h-[92px] sm:min-h-[130px] md:min-h-[190px] border-r border-b border-gray-300 p-1.5 md:p-3 ${day ? 'hover:bg-black/5 transition-colors' : 'bg-transparent'}`}
                                >
                                    {day && (
                                        <>
                                            <span className={`inline-flex items-center justify-center h-6 w-6 sm:h-8 sm:w-8 rounded-full text-[10px] sm:text-xs font-bold ${todayCell ? 'bg-black text-white' : 'text-black'}`}>
                                                {day}
                                            </span>

                                            {/* Every event on the day is listed. The previous build
                                                painted the first event's photo over the whole cell,
                                                which silently hid any others sharing the date. */}
                                            <ul className="mt-1.5 md:mt-2 flex flex-col gap-1">
                                                {dayEvents.slice(0, 3).map((event) => (
                                                    <li key={event.id}>
                                                        <button
                                                            type="button"
                                                            onClick={() => onSelect(event)}
                                                            className="w-full text-left px-1.5 md:px-2 py-1 rounded bg-white/90 border border-gray-200 hover:border-black transition-colors"
                                                        >
                                                            <span className="block text-[10px] md:text-xs font-medium text-black leading-tight truncate">
                                                                {event.title}
                                                            </span>
                                                            <span className="block text-[9px] md:text-[10px] text-gray-500 uppercase tracking-widest truncate">
                                                                {formatTime(event.startTime) || '—'}
                                                            </span>
                                                        </button>
                                                    </li>
                                                ))}
                                                {dayEvents.length > 3 && (
                                                    <li className="px-1.5 md:px-2 text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-gray-500">
                                                        +{dayEvents.length - 3} more
                                                    </li>
                                                )}
                                            </ul>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </Motion.div>
                </div>
            ) : (
                <EmptyState view="calendar" />
            )}
        </div>
    );
};

/* ------------------------------------------------------------------ list view */

const ListView = ({ events, onSelect }) => {
    const grouped = useMemo(() => {
        const map = new Map();
        events.forEach((event) => {
            const key = dateKey(event);
            if (!map.has(key)) map.set(key, []);
            map.get(key).push(event);
        });
        return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
    }, [events]);

    if (!events.length) return <div className="bg-white border border-gray-200 rounded-xl md:rounded-2xl"><EmptyState view="list" /></div>;

    return (
        <div className="flex flex-col gap-6 md:gap-10">
            {grouped.map(([day, dayEvents]) => (
                <section key={day} className="bg-white border border-gray-200 rounded-xl md:rounded-2xl shadow-sm overflow-hidden">
                    <h2 className="px-4 md:px-8 py-3 md:py-4 border-b border-gray-200 bg-gray-50 text-[10px] md:text-xs font-bold uppercase tracking-widest text-gray-500">
                        {formatDisplayDate(day)}
                    </h2>
                    <ul>
                        {dayEvents.map((event) => (
                            <li key={event.id} className="border-b border-gray-100 last:border-b-0">
                                <button
                                    type="button"
                                    onClick={() => onSelect(event)}
                                    className="flex w-full items-center gap-4 md:gap-6 px-4 md:px-8 py-4 md:py-5 text-left hover:bg-black/[0.03] transition-colors"
                                >
                                    <div className="w-16 h-16 md:w-24 md:h-24 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
                                        {event.imageUrl && (
                                            <img src={event.imageUrl} alt="" className="w-full h-full object-cover" />
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                                {formatTime(event.startTime) || 'Time TBC'}
                                                {event.endTime ? ` – ${formatTime(event.endTime)}` : ''}
                                            </span>
                                            <StatusBadge status={event.status} />
                                        </div>
                                        <h3 className="text-base md:text-xl font-bold text-black leading-tight break-words">{event.title}</h3>
                                        <p className="text-[10px] md:text-xs uppercase tracking-widest text-gray-500 mt-1 truncate">
                                            {event.location}
                                        </p>
                                    </div>
                                </button>
                            </li>
                        ))}
                    </ul>
                </section>
            ))}
        </div>
    );
};

/* ------------------------------------------------------------------ grid view */

const GridView = ({ events, onSelect }) => {
    if (!events.length) return <div className="bg-white border border-gray-200 rounded-xl md:rounded-2xl"><EmptyState view="grid" /></div>;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {events.map((event) => (
                <article key={event.id} className="group bg-white border border-gray-200 rounded-xl md:rounded-2xl shadow-sm overflow-hidden flex flex-col">
                    <button type="button" onClick={() => onSelect(event)} className="flex flex-col h-full text-left">
                        <div className="relative h-44 md:h-52 overflow-hidden bg-gray-100">
                            {event.imageUrl && (
                                <img src={event.imageUrl} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                            )}
                            <div className="absolute top-3 left-3">
                                <StatusBadge status={event.status} />
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 p-5 md:p-6 flex-1">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                {formatDisplayDate(event.eventDate)}
                            </span>
                            <h3 className="text-lg md:text-xl font-bold text-black leading-tight break-words group-hover:underline transition-colors">
                                {event.title}
                            </h3>
                            <p className="text-[10px] md:text-xs uppercase tracking-widest text-gray-500 mt-auto pt-2">
                                {formatTime(event.startTime) || 'Time TBC'} · {event.location}
                            </p>
                        </div>
                    </button>
                </article>
            ))}
        </div>
    );
};

/* ------------------------------------------------------------------ dispatcher */

export default function EventViews({
    view, events, calendarDate, onCalendarDateChange, onSelect
}) {
    if (view === 'list') return <ListView events={events} onSelect={onSelect} />;
    if (view === 'grid') return <GridView events={events} onSelect={onSelect} />;
    return (
        <CalendarView
            events={events}
            calendarDate={calendarDate}
            onCalendarDateChange={onCalendarDateChange}
            onSelect={onSelect}
        />
    );
}