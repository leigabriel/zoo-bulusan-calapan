import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { userAPI } from '../../services/api-client';

const TicketHistory = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [sortBy, setSortBy] = useState('visitDate');
    const [sortOrder, setSortOrder] = useState('desc');
    const [selectedTicket, setSelectedTicket] = useState(null);

    useEffect(() => {
        fetchTicketHistory();
    }, []);

    const fetchTicketHistory = async () => {
        try {
            const response = await userAPI.getMyTickets();
            if (response.success) {
                // backend returns { success: true, tickets }
                const raw = response.tickets || response.data || [];
                const normalized = (raw || []).map(t => ({
                    id: t.id || t.ticket_id || t.ticketId,
                    ticketCode: t.ticketCode || t.booking_reference || t.ticket_code || t.bookingReference,
                    qrCode: t.qr_code || t.qrCode,
                    ticketType: t.ticketType || t.ticket_type || t.ticketType || t.ticket_type || t.ticketType,
                    visitDate: t.visitDate || t.visit_date || t.visitDate || t.visit_date,
                    quantity: t.quantity || t.qty || 1,
                    amount: t.totalAmount || t.total_amount || t.totalPrice || t.amount || 0,
                    purchasedAt: t.purchasedAt || t.created_at || t.createdAt || new Date().toISOString(),
                    status: t.status || 'active',
                    paymentMethod: t.payment_method || t.paymentMethod || 'cash',
                    paymentStatus: t.payment_status || t.paymentStatus || 'pending',
                    cancellationReason: t.cancellation_reason || t.cancellationReason || t.notes || null
                }));
                setTickets(normalized);
            }
        } catch (error) {
            console.error('Error fetching tickets:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredTickets = tickets
        .filter(ticket => {
            if (filter === 'all') return true;
            // Map 'active' filter to include both 'confirmed' and 'active' statuses
            if (filter === 'active') {
                return ticket.status === 'active' || ticket.status === 'confirmed';
            }
            return ticket.status === filter;
        })
        .sort((a, b) => {
            let valueA, valueB;
            
            switch (sortBy) {
                case 'visitDate':
                    valueA = new Date(a.visitDate).getTime();
                    valueB = new Date(b.visitDate).getTime();
                    break;
                case 'purchasedAt':
                    valueA = new Date(a.purchasedAt).getTime();
                    valueB = new Date(b.purchasedAt).getTime();
                    break;
                case 'amount':
                    valueA = a.amount || 0;
                    valueB = b.amount || 0;
                    break;
                case 'status':
                    valueA = a.status || '';
                    valueB = b.status || '';
                    break;
                default:
                    valueA = new Date(a.visitDate).getTime();
                    valueB = new Date(b.visitDate).getTime();
            }
            
            if (sortOrder === 'asc') {
                return valueA > valueB ? 1 : -1;
            } else {
                return valueA < valueB ? 1 : -1;
            }
        });

    const toggleSortOrder = () => {
        setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active':
            case 'confirmed': return 'bg-green-100 text-green-700';
            case 'used': return 'bg-gray-100 text-gray-700';
            case 'expired': return 'bg-red-100 text-red-700';
            case 'pending': return 'bg-yellow-100 text-yellow-700';
            case 'cancelled': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getPaymentStatusColor = (status) => {
        switch (status) {
            case 'paid': return 'bg-green-100 text-green-700';
            case 'pending': return 'bg-yellow-100 text-yellow-700';
            case 'refunded': return 'bg-blue-100 text-blue-700';
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
                    onClick={() => navigate('/', { state: { openSidePanel: true } })}
                    className="pointer-events-auto flex items-center gap-2 px-4 py-2.5 bg-white/90 backdrop-blur-sm text-gray-700 rounded-full shadow-lg hover:bg-white hover:shadow-xl transition-all duration-300 font-medium"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="hidden sm:inline">Back</span>
                </button>
                <Link
                    to="/"
                    className="pointer-events-auto flex items-center gap-2 px-4 py-2.5 bg-white/90 backdrop-blur-sm text-gray-700 rounded-full shadow-lg hover:bg-white hover:shadow-xl transition-all duration-300 font-medium"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <span className="hidden sm:inline">Home</span>
                </Link>
            </div>
            
            {/* Hero Section - matching other pages */}
            <section className="relative text-white py-20 pt-24 text-center bg-cover bg-center" style={{ backgroundImage: 'linear-gradient(135deg, rgba(16,185,129,0.92), rgba(20,184,166,0.92)), url(https://images.unsplash.com/photo-1564349683136-77e08dba1ef7)' }}>
                <div className="relative z-10">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Ticket History</h1>
                    <p className="text-lg max-w-xl mx-auto opacity-90 font-light">View your past and upcoming zoo visits</p>
                </div>
            </section>

            <div className="max-w-4xl mx-auto px-4 py-12 flex-grow">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                    <div className="flex flex-wrap gap-2">
                        {['all', 'active', 'used', 'expired'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-sm sm:text-base font-semibold capitalize transition-all transform hover:-translate-y-0.5 ${
                                    filter === f
                                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                                        : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                                }`}
                            >
                                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Sort Controls */}
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-4 py-2.5 bg-white border border-gray-200 rounded-full text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent cursor-pointer"
                        >
                            <option value="visitDate">Visit Date</option>
                            <option value="purchasedAt">Purchase Date</option>
                            <option value="amount">Amount</option>
                            <option value="status">Status</option>
                        </select>
                        <button
                            onClick={toggleSortOrder}
                            className="p-2.5 bg-white border border-gray-200 rounded-full text-gray-600 hover:bg-gray-50 transition-all"
                            title={sortOrder === 'asc' ? 'Oldest first' : 'Newest first'}
                        >
                            {sortOrder === 'asc' ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                                </svg>
                            )}
                        </button>
                        <Link
                            to="/tickets"
                            className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-full hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                        >
                            Buy New Ticket
                        </Link>
                    </div>
                </div>

                {filteredTickets.length > 0 ? (
                    <div className="space-y-4">
                        {filteredTickets.map(ticket => (
                            <div key={ticket.id} className="bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300">
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
                                                <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(ticket.status)}`}>
                                                    {ticket.status}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getPaymentStatusColor(ticket.paymentStatus)}`}>
                                                    {ticket.paymentStatus}
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
                                            <div className="col-span-2">
                                                <p className="text-gray-500">Payment Status</p>
                                                <p className={`font-medium capitalize ${ticket.paymentStatus === 'paid' ? 'text-green-600' : ticket.paymentStatus === 'pending' ? 'text-yellow-600' : 'text-gray-600'}`}>
                                                    {ticket.paymentStatus === 'pending' && (ticket.paymentMethod === 'cash' || !ticket.paymentMethod) 
                                                        ? 'Pending - Pay at the park entrance' 
                                                        : ticket.paymentStatus}
                                                </p>
                                            </div>
                                            {ticket.status === 'cancelled' && ticket.cancellationReason && (
                                                <div className="col-span-2 bg-red-50 border border-red-200 rounded-lg p-3">
                                                    <p className="text-red-700 text-sm font-medium">Cancellation Reason:</p>
                                                    <p className="text-red-600 text-sm">{ticket.cancellationReason}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 p-6 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-gray-100 min-w-[150px]">
                                        {ticket.qrCode ? (
                                            <>
                                                <div className="w-24 h-24 bg-white rounded-xl flex items-center justify-center mb-2 border border-gray-200 p-2">
                                                    <img 
                                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${ticket.qrCode}`}
                                                        alt="QR Code"
                                                        className="w-full h-full"
                                                    />
                                                </div>
                                                <button 
                                                    onClick={() => setSelectedTicket(ticket)}
                                                    className="text-emerald-600 text-sm font-medium hover:underline"
                                                >
                                                    View Full QR
                                                </button>
                                            </>
                                        ) : (
                                            <div className="w-24 h-24 bg-white rounded-xl flex items-center justify-center mb-2 border-2 border-dashed border-gray-200">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-gray-400">
                                                    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
                                                    <path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/>
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
                        <div className="flex justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-16 h-16 text-gray-300">
                                <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
                                <path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/>
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">No tickets found</h3>
                        <p className="text-gray-500 mb-6">
                            {filter === 'all' 
                                ? "You haven't purchased any tickets yet"
                                : `No ${filter} tickets found`}
                        </p>
                        <Link
                            to="/tickets"
                            className="inline-block px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium rounded-xl hover:shadow-lg transition"
                        >
                            Buy Your First Ticket
                        </Link>
                    </div>
                )}
            </div>

            {/* QR Code Modal */}
            {selectedTicket && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl max-w-sm w-full overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-gray-800">Your Ticket QR Code</h3>
                                <button
                                    onClick={() => setSelectedTicket(null)}
                                    className="text-gray-400 hover:text-gray-600 transition"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
                                        <line x1="18" y1="6" x2="6" y2="18"/>
                                        <line x1="6" y1="6" x2="18" y2="18"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className="p-8 flex flex-col items-center">
                            <div className="w-48 h-48 bg-white rounded-2xl flex items-center justify-center mb-4 border-2 border-emerald-200 p-2">
                                <img 
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${selectedTicket.qrCode}`}
                                    alt="QR Code"
                                    className="w-full h-full"
                                />
                            </div>
                            <p className="text-center text-gray-500 text-sm mb-4">
                                Show this QR code at the park entrance
                            </p>
                            <div className="w-full bg-gray-50 rounded-xl p-4 space-y-2">
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
                                        {new Date(selectedTicket.visitDate).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Quantity:</span>
                                    <span className="font-medium text-gray-800">{selectedTicket.quantity} person(s)</span>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100">
                            <button
                                onClick={() => setSelectedTicket(null)}
                                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:shadow-lg transition"
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

export default TicketHistory;
