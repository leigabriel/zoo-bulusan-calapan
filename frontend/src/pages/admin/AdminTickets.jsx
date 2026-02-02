import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api-client';

// Icons
const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <circle cx="11" cy="11" r="8"/>
        <path d="m21 21-4.3-4.3"/>
    </svg>
);

const TicketIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
        <path d="M13 5v2"/>
        <path d="M13 17v2"/>
        <path d="M13 11v2"/>
    </svg>
);

const FilterIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
    </svg>
);

const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
    </svg>
);

const CheckCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
);

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
);

const RefreshIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M23 4v6h-6"/>
        <path d="M1 20v-6h6"/>
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
    </svg>
);

const CalendarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
);

const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
);

const QRCodeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <rect x="3" y="3" width="7" height="7"/>
        <rect x="14" y="3" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/>
        <rect x="14" y="14" width="4" height="4"/>
    </svg>
);

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

    // Mock ticket data - replace with real API call
    const mockTickets = [
        { id: 'TKT-001', code: 'ZB2024001234', type: 'Adult', event: 'Night Safari Experience', purchasedBy: 'John Doe', email: 'john@example.com', price: 250, purchaseDate: '2024-01-15', visitDate: '2024-01-20', status: 'active', quantity: 2 },
        { id: 'TKT-002', code: 'ZB2024001235', type: 'Child', event: 'Animal Feeding Tour', purchasedBy: 'Jane Smith', email: 'jane@example.com', price: 150, purchaseDate: '2024-01-14', visitDate: '2024-01-21', status: 'used', quantity: 3 },
        { id: 'TKT-003', code: 'ZB2024001236', type: 'Senior', event: 'General Admission', purchasedBy: 'Bob Wilson', email: 'bob@example.com', price: 175, purchaseDate: '2024-01-13', visitDate: '2024-01-19', status: 'active', quantity: 1 },
        { id: 'TKT-004', code: 'ZB2024001237', type: 'Adult', event: 'Wildlife Photography Day', purchasedBy: 'Alice Brown', email: 'alice@example.com', price: 500, purchaseDate: '2024-01-12', visitDate: '2024-01-18', status: 'cancelled', quantity: 2 },
        { id: 'TKT-005', code: 'ZB2024001238', type: 'Student', event: 'Conservation Workshop', purchasedBy: 'Mike Johnson', email: 'mike@example.com', price: 200, purchaseDate: '2024-01-11', visitDate: '2024-01-17', status: 'expired', quantity: 1 },
        { id: 'TKT-006', code: 'ZB2024001239', type: 'Adult', event: 'Night Safari Experience', purchasedBy: 'Sarah Davis', email: 'sarah@example.com', price: 250, purchaseDate: '2024-01-10', visitDate: '2024-01-16', status: 'used', quantity: 4 },
    ];

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
                    notes: t.notes
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
            case 'active': return 'bg-[#8cff65]/20 text-[#8cff65] border-[#8cff65]/30';
            case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            case 'used': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'expired': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
            case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };

    const getPaymentBadge = (status) => {
        switch (status?.toLowerCase()) {
            case 'paid': return 'bg-[#8cff65]/20 text-[#8cff65] border-[#8cff65]/30';
            case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            case 'refunded': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
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
                setShowCancelModal(false);
                setCancelReason('');
            }
        } catch (err) {
            console.error(err);
            alert('Failed to update ticket status');
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancelTicket = () => {
        if (selectedTicket) {
            updateTicketStatus(selectedTicket.id, 'cancelled', cancelReason);
        }
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
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#8cff65]/10 rounded-xl flex items-center justify-center text-[#8cff65]">
                            <TicketIcon />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{ticketStats.total}</p>
                            <p className="text-xs text-gray-500">Total Tickets</p>
                        </div>
                    </div>
                </div>
                <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center text-yellow-400">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                            </svg>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{ticketStats.pending}</p>
                            <p className="text-xs text-gray-500">Pending</p>
                        </div>
                    </div>
                </div>
                <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#8cff65]/10 rounded-xl flex items-center justify-center text-[#8cff65]">
                            <CheckCircleIcon />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{ticketStats.confirmed}</p>
                            <p className="text-xs text-gray-500">Confirmed</p>
                        </div>
                    </div>
                </div>
                <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400">
                            <EyeIcon />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{ticketStats.used}</p>
                            <p className="text-xs text-gray-500">Used</p>
                        </div>
                    </div>
                </div>
                <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center text-red-400">
                            <CloseIcon />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{ticketStats.cancelled}</p>
                            <p className="text-xs text-gray-500">Cancelled</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Card */}
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-[#2a2a2a]">
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Search */}
                        <div className="relative flex-1">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                <SearchIcon />
                            </div>
                            <input
                                type="text"
                                placeholder="Search by code, name, or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#8cff65] transition-all"
                            />
                        </div>

                        {/* Filters */}
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Status Filter */}
                            <div className="relative">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="appearance-none bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl py-2.5 pl-10 pr-8 text-sm text-white focus:outline-none focus:border-[#8cff65] cursor-pointer"
                                >
                                    <option value="all">All Status</option>
                                    <option value="pending">Pending</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="used">Used</option>
                                    <option value="expired">Expired</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                                    <FilterIcon />
                                </div>
                            </div>

                            {/* Payment Filter */}
                            <div className="relative">
                                <select
                                    value={paymentFilter}
                                    onChange={(e) => setPaymentFilter(e.target.value)}
                                    className="appearance-none bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl py-2.5 pl-10 pr-8 text-sm text-white focus:outline-none focus:border-[#8cff65] cursor-pointer"
                                >
                                    <option value="all">All Payments</option>
                                    <option value="pending">Payment Pending</option>
                                    <option value="paid">Paid</option>
                                    <option value="refunded">Refunded</option>
                                </select>
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                                    <CalendarIcon />
                                </div>
                            </div>

                            {/* Date Filter */}
                            <input
                                type="date"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-[#8cff65] cursor-pointer"
                            />

                            {/* Refresh Button */}
                            <button
                                onClick={fetchTickets}
                                className="p-2.5 bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl text-gray-400 hover:text-white hover:border-[#8cff65]/50 transition-all"
                                title="Refresh"
                            >
                                <RefreshIcon />
                            </button>

                            {/* Export Button */}
                            <button
                                className="flex items-center gap-2 px-4 py-2.5 bg-[#8cff65]/10 border border-[#8cff65]/30 text-[#8cff65] rounded-xl hover:bg-[#8cff65]/20 transition-all"
                            >
                                <DownloadIcon />
                                Export
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tickets Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#1e1e1e]">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Ticket Code</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Visit Date</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Price</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Payment</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2a2a2a]">
                            {filteredTickets.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                                        No tickets match your filters
                                    </td>
                                </tr>
                            ) : (
                                filteredTickets.map(ticket => (
                                    <tr key={ticket.id} className="hover:bg-[#1e1e1e]/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <QRCodeIcon className="text-gray-500" />
                                                <span className="font-mono text-[#8cff65] font-medium">{ticket.code}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="text-white font-medium">{ticket.purchasedBy}</p>
                                                <p className="text-gray-500 text-xs">{ticket.email}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-[#1e1e1e] border border-[#2a2a2a] text-gray-300 text-xs rounded-lg capitalize">
                                                {ticket.type} × {ticket.quantity}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-300">{ticket.visitDate?.split('T')[0]}</td>
                                        <td className="px-6 py-4 text-white font-medium">
                                            {ticket.price === 0 ? 'FREE' : `₱${ticket.price?.toLocaleString()}`}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-white capitalize text-sm">{ticket.paymentMethod || 'cash'}</span>
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
                                                    className="p-2 bg-[#1e1e1e] hover:bg-[#2a2a2a] border border-[#2a2a2a] hover:border-[#8cff65]/50 text-gray-400 hover:text-[#8cff65] rounded-lg transition-all"
                                                    title="View details"
                                                >
                                                    <EyeIcon />
                                                </button>
                                                {ticket.status === 'pending' && (
                                                    <button
                                                        onClick={() => updateTicketStatus(ticket.id, 'confirmed')}
                                                        className="p-2 bg-[#1e1e1e] hover:bg-[#8cff65]/10 border border-[#2a2a2a] hover:border-[#8cff65]/50 text-gray-400 hover:text-[#8cff65] rounded-lg transition-all"
                                                        title="Confirm ticket"
                                                    >
                                                        <CheckCircleIcon />
                                                    </button>
                                                )}
                                                {(ticket.status === 'confirmed' || ticket.status === 'active') && (
                                                    <button
                                                        onClick={() => updateTicketStatus(ticket.id, 'used')}
                                                        className="p-2 bg-[#1e1e1e] hover:bg-blue-500/10 border border-[#2a2a2a] hover:border-blue-500/50 text-gray-400 hover:text-blue-400 rounded-lg transition-all"
                                                        title="Mark as used"
                                                    >
                                                        <CheckCircleIcon />
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
                <div className="px-6 py-4 border-t border-[#2a2a2a] flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                        Showing {filteredTickets.length} of {tickets.length} tickets
                    </p>
                </div>
            </div>

            {/* Ticket Detail Modal */}
            {showModal && selectedTicket && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-[#2a2a2a] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-[#8cff65]/10 rounded-xl flex items-center justify-center text-[#8cff65]">
                                    <TicketIcon />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">Ticket Details</h3>
                                    <p className="text-sm text-gray-500 font-mono">{selectedTicket.code}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 hover:bg-[#1e1e1e] rounded-lg text-gray-400 hover:text-white transition"
                            >
                                <CloseIcon />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 space-y-4">
                            {/* Status Badges */}
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <span className="text-gray-400 text-sm">Status</span>
                                    <span className={`ml-2 inline-flex px-3 py-1 text-sm font-medium rounded-full border capitalize ${getStatusBadge(selectedTicket.status)}`}>
                                        {selectedTicket.status}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-400 text-sm">Payment</span>
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
                            <div className="p-4 bg-[#1e1e1e] rounded-xl space-y-3">
                                <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Customer Information</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500">Name</p>
                                        <p className="text-white">{selectedTicket.purchasedBy}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Email</p>
                                        <p className="text-white">{selectedTicket.email}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Ticket Info */}
                            <div className="p-4 bg-[#1e1e1e] rounded-xl space-y-3">
                                <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Ticket Information</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500">Type</p>
                                        <p className="text-white capitalize">{selectedTicket.type}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Quantity</p>
                                        <p className="text-white">{selectedTicket.quantity}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Total Price</p>
                                        <p className="text-[#8cff65] font-medium">
                                            {selectedTicket.price === 0 ? 'FREE' : `₱${selectedTicket.price?.toLocaleString()}`}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Payment Method</p>
                                        <p className="text-white capitalize">{selectedTicket.paymentMethod}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Purchase Date</p>
                                        <p className="text-white">{selectedTicket.purchaseDate?.split('T')[0]}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Visit Date</p>
                                        <p className="text-white">{selectedTicket.visitDate?.split('T')[0]}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-3 pt-2">
                                {selectedTicket.status === 'pending' && (
                                    <button
                                        onClick={() => updateTicketStatus(selectedTicket.id, 'confirmed')}
                                        disabled={actionLoading}
                                        className="flex-1 py-3 bg-gradient-to-r from-[#8cff65] to-[#4ade80] text-[#0a0a0a] font-semibold rounded-xl hover:from-[#9dff7a] hover:to-[#5ceb91] transition-all disabled:opacity-50"
                                    >
                                        Confirm Ticket
                                    </button>
                                )}
                                {(selectedTicket.status === 'confirmed' || selectedTicket.status === 'active') && (
                                    <button
                                        onClick={() => updateTicketStatus(selectedTicket.id, 'used')}
                                        disabled={actionLoading}
                                        className="flex-1 py-3 bg-blue-500/20 border border-blue-500/30 text-blue-400 font-semibold rounded-xl hover:bg-blue-500/30 transition-all disabled:opacity-50"
                                    >
                                        Mark as Used
                                    </button>
                                )}
                                {selectedTicket.status !== 'cancelled' && selectedTicket.status !== 'used' && selectedTicket.status !== 'expired' && (
                                    <button
                                        onClick={() => setShowCancelModal(true)}
                                        disabled={actionLoading}
                                        className="flex-1 py-3 bg-red-500/10 border border-red-500/30 text-red-400 font-semibold rounded-xl hover:bg-red-500/20 transition-all disabled:opacity-50"
                                    >
                                        Cancel Ticket
                                    </button>
                                )}
                                {selectedTicket.status !== 'expired' && selectedTicket.status !== 'cancelled' && selectedTicket.status !== 'used' && (
                                    <button
                                        onClick={() => updateTicketStatus(selectedTicket.id, 'expired')}
                                        disabled={actionLoading}
                                        className="flex-1 py-3 bg-gray-500/10 border border-gray-500/30 text-gray-400 font-semibold rounded-xl hover:bg-gray-500/20 transition-all disabled:opacity-50"
                                    >
                                        Mark Expired
                                    </button>
                                )}
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="w-full py-3 bg-[#1e1e1e] hover:bg-[#2a2a2a] text-gray-300 font-medium rounded-xl transition-all"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel Ticket Modal */}
            {showCancelModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl w-full max-w-md">
                        <div className="p-6 border-b border-[#2a2a2a]">
                            <h3 className="text-xl font-bold text-white">Cancel Ticket</h3>
                            <p className="text-gray-400 text-sm mt-1">Please provide a reason for cancellation</p>
                        </div>
                        <div className="p-6 space-y-4">
                            <textarea
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                placeholder="Enter cancellation reason..."
                                rows={4}
                                className="w-full px-4 py-3 bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-[#8cff65]/50 resize-none"
                            />
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowCancelModal(false);
                                        setCancelReason('');
                                    }}
                                    className="flex-1 py-3 bg-[#1e1e1e] hover:bg-[#2a2a2a] text-gray-300 font-medium rounded-xl transition-all"
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
                                    className="flex-1 py-3 bg-red-500/20 border border-red-500/30 text-red-400 font-semibold rounded-xl hover:bg-red-500/30 transition-all disabled:opacity-50"
                                >
                                    {actionLoading ? 'Cancelling...' : 'Confirm Cancel'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminTickets;
