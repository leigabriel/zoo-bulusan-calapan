import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { ReactLenis } from 'lenis/react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import AIFloatingButton from '../../components/common/AIFloatingButton';
import ReservationHistoryPanel from '../../components/features/ReservationHistoryPanel';
import { useAuth } from '../../hooks/use-auth';
import { reservationAPI, userAPI } from '../../services/api-client';
import { sanitizeInput, sanitizeEmail, sanitizePhone } from '../../utils/sanitize';
import { notify } from '../../utils/toast';
import useScrollLock from '../../hooks/use-scroll-lock';
import { Ticket, Calendar, X, CheckCircle, Plus, Minus, Upload, Clock, ChevronRight, ChevronDown, AlertTriangle } from 'reicon-react';
import { appendConsentRecord } from '../../utils/consent';
import { formatTime12 } from '../../utils/time-format';

const Icons = {
    Ticket: () => <Ticket className="w-5 h-5" />, Calendar: () => <Calendar className="w-5 h-5" />,
    Close: () => <X className="w-4 h-4" />, Check: () => <CheckCircle className="w-8 h-8" />,
    Plus: () => <Plus className="w-4 h-4" />, Minus: () => <Minus className="w-4 h-4" />,
    Upload: () => <Upload className="w-6 h-6" />, History: () => <Clock className="w-6 h-6" />,
    ArrowRight: () => <ChevronRight className="w-5 h-5" />, Warning: () => <AlertTriangle className="w-8 h-8 text-[#212631]" />,
    ChevronDown: () => <ChevronDown className="w-4 h-4" />
};

const TICKET_TYPES = {
    adult: { name: 'Adult Ticket', description: 'Ages 18 and above', price: 40 },
    child: { name: 'Child Ticket', description: 'Ages 4-17', price: 20 },
    bulusan_resident: { name: 'Bulusan Resident', description: 'Free with valid ID', price: 0 }
};

const RESUME_KEY = 'bulusan_reservation_resume_v1';

// One shared field style for every input in the reservation forms. Previously each input
// carried its own className: the date/time ones forced `uppercase tracking-wider` (which
// mangles the displayed value) and used `h-[54px]` with no radius while the rest used
// `p-4 rounded-xl`, so the two families rendered at different heights inside one form.
// White sits on the grey panel so a field reads as a field; text-base is 16px, which stops
// iOS zooming the viewport on focus; min-h keeps every control the same height.
const FIELD_INPUT = 'w-full min-h-[52px] rounded-xl border border-[#212631]/20 bg-white px-4 py-3 text-base font-medium text-[#212631] placeholder:text-[#212631]/40 outline-none transition-colors focus:border-[#212631] focus:ring-2 focus:ring-[#212631]/15';

// Every hour of the 12-hour clock, stored as 24-hour values so the API keeps
// receiving the same format while the visitor sees AM/PM.
const HOURLY_TIME_OPTIONS = Array.from({ length: 24 }, (_, hour) => {
    const value = `${String(hour).padStart(2, '0')}:00`;
    return { value, label: formatTime12(value) };
});

// Zoo ticket visits are accepted from 8:00 AM through 4:00 PM only.
const TICKET_TIME_OPTIONS = HOURLY_TIME_OPTIONS.slice(8, 17);
const TICKET_TIME_VALUES = new Set(TICKET_TIME_OPTIONS.map((option) => option.value));
const CUSTOM_TIME_VALUE = '__custom__';

// Custom ticket times can use any minute inside the same 8:00 AM–4:00 PM window.
const isTicketTimeInWindow = (value) => {
    const match = String(value ?? '').trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
    if (!match) return false;
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (!Number.isInteger(hours) || !Number.isInteger(minutes) || minutes > 59) return false;
    const totalMinutes = hours * 60 + minutes;
    return totalMinutes >= 8 * 60 && totalMinutes <= 16 * 60;
};

// The select keeps the stored 24-hour value while showing it in 12-hour form.
const TimeSelect = ({ value, onChange, options, placeholder, loading = false, ariaLabel, disabled = false }) => {
    const allDisabled = options.length > 0 && options.every((option) => option.disabled);
    const noOptions = !loading && (options.length === 0 || allDisabled);
    // Keep a previously saved time visible even if it predates the fixed slots,
    // so resuming an old form never silently swaps the value under the visitor.
    const selectedMissing = Boolean(value) && !options.some((option) => option.value === value);
    return (
        <div className="relative w-full">
            <select
                value={value ?? ''}
                onChange={onChange}
                className={`${FIELD_INPUT} cursor-pointer appearance-none pr-12 disabled:cursor-not-allowed disabled:opacity-60`}
                disabled={disabled || loading || noOptions}
                required
                aria-label={ariaLabel}
            >
                <option value="" disabled>
                    {loading ? 'Loading times…' : noOptions && !disabled ? 'No times available' : placeholder}
                </option>
                {selectedMissing && <option value={value}>{formatTime12(value)}</option>}
                {options.map((option) => (
                    <option key={option.value} value={option.value} disabled={option.disabled}>
                        {option.label}
                    </option>
                ))}
            </select>
            <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#212631]/50">
                <Icons.ChevronDown />
            </div>
        </div>
    );
};

const Reservations = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isAuthenticated } = useAuth();
    const [, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    // Each card opens its own form, so the modal never mixes ticket and event booking.
    const [reservationType, setReservationType] = useState('ticket');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [confirmationData, setConfirmationData] = useState(null);
    const [ticketCounts, setTicketCounts] = useState({ adult: 0, child: 0 });
    const [ticketForm, setTicketForm] = useState({ reservationDate: '', reservationTime: '', visitorName: '', visitorEmail: '' });
    const [eventForm, setEventForm] = useState({ venueEventName: '', venueEventDate: '', venueEventStartTime: '', venueEventEndTime: '', venueEventDescription: '', numberOfParticipants: 1, participantName: '', participantEmail: '', participantPhone: '', notes: '' });
    const [showHistoryPanel, setShowHistoryPanel] = useState(false);
    // Reservation whose receipt the ledger should open for us (set by "Pay Now").
    const [focusReference, setFocusReference] = useState(null);
    const [paymentReturn, setPaymentReturn] = useState(false);
    const [ticketAvailability, setTicketAvailability] = useState([]);
    const [eventAvailability, setEventAvailability] = useState([]);
    const [ticketDateFull, setTicketDateFull] = useState(false);
    const [customTicketTime, setCustomTicketTime] = useState(false);
    const [eventDateFull, setEventDateFull] = useState(false);
    const [loadingTicketSlots, setLoadingTicketSlots] = useState(false);
    const [loadingEventSlots, setLoadingEventSlots] = useState(false);
    // Booking availability set by the admin. Defaults keep the page usable if the
    // availability request fails, and the backend still enforces the real state.
    const [reservationConfig, setReservationConfig] = useState({ pageEnabled: true, ticketEnabled: true, eventEnabled: true });
    const [configLoading, setConfigLoading] = useState(true);

    // Confirmation modal states
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
    const [showCloseConfirm, setShowCloseConfirm] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                const configRes = await reservationAPI.getReservationConfig();
                if (configRes?.success && configRes.config) {
                    setReservationConfig({
                        pageEnabled: configRes.config.pageEnabled !== false,
                        ticketEnabled: configRes.config.ticketEnabled !== false,
                        eventEnabled: configRes.config.eventEnabled !== false
                    });
                }
            } catch {
                // Keep bookings open when availability cannot be checked.
            } finally {
                setConfigLoading(false);
            }

            if (isAuthenticated) {
                await fetchEvents();
            }
            setLoading(false);
        };
        loadData();
    }, [isAuthenticated]);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const paymentResult = params.get('payment');
        if (!paymentResult) return;

        if (paymentResult === 'success') {
            notify.success('Payment submitted. Your reservation will update after PayMongo confirms it.');
            setPaymentReturn(true);
        } else if (paymentResult === 'cancelled') {
            notify.info('Payment was cancelled. You can try again from reservation history.');
        }
        setShowHistoryPanel(true);
        window.history.replaceState({}, '', window.location.pathname);
    }, []);

    useEffect(() => {
        if (user) {
            const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
            setTicketForm(prev => ({ ...prev, visitorName: fullName, visitorEmail: user.email || '' }));
            setEventForm(prev => ({ ...prev, participantName: fullName, participantEmail: user.email || '' }));
        }
    }, [user]);

    const saveReservationResume = () => {
        try {
            sessionStorage.setItem(RESUME_KEY, JSON.stringify({
                reservationType,
                ticketCounts,
                ticketForm,
                eventForm
            }));
        } catch {
            // Storage can be unavailable in private browsing or restricted contexts.
        }
    };

    useEffect(() => {
        if (!user) return;
        try {
            const raw = sessionStorage.getItem(RESUME_KEY);
            if (!raw) return;
            sessionStorage.removeItem(RESUME_KEY);
            const saved = JSON.parse(raw);
            if (!saved) return;
            if (saved.reservationType) {
                setReservationType(saved.reservationType);
            }
            if (saved.ticketCounts) setTicketCounts(saved.ticketCounts);
            if (saved.ticketForm) {
                setTicketForm(saved.ticketForm);
                setCustomTicketTime(Boolean(saved.ticketForm.reservationTime) && !TICKET_TIME_VALUES.has(saved.ticketForm.reservationTime));
            }
            if (saved.eventForm) setEventForm(saved.eventForm);
            setShowCreateModal(true);
        } catch {
            // Ignore malformed or unavailable resume data.
        }
    }, [user]);

    useEffect(() => {
        if (location.state?.reopenModal === 'create') {
            // Returning from Terms/Privacy must reopen the form the visitor was actually
            // filling in. Without this the modal reopens on whichever type happened to be
            // last in state, so a visitor reading the terms mid-way through an event booking
            // came back to the wrong form.
            const type = location.state.reservationType === 'event' ? 'event' : 'ticket';
            setReservationType(type);
            setShowCreateModal(true);
            window.history.replaceState({}, '', location.pathname);
        }
    }, []);

    // A resumed form or a return from the terms page can target a booking type the
    // admin has since closed. Move to the other open type, or close the form.
    useEffect(() => {
        if (configLoading) return;
        if (!reservationConfig.pageEnabled) {
            setShowCreateModal(false);
            return;
        }
        if (reservationType === 'ticket' && !reservationConfig.ticketEnabled) {
            if (reservationConfig.eventEnabled) {
                setReservationType('event');
            } else {
                setShowCreateModal(false);
            }
        } else if (reservationType === 'event' && !reservationConfig.eventEnabled) {
            if (reservationConfig.ticketEnabled) {
                setReservationType('ticket');
            } else {
                setShowCreateModal(false);
            }
        }
    }, [configLoading, reservationConfig, reservationType]);

    useEffect(() => {
        let cancelled = false;
        const fetchAvailability = async () => {
            if (!ticketForm.reservationDate || reservationType !== 'ticket') return;
            setLoadingTicketSlots(true);
            setTicketAvailability([]);
            try {
                const res = await reservationAPI.getTicketAvailability(ticketForm.reservationDate, 1);
                if (cancelled) return;
                const dateData = res.success && res.dates
                    ? res.dates.find(d => d.date === ticketForm.reservationDate)
                    : null;
                setTicketAvailability(dateData ? dateData.slots.map(slot => ({
                    id: slot.time,
                    label: slot.label,
                    available: slot.remaining,
                    isFull: slot.isFull
                })) : []);
                setTicketDateFull(Boolean(dateData?.isFull));
            } catch {
                if (!cancelled) {
                    setTicketAvailability([]);
                    setTicketDateFull(false);
                }
            } finally {
                if (!cancelled) setLoadingTicketSlots(false);
            }
        };
        fetchAvailability();
        return () => { cancelled = true; };
    }, [ticketForm.reservationDate, reservationType]);

    useEffect(() => {
        let cancelled = false;
        const fetchAvailability = async () => {
            if (!eventForm.venueEventDate || reservationType !== 'event') return;
            setLoadingEventSlots(true);
            try {
                const res = await reservationAPI.getEventAvailability(eventForm.venueEventDate, 1);
                if (cancelled) return;
                if (!res.success || !Array.isArray(res.dates)) {
                    setEventAvailability([]);
                    setEventDateFull(false);
                    return;
                }
                const dateData = res.dates.find(d => d.date === eventForm.venueEventDate);
                setEventAvailability(dateData ? dateData.slots.map(slot => ({
                    id: slot.time,
                    label: slot.label,
                    available: slot.remaining,
                    isFull: slot.isFull
                })) : []);
                setEventDateFull(Boolean(dateData?.isFull));
            } catch {
                if (!cancelled) {
                    // Keep the form usable if availability cannot be fetched; the
                    // backend still enforces capacity on submit.
                    setEventAvailability([]);
                    setEventDateFull(false);
                }
            } finally {
                if (!cancelled) setLoadingEventSlots(false);
            }
        };
        fetchAvailability();
        return () => { cancelled = true; };
    }, [eventForm.venueEventDate, reservationType]);

    useScrollLock(showCreateModal || showConfirmation || showHistoryPanel || showSubmitConfirm || showCloseConfirm);

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
            notify.warning('Maximum 20 visitors per booking.');
            return;
        }
        setTicketCounts(prev => ({ ...prev, [type]: Math.max(0, prev[type] + delta) }));
    };

    const getMinDate = () => new Date().toISOString().split('T')[0];

    const validateTicketForm = () => {
        if (getTotalVisitors() === 0) { notify.warning('Select a ticket first.'); return false; }
        if (!ticketForm.reservationDate) { notify.warning('Please select a visit date.'); return false; }
        if (ticketDateFull) {
            notify.warning('This date is fully booked. Please choose another date.');
            return false;
        }
        if (!isTicketTimeInWindow(ticketForm.reservationTime)) {
            notify.warning('Please select an arrival time between 8:00 AM and 4:00 PM.');
            return false;
        }
        if (!ticketForm.visitorName.trim()) { notify.warning('Please enter your name.'); return false; }
        if (!ticketForm.visitorEmail.trim()) { notify.warning('Please enter your email.'); return false; }
        return true;
    };

    const handleTicketTimeChange = (e) => {
        const value = e.target.value;
        if (value === CUSTOM_TIME_VALUE) {
            setCustomTicketTime(true);
            // Keep a valid time so the custom input opens with the current value.
            if (!isTicketTimeInWindow(ticketForm.reservationTime)) {
                setTicketForm((form) => ({ ...form, reservationTime: '' }));
            }
            return;
        }
        setCustomTicketTime(false);
        setTicketForm((form) => ({ ...form, reservationTime: value }));
    };

    const handleCreateReservation = async () => {
        setIsSubmitting(true);
        try {
            if (reservationType === 'ticket') {
                const res = await reservationAPI.createTicketReservation({
                    visitorName: ticketForm.visitorName,
                    visitorEmail: ticketForm.visitorEmail,
                    reservationDate: ticketForm.reservationDate,
                    reservationTime: ticketForm.reservationTime,
                    adultQuantity: ticketCounts.adult,
                    childQuantity: ticketCounts.child,
                    bulusanResidentQuantity: 0
                });
                if (res.success) {
                    notify.success('Reservation submitted.');
                    appendConsentRecord({
                        type: 'reservation',
                        summary: `Reservation consent for ${res.reservationReference}`,
                        data: {
                            reservationType: 'ticket',
                            reservationReference: res.reservationReference,
                            visitorName: ticketForm.visitorName,
                            visitorEmail: ticketForm.visitorEmail,
                            consented: true
                        }
                    });
                    setConfirmationData({
                        type: 'ticket',
                        reference: res.reservationReference,
                        qrData: res.qrData,
                        date: ticketForm.reservationDate,
                        time: ticketForm.reservationTime,
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
                    venueEventStartTime: eventForm.venueEventStartTime,
                    venueEventEndTime: eventForm.venueEventEndTime,
                    venueEventDescription: eventForm.venueEventDescription,
                    participantName: eventForm.participantName,
                    participantEmail: eventForm.participantEmail,
                    participantPhone: eventForm.participantPhone,
                    numberOfParticipants: parseInt(eventForm.numberOfParticipants),
                    notes: eventForm.notes
                });
                if (res.success) {
                    notify.success('Reservation submitted.');
                    appendConsentRecord({
                        type: 'reservation',
                        summary: `Reservation consent for ${res.reservationReference}`,
                        data: {
                            reservationType: 'event',
                            reservationReference: res.reservationReference,
                            participantName: eventForm.participantName,
                            participantEmail: eventForm.participantEmail,
                            consented: true
                        }
                    });
                    setConfirmationData({
                        type: 'event',
                        reference: res.reservationReference,
                        qrData: res.qrData,
                        eventName: eventForm.venueEventName,
                        eventDate: eventForm.venueEventDate,
                        eventStartTime: eventForm.venueEventStartTime,
                        eventEndTime: eventForm.venueEventEndTime,
                        participants: eventForm.numberOfParticipants,
                        amount: res.paymentAmount
                    });
                    setShowConfirmation(true);
                    resetForms();
                    setShowCreateModal(false);
                } else {
                    throw new Error(res.message || 'Failed to create reservation');
                }
            }
        } catch (err) {
            notify.error(err.message || "Couldn't complete reservation. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForms = () => {
        setTicketCounts({ adult: 0, child: 0 });
        const fullName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '';
        setTicketForm({ reservationDate: '', reservationTime: '', visitorName: fullName, visitorEmail: user?.email || '' });
        setCustomTicketTime(false);
        setEventForm({ venueEventName: '', venueEventDate: '', venueEventStartTime: '', venueEventEndTime: '', venueEventDescription: '', numberOfParticipants: 1, participantName: fullName, participantEmail: user?.email || '', participantPhone: '', notes: '' });
    };

    // Only a booking with a balance can be paid; free entries keep the old buttons.
    const confirmationAmount = confirmationData
        ? (confirmationData.type === 'ticket' ? Number(confirmationData.total || 0) : Number(confirmationData.amount || 0))
        : 0;

    // "Pay Now" jumps into the ledger with this booking's receipt already open,
    // which is where the QR Ph / pay-at-Bulusan options live.
    const handlePayNow = () => {
        const reference = confirmationData?.reference;
        closeModal();
        setFocusReference(reference);
        setShowHistoryPanel(true);
    };

    const handlePayLater = () => {
        closeModal();
    };

    const hasFormData = () => {
        if (reservationType === 'ticket') {
            return getTotalVisitors() > 0 || ticketForm.reservationDate || ticketForm.reservationTime;
        } else {
            return eventForm.venueEventName || eventForm.venueEventDate || eventForm.venueEventStartTime || eventForm.venueEventEndTime || eventForm.venueEventDescription || eventForm.participantPhone;
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
                notify.warning('Provide name and date.');
                return;
            }
            if (!eventForm.venueEventStartTime || !eventForm.venueEventEndTime) {
                notify.warning('Please select the event start and end time.');
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

    // Preset hours plus a custom option for minute-level times inside the window.
    // The backend still reports the four original slots; keep those disabled when full.
    const ticketTimeOptions = [
        ...TICKET_TIME_OPTIONS.map((option) => {
            const slot = ticketAvailability.find((item) => item.id === option.value);
            return { ...option, disabled: ticketDateFull || Boolean(slot?.isFull || (slot && slot.available <= 0)) };
        }),
        { value: CUSTOM_TIME_VALUE, label: 'Custom time…', disabled: ticketDateFull }
    ];

    const eventStartTimeOptions = HOURLY_TIME_OPTIONS.map((option) => {
        const slot = eventAvailability.find((item) => item.id === option.value);
        return { ...option, disabled: eventDateFull || Boolean(slot?.isFull) };
    });

    const scrollToContent = () => {
        document.getElementById('reservation-content')?.scrollIntoView({ behavior: 'smooth' });
    };

    if (loading || configLoading) {
        return (
            <div className="min-h-dvh flex items-center justify-center bg-[#ebebeb]">
                <div className="w-12 h-12 border-[1.5px] border-[#212631]/15 border-t-[#212631] rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <ReactLenis root>
            <div className="bg-[#ebebeb] text-[#212631] relative min-h-dvh">
                <Header />

                {/* Sticky Intro Section */}
                <div className="sticky top-0 w-full h-[70vh] flex flex-col items-center justify-center overflow-hidden z-0 border-b border-[#212631]/10 bg-[#ebebeb]">
                    <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 w-full max-w-5xl h-full">
                        <span className="text-[11px] tracking-[0.3em] uppercase font-bold text-[#212631]/40 mb-6 md:mb-10">
                            Bulusan Zoo Admissions
                        </span>
                        <h1 className="font-extrabold uppercase text-[#212631] leading-[0.85] tracking-tighter"
                            style={{ fontSize: 'clamp(40px, 10vw, 140px)' }}>
                            Reservations
                        </h1>
                        <p className="mt-8 md:mt-10 text-xs md:text-sm tracking-[0.1em] text-[#212631]/60 max-w-2xl font-semibold uppercase leading-relaxed mb-10">
                            Book your next adventure. Secure tickets for a daily visit or reserve a spot at our exclusive upcoming events.
                        </p>

                        {reservationConfig.pageEnabled && (
                            <button
                                onClick={scrollToContent}
                                className="px-8 py-4 bg-[#212631] text-[#ebebeb] border border-[#212631] text-[11px] tracking-[0.2em] uppercase font-black hover:bg-transparent hover:text-[#212631] transition-colors duration-300 cursor-pointer rounded-xl"
                            >
                                Start Booking
                            </button>
                        )}
                    </div>
                </div>

                <main id="reservation-content" className="relative z-10 w-full bg-[#26bc61] min-h-[80vh] flex flex-col items-center pt-20 pb-40 px-4 md:px-8 border-t border-white/20">
                    {!reservationConfig.pageEnabled ? (
                        <div className="w-full max-w-xl bg-transparent border border-white/20 p-12 md:p-16 flex flex-col items-center text-center rounded-2xl">
                            <span className="text-[11px] tracking-[0.18em] uppercase font-bold text-white/50 mb-6">Reservations Closed</span>
                            <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tighter text-white mb-4">Reservation Page is not currently available</h2>
                            <p className="text-xs tracking-widest uppercase font-bold text-white/70 mb-10 leading-relaxed">
                                Online booking is temporarily closed. Please check back later or contact the zoo for assistance.
                            </p>
                            <button onClick={() => navigate('/')} className="px-10 py-4 bg-white text-[#26bc61] text-[11px] tracking-[0.18em] uppercase font-black hover:bg-transparent hover:text-white border border-white transition-colors w-full sm:w-auto cursor-pointer rounded-xl">
                                Back to Home
                            </button>
                        </div>
                    ) : !isAuthenticated ? (
                        <div className="w-full max-w-xl bg-transparent border border-white/20 p-12 md:p-16 flex flex-col items-center text-center rounded-2xl">
                            <span className="text-[11px] tracking-[0.18em] uppercase font-bold text-white/50 mb-6">Access Restricted</span>
                            <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tighter text-white mb-4">Account Required</h2>
                            <p className="text-xs tracking-widest uppercase font-bold text-white/70 mb-10 leading-relaxed">
                                Please authenticate to access the reservation system and manage your bookings.
                            </p>
                            <button onClick={() => navigate('/login')} className="px-10 py-4 bg-white text-[#26bc61] text-[11px] tracking-[0.18em] uppercase font-black hover:bg-transparent hover:text-white border border-white transition-colors w-full sm:w-auto cursor-pointer rounded-xl">
                                Authenticate Now
                            </button>
                        </div>
                    ) : (
                        <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                            {/* Ticket Reservation Card (Ticket Style) */}
                            <div
                                className={`flex flex-col bg-[#ebebeb] text-[#212631] shadow-2xl relative rounded-2xl ${reservationConfig.ticketEnabled ? 'cursor-pointer group hover:-translate-y-2 transition-transform duration-300' : 'cursor-not-allowed opacity-60'}`}
                                onClick={reservationConfig.ticketEnabled ? () => { setReservationType('ticket'); setShowCreateModal(true); } : undefined}
                                aria-disabled={!reservationConfig.ticketEnabled}
                            >
                                {/* Decorative perforated edge effect */}
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#26bc61]"></div>
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-8 h-8 rounded-full bg-[#26bc61]"></div>
                                <div className="absolute left-0 right-0 top-1/2 border-t-2 border-dashed border-[#212631]/20"></div>

                                <div className="p-8 md:p-10 flex flex-col items-center text-center z-10">
                                    <div className="w-12 h-12 bg-[#212631] text-[#ebebeb] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 rounded-xl">
                                        <Icons.Ticket />
                                    </div>
                                    <span className="text-[11px] tracking-widest uppercase font-bold text-[#212631]/50 mb-2">Standard Pass</span>
                                    <h3 className="text-2xl md:text-4xl font-black uppercase tracking-tighter text-[#212631] mb-2">Zoo Tickets</h3>
                                    <p className="text-[11px] tracking-[0.18em] uppercase font-bold text-[#212631]/40">Admit One or More</p>
                                </div>
                                <div className="p-8 md:p-10 pt-4 flex-1 flex flex-col justify-between z-10">
                                    <div className="flex flex-col gap-4 mb-8">
                                        <div className="flex items-center justify-between border-b border-[#212631]/10 pb-2">
                                            <span className="text-[11px] tracking-[0.18em] uppercase font-bold text-[#212631]">Adult</span>
                                            <span className="text-sm font-black">₱40</span>
                                        </div>
                                        <div className="flex items-center justify-between border-b border-[#212631]/10 pb-2">
                                            <span className="text-[11px] tracking-[0.18em] uppercase font-bold text-[#212631]">Child (4-17)</span>
                                            <span className="text-sm font-black">₱20</span>
                                        </div>
                                        <div className="flex items-center justify-between border-b border-[#212631]/10 pb-2">
                                            <span className="text-[11px] tracking-[0.18em] uppercase font-bold text-[#212631]">Resident</span>
                                            <span className="text-sm font-black text-[#212631]/50">FREE</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-center pt-6 mt-auto border-t border-[#212631]/10">
                                        <span className="text-[11px] tracking-[0.18em] uppercase font-black text-[#212631] flex items-center gap-2 group-hover:tracking-[0.3em] transition-all">
                                            {reservationConfig.ticketEnabled ? <>Initiate Booking <Icons.ArrowRight /></> : 'Currently Unavailable'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Event Reservation Card (Ticket Style) */}
                            <div
                                className={`flex flex-col bg-[#ebebeb] text-[#212631] shadow-2xl relative rounded-2xl ${reservationConfig.eventEnabled ? 'cursor-pointer group hover:-translate-y-2 transition-transform duration-300' : 'cursor-not-allowed opacity-60'}`}
                                onClick={reservationConfig.eventEnabled ? () => { setReservationType('event'); setShowCreateModal(true); } : undefined}
                                aria-disabled={!reservationConfig.eventEnabled}
                            >
                                {/* Decorative perforated edge effect */}
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#26bc61]"></div>
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-8 h-8 rounded-full bg-[#26bc61]"></div>
                                <div className="absolute left-0 right-0 top-1/2 border-t-2 border-dashed border-[#212631]/20"></div>

                                <div className="p-8 md:p-10 flex flex-col items-center text-center z-10">
                                    <div className="w-12 h-12 bg-[#212631] text-[#ebebeb] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 rounded-xl">
                                        <Icons.Calendar />
                                    </div>
                                    <span className="text-[11px] tracking-widest uppercase font-bold text-[#212631]/50 mb-2">Exclusive Access</span>
                                    <h3 className="text-2xl md:text-4xl font-black uppercase tracking-tighter text-[#212631] mb-2">Event Venue</h3>
                                    <p className="text-[11px] tracking-[0.18em] uppercase font-bold text-[#212631]/40">Programs & Private Spots</p>
                                </div>
                                <div className="p-8 md:p-10 pt-4 flex-1 flex flex-col justify-between z-10">
                                    <div className="flex flex-col gap-4 mb-8 text-center">
                                        <p className="text-sm font-bold text-[#212631]/70 leading-relaxed px-4">
                                            Reserve spaces for private events, educational tours, or participate in our seasonal programs.
                                        </p>
                                        <div className="mt-4 py-2 border-t border-b border-[#212631]/10 flex flex-col items-center justify-center">
                                            <span className="text-[11px] tracking-[0.18em] uppercase font-bold text-[#212631]/40 mb-1">Status</span>
                                            <span className={`text-xs tracking-[0.2em] uppercase font-black ${reservationConfig.eventEnabled ? 'text-green-600' : 'text-[#212631]/50'}`}>{reservationConfig.eventEnabled ? 'Accepting Slots' : 'Not Accepting Slots'}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-center pt-6 mt-auto border-t border-[#212631]/10">
                                        <span className="text-[11px] tracking-[0.18em] uppercase font-black text-[#212631] flex items-center gap-2 group-hover:tracking-[0.3em] transition-all">
                                            {reservationConfig.eventEnabled ? <>Select Schedule <Icons.ArrowRight /></> : 'Currently Unavailable'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* History Banner */}
                            <div role="button" tabIndex={0} onClick={() => setShowHistoryPanel(true)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShowHistoryPanel(true); } }} className="md:col-span-2 border border-white/20 bg-transparent hover:bg-white text-white hover:text-[#26bc61] transition-colors duration-300 cursor-pointer flex items-center justify-between p-6 md:p-10 group rounded-2xl">
                                <div className="flex items-center gap-6">
                                    <div className="w-12 h-12 border border-current flex items-center justify-center shrink-0 rounded-xl">
                                        <Icons.History />
                                    </div>
                                    <div className="flex flex-col">
                                        <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter mb-1">Booking Ledger</h3>
                                        <p className="text-[11px] tracking-widest uppercase font-bold opacity-70">View & Manage Past Reservations</p>
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
                        <div role="dialog" aria-modal="true" aria-label="Make a reservation" className="fixed inset-0 z-[200] flex items-center justify-center p-0 md:p-6" onClick={handleCloseAttempt}>
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
                                className="relative z-10 flex flex-col bg-[#ebebeb] border border-[#212631]/10 w-full h-full md:h-auto md:max-w-3xl md:max-h-[85vh] overflow-hidden shadow-2xl rounded-2xl"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between px-6 py-5 border-b border-[#212631]/10 shrink-0 bg-[#ebebeb]">
                                    <span className="text-[11px] tracking-[0.2em] uppercase font-black text-[#212631]">
                                        Reservation Form
                                    </span>
                                    <button
                                        onClick={handleCloseAttempt}
                                        className="w-8 h-8 flex items-center justify-center border border-[#212631]/20 text-[#212631] hover:bg-[#212631] hover:text-[#ebebeb] transition-colors cursor-pointer rounded-lg"
                                        aria-label="Close form"
                                    >
                                        <Icons.Close />
                                    </button>
                                </div>

                                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-6 md:p-10" data-lenis-prevent>
                                    <form id="reservation-form" onSubmit={handleSubmitAttempt} className="flex flex-col w-full gap-10">
                                        {reservationType === 'ticket' ? (
                                            <>
                                                {/* Ticket Counters Section */}
                                                <div className="flex flex-col gap-0 border border-[#212631]/20 bg-[#ebebeb] rounded-2xl overflow-hidden">
                                                    {Object.entries(TICKET_TYPES).map(([type, info], index) => {
                                                        const isResident = type === 'bulusan_resident';
                                                        return (
                                                            <div key={type} className={`flex flex-col sm:flex-row sm:items-center justify-between p-5 gap-4 ${index !== Object.keys(TICKET_TYPES).length - 1 ? 'border-b border-[#212631]/20' : ''} ${isResident ? 'bg-[#26bc61]/5' : ''}`}>
                                                                <div className="flex flex-col gap-1">
                                                                    <span className="text-sm font-black uppercase tracking-tight text-[#212631]">{info.name}</span>
                                                                    <span className="text-[11px] tracking-[0.18em] uppercase font-bold text-[#212631]/50">{info.description}</span>
                                                                    {isResident && (
                                                                        <span className="text-[11px] tracking-[0.12em] uppercase font-bold text-[#26bc61] leading-relaxed">
                                                                            Free admission — please bring a valid ID proving you are a resident of Bulusan, Calapan.
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                                                                    <span className="text-sm font-black text-[#212631] w-12 text-left sm:text-right">{info.price === 0 ? 'FREE' : `₱${info.price}`}</span>
                                                                    {isResident ? (
                                                                        <span className="text-[11px] tracking-[0.15em] uppercase font-bold text-[#26bc61] border border-[#26bc61]/30 px-3 py-1.5 rounded-lg">Info Only</span>
                                                                    ) : (
                                                                        <div className="flex items-center border border-[#212631]/20 bg-[#ebebeb] rounded-xl overflow-hidden">
                                                                            <button type="button" onClick={() => updateTicketCount(type, -1)} disabled={ticketCounts[type] === 0} className="w-10 h-10 flex items-center justify-center text-[#212631] hover:bg-[#212631]/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"><Icons.Minus /></button>
                                                                            <span className="w-12 text-center text-sm font-bold border-l border-r border-[#212631]/20 leading-[40px]">{ticketCounts[type]}</span>
                                                                            <button type="button" onClick={() => updateTicketCount(type, 1)} className="w-10 h-10 flex items-center justify-center text-[#212631] hover:bg-[#212631]/10 transition-colors cursor-pointer"><Icons.Plus /></button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {/* Contact & Date Form */}
                                                <div className="flex flex-col gap-5 border-t border-[#212631]/10 pt-8">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                                        <div className="flex flex-col gap-2">
                                                            <label className="text-[11px] tracking-[0.2em] uppercase font-bold text-[#212631]">Primary Contact Name *</label>
                                                            <input type="text" value={ticketForm.visitorName} onChange={e => setTicketForm({ ...ticketForm, visitorName: sanitizeInput(e.target.value) })} className={FIELD_INPUT} placeholder="e.g. Juan Dela Cruz" autoComplete="name" required />
                                                        </div>
                                                        <div className="flex flex-col gap-2">
                                                            <label className="text-[11px] tracking-[0.2em] uppercase font-bold text-[#212631]">Email Address *</label>
                                                            <input type="email" value={ticketForm.visitorEmail} onChange={e => setTicketForm({ ...ticketForm, visitorEmail: sanitizeEmail(e.target.value) })} className={FIELD_INPUT} placeholder="you@example.com" autoComplete="email" required />
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col gap-2">
                                                        <label className="text-[11px] tracking-[0.2em] uppercase font-bold text-[#212631]">Arrival Date *</label>
                                                        <input
                                                            type="date"
                                                            value={ticketForm.reservationDate}
                                                            onChange={e => {
                                                                setTicketForm({ ...ticketForm, reservationDate: e.target.value, reservationTime: '' });
                                                                setCustomTicketTime(false);
                                                            }}
                                                            min={getMinDate()}
                                                            className={FIELD_INPUT}
                                                            required
                                                        />
                                                    </div>

                                                    {ticketForm.reservationDate && (
                                                        <div className="flex flex-col gap-2">
                                                            <label className="text-[11px] tracking-[0.2em] uppercase font-bold text-[#212631]">Arrival Time *</label>
                                                            <TimeSelect
                                                                value={customTicketTime ? CUSTOM_TIME_VALUE : ticketForm.reservationTime}
                                                                onChange={handleTicketTimeChange}
                                                                options={ticketTimeOptions}
                                                                placeholder="Select arrival time"
                                                                loading={loadingTicketSlots}
                                                                ariaLabel="Arrival Time"
                                                            />
                                                            {customTicketTime && (
                                                                <>
                                                                    <input
                                                                        type="time"
                                                                        value={ticketForm.reservationTime}
                                                                        onChange={e => setTicketForm({ ...ticketForm, reservationTime: e.target.value })}
                                                                        min="08:00"
                                                                        max="16:00"
                                                                        step="60"
                                                                        className={`${FIELD_INPUT} disabled:cursor-not-allowed disabled:opacity-60`}
                                                                        disabled={loadingTicketSlots || ticketDateFull}
                                                                        required
                                                                        aria-label="Custom arrival time"
                                                                    />
                                                                    <p className={`text-[11px] ${ticketDateFull ? 'text-rose-600' : 'text-[#212631]/50'}`}>
                                                                        {loadingTicketSlots
                                                                            ? 'Checking availability…'
                                                                            : ticketDateFull
                                                                                ? 'This date is fully booked. Choose another date.'
                                                                                : 'Choose any time from 8:00 AM to 4:00 PM.'}
                                                                    </p>
                                                                </>
                                                            )}
                                                        </div>
                                                    )}

                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex flex-col gap-5 pt-2">
                                                <div className="flex flex-col gap-2">
                                                    <label className="text-[11px] tracking-[0.2em] uppercase font-bold text-[#212631]">Event Designation *</label>
                                                    <input type="text" value={eventForm.venueEventName} onChange={e => setEventForm({ ...eventForm, venueEventName: sanitizeInput(e.target.value) })} className={FIELD_INPUT} placeholder="e.g. Tree Planting Program" required />
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                                    <div className="flex flex-col gap-2">
                                                        <label className="text-[11px] tracking-[0.2em] uppercase font-bold text-[#212631]">Event Date *</label>
                                                        <input type="date" value={eventForm.venueEventDate} onChange={e => setEventForm({ ...eventForm, venueEventDate: e.target.value, venueEventStartTime: '', venueEventEndTime: '' })} min={getMinDate()} className={FIELD_INPUT} required />
                                                    </div>
                                                    <div className="flex flex-col gap-2">
                                                        <label className="text-[11px] tracking-[0.2em] uppercase font-bold text-[#212631]">Event Start Time *</label>
                                                        <TimeSelect
                                                            value={eventForm.venueEventStartTime}
                                                            onChange={e => setEventForm({ ...eventForm, venueEventStartTime: e.target.value })}
                                                            options={eventStartTimeOptions}
                                                            placeholder={eventForm.venueEventDate ? 'Select start time' : 'Select a date first'}
                                                            loading={loadingEventSlots}
                                                            disabled={!eventForm.venueEventDate}
                                                            ariaLabel="Event Start Time"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                                    <div className="flex flex-col gap-2">
                                                        <label className="text-[11px] tracking-[0.2em] uppercase font-bold text-[#212631]">Event End Time *</label>
                                                        <TimeSelect
                                                            value={eventForm.venueEventEndTime}
                                                            onChange={e => setEventForm({ ...eventForm, venueEventEndTime: e.target.value })}
                                                            options={HOURLY_TIME_OPTIONS}
                                                            placeholder={eventForm.venueEventDate ? 'Select end time' : 'Select a date first'}
                                                            loading={loadingEventSlots}
                                                            disabled={!eventForm.venueEventDate}
                                                            ariaLabel="Event End Time"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                                    <div className="flex flex-col gap-2">
                                                        <label className="text-[11px] tracking-[0.2em] uppercase font-bold text-[#212631]">Headcount</label>
                                                        <input type="number" value={eventForm.numberOfParticipants} onChange={e => setEventForm({ ...eventForm, numberOfParticipants: e.target.value })} min="1" max="100" inputMode="numeric" className={FIELD_INPUT} placeholder="How many people?" required />
                                                    </div>
                                                    <div className="flex flex-col gap-2">
                                                        <label className="text-[11px] tracking-[0.2em] uppercase font-bold text-[#212631]">Contact Phone</label>
                                                        <input type="tel" value={eventForm.participantPhone} onChange={e => setEventForm({ ...eventForm, participantPhone: sanitizePhone(e.target.value) })} className={FIELD_INPUT} placeholder="09XX XXX XXXX" autoComplete="tel" />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                                    <div className="flex flex-col gap-2">
                                                        <label className="text-[11px] tracking-[0.2em] uppercase font-bold text-[#212631]">Organizer Name *</label>
                                                        <input type="text" value={eventForm.participantName} onChange={e => setEventForm({ ...eventForm, participantName: sanitizeInput(e.target.value) })} className={FIELD_INPUT} placeholder="e.g. Maria Santos" autoComplete="name" required />
                                                    </div>
                                                    <div className="flex flex-col gap-2">
                                                        <label className="text-[11px] tracking-[0.2em] uppercase font-bold text-[#212631]">Organizer Email *</label>
                                                        <input type="email" value={eventForm.participantEmail} onChange={e => setEventForm({ ...eventForm, participantEmail: sanitizeEmail(e.target.value) })} className={FIELD_INPUT} placeholder="you@example.com" autoComplete="email" required />
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-2">
                                                    <label className="text-[11px] tracking-[0.2em] uppercase font-bold text-[#212631]">Event Details & Requirements</label>
                                                    <textarea value={eventForm.venueEventDescription} onChange={e => setEventForm({ ...eventForm, venueEventDescription: sanitizeInput(e.target.value) })} className={`${FIELD_INPUT} resize-y min-h-[120px]`} placeholder="What is this event about?" />
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex flex-col gap-6 pt-6 border-t border-[#212631]/10 mt-4">
                                            <label className="flex items-start gap-4 cursor-pointer group">
                                                <div className="mt-0.5 relative flex items-center justify-center">
                                                    <input type="checkbox" required className="peer appearance-none w-5 h-5 border border-[#212631]/40 checked:bg-[#212631] checked:border-[#212631] transition-all cursor-pointer rounded-md" />
                                                    <svg className="absolute w-3 h-3 text-[#ebebeb] pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 14 10" fill="none"><path d="M1 5L5 9L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                                </div>
                                                <p className="text-[11px] tracking-[0.18em] uppercase font-bold text-[#212631]/60 leading-relaxed pt-0.5">
                                                    I acknowledge the <Link to="/terms" state={{ from: '/reservations', reopenModal: 'create', reservationType }} onClick={saveReservationResume} className="text-[#212631] hover:underline">Terms of Service</Link> & <Link to="/privacy" state={{ from: '/reservations', reopenModal: 'create', reservationType }} onClick={saveReservationResume} className="text-[#212631] hover:underline">Privacy Policy</Link>.
                                                </p>
                                            </label>

                                            {reservationType === 'ticket' && getTotalVisitors() > 0 && (
                                                <div className="flex items-center justify-between border border-[#212631] bg-[#212631] text-[#ebebeb] p-5 rounded-xl">
                                                    <span className="text-[11px] tracking-[0.2em] uppercase font-black">Total Due</span>
                                                    <span className="text-xl font-black tracking-tighter">{calculateTotal() === 0 ? 'FREE' : `₱${calculateTotal()}`}</span>
                                                </div>
                                            )}

                                            <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-[#212631] text-[#ebebeb] border border-[#212631] text-[11px] tracking-[0.2em] uppercase font-black hover:bg-transparent hover:text-[#212631] disabled:opacity-50 disabled:pointer-events-none transition-colors cursor-pointer rounded-xl">
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
                        <div role="dialog" aria-modal="true" aria-label="Discard reservation form" className="fixed inset-0 z-[250] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#212631]/80 backdrop-blur-md" />
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#ebebeb] border border-[#212631]/20 w-full max-w-md relative z-10 flex flex-col p-0 overflow-hidden shadow-2xl rounded-2xl">
                                <div className="p-8 border-b border-[#212631]/20 flex flex-col items-center text-center">
                                    <div className="w-12 h-12 bg-[#212631] text-[#ebebeb] flex items-center justify-center mb-6 rounded-xl">
                                        <Icons.Ticket />
                                    </div>
                                    <h3 className="text-2xl font-black uppercase tracking-tighter text-[#212631] mb-2">Verify Details</h3>
                                    <p className="text-[11px] tracking-[0.18em] uppercase font-bold text-[#212631]/50 leading-relaxed">
                                        Ensure submitted information is accurate.
                                    </p>
                                </div>

                                <div className="p-8 bg-[#212631]/5 flex flex-col gap-4">
                                    {reservationType === 'ticket' ? (
                                        <>
                                            <div className="flex justify-between items-center"><span className="text-[11px] tracking-widest uppercase font-bold text-[#212631]/60">Type</span><span className="text-[11px] font-black uppercase text-[#212631]">Admission</span></div>
                                            <div className="flex justify-between items-center"><span className="text-[11px] tracking-widest uppercase font-bold text-[#212631]/60">Date</span><span className="text-[11px] font-black uppercase text-[#212631]">{formatDate(ticketForm.reservationDate)}</span></div>
                                            <div className="flex justify-between items-center"><span className="text-[11px] tracking-widest uppercase font-bold text-[#212631]/60">Pax</span><span className="text-[11px] font-black uppercase text-[#212631]">{getTotalVisitors()}</span></div>
                                            <div className="flex justify-between items-center pt-4 border-t border-[#212631]/20 mt-1"><span className="text-[11px] tracking-widest uppercase font-black text-[#212631]">Total</span><span className="text-sm font-black text-emerald-600">₱{calculateTotal()}</span></div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex justify-between items-center"><span className="text-[11px] tracking-widest uppercase font-bold text-[#212631]/60">Type</span><span className="text-[11px] font-black uppercase text-[#212631]">Venue</span></div>
                                            <div className="flex justify-between items-center"><span className="text-[11px] tracking-widest uppercase font-bold text-[#212631]/60">Event</span><span className="text-[11px] font-black uppercase text-[#212631] truncate max-w-[150px]">{eventForm.venueEventName}</span></div>
                                            <div className="flex justify-between items-center"><span className="text-[11px] tracking-widest uppercase font-bold text-[#212631]/60">Date</span><span className="text-[11px] font-black uppercase text-[#212631]">{formatDate(eventForm.venueEventDate)}</span></div>
                                            <div className="flex justify-between items-center"><span className="text-[11px] tracking-widest uppercase font-bold text-[#212631]/60">Start</span><span className="text-[11px] font-black uppercase text-[#212631]">{formatTime12(eventForm.venueEventStartTime) || '-'}</span></div>
                                            <div className="flex justify-between items-center"><span className="text-[11px] tracking-widest uppercase font-bold text-[#212631]/60">End</span><span className="text-[11px] font-black uppercase text-[#212631]">{formatTime12(eventForm.venueEventEndTime) || '-'}</span></div>
                                            <div className="flex justify-between items-center"><span className="text-[11px] tracking-widest uppercase font-bold text-[#212631]/60">Pax</span><span className="text-[11px] font-black uppercase text-[#212631]">{eventForm.numberOfParticipants}</span></div>
                                        </>
                                    )}
                                </div>

                                <div className="p-8 border-t border-[#212631]/20 flex gap-4 bg-[#ebebeb]">
                                    <button onClick={() => setShowSubmitConfirm(false)} className="flex-1 py-4 border border-[#212631]/20 text-[11px] tracking-[0.18em] uppercase font-black text-[#212631] hover:bg-[#212631]/5 transition-colors cursor-pointer rounded-xl">
                                        Return
                                    </button>
                                    <button onClick={confirmSubmit} disabled={isSubmitting} className="flex-1 py-4 bg-[#212631] border border-[#212631] text-[11px] tracking-[0.18em] uppercase font-black text-[#ebebeb] hover:bg-transparent hover:text-[#212631] disabled:opacity-50 transition-colors cursor-pointer rounded-xl">
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
                        <div role="dialog" aria-modal="true" aria-label="Reservation confirmed" className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#212631]/80 backdrop-blur-md" />
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="bg-[#ebebeb] border border-[#212631]/20 w-full max-w-sm p-10 relative z-10 flex flex-col items-center text-center shadow-2xl rounded-2xl">
                                <motion.div
                                    className="mb-6 text-[#212631]"
                                    initial={{ scale: 0.85, opacity: 0 }}
                                    animate={{ scale: [0.85, 1.12, 1], opacity: 1 }}
                                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                >
                                    <Icons.Check />
                                </motion.div>
                                <h3 className="text-3xl font-black uppercase tracking-tighter text-[#212631] mb-2">Confirmed</h3>
                                <p className="text-[11px] tracking-widest uppercase font-bold text-[#212631]/50 mb-8">Reservation securely logged.</p>

                                {confirmationData.reference && (
                                     <div className="mb-8 flex justify-center bg-white p-4 rounded-xl">
                                         <QRCodeSVG
                                             value={`${window.location.origin}/verify/${confirmationData.type}/${encodeURIComponent(confirmationData.reference)}`}
                                             size={240}
                                             level="M"
                                             bgColor="#ffffff"
                                             fgColor="#212631"
                                             style={{ display: 'block', width: '240px', height: '240px' }}
                                         />
                                     </div>
                                 )}

                                <div className="w-full border border-[#212631]/20 bg-[#ebebeb] p-6 mb-8 flex flex-col items-center justify-center rounded-xl">
                                    <span className="text-[11px] tracking-[0.3em] uppercase font-bold text-[#212631]/40 mb-2">Reference ID</span>
                                    <span className="text-xl font-black tracking-widest uppercase text-[#212631]">{confirmationData.reference}</span>
                                </div>

                                <div className="w-full flex flex-col gap-3">
                                    {confirmationAmount > 0 ? (
                                        <>
                                            <button onClick={handlePayNow} className="w-full py-4 bg-[#212631] border border-[#212631] text-[11px] tracking-[0.18em] uppercase font-black text-[#ebebeb] hover:bg-[#26bc61] hover:border-[#26bc61] transition-colors cursor-pointer rounded-xl">
                                                Pay Now
                                            </button>
                                            <button onClick={handlePayLater} className="w-full py-4 border border-[#212631]/20 text-[11px] tracking-[0.18em] uppercase font-black text-[#212631] hover:bg-[#212631]/5 transition-colors cursor-pointer rounded-xl">
                                                Pay Later
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button onClick={closeModal} className="w-full py-4 border border-[#212631]/20 text-[11px] tracking-[0.18em] uppercase font-black text-[#212631] hover:bg-[#212631]/5 transition-colors cursor-pointer rounded-xl">
                                                Dismiss
                                            </button>
                                            <button onClick={() => { closeModal(); setShowHistoryPanel(true); }} className="w-full py-4 bg-[#212631] border border-[#212631] text-[11px] tracking-[0.18em] uppercase font-black text-[#ebebeb] hover:bg-transparent hover:text-[#212631] transition-colors cursor-pointer rounded-xl">
                                                Open Ledger
                                            </button>
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Unsaved Changes Discard Modal */}
                <AnimatePresence>
                    {showCloseConfirm && (
                        <div role="dialog" aria-modal="true" aria-label="Discard reservation form" className="fixed inset-0 z-[250] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#212631]/80 backdrop-blur-md" />
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#ebebeb] border border-[#212631]/20 w-full max-w-sm p-8 relative z-10 flex flex-col text-center items-center shadow-2xl rounded-2xl">
                                <div className="mb-6"><Icons.Warning /></div>
                                <h3 className="text-xl font-black uppercase tracking-tighter text-[#212631] mb-2">Discard Form?</h3>
                                <p className="text-[11px] tracking-[0.18em] uppercase font-bold text-[#212631]/60 mb-8 leading-relaxed">
                                    Active changes will be lost. This cannot be undone.
                                </p>
                                <div className="flex w-full gap-4">
                                    <button onClick={() => setShowCloseConfirm(false)} className="flex-1 py-4 border border-[#212631]/20 text-[11px] tracking-[0.18em] uppercase font-black text-[#212631] hover:bg-[#212631]/5 transition-colors cursor-pointer rounded-xl">
                                        Resume
                                    </button>
                                    <button onClick={closeModal} className="flex-1 py-4 bg-red-600 border border-red-600 text-[11px] tracking-[0.18em] uppercase font-black text-white hover:bg-transparent hover:text-red-600 transition-colors cursor-pointer rounded-xl">
                                        Discard
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                <ReservationHistoryPanel isOpen={showHistoryPanel} paymentReturn={paymentReturn} focusReference={focusReference} onFocusHandled={() => setFocusReference(null)} onClose={() => { setFocusReference(null); setShowHistoryPanel(false); }} />
                <Footer />
                <AIFloatingButton />
            </div>
        </ReactLenis>
    );
};

export default Reservations;
