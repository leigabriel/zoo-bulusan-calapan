import React, { useState, useEffect } from 'react';
import AIChatAssistant from '../features/ai-assistant/AIChatAssistant';
import AnimalClassifier from '../features/ai-scanner/AnimalClassifier';

const AIFloatingButton = () => {
    const [activeFeature, setActiveFeature] = useState(null); // 'assistant' | 'scanner' | null

    // Prevent body scroll when AI panel is open (mobile full screen)
    useEffect(() => {
        if (activeFeature) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [activeFeature]);

    const toggleAIPanel = () => {
        if (activeFeature) {
            setActiveFeature(null);
        } else {
            setActiveFeature('assistant');
        }
    };

    const switchToScanner = () => {
        setActiveFeature('scanner');
    };

    const switchToAssistant = () => {
        setActiveFeature('assistant');
    };

    const closeAIPanel = () => {
        setActiveFeature(null);
    };

    return (
        <>
            {/* AI Assistant Floating Button */}
            {!activeFeature && (
                <button
                    onClick={toggleAIPanel}
                    aria-label="Open AI Assistant"
                    className="fixed bottom-6 right-6 z-50 group"
                >
                    <div className="relative">
                        {/* Pulse ring animation */}
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 animate-ping opacity-25"></div>
                        
                        {/* Main button */}
                        <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-xl shadow-emerald-500/30 transform transition-all duration-300 hover:scale-110 hover:shadow-2xl hover:shadow-emerald-500/40 active:scale-95">
                            <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="11" width="18" height="10" rx="2" />
                                <circle cx="12" cy="5" r="2" />
                                <path d="M12 7v4" />
                            </svg>
                        </div>
                        
                        {/* Tooltip */}
                        <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap">
                            AI Assistant
                            <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-gray-900"></div>
                        </div>
                    </div>
                </button>
            )}

            {/* Right-side AI Panel - Half screen on desktop, full screen on mobile */}
            {activeFeature && (
                <div className="fixed inset-0 z-[9999] flex justify-end">
                    {/* Backdrop overlay */}
                    <div 
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={closeAIPanel}
                    />
                    
                    {/* Panel */}
                    <div className="relative w-full md:w-[480px] lg:w-[520px] xl:w-[560px] h-full bg-white shadow-2xl flex flex-col animate-slide-in-right">
                        {/* Panel Header - Modern gradient design */}
                        <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 p-4 flex items-center justify-between text-white shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                        {activeFeature === 'assistant' ? (
                                            <svg className="w-5 h-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <rect x="3" y="11" width="18" height="10" rx="2" />
                                                <circle cx="12" cy="5" r="2" />
                                                <path d="M12 7v4" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                                <circle cx="12" cy="13" r="4" />
                                            </svg>
                                        )}
                                    </div>
                                    {/* Online indicator */}
                                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-gray-900"></div>
                                </div>
                                <div>
                                    <h3 className="font-bold text-base">
                                        {activeFeature === 'assistant' ? 'Zooey AI' : 'Animal Scanner'}
                                    </h3>
                                    <p className="text-xs text-gray-400 flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                                        {activeFeature === 'assistant' ? 'Online • Ready to help' : 'Ready to scan'}
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={closeAIPanel} 
                                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>

                        {/* Tab Switcher - Modern pill design */}
                        <div className="bg-gray-50 border-b border-gray-200 p-3 shrink-0">
                            <div className="flex gap-2 bg-gray-200/60 p-1 rounded-xl">
                                <button
                                    onClick={switchToAssistant}
                                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                                        activeFeature === 'assistant'
                                            ? 'bg-white text-emerald-600 shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="11" width="18" height="10" rx="2" />
                                        <circle cx="12" cy="5" r="2" />
                                    </svg>
                                    Chat
                                </button>
                                <button
                                    onClick={switchToScanner}
                                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                                        activeFeature === 'scanner'
                                            ? 'bg-white text-teal-600 shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                        <circle cx="12" cy="13" r="4" />
                                    </svg>
                                    Scanner
                                </button>
                            </div>
                        </div>

                        {/* Panel Content */}
                        <div className="flex-1 overflow-hidden">
                            {activeFeature === 'assistant' && (
                                <AIChatAssistant embedded={true} />
                            )}
                            {activeFeature === 'scanner' && (
                                <AnimalClassifier embedded={true} />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AIFloatingButton;
