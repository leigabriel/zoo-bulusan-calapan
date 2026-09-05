import { AlertTriangle as ReiconAlertTriangle, Calendar as ReiconCalendar, CheckCircle as ReiconCheckCircle, Clock as ReiconClock, DollarSign as ReiconDollarSign, Download as ReiconDownload, Eye as ReiconEye, Filter as ReiconFilter, Qr as ReiconQr, Refresh as ReiconRefresh, Search as ReiconSearch, Ticket as ReiconTicket, UserId as ReiconUserId, X as ReiconX } from 'reicon-react';
import { useState, useEffect } from 'react';
import { adminAPI, getResidentIdImageUrl } from '../../services/api-client';
import { notify } from '../../utils/toast';


const AdminTickets = ({ globalSearch = '' }) => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('');
    const [paymentFilter, setPaymentFilter] = useState('all');
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    
    // New states for confirmation dialogs
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);
    const [confirmMessage, setConfirmMessage] = useState('');
    const [confirmTitle, setConfirmTitle] = useState('');
    const [exportLoading, setExportLoading] = useState(false);
    
    // Image preview modal state
    const [showImageModal, setShowImageModal] = useState(false);
    const [previewImageUrl, setPreviewImageUrl] = useState('');

    const events = ['All Events', 'Night Safari Experience', 'Animal Feeding Tour', 'General Admission', 'Wildlife Photography Day', 'Conservation Workshop'];

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const res = await adminAPI.getTickets();
            if (res.success && res.tickets) {
                // Normalize ticket data
                const normalizedTickets = res.tickets.map(t => ({
                    id: t.id,
                    code: t.booking_reference || t.code,
                    qrCode: t.qr_code,
                    type: t.ticket_type || t.type,
                    purchasedBy: t.visitor_name || t.purchasedBy || `User #${t.user_id}`,
                    email: t.visitor_email || t.email,
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
            console.error(err);
            setError('Failed to load tickets');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status?.toLowerCase()) {
            case 'confirmed':
            case 'active': return 'bg-green-400/20 text-green-800 border-green-400/30';
            case 'pending': return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30';
            case 'used': return 'bg-blue-500/20 text-blue-700 border-blue-500/30';
            case 'expired': return 'bg-gray-500/20 text-gray-500 border-gray-500/30';
            case 'cancelled': return 'bg-red-500/20 text-red-700 border-red-500/30';
            default: return 'bg-gray-500/20 text-gray-500 border-gray-500/30';
        }
    };

    const getPaymentBadge = (status) => {
        switch (status?.toLowerCase()) {
            case 'paid': return 'bg-green-400/20 text-green-800 border-green-400/30';
            case 'pending': return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30';
            case 'not paid': return 'bg-orange-500/20 text-orange-700 border-orange-500/30';
            case 'free': return 'bg-green-400/20 text-green-800 border-green-400/30';
            case 'refunded': return 'bg-blue-500/20 text-blue-700 border-blue-500/30';
            default: return 'bg-gray-500/20 text-gray-500 border-gray-500/30';
        }
    };

    const updateTicketStatus = async (ticketId, newStatus, reason = null) => {
        try {
            setActionLoading(true);
            const statusData = { status: newStatus };
            if (reason) statusData.cancellationReason = reason;

            const res = await adminAPI.updateTicketStatus(ticketId, statusData);
            if (res.success) {
                // Update locally
                setTickets(tickets.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));
                if (selectedTicket?.id === ticketId) {
                    setSelectedTicket({ ...selectedTicket, status: newStatus });
                }
                notify.success(`Ticket ${newStatus}.`);
                setShowCancelModal(false);
                setCancelReason('');
            }
        } catch (err) {
            console.error(err);
            notify.error(err.message || "Couldn't update ticket status. Please try again.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancelTicket = () => {
        if (selectedTicket) {
            updateTicketStatus(selectedTicket.id, 'cancelled', cancelReason);
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
            'Are you sure you want to mark this ticket as paid? This action will update the payment status.',
            async () => {
                try {
                    setActionLoading(true);
                    const res = await adminAPI.markTicketAsPaid(ticketId);
                    if (res.success) {
                        setTickets(tickets.map(t => t.id === ticketId ? { ...t, paymentStatus: 'paid' } : t));
                        if (selectedTicket?.id === ticketId) {
                            setSelectedTicket({ ...selectedTicket, paymentStatus: 'paid' });
                        }
                        notify.success('Payment confirmed.');
                    }
                } catch (err) {
                    console.error(err);
                    notify.error(err.message || "Couldn't update payment status. Please try again.");
                } finally {
                    setActionLoading(false);
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
                    setActionLoading(true);
                    const res = await adminAPI.updateVerificationStatus(ticketId, status);
                    if (res.success) {
                        setTickets(tickets.map(t => t.id === ticketId ? { ...t, verificationStatus: status } : t));
                        if (selectedTicket?.id === ticketId) {
                            setSelectedTicket({ ...selectedTicket, verificationStatus: status });
                        }
                        notify.success(status === 'approved' ? 'ID verified.' : 'ID verification rejected.');
                    }
                } catch (err) {
                    console.error(err);
                    notify.error(err.message || "Couldn't update verification status. Please try again.");
                } finally {
                    setActionLoading(false);
                }
            }
        );
    };

    // Export tickets
    const handleExport = async () => {
        try {
            setExportLoading(true);
            const filters = {};
            if (dateFilter) {
                filters.startDate = dateFilter;
                filters.endDate = dateFilter;
            }
            if (statusFilter !== 'all') filters.status = statusFilter;
            if (paymentFilter !== 'all') filters.paymentStatus = paymentFilter;

            const res = await adminAPI.exportTickets(filters);
            if (res.success && res.tickets) {
                // Generate CSV
                const headers = ['Code', 'Customer', 'Email', 'Type', 'Quantity', 'Price', 'Visit Date', 'Status', 'Payment Status', 'Payment Method'];
                const rows = res.tickets.map(t => [
                    t.booking_reference || t.code,
                    t.visitor_name || t.purchasedBy,
                    t.visitor_email || t.email,
                    t.ticket_type || t.type,
                    t.quantity || 1,
                    t.total_amount || t.price,
                    t.visit_date?.split('T')[0],
                    t.status,
                    t.payment_status,
                    t.payment_method
                ]);
                
                const csvContent = [
                    headers.join(','),
                    ...rows.map(row => row.map(cell => `"${cell || ''}"`).join(','))
                ].join('\n');
                
                // Download CSV
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `tickets_export_${new Date().toISOString().split('T')[0]}.csv`;
                link.click();
            }
        } catch (err) {
            console.error(err);
            notify.error(err.message || "Couldn't export tickets. Please try again.");
        } finally {
            setExportLoading(false);
        }
    };

    // Update status with confirmation
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

    // Use globalSearch or local searchQuery
    const effectiveSearch = globalSearch || searchQuery;

    const filteredTickets = tickets.filter(ticket => {
        const matchesSearch =
            ticket.code?.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
            ticket.purchasedBy?.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
            ticket.email?.toLowerCase().includes(effectiveSearch.toLowerCase());
        const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
        const matchesDate = !dateFilter || ticket.visitDate?.split('T')[0] === dateFilter;
        const matchesPayment = paymentFilter === 'all' || ticket.paymentStatus === paymentFilter;
        return matchesSearch && matchesStatus && matchesDate && matchesPayment;
    });

    const ticketStats = {
        total: tickets.length,
        pending: tickets.filter(t => t.status === 'pending').length,
        confirmed: tickets.filter(t => t.status === 'confirmed' || t.status === 'active').length,
        used: tickets.filter(t => t.status === 'used').length,
        cancelled: tickets.filter(t => t.status === 'cancelled').length,
    };

    const openTicketDetails = (ticket) => {
        setSelectedTicket(ticket);
        setShowModal(true);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-green-400 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-500">Loading tickets...</span>
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
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white border border-green-300 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-400/10 rounded-xl flex items-center justify-center text-green-800">
                            <ReiconTicket className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{ticketStats.total}</p>
                            <p className="text-xs text-gray-500">Total Tickets</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-green-300 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center text-yellow-700">
                            <ReiconClock strokeWidth="2" className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{ticketStats.pending}</p>
                            <p className="text-xs text-gray-500">Pending</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-green-300 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-400/10 rounded-xl flex items-center justify-center text-green-800">
                            <ReiconCheckCircle className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{ticketStats.confirmed}</p>
                            <p className="text-xs text-gray-500">Confirmed</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-green-300 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-700">
                            <ReiconEye className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{ticketStats.used}</p>
                            <p className="text-xs text-gray-500">Used</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-green-300 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center text-red-700">
                            <ReiconX className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{ticketStats.cancelled}</p>
                            <p className="text-xs text-gray-500">Cancelled</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Card */}
            <div className="bg-white border border-green-300 rounded-2xl overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-green-300">
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Search */}
                        <div className="relative flex-1">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                <ReiconSearch className="w-4 h-4" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search by code, name, or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-green-50 border border-green-300 rounded-xl py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:border-green-400 transition-all"
                            />
                        </div>

                        {/* Filters */}
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Status Filter */}
                            <div className="relative">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="appearance-none bg-green-50 border border-green-300 rounded-xl py-2.5 pl-10 pr-8 text-sm text-gray-900 focus:outline-none focus:border-green-400 cursor-pointer"
                                >
                                    <option value="all">All Status</option>
                                    <option value="pending">Pending</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="used">Used</option>
                                    <option value="expired">Expired</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                                    <ReiconFilter className="w-4 h-4" />
                                </div>
                            </div>

                            {/* Payment Filter */}
                            <div className="relative">
                                <select
                                    value={paymentFilter}
                                    onChange={(e) => setPaymentFilter(e.target.value)}
                                    className="appearance-none bg-green-50 border border-green-300 rounded-xl py-2.5 pl-10 pr-8 text-sm text-gray-900 focus:outline-none focus:border-green-400 cursor-pointer"
                                >
                                    <option value="all">All Payments</option>
                                    <option value="pending">Payment Pending</option>
                                    <option value="paid">Paid</option>
                                    <option value="refunded">Refunded</option>
                                </select>
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                                    <ReiconCalendar className="w-4 h-4" />
                                </div>
                            </div>

                            {/* Date Filter */}
                            <input
                                type="date"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                className="bg-green-50 border border-green-300 rounded-xl py-2.5 px-4 text-sm text-gray-900 focus:outline-none focus:border-green-400 cursor-pointer"
                            />

                            {/* Refresh Button */}
                            <button
                                onClick={fetchTickets}
                                className="p-2.5 bg-green-50 border border-green-300 rounded-xl text-gray-500 hover:text-gray-900 hover:border-green-400/50 transition-all"
                                title="Refresh"
                            >
                                <ReiconRefresh className="w-4 h-4" />
                            </button>

                            {/* Export Button */}
                            <button
                                onClick={handleExport}
                                disabled={exportLoading}
                                className="flex items-center gap-2 px-4 py-2.5 bg-green-400/10 border border-green-400/30 text-green-800 rounded-xl hover:bg-green-400/20 transition-all disabled:opacity-50"
                            >
                                <ReiconDownload className="w-4 h-4" />
                                {exportLoading ? 'Exporting...' : 'Export'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tickets Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-green-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ticket Code</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Visit Date</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Payment</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-green-300">
                            {filteredTickets.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                                        No tickets match your filters
                                    </td>
                                </tr>
                            ) : (
                                filteredTickets.map(ticket => (
                                    <tr key={ticket.id} className="hover:bg-green-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <ReiconQr className="w-5 h-5 text-gray-500" />
                                                <span className="font-mono text-green-800 font-medium">{ticket.code}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="text-gray-900 font-medium">{ticket.purchasedBy}</p>
                                                <p className="text-gray-500 text-xs">{ticket.email}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-green-50 border border-green-300 text-gray-700 text-xs rounded-lg capitalize">
                                                {ticket.type} × {ticket.quantity}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-700">{ticket.visitDate?.split('T')[0]}</td>
                                        <td className="px-6 py-4 text-gray-900 font-medium">
                                            {ticket.price === 0 ? 'FREE' : `₱${ticket.price?.toLocaleString()}`}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-gray-900 capitalize text-sm">{ticket.paymentMethod || 'cash'}</span>
                                                <span className={`inline-flex w-fit px-2 py-0.5 text-xs font-medium rounded-full border capitalize ${getPaymentBadge(ticket.paymentStatus)}`}>
                                                    {ticket.paymentStatus}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border capitalize ${getStatusBadge(ticket.status)}`}>
                                                {ticket.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openTicketDetails(ticket)}
                                                    className="p-2 bg-green-50 hover:bg-green-50 border border-green-300 hover:border-green-400/50 text-gray-500 hover:text-green-800 rounded-lg transition-all"
                                                    title="View details"
                                                >
                                                    <ReiconEye className="w-4 h-4" />
                                                </button>
                                                {(ticket.paymentStatus === 'pending' || ticket.paymentStatus === 'not_paid' || ticket.paymentStatus === 'not paid') && (
                                                    <button
                                                        onClick={() => handleMarkAsPaid(ticket.id)}
                                                        className="p-2 bg-green-50 hover:bg-green-400/10 border border-green-300 hover:border-green-400/50 text-gray-500 hover:text-green-800 rounded-lg transition-all"
                                                        title="Mark as paid"
                                                    >
                                                        <ReiconDollarSign strokeWidth="2" className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {ticket.status === 'pending' && (
                                                    <button
                                                        onClick={() => handleStatusChange(ticket.id, 'confirmed')}
                                                        className="p-2 bg-green-50 hover:bg-green-400/10 border border-green-300 hover:border-green-400/50 text-gray-500 hover:text-green-800 rounded-lg transition-all"
                                                        title="Confirm ticket"
                                                    >
                                                        <ReiconCheckCircle className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {(ticket.status === 'confirmed' || ticket.status === 'active') && (
                                                    <button
                                                        onClick={() => handleStatusChange(ticket.id, 'used')}
                                                        className="p-2 bg-green-50 hover:bg-blue-500/10 border border-green-300 hover:border-blue-500/50 text-gray-500 hover:text-blue-700 rounded-lg transition-all"
                                                        title="Mark as used"
                                                    >
                                                        <ReiconCheckCircle className="w-4 h-4" />
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

                {/* Table Footer */}
                <div className="px-6 py-4 border-t border-green-300 flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                        Showing {filteredTickets.length} of {tickets.length} tickets
                    </p>
                </div>
            </div>

            {/* Ticket Detail Modal */}
            {showModal && selectedTicket && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white border border-green-300 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-green-300 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-400/10 rounded-xl flex items-center justify-center text-green-800">
                                    <ReiconTicket className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">Ticket Details</h3>
                                    <p className="text-sm text-gray-500 font-mono">{selectedTicket.code}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 hover:bg-green-50 rounded-lg text-gray-500 hover:text-gray-900 transition"
                            >
                                <ReiconX className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 space-y-4">
                            {/* Status Badges */}
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <span className="text-gray-500 text-sm">Status</span>
                                    <span className={`ml-2 inline-flex px-3 py-1 text-sm font-medium rounded-full border capitalize ${getStatusBadge(selectedTicket.status)}`}>
                                        {selectedTicket.status}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-500 text-sm">Payment</span>
                                    <span className={`ml-2 inline-flex px-3 py-1 text-sm font-medium rounded-full border capitalize ${getPaymentBadge(selectedTicket.paymentStatus)}`}>
                                        {selectedTicket.paymentStatus}
                                    </span>
                                </div>
                            </div>

                            {/* QR Code */}
                            {selectedTicket.qrCode && (
                                <div className="flex justify-center p-4 bg-white rounded-xl">
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${selectedTicket.qrCode}`}
                                        alt="QR Code"
                                        className="w-32 h-32"
                                    />
                                </div>
                            )}

                            {/* Customer Info */}
                            <div className="p-4 bg-green-50 rounded-xl space-y-3">
                                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Customer Information</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500">Name</p>
                                        <p className="text-gray-900">{selectedTicket.purchasedBy}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Email</p>
                                        <p className="text-gray-900">{selectedTicket.email}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Ticket Info */}
                            <div className="p-4 bg-green-50 rounded-xl space-y-3">
                                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Ticket Information</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500">Type</p>
                                        <p className="text-gray-900 capitalize">{selectedTicket.type}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Quantity</p>
                                        <p className="text-gray-900">{selectedTicket.quantity}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Total Price</p>
                                        <p className="text-green-800 font-medium">
                                            {selectedTicket.price === 0 ? 'FREE' : `₱${selectedTicket.price?.toLocaleString()}`}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Payment Method</p>
                                        <p className="text-gray-900 capitalize">{selectedTicket.paymentMethod}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Purchase Date</p>
                                        <p className="text-gray-900">{selectedTicket.purchaseDate?.split('T')[0]}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Visit Date</p>
                                        <p className="text-gray-900">{selectedTicket.visitDate?.split('T')[0]}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Resident ID Verification Section */}
                            {selectedTicket.type?.toLowerCase() === 'resident' && (
                                <div className="p-4 bg-green-400/10 border border-green-400/30 rounded-xl space-y-3">
                                    <h4 className="text-sm font-semibold text-green-800 uppercase tracking-wider flex items-center gap-2">
                                        <ReiconUserId strokeWidth="2" className="w-4 h-4" />
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
                                            <p className="text-xs text-green-800">Click image to view in full size</p>
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="text-gray-500">Verification Status:</span>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                                                    selectedTicket.verificationStatus === 'approved' 
                                                        ? 'bg-green-400/20 text-green-800 border-green-400/30'
                                                        : selectedTicket.verificationStatus === 'rejected'
                                                            ? 'bg-red-500/20 text-red-700 border-red-500/30'
                                                            : 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30'
                                                }`}>
                                                    {selectedTicket.verificationStatus || 'Pending'}
                                                </span>
                                            </div>
                                            {/* Verification Actions */}
                                            {selectedTicket.verificationStatus !== 'approved' && selectedTicket.verificationStatus !== 'rejected' && (
                                                <div className="flex gap-2 pt-2">
                                                    <button
                                                        onClick={() => handleUpdateVerificationStatus(selectedTicket.id, 'approved')}
                                                        disabled={actionLoading}
                                                        className="flex-1 py-2 bg-green-400/20 border border-green-400/30 text-green-800 text-sm font-medium rounded-lg hover:bg-green-400/30 transition-all disabled:opacity-50"
                                                    >
                                                        Approve ID
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdateVerificationStatus(selectedTicket.id, 'rejected')}
                                                        disabled={actionLoading}
                                                        className="flex-1 py-2 bg-red-500/20 border border-red-500/30 text-red-700 text-sm font-medium rounded-lg hover:bg-red-500/30 transition-all disabled:opacity-50"
                                                    >
                                                        Reject ID
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="p-4 bg-green-50 rounded-xl text-center">
                                            <p className="text-yellow-700 text-sm">
                                                <ReiconAlertTriangle strokeWidth="2" className="w-5 h-5 inline mr-2" />
                                                No ID image uploaded. Please contact the visitor to submit their ID.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Mark as Paid Button */}
                            {(selectedTicket.paymentStatus === 'pending' || selectedTicket.paymentStatus === 'not_paid' || selectedTicket.paymentStatus === 'not paid') && (
                                <button
                                    onClick={() => handleMarkAsPaid(selectedTicket.id)}
                                    disabled={actionLoading}
                                    className="w-full py-3 bg-green-400/20 border border-green-400/30 text-green-800 font-semibold rounded-xl hover:bg-green-400/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    <ReiconDollarSign strokeWidth="2" className="w-5 h-5" />
                                    Mark as Paid
                                </button>
                            )}

                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-3 pt-2">
                                {selectedTicket.status === 'pending' && (
                                    <button
                                        onClick={() => handleStatusChange(selectedTicket.id, 'confirmed')}
                                        disabled={actionLoading}
                                        className="flex-1 py-3 bg-gradient-to-r from-green-300 via-green-400 to-green-500 text-gray-900 font-semibold rounded-xl hover:shadow-lg hover:shadow-green-400/25 transition-all disabled:opacity-50"
                                    >
                                        Confirm Ticket
                                    </button>
                                )}
                                {(selectedTicket.status === 'confirmed' || selectedTicket.status === 'active') && (
                                    <button
                                        onClick={() => handleStatusChange(selectedTicket.id, 'used')}
                                        disabled={actionLoading}
                                        className="flex-1 py-3 bg-blue-500/20 border border-blue-500/30 text-blue-700 font-semibold rounded-xl hover:bg-blue-500/30 transition-all disabled:opacity-50"
                                    >
                                        Mark as Used
                                    </button>
                                )}
                                {selectedTicket.status !== 'cancelled' && selectedTicket.status !== 'used' && selectedTicket.status !== 'expired' && (
                                    <button
                                        onClick={() => setShowCancelModal(true)}
                                        disabled={actionLoading}
                                        className="flex-1 py-3 bg-red-500/10 border border-red-500/30 text-red-700 font-semibold rounded-xl hover:bg-red-500/20 transition-all disabled:opacity-50"
                                    >
                                        Cancel Ticket
                                    </button>
                                )}
                                {selectedTicket.status !== 'expired' && selectedTicket.status !== 'cancelled' && selectedTicket.status !== 'used' && (
                                    <button
                                        onClick={() => handleStatusChange(selectedTicket.id, 'expired')}
                                        disabled={actionLoading}
                                        className="flex-1 py-3 bg-gray-500/10 border border-gray-500/30 text-gray-500 font-semibold rounded-xl hover:bg-gray-500/20 transition-all disabled:opacity-50"
                                    >
                                        Mark Expired
                                    </button>
                                )}
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="w-full py-3 bg-green-50 hover:bg-green-50 text-gray-700 font-medium rounded-xl transition-all"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel Ticket Modal */}
            {showCancelModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-white border border-green-300 rounded-2xl w-full max-w-md">
                        <div className="p-6 border-b border-green-300">
                            <h3 className="text-xl font-bold text-gray-900">Cancel Ticket</h3>
                            <p className="text-gray-500 text-sm mt-1">Please provide a reason for cancellation</p>
                        </div>
                        <div className="p-6 space-y-4">
                            <textarea
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                placeholder="Enter cancellation reason..."
                                rows={4}
                                className="w-full px-4 py-3 bg-green-50 border border-green-300 rounded-xl text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-green-400/50 resize-none"
                            />
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowCancelModal(false);
                                        setCancelReason('');
                                    }}
                                    className="flex-1 py-3 bg-green-50 hover:bg-green-50 text-gray-700 font-medium rounded-xl transition-all"
                                >
                                    Go Back
                                </button>
                                <button
                                    onClick={() => {
                                        updateTicketStatus(selectedTicket.id, 'cancelled', cancelReason);
                                        setShowCancelModal(false);
                                        setCancelReason('');
                                    }}
                                    disabled={actionLoading}
                                    className="flex-1 py-3 bg-red-500/20 border border-red-500/30 text-red-700 font-semibold rounded-xl hover:bg-red-500/30 transition-all disabled:opacity-50"
                                >
                                    {actionLoading ? 'Cancelling...' : 'Confirm Cancel'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-white border border-green-300 rounded-2xl w-full max-w-md">
                        <div className="p-6 border-b border-green-300">
                            <h3 className="text-xl font-bold text-gray-900">{confirmTitle}</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-gray-700">{confirmMessage}</p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowConfirmModal(false);
                                        setConfirmAction(null);
                                    }}
                                    className="flex-1 py-3 bg-green-50 hover:bg-green-50 text-gray-700 font-medium rounded-xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmAction}
                                    disabled={actionLoading}
                                    className="flex-1 py-3 bg-gradient-to-r from-green-300 via-green-400 to-green-500 text-gray-900 font-semibold rounded-xl hover:shadow-lg hover:shadow-green-400/25 transition-all disabled:opacity-50"
                                >
                                    {actionLoading ? 'Processing...' : 'Confirm'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Image Preview Modal */}
            {showImageModal && previewImageUrl && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
                    onClick={() => setShowImageModal(false)}
                >
                    <div 
                        className="relative max-w-4xl max-h-[90vh] w-full"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setShowImageModal(false)}
                            className="absolute -top-12 right-0 p-2 bg-white/10 hover:bg-white/40 rounded-full text-gray-900 transition-all"
                        >
                            <ReiconX className="w-5 h-5" />
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

export default AdminTickets;
