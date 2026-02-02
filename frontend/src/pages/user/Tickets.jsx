import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { useAuth } from '../../hooks/use-auth';
import { userAPI } from '../../services/api-client';
import { sanitizeInput, sanitizeEmail, sanitizePhone, sanitizeFormData } from '../../utils/sanitize';

const Tickets = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const [currentStep, setCurrentStep] = useState(1);
    const [counts, setCounts] = useState({ adults: 0, children: 0, seniors: 0, residents: 0 });
    const prices = { adults: 40, children: 20, seniors: 30, residents: 0 };
    const [total, setTotal] = useState(0);
    const [companions, setCompanions] = useState([]);
    const [bookingDetails, setBookingDetails] = useState({
        date: '',
        time: '08:00',
        email: user?.email || '',
        phone: '',
        specialRequests: '',
        paymentMethod: 'pay_at_park'
    });
    const [message, setMessage] = useState({ text: '', type: '' });
    const [isProcessing, setIsProcessing] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [bookingCode, setBookingCode] = useState('');
    const [selectedDate, setSelectedDate] = useState(null);
    const [promoCode, setPromoCode] = useState('');
    const [discount, setDiscount] = useState(0);

    const ticketTypes = {
        adults: {
            name: 'Adult Pass',
            description: 'Ages 18-59',
            icon: 'fa-user',
            color: 'bg-green-500'
        },
        children: {
            name: 'Child Pass',
            description: 'Ages 4-17',
            icon: 'fa-child',
            color: 'bg-blue-500'
        },
        seniors: {
            name: 'Senior Pass',
            description: 'Ages 60+',
            icon: 'fa-user-clock',
            color: 'bg-purple-500'
        },
        residents: {
            name: 'Bulusan Resident',
            description: 'Free with valid ID',
            icon: 'fa-home',
            color: 'bg-teal-500'
        }
    };

    const defaultTimeSlots = [
        { value: '08:00', label: '8:00 AM - Morning' },
        { value: '10:00', label: '10:00 AM - Mid-Morning' },
        { value: '12:00', label: '12:00 PM - Noon' },
        { value: '14:00', label: '2:00 PM - Afternoon' },
        { value: '16:00', label: '4:00 PM - Late Afternoon' }
    ];
    
    const [timeSlots, setTimeSlots] = useState(defaultTimeSlots.map(slot => ({ ...slot, available: true })));
    const [slotsLoading, setSlotsLoading] = useState(false);

    useEffect(() => {
        let sum = 0;
        for (const key in counts) {
            sum += counts[key] * prices[key];
        }
        const discountAmount = sum * (discount / 100);
        setTotal(sum - discountAmount);

        const newCompanions = [];
        let counter = 1;
        Object.keys(counts).forEach(type => {
            for (let i = 0; i < counts[type]; i++) {
                newCompanions.push({
                    id: counter++,
                    type: ticketTypes[type].name,
                    typeKey: type,
                    name: ''
                });
            }
        });
        setCompanions(newCompanions);
    }, [counts, discount]);

    // Fetch slot availability when date changes
    useEffect(() => {
        const fetchSlotAvailability = async () => {
            if (!bookingDetails.date) return;
            
            setSlotsLoading(true);
            try {
                const response = await userAPI.getSlotAvailability(bookingDetails.date);
                if (response.success && response.slots) {
                    // Merge availability data with default slots
                    setTimeSlots(defaultTimeSlots.map(slot => {
                        const serverSlot = response.slots.find(s => s.time === slot.value);
                        return {
                            ...slot,
                            available: serverSlot ? serverSlot.available : true,
                            bookedCount: serverSlot ? serverSlot.bookedCount : 0,
                            capacity: serverSlot ? serverSlot.capacity : 100
                        };
                    }));
                } else {
                    // If API doesn't return slots, all are available
                    setTimeSlots(defaultTimeSlots.map(slot => ({ ...slot, available: true })));
                }
            } catch (error) {
                console.error('Error fetching slot availability:', error);
                // On error, assume all slots are available
                setTimeSlots(defaultTimeSlots.map(slot => ({ ...slot, available: true })));
            } finally {
                setSlotsLoading(false);
            }
        };

        fetchSlotAvailability();
    }, [bookingDetails.date]);

    const getMinDate = () => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    };

    const getMaxDate = () => {
        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + 30);
        return maxDate.toISOString().split('T')[0];
    };

    const updateCount = (type, delta) => {
        const currentTotal = Object.values(counts).reduce((a, b) => a + b, 0);
        if (delta > 0 && currentTotal >= 10) {
            setMessage({ text: 'Maximum 10 tickets per booking allowed.', type: 'error' });
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
            return;
        }
        setCounts(prev => ({ ...prev, [type]: Math.max(0, prev[type] + delta) }));
    };

    const applyPromoCode = () => {
        const codes = {
            'WILDLIFE20': 20,
            'NATURE10': 10,
            'BULUSAN15': 15
        };
        
        if (codes[promoCode.toUpperCase()]) {
            setDiscount(codes[promoCode.toUpperCase()]);
            setMessage({ text: `Promo code applied! ${codes[promoCode.toUpperCase()]}% discount`, type: 'success' });
        } else {
            setMessage({ text: 'Invalid promo code', type: 'error' });
        }
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    };

    const handleCompanionNameChange = (id, name) => {
        const sanitizedName = sanitizeInput(name, false);
        setCompanions(prev =>
            prev.map(c => (c.id === id ? { ...c, name: sanitizedName } : c))
        );
    };

    const validateStep = (step) => {
        if (step === 1) {
            const totalTickets = Object.values(counts).reduce((a, b) => a + b, 0);
            if (totalTickets === 0) {
                setMessage({ text: 'Please select at least one ticket.', type: 'error' });
                return false;
            }
        } else if (step === 2) {
            if (!bookingDetails.date) {
                setMessage({ text: 'Please select a visit date.', type: 'error' });
                return false;
            }
            const trimmedEmail = sanitizeEmail(bookingDetails.email, true);
            if (!trimmedEmail) {
                setMessage({ text: 'Please enter your email address.', type: 'error' });
                return false;
            }
        } else if (step === 3) {
            const emptyNames = companions.filter(c => !sanitizeInput(c.name, true));
            if (emptyNames.length > 0) {
                setMessage({ text: 'Please enter names for all ticket holders.', type: 'error' });
                return false;
            }
        }
        setMessage({ text: '', type: '' });
        return true;
    };

    const nextStep = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, 4));
        }
    };

    const prevStep = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
        setMessage({ text: '', type: '' });
    };

    const generateBookingCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = 'ZB-';
        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    };

    const handlePayment = async () => {
        if (!validateStep(3)) return;
        
        setIsProcessing(true);
        
        try {
            await new Promise(resolve => setTimeout(resolve, 800));

            const purchases = Object.entries(counts).filter(([k, v]) => v > 0).map(([type, qty]) => {
                const mapType = {
                    adults: 'adult',
                    children: 'child',
                    seniors: 'senior',
                    residents: 'resident'
                }[type] || type;

                return userAPI.purchaseTicket({ 
                    ticketType: mapType, 
                    quantity: qty, 
                    visitDate: bookingDetails.date,
                    paymentMethod: total === 0 ? 'free' : bookingDetails.paymentMethod,
                    visitorEmail: bookingDetails.email,
                    visitorName: companions[0]?.name || user?.name || 'Guest'
                });
            });

            const results = await Promise.all(purchases);

            const first = results && results.length > 0 ? results[0] : null;
            const code = first?.ticket?.ticketCode || generateBookingCode();
            setBookingCode(code);
            setShowConfirmation(true);
            setCurrentStep(4);
        } catch (err) {
            console.error('Payment / purchase error', err);
            setMessage({ text: 'Failed to complete purchase. Please try again.', type: 'error' });
        } finally {
            setIsProcessing(false);
        }
    };

    const resetBooking = () => {
        setCounts({ adults: 0, children: 0, seniors: 0, residents: 0 });
        setCompanions([]);
        setBookingDetails({ date: '', time: '08:00', email: user?.email || '', phone: '', specialRequests: '', paymentMethod: 'pay_at_park' });
        setCurrentStep(1);
        setShowConfirmation(false);
        setBookingCode('');
        setPromoCode('');
        setDiscount(0);
    };

    // Step Indicator - defined as JSX variable (no function re-creation)
    const stepIndicatorContent = (
        <div className="flex justify-center mb-6 sm:mb-8 overflow-x-auto pb-2">
            <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4">
                {[
                    { num: 1, label: 'Select Tickets' },
                    { num: 2, label: 'Visit Details' },
                    { num: 3, label: 'Guest Info' },
                    { num: 4, label: 'Confirmation' }
                ].map((step, index) => (
                    <React.Fragment key={step.num}>
                        <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm sm:text-base transition-all duration-300 ${
                                currentStep >= step.num
                                    ? 'bg-green-600 text-white shadow-lg'
                                    : 'bg-gray-200 text-gray-500'
                            }`}>
                                {currentStep > step.num ? (
                                    <i className="fas fa-check text-xs sm:text-sm"></i>
                                ) : (
                                    step.num
                                )}
                            </div>
                            <span className={`text-xs mt-1 hidden sm:block text-center max-w-[80px] ${
                                currentStep >= step.num ? 'text-green-600 font-medium' : 'text-gray-400'
                            }`}>
                                {step.label}
                            </span>
                        </div>
                        {index < 3 && (
                            <div className={`w-6 sm:w-8 md:w-16 h-1 rounded transition-all duration-300 ${
                                currentStep > step.num ? 'bg-green-600' : 'bg-gray-200'
                            }`}></div>
                        )}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );

    // Ticket Selection - defined as JSX variable
    const ticketSelectionContent = (
        <div className="space-y-3 sm:space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-green-800 mb-4 sm:mb-6 flex items-center gap-2">
                <i className="fas fa-ticket-alt"></i> Select Your Tickets
            </h2>
            
            <div className="grid gap-3 sm:gap-4">
                {Object.entries(ticketTypes).map(([type, info]) => (
                    <div 
                        key={type} 
                        className={`p-3 sm:p-4 rounded-xl border-2 transition-all duration-300 ${
                            counts[type] > 0 
                                ? 'border-green-500 bg-green-50 shadow-md' 
                                : 'border-gray-200 bg-white hover:border-green-300'
                        }`}
                    >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <div className={`w-10 h-10 sm:w-12 sm:h-12 ${info.color} rounded-full flex items-center justify-center text-white flex-shrink-0`}>
                                    <i className={`fas ${info.icon} text-lg sm:text-xl`}></i>
                                </div>
                                <div className="min-w-0">
                                    <h3 className="font-semibold text-base sm:text-lg text-gray-800">{info.name}</h3>
                                    <p className="text-xs sm:text-sm text-gray-500">{info.description}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 mt-2 sm:mt-0">
                                <span className="text-lg sm:text-xl font-bold text-green-700">
                                    {prices[type] === 0 ? 'FREE' : `P${prices[type]}`}
                                </span>
                                
                                <div className="flex items-center bg-gray-100 rounded-lg flex-shrink-0">
                                    <button 
                                        onClick={() => updateCount(type, -1)}
                                        disabled={counts[type] === 0}
                                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-l-lg hover:bg-green-200 text-green-800 font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                                    >
                                        <i className="fas fa-minus text-sm"></i>
                                    </button>
                                    <span className="w-10 sm:w-12 text-center font-bold text-base sm:text-lg">{counts[type]}</span>
                                    <button 
                                        onClick={() => updateCount(type, 1)}
                                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-r-lg hover:bg-green-200 text-green-800 font-bold transition-colors flex items-center justify-center"
                                    >
                                        <i className="fas fa-plus text-sm"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Promo Code Section */}
            <div className="mt-6 p-3 sm:p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                <label className="block text-xs sm:text-sm font-medium text-yellow-800 mb-2">
                    <i className="fas fa-tag mr-2"></i>Have a promo code?
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                    <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(sanitizeInput(e.target.value))}
                        placeholder="Enter code"
                        className="flex-1 px-3 sm:px-4 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm sm:text-base"
                    />
                    <button
                        onClick={applyPromoCode}
                        className="w-full sm:w-auto px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium text-sm sm:text-base"
                    >
                        Apply
                    </button>
                </div>
                {discount > 0 && (
                    <p className="text-green-600 text-sm mt-2 flex items-center gap-1">
                        <i className="fas fa-check-circle"></i> {discount}% discount applied!
                    </p>
                )}
            </div>
        </div>
    );

    // Visit Details - defined as JSX variable
    const visitDetailsContent = (
        <div className="space-y-4 sm:space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold text-green-800 mb-4 sm:mb-6 flex items-center gap-2">
                <i className="fas fa-calendar-alt"></i> Choose Your Visit Date & Time
            </h2>

            {/* Date Selection */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Visit Date
                </label>
                <input
                    type="date"
                    value={bookingDetails.date}
                    onChange={(e) => setBookingDetails({ ...bookingDetails, date: e.target.value })}
                    min={getMinDate()}
                    max={getMaxDate()}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-base sm:text-lg"
                />
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    <i className="fas fa-info-circle mr-1"></i>
                    Bookings available up to 30 days in advance
                </p>
            </div>

            {/* Time Slot Selection */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Entry Time
                </label>
                {slotsLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                        <span className="ml-3 text-gray-600">Checking availability...</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                        {timeSlots.map((slot) => (
                            <button
                                key={slot.value}
                                onClick={() => slot.available && setBookingDetails({ ...bookingDetails, time: slot.value })}
                                disabled={!slot.available}
                                className={`p-2.5 sm:p-3 rounded-xl border-2 transition-all text-sm sm:text-base ${
                                    bookingDetails.time === slot.value
                                        ? 'border-green-500 bg-green-50 text-green-700'
                                        : slot.available
                                            ? 'border-gray-200 hover:border-green-300'
                                            : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}
                            >
                                <i className={`fas fa-clock mr-2 ${!slot.available && 'opacity-50'}`}></i>
                                {slot.label}
                                {!slot.available ? (
                                    <span className="block text-xs text-red-400 mt-1">Fully Booked</span>
                                ) : slot.remainingSpots !== undefined && slot.remainingSpots < 20 ? (
                                    <span className="block text-xs text-orange-500 mt-1">{slot.remainingSpots} spots left</span>
                                ) : null}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                    </label>
                    <input
                        type="email"
                        value={bookingDetails.email}
                        onChange={(e) => setBookingDetails({ ...bookingDetails, email: sanitizeEmail(e.target.value) })}                        placeholder="your@email.com"
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number (Optional)
                    </label>
                    <input
                        type="tel"
                        value={bookingDetails.phone}
                        onChange={(e) => setBookingDetails({ ...bookingDetails, phone: sanitizePhone(e.target.value) })}
                        placeholder="09XX XXX XXXX"
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
                    />
                </div>
            </div>

            {/* Special Requests */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Special Requests (Optional)
                </label>
                <textarea
                    value={bookingDetails.specialRequests}
                    onChange={(e) => setBookingDetails({ ...bookingDetails, specialRequests: sanitizeInput(e.target.value) })}
                    placeholder="Wheelchair accessibility, dietary requirements, etc."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                ></textarea>
            </div>
        </div>
    );

    // Guest Information - defined as JSX variable
    const guestInformationContent = (
        <div className="space-y-4 sm:space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold text-green-800 mb-4 sm:mb-6 flex items-center gap-2">
                <i className="fas fa-users"></i> Guest Information
            </h2>

            <p className="text-sm sm:text-base text-gray-600 mb-4">
                Please enter the name of each ticket holder. This information will be printed on the tickets.
            </p>

            <div className="space-y-3 sm:space-y-4">
                {companions.map((companion, index) => (
                    <div 
                        key={companion.id}
                        className="p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-200"
                    >
                        <div className="flex items-center gap-2 sm:gap-3 mb-2">
                            <div className={`w-7 h-7 sm:w-8 sm:h-8 ${ticketTypes[companion.typeKey]?.color || 'bg-green-500'} rounded-full flex items-center justify-center text-white text-xs sm:text-sm`}>
                                {index + 1}
                            </div>
                            <span className="font-medium text-gray-700 text-sm sm:text-base">{companion.type}</span>
                        </div>
                        <input
                            type="text"
                            value={companion.name}
                            onChange={(e) => handleCompanionNameChange(companion.id, e.target.value)}
                            placeholder="Enter full name"
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
                        />
                    </div>
                ))}
            </div>

            {/* Payment Method Selection */}
            {total > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-bold text-green-800 mb-4 flex items-center gap-2">
                        <i className="fas fa-credit-card"></i> Payment Method
                    </h3>
                    <div className="grid gap-3">
                        <label 
                            className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                bookingDetails.paymentMethod === 'pay_at_park' 
                                    ? 'border-green-500 bg-green-50' 
                                    : 'border-gray-200 hover:border-green-300'
                            }`}
                        >
                            <input
                                type="radio"
                                name="paymentMethod"
                                value="pay_at_park"
                                checked={bookingDetails.paymentMethod === 'pay_at_park'}
                                onChange={(e) => setBookingDetails(prev => ({ ...prev, paymentMethod: e.target.value }))}
                                className="w-5 h-5 text-green-600"
                            />
                            <div className="flex items-center gap-3 flex-1">
                                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                    <i className="fas fa-building text-xl text-green-600"></i>
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-800">Pay at Bulusan Park</p>
                                    <p className="text-sm text-gray-500">Pay in cash upon arrival at the park</p>
                                </div>
                            </div>
                        </label>

                        <label 
                            className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                bookingDetails.paymentMethod === 'gcash' 
                                    ? 'border-blue-500 bg-blue-50' 
                                    : 'border-gray-200 hover:border-blue-300'
                            }`}
                        >
                            <input
                                type="radio"
                                name="paymentMethod"
                                value="gcash"
                                checked={bookingDetails.paymentMethod === 'gcash'}
                                onChange={(e) => setBookingDetails(prev => ({ ...prev, paymentMethod: e.target.value }))}
                                className="w-5 h-5 text-blue-600"
                            />
                            <div className="flex items-center gap-3 flex-1">
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                    <span className="text-xl font-bold text-blue-600">G</span>
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-800">GCash</p>
                                    <p className="text-sm text-gray-500">Pay using your GCash wallet</p>
                                </div>
                            </div>
                        </label>

                        <label 
                            className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                bookingDetails.paymentMethod === 'paypal' 
                                    ? 'border-indigo-500 bg-indigo-50' 
                                    : 'border-gray-200 hover:border-indigo-300'
                            }`}
                        >
                            <input
                                type="radio"
                                name="paymentMethod"
                                value="paypal"
                                checked={bookingDetails.paymentMethod === 'paypal'}
                                onChange={(e) => setBookingDetails(prev => ({ ...prev, paymentMethod: e.target.value }))}
                                className="w-5 h-5 text-indigo-600"
                            />
                            <div className="flex items-center gap-3 flex-1">
                                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                                    <i className="fab fa-paypal text-xl text-indigo-600"></i>
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-800">PayPal</p>
                                    <p className="text-sm text-gray-500">Pay securely with PayPal</p>
                                </div>
                            </div>
                        </label>
                    </div>
                </div>
            )}

            {/* Free Ticket Notice */}
            {total === 0 && companions.length > 0 && (
                <div className="mt-6 p-4 bg-teal-50 border border-teal-200 rounded-xl">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                            <i className="fas fa-gift text-teal-600"></i>
                        </div>
                        <div>
                            <p className="font-semibold text-teal-800">Free Entry!</p>
                            <p className="text-sm text-teal-600">Your tickets are free! No payment required.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    // Confirmation - defined as JSX variable
    const confirmationContent = (
        <div className="text-center py-4 sm:py-8 px-2 sm:px-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 animate-bounce">
                <i className="fas fa-check text-3xl sm:text-4xl text-green-600"></i>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-bold text-green-800 mb-2">Booking Confirmed!</h2>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">Your tickets have been successfully reserved.</p>

            {/* Booking Code */}
            <div className="bg-green-50 border-2 border-green-500 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 inline-block w-full sm:w-auto max-w-xs sm:max-w-none">
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Your Booking Code</p>
                <p className="text-2xl sm:text-3xl font-mono font-bold text-green-700 break-all">{bookingCode}</p>
            </div>

            {/* Booking Summary */}
            <div className="bg-gray-50 rounded-xl p-4 sm:p-6 max-w-md mx-auto text-left">
                <h3 className="font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                    <i className="fas fa-receipt"></i> Booking Details
                </h3>
                <div className="space-y-2 text-xs sm:text-sm">
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-2">
                        <span className="text-gray-600">Date:</span>
                        <span className="font-medium">{new Date(bookingDetails.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-2">
                        <span className="text-gray-600">Time:</span>
                        <span className="font-medium">{timeSlots.find(t => t.value === bookingDetails.time)?.label}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Total Guests:</span>
                        <span className="font-medium">{companions.length}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 mt-2">
                        <span className="text-gray-800 font-medium">Total Paid:</span>
                        <span className="font-bold text-green-600">P{total.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <p className="text-xs sm:text-sm text-gray-500 mt-4 sm:mt-6 mb-4 sm:mb-6 px-2">
                <i className="fas fa-envelope mr-1"></i>
                A confirmation email has been sent to {bookingDetails.email}
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
                <button
                    onClick={() => navigate('/my-tickets')}
                    className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium text-sm sm:text-base"
                >
                    <i className="fas fa-history mr-2"></i>View My Tickets
                </button>
                <button
                    onClick={resetBooking}
                    className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 border-2 border-green-600 text-green-600 rounded-xl hover:bg-green-50 transition-colors font-medium text-sm sm:text-base"
                >
                    <i className="fas fa-plus mr-2"></i>Book Another
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
            <Header />
            
            {/* Hero Section */}
            <section 
                className="bg-[#2D5A27] text-white py-28 sm:py-32 md:py-40 text-center relative overflow-hidden"
                style={{ 
                    backgroundImage: 'linear-gradient(rgba(45, 90, 39, 0.9), rgba(58, 140, 125, 0.9)), url(https://images.unsplash.com/photo-1548013146-72479768bada?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80)', 
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
            >
                <div className="container mx-auto px-4 mt-22">
                    <h1 className="text-4xl md:text-5xl font-bold mb-3">
                        <i className="fas fa-ticket-alt mr-3"></i>
                        Ticket Reservations
                    </h1>
                    <p className="text-lg opacity-90 max-w-2xl mx-auto">
                        Secure your entry to Zoo of Bulusan. Experience wildlife like never before!
                    </p>
                    
                    {/* Quick Info */}
                    <div className="flex justify-center gap-6 mt-6 flex-wrap">
                        <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
                            <i className="fas fa-clock"></i>
                            <span>Open 8AM - 5PM</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
                            <i className="fas fa-map-marker-alt"></i>
                            <span>Bulusan, Sorsogon</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <section className="py-8 md:py-12 container mx-auto px-4 max-w-6xl">
                {stepIndicatorContent}

                {message.text && (
                    <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
                        message.type === 'error' 
                            ? 'bg-red-100 text-red-700 border border-red-200' 
                            : 'bg-green-100 text-green-700 border border-green-200'
                    }`}>
                        <i className={`fas ${message.type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'}`}></i>
                        {message.text}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Form Area */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
                            {currentStep === 1 && ticketSelectionContent}
                            {currentStep === 2 && visitDetailsContent}
                            {currentStep === 3 && guestInformationContent}
                            {currentStep === 4 && confirmationContent}

                            {/* Navigation Buttons */}
                            {currentStep < 4 && (
                                <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 mt-8 pt-6 border-t">
                                    {currentStep > 1 ? (
                                        <button
                                            onClick={prevStep}
                                            className="w-full sm:w-auto px-4 sm:px-6 py-3 border-2 border-gray-300 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors font-medium flex items-center justify-center gap-2"
                                        >
                                            <i className="fas fa-arrow-left"></i> Back
                                        </button>
                                    ) : (
                                        <div className="hidden sm:block"></div>
                                    )}
                                    
                                    {currentStep < 3 ? (
                                        <button
                                            onClick={nextStep}
                                            className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
                                        >
                                            Continue <i className="fas fa-arrow-right"></i>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handlePayment}
                                            disabled={isProcessing}
                                            className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isProcessing ? (
                                                <>
                                                    <i className="fas fa-spinner fa-spin"></i> Processing...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="fas fa-lock"></i> Confirm & Pay P{total.toFixed(2)}
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Order Summary Sidebar */}
                    {currentStep < 4 && (
                        <div className="lg:col-span-1 order-first lg:order-last">
                            <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 sticky top-20 lg:top-24">
                                <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <i className="fas fa-shopping-cart"></i> Order Summary
                                </h3>

                                {Object.values(counts).reduce((a, b) => a + b, 0) === 0 ? (
                                    <div className="text-center py-8 text-gray-400">
                                        <i className="fas fa-ticket-alt text-4xl mb-3"></i>
                                        <p>No tickets selected yet</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="space-y-3 mb-4">
                                            {Object.entries(counts).map(([type, count]) => (
                                                count > 0 && (
                                                    <div key={type} className="flex justify-between text-sm">
                                                        <span className="text-gray-600">
                                                            {ticketTypes[type].name} x {count}
                                                        </span>
                                                        <span className="font-medium">
                                                            P{(count * prices[type]).toFixed(2)}
                                                        </span>
                                                    </div>
                                                )
                                            ))}
                                        </div>

                                        {discount > 0 && (
                                            <div className="flex justify-between text-sm text-green-600 border-t pt-3 mb-3">
                                                <span>Discount ({discount}%)</span>
                                                <span>-P{(Object.entries(counts).reduce((sum, [type, count]) => sum + count * prices[type], 0) * discount / 100).toFixed(2)}</span>
                                            </div>
                                        )}

                                        <div className="border-t-2 border-green-600 pt-3 flex justify-between items-center">
                                            <span className="font-bold text-gray-800">Total</span>
                                            <span className="text-2xl font-bold text-green-600">P{total.toFixed(2)}</span>
                                        </div>

                                        {/* Visit Date Preview */}
                                        {bookingDetails.date && (
                                            <div className="mt-4 p-3 bg-green-50 rounded-lg">
                                                <p className="text-sm text-gray-600">
                                                    <i className="fas fa-calendar mr-2"></i>
                                                    {new Date(bookingDetails.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    <i className="fas fa-clock mr-2"></i>
                                                    {timeSlots.find(t => t.value === bookingDetails.time)?.label}
                                                </p>
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* Features */}
                                <div className="mt-6 pt-4 border-t space-y-2">
                                    <p className="text-xs text-gray-500 flex items-center gap-2">
                                        <i className="fas fa-shield-alt text-green-500"></i>
                                        Secure payment processing
                                    </p>
                                    <p className="text-xs text-gray-500 flex items-center gap-2">
                                        <i className="fas fa-redo text-green-500"></i>
                                        Free cancellation up to 24h
                                    </p>
                                    <p className="text-xs text-gray-500 flex items-center gap-2">
                                        <i className="fas fa-mobile-alt text-green-500"></i>
                                        E-tickets sent to your email
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default Tickets;