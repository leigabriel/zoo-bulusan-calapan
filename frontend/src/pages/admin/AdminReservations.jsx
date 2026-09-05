import { Calendar as ReiconCalendar, Check as ReiconCheck, Eye as ReiconEye, Search as ReiconSearch, Ticket as ReiconTicket, Trash as ReiconTrash, X as ReiconX } from 'reicon-react';
import { useState, useEffect } from 'react';
import { reservationAPI, getResidentIdImageUrl } from '../../services/api-client';
import { formatSafeDate } from '../../utils/format-date';


const AdminReservations = ({ globalSearch = '' }) => {
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
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [confirmAction, setConfirmAction] = useState(null);

    useEffect(() => { fetchReservations(); }, []);

    const fetchReservations = async () => {
        try {
            setLoading(true);
            const [ticketRes, eventRes] = await Promise.all([
                reservationAPI.getAllTicketReservations('admin'),
                reservationAPI.getAllEventReservations('admin')
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
            case 'confirmed': return 'bg-green-400/20 text-green-800 border-green-400/30';
            case 'pending': return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30';
            case 'cancelled': return 'bg-red-500/20 text-red-700 border-red-500/30';
            case 'completed': return 'bg-blue-500/20 text-blue-700 border-blue-500/30';
            default: return 'bg-gray-500/20 text-gray-500 border-gray-500/30';
        }
    };

    const updateReservationStatus = async (id, type, status) => {
        setActionLoading(true);
        try {
            const res = type === 'ticket'
                ? await reservationAPI.updateTicketReservationStatus(id, status, 'admin')
                : await reservationAPI.updateEventReservationStatus(id, status, 'admin');
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

    const deleteReservation = async (id, type) => {
        try {
            const res = type === 'ticket'
                ? await reservationAPI.deleteTicketReservation(id, 'admin')
                : await reservationAPI.deleteEventReservation(id, 'admin');
            if (res.success) {
                fetchReservations();
                setDeleteConfirm(null);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const formatDate = (dateStr) => {
        return formatSafeDate(dateStr, {
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
                    <div className="w-10 h-10 border-4 border-green-400 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-500">Loading reservations...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-xl text-red-700">
                {error}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border border-green-300 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-400/10 rounded-xl flex items-center justify-center text-green-800">
                            <ReiconTicket className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats.totalTicket}</p>
                            <p className="text-xs text-gray-500">Ticket Reservations</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-green-300 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-700">
                            <ReiconCalendar className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats.totalEvent}</p>
                            <p className="text-xs text-gray-500">Event Reservations</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-green-300 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center text-yellow-700">
                            <span className="text-lg font-bold">P</span>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                            <p className="text-xs text-gray-500">Pending</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-green-300 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-400/10 rounded-xl flex items-center justify-center text-green-800">
                            <span className="text-lg font-bold">C</span>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats.confirmed}</p>
                            <p className="text-xs text-gray-500">Confirmed</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-green-300 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-green-300">
                    <div className="flex gap-4 mb-4">
                        <button
                            onClick={() => setActiveTab('tickets')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'tickets' ? 'bg-green-400 text-black' : 'bg-green-50 text-gray-500 hover:text-gray-900'}`}
                        >
                            Ticket Reservations ({ticketReservations.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('events')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'events' ? 'bg-green-400 text-black' : 'bg-green-50 text-gray-500 hover:text-gray-900'}`}
                        >
                            Event Reservations ({eventReservations.length})
                        </button>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 flex-wrap">
                            <div className="relative flex-1 min-w-[200px] max-w-sm">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                    <ReiconSearch className="w-4 h-4" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search reservations..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-green-50 border border-green-300 rounded-xl py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:border-green-400 transition-all"
                                />
                            </div>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="appearance-none bg-green-50 border border-green-300 rounded-xl py-2.5 px-4 pr-8 text-sm text-gray-900 focus:outline-none focus:border-green-400 cursor-pointer"
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
                            className="px-4 py-2.5 bg-green-50 border border-green-300 text-gray-500 hover:text-gray-900 rounded-xl transition-all"
                        >
                            Refresh
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-green-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Code</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{activeTab === 'tickets' ? 'Ticket Type' : 'Event Name'}</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Reservation Date</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-green-300">
                            {filteredReservations.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                        No reservations found
                                    </td>
                                </tr>
                            ) : (
                                filteredReservations.map(reservation => (
                                    <tr key={reservation.id} onClick={() => { setSelectedReservation({ ...reservation, type: activeTab === 'tickets' ? 'ticket' : 'event' }); setShowModal(true); }} className="cursor-pointer hover:bg-green-50/50 transition-colors" title="Open reservation details">
                                        <td className="px-6 py-4">
                                            <p className="font-mono text-sm text-green-800">{reservation.reservation_reference || '-'}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-gray-900">{reservation.user_name || reservation.visitor_name || reservation.participant_name || 'Guest'}</p>
                                            <p className="text-sm text-gray-500">{reservation.user_email || reservation.visitor_email || reservation.participant_email}</p>
                                        </td>
                                        <td className="px-6 py-4 text-gray-700">
                                            {activeTab === 'tickets' 
                                                ? (
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {reservation.adult_quantity > 0 && <span className="px-2 py-0.5 bg-blue-500/20 text-blue-700 text-xs rounded">Adult: {reservation.adult_quantity}</span>}
                                                        {reservation.child_quantity > 0 && <span className="px-2 py-0.5 bg-purple-500/20 text-purple-700 text-xs rounded">Child: {reservation.child_quantity}</span>}
                                                        {reservation.bulusan_resident_quantity > 0 && <span className="px-2 py-0.5 bg-green-400/20 text-green-800 text-xs rounded">Resident: {reservation.bulusan_resident_quantity}</span>}
                                                    </div>
                                                )
                                                : (
                                                    <div>
                                                        <p className="font-medium">{reservation.venue_event_name || reservation.event_title || 'Venue Booking'}</p>
                                                    </div>
                                                )
                                            }
                                        </td>
                                        <td className="px-6 py-4 text-gray-700">
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
                                                    onClick={(event) => { event.stopPropagation(); setSelectedReservation({ ...reservation, type: activeTab === 'tickets' ? 'ticket' : 'event' }); setShowModal(true); }}
                                                    className="p-2 bg-green-50 hover:bg-green-50 border border-green-300 text-gray-500 hover:text-gray-900 rounded-lg transition-all"
                                                    title="View details"
                                                >
                                                    <ReiconEye className="w-4 h-4" />
                                                </button>
                                                {reservation.status === 'pending' && (
                                                    <button
                                                    onClick={(event) => { event.stopPropagation(); handleStatusChange(reservation.id, activeTab === 'tickets' ? 'ticket' : 'event', 'confirmed'); }}
                                                        className="p-2 bg-green-50 hover:bg-green-400/10 border border-green-300 hover:border-green-400/50 text-gray-500 hover:text-green-800 rounded-lg transition-all"
                                                        title="Confirm"
                                                    >
                                                        <ReiconCheck className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={(event) => { event.stopPropagation(); setDeleteConfirm({ ...reservation, type: activeTab === 'tickets' ? 'ticket' : 'event' }); }}
                                                    className="p-2 bg-green-50 hover:bg-red-500/10 border border-green-300 hover:border-red-500/50 text-gray-500 hover:text-red-700 rounded-lg transition-all"
                                                    title="Delete"
                                                >
                                                    <ReiconTrash className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="px-6 py-4 border-t border-green-300 flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                        Showing {filteredReservations.length} of {currentReservations.length} reservations
                    </p>
                </div>
            </div>

            {showModal && selectedReservation && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white border border-green-300 rounded-2xl w-full max-w-3xl">
                        <div className="p-6 border-b border-green-300 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-gray-900">Reservation Details</h3>
                            <button onClick={() => { setShowModal(false); setSelectedReservation(null); }} className="p-2 hover:bg-green-50 rounded-lg text-gray-500 hover:text-gray-900 transition">
                                <ReiconX className="w-5 h-5" />
                            </button>
                        </div>
                                        <div className="p-6 space-y-4">
                            {selectedReservation.type === 'event' && selectedReservation.payment_status === 'paid' && (
                                <div className="rounded-xl border border-green-300 bg-green-50 px-4 py-3">
                                    <p className="text-sm font-bold text-green-800">Payment successful</p>
                                    <p className="mt-1 text-xs text-green-800">PayMongo QR Ph payment confirmed.</p>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase mb-1">Reservation Reference</p>
                                    <p className="font-mono text-green-800">{selectedReservation.reservation_reference}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase mb-1">Status</p>
                                    <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border capitalize ${getStatusBadge(selectedReservation.status)}`}>
                                        {selectedReservation.status}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase mb-1">{selectedReservation.type === 'ticket' ? 'Visitor' : 'Participant'}</p>
                                    <p className="text-gray-900">{selectedReservation.user_name || selectedReservation.visitor_name || selectedReservation.participant_name}</p>
                                    <p className="text-sm text-gray-500">{selectedReservation.user_email || selectedReservation.visitor_email || selectedReservation.participant_email}</p>
                                    {(selectedReservation.visitor_phone || selectedReservation.participant_phone) && <p className="text-sm text-gray-500">{selectedReservation.visitor_phone || selectedReservation.participant_phone}</p>}
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase mb-1">{selectedReservation.type === 'ticket' ? 'Reservation Date' : 'Event'}</p>
                                    <p className="text-gray-900">
                                        {selectedReservation.type === 'ticket' 
                                            ? formatDate(selectedReservation.reservation_date)
                                            : (selectedReservation.venue_event_name || selectedReservation.event_title || 'Venue Booking')
                                        }
                                    </p>
                                    {selectedReservation.type === 'event' && (selectedReservation.venue_event_date || selectedReservation.event_date) && <p className="text-sm text-gray-500">{formatDate(selectedReservation.venue_event_date || selectedReservation.event_date)}</p>}
                                    {selectedReservation.type === 'event' && selectedReservation.venue_event_time && <p className="text-sm text-gray-500">{selectedReservation.venue_event_time}</p>}
                                </div>
                                {selectedReservation.type === 'event' && selectedReservation.venue_event_description && (
                                    <div className="col-span-2">
                                        <p className="text-xs text-gray-500 uppercase mb-1">Event Description</p>
                                        <p className="text-gray-900 text-sm">{selectedReservation.venue_event_description}</p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-xs text-gray-500 uppercase mb-1">{selectedReservation.type === 'ticket' ? 'Total Visitors' : 'Participants'}</p>
                                    <p className="text-gray-900">{selectedReservation.type === 'ticket' ? selectedReservation.total_visitors : selectedReservation.number_of_participants}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase mb-1">Created</p>
                                    <p className="text-gray-900">{formatDate(selectedReservation.created_at)}</p>
                                </div>
                                {selectedReservation.type === 'ticket' && (selectedReservation.adult_quantity > 0 || selectedReservation.child_quantity > 0 || selectedReservation.bulusan_resident_quantity > 0) && (
                                    <div className="col-span-2">
                                        <p className="text-xs text-gray-500 uppercase mb-1">Ticket Breakdown</p>
                                        <div className="flex gap-4 text-sm">
                                            {selectedReservation.adult_quantity > 0 && <span className="text-gray-900">Adults: {selectedReservation.adult_quantity}</span>}
                                            {selectedReservation.child_quantity > 0 && <span className="text-gray-900">Children: {selectedReservation.child_quantity}</span>}
                                            {selectedReservation.bulusan_resident_quantity > 0 && <span className="text-gray-900">Bulusan Residents: {selectedReservation.bulusan_resident_quantity}</span>}
                                        </div>
                                    </div>
                                )}
                                {selectedReservation.type === 'ticket' && selectedReservation.bulusan_resident_quantity > 0 && selectedReservation.resident_id_image && (
                                    <div className="col-span-2">
                                        <p className="text-xs text-gray-500 uppercase mb-2">Bulusan Resident ID</p>
                                        <div className="bg-green-50 border border-green-300 rounded-xl p-2">
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
                                        <p className="text-green-800 font-bold">₱{selectedReservation.total_amount}</p>
                                    </div>
                                )}
                                {selectedReservation.type === 'event' && (
                                    <div className="col-span-2 border-t border-gray-100 pt-4">
                                        <p className="text-xs text-gray-500 uppercase mb-2">Event Payment</p>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                                            <div><span className="block text-gray-500">Amount</span><strong className="text-gray-900">₱{Number(selectedReservation.payment_amount || 0).toFixed(2)}</strong></div>
                                            <div><span className="block text-gray-500">Method</span><strong className="text-gray-900">{['qrph', 'gcash'].includes(selectedReservation.payment_method) ? 'QR Ph via PayMongo' : selectedReservation.payment_method === 'pay_at_bulusan' ? 'Pay at Bulusan' : 'Not selected'}</strong></div>
                                            <div><span className="block text-gray-500">Status</span><strong className={selectedReservation.payment_status === 'paid' ? 'text-green-800' : 'text-amber-600'}>{(selectedReservation.payment_status || 'unpaid').toUpperCase()}</strong></div>
                                            {selectedReservation.payment_paid_at && <div><span className="block text-gray-500">Paid on</span><strong className="text-gray-900">{formatDate(selectedReservation.payment_paid_at)}</strong></div>}
                                            <div><span className="block text-gray-500">Reference</span><strong className="text-gray-900 break-all">{selectedReservation.paymongo_payment_id || selectedReservation.paymongo_checkout_session_id || '—'}</strong></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            {(selectedReservation.notes || selectedReservation.participant_details) && (
                                <div>
                                    <p className="text-xs text-gray-500 uppercase mb-1">Notes</p>
                                    <p className="text-gray-900">{selectedReservation.notes || selectedReservation.participant_details}</p>
                                </div>
                            )}
                            
                            {selectedReservation.status === 'pending' && (
                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={() => handleStatusChange(selectedReservation.id, selectedReservation.type, 'confirmed')}
                                        disabled={actionLoading}
                                        className="flex-1 py-3 bg-gradient-to-r from-green-300 via-green-400 to-green-500 text-gray-900 font-semibold rounded-xl hover:shadow-lg hover:shadow-green-400/25 transition-all disabled:opacity-50"
                                    >
                                        {actionLoading ? 'Processing...' : 'Confirm Reservation'}
                                    </button>
                                    <button
                                        onClick={() => handleStatusChange(selectedReservation.id, selectedReservation.type, 'cancelled')}
                                        disabled={actionLoading}
                                        className="flex-1 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-700 font-semibold rounded-xl transition-all disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white border border-green-300 rounded-2xl w-full max-w-sm p-6 text-center">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-red-700">
                            <ReiconTrash className="w-4 h-4" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Reservation?</h3>
                        <p className="text-gray-500 mb-6">
                            Are you sure you want to delete reservation <span className="text-gray-900 font-medium">{deleteConfirm.reservation_reference}</span>? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 py-3 bg-green-50 hover:bg-green-50 text-gray-700 font-medium rounded-xl transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => deleteReservation(deleteConfirm.id, deleteConfirm.type)}
                                className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-gray-900 font-semibold rounded-xl transition-all"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {confirmAction && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white border border-green-300 rounded-2xl w-full max-w-sm p-6 text-center">
                        <div className={`w-16 h-16 ${confirmAction.status === 'confirmed' ? 'bg-green-400/10' : 'bg-red-500/10'} rounded-full flex items-center justify-center mx-auto mb-4 ${confirmAction.status === 'confirmed' ? 'text-green-800' : 'text-red-700'}`}>
                            {confirmAction.status === 'confirmed' ? <ReiconCheck className="w-4 h-4" /> : <ReiconX className="w-5 h-5" />}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            {confirmAction.status === 'confirmed' ? 'Confirm Reservation?' : 'Cancel Reservation?'}
                        </h3>
                        <p className="text-gray-500 mb-6">
                            {confirmAction.status === 'confirmed' 
                                ? 'Are you sure you want to confirm this reservation? The user will be notified.'
                                : 'Are you sure you want to cancel this reservation? The user will be notified.'
                            }
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmAction(null)}
                                className="flex-1 py-3 bg-green-50 hover:bg-green-50 text-gray-700 font-medium rounded-xl transition-all"
                            >
                                Go Back
                            </button>
                            <button
                                onClick={executeStatusChange}
                                disabled={actionLoading}
                                className={`flex-1 py-3 font-semibold rounded-xl transition-all disabled:opacity-50 ${confirmAction.status === 'confirmed' ? 'bg-gradient-to-r from-green-300 via-green-400 to-green-500 text-gray-900 hover:shadow-lg hover:shadow-green-400/25' : 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-gray-900'}`}
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

export default AdminReservations;