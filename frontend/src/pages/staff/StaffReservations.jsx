import { useState, useEffect } from 'react';
import { reservationAPI, getResidentIdImageUrl } from '../../services/api-client';

const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
    </svg>
);

const TicketIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
        <path d="M13 5v2" />
        <path d="M13 17v2" />
        <path d="M13 11v2" />
    </svg>
);

const CalendarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
);

const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const StaffReservations = ({ globalSearch = '' }) => {
    const [activeTab, setActiveTab] = useState('tickets');
    const [ticketReservations, setTicketReservations] = useState([]);
    const [eventReservations, setEventReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedReservation, setSelectedReservation] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);

    useEffect(() => { fetchReservations(); }, []);

    const fetchReservations = async () => {
        try {
            setLoading(true);
            const [ticketRes, eventRes] = await Promise.all([
                reservationAPI.getAllTicketReservations('staff'),
                reservationAPI.getAllEventReservations('staff')
            ]);
            if (ticketRes.success) setTicketReservations(ticketRes.reservations || []);
            if (eventRes.success) setEventReservations(eventRes.reservations || []);
        } catch (err) {
            console.error(err);
            setError('Failed to load reservations');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status?.toLowerCase()) {
            case 'confirmed': return 'bg-[#8cff65]/20 text-[#8cff65] border-[#8cff65]/30';
            case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30';
            case 'completed': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };

    const updateReservationStatus = async (id, type, status) => {
        setActionLoading(true);
        try {
            const res = type === 'ticket'
                ? await reservationAPI.updateTicketReservationStatus(id, status, 'staff')
                : await reservationAPI.updateEventReservationStatus(id, status, 'staff');
            if (res.success) {
                fetchReservations();
                setShowModal(false);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const effectiveSearch = globalSearch || searchQuery;
    const currentReservations = activeTab === 'tickets' ? ticketReservations : eventReservations;

    const filteredReservations = currentReservations.filter(r => {
        const matchesSearch =
            r.reservation_reference?.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
            r.visitor_name?.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
            r.participant_name?.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
            r.user_name?.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
            r.user_email?.toLowerCase().includes(effectiveSearch.toLowerCase());
        const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleStatusChange = (id, type, status) => {
        setConfirmAction({ id, type, status });
    };

    const executeStatusChange = async () => {
        if (!confirmAction) return;
        await updateReservationStatus(confirmAction.id, confirmAction.type, confirmAction.status);
        setConfirmAction(null);
    };

    const stats = {
        totalTicket: ticketReservations.length,
        totalEvent: eventReservations.length,
        pending: [...ticketReservations, ...eventReservations].filter(r => r.status === 'pending').length,
        confirmed: [...ticketReservations, ...eventReservations].filter(r => r.status === 'confirmed').length
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-[#8cff65] border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-400">Loading reservations...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
                {error}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#8cff65]/10 rounded-xl flex items-center justify-center text-[#8cff65]">
                            <TicketIcon />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{stats.totalTicket}</p>
                            <p className="text-xs text-gray-500">Ticket Reservations</p>
                        </div>
                    </div>
                </div>
                <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400">
                            <CalendarIcon />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{stats.totalEvent}</p>
                            <p className="text-xs text-gray-500">Event Reservations</p>
                        </div>
                    </div>
                </div>
                <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center text-yellow-400">
                            <span className="text-lg font-bold">P</span>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{stats.pending}</p>
                            <p className="text-xs text-gray-500">Pending</p>
                        </div>
                    </div>
                </div>
                <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#8cff65]/10 rounded-xl flex items-center justify-center text-[#8cff65]">
                            <span className="text-lg font-bold">C</span>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{stats.confirmed}</p>
                            <p className="text-xs text-gray-500">Confirmed</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-[#2a2a2a]">
                    <div className="flex gap-4 mb-4">
                        <button
                            onClick={() => setActiveTab('tickets')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'tickets' ? 'bg-[#8cff65] text-black' : 'bg-[#1e1e1e] text-gray-400 hover:text-white'}`}
                        >
                            Ticket Reservations ({ticketReservations.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('events')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'events' ? 'bg-[#8cff65] text-black' : 'bg-[#1e1e1e] text-gray-400 hover:text-white'}`}
                        >
                            Event Reservations ({eventReservations.length})
                        </button>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 flex-wrap">
                            <div className="relative flex-1 min-w-[200px] max-w-sm">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                    <SearchIcon />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search reservations..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#8cff65] transition-all"
                                />
                            </div>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="appearance-none bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl py-2.5 px-4 pr-8 text-sm text-white focus:outline-none focus:border-[#8cff65] cursor-pointer"
                            >
                                <option value="all">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                        <button
                            onClick={fetchReservations}
                            className="px-4 py-2.5 bg-[#1e1e1e] border border-[#2a2a2a] text-gray-400 hover:text-white rounded-xl transition-all"
                        >
                            Refresh
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#1e1e1e]">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Code</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">User</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{activeTab === 'tickets' ? 'Ticket Type' : 'Event Name'}</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Reservation Date</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2a2a2a]">
                            {filteredReservations.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                        No reservations found
                                    </td>
                                </tr>
                            ) : (
                                filteredReservations.map(reservation => (
                                    <tr key={reservation.id} className="hover:bg-[#1e1e1e]/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-mono text-sm text-[#8cff65]">{reservation.reservation_reference || '-'}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-white">{reservation.user_name || reservation.visitor_name || reservation.participant_name || 'Guest'}</p>
                                            <p className="text-sm text-gray-500">{reservation.user_email || reservation.visitor_email || reservation.participant_email}</p>
                                        </td>
                                        <td className="px-6 py-4 text-gray-300">
                                            {activeTab === 'tickets' 
                                                ? (
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {reservation.adult_quantity > 0 && <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded">Adult: {reservation.adult_quantity}</span>}
                                                        {reservation.child_quantity > 0 && <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded">Child: {reservation.child_quantity}</span>}
                                                        {reservation.bulusan_resident_quantity > 0 && <span className="px-2 py-0.5 bg-[#8cff65]/20 text-[#8cff65] text-xs rounded">Resident: {reservation.bulusan_resident_quantity}</span>}
                                                    </div>
                                                )
                                                : (
                                                    <div>
                                                        <p className="font-medium">{reservation.venue_event_name || reservation.event_title || 'Venue Booking'}</p>
                                                    </div>
                                                )
                                            }
                                        </td>
                                        <td className="px-6 py-4 text-gray-300">
                                            {activeTab === 'tickets' 
                                                ? formatDate(reservation.reservation_date)
                                                : formatDate(reservation.venue_event_date || reservation.event_date)
                                            }
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border capitalize ${getStatusBadge(reservation.status)}`}>
                                                {reservation.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => { setSelectedReservation({ ...reservation, type: activeTab === 'tickets' ? 'ticket' : 'event' }); setShowModal(true); }}
                                                    className="p-2 bg-[#1e1e1e] hover:bg-[#2a2a2a] border border-[#2a2a2a] text-gray-400 hover:text-white rounded-lg transition-all"
                                                    title="View details"
                                                >
                                                    <EyeIcon />
                                                </button>
                                                {reservation.status === 'pending' && (
                                                    <button
                                                        onClick={() => handleStatusChange(reservation.id, activeTab === 'tickets' ? 'ticket' : 'event', 'confirmed')}
                                                        className="p-2 bg-[#1e1e1e] hover:bg-[#8cff65]/10 border border-[#2a2a2a] hover:border-[#8cff65]/50 text-gray-400 hover:text-[#8cff65] rounded-lg transition-all"
                                                        title="Confirm"
                                                    >
                                                        <CheckIcon />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="px-6 py-4 border-t border-[#2a2a2a] flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                        Showing {filteredReservations.length} of {currentReservations.length} reservations
                    </p>
                </div>
            </div>

            {showModal && selectedReservation && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl w-full max-w-lg">
                        <div className="p-6 border-b border-[#2a2a2a] flex items-center justify-between">
                            <h3 className="text-xl font-bold text-white">Reservation Details</h3>
                            <button onClick={() => { setShowModal(false); setSelectedReservation(null); }} className="p-2 hover:bg-[#1e1e1e] rounded-lg text-gray-400 hover:text-white transition">
                                <CloseIcon />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase mb-1">Reservation Reference</p>
                                    <p className="font-mono text-[#8cff65]">{selectedReservation.reservation_reference}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase mb-1">Status</p>
                                    <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border capitalize ${getStatusBadge(selectedReservation.status)}`}>
                                        {selectedReservation.status}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase mb-1">{selectedReservation.type === 'ticket' ? 'Visitor' : 'Participant'}</p>
                                    <p className="text-white">{selectedReservation.user_name || selectedReservation.visitor_name || selectedReservation.participant_name}</p>
                                    <p className="text-sm text-gray-400">{selectedReservation.user_email || selectedReservation.visitor_email || selectedReservation.participant_email}</p>
                                    {(selectedReservation.visitor_phone || selectedReservation.participant_phone) && <p className="text-sm text-gray-400">{selectedReservation.visitor_phone || selectedReservation.participant_phone}</p>}
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase mb-1">{selectedReservation.type === 'ticket' ? 'Reservation Date' : 'Event'}</p>
                                    <p className="text-white">
                                        {selectedReservation.type === 'ticket' 
                                            ? formatDate(selectedReservation.reservation_date)
                                            : (selectedReservation.venue_event_name || selectedReservation.event_title || 'Venue Booking')
                                        }
                                    </p>
                                    {selectedReservation.type === 'event' && (selectedReservation.venue_event_date || selectedReservation.event_date) && <p className="text-sm text-gray-400">{formatDate(selectedReservation.venue_event_date || selectedReservation.event_date)}</p>}
                                    {selectedReservation.type === 'event' && selectedReservation.venue_event_time && <p className="text-sm text-gray-400">{selectedReservation.venue_event_time}</p>}
                                </div>
                                {selectedReservation.type === 'event' && selectedReservation.venue_event_description && (
                                    <div className="col-span-2">
                                        <p className="text-xs text-gray-500 uppercase mb-1">Event Description</p>
                                        <p className="text-white text-sm">{selectedReservation.venue_event_description}</p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-xs text-gray-500 uppercase mb-1">{selectedReservation.type === 'ticket' ? 'Total Visitors' : 'Participants'}</p>
                                    <p className="text-white">{selectedReservation.type === 'ticket' ? selectedReservation.total_visitors : selectedReservation.number_of_participants}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase mb-1">Created</p>
                                    <p className="text-white">{formatDate(selectedReservation.created_at)}</p>
                                </div>
                                {selectedReservation.type === 'ticket' && (selectedReservation.adult_quantity > 0 || selectedReservation.child_quantity > 0 || selectedReservation.bulusan_resident_quantity > 0) && (
                                    <div className="col-span-2">
                                        <p className="text-xs text-gray-500 uppercase mb-1">Ticket Breakdown</p>
                                        <div className="flex gap-4 text-sm">
                                            {selectedReservation.adult_quantity > 0 && <span className="text-white">Adults: {selectedReservation.adult_quantity}</span>}
                                            {selectedReservation.child_quantity > 0 && <span className="text-white">Children: {selectedReservation.child_quantity}</span>}
                                            {selectedReservation.bulusan_resident_quantity > 0 && <span className="text-white">Bulusan Residents: {selectedReservation.bulusan_resident_quantity}</span>}
                                        </div>
                                    </div>
                                )}
                                {selectedReservation.type === 'ticket' && selectedReservation.bulusan_resident_quantity > 0 && selectedReservation.resident_id_image && (
                                    <div className="col-span-2">
                                        <p className="text-xs text-gray-500 uppercase mb-2">Bulusan Resident ID</p>
                                        <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl p-2">
                                            <img 
                                                src={getResidentIdImageUrl(selectedReservation.resident_id_image)} 
                                                alt="Bulusan Resident ID" 
                                                className="w-full max-h-48 object-contain rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                                                onClick={() => window.open(getResidentIdImageUrl(selectedReservation.resident_id_image), '_blank')}
                                            />
                                            <p className="text-xs text-gray-500 text-center mt-2">Click to view full size</p>
                                        </div>
                                    </div>
                                )}
                                {selectedReservation.total_amount > 0 && (
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase mb-1">Total Amount</p>
                                        <p className="text-[#8cff65] font-bold">₱{selectedReservation.total_amount}</p>
                                    </div>
                                )}
                            </div>
                            {(selectedReservation.notes || selectedReservation.participant_details) && (
                                <div>
                                    <p className="text-xs text-gray-500 uppercase mb-1">Notes</p>
                                    <p className="text-white">{selectedReservation.notes || selectedReservation.participant_details}</p>
                                </div>
                            )}
                            
                            {selectedReservation.status === 'pending' && (
                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={() => handleStatusChange(selectedReservation.id, selectedReservation.type, 'confirmed')}
                                        disabled={actionLoading}
                                        className="flex-1 py-3 bg-gradient-to-r from-[#8cff65] to-[#4ade80] text-[#0a0a0a] font-semibold rounded-xl hover:from-[#9dff7a] hover:to-[#5ceb91] transition-all disabled:opacity-50"
                                    >
                                        {actionLoading ? 'Processing...' : 'Confirm Reservation'}
                                    </button>
                                    <button
                                        onClick={() => handleStatusChange(selectedReservation.id, selectedReservation.type, 'cancelled')}
                                        disabled={actionLoading}
                                        className="flex-1 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-semibold rounded-xl transition-all disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {confirmAction && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl w-full max-w-sm p-6 text-center">
                        <div className={`w-16 h-16 ${confirmAction.status === 'confirmed' ? 'bg-[#8cff65]/10' : 'bg-red-500/10'} rounded-full flex items-center justify-center mx-auto mb-4 ${confirmAction.status === 'confirmed' ? 'text-[#8cff65]' : 'text-red-400'}`}>
                            {confirmAction.status === 'confirmed' ? <CheckIcon /> : <CloseIcon />}
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">
                            {confirmAction.status === 'confirmed' ? 'Confirm Reservation?' : 'Cancel Reservation?'}
                        </h3>
                        <p className="text-gray-400 mb-6">
                            {confirmAction.status === 'confirmed' 
                                ? 'Are you sure you want to confirm this reservation? The user will be notified.'
                                : 'Are you sure you want to cancel this reservation? The user will be notified.'
                            }
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmAction(null)}
                                className="flex-1 py-3 bg-[#1e1e1e] hover:bg-[#2a2a2a] text-gray-300 font-medium rounded-xl transition-all"
                            >
                                Go Back
                            </button>
                            <button
                                onClick={executeStatusChange}
                                disabled={actionLoading}
                                className={`flex-1 py-3 font-semibold rounded-xl transition-all disabled:opacity-50 ${confirmAction.status === 'confirmed' ? 'bg-gradient-to-r from-[#8cff65] to-[#4ade80] text-[#0a0a0a] hover:from-[#9dff7a] hover:to-[#5ceb91]' : 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white'}`}
                            >
                                {actionLoading ? 'Processing...' : (confirmAction.status === 'confirmed' ? 'Confirm' : 'Cancel Reservation')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffReservations;