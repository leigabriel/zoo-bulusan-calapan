import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/use-auth';
import { reservationAPI } from '../../services/api-client';

const Icons = {
    Ticket: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M1.5 6.375c0-1.036.84-1.875 1.875-1.875h17.25c1.035 0 1.875.84 1.875 1.875v3.026a.75.75 0 01-.375.65 2.249 2.249 0 000 3.898.75.75 0 01.375.65v3.026c0 1.035-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 011.5 17.625v-3.026a.75.75 0 01.374-.65 2.249 2.249 0 000-3.898.75.75 0 01-.374-.65V6.375zm15-1.125a.75.75 0 01.75.75v.75a.75.75 0 01-1.5 0V6a.75.75 0 01.75-.75zm.75 4.5a.75.75 0 00-1.5 0v.75a.75.75 0 001.5 0v-.75zm-.75 3a.75.75 0 01.75.75v.75a.75.75 0 01-1.5 0v-.75a.75.75 0 01.75-.75zm.75 4.5a.75.75 0 00-1.5 0V18a.75.75 0 001.5 0v-.75zM6 12a.75.75 0 01.75-.75H12a.75.75 0 010 1.5H6.75A.75.75 0 016 12zm.75 2.25a.75.75 0 000 1.5h3a.75.75 0 000-1.5h-3z" clipRule="evenodd" />
        </svg>
    ),
    Calendar: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 3v1.5h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V7.5a3 3 0 013-3H6V3a.75.75 0 01.75-.75zm13.5 9a1.5 1.5 0 00-1.5-1.5H5.25a1.5 1.5 0 00-1.5 1.5v7.5a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5v-7.5z" clipRule="evenodd" />
        </svg>
    ),
    Close: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
        </svg>
    ),
    Archive: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M3.375 3C2.339 3 1.5 3.84 1.5 4.875v.75c0 1.036.84 1.875 1.875 1.875h17.25c1.035 0 1.875-.84 1.875-1.875v-.75C22.5 3.839 21.66 3 20.625 3H3.375z" />
            <path fillRule="evenodd" d="M3.087 9l.54 9.176A3 3 0 006.62 21h10.757a3 3 0 002.995-2.824L20.913 9H3.087zm6.163 3.75A.75.75 0 0110 12h4a.75.75 0 010 1.5h-4a.75.75 0 01-.75-.75z" clipRule="evenodd" />
        </svg>
    ),
    Restore: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M4.755 10.059a7.5 7.5 0 0112.548-3.364l1.903 1.903h-3.183a.75.75 0 100 1.5h4.992a.75.75 0 00.75-.75V4.356a.75.75 0 00-1.5 0v3.18l-1.9-1.9A9 9 0 003.306 9.67a.75.75 0 101.45.388zm15.408 3.352a.75.75 0 00-.919.53 7.5 7.5 0 01-12.548 3.364l-1.902-1.903h3.183a.75.75 0 000-1.5H2.984a.75.75 0 00-.75.75v4.992a.75.75 0 001.5 0v-3.18l1.9 1.9a9 9 0 0015.059-4.035.75.75 0 00-.53-.918z" clipRule="evenodd" />
        </svg>
    )
};

const ReservationHistoryPanel = ({ isOpen, onClose }) => {
    const { isAuthenticated } = useAuth();
    const [activeTab, setActiveTab] = useState('all');
    const [ticketReservations, setTicketReservations] = useState([]);
    const [eventReservations, setEventReservations] = useState([]);
    const [archivedReservations, setArchivedReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [showArchived, setShowArchived] = useState(false);
    const [archiving, setArchiving] = useState(false);
    const [selectedReservation, setSelectedReservation] = useState(null);

    // Body scroll lock when panel is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && isAuthenticated) {
            fetchReservations();
        }
    }, [isOpen, isAuthenticated]);

    const fetchReservations = async () => {
        try {
            setLoading(true);
            const [ticketRes, eventRes] = await Promise.all([
                reservationAPI.getMyTicketReservations(),
                reservationAPI.getMyEventReservations()
            ]);

            if (ticketRes.success) {
                const active = (ticketRes.reservations || []).filter(r => !r.is_archived);
                const archived = (ticketRes.reservations || []).filter(r => r.is_archived);
                setTicketReservations(active);
                setArchivedReservations(prev => [...prev.filter(r => r.type !== 'ticket'), ...archived.map(r => ({ ...r, type: 'ticket' }))]);
            }
            if (eventRes.success) {
                const active = (eventRes.reservations || []).filter(r => !r.is_archived);
                const archived = (eventRes.reservations || []).filter(r => r.is_archived);
                setEventReservations(active);
                setArchivedReservations(prev => [...prev.filter(r => r.type !== 'event'), ...archived.map(r => ({ ...r, type: 'event' }))]);
            }
        } catch (err) {
            // Error fetching reservations
        } finally {
            setLoading(false);
        }
    };

    const handleArchive = async (reservation) => {
        if (!confirm('Archive this reservation?')) return;
        setArchiving(true);
        try {
            const res = reservation.type === 'ticket'
                ? await reservationAPI.archiveTicketReservation(reservation.id)
                : await reservationAPI.archiveEventReservation(reservation.id);
            if (res.success) {
                fetchReservations();
                setSelectedReservation(null);
            }
        } catch (err) {
            // Error archiving
        } finally {
            setArchiving(false);
        }
    };

    const handleUnarchive = async (reservation) => {
        if (!confirm('Restore this reservation?')) return;
        setArchiving(true);
        try {
            const res = reservation.type === 'ticket'
                ? await reservationAPI.unarchiveTicketReservation(reservation.id)
                : await reservationAPI.unarchiveEventReservation(reservation.id);
            if (res.success) {
                fetchReservations();
                setSelectedReservation(null);
            }
        } catch (err) {
            // Error restoring
        } finally {
            setArchiving(false);
        }
    };

    const combinedReservations = [
        ...ticketReservations.map(r => ({ ...r, type: 'ticket' })),
        ...eventReservations.map(r => ({ ...r, type: 'event' }))
    ];

    const filteredReservations = (showArchived ? archivedReservations : (
        activeTab === 'all' ? combinedReservations :
        activeTab === 'tickets' ? ticketReservations.map(r => ({ ...r, type: 'ticket' })) :
        eventReservations.map(r => ({ ...r, type: 'event' }))
    )).filter(r => filter === 'all' || r.status === filter)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const getStatusBadge = (status) => {
        const styles = {
            pending: 'bg-yellow-100 text-yellow-800',
            confirmed: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800',
            completed: 'bg-blue-100 text-blue-800'
        };
        return styles[status] || styles.pending;
    };

    const calculateTotal = (r) => ((r.adult_quantity || 0) * 40) + ((r.child_quantity || 0) * 20);

    if (!isOpen) return null;

    return (
        <>
            <div 
                className="fixed inset-0 bg-black/50 z-[90] backdrop-blur-sm transition-opacity duration-300 ease-out" 
                onClick={onClose} 
            />
            <div className="fixed right-0 top-0 h-full w-full md:w-1/2 lg:max-w-xl bg-white shadow-2xl z-[100] flex flex-col transform transition-transform duration-300 ease-out">
                <div className="p-6 border-b flex items-center justify-between bg-gray-50">
                    <div>
                        <h2 className="text-xl font-bold">Reservation History</h2>
                        <p className="text-sm text-gray-500">Your past bookings</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition">
                        <Icons.Close />
                    </button>
                </div>

                {!isAuthenticated ? (
                    <div className="flex-1 flex items-center justify-center p-8">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Icons.Ticket />
                            </div>
                            <h3 className="font-bold mb-2">Sign in required</h3>
                            <p className="text-gray-500 text-sm">Please sign in to view your history</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="p-4 border-b space-y-3">
                            <div className="flex gap-2 overflow-x-auto pb-1">
                                {[
                                    { key: 'all', label: 'All', count: combinedReservations.length },
                                    { key: 'tickets', label: 'Tickets', count: ticketReservations.length },
                                    { key: 'events', label: 'Events', count: eventReservations.length },
                                    { key: 'archived', label: 'Archived', count: archivedReservations.length }
                                ].map(tab => (
                                    <button
                                        key={tab.key}
                                        onClick={() => {
                                            if (tab.key === 'archived') {
                                                setShowArchived(true);
                                            } else {
                                                setActiveTab(tab.key);
                                                setShowArchived(false);
                                            }
                                        }}
                                        className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-full whitespace-nowrap transition ${
                                            (tab.key === 'archived' && showArchived) || (!showArchived && activeTab === tab.key)
                                                ? 'bg-black text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        {tab.label} ({tab.count})
                                    </button>
                                ))}
                            </div>
                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
                            >
                                <option value="all">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4">
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : filteredReservations.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <Icons.Calendar />
                                    </div>
                                    <p className="font-medium text-gray-600">No reservations found</p>
                                    <p className="text-sm text-gray-400 mt-1">Try adjusting filters</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {filteredReservations.map(reservation => (
                                        <div
                                            key={`${reservation.type}-${reservation.id}`}
                                            onClick={() => setSelectedReservation(reservation)}
                                            className="bg-gray-50 hover:bg-gray-100 rounded-xl p-4 cursor-pointer transition group"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                                    reservation.type === 'ticket' ? 'bg-emerald-100 text-emerald-600' : 'bg-purple-100 text-purple-600'
                                                }`}>
                                                    {reservation.type === 'ticket' ? <Icons.Ticket /> : <Icons.Calendar />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="font-bold truncate">
                                                            {reservation.type === 'ticket' ? 'Zoo Visit' : (reservation.venue_event_name || reservation.event_title || 'Venue Booking')}
                                                        </h4>
                                                        <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${getStatusBadge(reservation.status)}`}>
                                                            {reservation.status}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                                        <span>{formatDate(reservation.reservation_date || reservation.venue_event_date || reservation.event_date)}</span>
                                                        <span>•</span>
                                                        <span className="font-mono bg-white px-1.5 py-0.5 rounded">
                                                            {reservation.reservation_reference}
                                                        </span>
                                                    </div>
                                                    {reservation.type === 'ticket' && (
                                                        <div className="flex items-center gap-2 mt-1.5 text-xs">
                                                            <span className="text-gray-500">
                                                                {(reservation.adult_quantity || 0) + (reservation.child_quantity || 0) + (reservation.bulusan_resident_quantity || 0)} visitors
                                                            </span>
                                                            <span className="font-medium text-emerald-600">
                                                                {calculateTotal(reservation) === 0 ? 'FREE' : `₱${calculateTotal(reservation)}`}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        showArchived ? handleUnarchive(reservation) : handleArchive(reservation);
                                                    }}
                                                    disabled={archiving}
                                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition opacity-0 group-hover:opacity-100"
                                                    title={showArchived ? 'Restore' : 'Archive'}
                                                >
                                                    {showArchived ? <Icons.Restore /> : <Icons.Archive />}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {selectedReservation && (
                <div className="fixed inset-0 bg-black/50 z-[110] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm max-h-[80vh] overflow-y-auto">
                        <div className="p-4 border-b flex items-center justify-between">
                            <h3 className="font-bold">Details</h3>
                            <button onClick={() => setSelectedReservation(null)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                                <Icons.Close />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                    selectedReservation.type === 'ticket' ? 'bg-emerald-100 text-emerald-600' : 'bg-purple-100 text-purple-600'
                                }`}>
                                    {selectedReservation.type === 'ticket' ? <Icons.Ticket /> : <Icons.Calendar />}
                                </div>
                                <div>
                                    <h4 className="font-bold">
                                        {selectedReservation.type === 'ticket' ? 'Zoo Visit' : (selectedReservation.venue_event_name || selectedReservation.event_title || 'Venue Booking')}
                                    </h4>
                                    <span className={`text-xs uppercase font-bold px-2 py-0.5 rounded ${getStatusBadge(selectedReservation.status)}`}>
                                        {selectedReservation.status}
                                    </span>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-xs text-gray-500">Reference</p>
                                <p className="font-mono font-bold">{selectedReservation.reservation_reference}</p>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between py-1.5 border-b">
                                    <span className="text-gray-500">Date</span>
                                    <span className="font-medium">{formatDate(selectedReservation.reservation_date || selectedReservation.venue_event_date || selectedReservation.event_date)}</span>
                                </div>
                                {selectedReservation.type === 'ticket' && (
                                    <>
                                        {selectedReservation.adult_quantity > 0 && (
                                            <div className="flex justify-between py-1.5 border-b">
                                                <span className="text-gray-500">Adults</span>
                                                <span>{selectedReservation.adult_quantity} × ₱40</span>
                                            </div>
                                        )}
                                        {selectedReservation.child_quantity > 0 && (
                                            <div className="flex justify-between py-1.5 border-b">
                                                <span className="text-gray-500">Children</span>
                                                <span>{selectedReservation.child_quantity} × ₱20</span>
                                            </div>
                                        )}
                                        {selectedReservation.bulusan_resident_quantity > 0 && (
                                            <div className="flex justify-between py-1.5 border-b">
                                                <span className="text-gray-500">Bulusan Residents</span>
                                                <span>{selectedReservation.bulusan_resident_quantity} (FREE)</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between py-2 bg-emerald-50 rounded-lg px-3 mt-2">
                                            <span className="font-medium">Total</span>
                                            <span className="font-bold text-emerald-600">
                                                {calculateTotal(selectedReservation) === 0 ? 'FREE' : `₱${calculateTotal(selectedReservation)}`}
                                            </span>
                                        </div>
                                    </>
                                )}
                                {selectedReservation.type === 'event' && (
                                    <>
                                        <div className="flex justify-between py-1.5 border-b">
                                            <span className="text-gray-500">Participants</span>
                                            <span>{selectedReservation.number_of_participants}</span>
                                        </div>
                                        <div className="flex justify-between py-1.5 border-b">
                                            <span className="text-gray-500">Organizer</span>
                                            <span>{selectedReservation.participant_name}</span>
                                        </div>
                                        {selectedReservation.venue_event_description && (
                                            <div className="py-1.5">
                                                <span className="text-gray-500 block mb-1">Description</span>
                                                <p className="text-xs bg-gray-50 p-2 rounded">{selectedReservation.venue_event_description}</p>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={() => setSelectedReservation(null)}
                                    className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 font-medium rounded-lg transition"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={() => selectedReservation.is_archived ? handleUnarchive(selectedReservation) : handleArchive(selectedReservation)}
                                    disabled={archiving}
                                    className={`flex-1 py-2.5 font-medium rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2 ${
                                        selectedReservation.is_archived
                                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                            : 'bg-gray-600 hover:bg-gray-700 text-white'
                                    }`}
                                >
                                    {selectedReservation.is_archived ? <Icons.Restore /> : <Icons.Archive />}
                                    {archiving ? 'Processing...' : (selectedReservation.is_archived ? 'Restore' : 'Archive')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ReservationHistoryPanel;