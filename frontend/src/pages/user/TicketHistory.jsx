import { useState, useEffect, useRef } from 'react';
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
    const [downloading, setDownloading] = useState(false);
    const [archiving, setArchiving] = useState(false);
    const ticketRef = useRef(null);

    useEffect(() => {
        fetchTicketHistory();
    }, []);

    const fetchTicketHistory = async () => {
        try {
            const response = await userAPI.getMyTickets();
            if (response.success) {
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
                    cancellationReason: t.cancellation_reason || t.cancellationReason || t.notes || null,
                    visitorName: t.visitor_name || t.visitorName || t.user_name || '',
                    ticketDetails: t.notes || null
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

    const downloadTicket = async () => {
        if (!selectedTicket) return;
        setDownloading(true);

        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            canvas.width = 720;
            canvas.height = 1600;

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const textColor = '#212631';
            ctx.fillStyle = textColor;
            ctx.strokeStyle = textColor;

            const monoFont = '"Brass Mono", "Brass Mono Code", "Courier New", monospace';

            const padding = 60;
            let y = 60;

            const drawDashedLine = (yPos) => {
                ctx.beginPath();
                ctx.setLineDash([5, 5]);
                ctx.lineWidth = 1.5;
                ctx.moveTo(padding, yPos);
                ctx.lineTo(canvas.width - padding, yPos);
                ctx.stroke();
                ctx.setLineDash([]);
            };

            drawDashedLine(y);
            y += 90;

            ctx.textAlign = 'center';
            ctx.font = `bold 80px ${monoFont}`;
            ctx.fillText('BULUSAN ZOO', canvas.width / 2, y);

            y += 55;
            ctx.font = `400 32px ${monoFont}`;
            ctx.fillText('DIGITAL ENTRY PASS', canvas.width / 2, y);

            y += 50;
            drawDashedLine(y);

            y += 90;

            const qrSize = 400;
            const qrX = (canvas.width - qrSize) / 2;

            const qrImage = new Image();
            qrImage.crossOrigin = 'anonymous';
            await new Promise((resolve, reject) => {
                qrImage.onload = resolve;
                qrImage.onerror = reject;
                qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${selectedTicket.qrCode}`;
            });

            ctx.drawImage(qrImage, qrX, y, qrSize, qrSize);

            y += qrSize + 90;
            drawDashedLine(y);

            y += 70;
            ctx.font = `30px ${monoFont}`;

            const drawReceiptLine = (label, value, yPos, isBold = false) => {
                ctx.textAlign = 'left';
                ctx.font = isBold ? `bold 30px ${monoFont}` : `30px ${monoFont}`;
                ctx.fillText(label, padding + 20, yPos);

                ctx.textAlign = 'right';
                ctx.fillText(String(value).toUpperCase(), canvas.width - padding - 20, yPos);
            };

            drawReceiptLine('VISITOR:', selectedTicket.visitorName || user?.firstName + ' ' + user?.lastName || 'NOT SPECIFIED', y, true);
            y += 60;

            drawReceiptLine('REF NO:', selectedTicket.ticketCode || 'N/A', y);
            y += 60;
            drawReceiptLine('DATE:', new Date(selectedTicket.visitDate).toLocaleDateString(), y);
            y += 60;
            const ticketTypeDisplay = selectedTicket.ticketDetails || selectedTicket.ticketType || 'REGULAR';
            drawReceiptLine('TYPE:', ticketTypeDisplay, y);
            y += 60;
            drawReceiptLine('QTY:', String(selectedTicket.quantity || 1), y);
            y += 60;
            drawReceiptLine('TOTAL:', selectedTicket.amount === 0 ? 'FREE' : `PHP ${selectedTicket.amount}`, y, true);
            y += 60;
            
            const paymentLabel = getPaymentMethodLabel(selectedTicket.paymentMethod);
            drawReceiptLine('PAYMENT:', paymentLabel, y);

            y += 80;
            drawDashedLine(y);

            y += 80;
            ctx.textAlign = 'center';
            ctx.font = `bold 36px ${monoFont}`;
            ctx.fillText('PRESENT QR CODE AT ENTRANCE', canvas.width / 2, y);

            if (selectedTicket.paymentMethod === 'cash' || selectedTicket.paymentMethod === 'pay_at_park') {
                y += 50;
                ctx.font = `bold 28px ${monoFont}`;
                ctx.fillStyle = '#dc2626';
                ctx.fillText('PAY AT BULUSAN ZOO ENTRANCE', canvas.width / 2, y);
                ctx.fillStyle = textColor;
            }

            y += 60;
            drawDashedLine(y);

            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `ZOO-TICKET-${selectedTicket.ticketCode}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                setDownloading(false);
            }, 'image/png');

        } catch (error) {
            console.error("Layout error:", error);
            setDownloading(false);
        }
    };

    const handleArchiveTicket = async (ticketId) => {
        if (!confirm('Are you sure you want to archive this ticket?')) return;
        setArchiving(true);
        try {
            const response = await userAPI.archiveTicket(ticketId);
            if (response.success) {
                // Remove from current list
                setTickets(prev => prev.filter(t => t.id !== ticketId));
                setSelectedTicket(null);
            }
        } catch (error) {
            console.error('Error archiving ticket:', error);
            alert('Failed to archive ticket. Please try again.');
        } finally {
            setArchiving(false);
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
                        {['all', 'active', 'used', 'expired', 'cancelled'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-sm sm:text-base font-semibold capitalize transition-all transform hover:-translate-y-0.5 ${filter === f
                                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                                        : f === 'cancelled' 
                                            ? 'bg-white text-red-600 hover:bg-red-50 border border-red-200'
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
                        <Link
                            to="/archived-tickets"
                            className="px-4 py-2.5 bg-white text-gray-600 border border-gray-200 font-medium rounded-full hover:bg-gray-50 transition-all flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                <polyline points="21 8 21 21 3 21 3 8" />
                                <rect x="1" y="3" width="22" height="5" />
                                <line x1="10" y1="12" x2="14" y2="12" />
                            </svg>
                            <span className="hidden sm:inline">Archived</span>
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
                                                    {ticket.ticketDetails ? 'Multiple Tickets' : `${ticket.ticketType} Ticket`}
                                                </h3>
                                                {ticket.ticketDetails && (
                                                    <p className="text-sm text-emerald-700 font-medium mt-1 capitalize">
                                                        {ticket.ticketDetails}
                                                    </p>
                                                )}
                                                <p className="text-sm text-gray-500 font-mono mt-1">
                                                    #{ticket.ticketCode}
                                                </p>
                                                {ticket.visitorName && (
                                                    <p className="text-sm text-emerald-600 font-medium mt-1">
                                                        {ticket.visitorName}
                                                    </p>
                                                )}
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
                                                <p className="text-gray-500">Total Amount</p>
                                                <p className="font-medium text-emerald-600 text-base">
                                                    {ticket.amount === 0 ? 'FREE' : `₱${ticket.amount}`}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Payment Method</p>
                                                <p className={`font-medium ${ticket.paymentMethod === 'cash' || ticket.paymentMethod === 'pay_at_park' ? 'text-orange-600' : 'text-gray-800'}`}>
                                                    {getPaymentMethodLabel(ticket.paymentMethod)}
                                                </p>
                                            </div>
                                            {ticket.ticketDetails && (
                                                <div className="col-span-2">
                                                    <p className="text-gray-500">Ticket Details</p>
                                                    <p className="font-medium text-gray-800 capitalize">{ticket.ticketDetails}</p>
                                                </div>
                                            )}
                                            <div className="col-span-2">
                                                <p className="text-gray-500">Payment Status</p>
                                                <p className={`font-medium capitalize ${ticket.paymentStatus === 'paid' || ticket.paymentStatus === 'free' ? 'text-green-600' : ticket.paymentStatus === 'not_paid' ? 'text-orange-600' : 'text-yellow-600'}`}>
                                                    {ticket.paymentStatus === 'not_paid' || (ticket.paymentStatus === 'pending' && (ticket.paymentMethod === 'cash' || ticket.paymentMethod === 'pay_at_park'))
                                                        ? 'Pay at Bulusan Zoo Entrance'
                                                        : ticket.paymentStatus === 'free' ? 'Free Entry' : ticket.paymentStatus}
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
                                                {(ticket.status === 'used' || ticket.status === 'expired') && (
                                                    <button
                                                        onClick={() => handleArchiveTicket(ticket.id)}
                                                        disabled={archiving}
                                                        className="mt-2 text-gray-500 text-xs font-medium hover:text-gray-700 flex items-center gap-1"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                                                            <polyline points="21 8 21 21 3 21 3 8" />
                                                            <rect x="1" y="3" width="22" height="5" />
                                                        </svg>
                                                        Archive
                                                    </button>
                                                )}
                                            </>
                                        ) : (
                                            <div className="w-24 h-24 bg-white rounded-xl flex items-center justify-center mb-2 border-2 border-dashed border-gray-200">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-gray-400">
                                                    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
                                                    <path d="M13 5v2" /><path d="M13 17v2" /><path d="M13 11v2" />
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
                                <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
                                <path d="M13 5v2" /><path d="M13 17v2" /><path d="M13 11v2" />
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
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
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
                            {(selectedTicket.paymentMethod === 'cash' || selectedTicket.paymentMethod === 'pay_at_park') && selectedTicket.paymentStatus !== 'paid' && (
                                <div className="w-full bg-orange-50 border border-orange-200 rounded-xl p-3 mb-4 text-center">
                                    <p className="text-orange-700 font-semibold text-sm">Pay at Bulusan Zoo Entrance</p>
                                    <p className="text-orange-600 text-xs mt-1">Total: {selectedTicket.amount === 0 ? 'FREE' : `₱${selectedTicket.amount}`}</p>
                                </div>
                            )}
                            <div className="w-full bg-gray-50 rounded-xl p-4 space-y-2">
                                {selectedTicket.visitorName && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Visitor:</span>
                                        <span className="font-medium text-emerald-600">{selectedTicket.visitorName}</span>
                                    </div>
                                )}
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
                                <div className="flex justify-between text-sm border-t border-gray-200 pt-2 mt-2">
                                    <span className="text-gray-500">Total Amount:</span>
                                    <span className="font-bold text-emerald-600">{selectedTicket.amount === 0 ? 'FREE' : `₱${selectedTicket.amount}`}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Payment:</span>
                                    <span className={`font-medium ${selectedTicket.paymentMethod === 'cash' || selectedTicket.paymentMethod === 'pay_at_park' ? 'text-orange-600' : 'text-gray-800'}`}>
                                        {getPaymentMethodLabel(selectedTicket.paymentMethod)}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 space-y-3">
                            <button
                                onClick={downloadTicket}
                                disabled={downloading}
                                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-70"
                            >
                                {downloading ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Generating Ticket...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                            <polyline points="7 10 12 15 17 10" />
                                            <line x1="12" y1="15" x2="12" y2="3" />
                                        </svg>
                                        <span>Download Ticket</span>
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => setSelectedTicket(null)}
                                className="w-full py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition"
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