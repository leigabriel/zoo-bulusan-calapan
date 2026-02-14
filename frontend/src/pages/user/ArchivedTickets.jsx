import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { userAPI } from '../../services/api-client';

const ArchivedTickets = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [unarchiving, setUnarchiving] = useState(false);

    useEffect(() => {
        fetchArchivedTickets();
    }, []);

    const fetchArchivedTickets = async () => {
        try {
            const response = await userAPI.getArchivedTickets();
            if (response.success) {
                const raw = response.tickets || response.data || [];
                const normalized = (raw || []).map(t => ({
                    id: t.id || t.ticket_id || t.ticketId,
                    ticketCode: t.ticketCode || t.booking_reference || t.ticket_code || t.bookingReference,
                    qrCode: t.qr_code || t.qrCode,
                    ticketType: t.ticketType || t.ticket_type,
                    visitDate: t.visitDate || t.visit_date,
                    quantity: t.quantity || t.qty || 1,
                    amount: t.totalAmount || t.total_amount || t.totalPrice || t.amount || 0,
                    purchasedAt: t.purchasedAt || t.created_at || t.createdAt || new Date().toISOString(),
                    status: t.status || 'archived',
                    paymentMethod: t.payment_method || t.paymentMethod || 'cash',
                    paymentStatus: t.payment_status || t.paymentStatus || 'pending',
                    archivedAt: t.archived_at || t.archivedAt
                }));
                setTickets(normalized);
            }
        } catch (error) {
            console.error('Error fetching archived tickets:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUnarchive = async (ticketId) => {
        setUnarchiving(true);
        try {
            const response = await userAPI.unarchiveTicket(ticketId);
            if (response.success) {
                // Remove from list
                setTickets(prev => prev.filter(t => t.id !== ticketId));
                setSelectedTicket(null);
            }
        } catch (error) {
            console.error('Error unarchiving ticket:', error);
            alert('Failed to unarchive ticket. Please try again.');
        } finally {
            setUnarchiving(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active':
            case 'confirmed': return 'bg-green-100 text-green-700';
            case 'used': return 'bg-gray-100 text-gray-700';
            case 'expired': return 'bg-red-100 text-red-700';
            case 'pending': return 'bg-yellow-100 text-yellow-700';
            case 'cancelled': return 'bg-red-100 text-red-700';
            case 'archived': return 'bg-blue-100 text-blue-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getPaymentMethodLabel = (method) => {
        switch (method?.toLowerCase()) {
            case 'gcash': return 'GCash';
            case 'paypal': return 'PayPal';
            case 'cash':
            case 'pay_at_park': return 'Pay at Bulusan Park';
            case 'card': return 'Credit/Debit Card';
            case 'online': return 'Online Payment';
            case 'free': return 'Free Entry';
            default: return method || 'Pay at Bulusan Park';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Floating Navigation */}
            <div className="fixed top-4 left-4 right-4 z-50 flex justify-between items-center pointer-events-none">
                <button
                    onClick={() => navigate(-1)}
                    className="pointer-events-auto flex items-center gap-2 px-4 py-2.5 bg-white/90 backdrop-blur-sm text-gray-700 rounded-full shadow-lg hover:bg-white hover:shadow-xl transition-all duration-300 font-medium"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="hidden sm:inline">Back</span>
                </button>
                {/* <Link
                    to="/"
                    className="pointer-events-auto flex items-center gap-2 px-4 py-2.5 bg-white/90 backdrop-blur-sm text-gray-700 rounded-full shadow-lg hover:bg-white hover:shadow-xl transition-all duration-300 font-medium"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <span className="hidden sm:inline">Home</span>
                </Link> */}
            </div>

            {/* Hero Section */}
            <section className="relative text-white py-20 pt-24 text-center bg-cover bg-center" style={{ backgroundImage: 'linear-gradient(135deg, rgba(107,114,128,0.92), rgba(75,85,99,0.92)), url(https://images.unsplash.com/photo-1564349683136-77e08dba1ef7)' }}>
                <div className="relative z-10">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Archived Tickets</h1>
                    <p className="text-lg max-w-xl mx-auto opacity-90 font-light">Your past ticket history stored for reference</p>
                </div>
            </section>

            <div className="max-w-4xl mx-auto px-4 py-12 flex-grow">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                    <p className="text-gray-600">
                        {tickets.length} archived ticket{tickets.length !== 1 ? 's' : ''}
                    </p>
                    <div className="flex gap-2">
                        <Link
                            to="/ticket-history"
                            className="px-6 py-2.5 bg-white text-gray-600 border border-gray-200 font-semibold rounded-full hover:bg-gray-50 transition-all"
                        >
                            View Active Tickets
                        </Link>
                        <Link
                            to="/tickets"
                            className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-full hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                        >
                            Buy New Ticket
                        </Link>
                    </div>
                </div>

                {tickets.length > 0 ? (
                    <div className="space-y-4">
                        {tickets.map(ticket => (
                            <div key={ticket.id} className="bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300 opacity-75 hover:opacity-100">
                                <div className="flex flex-col md:flex-row">
                                    <div className="p-6 flex-1">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h3 className="font-bold text-gray-800 text-lg capitalize">
                                                    {ticket.ticketType} Ticket
                                                </h3>
                                                <p className="text-sm text-gray-500 font-mono">
                                                    #{ticket.ticketCode}
                                                </p>
                                            </div>
                                            <div className="flex flex-col gap-1 items-end">
                                                <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600 flex items-center gap-1">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                                        <polyline points="21 8 21 21 3 21 3 8" />
                                                        <rect x="1" y="3" width="22" height="5" />
                                                        <line x1="10" y1="12" x2="14" y2="12" />
                                                    </svg>
                                                    Archived
                                                </span>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(ticket.status === 'archived' ? ticket.status : ticket.status)}`}>
                                                    Originally: {ticket.status === 'archived' ? 'used' : ticket.status}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="text-gray-500">Visit Date</p>
                                                <p className="font-medium text-gray-800">
                                                    {new Date(ticket.visitDate).toLocaleDateString('en-US', {
                                                        weekday: 'long',
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Quantity</p>
                                                <p className="font-medium text-gray-800">{ticket.quantity} person(s)</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Amount</p>
                                                <p className="font-medium text-emerald-600">
                                                    {ticket.amount === 0 ? 'FREE' : `₱${ticket.amount}`}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Payment Method</p>
                                                <p className="font-medium text-gray-800">{getPaymentMethodLabel(ticket.paymentMethod)}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 p-6 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-gray-100 min-w-[150px]">
                                        <button
                                            onClick={() => setSelectedTicket(ticket)}
                                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-300 transition flex items-center gap-2"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                <circle cx="12" cy="12" r="3" />
                                            </svg>
                                            View Details
                                        </button>
                                        <button
                                            onClick={() => handleUnarchive(ticket.id)}
                                            className="mt-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl text-sm font-medium hover:bg-emerald-200 transition flex items-center gap-2"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                                <polyline points="9 10 4 15 9 20" />
                                                <path d="M20 4v7a4 4 0 0 1-4 4H4" />
                                            </svg>
                                            Restore
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
                        <div className="flex justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-16 h-16 text-gray-300">
                                <polyline points="21 8 21 21 3 21 3 8" />
                                <rect x="1" y="3" width="22" height="5" />
                                <line x1="10" y1="12" x2="14" y2="12" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">No archived tickets</h3>
                        <p className="text-gray-500 mb-6">
                            You haven't archived any tickets yet. Archived tickets will appear here.
                        </p>
                        <Link
                            to="/ticket-history"
                            className="inline-block px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium rounded-xl hover:shadow-lg transition"
                        >
                            View Your Tickets
                        </Link>
                    </div>
                )}
            </div>

            {/* Ticket Detail Modal */}
            {selectedTicket && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-gray-800">Archived Ticket Details</h3>
                                <button
                                    onClick={() => setSelectedTicket(null)}
                                    className="text-gray-400 hover:text-gray-600 transition"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="w-full bg-gray-50 rounded-xl p-4 space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Booking Ref:</span>
                                    <span className="font-mono font-medium text-gray-800">{selectedTicket.ticketCode}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Type:</span>
                                    <span className="font-medium text-gray-800 capitalize">{selectedTicket.ticketType}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Visit Date:</span>
                                    <span className="font-medium text-gray-800">
                                        {new Date(selectedTicket.visitDate).toLocaleDateString('en-US', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Quantity:</span>
                                    <span className="font-medium text-gray-800">{selectedTicket.quantity} person(s)</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Amount:</span>
                                    <span className="font-medium text-emerald-600">
                                        {selectedTicket.amount === 0 ? 'FREE' : `₱${selectedTicket.amount}`}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Payment:</span>
                                    <span className="font-medium text-gray-800">{getPaymentMethodLabel(selectedTicket.paymentMethod)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Purchased:</span>
                                    <span className="font-medium text-gray-800">
                                        {new Date(selectedTicket.purchasedAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 flex gap-3">
                            <button
                                onClick={() => handleUnarchive(selectedTicket.id)}
                                disabled={unarchiving}
                                className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-70"
                            >
                                {unarchiving ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Restoring...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                                            <polyline points="9 10 4 15 9 20" />
                                            <path d="M20 4v7a4 4 0 0 1-4 4H4" />
                                        </svg>
                                        <span>Restore to Active</span>
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => setSelectedTicket(null)}
                                className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ArchivedTickets;
