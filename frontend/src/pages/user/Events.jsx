import { useState, useEffect } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import AIFloatingButton from '../../components/common/AIFloatingButton';
import { userAPI } from '../../services/api-client';

// Icons
const Icons = {
    Clock: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clipRule="evenodd" />
        </svg>
    ),
    Calendar: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 3v1.5h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V7.5a3 3 0 013-3H6V3a.75.75 0 01.75-.75zm13.5 9a1.5 1.5 0 00-1.5-1.5H5.25a1.5 1.5 0 00-1.5 1.5v7.5a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5v-7.5z" clipRule="evenodd" />
        </svg>
    ),
    Location: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
        </svg>
    ),
    Close: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
        </svg>
    ),
    ArrowRight: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M12.97 3.97a.75.75 0 011.06 0l7.5 7.5a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 11-1.06-1.06l6.22-6.22H3a.75.75 0 010-1.5h16.19l-6.22-6.22a.75.75 0 010-1.06z" clipRule="evenodd" />
        </svg>
    ),
    Empty: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-16 h-16">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
    )
};

// Default placeholder images for events
const DEFAULT_EVENT_IMAGES = [
    'https://images.unsplash.com/photo-1474511320723-9a56873571b7?w=800',
    'https://images.unsplash.com/photo-1534567153574-2b12153a87f0?w=800',
    'https://images.unsplash.com/photo-1544985361-b420d7a77043?w=800',
    'https://images.unsplash.com/photo-1497752531616-c3afd9760a11?w=800',
    'https://images.unsplash.com/photo-1551085254-e96b210db58a?w=800',
];

const Events = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [filter, setFilter] = useState('all'); // 'all', 'upcoming', 'ongoing'

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await userAPI.getEvents();
            if (response.success && response.events) {
                // Transform and sort events
                const transformedEvents = response.events.map((event, index) => ({
                    id: event.id,
                    title: event.title,
                    description: event.description || '',
                    eventDate: formatDateFromDB(event.event_date),
                    startTime: event.start_time,
                    endTime: event.end_time,
                    location: event.location || 'Zoo Bulusan',
                    status: event.status || 'upcoming',
                    color: event.color || '#22c55e',
                    imageUrl: event.image_url || DEFAULT_EVENT_IMAGES[index % DEFAULT_EVENT_IMAGES.length]
                }));

                // Sort by date ascending
                transformedEvents.sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));
                setEvents(transformedEvents);
            } else {
                setEvents([]);
            }
        } catch (err) {
            console.error('Error fetching events:', err);
            setError('Failed to load events. Please try again later.');
            setEvents([]);
        } finally {
            setLoading(false);
        }
    };

    // Format date from database (handles both ISO string and date object)
    const formatDateFromDB = (dateValue) => {
        if (!dateValue) return '';
        // Handle ISO string with 'T'
        if (typeof dateValue === 'string' && dateValue.includes('T')) {
            return dateValue.split('T')[0];
        }
        // Handle Date object or other formats - use local timezone
        const date = new Date(dateValue);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Format time for display (HH:mm to 12-hour format)
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

    // Format short date for cards
    const formatShortDate = (dateStr) => {
        if (!dateStr) return { day: '', month: '', weekday: '' };
        const date = new Date(dateStr + 'T00:00:00');
        return {
            day: date.getDate(),
            month: date.toLocaleDateString('en-US', { month: 'short' }),
            weekday: date.toLocaleDateString('en-US', { weekday: 'short' })
        };
    };

    // Check if event is today
    const isToday = (dateStr) => {
        const today = new Date();
        const eventDate = new Date(dateStr + 'T00:00:00');
        return today.toDateString() === eventDate.toDateString();
    };

    // Filter events based on status
    const filteredEvents = events.filter(event => {
        if (filter === 'all') return true;
        if (filter === 'upcoming') return event.status === 'upcoming';
        if (filter === 'ongoing') return event.status === 'ongoing';
        return true;
    });

    // Get status badge style
    const getStatusStyle = (status) => {
        switch (status) {
            case 'ongoing':
                return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'upcoming':
                return 'bg-green-100 text-green-700 border-green-200';
            case 'completed':
                return 'bg-gray-100 text-gray-600 border-gray-200';
            case 'cancelled':
                return 'bg-red-100 text-red-700 border-red-200';
            default:
                return 'bg-green-100 text-green-700 border-green-200';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />

            {/* Hero Section */}
            <section
                className="relative text-white py-28 sm:py-32 md:py-40 text-center bg-cover bg-center px-4"
                style={{ backgroundImage: 'linear-gradient(rgba(45,90,39,0.85), rgba(58,140,125,0.85)), url(https://images.unsplash.com/photo-1518837695005-2083093ee35b)' }}
            >
                <div className="relative z-10 animate-fade-in-up mt-22">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 tracking-tight">
                        Wildlife Events
                    </h1>
                    <p className="text-base sm:text-lg md:text-xl max-w-2xl mx-auto opacity-90 font-light">
                        Experience unforgettable moments with our animals through live feedings, shows, and educational activities.
                    </p>
                </div>
            </section>

            {/* Events Section */}
            <div className="container mx-auto px-4 py-8 sm:py-12 md:py-16 flex-grow">
                {/* Section Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 sm:mb-12">
                    <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-3">
                        <span className="h-px w-8 sm:w-12 bg-green-200"></span>
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-green-800 tracking-wide uppercase text-center">
                            Upcoming Activities
                        </h2>
                        <span className="h-px w-8 sm:w-12 bg-green-200"></span>
                    </div>

                    {/* Filter Buttons */}
                    <div className="flex justify-center sm:justify-end gap-2">
                        {[
                            { value: 'all', label: 'All Events' },
                            { value: 'upcoming', label: 'Upcoming' },
                            { value: 'ongoing', label: 'Ongoing' }
                        ].map(f => (
                            <button
                                key={f.value}
                                onClick={() => setFilter(f.value)}
                                className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${filter === f.value
                                        ? 'bg-green-600 text-white shadow-md'
                                        : 'bg-white text-gray-600 hover:bg-green-50 border border-gray-200'
                                    }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
                        <p className="text-gray-500">Loading events...</p>
                    </div>
                ) : error ? (
                    /* Error State */
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <p className="text-gray-600 mb-4">{error}</p>
                        <button
                            onClick={fetchEvents}
                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                        >
                            Try Again
                        </button>
                    </div>
                ) : filteredEvents.length === 0 ? (
                    /* Empty State */
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="text-gray-300 mb-4">
                            <Icons.Empty />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">No Events Found</h3>
                        <p className="text-gray-500 max-w-md">
                            {filter !== 'all'
                                ? `There are no ${filter} events at the moment. Check back later!`
                                : 'There are no upcoming events scheduled. Check back later for exciting activities!'
                            }
                        </p>
                    </div>
                ) : (
                    /* Events Grid */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                        {filteredEvents.map((event) => {
                            const dateInfo = formatShortDate(event.eventDate);
                            const todayEvent = isToday(event.eventDate);

                            return (
                                <div
                                    key={event.id}
                                    onClick={() => setSelectedEvent(event)}
                                    className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                                >
                                    {/* Event Image */}
                                    <div className="relative h-48 overflow-hidden">
                                        <img
                                            src={event.imageUrl}
                                            alt={event.title}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            onError={(e) => {
                                                e.target.src = DEFAULT_EVENT_IMAGES[0];
                                            }}
                                        />
                                        <div
                                            className="absolute inset-0 opacity-40"
                                            style={{ background: `linear-gradient(to top, ${event.color}, transparent)` }}
                                        />

                                        {/* Date Badge */}
                                        <div className="absolute top-4 left-4 bg-white rounded-xl shadow-lg p-2 text-center min-w-[60px]">
                                            <p className="text-xs font-medium text-gray-500 uppercase">{dateInfo.month}</p>
                                            <p className="text-2xl font-bold text-gray-800">{dateInfo.day}</p>
                                            <p className="text-xs text-gray-500">{dateInfo.weekday}</p>
                                        </div>

                                        {/* Status/Live Badge */}
                                        {(event.status === 'ongoing' || todayEvent) && (
                                            <div className="absolute top-4 right-4">
                                                <span className="flex items-center gap-1.5 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg animate-pulse">
                                                    <span className="w-2 h-2 bg-white rounded-full"></span>
                                                    {event.status === 'ongoing' ? 'LIVE NOW' : 'TODAY'}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Event Content */}
                                    <div className="p-5 sm:p-6">
                                        {/* Status Tag */}
                                        <div className="mb-3">
                                            <span className={`px-3 py-1 text-xs font-medium rounded-full border capitalize ${getStatusStyle(event.status)}`}>
                                                {event.status}
                                            </span>
                                        </div>

                                        {/* Title */}
                                        <h3 className="font-bold text-lg sm:text-xl text-gray-800 mb-2 line-clamp-2 group-hover:text-green-700 transition-colors">
                                            {event.title}
                                        </h3>

                                        {/* Time */}
                                        {event.startTime && (
                                            <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                                                <Icons.Clock />
                                                <span>
                                                    {formatTime(event.startTime)}
                                                    {event.endTime && ` - ${formatTime(event.endTime)}`}
                                                </span>
                                            </div>
                                        )}

                                        {/* Location */}
                                        <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
                                            <Icons.Location />
                                            <span>{event.location}</span>
                                        </div>

                                        {/* Description Preview */}
                                        {event.description && (
                                            <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                                                {event.description}
                                            </p>
                                        )}

                                        {/* View Details Button */}
                                        <button
                                            className="w-full py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg hover:opacity-95 transition flex items-center justify-center gap-2 group/btn"
                                        >
                                            View Details
                                            <span className="group-hover/btn:translate-x-1 transition-transform">
                                                <Icons.ArrowRight />
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Event Details Modal */}
            {selectedEvent && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setSelectedEvent(null)}
                >
                    <div
                        className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header Image */}
                        <div className="relative h-56 sm:h-72">
                            <img
                                src={selectedEvent.imageUrl}
                                alt={selectedEvent.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.target.src = DEFAULT_EVENT_IMAGES[0];
                                }}
                            />
                            <div
                                className="absolute inset-0"
                                style={{ background: `linear-gradient(to top, rgba(0,0,0,0.7), transparent)` }}
                            />

                            {/* Close Button */}
                            <button
                                onClick={() => setSelectedEvent(null)}
                                className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition"
                            >
                                <Icons.Close />
                            </button>

                            {/* Title on Image */}
                            <div className="absolute bottom-4 left-6 right-6">
                                <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full border capitalize mb-3 ${getStatusStyle(selectedEvent.status)}`}>
                                    {selectedEvent.status}
                                </span>
                                <h2 className="text-2xl sm:text-3xl font-bold text-white">
                                    {selectedEvent.title}
                                </h2>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 sm:p-8">
                            {/* Info Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                {/* Date */}
                                <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl">
                                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                                        <Icons.Calendar />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-medium">Date</p>
                                        <p className="text-gray-800 font-semibold">
                                            {formatDisplayDate(selectedEvent.eventDate)}
                                        </p>
                                    </div>
                                </div>

                                {/* Time */}
                                {selectedEvent.startTime && (
                                    <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl">
                                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                                            <Icons.Clock />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase font-medium">Time</p>
                                            <p className="text-gray-800 font-semibold">
                                                {formatTime(selectedEvent.startTime)}
                                                {selectedEvent.endTime && ` - ${formatTime(selectedEvent.endTime)}`}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Location */}
                                <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-xl sm:col-span-2">
                                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600">
                                        <Icons.Location />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-medium">Location</p>
                                        <p className="text-gray-800 font-semibold">{selectedEvent.location}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            {selectedEvent.description && (
                                <div className="mb-6">
                                    <h3 className="text-lg font-bold text-gray-800 mb-3">About This Event</h3>
                                    <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                                        {selectedEvent.description}
                                    </p>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setSelectedEvent(null)}
                                    className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
            <AIFloatingButton />
        </div>
    );
};

export default Events;