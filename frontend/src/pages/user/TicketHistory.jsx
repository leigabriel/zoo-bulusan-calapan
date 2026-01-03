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
                    ticketType: t.ticketType || t.ticket_type || t.ticketType || t.ticket_type || t.ticketType,
                    visitDate: t.visitDate || t.visit_date || t.visitDate || t.visit_date,
                    quantity: t.quantity || t.qty || 1,
                    amount: t.totalAmount || t.total_amount || t.totalPrice || t.amount || 0,
                    purchasedAt: t.purchasedAt || t.created_at || t.createdAt || new Date().toISOString(),
                    status: t.status || 'active'
                }));
                setTickets(normalized);
            }
        } catch (error) {
            console.error('Error fetching tickets:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredTickets = tickets.filter(ticket => {
        if (filter === 'all') return true;
        return ticket.status === filter;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-700';
            case 'used': return 'bg-gray-100 text-gray-700';
            case 'expired': return 'bg-red-100 text-red-700';
            case 'pending': return 'bg-yellow-100 text-yellow-700';
            default: return 'bg-gray-100 text-gray-700';
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
                    <Link
                        to="/tickets"
                        className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-full hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                    >
                        Buy New Ticket
                    </Link>
                </div>

                {filteredTickets.length > 0 ? (
                    <div className="space-y-4">
                        {filteredTickets.map(ticket => (
                            <div key={ticket.id} className="bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300">
                                <div className="flex flex-col md:flex-row">
                                    <div className="p-6 flex-1">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h3 className="font-bold text-gray-800 text-lg">
                                                    {ticket.ticketType} Ticket
                                                </h3>
                                                <p className="text-sm text-gray-500 font-mono">
                                                    #{ticket.ticketCode}
                                                </p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(ticket.status)}`}>
                                                {ticket.status}
                                            </span>
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
                                                <p className="text-gray-500">Amount Paid</p>
                                                <p className="font-medium text-emerald-600">₱{ticket.amount}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Purchased</p>
                                                <p className="font-medium text-gray-800">
                                                    {new Date(ticket.purchasedAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 p-6 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-gray-100 min-w-[150px]">
                                        <div className="w-24 h-24 bg-white rounded-xl flex items-center justify-center mb-2 border-2 border-dashed border-gray-200">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-gray-400">
                                                <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
                                                <path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/>
                                            </svg>
                                        </div>
                                        {ticket.status === 'active' && (
                                            <button className="text-emerald-600 text-sm font-medium hover:underline">
                                                View QR Code
                                            </button>
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
        </div>
    );
};

export default TicketHistory;
