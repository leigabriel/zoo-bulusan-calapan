import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import AIChatAssistant from '../../components/features/ai-assistant/AIChatAssistant';
import AnimalClassifier from '../../components/features/ai-scanner/AnimalClassifier';
import '../../App.css'

// 15 HD animal images for rotating display
const animalImages = [
    { src: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=1200&q=80', name: 'Lion' },
    { src: 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?w=1200&q=80', name: 'Elephant' },
    { src: 'https://images.unsplash.com/photo-1547721064-da6cfb341d50?w=1200&q=80', name: 'Giraffe' },
    { src: 'https://images.unsplash.com/photo-1501706362039-c06b2d715385?w=1200&q=80', name: 'Zebra' },
    { src: 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=1200&q=80', name: 'Tiger' },
    { src: 'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=1200&q=80', name: 'Panda' },
    { src: 'https://images.unsplash.com/photo-1474511320723-9a56873571b7?w=1200&q=80', name: 'Gorilla' },
    { src: 'https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?w=1200&q=80', name: 'Sea Turtle' },
    { src: 'https://images.unsplash.com/photo-1551085254-e96b210db58a?w=1200&q=80', name: 'Flamingo' },
    { src: 'https://images.unsplash.com/photo-1456926631375-92c8ce872def?w=1200&q=80', name: 'Peacock' },
    { src: 'https://images.unsplash.com/photo-1535338454770-8be927b5a00b?w=1200&q=80', name: 'Cheetah' },
    { src: 'https://images.unsplash.com/photo-1544985361-b420d7a77043?w=1200&q=80', name: 'Red Panda' },
    { src: 'https://images.unsplash.com/photo-1462888210965-cdf193fb74de?w=1200&q=80', name: 'Koala' },
    { src: 'https://images.unsplash.com/photo-1590692464430-5f397e182e7e?w=1200&q=80', name: 'Parrot' },
    { src: 'https://images.unsplash.com/photo-1559253664-ca249d4608c6?w=1200&q=80', name: 'Penguin' }
];

// Floating icon component for decorative elements
const FloatingIcon = ({ icon, className, delay = 0 }) => (
    <div 
        className={`absolute bg-white rounded-2xl shadow-lg p-3 animate-float ${className}`}
        style={{ animationDelay: `${delay}s` }}
    >
        {icon}
    </div>
);

const Icons = {
    Lion: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
        </svg>
    ),
    Penguin: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path d="M12 2a5 5 0 0 0-5 5v7a5 5 0 0 0 10 0V7a5 5 0 0 0-5-5zm-3 5a3 3 0 0 1 6 0v7a3 3 0 0 1-6 0V7z"/>
        </svg>
    ),
    Parrot: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path d="M21 3v2c0 9.627-5.373 14-12 14H7.098c.21.576.503 1.12.87 1.615.61.82 1.48 1.54 2.632 2.155A14.247 14.247 0 0 0 18 24c1.15 0 2.22-.265 3.19-.73.49-.235.93-.52 1.32-.84.28-.23.53-.49.75-.77.19-.24.35-.49.49-.75.25-.49.43-1.02.52-1.57.06-.34.09-.7.09-1.07V3h-3.36zM3 13c2.67 0 5.14-.94 7.12-2.52A12.08 12.08 0 0 0 14.62 3H3v10z"/>
        </svg>
    ),
    Child: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path d="M12 2C9.24 2 7 4.24 7 7s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 8c-1.65 0-3-1.35-3-3s1.35-3 3-3 3 1.35 3 3-1.35 3-3 3zm0 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
    ),
    Adult: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
    ),
    Home: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
        </svg>
    ),
    Utensils: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/>
        </svg>
    ),
    Restroom: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path d="M5.5 22v-7.5H4V9c0-1.1.9-2 2-2h3c1.1 0 2 .9 2 2v5.5H9.5V22h-4zM18 22v-6h3l-2.54-7.63C18.18 7.55 17.42 7 16.56 7h-.12c-.86 0-1.63.55-1.9 1.37L12 16h3v6h3zM7.5 6c1.11 0 2-.89 2-2s-.89-2-2-2-2 .89-2 2 .89 2 2 2zm9 0c1.11 0 2-.89 2-2s-.89-2-2-2-2 .89-2 2 .89 2 2 2z"/>
        </svg>
    ),
    Theater: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM8.5 8c.83 0 1.5.67 1.5 1.5S9.33 11 8.5 11 7 10.33 7 9.5 7.67 8 8.5 8zM12 18c-2.28 0-4.22-1.66-5-4h10c-.78 2.34-2.72 4-5 4zm3.5-7c-.83 0-1.5-.67-1.5-1.5S14.67 8 15.5 8s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
        </svg>
    ),
    Elephant: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path d="M20 12V7a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v9h2v4a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-4h4v4a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-6h-2zM8 7a2 2 0 1 1 0 4 2 2 0 0 1 0-4z"/>
        </svg>
    ),
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
    const [activeFeature, setActiveFeature] = useState(null);
    const [assistantExpanded, setAssistantExpanded] = useState(false);
    const [scannerExpanded, setScannerExpanded] = useState(false);
    const [currentAnimalIndex, setCurrentAnimalIndex] = useState(0);

    // Rotate through animal images every 4 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentAnimalIndex((prev) => (prev + 1) % animalImages.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    // Prevent body scroll when scanner is expanded
    useEffect(() => {
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
        <div className="min-h-screen flex flex-col bg-white">
            <Header />
            
            {/* Floating selector bubble */}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
                {showSelector && (
                    <div className="mb-3 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-scale-in">
                        <button
                            onClick={openAssistant}
                            className={`w-full text-left px-4 py-3.5 hover:bg-gray-50 flex items-center gap-3 transition-colors ${activeFeature === 'assistant' ? 'bg-emerald-50' : ''}`}
                        >
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" /></svg>
                            </div>
                            <span className="font-medium text-gray-700 text-sm">AI Assistant</span>
                        </button>
                        <button
                            onClick={openScanner}
                            className={`w-full text-left px-4 py-3.5 hover:bg-gray-50 flex items-center gap-3 transition-colors ${activeFeature === 'scanner' ? 'bg-emerald-50' : ''}`}
                        >
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
                            </div>
                            <span className="font-medium text-gray-700 text-sm">AI Scanner</span>
                        </button>
                    </div>
                )}

                <div className="relative">
                    <button
                        onClick={() => setShowSelector(prev => !prev)}
                        aria-label="Open AI selector"
                        className="w-14 h-14 rounded-2xl bg-gray-900 text-white flex items-center justify-center shadow-xl shadow-gray-900/30 transform transition-all duration-200 hover:scale-105 hover:shadow-2xl active:scale-95"
                    >
                        <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                    </button>
                </div>
            </div>

            {/* Render chosen feature panels (assistant or scanner) via local state */}
            <AIChatAssistant hideLauncher={true} open={activeFeature === 'assistant'} expanded={assistantExpanded} onExpandChange={(v) => setAssistantExpanded(v)} onClose={() => { setActiveFeature(null); setAssistantExpanded(false); }} />

            {activeFeature === 'scanner' && (
                <>
                    {scannerExpanded && (
                        <div className="fixed inset-0 z-[9999] bg-white flex flex-col">
                            <div className="bg-gray-900 p-4 flex items-center justify-between text-white">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"> 
                                        <svg className="w-5 h-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
                                    </div>
                                    <div>
                                        <h3 className="font-bold">AI Scanner</h3>
                                        <p className="text-xs text-gray-400">Animal Classifier</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setScannerExpanded(false)}
                                        title="Minimize"
                                        className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                                    >
                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 14 10 14 10 20" /><polyline points="20 10 14 10 14 4" /></svg>
                                    </button>
                                    <button onClick={() => { setActiveFeature(null); setScannerExpanded(false); }} className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors">
                                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <AnimalClassifier embedded={true} />
                            </div>
                        </div>
                    )}

                    {!scannerExpanded && (
                        <div className="fixed bottom-6 right-6 z-50 w-[340px] sm:w-[380px] h-[500px] sm:h-[540px] bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col animate-scale-in">
                            <div className="bg-gray-900 p-4 flex items-center justify-between text-white shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"> 
                                        <svg className="w-5 h-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm">AI Scanner</h3>
                                        <p className="text-xs text-gray-400">Animal Classifier</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setScannerExpanded(true)}
                                        title="Expand"
                                        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                                    >
                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /></svg>
                                    </button>
                                    <button onClick={() => setActiveFeature(null)} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
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

            {/* Hero Section - Inspired by reference design */}
            <section className="relative min-h-screen overflow-hidden pt-24">
                {/* Background image */}
                <div 
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: `url('https://i.pinimg.com/736x/cf/be/f7/cfbef7ee6088cac3e2e6c01cfe57bfed.jpg')` }}
                />
                {/* Overlay gradient for readability */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-white/70 to-transparent" />
                
                {/* Floating decorative icons */}
                <FloatingIcon 
                    icon={<svg className="w-6 h-6 text-emerald-600" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>}
                    className="top-32 left-[15%] hidden lg:flex"
                    delay={0}
                />
                <FloatingIcon 
                    icon={<svg className="w-6 h-6 text-teal-600" viewBox="0 0 24 24" fill="currentColor"><path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>}
                    className="top-44 right-[18%] hidden lg:flex"
                    delay={0.5}
                />
                <FloatingIcon 
                    icon={<svg className="w-6 h-6 text-cyan-600" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/></svg>}
                    className="top-56 left-[22%] hidden lg:flex"
                    delay={1}
                />
                <FloatingIcon 
                    icon={<svg className="w-6 h-6 text-green-600" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>}
                    className="top-36 right-[12%] hidden lg:flex"
                    delay={1.5}
                />
                <FloatingIcon 
                    icon={<svg className="w-6 h-6 text-emerald-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>}
                    className="top-64 left-[10%] hidden lg:flex"
                    delay={2}
                />

                <div className="relative z-10 container mx-auto px-6 lg:px-12 pt-16 pb-8">
                    {/* Announcement badge */}
                    <div className="flex justify-center mb-8">
                        <div className="inline-flex items-center gap-2 bg-white px-5 py-2.5 rounded-full shadow-md border border-gray-100">
                            <span className="text-sm font-medium text-gray-700">AI-Powered Wildlife Experience</span>
                            <span className="text-lg text-amber-500"><Icons.Lion /></span>
                        </div>
                    </div>

                    {/* Main headline */}
                    <div className="text-center max-w-4xl mx-auto">
                        <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight tracking-tight">
                            Your Haven for
                            <br />
                            <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 bg-clip-text text-transparent italic">Seamless</span> Wildlife
                        </h1>
                        <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
                            Empowering you with intelligent, effortless tools to explore wildlife, enhance your visit, and discover more—seamlessly.
                        </p>

                        {/* CTA buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <Link to="/tickets" className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-4 rounded-full font-semibold text-base flex items-center gap-3 transition-all duration-200 shadow-xl shadow-gray-900/20 hover:shadow-2xl hover:-translate-y-0.5">
                                <Icons.Ticket />
                                <span>Plan Your Visit</span>
                            </Link>
                            <button className="bg-white/90 backdrop-blur-sm hover:bg-white text-gray-700 px-6 py-4 rounded-full font-medium text-base flex items-center gap-3 transition-all duration-200 border border-gray-200 shadow-sm">
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                    <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                                </div>
                                <span>Watch Video</span>
                            </button>
                        </div>
                    </div>

                    {/* Rotating animal image showcase */}
                    <div className="relative mt-16 flex justify-center pb-8">
                        <div className="relative w-full max-w-4xl aspect-video rounded-3xl overflow-hidden shadow-2xl shadow-gray-900/30 border-4 border-white/50">
                            {animalImages.map((animal, index) => (
                                <div
                                    key={animal.name}
                                    className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                                        index === currentAnimalIndex 
                                            ? 'opacity-100 scale-100' 
                                            : 'opacity-0 scale-105'
                                    }`}
                                >
                                    <img
                                        src={animal.src}
                                        alt={animal.name}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                                    <div className="absolute bottom-6 left-6 text-white">
                                        <p className="text-sm font-medium text-white/80 uppercase tracking-wider">Featured Animal</p>
                                        <h3 className="text-3xl font-bold">{animal.name}</h3>
                                    </div>
                                </div>
                            ))}
                            
                            {/* Image indicator dots */}
                            <div className="absolute bottom-6 right-6 flex gap-1.5 flex-wrap max-w-[180px] justify-end">
                                {animalImages.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentAnimalIndex(index)}
                                        className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                                            index === currentAnimalIndex 
                                                ? 'w-8 bg-white' 
                                                : 'bg-white/40 hover:bg-white/70'
                                        }`}
                                    />
                                ))}
                            </div>

                            {/* Navigation arrows */}
                            <button 
                                onClick={() => setCurrentAnimalIndex((prev) => (prev - 1 + animalImages.length) % animalImages.length)}
                                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 flex items-center justify-center text-white transition-all duration-200"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
                            </button>
                            <button 
                                onClick={() => setCurrentAnimalIndex((prev) => (prev + 1) % animalImages.length)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 flex items-center justify-center text-white transition-all duration-200"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* About Us Preview Section */}
            <section className="py-24 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
                <div className="container mx-auto px-6 lg:px-12">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                        <div className="order-2 lg:order-1">
                            <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full mb-6 shadow-sm">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                <span className="text-sm font-medium text-emerald-700">About Us</span>
                            </div>
                            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                                Pioneering Wildlife
                                <br />
                                <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Conservation</span>
                            </h2>
                            <p className="text-gray-600 text-lg leading-relaxed mb-8">
                                Founded in 2015, Bulusan Wildlife & Nature Park began as a small conservation initiative in Calapan City. Today, we stand as a testament to modern conservation, housing over 250 animals across 45 species through our innovative AI-powered systems.
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
                                {[
                                    { num: '8+', label: 'Years' },
                                    { num: '250+', label: 'Animals' },
                                    { num: '45', label: 'Species' },
                                    { num: '15', label: 'Programs' }
                                ].map((stat, i) => (
                                    <div key={i} className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100">
                                        <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">{stat.num}</div>
                                        <div className="text-gray-500 text-sm font-medium">{stat.label}</div>
                                    </div>
                                ))}
                            </div>
                            <Link to="/about" className="inline-flex items-center gap-3 bg-gray-900 hover:bg-gray-800 text-white px-8 py-4 rounded-full font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                                <span>Learn More About Us</span>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
                            </Link>
                        </div>
                        <div className="order-1 lg:order-2">
                            <div className="relative">
                                <div className="absolute -inset-4 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-3xl blur-2xl opacity-20"></div>
                                <img 
                                    src="https://images.unsplash.com/photo-1534567153574-2b12153a87f0?w=800&q=80" 
                                    alt="Wildlife Conservation" 
                                    className="relative rounded-3xl shadow-2xl w-full object-cover aspect-[4/3]"
                                />
                                <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl p-4 shadow-xl border border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">AI-Powered</p>
                                            <p className="text-sm text-gray-500">Smart Monitoring</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Animals Preview Section */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-6 lg:px-12">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full mb-6">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            <span className="text-sm font-medium text-emerald-700">Our Wildlife</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Meet Our Animals</h2>
                        <p className="text-gray-600 text-lg max-w-2xl mx-auto">Discover the incredible wildlife roaming freely at our AI-powered nature park.</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {[
                            { 
                                name: 'African Lions', 
                                category: 'Mammals', 
                                location: 'Savanna Zone',
                                image: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=600&q=80',
                                color: 'from-amber-400 to-orange-500'
                            },
                            { 
                                name: 'Asian Elephants', 
                                category: 'Mammals', 
                                location: 'Forest Habitat',
                                image: 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?w=600&q=80',
                                color: 'from-emerald-400 to-teal-500'
                            },
                            { 
                                name: 'Tropical Birds', 
                                category: 'Birds', 
                                location: 'Aviary',
                                image: 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=600&q=80',
                                color: 'from-blue-400 to-indigo-500'
                            }
                        ].map((animal, i) => (
                            <div key={i} className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:-translate-y-2">
                                <div className="relative h-64 overflow-hidden">
                                    <img 
                                        src={animal.image} 
                                        alt={animal.name}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                    <span className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-bold px-3 py-1.5 rounded-full">
                                        {animal.category}
                                    </span>
                                </div>
                                <div className="p-6">
                                    <h3 className="font-bold text-xl text-gray-900 mb-2">{animal.name}</h3>
                                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
                                        <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                                        <span>{animal.location}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                        <span className="text-sm text-emerald-600 font-medium">Live Now</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="text-center mt-12">
                        <Link to="/animals" className="inline-flex items-center gap-3 bg-gray-900 hover:bg-gray-800 text-white px-8 py-4 rounded-full font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                            <span>View All Animals</span>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Events Preview Section */}
            <section className="py-24 bg-gray-50">
                <div className="container mx-auto px-6 lg:px-12">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full mb-6 shadow-sm">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                            <span className="text-sm font-medium text-gray-700">Live Events</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Wildlife Events</h2>
                        <p className="text-gray-600 text-lg max-w-2xl mx-auto">Experience unforgettable moments with our animals through live feedings and shows.</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {[
                            { 
                                title: 'Penguin Feeding', 
                                time: '2:30 PM', 
                                desc: 'Watch our playful penguins dive and swim.',
                                IconComponent: Icons.Penguin,
                                color: 'from-blue-400 to-cyan-500',
                                live: true
                            },
                            { 
                                title: 'Tropical Bird Show', 
                                time: '1:00 PM', 
                                desc: 'Spectacular flight demonstrations.',
                                IconComponent: Icons.Parrot,
                                color: 'from-amber-400 to-orange-500',
                                live: false
                            },
                            { 
                                title: 'Lion Feeding', 
                                time: '4:00 PM', 
                                desc: 'Watch the kings of the jungle at mealtime.',
                                IconComponent: Icons.Lion,
                                color: 'from-yellow-400 to-amber-500',
                                live: false
                            }
                        ].map((event, i) => (
                            <div key={i} className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group hover:-translate-y-1">
                                <div className={`h-32 bg-gradient-to-br ${event.color} flex items-center justify-center relative`}>
                                    <span className="text-white w-12 h-12">
                                        {event.IconComponent && <event.IconComponent />}
                                    </span>
                                    {event.live && (
                                        <span className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                                            LIVE
                                        </span>
                                    )}
                                </div>
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="font-bold text-lg text-gray-900">{event.title}</h3>
                                        <span className="bg-emerald-50 text-emerald-700 text-sm font-bold px-3 py-1 rounded-lg">{event.time}</span>
                                    </div>
                                    <p className="text-gray-500 text-sm mb-4">{event.desc}</p>
                                    <button className="w-full py-3 bg-gray-100 hover:bg-gray-900 hover:text-white text-gray-800 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"/></svg>
                                        Join Event
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="text-center mt-12">
                        <Link to="/events" className="inline-flex items-center gap-3 bg-gray-900 hover:bg-gray-800 text-white px-8 py-4 rounded-full font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                            <span>View All Events</span>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Ticket Booking Section */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-6 lg:px-12 text-center">
                    <div className="inline-flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full mb-6">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span className="text-sm font-medium text-emerald-700">Book Online</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Online Ticket Booking</h2>
                    <p className="text-gray-600 mb-16 text-lg max-w-2xl mx-auto">Secure cloud-based reservations with instant digital confirmation and QR code access.</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                        {[
                            { title: 'Child Admission', price: '₱20', desc: 'Ages 4-12', IconComponent: Icons.Child },
                            { title: 'Adult Admission', price: '₱40', desc: 'Ages 13+', IconComponent: Icons.Adult, featured: true },
                            { title: 'Bulusan Residents', price: 'FREE', desc: 'With Valid ID', IconComponent: Icons.Home }
                        ].map((t, i) => (
                            <div 
                                key={i} 
                                className={`relative p-8 rounded-3xl transition-all duration-300 group hover:-translate-y-2 ${
                                    t.featured 
                                        ? 'bg-gray-900 text-white shadow-2xl shadow-gray-900/30 scale-105' 
                                        : 'bg-white border border-gray-200 hover:border-gray-300 hover:shadow-xl'
                                }`}
                            >
                                {t.featured && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                                        Popular
                                    </div>
                                )}
                                <div className={`w-12 h-12 mx-auto mb-4 ${t.featured ? 'text-white' : 'text-emerald-600'}`}>
                                    {t.IconComponent && <t.IconComponent />}
                                </div>
                                <h3 className={`text-xl font-bold mb-2 ${t.featured ? 'text-white' : 'text-gray-900'}`}>{t.title}</h3>
                                <div className={`text-4xl font-bold mb-4 ${
                                    t.featured 
                                        ? 'text-white' 
                                        : 'bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent'
                                }`}>{t.price}</div>
                                <p className={`mb-8 ${t.featured ? 'text-gray-400' : 'text-gray-500'}`}>{t.desc}</p>
                                <Link to="/tickets">
                                    <button className={`w-full py-3.5 rounded-xl font-semibold transition-all duration-200 ${
                                        t.featured 
                                            ? 'bg-white text-gray-900 hover:bg-gray-100' 
                                            : 'bg-gray-900 text-white hover:bg-gray-800'
                                    }`}>Book Now</button>
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Interactive Map Preview Section */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-6 lg:px-12">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full mb-6">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                <span className="text-sm font-medium text-emerald-700">Explore</span>
                            </div>
                            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                                Interactive
                                <br />
                                <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Park Map</span>
                            </h2>
                            <p className="text-gray-600 text-lg leading-relaxed mb-8">
                                Navigate our expansive nature park with our interactive map. Find animal exhibits, dining areas, restrooms, and discover the best routes to maximize your visit.
                            </p>
                            <div className="grid grid-cols-2 gap-4 mb-10">
                                {[
                                    { IconComponent: Icons.Lion, label: 'Animal Exhibits', count: '12+' },
                                    { IconComponent: Icons.Utensils, label: 'Dining Areas', count: '5' },
                                    { IconComponent: Icons.Restroom, label: 'Restrooms', count: '8' },
                                    { IconComponent: Icons.Theater, label: 'Show Venues', count: '3' }
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-2xl p-4">
                                        <span className="text-2xl text-emerald-600 w-8 h-8">{item.IconComponent && <item.IconComponent />}</span>
                                        <div>
                                            <p className="text-sm text-gray-500">{item.label}</p>
                                            <p className="font-bold text-gray-900">{item.count}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <Link to="/map" className="inline-flex items-center gap-3 bg-gray-900 hover:bg-gray-800 text-white px-8 py-4 rounded-full font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                                <span>Open Full Map</span>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>
                            </Link>
                        </div>
                        <div>
                            <div className="relative">
                                <div className="absolute -inset-4 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-3xl blur-2xl opacity-20"></div>
                                <div className="relative bg-gradient-to-br from-emerald-100 via-teal-50 to-cyan-100 rounded-3xl p-8 shadow-2xl border border-white">
                                    <div className="aspect-square relative">
                                        <svg viewBox="0 0 400 400" className="w-full h-full">
                                            <defs>
                                                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#d1fae5" strokeWidth="1"/>
                                                </pattern>
                                            </defs>
                                            <rect width="400" height="400" fill="url(#grid)" rx="24"/>
                                            
                                            <path d="M50 200 Q100 150 150 180 T250 160 T350 200" fill="none" stroke="#10b981" strokeWidth="3" strokeDasharray="8,4" opacity="0.6"/>
                                            <path d="M80 100 Q150 80 200 120 T320 100" fill="none" stroke="#14b8a6" strokeWidth="2" strokeDasharray="5,3" opacity="0.5"/>
                                            
                                            <circle cx="100" cy="120" r="35" fill="#fbbf24" opacity="0.8"/>
                                            <text x="100" y="130" textAnchor="middle" fontSize="12" fill="#ffffff" fontWeight="bold">LIONS</text>
                                            
                                            <circle cx="280" cy="100" r="30" fill="#60a5fa" opacity="0.8"/>
                                            <text x="280" y="105" textAnchor="middle" fontSize="10" fill="#ffffff" fontWeight="bold">PENGUINS</text>
                                            
                                            <circle cx="320" cy="250" r="35" fill="#34d399" opacity="0.8"/>
                                            <text x="320" y="255" textAnchor="middle" fontSize="10" fill="#ffffff" fontWeight="bold">ELEPHANTS</text>
                                            
                                            <circle cx="150" cy="300" r="30" fill="#f472b6" opacity="0.8"/>
                                            <text x="150" y="305" textAnchor="middle" fontSize="10" fill="#ffffff" fontWeight="bold">BIRDS</text>
                                            
                                            <circle cx="200" cy="200" r="25" fill="#a78bfa" opacity="0.8"/>
                                            <text x="200" y="205" textAnchor="middle" fontSize="10" fill="#ffffff" fontWeight="bold">DINING</text>
                                            
                                            <rect x="60" cy="320" width="60" height="30" rx="8" fill="#ffffff" stroke="#e5e7eb" strokeWidth="2"/>
                                            <text x="90" y="340" textAnchor="middle" fontSize="10" fill="#374151" fontWeight="bold">ENTRANCE</text>
                                            
                                            <circle cx="200" cy="50" r="8" fill="#ef4444">
                                                <animate attributeName="r" values="8;12;8" dur="1.5s" repeatCount="indefinite"/>
                                                <animate attributeName="opacity" values="1;0.6;1" dur="1.5s" repeatCount="indefinite"/>
                                            </circle>
                                            <text x="200" y="75" textAnchor="middle" fontSize="10" fill="#374151" fontWeight="bold">YOU ARE HERE</text>
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default Home;