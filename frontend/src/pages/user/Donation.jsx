import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { userAPI } from '../../services/api-client';

const Icons = {
    Back: () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
    ),
    Home: () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
    ),
    Gift: () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <rect x="3" y="8" width="18" height="4" rx="1" />
            <path d="M12 8v13" />
            <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
            <path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8" />
            <path d="M16.5 8a2.5 2.5 0 0 0 0-5C13 3 12 8 12 8" />
        </svg>
    ),
    Coin: () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="9" />
            <path d="M14.8 9A2.5 2.5 0 0 0 12 8c-1.38 0-2.5.9-2.5 2s1.12 2 2.5 2 2.5.9 2.5 2-1.12 2-2.5 2a2.5 2.5 0 0 1-2.8-1" />
            <path d="M12 6v2m0 8v2" />
        </svg>
    ),
    Phone: () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
    ),
    Copy: () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
    ),
    Check: () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <polyline points="20 6 9 17 4 12" />
        </svg>
    ),
    Sparkle: () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M12 3v2M12 19v2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M3 12h2M19 12h2M5.6 18.4L7 17M17 7l1.4-1.4" />
            <circle cx="12" cy="12" r="3.5" />
        </svg>
    ),
    Lock: () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
    )
};

const PRESET_AMOUNTS = [50, 100, 200, 500, 1000];

const STEPS = [
    'Open the GCash app on your phone.',
    'Tap "Send" and choose "Send Money".',
    'Enter the GCash number shown below as the recipient.',
    'Type your chosen donation amount and add a note if you like.',
    'Double-check the details, then confirm and enter your MPIN.',
    'That\u2019s it - thank you for supporting Bulusan Zoo!'
];

const Donation = () => {
    const navigate = useNavigate();

    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [amount, setAmount] = useState('');
    const [activePreset, setActivePreset] = useState(null);
    const [copied, setCopied] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmedAmount, setConfirmedAmount] = useState(0);

    useEffect(() => {
        let mounted = true;
        const loadConfig = async () => {
            try {
                const res = await userAPI.getDonationConfig();
                if (mounted && res.success) {
                    setConfig(res.config);
                }
            } catch {
                // fall back to empty config on error
            } finally {
                if (mounted) setLoading(false);
            }
        };
        loadConfig();
        return () => { mounted = false; };
    }, []);

    const numericAmount = useMemo(() => {
        const cleaned = String(amount || '0').replace(/[^0-9]/g, '');
        return Math.max(0, parseInt(cleaned || '0', 10));
    }, [amount]);

    const donationEnabled = Boolean(config?.enabled);

    const handlePreset = (value) => {
        setActivePreset(value);
        setAmount(String(value));
    };

    const handleCustomChange = (e) => {
        const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 7);
        setAmount(value);
        setActivePreset(null);
    };

    const handleCopy = async () => {
        if (!config?.gcashNumber) return;
        try {
            await navigator.clipboard.writeText(config.gcashNumber);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // clipboard unavailable
        }
    };

    const handleDonate = () => {
        let finalAmount = numericAmount;
        if (finalAmount <= 0) {
            setAmount('100');
            setActivePreset(100);
            finalAmount = 100;
        }
        setConfirmedAmount(finalAmount);
        setShowConfirm(true);
    };

    const openGcash = () => {
        const url = config?.gcashNumber ? `gcash://sendmoney?amount=${confirmedAmount}&to=${config.gcashNumber}` : 'gcash://';
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="min-h-screen bg-[#f2fbf4] text-[#1f2d23] flex flex-col">
            <div className="fixed top-4 left-4 right-4 z-50 flex justify-between items-center pointer-events-none">
                <button
                    onClick={() => navigate(-1)}
                    className="pointer-events-auto flex items-center gap-2 px-4 py-2.5 bg-white/90 backdrop-blur-sm text-emerald-900 rounded-full shadow-lg border border-emerald-100 hover:shadow-xl transition-all duration-300 font-medium"
                >
                    <Icons.Back />
                    <span className="hidden sm:inline">Back</span>
                </button>
                <Link
                    to="/"
                    className="pointer-events-auto flex items-center gap-2 px-4 py-2.5 bg-white/90 backdrop-blur-sm text-emerald-900 rounded-full shadow-lg border border-emerald-100 hover:shadow-xl transition-all duration-300 font-medium"
                >
                    <Icons.Home />
                    <span className="hidden sm:inline">Home</span>
                </Link>
            </div>

            <section className="relative py-20 pt-28 text-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#effbf3] via-[#ddf3e5] to-[#cce9d7]" />
                <div className="absolute -top-24 right-0 w-72 h-72 rounded-full bg-[#bfe6cc] opacity-40 blur-3xl" />
                <div className="absolute -bottom-32 left-0 w-80 h-80 rounded-full bg-[#a7d8b8] opacity-30 blur-3xl" />
                <div className="relative z-10 container mx-auto px-4">
                    <p className="text-xs uppercase tracking-[0.35em] font-semibold text-emerald-700/80 bg-white/70 border border-emerald-200 inline-flex px-4 py-2 rounded-full mb-6">
                        Support Bulusan Zoo
                    </p>
                    <h1 className="text-4xl md:text-5xl font-bold mb-3 tracking-tight">Donate Today</h1>
                    <p className="text-base md:text-lg max-w-2xl mx-auto text-emerald-900/70 mb-4">
                        Your generosity helps us care for our animals and preserve wildlife for generations to come.
                    </p>
                </div>
            </section>

            <div className="container mx-auto px-4 py-8 md:py-12 max-w-5xl">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-3">
                        <div className="w-10 h-10 border-4 border-emerald-300 border-t-emerald-600 rounded-full animate-spin" />
                        <p className="text-sm text-emerald-900/60">Loading donation details...</p>
                    </div>
                ) : !donationEnabled ? (
                    <div className="bg-white rounded-3xl shadow-lg border border-emerald-100 p-10 md:p-16 text-center">
                        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-5">
                            <Icons.Gift />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Donations are currently unavailable</h2>
                        <p className="text-emerald-900/70 max-w-md mx-auto">
                            We are not accepting online donations at the moment. Please check back again soon.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8 items-start">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white rounded-3xl shadow-lg border border-emerald-100 overflow-hidden">
                                <div className="p-6 border-b border-emerald-100 bg-emerald-50/40">
                                    <h2 className="font-bold text-emerald-900 flex items-center gap-2">
                                        <span className="w-9 h-9 bg-emerald-600 text-white rounded-xl flex items-center justify-center">
                                            <Icons.Coin />
                                        </span>
                                        Choose Your Amount
                                    </h2>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-3 gap-2.5 mb-4">
                                        {PRESET_AMOUNTS.map((value) => (
                                            <button
                                                key={value}
                                                onClick={() => handlePreset(value)}
                                                className={`py-3 rounded-xl text-sm font-bold transition-all border ${activePreset === value
                                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                                                    : 'bg-emerald-50 text-emerald-900 border-emerald-100 hover:border-emerald-300'
                                                    }`}
                                            >
                                                ₱{value.toLocaleString()}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="relative mb-6">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-emerald-600">₱</span>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            value={amount}
                                            onChange={handleCustomChange}
                                            placeholder="Enter any amount"
                                            className="w-full pl-10 pr-4 py-4 rounded-xl bg-white text-emerald-900 placeholder-emerald-700/40 font-bold text-lg border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 transition-all"
                                        />
                                    </div>

                                    <button
                                        onClick={handleDonate}
                                        disabled={numericAmount <= 0}
                                        className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${numericAmount > 0
                                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20'
                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            }`}
                                    >
                                        <Icons.Sparkle />
                                        Donate ₱{numericAmount.toLocaleString()}
                                    </button>
                                    <p className="text-xs text-emerald-900/50 text-center mt-4 flex items-center justify-center gap-1.5">
                                        <Icons.Lock />
                                        Secure &amp; private. No account needed to donate.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-3 space-y-6">
                            <div className="bg-white rounded-3xl shadow-lg border border-emerald-100 overflow-hidden">
                                <div className="p-6 border-b border-emerald-100 bg-emerald-50/40">
                                    <h2 className="font-bold text-emerald-900 flex items-center gap-2">
                                        <span className="w-9 h-9 bg-blue-600 text-white rounded-xl flex items-center justify-center">
                                            <Icons.Phone />
                                        </span>
                                        Payment via GCash
                                    </h2>
                                </div>
                                <div className="p-6 space-y-5">
                                    <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 text-white p-6">
                                        <p className="text-xs uppercase tracking-widest font-semibold text-emerald-100 mb-1">GCash Number</p>
                                        <div className="flex items-center justify-between gap-3">
                                            <p className="text-2xl md:text-3xl font-black tracking-tight break-all">
                                                {config?.gcashNumber || 'Not yet provided'}
                                            </p>
                                            {config?.gcashNumber && (
                                                <button
                                                    onClick={handleCopy}
                                                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 transition-all text-xs font-semibold"
                                                >
                                                    {copied ? <Icons.Check /> : <Icons.Copy />}
                                                    {copied ? 'Copied' : 'Copy'}
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-sm text-emerald-100 mt-2">
                                            Account Name: <span className="font-semibold">{config?.accountName || 'Bulusan Zoo & Wildlife Park'}</span>
                                        </p>
                                        {config?.note && (
                                            <p className="text-xs text-emerald-100/90 mt-3 leading-relaxed">{config.note}</p>
                                        )}
                                    </div>

                                    <div>
                                        <p className="text-xs uppercase tracking-widest font-semibold text-emerald-900/60 mb-3">How to Donate</p>
                                        <ol className="space-y-3">
                                            {STEPS.map((step, index) => (
                                                <li key={index} className="flex items-start gap-3">
                                                    <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                                                        {index + 1}
                                                    </span>
                                                    <p className="text-sm text-emerald-900/80 leading-relaxed pt-0.5">{step}</p>
                                                </li>
                                            ))}
                                        </ol>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {showConfirm && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={() => setShowConfirm(false)}
                    />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                                <Icons.Gift />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Thank you for your generosity!</h3>
                            <p className="text-sm text-gray-500 leading-relaxed mb-5">
                                Please complete your donation of{' '}
                                <span className="font-bold text-emerald-600">₱{confirmedAmount.toLocaleString()}</span>{' '}
                                by sending it to the GCash number below.
                            </p>
                            <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4 mb-6">
                                <p className="text-xs text-emerald-900/60 mb-1">Amount</p>
                                <p className="text-2xl font-black text-emerald-700">₱{confirmedAmount.toLocaleString()}</p>
                                <p className="text-xs text-emerald-900/60 mt-3 mb-1">GCash Number</p>
                                <p className="text-sm font-bold text-gray-800 break-all">{config?.gcashNumber || '—'}</p>
                                {config?.accountName && (
                                    <p className="text-xs text-gray-500 mt-1">{config.accountName}</p>
                                )}
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowConfirm(false)}
                                    className="flex-1 py-2.5 border border-gray-200 rounded-xl font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                                >
                                    Done
                                </button>
                                <button
                                    onClick={openGcash}
                                    className="flex-1 py-2.5 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors"
                                >
                                    Open GCash
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Donation;
