import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { ReactLenis } from 'lenis/react';
import AIFloatingButton from '../../components/common/AIFloatingButton';
import ReservationHistoryPanel from '../../components/features/ReservationHistoryPanel';
import { useAuth } from '../../hooks/use-auth';
import { reservationAPI, userAPI } from '../../services/api-client';
import { sanitizeInput, sanitizeEmail, sanitizePhone } from '../../utils/sanitize';

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
    Check: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
        </svg>
    ),
    Plus: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
        </svg>
    ),
    Minus: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M4.5 12a.75.75 0 01.75-.75h13.5a.75.75 0 010 1.5H5.25a.75.75 0 01-.75-.75z" clipRule="evenodd" />
        </svg>
    ),
    User: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
        </svg>
    ),
    Child: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
        </svg>
    ),
    Home: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
            <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
        </svg>
    ),
    Upload: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path fillRule="evenodd" d="M11.47 2.47a.75.75 0 011.06 0l4.5 4.5a.75.75 0 01-1.06 1.06l-3.22-3.22V16.5a.75.75 0 01-1.5 0V4.81L8.03 8.03a.75.75 0 01-1.06-1.06l4.5-4.5zM3 15.75a.75.75 0 01.75.75v2.25a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5V16.5a.75.75 0 011.5 0v2.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V16.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
        </svg>
    ),
    History: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clipRule="evenodd" />
        </svg>
    ),
    ArrowRight: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M12.97 3.97a.75.75 0 011.06 0l7.5 7.5a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 11-1.06-1.06l6.22-6.22H3a.75.75 0 010-1.5h16.19l-6.22-6.22a.75.75 0 010-1.06z" clipRule="evenodd" />
        </svg>
    )
};

const TICKET_TYPES = {
    adult: { name: 'Adult Ticket', description: 'Ages 18 and above', price: 40, color: 'bg-emerald-500' },
    child: { name: 'Child Ticket', description: 'Ages 4-17', price: 20, color: 'bg-blue-500' },
    bulusan_resident: { name: 'Bulusan Resident', description: 'Free with valid ID', price: 0, color: 'bg-teal-500' }
};

const Reservations = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [reservationType, setReservationType] = useState('ticket');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [confirmationData, setConfirmationData] = useState(null);
    const [ticketCounts, setTicketCounts] = useState({ adult: 0, child: 0, bulusan_resident: 0 });
    const [ticketForm, setTicketForm] = useState({ reservationDate: '', visitorName: '', visitorEmail: '', visitorPhone: '', notes: '' });
    const [residentIdImage, setResidentIdImage] = useState(null);
    const [residentIdPreview, setResidentIdPreview] = useState(null);
    const [idUploadError, setIdUploadError] = useState('');
    const [eventForm, setEventForm] = useState({ venueEventName: '', venueEventDate: '', venueEventTime: '', venueEventDescription: '', numberOfParticipants: 1, participantName: '', participantEmail: '', participantPhone: '', notes: '' });
    const [showHistoryPanel, setShowHistoryPanel] = useState(false);

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
        if (showCreateModal || showConfirmation || showHistoryPanel) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [showCreateModal, showConfirmation, showHistoryPanel]);

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
            setMessage({ text: 'Maximum 20 visitors per reservation', type: 'error' });
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
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
        if (getTotalVisitors() === 0) { setMessage({ text: 'Please select at least one ticket', type: 'error' }); return false; }
        if (!ticketForm.reservationDate) { setMessage({ text: 'Please select a reservation date', type: 'error' }); return false; }
        if (!ticketForm.visitorName.trim()) { setMessage({ text: 'Please enter your name', type: 'error' }); return false; }
        if (!ticketForm.visitorEmail.trim()) { setMessage({ text: 'Please enter your email', type: 'error' }); return false; }
        if (ticketCounts.bulusan_resident > 0 && !residentIdImage) { setMessage({ text: 'Please upload your Bulusan resident ID for verification', type: 'error' }); return false; }
        return true;
    };

    const handleCreateReservation = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage({ text: '', type: '' });
        try {
            if (reservationType === 'ticket') {
                if (!validateTicketForm()) { setIsSubmitting(false); return; }
                const res = await reservationAPI.createTicketReservation({
                    visitorName: ticketForm.visitorName,
                    visitorEmail: ticketForm.visitorEmail,
                    visitorPhone: ticketForm.visitorPhone,
                    reservationDate: ticketForm.reservationDate,
                    adultQuantity: ticketCounts.adult,
                    childQuantity: ticketCounts.child,
                    bulusanResidentQuantity: ticketCounts.bulusan_resident,
                    residentIdImage: residentIdPreview,
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
                if (!eventForm.venueEventName || !eventForm.venueEventDate) { setMessage({ text: 'Please provide event name and date', type: 'error' }); setIsSubmitting(false); return; }
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
            setMessage({ text: err.message || 'Failed to create reservation', type: 'error' });
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
        setMessage({ text: '', type: '' });
    };

    const closeModal = () => {
        setShowCreateModal(false);
        setShowConfirmation(false);
        setConfirmationData(null);
        resetForms();
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <ReactLenis root>
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex flex-col text-[#2A2A2A]">
                <Header />
                <section className="relative px-4 md:px-6 pt-24 pb-8 md:pt-40 md:pb-16 max-w-7xl mx-auto w-full">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                        <div className="max-w-2xl text-left">
                            <h1 className="text-3xl md:text-6xl lg:text-7xl font-bold uppercase leading-tight md:leading-[0.9] tracking-tighter mb-4 md:mb-6">Make a<br />Reservation</h1>
                            <p className="text-sm md:text-lg font-medium opacity-80 max-w-md leading-relaxed">Book your zoo visit or reserve a spot at upcoming events.</p>
                        </div>
                    </div>
                </section>

                <div className="container mx-auto px-4 md:px-6 py-4 md:py-8 flex-grow">
                    {!isAuthenticated ? (
                        <div className="bg-white rounded-2xl p-8 md:p-12 text-center shadow-lg max-w-lg mx-auto">
                            <div className="w-20 h-20 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-emerald-600"><Icons.Ticket /></div>
                            <h3 className="text-2xl font-bold mb-3">Sign in to make reservations</h3>
                            <p className="text-gray-500 mb-8">You need to be logged in to create and manage your reservations.</p>
                            <button onClick={() => navigate('/login')} className="inline-block px-10 py-4 bg-[#2A2A2A] text-white text-sm uppercase tracking-wider font-bold hover:bg-black transition-all rounded-xl">Sign In</button>
                        </div>
                    ) : (
                        <div className="grid lg:grid-cols-2 gap-6 md:gap-8 max-w-6xl mx-auto">
                            <div onClick={() => { setReservationType('ticket'); setShowCreateModal(true); }} className="group bg-white rounded-2xl p-6 md:p-8 shadow-sm hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-emerald-500">
                                <div className="flex items-start gap-4 mb-6">
                                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center text-white shrink-0"><Icons.Ticket /></div>
                                    <div><h3 className="text-xl md:text-2xl font-bold mb-1">Zoo Visit Reservation</h3><p className="text-gray-500 text-sm">Book tickets for your zoo visit</p></div>
                                </div>
                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center gap-3 text-sm"><span className="w-3 h-3 bg-emerald-500 rounded-full"></span><span>Adult: ₱40</span></div>
                                    <div className="flex items-center gap-3 text-sm"><span className="w-3 h-3 bg-blue-500 rounded-full"></span><span>Child (4-17): ₱20</span></div>
                                    <div className="flex items-center gap-3 text-sm"><span className="w-3 h-3 bg-teal-500 rounded-full"></span><span>Bulusan Resident: FREE</span></div>
                                </div>
                                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                    <span className="text-sm font-medium text-emerald-600">Create Reservation</span>
                                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-all"><Icons.ArrowRight /></div>
                                </div>
                            </div>
                            <div onClick={() => { setReservationType('event'); setShowCreateModal(true); }} className="group bg-white rounded-2xl p-6 md:p-8 shadow-sm hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-purple-500">
                                <div className="flex items-start gap-4 mb-6">
                                    <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white shrink-0"><Icons.Calendar /></div>
                                    <div><h3 className="text-xl md:text-2xl font-bold mb-1">Event Reservation</h3><p className="text-gray-500 text-sm">Join upcoming zoo events</p></div>
                                </div>
                                <div className="space-y-3 mb-6">
                                    <p className="text-sm text-gray-600">Reserve your spot for special events and programs.</p>
                                    {events.length > 0 && <p className="text-sm font-medium text-purple-600">{events.length} upcoming event{events.length !== 1 ? 's' : ''} available</p>}
                                </div>
                                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                    <span className="text-sm font-medium text-purple-600">Browse Events</span>
                                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 group-hover:bg-purple-500 group-hover:text-white transition-all"><Icons.ArrowRight /></div>
                                </div>
                            </div>
                            <button onClick={() => setShowHistoryPanel(true)} className="lg:col-span-2 group bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 md:p-8 shadow-lg hover:shadow-2xl transition-all text-left">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-white"><Icons.History /></div>
                                        <div><h3 className="text-xl md:text-2xl font-bold text-white mb-1">Reservation History</h3><p className="text-gray-400 text-sm">View and manage your past reservations</p></div>
                                    </div>
                                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white group-hover:bg-white group-hover:text-gray-900 transition-all"><Icons.ArrowRight /></div>
                                </div>
                            </button>
                        </div>
                    )}
                </div>

                {/* MODAL FORM REFACTORED */}
                <div className={`fixed inset-0 z-[100] transition-all duration-300 flex items-center justify-center p-4 sm:p-6 ${showCreateModal ? 'bg-black/40 backdrop-blur-sm pointer-events-auto opacity-100' : 'bg-transparent pointer-events-none opacity-0'}`} onClick={closeModal}>
                    <div className={`w-full max-w-xl bg-[#F4F4F0] rounded-xl shadow-2xl flex flex-col max-h-full md:max-h-[90vh] transform transition-all duration-300 ease-out overflow-hidden ${showCreateModal ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`} onClick={(e) => e.stopPropagation()}>

                        <div className="px-6 py-6 md:px-8 md:py-8 flex items-start justify-between shrink-0">
                            <div>
                                <h3 className="text-2xl font-normal text-gray-900 mb-2">
                                    {reservationType === 'ticket' ? 'Schedule a visit' : 'Book an event'}
                                </h3>
                                <p className="text-sm text-gray-600 leading-relaxed max-w-[90%]">
                                    Our team is here to answer your questions and arrange a {reservationType === 'ticket' ? 'tour of our spaces' : 'venue for your event'}.
                                </p>
                            </div>
                            <button onClick={closeModal} className="p-2 -mt-2 -mr-2 text-gray-400 hover:text-gray-900 transition-colors"><Icons.Close /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-6 md:px-8 pb-8 overscroll-contain">
                            {message.text && (
                                <div className={`p-4 rounded-lg mb-6 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                                    {message.text}
                                </div>
                            )}

                            <form id="reservation-form" onSubmit={handleCreateReservation} className="space-y-6">

                                {/* Minimalist Tabs Switcher */}
                                <div className="flex gap-6 border-b border-gray-200 mb-6">
                                    <button type="button" onClick={() => setReservationType('ticket')} className={`pb-3 text-sm font-medium transition-colors relative ${reservationType === 'ticket' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}>
                                        Tickets
                                        {reservationType === 'ticket' && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-gray-900"></span>}
                                    </button>
                                    <button type="button" onClick={() => setReservationType('event')} className={`pb-3 text-sm font-medium transition-colors relative ${reservationType === 'event' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}>
                                        Venue
                                        {reservationType === 'event' && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-gray-900"></span>}
                                    </button>
                                </div>

                                {reservationType === 'ticket' ? (
                                    <div className="space-y-8">
                                        <div className="space-y-2">
                                            {Object.entries(TICKET_TYPES).map(([type, info]) => (
                                                <div key={type} className="flex items-center justify-between py-3 border-b border-gray-200/60">
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">{info.name}</p>
                                                        <p className="text-xs text-gray-500 mt-0.5">{info.description}</p>
                                                    </div>
                                                    <div className="flex items-center gap-6">
                                                        <span className="text-sm text-gray-600">{info.price === 0 ? 'Free' : `₱${info.price}`}</span>
                                                        <div className="flex items-center gap-4">
                                                            <button type="button" onClick={() => updateTicketCount(type, -1)} disabled={ticketCounts[type] === 0} className="text-gray-400 hover:text-gray-900 disabled:opacity-30 transition-colors"><Icons.Minus /></button>
                                                            <span className="w-5 text-center text-sm">{ticketCounts[type]}</span>
                                                            <button type="button" onClick={() => updateTicketCount(type, 1)} className="text-gray-400 hover:text-gray-900 transition-colors"><Icons.Plus /></button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                            {ticketCounts.bulusan_resident > 0 && (
                                                <div className="pt-4">
                                                    <label className="flex flex-col items-center justify-center w-full h-24 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-black/5 transition-colors relative overflow-hidden">
                                                        {residentIdPreview ? (
                                                            <div className="w-full h-full relative flex items-center justify-center p-2 bg-white/50">
                                                                <img src={residentIdPreview} alt="Preview" className="h-full object-contain" />
                                                                <button type="button" onClick={(e) => { e.preventDefault(); setResidentIdImage(null); setResidentIdPreview(null); }} className="absolute top-2 right-2 bg-gray-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">×</button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col items-center justify-center text-gray-500">
                                                                <Icons.Upload />
                                                                <span className="text-xs font-medium mt-2">Upload ID Proof</span>
                                                            </div>
                                                        )}
                                                        <input type="file" accept="image/*" className="hidden" onChange={handleResidentIdUpload} />
                                                    </label>
                                                    {idUploadError && <p className="text-xs text-red-500 mt-2">{idUploadError}</p>}
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-4">
                                            <input type="text" value={ticketForm.visitorName} onChange={e => setTicketForm({ ...ticketForm, visitorName: sanitizeInput(e.target.value) })} placeholder="Full name*" className="w-full bg-transparent border-b border-gray-300 py-3 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-gray-900 transition-colors" required />
                                            <input type="email" value={ticketForm.visitorEmail} onChange={e => setTicketForm({ ...ticketForm, visitorEmail: sanitizeEmail(e.target.value) })} placeholder="Email*" className="w-full bg-transparent border-b border-gray-300 py-3 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-gray-900 transition-colors" required />
                                            <input type="tel" value={ticketForm.visitorPhone} onChange={e => setTicketForm({ ...ticketForm, visitorPhone: sanitizePhone(e.target.value) })} placeholder="Phone (Optional)" className="w-full bg-transparent border-b border-gray-300 py-3 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-gray-900 transition-colors" />

                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="space-y-1">
                                                    <label className="text-xs text-gray-500">Arrival date*</label>
                                                    <input type="date" value={ticketForm.reservationDate} onChange={e => setTicketForm({ ...ticketForm, reservationDate: e.target.value })} min={getMinDate()} max={getMaxDate()} className="w-full bg-transparent border-b border-gray-300 py-2 text-sm text-gray-900 focus:outline-none focus:border-gray-900 transition-colors" required />
                                                </div>
                                            </div>

                                            <input type="text" value={ticketForm.notes} onChange={e => setTicketForm({ ...ticketForm, notes: sanitizeInput(e.target.value) })} placeholder="Additional notes" className="w-full bg-transparent border-b border-gray-300 py-3 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-gray-900 transition-colors" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <input type="text" value={eventForm.venueEventName} onChange={e => setEventForm({ ...eventForm, venueEventName: sanitizeInput(e.target.value) })} placeholder="Event name*" className="w-full bg-transparent border-b border-gray-300 py-3 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-gray-900 transition-colors" required />

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-1">
                                                <label className="text-xs text-gray-500">Event date*</label>
                                                <input type="date" value={eventForm.venueEventDate} onChange={e => setEventForm({ ...eventForm, venueEventDate: e.target.value })} min={getMinDate()} className="w-full bg-transparent border-b border-gray-300 py-2 text-sm text-gray-900 focus:outline-none focus:border-gray-900 transition-colors" required />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs text-gray-500">Event time</label>
                                                <input type="time" value={eventForm.venueEventTime} onChange={e => setEventForm({ ...eventForm, venueEventTime: e.target.value })} className="w-full bg-transparent border-b border-gray-300 py-2 text-sm text-gray-900 focus:outline-none focus:border-gray-900 transition-colors" />
                                            </div>
                                        </div>

                                        <input type="number" value={eventForm.numberOfParticipants} onChange={e => setEventForm({ ...eventForm, numberOfParticipants: e.target.value })} placeholder="Number of participants*" min="1" max="500" className="w-full bg-transparent border-b border-gray-300 py-3 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-gray-900 transition-colors" required />
                                        <input type="text" value={eventForm.participantName} onChange={e => setEventForm({ ...eventForm, participantName: sanitizeInput(e.target.value) })} placeholder="Organizer name*" className="w-full bg-transparent border-b border-gray-300 py-3 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-gray-900 transition-colors" required />
                                        <input type="email" value={eventForm.participantEmail} onChange={e => setEventForm({ ...eventForm, participantEmail: sanitizeEmail(e.target.value) })} placeholder="Email*" className="w-full bg-transparent border-b border-gray-300 py-3 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-gray-900 transition-colors" required />
                                        <input type="tel" value={eventForm.participantPhone} onChange={e => setEventForm({ ...eventForm, participantPhone: sanitizePhone(e.target.value) })} placeholder="Phone (Optional)" className="w-full bg-transparent border-b border-gray-300 py-3 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-gray-900 transition-colors" />
                                        <input type="text" value={eventForm.venueEventDescription} onChange={e => setEventForm({ ...eventForm, venueEventDescription: sanitizeInput(e.target.value) })} placeholder="Event description" className="w-full bg-transparent border-b border-gray-300 py-3 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-gray-900 transition-colors" />
                                    </div>
                                )}

                                <div className="flex items-start gap-3 pt-6">
                                    <div className="mt-0.5">
                                        <input type="checkbox" required className="w-4 h-4 rounded-sm border-gray-300 text-gray-900 focus:ring-gray-900 bg-transparent" />
                                    </div>
                                    <p className="text-sm text-gray-600 leading-relaxed">
                                        I accept Zoo Bulusan's <a href="#" className="underline hover:text-gray-900">Terms of Service</a> and acknowledge that I have read the <a href="#" className="underline hover:text-gray-900">Privacy Policy</a>.
                                    </p>
                                </div>

                                {reservationType === 'ticket' && getTotalVisitors() > 0 && (
                                    <div className="flex items-center justify-between pt-2">
                                        <span className="text-sm text-gray-500">Total Due</span>
                                        <span className="text-lg font-medium text-gray-900">{calculateTotal() === 0 ? 'Free' : `₱${calculateTotal()}`}</span>
                                    </div>
                                )}

                                <div className="pt-2">
                                    <button type="submit" disabled={isSubmitting} className="w-full py-3.5 bg-[#C2C0B8] hover:bg-[#b0aeA5] text-gray-900 text-sm font-medium rounded-lg transition-colors disabled:opacity-50">
                                        {isSubmitting ? 'Processing...' : (reservationType === 'ticket' ? 'Schedule a visit' : 'Book event')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Confirmation Modal */}
                {showConfirmation && confirmationData && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
                        <div className="bg-[#F4F4F0] rounded-2xl w-full max-w-sm p-8 relative z-10 text-center shadow-2xl animate-in zoom-in duration-300">
                            <div className="w-16 h-16 bg-gray-200 text-gray-900 rounded-full flex items-center justify-center mx-auto mb-6"><Icons.Check /></div>
                            <h3 className="text-2xl font-normal text-gray-900 mb-2">Reserved</h3>
                            <p className="text-sm text-gray-500 mb-6">Your booking has been secured.</p>

                            <div className="bg-white/50 rounded-xl p-6 mb-6">
                                <span className="text-xs text-gray-500 uppercase tracking-widest block mb-1">Ref Number</span>
                                <span className="text-xl font-mono text-gray-900">{confirmationData.reference}</span>
                            </div>

                            <div className="space-y-3 mb-8 text-left text-sm">
                                {confirmationData.type === 'ticket' ? (
                                    <>
                                        <div className="flex justify-between border-b border-gray-200 pb-2"><span className="text-gray-500">Date</span><span className="font-medium text-gray-900">{formatDate(confirmationData.date)}</span></div>
                                        <div className="flex justify-between border-b border-gray-200 pb-2"><span className="text-gray-500">Visitors</span><span className="font-medium text-gray-900">{confirmationData.visitors}</span></div>
                                        <div className="flex justify-between font-medium text-gray-900 text-base pt-1"><span>Total</span><span>{confirmationData.total === 0 ? 'Free' : `₱${confirmationData.total}`}</span></div>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex justify-between border-b border-gray-200 pb-2"><span className="text-gray-500">Event</span><span className="font-medium text-gray-900 text-right">{confirmationData.eventName}</span></div>
                                        <div className="flex justify-between pt-1"><span className="text-gray-500">Date</span><span className="font-medium text-gray-900">{formatDate(confirmationData.eventDate)}</span></div>
                                    </>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <button onClick={closeModal} className="flex-1 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 text-sm font-medium rounded-lg transition-colors">Close</button>
                                <button onClick={() => { closeModal(); setShowHistoryPanel(true); }} className="flex-1 py-3 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition-colors">History</button>
                            </div>
                        </div>
                    </div>
                )}

                <ReservationHistoryPanel isOpen={showHistoryPanel} onClose={() => setShowHistoryPanel(false)} />
                <Footer />
                <AIFloatingButton />
            </div>
        </ReactLenis>
    );
};

export default Reservations;