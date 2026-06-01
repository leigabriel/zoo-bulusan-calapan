import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/use-auth';
import { reservationAPI } from '../../services/api-client';
import { QRCodeCanvas } from 'qrcode.react';
import { notify } from '../../utils/toast';

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
    const receiptRef = useRef(null);
    const [downloading, setDownloading] = useState(false);

    const handleDownload = async () => {
        if (!selectedReservation || !receiptRef.current) return;
        try {
            setDownloading(true);
            await new Promise(resolve => setTimeout(resolve, 150));

            const buyerName = selectedReservation.user_name || selectedReservation.visitor_name || selectedReservation.participant_name || 'Guest';

            const baseWidth = 700;
            const baseHeight = selectedReservation.type === 'ticket' ? 860 : 820;
            const scale = window.devicePixelRatio ? Math.min(window.devicePixelRatio, 2) : 2;
            const canvas = document.createElement('canvas');
            canvas.width = baseWidth * scale;
            canvas.height = baseHeight * scale;
            const ctx = canvas.getContext('2d');
            ctx.scale(scale, scale);

            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = '#0f172a';
            ctx.font = '900 34px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('ZOO BULUSAN', baseWidth / 2, 76);

            ctx.font = 'bold 20px sans-serif';
            ctx.fillStyle = '#475569';
            ctx.fillText('Reservation Receipt', baseWidth / 2, 112);

            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(40, 140);
            ctx.lineTo(baseWidth - 40, 140);
            ctx.stroke();

            ctx.textAlign = 'left';

            let y = 190;
            const addRow = (label, value, isBold = false, isHighlight = false) => {
                ctx.font = 'normal 16px sans-serif';
                ctx.fillStyle = '#64748b';
                ctx.fillText(label, 50, y);

                ctx.font = isBold ? 'bold 16px sans-serif' : 'normal 16px sans-serif';
                ctx.fillStyle = isHighlight ? '#0f172a' : '#334155';
                ctx.textAlign = 'right';
                ctx.fillText(value, baseWidth - 50, y);
                ctx.textAlign = 'left';
                y += 35;
            };

            addRow('Buyer', buyerName, true);
            addRow('Reference ID', selectedReservation.reservation_reference, true);
            addRow('Type', selectedReservation.type === 'ticket' ? 'Zoo Visit' : (selectedReservation.venue_event_name || selectedReservation.event_title || 'Venue Booking'), true);
            addRow('Status', selectedReservation.status.toUpperCase(), true);

            const dateStr = formatDate(selectedReservation.reservation_date || selectedReservation.venue_event_date || selectedReservation.event_date);
            addRow('Date', dateStr, true);

            const timeStr = selectedReservation.reservation_time || selectedReservation.venue_event_time || selectedReservation.start_time || 'N/A';
            addRow('Time', timeStr, true);

            ctx.beginPath();
            ctx.moveTo(40, y + 5);
            ctx.lineTo(baseWidth - 40, y + 5);
            ctx.stroke();
            y += 40;

            if (selectedReservation.type === 'ticket') {
                if (selectedReservation.adult_quantity > 0) addRow('Adults', `${selectedReservation.adult_quantity} × P40`);
                if (selectedReservation.child_quantity > 0) addRow('Children', `${selectedReservation.child_quantity} × P20`);
                if (selectedReservation.bulusan_resident_quantity > 0) addRow('Bulusan Residents', `${selectedReservation.bulusan_resident_quantity} (FREE)`);

                y += 10;
                ctx.font = 'bold 20px sans-serif';
                ctx.fillStyle = '#0f172a';
                ctx.fillText('Total Amount', 50, y);

                ctx.textAlign = 'right';
                const total = calculateTotal(selectedReservation);
                ctx.fillStyle = '#0f172a';
                ctx.fillText(total === 0 ? 'FREE' : `P${total}`, baseWidth - 50, y);
                ctx.textAlign = 'left';
                y += 40;
            } else {
                addRow('Participants', selectedReservation.number_of_participants, true);
                addRow('Organizer', selectedReservation.participant_name, true);
            }

            if (selectedReservation.qr_data) {
                const qrCanvas = receiptRef.current.querySelector('canvas');
                if (qrCanvas) {
                    y += 10;
                    ctx.imageSmoothingEnabled = false;
                    const qrSize = 260;
                    ctx.drawImage(qrCanvas, (baseWidth - qrSize) / 2, y, qrSize, qrSize);
                    y += 280;
                    ctx.font = 'bold 12px sans-serif';
                    ctx.fillStyle = '#94a3b8';
                    ctx.textAlign = 'center';
                    ctx.fillText('SCAN THIS CODE AT THE ENTRANCE', baseWidth / 2, y);
                }
            }

            const dataUrl = canvas.toDataURL('image/png', 1.0);
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `Receipt_${selectedReservation.reservation_reference}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            notify.error('Failed to download receipt: ' + err.message);
        } finally {
            setDownloading(false);
        }
    };

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

    const getBuyerName = (reservation) => {
        return reservation?.user_name || reservation?.visitor_name || reservation?.participant_name || 'Guest';
    };

    const getStatusBadge = (status) => {
        const styles = {
            pending: 'bg-amber-50 text-amber-700 border border-amber-200',
            confirmed: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
            cancelled: 'bg-rose-50 text-rose-700 border border-rose-200',
            completed: 'bg-sky-50 text-sky-700 border border-sky-200'
        };
        return styles[status] || styles.pending;
    };

    const calculateTotal = (r) => ((r.adult_quantity || 0) * 40) + ((r.child_quantity || 0) * 20);

    if (!isOpen) return null;

    return (
        <>
            <div
                className="fixed inset-0 bg-slate-900/40 z-[90] backdrop-blur-sm transition-opacity duration-300 ease-out"
                onClick={onClose}
            />
            <div className="fixed right-0 top-0 h-full w-full sm:w-[400px] md:w-[500px] lg:max-w-xl bg-slate-50 shadow-2xl z-[100] flex flex-col transform transition-transform duration-300 ease-out">
                <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-white">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-800">Reservation History</h2>
                        <p className="text-sm text-slate-500 mt-1">Manage your past bookings</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition">
                        <Icons.Close />
                    </button>
                </div>

                {!isAuthenticated ? (
                    <div className="flex-1 flex items-center justify-center p-8">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Icons.Ticket />
                            </div>
                            <h3 className="font-semibold text-slate-700 mb-2">Sign in required</h3>
                            <p className="text-slate-500 text-sm">Please sign in to view your history</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="p-4 border-b border-slate-200 bg-white space-y-4">
                            <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
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
                                        className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg whitespace-nowrap transition ${(tab.key === 'archived' && showArchived) || (!showArchived && activeTab === tab.key)
                                                ? 'bg-slate-700 text-white shadow-sm'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                    >
                                        {tab.label} <span className="ml-1 opacity-70">({tab.count})</span>
                                    </button>
                                ))}
                            </div>
                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 transition"
                            >
                                <option value="all">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" />
                                </div>
                            ) : filteredReservations.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="w-12 h-12 bg-white border border-slate-200 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                                        <Icons.Calendar />
                                    </div>
                                    <p className="font-medium text-slate-600">No reservations found</p>
                                    <p className="text-sm text-slate-400 mt-1">Try adjusting your filters</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {filteredReservations.map(reservation => (
                                        <div
                                            key={`${reservation.type}-${reservation.id}`}
                                            onClick={() => setSelectedReservation(reservation)}
                                            className="bg-white border border-slate-200 shadow-sm hover:shadow-md rounded-xl p-4 cursor-pointer transition-all duration-200 group"
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${reservation.type === 'ticket' ? 'bg-indigo-50 text-indigo-500' : 'bg-teal-50 text-teal-500'
                                                    }`}>
                                                    {reservation.type === 'ticket' ? <Icons.Ticket /> : <Icons.Calendar />}
                                                </div>
                                                <div className="flex-1 min-w-0 pt-1">
                                                    <div className="flex items-center justify-between gap-2 mb-1">
                                                        <h4 className="font-semibold text-slate-800 truncate">
                                                            {reservation.type === 'ticket' ? 'Zoo Visit' : (reservation.venue_event_name || reservation.event_title || 'Venue Booking')}
                                                        </h4>
                                                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${getStatusBadge(reservation.status)}`}>
                                                            {reservation.status}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                                                        <span>{formatDate(reservation.reservation_date || reservation.venue_event_date || reservation.event_date)}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-xs border-t border-slate-100 pt-3 mt-1">
                                                        <span className="font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded">
                                                            {reservation.reservation_reference}
                                                        </span>
                                                        {reservation.type === 'ticket' && (
                                                            <span className="font-semibold text-slate-700">
                                                                {calculateTotal(reservation) === 0 ? 'FREE' : `₱${calculateTotal(reservation)}`}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        showArchived ? handleUnarchive(reservation) : handleArchive(reservation);
                                                    }}
                                                    disabled={archiving}
                                                    className="p-2 text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-full transition opacity-0 group-hover:opacity-100 absolute right-4 top-4"
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
                <div className="fixed inset-0 bg-slate-900/60 z-[110] flex flex-col items-center justify-center p-4 backdrop-blur-sm transition-opacity">
                    <div className="w-full max-w-sm relative flex flex-col">
                        <div
                            ref={receiptRef}
                            className="bg-white rounded-2xl w-full shadow-2xl overflow-hidden relative"
                        >
                            <div className="absolute top-[65%] left-0 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-slate-900/60 rounded-full hidden sm:block"></div>
                            <div className="absolute top-[65%] right-0 translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-slate-900/60 rounded-full hidden sm:block"></div>

                            <div className="p-6 text-center bg-slate-50 border-b border-slate-100 relative">
                                <button
                                    onClick={() => setSelectedReservation(null)}
                                    className="absolute right-4 top-4 p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 rounded-full transition"
                                >
                                    <Icons.Close />
                                </button>
                                <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-3 ${selectedReservation.type === 'ticket' ? 'bg-indigo-50 text-indigo-500' : 'bg-teal-50 text-teal-500'
                                    }`}>
                                    {selectedReservation.type === 'ticket' ? <Icons.Ticket /> : <Icons.Calendar />}
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 uppercase tracking-wide">
                                    {selectedReservation.type === 'ticket' ? 'Zoo Visit' : (selectedReservation.venue_event_name || selectedReservation.event_title || 'Venue Booking')}
                                </h3>
                                <div className="mt-2 inline-block">
                                    <span className={`text-[10px] uppercase font-bold px-3 py-1 rounded-full ${getStatusBadge(selectedReservation.status)}`}>
                                        {selectedReservation.status}
                                    </span>
                                </div>
                            </div>

                            <div className="px-8 py-6 space-y-4">
                                <div className="text-center mb-6">
                                    <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Reference No.</p>
                                    <p className="font-mono text-lg font-bold text-slate-700">{selectedReservation.reservation_reference}</p>
                                </div>

                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                        <span className="text-slate-500">Buyer</span>
                                        <span className="font-semibold text-slate-800">{getBuyerName(selectedReservation)}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                        <span className="text-slate-500">Date</span>
                                        <span className="font-semibold text-slate-800">{formatDate(selectedReservation.reservation_date || selectedReservation.venue_event_date || selectedReservation.event_date)}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                        <span className="text-slate-500">Time</span>
                                        <span className="font-semibold text-slate-800">{selectedReservation.reservation_time || selectedReservation.venue_event_time || selectedReservation.start_time || 'N/A'}</span>
                                    </div>

                                    {selectedReservation.type === 'ticket' && (
                                        <>
                                            {selectedReservation.adult_quantity > 0 && (
                                                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                                    <span className="text-slate-500">Adults</span>
                                                    <span className="font-medium text-slate-700">{selectedReservation.adult_quantity} × ₱40</span>
                                                </div>
                                            )}
                                            {selectedReservation.child_quantity > 0 && (
                                                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                                    <span className="text-slate-500">Children</span>
                                                    <span className="font-medium text-slate-700">{selectedReservation.child_quantity} × ₱20</span>
                                                </div>
                                            )}
                                            {selectedReservation.bulusan_resident_quantity > 0 && (
                                                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                                    <span className="text-slate-500">Residents</span>
                                                    <span className="font-medium text-slate-700">{selectedReservation.bulusan_resident_quantity} (FREE)</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between items-center pt-4 pb-2">
                                                <span className="font-semibold text-slate-800 uppercase tracking-wide">Total</span>
                                                <span className="font-bold text-lg text-slate-800">
                                                    {calculateTotal(selectedReservation) === 0 ? 'FREE' : `₱${calculateTotal(selectedReservation)}`}
                                                </span>
                                            </div>
                                        </>
                                    )}

                                    {selectedReservation.type === 'event' && (
                                        <>
                                            <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                                <span className="text-slate-500">Participants</span>
                                                <span className="font-semibold text-slate-800">{selectedReservation.number_of_participants}</span>
                                            </div>
                                            <div className="flex justify-between items-center py-2 border-b border-slate-100">
                                                <span className="text-slate-500">Organizer</span>
                                                <span className="font-semibold text-slate-800">{selectedReservation.participant_name}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {selectedReservation.qr_data && (
                                <>
                                    <div className="w-full border-t-2 border-dashed border-slate-200 relative z-10"></div>
                                    <div className="p-8 flex flex-col items-center bg-slate-50">
                                        <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                                            <QRCodeCanvas
                                                value={selectedReservation.qr_data}
                                                size={260}
                                                level="H"
                                                includeMargin={true}
                                                bgColor="#ffffff"
                                                fgColor="#0f172a"
                                            />
                                        </div>
                                        <p className="text-[10px] uppercase tracking-widest font-semibold text-slate-400 mt-5 text-center">
                                            Scan at the entrance
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="w-full mt-4 flex flex-col sm:flex-row gap-3 px-2 sm:px-0">
                            <button
                                onClick={handleDownload}
                                disabled={downloading}
                                className="flex-1 py-3.5 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-sm font-semibold uppercase tracking-wider text-xs rounded-xl transition disabled:opacity-50"
                            >
                                {downloading ? 'Preparing...' : 'Download'}
                            </button>
                            <button
                                onClick={() => selectedReservation.is_archived ? handleUnarchive(selectedReservation) : handleArchive(selectedReservation)}
                                disabled={archiving}
                                className={`flex-1 py-3.5 font-semibold uppercase tracking-wider text-xs rounded-xl shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-2 ${selectedReservation.is_archived
                                        ? 'bg-slate-700 hover:bg-slate-800 text-white'
                                        : 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200'
                                    }`}
                            >
                                {selectedReservation.is_archived ? <Icons.Restore /> : <Icons.Archive />}
                                {archiving ? 'Processing...' : (selectedReservation.is_archived ? 'Restore' : 'Archive')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ReservationHistoryPanel;