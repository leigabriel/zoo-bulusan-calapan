import { useState, useEffect } from 'react';
import { staffAPI, getResidentIdImageUrl } from '../../services/api-client';

// Icons
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

const FilterIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
);

const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

const CheckCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
);

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const RefreshIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M23 4v6h-6" />
        <path d="M1 20v-6h6" />
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
);

const QRCodeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <rect x="14" y="14" width="4" height="4" />
    </svg>
);

const StaffTickets = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [paymentFilter, setPaymentFilter] = useState('all');
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancellationReason, setCancellationReason] = useState('');
    const [updating, setUpdating] = useState(false);
    
    // Confirmation modal states
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);
    const [confirmMessage, setConfirmMessage] = useState('');
    const [confirmTitle, setConfirmTitle] = useState('');
    
    // Image preview modal state
    const [showImageModal, setShowImageModal] = useState(false);
    const [previewImageUrl, setPreviewImageUrl] = useState('');

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const res = await staffAPI.getTickets();
            if (res.success && res.tickets) {
                // Normalize ticket data from backend
                const normalizedTickets = res.tickets.map(t => ({
                    ...t,
                    id: t.id,
                    code: t.booking_reference || t.code,
                    qrCode: t.qr_code,
                    type: t.ticket_type || t.type,
                    purchasedBy: t.user_name || t.visitor_name || t.purchasedBy || `User #${t.user_id}`,
                    email: t.user_email || t.visitor_email || t.email,
                    price: t.total_amount || t.price,
                    purchaseDate: t.created_at,
                    visitDate: t.visit_date,
                    status: t.status,
                    paymentStatus: t.payment_status || 'pending',
                    paymentMethod: t.payment_method || 'cash',
                    quantity: t.quantity || 1,
                    notes: t.notes,
                    residentIdImage: t.resident_id_image,
                    verificationStatus: t.verification_status || 'pending'
                }));
                setTickets(normalizedTickets);
            }
        } catch (err) {
            console.error('Error fetching tickets:', err);
            setError('Failed to load tickets');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            case 'confirmed': return 'bg-[#8cff65]/20 text-[#8cff65] border-[#8cff65]/30';
            case 'used': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'expired': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
            case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };

    const getPaymentBadge = (paymentStatus) => {
        switch (paymentStatus?.toLowerCase()) {
            case 'paid': return 'bg-[#8cff65]/20 text-[#8cff65] border-[#8cff65]/30';
            case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            case 'not paid': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
            case 'free': return 'bg-teal-500/20 text-teal-400 border-teal-500/30';
            case 'refunded': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };

    const updateTicketStatus = async (ticketId, newStatus, reason = null) => {
        try {
            setUpdating(true);
            const payload = { status: newStatus };
            if (reason) payload.cancellationReason = reason;

            const res = await staffAPI.updateTicketStatus(ticketId, payload);
            if (res.success) {
                setTickets(tickets.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));
                if (selectedTicket?.id === ticketId) {
                    setSelectedTicket({ ...selectedTicket, status: newStatus });
                }
                setShowCancelModal(false);
                setCancellationReason('');
            }
        } catch (err) {
            console.error('Error updating ticket:', err);
            alert('Failed to update ticket status');
        } finally {
            setUpdating(false);
        }
    };

    // Confirmation dialog helper
    const showConfirmation = (title, message, action) => {
        setConfirmTitle(title);
        setConfirmMessage(message);
        setConfirmAction(() => action);
        setShowConfirmModal(true);
    };

    const handleConfirmAction = async () => {
        if (confirmAction) {
            await confirmAction();
        }
        setShowConfirmModal(false);
        setConfirmAction(null);
    };

    // Mark ticket as paid
    const handleMarkAsPaid = async (ticketId) => {
        showConfirmation(
            'Mark as Paid',
            'Are you sure you want to mark this ticket as paid?',
            async () => {
                try {
                    setUpdating(true);
                    const res = await staffAPI.markTicketAsPaid(ticketId);
                    if (res.success) {
                        setTickets(tickets.map(t => t.id === ticketId ? { ...t, payment_status: 'paid', paymentStatus: 'paid' } : t));
                        if (selectedTicket?.id === ticketId) {
                            setSelectedTicket({ ...selectedTicket, payment_status: 'paid', paymentStatus: 'paid' });
                        }
                    }
                } catch (err) {
                    console.error(err);
                    alert('Failed to mark ticket as paid');
                } finally {
                    setUpdating(false);
                }
            }
        );
    };

    // Update verification status
    const handleUpdateVerificationStatus = async (ticketId, status) => {
        const actionText = status === 'approved' ? 'approve' : 'reject';
        showConfirmation(
            `${status === 'approved' ? 'Approve' : 'Reject'} Verification`,
            `Are you sure you want to ${actionText} this resident ID verification?`,
            async () => {
                try {
                    setUpdating(true);
                    const res = await staffAPI.updateVerificationStatus(ticketId, status);
                    if (res.success) {
                        setTickets(tickets.map(t => t.id === ticketId ? { ...t, verification_status: status, verificationStatus: status } : t));
                        if (selectedTicket?.id === ticketId) {
                            setSelectedTicket({ ...selectedTicket, verification_status: status, verificationStatus: status });
                        }
                    }
                } catch (err) {
                    console.error(err);
                    alert('Failed to update verification status');
                } finally {
                    setUpdating(false);
                }
            }
        );
    };

    // Status change with confirmation
    const handleStatusChange = (ticketId, newStatus) => {
        const statusMessages = {
            'confirmed': 'confirm this ticket',
            'used': 'mark this ticket as used',
            'expired': 'mark this ticket as expired'
        };
        
        showConfirmation(
            `${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)} Ticket`,
            `Are you sure you want to ${statusMessages[newStatus] || `change status to ${newStatus}`}?`,
            () => updateTicketStatus(ticketId, newStatus)
        );
    };

    const filteredTickets = tickets.filter(ticket => {
        const matchesSearch =
            ticket.booking_reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ticket.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ticket.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ticket.visitor_email?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
        const matchesPayment = paymentFilter === 'all' || ticket.payment_status === paymentFilter;
        return matchesSearch && matchesStatus && matchesPayment;
    });

    const ticketStats = {
        total: tickets.length,
        pending: tickets.filter(t => t.status === 'pending').length,
        confirmed: tickets.filter(t => t.status === 'confirmed').length,
        used: tickets.filter(t => t.status === 'used').length,
        cancelled: tickets.filter(t => t.status === 'cancelled').length,
    };

    const openTicketDetails = (ticket) => {
        setSelectedTicket(ticket);
        setShowModal(true);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatCurrency = (amount) => {
        return `₱${parseFloat(amount || 0).toFixed(2)}`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-[#8cff65] border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-400">Loading tickets...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
                {error}
                <button onClick={fetchTickets} className="ml-4 underline hover:no-underline">
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Total</p>
                            <p className="text-2xl font-bold text-white">{ticketStats.total}</p>
                        </div>
                        <div className="w-10 h-10 bg-[#8cff65]/10 rounded-xl flex items-center justify-center text-[#8cff65]">
                            <TicketIcon />
                        </div>
                    </div>
                </div>
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4">
                    <p className="text-gray-400 text-sm">Pending</p>
                    <p className="text-2xl font-bold text-yellow-400">{ticketStats.pending}</p>
                </div>
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4">
                    <p className="text-gray-400 text-sm">Confirmed</p>
                    <p className="text-2xl font-bold text-[#8cff65]">{ticketStats.confirmed}</p>
                </div>
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4">
                    <p className="text-gray-400 text-sm">Used</p>
                    <p className="text-2xl font-bold text-blue-400">{ticketStats.used}</p>
                </div>
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4">
                    <p className="text-gray-400 text-sm">Cancelled</p>
                    <p className="text-2xl font-bold text-red-400">{ticketStats.cancelled}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4">
                <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex items-center bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl px-4 py-2 flex-1 min-w-[200px]">
                        <SearchIcon />
                        <input
                            type="text"
                            placeholder="Search by code, name, or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="ml-2 bg-transparent border-none outline-none text-white placeholder-gray-500 w-full"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl px-4 py-2 text-white outline-none"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="used">Used</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="expired">Expired</option>
                    </select>
                    <select
                        value={paymentFilter}
                        onChange={(e) => setPaymentFilter(e.target.value)}
                        className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl px-4 py-2 text-white outline-none"
                    >
                        <option value="all">All Payments</option>
                        <option value="pending">Payment Pending</option>
                        <option value="paid">Paid</option>
                        <option value="refunded">Refunded</option>
                    </select>
                    <button
                        onClick={fetchTickets}
                        className="flex items-center gap-2 px-4 py-2 bg-[#8cff65]/10 border border-[#8cff65]/30 rounded-xl text-[#8cff65] hover:bg-[#8cff65]/20 transition"
                    >
                        <RefreshIcon />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Tickets Table */}
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#0f0f0f] border-b border-[#2a2a2a]">
                            <tr>
                                <th className="text-left p-4 text-gray-400 font-medium">Booking Ref</th>
                                <th className="text-left p-4 text-gray-400 font-medium">Visitor</th>
                                <th className="text-left p-4 text-gray-400 font-medium">Type</th>
                                <th className="text-left p-4 text-gray-400 font-medium">Visit Date</th>
                                <th className="text-left p-4 text-gray-400 font-medium">Amount</th>
                                <th className="text-left p-4 text-gray-400 font-medium">Payment</th>
                                <th className="text-left p-4 text-gray-400 font-medium">Status</th>
                                <th className="text-left p-4 text-gray-400 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTickets.length > 0 ? (
                                filteredTickets.map(ticket => (
                                    <tr key={ticket.id} className="border-b border-[#2a2a2a] hover:bg-white/5">
                                        <td className="p-4">
                                            <span className="font-mono text-[#8cff65]">{ticket.booking_reference}</span>
                                        </td>
                                        <td className="p-4">
                                            <div>
                                                <p className="text-white font-medium">{ticket.user_name || ticket.visitor_name || '-'}</p>
                                                <p className="text-gray-500 text-sm">{ticket.user_email || ticket.visitor_email || '-'}</p>
                                            </div>
                                        </td>
                                        <td className="p-4 text-white capitalize">{ticket.ticket_type}</td>
                                        <td className="p-4 text-gray-300">{formatDate(ticket.visit_date)}</td>
                                        <td className="p-4 text-white font-medium">
                                            {ticket.total_amount === 0 ? (
                                                <span className="text-[#8cff65]">FREE</span>
                                            ) : (
                                                formatCurrency(ticket.total_amount)
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-white capitalize text-sm">{ticket.payment_method || 'cash'}</span>
                                                <span className={`w-fit px-2 py-0.5 rounded-lg text-xs font-medium border ${getPaymentBadge(ticket.payment_status)}`}>
                                                    {ticket.payment_status || 'pending'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${getStatusBadge(ticket.status)}`}>
                                                {ticket.status}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => openTicketDetails(ticket)}
                                                    className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition"
                                                    title="View Details"
                                                >
                                                    <EyeIcon />
                                                </button>
                                                {(ticket.payment_status === 'pending' || ticket.payment_status === 'not_paid' || ticket.payment_status === 'not paid') && (
                                                    <button
                                                        onClick={() => handleMarkAsPaid(ticket.id)}
                                                        className="p-2 hover:bg-teal-500/10 rounded-lg text-teal-400 transition"
                                                        title="Mark as Paid"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                                            <line x1="12" y1="1" x2="12" y2="23" />
                                                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                                        </svg>
                                                    </button>
                                                )}
                                                {ticket.status === 'pending' && (
                                                    <button
                                                        onClick={() => handleStatusChange(ticket.id, 'confirmed')}
                                                        className="p-2 hover:bg-[#8cff65]/10 rounded-lg text-[#8cff65] transition"
                                                        title="Confirm Ticket"
                                                    >
                                                        <CheckCircleIcon />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8" className="p-8 text-center text-gray-500">
                                        No tickets found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Ticket Detail Modal */}
            {showModal && selectedTicket && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-[#2a2a2a] flex items-center justify-between">
                            <h3 className="text-xl font-bold text-white">Ticket Details</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                                <CloseIcon />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-center justify-center mb-6">
                                <div className="p-4 bg-[#0a0a0a] rounded-xl border border-[#2a2a2a]">
                                    <div className="w-32 h-32 bg-white rounded-lg flex items-center justify-center">
                                        <QRCodeIcon className="w-16 h-16 text-gray-400" />
                                    </div>
                                    <p className="text-center text-[#8cff65] font-mono mt-2 text-sm">
                                        {selectedTicket.qr_code || selectedTicket.booking_reference}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-gray-400 text-sm">Booking Reference</p>
                                    <p className="text-white font-mono">{selectedTicket.booking_reference}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm">Ticket Type</p>
                                    <p className="text-white capitalize">{selectedTicket.ticket_type}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm">Visitor Name</p>
                                    <p className="text-white">{selectedTicket.user_name || selectedTicket.visitor_name || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm">Email</p>
                                    <p className="text-white">{selectedTicket.user_email || selectedTicket.visitor_email || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm">Visit Date</p>
                                    <p className="text-white">{formatDate(selectedTicket.visit_date)}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm">Quantity</p>
                                    <p className="text-white">{selectedTicket.quantity}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm">Total Amount</p>
                                    <p className="text-white font-bold">
                                        {selectedTicket.total_amount === 0 ? 'FREE' : formatCurrency(selectedTicket.total_amount)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm">Payment Method</p>
                                    <p className="text-white capitalize">{selectedTicket.payment_method || 'cash'}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm">Payment Status</p>
                                    <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${getPaymentBadge(selectedTicket.payment_status)}`}>
                                        {selectedTicket.payment_status || 'pending'}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm">Ticket Status</p>
                                    <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${getStatusBadge(selectedTicket.status)}`}>
                                        {selectedTicket.status}
                                    </span>
                                </div>
                            </div>

                            {/* Resident ID Verification Section */}
                            {selectedTicket.type?.toLowerCase() === 'resident' && (
                                <div className="p-4 bg-teal-500/10 border border-teal-500/30 rounded-xl space-y-3">
                                    <h4 className="text-sm font-semibold text-teal-400 uppercase tracking-wider flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                                            <rect x="3" y="4" width="18" height="16" rx="2" />
                                            <circle cx="9" cy="10" r="2" />
                                            <path d="M15 8h2" />
                                            <path d="M15 12h2" />
                                            <path d="M7 16h10" />
                                        </svg>
                                        Resident ID Verification Required
                                    </h4>
                                    {selectedTicket.residentIdImage ? (
                                        <div className="space-y-3">
                                            <div className="bg-white rounded-xl p-2 max-h-48 overflow-hidden">
                                                <img 
                                                    src={getResidentIdImageUrl(selectedTicket.residentIdImage)} 
                                                    alt="Resident ID" 
                                                    className="w-full h-full object-contain rounded-lg cursor-pointer hover:opacity-80"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setPreviewImageUrl(getResidentIdImageUrl(selectedTicket.residentIdImage));
                                                        setShowImageModal(true);
                                                    }}
                                                />
                                            </div>
                                            <p className="text-xs text-teal-400">Click image to view in full size</p>
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="text-gray-400">Verification Status:</span>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                                                    selectedTicket.verificationStatus === 'approved' 
                                                        ? 'bg-[#8cff65]/20 text-[#8cff65] border-[#8cff65]/30' 
                                                        : selectedTicket.verificationStatus === 'rejected'
                                                            ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                                            : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                                                }`}>
                                                    {selectedTicket.verificationStatus || 'Pending'}
                                                </span>
                                            </div>
                                            {/* Verification Actions */}
                                            {selectedTicket.verificationStatus !== 'approved' && selectedTicket.verificationStatus !== 'rejected' && (
                                                <div className="flex gap-2 pt-2">
                                                    <button
                                                        onClick={() => handleUpdateVerificationStatus(selectedTicket.id, 'approved')}
                                                        disabled={updating}
                                                        className="flex-1 py-2 bg-[#8cff65]/20 border border-[#8cff65]/30 text-[#8cff65] text-sm font-medium rounded-lg hover:bg-[#8cff65]/30 transition disabled:opacity-50"
                                                    >
                                                        Approve ID
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdateVerificationStatus(selectedTicket.id, 'rejected')}
                                                        disabled={updating}
                                                        className="flex-1 py-2 bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-medium rounded-lg hover:bg-red-500/30 transition disabled:opacity-50"
                                                    >
                                                        Reject ID
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="p-4 bg-[#1e1e1e] rounded-xl text-center">
                                            <p className="text-yellow-400 text-sm">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 inline mr-2">
                                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                                    <line x1="12" y1="9" x2="12" y2="13" />
                                                    <line x1="12" y1="17" x2="12.01" y2="17" />
                                                </svg>
                                                No ID image uploaded. Please contact the visitor to submit their ID.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Mark as Paid Button */}
                            {(selectedTicket.payment_status === 'pending' || selectedTicket.payment_status === 'not_paid' || selectedTicket.payment_status === 'not paid') && (
                                <button
                                    onClick={() => handleMarkAsPaid(selectedTicket.id)}
                                    disabled={updating}
                                    className="w-full py-3 bg-teal-500/20 border border-teal-500/30 text-teal-400 font-semibold rounded-xl hover:bg-teal-500/30 transition disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                                        <line x1="12" y1="1" x2="12" y2="23" />
                                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                    </svg>
                                    Mark as Paid
                                </button>
                            )}

                            {/* Status Update Actions */}
                            <div className="pt-4 border-t border-[#2a2a2a] space-y-3">
                                <p className="text-gray-400 text-sm font-medium">Update Status</p>
                                <div className="flex flex-wrap gap-2">
                                    {selectedTicket.status !== 'confirmed' && selectedTicket.status !== 'used' && selectedTicket.status !== 'cancelled' && (
                                        <button
                                            onClick={() => handleStatusChange(selectedTicket.id, 'confirmed')}
                                            disabled={updating}
                                            className="px-4 py-2 bg-[#8cff65]/20 border border-[#8cff65]/30 rounded-xl text-[#8cff65] hover:bg-[#8cff65]/30 transition disabled:opacity-50"
                                        >
                                            Confirm
                                        </button>
                                    )}
                                    {selectedTicket.status !== 'cancelled' && selectedTicket.status !== 'used' && (
                                        <button
                                            onClick={() => setShowCancelModal(true)}
                                            disabled={updating}
                                            className="px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 hover:bg-red-500/30 transition disabled:opacity-50"
                                        >
                                            Cancel Ticket
                                        </button>
                                    )}
                                    {selectedTicket.status !== 'expired' && selectedTicket.status !== 'cancelled' && selectedTicket.status !== 'used' && (
                                        <button
                                            onClick={() => handleStatusChange(selectedTicket.id, 'expired')}
                                            disabled={updating}
                                            className="px-4 py-2 bg-gray-500/20 border border-gray-500/30 rounded-xl text-gray-400 hover:bg-gray-500/30 transition disabled:opacity-50"
                                        >
                                            Mark Expired
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel Modal */}
            {showCancelModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl w-full max-w-md">
                        <div className="p-6 border-b border-[#2a2a2a]">
                            <h3 className="text-xl font-bold text-white">Cancel Ticket</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-gray-400">Please provide a reason for cancellation:</p>
                            <textarea
                                value={cancellationReason}
                                onChange={(e) => setCancellationReason(e.target.value)}
                                placeholder="Enter cancellation reason..."
                                className="w-full p-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-white placeholder-gray-500 outline-none resize-none"
                                rows={3}
                            />
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => {
                                        setShowCancelModal(false);
                                        setCancellationReason('');
                                    }}
                                    className="px-4 py-2 border border-[#2a2a2a] rounded-xl text-gray-400 hover:bg-white/5 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => updateTicketStatus(selectedTicket.id, 'cancelled', cancellationReason)}
                                    disabled={!cancellationReason.trim() || updating}
                                    className="px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 hover:bg-red-500/30 transition disabled:opacity-50"
                                >
                                    {updating ? 'Cancelling...' : 'Confirm Cancellation'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
                    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl w-full max-w-md">
                        <div className="p-6 border-b border-[#2a2a2a]">
                            <h3 className="text-xl font-bold text-white">{confirmTitle}</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-gray-300">{confirmMessage}</p>
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => {
                                        setShowConfirmModal(false);
                                        setConfirmAction(null);
                                    }}
                                    className="px-4 py-2 border border-[#2a2a2a] rounded-xl text-gray-400 hover:bg-white/5 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmAction}
                                    disabled={updating}
                                    className="px-4 py-2 bg-[#8cff65]/20 border border-[#8cff65]/30 rounded-xl text-[#8cff65] hover:bg-[#8cff65]/30 transition disabled:opacity-50"
                                >
                                    {updating ? 'Processing...' : 'Confirm'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Image Preview Modal */}
            {showImageModal && previewImageUrl && (
                <div 
                    className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
                    onClick={() => setShowImageModal(false)}
                >
                    <div 
                        className="relative max-w-4xl max-h-[90vh] w-full"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setShowImageModal(false)}
                            className="absolute -top-12 right-0 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all"
                        >
                            <CloseIcon />
                        </button>
                        <img 
                            src={previewImageUrl} 
                            alt="Resident ID Preview" 
                            className="w-full h-full object-contain rounded-xl"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffTickets;