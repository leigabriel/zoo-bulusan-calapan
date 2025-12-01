import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import AIChatAssistant from '../../components/features/ai-assistant/AIChatAssistant';
import AnimalClassifier from '../../components/features/ai-scanner/AnimalClassifier';
import '../../App.css'

const Icons = {
    Robot: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <rect x="3" y="11" width="18" height="10" rx="2" />
            <circle cx="12" cy="5" r="2" />
            <path d="M12 7v4" />
            <line x1="8" y1="16" x2="8" y2="16" />
            <line x1="16" y1="16" x2="16" y2="16" />
        </svg>
    ),
    Camera: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
        </svg>
    ),
    Send: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
    ),
    Close: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    ),
    Maximize: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <polyline points="15 3 21 3 21 9" />
            <polyline points="9 21 3 21 3 15" />
            <line x1="21" y1="3" x2="14" y2="10" />
            <line x1="3" y1="21" x2="10" y2="14" />
        </svg>
    ),
    Minimize: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <polyline points="4 14 10 14 10 20" />
            <polyline points="20 10 14 10 14 4" />
            <line x1="14" y1="10" x2="21" y2="3" />
            <line x1="3" y1="21" x2="10" y2="14" />
        </svg>
    ),
    Message: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
    ),
    Brain: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" />
            <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" />
        </svg>
    ),
    Ticket: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
            <path d="M13 5v2" />
            <path d="M13 17v2" />
            <path d="M13 11v2" />
        </svg>
    )
};

const Home = () => {
    // Local state for selector bubble and active feature
    const [showSelector, setShowSelector] = useState(false);
    const [activeFeature, setActiveFeature] = useState(null); // 'assistant' | 'scanner' | null
    const [assistantExpanded, setAssistantExpanded] = useState(false);
    const [scannerExpanded, setScannerExpanded] = useState(false);

    // Prevent body scroll when scanner is expanded
    React.useEffect(() => {
        if (scannerExpanded) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [scannerExpanded]);

    const openAssistant = () => {
        setActiveFeature('assistant');
        setAssistantExpanded(false);
        setShowSelector(false);
    };

    const openScanner = () => {
        setActiveFeature('scanner');
        setAssistantExpanded(false);
        setShowSelector(false);
    };

    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            {/* Floating selector bubble */}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
                {/* Selector menu */}
                {showSelector && (
                    <div className="mb-2 w-44 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                        <button
                            onClick={openAssistant}
                            className={`w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 ${activeFeature === 'assistant' ? 'bg-green-50' : ''}`}
                        >
                            <svg className="w-5 h-5 text-green-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" /></svg>
                            <span className="font-medium">AI Assistant</span>
                        </button>
                        <button
                            onClick={openScanner}
                            className={`w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 ${activeFeature === 'scanner' ? 'bg-green-50' : ''}`}
                        >
                            <svg className="w-5 h-5 text-emerald-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
                            <span className="font-medium">AI Scanner</span>
                        </button>
                    </div>
                )}

                {/* Chat bubble - toggles selector */}
                <div className="relative">
                    <button
                        onClick={() => setShowSelector(prev => !prev)}
                        aria-label="Open AI selector"
                        className="w-16 h-16 rounded-full bg-gradient-to-br from-[#2D5A27] to-[#3A8C7D] text-white flex items-center justify-center shadow-lg transform transition-transform duration-200 hover:scale-110 active:scale-95"
                    >
                        <div className="w-8 h-8">
                            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                        </div>
                    </button>
                    <button
                        onClick={() => { setActiveFeature('assistant'); setAssistantExpanded(true); setShowSelector(false); }}
                        title="Open larger chat"
                        className="absolute -top-2 -left-2 w-8 h-8 rounded-full bg-white text-[#2D5A27] flex items-center justify-center shadow-sm hover:scale-105 transition"
                    >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M12 3v18" /></svg>
                    </button>
                </div>
            </div>

            {/* Render chosen feature panels (assistant or scanner) via local state */}
            <AIChatAssistant hideLauncher={true} open={activeFeature === 'assistant'} expanded={assistantExpanded} onExpandChange={(v) => setAssistantExpanded(v)} onClose={() => { setActiveFeature(null); setAssistantExpanded(false); }} />

            {activeFeature === 'scanner' && (
                <>
                    {/* Expanded Scanner - Fullscreen Overlay */}
                    {scannerExpanded && (
                        <div className="fixed inset-0 z-[9999] bg-white flex flex-col">
                            <div className="bg-gradient-to-r from-[#2D5A27] to-[#3A8C7D] p-3 flex items-center justify-between text-white">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center"> 
                                        <svg className="w-5 h-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
                                    </div>
                                    <div>
                                        <h3 className="font-bold">AI Scanner</h3>
                                        <p className="text-xs opacity-90">Animal Classifier</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setScannerExpanded(false)}
                                        title="Minimize"
                                        className="p-2 rounded-md bg-white/20 hover:bg-white/30 text-white"
                                    >
                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 14 10 14 10 20" /><polyline points="20 10 14 10 14 4" /></svg>
                                    </button>
                                    <button onClick={() => { setActiveFeature(null); setScannerExpanded(false); }} className="p-2 rounded-md bg-white/20 hover:bg-white/30 text-white">
                                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <AnimalClassifier embedded={true} />
                            </div>
                        </div>
                    )}

                    {/* Compact Scanner Panel */}
                    {!scannerExpanded && (
                        <div className="fixed bottom-6 right-6 z-50 w-[340px] sm:w-[360px] h-[480px] sm:h-[520px] bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 flex flex-col">
                            <div className="bg-gradient-to-r from-[#2D5A27] to-[#3A8C7D] p-3 flex items-center justify-between text-white shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center"> 
                                        <svg className="w-5 h-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm">AI Scanner</h3>
                                        <p className="text-xs opacity-90">Animal Classifier</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setScannerExpanded(true)}
                                        title="Expand"
                                        className="p-2 rounded-md bg-white/20 hover:bg-white/30 text-white"
                                    >
                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /></svg>
                                    </button>
                                    <button onClick={() => setActiveFeature(null)} className="p-2 rounded-md bg-white/20 hover:bg-white/30 text-white text-xs font-medium">
                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <AnimalClassifier embedded={true} />
                            </div>
                        </div>
                    )}
                </>
            )}

            <section className="relative h-[600px] text-white flex items-center justify-center text-center bg-cover bg-center" style={{ backgroundImage: `linear-gradient(rgba(45, 90, 39, 0.85), rgba(58, 140, 125, 0.85)), url('https://images.unsplash.com/photo-1548013146-72479768bada?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')` }}>
                <div className="relative z-10 px-4 max-w-5xl mx-auto">
                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full mb-8 text-sm font-semibold text-green-50">
                        <Icons.Brain />
                        <span>AI-Driven Smart Zoo</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight leading-tight">Wildlife Wonder Awaits</h1>
                    <p className="text-xl md:text-2xl mb-10 max-w-2xl mx-auto text-gray-100 font-light">Immerse yourself in nature with our cloud-powered zoo experience.</p>
                    <div className="flex flex-col sm:flex-row gap-5 justify-center">
                        <Link to="/tickets" className="bg-white text-green-800 px-8 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-gray-50 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                            <Icons.Ticket />
                            <span>Plan Your Visit</span>
                        </Link>
                    </div>
                </div>
            </section>

            <section className="py-24 bg-gradient-to-b from-green-50 to-white">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-4xl font-bold text-green-900 mb-4">Online Ticket Booking</h2>
                    <p className="text-green-700 mb-16 text-lg max-w-2xl mx-auto">Secure cloud-based reservations with instant digital confirmation and QR code access.</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {[
                            { title: 'Child Admission', price: '₱20', desc: 'Ages 4-12' },
                            { title: 'Adult Admission', price: '₱40', desc: 'Ages 13+' },
                            { title: 'Bulusan Residents', price: 'FREE', desc: 'With Valid ID' }
                        ].map((t, i) => (
                            <div key={i} className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 border border-green-100 group hover:-translate-y-2">
                                <h3 className="text-2xl font-bold text-green-800 mb-3">{t.title}</h3>
                                <div className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-teal-600 mb-6">{t.price}</div>
                                <p className="text-gray-500 mb-8 font-medium">{t.desc}</p>
                                <Link to="/tickets">
                                    <button className="w-full py-4 rounded-xl text-white font-bold bg-gradient-to-r from-green-600 to-teal-600 hover:shadow-lg hover:opacity-95 transition">Book Now</button>
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            <Footer />
        </div>
    );
};

export default Home;