import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { ReactLenis } from 'lenis/react';
import { motion, AnimatePresence } from 'framer-motion';
import AIFloatingButton from '../../components/common/AIFloatingButton';
import ReservationHistoryPanel from '../../components/features/ReservationHistoryPanel';
import { useAuth } from '../../hooks/use-auth';
import { reservationAPI, userAPI } from '../../services/api-client';
import { sanitizeInput, sanitizeEmail, sanitizePhone } from '../../utils/sanitize';
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
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
        </svg>
    ),
    Check: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
        </svg>
    ),
    Plus: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
        </svg>
    ),
    Minus: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M4.5 12a.75.75 0 01.75-.75h13.5a.75.75 0 010 1.5H5.25a.75.75 0 01-.75-.75z" clipRule="evenodd" />
        </svg>
    ),
    Upload: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path fillRule="evenodd" d="M11.47 2.47a.75.75 0 011.06 0l4.5 4.5a.75.75 0 01-1.06 1.06l-3.22-3.22V16.5a.75.75 0 01-1.5 0V4.81L8.03 8.03a.75.75 0 01-1.06-1.06l4.5-4.5zM3 15.75a.75.75 0 01.75.75v2.25a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5V16.5a.75.75 0 011.5 0v2.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V16.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
        </svg>
    ),
    History: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clipRule="evenodd" />
        </svg>
    ),
    ArrowRight: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M12.97 3.97a.75.75 0 011.06 0l7.5 7.5a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 11-1.06-1.06l6.22-6.22H3a.75.75 0 010-1.5h16.19l-6.22-6.22a.75.75 0 010-1.06z" clipRule="evenodd" />
        </svg>
    ),
    Warning: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-[#212631]">
            <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
        </svg>
    )
};

const TICKET_TYPES = {
    adult: { name: 'Adult Ticket', description: 'Ages 18 and above', price: 40 },
    child: { name: 'Child Ticket', description: 'Ages 4-17', price: 20 },
    bulusan_resident: { name: 'Bulusan Resident', description: 'Free with valid ID', price: 0 }
};

const Reservations = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [reservationType, setReservationType] = useState('ticket');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [confirmationData, setConfirmationData] = useState(null);
    const [ticketCounts, setTicketCounts] = useState({ adult: 0, child: 0, bulusan_resident: 0 });
    const [ticketForm, setTicketForm] = useState({ reservationDate: '', visitorName: '', visitorEmail: '', visitorPhone: '', notes: '' });
    const [residentIdImage, setResidentIdImage] = useState(null);
    const [residentIdPreview, setResidentIdPreview] = useState(null);
    const [idUploadError, setIdUploadError] = useState('');
    const [eventForm, setEventForm] = useState({ venueEventName: '', venueEventDate: '', venueEventTime: '', venueEventDescription: '', numberOfParticipants: 1, participantName: '', participantEmail: '', participantPhone: '', notes: '' });
    const [showHistoryPanel, setShowHistoryPanel] = useState(false);

    // Confirmation modal states
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
    const [showCloseConfirm, setShowCloseConfirm] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            if (isAuthenticated) {
                await fetchEvents();
            }
            setLoading(false);
        };
        loadData();
    }, [isAuthenticated]);

    useEffect(() => {
        if (user) {
            const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
            setTicketForm(prev => ({ ...prev, visitorName: fullName, visitorEmail: user.email || '' }));
            setEventForm(prev => ({ ...prev, participantName: fullName, participantEmail: user.email || '' }));
        }
    }, [user]);

    useEffect(() => {
        if (showCreateModal || showConfirmation || showHistoryPanel || showSubmitConfirm || showCloseConfirm) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [showCreateModal, showConfirmation, showHistoryPanel, showSubmitConfirm, showCloseConfirm]);

    const fetchEvents = async () => {
        try {
            const res = await userAPI.getEvents();
            if (res.success) {
                const upcomingEvents = (res.events || []).filter(e => {
                    const date = e.event_date || e.date;
                    return date && new Date(date) >= new Date();
                });
                setEvents(upcomingEvents);
            }
        } catch (err) {
            console.error('Error fetching events:', err);
        }
    };

    const calculateTotal = () => Object.entries(ticketCounts).reduce((total, [type, count]) => total + (TICKET_TYPES[type].price * count), 0);
    const getTotalVisitors = () => Object.values(ticketCounts).reduce((a, b) => a + b, 0);
    const updateTicketCount = (type, delta) => {
        if (delta > 0 && getTotalVisitors() >= 20) {
            notify.warning('You can add up to 20 visitors per reservation.');
            return;
        }
        setTicketCounts(prev => ({ ...prev, [type]: Math.max(0, prev[type] + delta) }));
    };

    const handleResidentIdUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
                setIdUploadError('Please upload a valid image file (JPG, JPEG, or PNG)');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                setIdUploadError('Image file size must be less than 5MB');
                return;
            }
            setIdUploadError('');
            setResidentIdImage(file);
            const reader = new FileReader();
            reader.onloadend = () => setResidentIdPreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const getMaxDate = () => {
        const d = new Date();
        d.setDate(d.getDate() + 30);
        return d.toISOString().split('T')[0];
    };
    const getMinDate = () => new Date().toISOString().split('T')[0];

    const validateTicketForm = () => {
        if (getTotalVisitors() === 0) { notify.warning('Please select at least one ticket.'); return false; }
        if (!ticketForm.reservationDate) { notify.warning('Please select your visit date.'); return false; }
        if (!ticketForm.visitorName.trim()) { notify.warning('Please enter your full name.'); return false; }
        if (!ticketForm.visitorEmail.trim()) { notify.warning('Please enter your email address.'); return false; }
        if (ticketCounts.bulusan_resident > 0 && !residentIdImage) { notify.warning('Please upload your Bulusan resident ID for verification.'); return false; }
        return true;
    };

    const handleCreateReservation = async () => {
        setIsSubmitting(true);
        try {
            if (reservationType === 'ticket') {
                const res = await reservationAPI.createTicketReservation({
                    visitorName: ticketForm.visitorName,
                    visitorEmail: ticketForm.visitorEmail,
                    visitorPhone: ticketForm.visitorPhone,
                    reservationDate: ticketForm.reservationDate,
                    adultQuantity: ticketCounts.adult,
                    childQuantity: ticketCounts.child,
                    bulusanResidentQuantity: ticketCounts.bulusan_resident,
                    residentIdImage: residentIdImage,
                    notes: ticketForm.notes
                });
                if (res.success) {
                    setConfirmationData({
                        type: 'ticket',
                        reference: res.reservationReference,
                        date: ticketForm.reservationDate,
                        total: calculateTotal(),
                        visitors: getTotalVisitors()
                    });
                    setShowConfirmation(true);
                    resetForms();
                    setShowCreateModal(false);
                } else {
                    throw new Error(res.message || 'Failed to create reservation');
                }
            } else {
                const res = await reservationAPI.createEventReservation({
                    venueEventName: eventForm.venueEventName,
                    venueEventDate: eventForm.venueEventDate,
                    venueEventTime: eventForm.venueEventTime,
                    venueEventDescription: eventForm.venueEventDescription,
                    participantName: eventForm.participantName,
                    participantEmail: eventForm.participantEmail,
                    participantPhone: eventForm.participantPhone,
                    numberOfParticipants: parseInt(eventForm.numberOfParticipants),
                    notes: eventForm.notes
                });
                if (res.success) {
                    setConfirmationData({
                        type: 'event',
                        reference: res.reservationReference,
                        eventName: eventForm.venueEventName,
                        eventDate: eventForm.venueEventDate,
                        participants: eventForm.numberOfParticipants
                    });
                    setShowConfirmation(true);
                    resetForms();
                    setShowCreateModal(false);
                } else {
                    throw new Error(res.message || 'Failed to create reservation');
                }
            }
        } catch (err) {
            notify.error(err.message || 'We could not complete your reservation. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForms = () => {
        setTicketCounts({ adult: 0, child: 0, bulusan_resident: 0 });
        const fullName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '';
        setTicketForm({ reservationDate: '', visitorName: fullName, visitorEmail: user?.email || '', visitorPhone: '', notes: '' });
        setResidentIdImage(null);
        setResidentIdPreview(null);
        setIdUploadError('');
        setEventForm({ venueEventName: '', venueEventDate: '', venueEventTime: '', venueEventDescription: '', numberOfParticipants: 1, participantName: fullName, participantEmail: user?.email || '', participantPhone: '', notes: '' });
    };

    const hasFormData = () => {
        if (reservationType === 'ticket') {
            return getTotalVisitors() > 0 || ticketForm.reservationDate || ticketForm.notes || ticketForm.visitorPhone;
        } else {
            return eventForm.venueEventName || eventForm.venueEventDate || eventForm.venueEventDescription || eventForm.participantPhone;
        }
    };

    const handleCloseAttempt = () => {
        if (hasFormData()) {
            setShowCloseConfirm(true);
        } else {
            closeModal();
        }
    };

    const closeModal = () => {
        setShowCreateModal(false);
        setShowConfirmation(false);
        setConfirmationData(null);
        setShowSubmitConfirm(false);
        setShowCloseConfirm(false);
        resetForms();
    };

    const handleSubmitAttempt = (e) => {
        e.preventDefault();
        if (reservationType === 'ticket') {
            if (!validateTicketForm()) return;
        } else {
            if (!eventForm.venueEventName || !eventForm.venueEventDate) {
                notify.warning('Please provide the event name and date.');
                return;
            }
        }
        setShowSubmitConfirm(true);
    };

    const confirmSubmit = async () => {
        setShowSubmitConfirm(false);
        await handleCreateReservation();
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
    };

    const scrollToContent = () => {
        document.getElementById('reservation-content')?.scrollIntoView({ behavior: 'smooth' });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#ebebeb]">
                <div className="w-12 h-12 border-[1.5px] border-[#212631]/15 border-t-[#212631] rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <ReactLenis root>
            <div className="bg-[#ebebeb] text-[#212631] relative min-h-screen">
                <Header />

                {/* Sticky Intro Section */}
                <div className="sticky top-0 w-full h-[70vh] flex flex-col items-center justify-center overflow-hidden z-0 border-b border-[#212631]/10 bg-[#ebebeb]">
                    <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 w-full max-w-5xl h-full">
                        <span className="text-[10px] tracking-[0.3em] uppercase font-bold text-[#212631]/40 mb-6 md:mb-10">
                            Zoo Bulusan Admissions
                        </span>
                        <h1 className="font-normal uppercase text-[#212631] leading-[0.85] tracking-tighter"
                            style={{ fontSize: 'clamp(40px, 10vw, 140px)' }}>
                            Reservations
                        </h1>
                        <p className="mt-8 md:mt-10 text-xs md:text-sm tracking-[0.1em] text-[#212631]/60 max-w-2xl font-semibold uppercase leading-relaxed mb-10">
                            Book your next adventure. Secure tickets for a daily visit or reserve a spot at our exclusive upcoming events.
                        </p>

                        <button
                            onClick={scrollToContent}
                            className="px-8 py-4 bg-[#212631] text-[#ebebeb] border border-[#212631] text-[10px] tracking-[0.2em] uppercase font-black hover:bg-transparent hover:text-[#212631] transition-colors duration-300 cursor-pointer"
                        >
                            Start Booking
                        </button>
                    </div>
                </div>

                <main id="reservation-content" className="relative z-10 w-full bg-[#26bc61] min-h-[80vh] flex flex-col items-center pt-20 pb-40 px-4 md:px-8 border-t border-white/20">
                    {!isAuthenticated ? (
                        <div className="w-full max-w-xl bg-transparent border border-white/20 p-12 md:p-16 flex flex-col items-center text-center">
                            <span className="text-[10px] tracking-[0.18em] uppercase font-bold text-white/50 mb-6">Access Restricted</span>
                            <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tighter text-white mb-4">Account Required</h2>
                            <p className="text-xs tracking-widest uppercase font-bold text-white/70 mb-10 leading-relaxed">
                                Please authenticate to access the reservation system and manage your bookings.
                            </p>
                            <button onClick={() => navigate('/login')} className="px-10 py-4 bg-white text-[#26bc61] text-[10px] tracking-[0.18em] uppercase font-black hover:bg-transparent hover:text-white border border-white transition-colors w-full sm:w-auto cursor-pointer">
                                Authenticate Now
                            </button>
                        </div>
                    ) : (
                        <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                            {/* Ticket Reservation Card (Ticket Style) */}
                            <div className="flex flex-col bg-[#ebebeb] text-[#212631] shadow-2xl cursor-pointer group hover:-translate-y-2 transition-transform duration-300 relative" onClick={() => { setReservationType('ticket'); setShowCreateModal(true); }}>
                                {/* Decorative perforated edge effect */}
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#26bc61]"></div>
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-8 h-8 rounded-full bg-[#26bc61]"></div>
                                <div className="absolute left-0 right-0 top-1/2 border-t-2 border-dashed border-[#212631]/20"></div>

                                <div className="p-8 md:p-10 flex flex-col items-center text-center z-10">
                                    <div className="w-12 h-12 bg-[#212631] text-[#ebebeb] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                        <Icons.Ticket />
                                    </div>
                                    <span className="text-[10px] tracking-widest uppercase font-bold text-[#212631]/50 mb-2">Standard Pass</span>
                                    <h3 className="text-2xl md:text-4xl font-black uppercase tracking-tighter text-[#212631] mb-2">Zoo Tickets</h3>
                                    <p className="text-[9px] tracking-[0.18em] uppercase font-bold text-[#212631]/40">Admit One or More</p>
                                </div>
                                <div className="p-8 md:p-10 pt-4 flex-1 flex flex-col justify-between z-10">
                                    <div className="flex flex-col gap-4 mb-8">
                                        <div className="flex items-center justify-between border-b border-[#212631]/10 pb-2">
                                            <span className="text-[10px] tracking-[0.18em] uppercase font-bold text-[#212631]">Adult</span>
                                            <span className="text-sm font-black">₱40</span>
                                        </div>
                                        <div className="flex items-center justify-between border-b border-[#212631]/10 pb-2">
                                            <span className="text-[10px] tracking-[0.18em] uppercase font-bold text-[#212631]">Child (4-17)</span>
                                            <span className="text-sm font-black">₱20</span>
                                        </div>
                                        <div className="flex items-center justify-between border-b border-[#212631]/10 pb-2">
                                            <span className="text-[10px] tracking-[0.18em] uppercase font-bold text-[#212631]">Resident</span>
                                            <span className="text-sm font-black text-[#212631]/50">FREE</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-center pt-6 mt-auto border-t border-[#212631]/10">
                                        <span className="text-[10px] tracking-[0.18em] uppercase font-black text-[#212631] flex items-center gap-2 group-hover:tracking-[0.3em] transition-all">
                                            Initiate Booking <Icons.ArrowRight />
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Event Reservation Card (Ticket Style) */}
                            <div className="flex flex-col bg-[#ebebeb] text-[#212631] shadow-2xl cursor-pointer group hover:-translate-y-2 transition-transform duration-300 relative" onClick={() => { setReservationType('event'); setShowCreateModal(true); }}>
                                {/* Decorative perforated edge effect */}
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#26bc61]"></div>
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-8 h-8 rounded-full bg-[#26bc61]"></div>
                                <div className="absolute left-0 right-0 top-1/2 border-t-2 border-dashed border-[#212631]/20"></div>

                                <div className="p-8 md:p-10 flex flex-col items-center text-center z-10">
                                    <div className="w-12 h-12 bg-[#212631] text-[#ebebeb] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                        <Icons.Calendar />
                                    </div>
                                    <span className="text-[10px] tracking-widest uppercase font-bold text-[#212631]/50 mb-2">Exclusive Access</span>
                                    <h3 className="text-2xl md:text-4xl font-black uppercase tracking-tighter text-[#212631] mb-2">Event Venue</h3>
                                    <p className="text-[9px] tracking-[0.18em] uppercase font-bold text-[#212631]/40">Programs & Private Spots</p>
                                </div>
                                <div className="p-8 md:p-10 pt-4 flex-1 flex flex-col justify-between z-10">
                                    <div className="flex flex-col gap-4 mb-8 text-center">
                                        <p className="text-sm font-bold text-[#212631]/70 leading-relaxed px-4">
                                            Reserve spaces for private events, educational tours, or participate in our seasonal programs.
                                        </p>
                                        <div className="mt-4 py-2 border-t border-b border-[#212631]/10 flex flex-col items-center justify-center">
                                            <span className="text-[9px] tracking-[0.18em] uppercase font-bold text-[#212631]/40 mb-1">Status</span>
                                            <span className="text-xs tracking-[0.2em] uppercase font-black text-green-600">Accepting Slots</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-center pt-6 mt-auto border-t border-[#212631]/10">
                                        <span className="text-[10px] tracking-[0.18em] uppercase font-black text-[#212631] flex items-center gap-2 group-hover:tracking-[0.3em] transition-all">
                                            Select Schedule <Icons.ArrowRight />
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* History Banner */}
                            <div onClick={() => setShowHistoryPanel(true)} className="md:col-span-2 border border-white/20 bg-transparent hover:bg-white text-white hover:text-[#26bc61] transition-colors duration-300 cursor-pointer flex items-center justify-between p-6 md:p-10 group">
                                <div className="flex items-center gap-6">
                                    <div className="w-12 h-12 border border-current flex items-center justify-center shrink-0">
                                        <Icons.History />
                                    </div>
                                    <div className="flex flex-col">
                                        <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter mb-1">Booking Ledger</h3>
                                        <p className="text-[10px] tracking-widest uppercase font-bold opacity-70">View & Manage Past Reservations</p>
                                    </div>
                                </div>
                                <div className="hidden sm:block opacity-50 group-hover:opacity-100 transition-opacity">
                                    <Icons.ArrowRight />
                                </div>
                            </div>
                        </div>
                    )}
                </main>

                {/* Main Creation Modal */}
                <AnimatePresence>
                    {showCreateModal && (
                        <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 md:p-6" onClick={handleCloseAttempt}>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-[#212631]/80 backdrop-blur-md"
                            />

                            <motion.div
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 12 }}
                                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                                className="relative z-10 flex flex-col bg-[#ebebeb] border border-[#212631]/10 w-full h-full md:h-auto md:max-w-3xl md:max-h-[85vh] overflow-hidden shadow-2xl"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between px-6 py-5 border-b border-[#212631]/10 shrink-0 bg-[#ebebeb]">
                                    <span className="text-[10px] tracking-[0.2em] uppercase font-black text-[#212631]">
                                        Reservation Form
                                    </span>
                                    <button
                                        onClick={handleCloseAttempt}
                                        className="w-8 h-8 flex items-center justify-center border border-[#212631]/20 text-[#212631] hover:bg-[#212631] hover:text-[#ebebeb] transition-colors cursor-pointer"
                                        aria-label="Close form"
                                    >
                                        <Icons.Close />
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 border-b border-[#212631]/10 bg-[#ebebeb]">
                                    <button
                                        type="button"
                                        onClick={() => setReservationType('ticket')}
                                        className={`py-5 text-[10px] tracking-[0.2em] uppercase font-black border-r border-[#212631]/10 transition-colors ${reservationType === 'ticket' ? 'bg-[#212631] text-[#ebebeb]' : 'text-[#212631] hover:bg-[#212631]/5'}`}
                                    >
                                        Ticket Allocation
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setReservationType('event')}
                                        className={`py-5 text-[10px] tracking-[0.2em] uppercase font-black transition-colors ${reservationType === 'event' ? 'bg-[#212631] text-[#ebebeb]' : 'text-[#212631] hover:bg-[#212631]/5'}`}
                                    >
                                        Venue Protocol
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 md:p-10">
                                    <form id="reservation-form" onSubmit={handleSubmitAttempt} className="flex flex-col w-full gap-10">
                                        {reservationType === 'ticket' ? (
                                            <>
                                                {/* Ticket Counters Section */}
                                                <div className="flex flex-col gap-0 border border-[#212631]/20 bg-[#ebebeb]">
                                                    {Object.entries(TICKET_TYPES).map(([type, info], index) => (
                                                        <div key={type} className={`flex flex-col sm:flex-row sm:items-center justify-between p-5 gap-4 ${index !== Object.keys(TICKET_TYPES).length - 1 ? 'border-b border-[#212631]/20' : ''}`}>
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-black uppercase tracking-tight text-[#212631]">{info.name}</span>
                                                                <span className="text-[10px] tracking-[0.18em] uppercase font-bold text-[#212631]/50 mt-1">{info.description}</span>
                                                            </div>
                                                            <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                                                                <span className="text-sm font-black text-[#212631] w-12 text-left sm:text-right">{info.price === 0 ? 'FREE' : `₱${info.price}`}</span>
                                                                <div className="flex items-center border border-[#212631]/20 bg-[#ebebeb]">
                                                                    <button type="button" onClick={() => updateTicketCount(type, -1)} disabled={ticketCounts[type] === 0} className="w-10 h-10 flex items-center justify-center text-[#212631] hover:bg-[#212631]/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"><Icons.Minus /></button>
                                                                    <span className="w-12 text-center text-sm font-bold border-l border-r border-[#212631]/20 leading-[40px]">{ticketCounts[type]}</span>
                                                                    <button type="button" onClick={() => updateTicketCount(type, 1)} className="w-10 h-10 flex items-center justify-center text-[#212631] hover:bg-[#212631]/10 transition-colors cursor-pointer"><Icons.Plus /></button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Bulusan Resident ID Upload */}
                                                {ticketCounts.bulusan_resident > 0 && (
                                                    <div className="flex flex-col gap-2">
                                                        <label className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#212631]">Proof of Residency Required *</label>
                                                        <label className="flex flex-col items-center justify-center w-full min-h-[160px] border border-[#212631]/20 bg-[#ebebeb] cursor-pointer hover:bg-[#212631]/5 transition-colors relative overflow-hidden group">
                                                            {residentIdPreview ? (
                                                                <div className="w-full h-full relative flex items-center justify-center p-4">
                                                                    <img src={residentIdPreview} alt="Preview" className="max-h-[200px] object-contain grayscale group-hover:grayscale-0 transition-all" />
                                                                    <button type="button" onClick={(e) => { e.preventDefault(); setResidentIdImage(null); setResidentIdPreview(null); }} className="absolute top-3 right-3 bg-[#212631] text-[#ebebeb] w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-colors z-10"><Icons.Close /></button>
                                                                </div>
                                                            ) : (
                                                                <div className="flex flex-col items-center justify-center text-[#212631]/50 p-8 text-center">
                                                                    <Icons.Upload />
                                                                    <span className="text-[10px] tracking-widest uppercase font-black mt-3 text-[#212631]">Upload Valid ID</span>
                                                                    <span className="text-[9px] tracking-[0.18em] uppercase font-bold mt-1 max-w-[200px]">JPG or PNG. Max 5MB.</span>
                                                                </div>
                                                            )}
                                                            <input type="file" accept="image/*" className="hidden" onChange={handleResidentIdUpload} />
                                                        </label>
                                                        {idUploadError && <p className="text-[10px] tracking-widest uppercase font-bold text-red-600 mt-1">{idUploadError}</p>}
                                                    </div>
                                                )}

                                                {/* Contact & Date Form */}
                                                <div className="flex flex-col gap-5 border-t border-[#212631]/10 pt-8">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                                        <div className="flex flex-col gap-2">
                                                            <label className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#212631]">Primary Contact Name *</label>
                                                            <input type="text" value={ticketForm.visitorName} onChange={e => setTicketForm({ ...ticketForm, visitorName: sanitizeInput(e.target.value) })} className="w-full bg-[#ebebeb] border border-[#212631]/20 p-4 text-sm font-semibold text-[#212631] focus:border-[#212631] outline-none transition-colors" required />
                                                        </div>
                                                        <div className="flex flex-col gap-2">
                                                            <label className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#212631]">Email Address *</label>
                                                            <input type="email" value={ticketForm.visitorEmail} onChange={e => setTicketForm({ ...ticketForm, visitorEmail: sanitizeEmail(e.target.value) })} className="w-full bg-[#ebebeb] border border-[#212631]/20 p-4 text-sm font-semibold text-[#212631] focus:border-[#212631] outline-none transition-colors" required />
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                                        <div className="flex flex-col gap-2">
                                                            <label className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#212631]">Phone (Optional)</label>
                                                            <input type="tel" value={ticketForm.visitorPhone} onChange={e => setTicketForm({ ...ticketForm, visitorPhone: sanitizePhone(e.target.value) })} className="w-full bg-[#ebebeb] border border-[#212631]/20 p-4 text-sm font-semibold text-[#212631] focus:border-[#212631] outline-none transition-colors" />
                                                        </div>
                                                        <div className="flex flex-col gap-2">
                                                            <label className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#212631]">Arrival Date *</label>
                                                            <input type="date" value={ticketForm.reservationDate} onChange={e => setTicketForm({ ...ticketForm, reservationDate: e.target.value })} min={getMinDate()} max={getMaxDate()} className="w-full bg-[#ebebeb] border border-[#212631]/20 p-4 text-sm font-semibold text-[#212631] focus:border-[#212631] outline-none transition-colors uppercase tracking-wider h-[54px]" required />
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col gap-2">
                                                        <label className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#212631]">Special Requirements / Notes</label>
                                                        <textarea value={ticketForm.notes} onChange={e => setTicketForm({ ...ticketForm, notes: sanitizeInput(e.target.value) })} className="w-full bg-[#ebebeb] border border-[#212631]/20 p-4 text-sm font-semibold text-[#212631] focus:border-[#212631] outline-none transition-colors resize-y min-h-[100px]" />
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex flex-col gap-5 pt-2">
                                                <div className="flex flex-col gap-2">
                                                    <label className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#212631]">Event Designation *</label>
                                                    <input type="text" value={eventForm.venueEventName} onChange={e => setEventForm({ ...eventForm, venueEventName: sanitizeInput(e.target.value) })} className="w-full bg-[#ebebeb] border border-[#212631]/20 p-4 text-sm font-semibold text-[#212631] focus:border-[#212631] outline-none transition-colors" required />
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                                    <div className="flex flex-col gap-2">
                                                        <label className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#212631]">Event Date *</label>
                                                        <input type="date" value={eventForm.venueEventDate} onChange={e => setEventForm({ ...eventForm, venueEventDate: e.target.value })} min={getMinDate()} className="w-full bg-[#ebebeb] border border-[#212631]/20 p-4 text-sm font-semibold text-[#212631] focus:border-[#212631] outline-none transition-colors uppercase tracking-wider h-[54px]" required />
                                                    </div>
                                                    <div className="flex flex-col gap-2">
                                                        <label className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#212631]">Event Time</label>
                                                        <input type="time" value={eventForm.venueEventTime} onChange={e => setEventForm({ ...eventForm, venueEventTime: e.target.value })} className="w-full bg-[#ebebeb] border border-[#212631]/20 p-4 text-sm font-semibold text-[#212631] focus:border-[#212631] outline-none transition-colors uppercase tracking-wider h-[54px]" />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                                    <div className="flex flex-col gap-2">
                                                        <label className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#212631]">Headcount (Max 500) *</label>
                                                        <input type="number" value={eventForm.numberOfParticipants} onChange={e => setEventForm({ ...eventForm, numberOfParticipants: e.target.value })} min="1" max="500" className="w-full bg-[#ebebeb] border border-[#212631]/20 p-4 text-sm font-semibold text-[#212631] focus:border-[#212631] outline-none transition-colors" required />
                                                    </div>
                                                    <div className="flex flex-col gap-2">
                                                        <label className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#212631]">Contact Phone</label>
                                                        <input type="tel" value={eventForm.participantPhone} onChange={e => setEventForm({ ...eventForm, participantPhone: sanitizePhone(e.target.value) })} className="w-full bg-[#ebebeb] border border-[#212631]/20 p-4 text-sm font-semibold text-[#212631] focus:border-[#212631] outline-none transition-colors" />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                                    <div className="flex flex-col gap-2">
                                                        <label className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#212631]">Organizer Name *</label>
                                                        <input type="text" value={eventForm.participantName} onChange={e => setEventForm({ ...eventForm, participantName: sanitizeInput(e.target.value) })} className="w-full bg-[#ebebeb] border border-[#212631]/20 p-4 text-sm font-semibold text-[#212631] focus:border-[#212631] outline-none transition-colors" required />
                                                    </div>
                                                    <div className="flex flex-col gap-2">
                                                        <label className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#212631]">Organizer Email *</label>
                                                        <input type="email" value={eventForm.participantEmail} onChange={e => setEventForm({ ...eventForm, participantEmail: sanitizeEmail(e.target.value) })} className="w-full bg-[#ebebeb] border border-[#212631]/20 p-4 text-sm font-semibold text-[#212631] focus:border-[#212631] outline-none transition-colors" required />
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-2">
                                                    <label className="text-[9px] tracking-[0.2em] uppercase font-bold text-[#212631]">Event Details & Requirements</label>
                                                    <textarea value={eventForm.venueEventDescription} onChange={e => setEventForm({ ...eventForm, venueEventDescription: sanitizeInput(e.target.value) })} className="w-full bg-[#ebebeb] border border-[#212631]/20 p-4 text-sm font-semibold text-[#212631] focus:border-[#212631] outline-none transition-colors resize-y min-h-[120px]" />
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex flex-col gap-6 pt-6 border-t border-[#212631]/10 mt-4">
                                            <label className="flex items-start gap-4 cursor-pointer group">
                                                <div className="mt-0.5 relative flex items-center justify-center">
                                                    <input type="checkbox" required className="peer appearance-none w-5 h-5 border border-[#212631]/40 checked:bg-[#212631] checked:border-[#212631] transition-all cursor-pointer" />
                                                    <svg className="absolute w-3 h-3 text-[#ebebeb] pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 14 10" fill="none"><path d="M1 5L5 9L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                                </div>
                                                <p className="text-[10px] tracking-[0.18em] uppercase font-bold text-[#212631]/60 leading-relaxed pt-0.5">
                                                    I acknowledge the <a href="#" className="text-[#212631] hover:underline">Terms of Service</a> & <a href="#" className="text-[#212631] hover:underline">Privacy Policy</a>.
                                                </p>
                                            </label>

                                            {reservationType === 'ticket' && getTotalVisitors() > 0 && (
                                                <div className="flex items-center justify-between border border-[#212631] bg-[#212631] text-[#ebebeb] p-5">
                                                    <span className="text-[10px] tracking-[0.2em] uppercase font-black">Total Due</span>
                                                    <span className="text-xl font-black tracking-tighter">{calculateTotal() === 0 ? 'FREE' : `₱${calculateTotal()}`}</span>
                                                </div>
                                            )}

                                            <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-[#212631] text-[#ebebeb] border border-[#212631] text-[10px] tracking-[0.2em] uppercase font-black hover:bg-transparent hover:text-[#212631] disabled:opacity-50 disabled:pointer-events-none transition-colors cursor-pointer">
                                                {isSubmitting ? 'Processing...' : 'Finalize Booking'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Final Submission Confirmation Modal */}
                <AnimatePresence>
                    {showSubmitConfirm && (
                        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#212631]/80 backdrop-blur-md" />
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#ebebeb] border border-[#212631]/20 w-full max-w-md relative z-10 flex flex-col p-0 overflow-hidden shadow-2xl">
                                <div className="p-8 border-b border-[#212631]/20 flex flex-col items-center text-center">
                                    <div className="w-12 h-12 bg-[#212631] text-[#ebebeb] flex items-center justify-center mb-6">
                                        <Icons.Ticket />
                                    </div>
                                    <h3 className="text-2xl font-black uppercase tracking-tighter text-[#212631] mb-2">Verify Details</h3>
                                    <p className="text-[10px] tracking-[0.18em] uppercase font-bold text-[#212631]/50 leading-relaxed">
                                        Ensure submitted information is accurate.
                                    </p>
                                </div>

                                <div className="p-8 bg-[#212631]/5 flex flex-col gap-4">
                                    {reservationType === 'ticket' ? (
                                        <>
                                            <div className="flex justify-between items-center"><span className="text-[9px] tracking-widest uppercase font-bold text-[#212631]/60">Type</span><span className="text-[10px] font-black uppercase text-[#212631]">Admission</span></div>
                                            <div className="flex justify-between items-center"><span className="text-[9px] tracking-widest uppercase font-bold text-[#212631]/60">Date</span><span className="text-[10px] font-black uppercase text-[#212631]">{formatDate(ticketForm.reservationDate)}</span></div>
                                            <div className="flex justify-between items-center"><span className="text-[9px] tracking-widest uppercase font-bold text-[#212631]/60">Pax</span><span className="text-[10px] font-black uppercase text-[#212631]">{getTotalVisitors()}</span></div>
                                            <div className="flex justify-between items-center pt-4 border-t border-[#212631]/20 mt-1"><span className="text-[9px] tracking-widest uppercase font-black text-[#212631]">Total</span><span className="text-sm font-black text-emerald-600">₱{calculateTotal()}</span></div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex justify-between items-center"><span className="text-[9px] tracking-widest uppercase font-bold text-[#212631]/60">Type</span><span className="text-[10px] font-black uppercase text-[#212631]">Venue</span></div>
                                            <div className="flex justify-between items-center"><span className="text-[9px] tracking-widest uppercase font-bold text-[#212631]/60">Event</span><span className="text-[10px] font-black uppercase text-[#212631] truncate max-w-[150px]">{eventForm.venueEventName}</span></div>
                                            <div className="flex justify-between items-center"><span className="text-[9px] tracking-widest uppercase font-bold text-[#212631]/60">Date</span><span className="text-[10px] font-black uppercase text-[#212631]">{formatDate(eventForm.venueEventDate)}</span></div>
                                            <div className="flex justify-between items-center"><span className="text-[9px] tracking-widest uppercase font-bold text-[#212631]/60">Pax</span><span className="text-[10px] font-black uppercase text-[#212631]">{eventForm.numberOfParticipants}</span></div>
                                        </>
                                    )}
                                </div>

                                <div className="p-8 border-t border-[#212631]/20 flex gap-4 bg-[#ebebeb]">
                                    <button onClick={() => setShowSubmitConfirm(false)} className="flex-1 py-4 border border-[#212631]/20 text-[9px] tracking-[0.18em] uppercase font-black text-[#212631] hover:bg-[#212631]/5 transition-colors cursor-pointer">
                                        Return
                                    </button>
                                    <button onClick={confirmSubmit} disabled={isSubmitting} className="flex-1 py-4 bg-[#212631] border border-[#212631] text-[9px] tracking-[0.18em] uppercase font-black text-[#ebebeb] hover:bg-transparent hover:text-[#212631] disabled:opacity-50 transition-colors cursor-pointer">
                                        {isSubmitting ? 'Wait...' : 'Confirm'}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Success Confirmation Modal */}
                <AnimatePresence>
                    {showConfirmation && confirmationData && (
                        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#212631]/80 backdrop-blur-md" />
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="bg-[#ebebeb] border border-[#212631]/20 w-full max-w-sm p-10 relative z-10 flex flex-col items-center text-center shadow-2xl">
                                <div className="mb-6 text-[#212631]"><Icons.Check /></div>
                                <h3 className="text-3xl font-black uppercase tracking-tighter text-[#212631] mb-2">Confirmed</h3>
                                <p className="text-[10px] tracking-widest uppercase font-bold text-[#212631]/50 mb-8">Reservation securely logged.</p>

                                <div className="w-full border border-[#212631]/20 bg-[#ebebeb] p-6 mb-8 flex flex-col items-center justify-center">
                                    <span className="text-[8px] tracking-[0.3em] uppercase font-bold text-[#212631]/40 mb-2">Reference ID</span>
                                    <span className="text-xl font-black tracking-widest uppercase text-[#212631]">{confirmationData.reference}</span>
                                </div>

                                <div className="w-full flex flex-col gap-3">
                                    <button onClick={closeModal} className="w-full py-4 border border-[#212631]/20 text-[9px] tracking-[0.18em] uppercase font-black text-[#212631] hover:bg-[#212631]/5 transition-colors cursor-pointer">
                                        Dismiss
                                    </button>
                                    <button onClick={() => { closeModal(); setShowHistoryPanel(true); }} className="w-full py-4 bg-[#212631] border border-[#212631] text-[9px] tracking-[0.18em] uppercase font-black text-[#ebebeb] hover:bg-transparent hover:text-[#212631] transition-colors cursor-pointer">
                                        Open Ledger
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Unsaved Changes Discard Modal */}
                <AnimatePresence>
                    {showCloseConfirm && (
                        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#212631]/80 backdrop-blur-md" />
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#ebebeb] border border-[#212631]/20 w-full max-w-sm p-8 relative z-10 flex flex-col text-center items-center shadow-2xl">
                                <div className="mb-6"><Icons.Warning /></div>
                                <h3 className="text-xl font-black uppercase tracking-tighter text-[#212631] mb-2">Discard Form?</h3>
                                <p className="text-[10px] tracking-[0.18em] uppercase font-bold text-[#212631]/60 mb-8 leading-relaxed">
                                    Active changes will be lost. This cannot be undone.
                                </p>
                                <div className="flex w-full gap-4">
                                    <button onClick={() => setShowCloseConfirm(false)} className="flex-1 py-4 border border-[#212631]/20 text-[9px] tracking-[0.18em] uppercase font-black text-[#212631] hover:bg-[#212631]/5 transition-colors cursor-pointer">
                                        Resume
                                    </button>
                                    <button onClick={closeModal} className="flex-1 py-4 bg-red-600 border border-red-600 text-[9px] tracking-[0.18em] uppercase font-black text-white hover:bg-transparent hover:text-red-600 transition-colors cursor-pointer">
                                        Discard
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                <ReservationHistoryPanel isOpen={showHistoryPanel} onClose={() => setShowHistoryPanel(false)} />
                <Footer />
                <AIFloatingButton />
            </div>
        </ReactLenis>
    );
};

export default Reservations;