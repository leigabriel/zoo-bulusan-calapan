import { useState, useEffect } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { ReactLenis } from 'lenis/react';
import AIFloatingButton from '../../components/common/AIFloatingButton';
import { userAPI } from '../../services/api-client';

const Icons = {
    Location: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5 md:w-3.5 md:h-3.5">
            <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
        </svg>
    ),
    Close: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
        </svg>
    ),
    Empty: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none" stroke="currentColor" strokeWidth="12" className="w-16 h-16">
            <path strokeLinecap="round" strokeLinejoin="round" d="M226.5 92.9c14.3 42.9-.3 86.2-32.6 96.8s-70.1-15.6-84.4-58.5s.3-86.2 32.6-96.8s70.1 15.6 84.4 58.5zM100.4 198.6c18.9 32.4 14.3 70.1-10.2 84.1s-59.7-.9-78.5-33.3S-2.7 179.3 21.8 165.3s59.7 .9 78.5 33.3zM69.2 401.2C121.6 259.9 214.7 224 256 224s134.4 35.9 186.8 177.2c3.6 9.7 5.2 20.1 5.2 30.5v1.6c0 25.8-20.9 46.7-46.7 46.7c-11.5 0-22.9-1.4-34-4.2l-88-22c-15.3-3.8-31.3-3.8-46.6 0l-88 22c-11.1 2.8-22.5 4.2-34 4.2C84.9 480 64 459.1 64 433.3v-1.6c0-10.4 1.6-20.8 5.2-30.5zM421.8 282.7c-24.5-14-29.1-51.7-10.2-84.1s54-47.3 78.5-33.3s29.1 51.7 10.2 84.1s-54 47.3-78.5 33.3zM310.1 189.7c-32.3-10.6-46.9-53.9-32.6-96.8s52.1-69.1 84.4-58.5s46.9 53.9 32.6 96.8s-52.1 69.1-84.4 58.5z" />
        </svg>
    )
};

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
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const response = await userAPI.getEvents();
            if (response.success && response.events) {
                const transformedEvents = response.events.map((event, index) => ({
                    id: event.id,
                    title: event.title,
                    description: event.description || '',
                    eventDate: formatDateFromDB(event.event_date),
                    startTime: event.start_time,
                    endTime: event.end_time,
                    location: event.location || 'Zoo Bulusan',
                    status: event.status || 'upcoming',
                    imageUrl: event.image_url || DEFAULT_EVENT_IMAGES[index % DEFAULT_EVENT_IMAGES.length]
                }));
                transformedEvents.sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));
                setEvents(transformedEvents);
            } else { setEvents([]); }
        } catch (err) {
            console.error(err);
            setError('Failed to load events.');
            setEvents([]);
        } finally { setLoading(false); }
    };

    const formatDateFromDB = (dateValue) => {
        if (!dateValue) return '';
        if (typeof dateValue === 'string' && dateValue.includes('T')) return dateValue.split('T')[0];
        const date = new Date(dateValue);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
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
            year: 'numeric', month: 'long', day: 'numeric'
        });
    };

    const filteredEvents = events.filter(event => filter === 'all' || event.status === filter);

    const getStatusStyle = (status) => {
        switch (status) {
            case 'ongoing': return 'text-blue-700';
            case 'upcoming': return 'text-green-700';
            default: return 'text-green-700';
        }
    };

    return (
        <ReactLenis root>
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex flex-col text-[#2A2A2A]">
            <Header />

            <section className="relative px-4 md:px-6 pt-24 pb-8 md:pt-40 md:pb-16 max-w-7xl mx-auto w-full">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div className="max-w-2xl text-left">
                        <h1 className="text-3xl md:text-7xl lg:text-8xl font-bold uppercase leading-tight md:leading-[0.9] tracking-tighter mb-4 md:mb-8">
                            Wildlife<br />Events
                        </h1>
                        <p className="text-sm md:text-xl font-medium opacity-80 max-w-md leading-snug">
                            Experience unforgettable moments with our animals through live feedings, shows, and educational activities.
                        </p>
                    </div>
                </div>
            </section>

            <div className="container mx-auto px-4 md:px-6 py-4 md:py-12 flex-grow">
                <div className="flex flex-wrap gap-4 md:gap-8 mb-8 md:mb-16 border-b border-black/10 pb-4 overflow-x-auto no-scrollbar">
                    {['all', 'upcoming', 'ongoing'].map(f => (
                        <button key={f} onClick={() => setFilter(f)}
                            className={`text-[10px] md:text-xs uppercase tracking-widest transition-all whitespace-nowrap ${filter === f ? 'font-black border-b-2 border-black' : 'opacity-50 hover:opacity-100 font-bold'}`}>
                            {f === 'all' ? 'All Events' : f}
                        </button>
                    ))}
                </div>

                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}

                {!loading && !error && (
                    <div className="grid grid-cols-3 gap-3 md:gap-x-12 md:gap-y-20">
                        {filteredEvents.map((event) => (
                            <div key={event.id} className="group cursor-pointer" onClick={() => setSelectedEvent(event)}>
                                <div className="aspect-[3/4] md:aspect-[4/5] overflow-hidden mb-3 md:mb-6 bg-white shadow-sm">
                                    <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700 ease-out" />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-[10px] md:text-2xl font-bold mb-1 uppercase tracking-tight leading-tight line-clamp-1">{event.title}</h3>
                                    <p className="hidden md:block text-sm font-medium opacity-70 leading-snug mb-4 line-clamp-2">
                                        {event.description || `Join us for ${event.title} at ${event.location}.`}
                                    </p>
                                    <div className="flex flex-col md:flex-row items-start md:items-center gap-1 md:gap-4 text-[7px] md:text-[10px] uppercase tracking-widest font-black opacity-40">
                                        <span className="flex items-center gap-0.5"><Icons.Location /> <span className="line-clamp-1">{event.location}</span></span>
                                        <span className={getStatusStyle(event.status)}>{event.status}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {selectedEvent && (
                <div className="fixed inset-0 bg-black/40 md:bg-[#ebebeb]/95 z-[100] flex items-center justify-center p-0 md:p-6 backdrop-blur-sm overflow-y-auto">
                    <button onClick={() => setSelectedEvent(null)} className="fixed top-6 right-6 md:absolute md:-top-12 md:-right-12 p-3 bg-white md:bg-transparent rounded-full md:rounded-none shadow-lg md:shadow-none z-[110] text-black transition-transform active:scale-95">
                        <Icons.Close />
                    </button>

                    <div className="max-w-4xl w-full h-full md:h-auto bg-[#F9F9F9] md:bg-transparent grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-12 items-center overflow-y-auto md:overflow-visible">
                        <div className="aspect-[4/5] md:aspect-[4/5] bg-white shadow-2xl overflow-hidden w-full">
                            <img src={selectedEvent.imageUrl} alt={selectedEvent.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="p-8 md:p-0 text-left">
                            <h2 className="text-4xl md:text-6xl font-bold uppercase mb-2 leading-tight tracking-tighter">{selectedEvent.title}</h2>
                            <p className="text-[10px] md:text-xs uppercase tracking-[0.2em] mb-6 md:mb-8 font-black opacity-40">
                                {formatDisplayDate(selectedEvent.eventDate)}
                            </p>

                            <div className="space-y-6 md:space-y-8 mb-10 md:mb-12">
                                <div>
                                    <h4 className="text-[8px] md:text-[10px] uppercase tracking-widest font-black mb-1 md:mb-2 opacity-30">Time & Location</h4>
                                    <p className="text-sm md:text-lg font-bold leading-tight">
                                        {formatTime(selectedEvent.startTime)} {selectedEvent.endTime && `- ${formatTime(selectedEvent.endTime)}`} • {selectedEvent.location}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="text-[8px] md:text-[10px] uppercase tracking-widest font-black mb-1 md:mb-2 opacity-30">About Event</h4>
                                    <p className="text-sm md:text-lg font-medium leading-snug opacity-80">{selectedEvent.description || `An exclusive wildlife experience at Zoo Bulusan Calapan.`}</p>
                                </div>
                                <div className={`inline-block border border-black/10 px-3 py-1.5 md:px-4 md:py-2 text-[8px] md:text-[10px] uppercase tracking-widest font-black ${getStatusStyle(selectedEvent.status)}`}>
                                    Status: {selectedEvent.status}
                                </div>
                            </div>

                            <button onClick={() => setSelectedEvent(null)} className="w-full md:w-auto px-8 py-4 bg-[#2A2A2A] text-white text-[10px] md:text-xs uppercase tracking-[0.2em] font-bold hover:bg-black transition-all">
                                Return to Events
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
            <AIFloatingButton />
        </div>
        </ReactLenis>
    );
};

export default Events;