import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AIChatAssistant from '../features/ai-assistant/AIChatAssistant';
import AnimalClassifier from '../features/ai-scanner/AnimalClassifier';

// Icons
const ChatIcon = () => (
    <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        <path d="M9 9h.01M12 9h.01M15 9h.01"/>
    </svg>
);

const ScannerIcon = () => (
    <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
        <circle cx="12" cy="13" r="4"/>
    </svg>
);

const CloseIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
);

const SparkleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/>
    </svg>
);

const AIFloatingButton = () => {
    const [assistantOpen, setAssistantOpen] = useState(false);
    const [scannerOpen, setScannerOpen] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    // Prevent body scroll when panels are open
    useEffect(() => {
        if (assistantOpen || scannerOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [assistantOpen, scannerOpen]);

    const panelVariants = {
        hidden: { x: '100%', opacity: 0 },
        visible: { 
            x: 0, 
            opacity: 1,
            transition: { type: 'spring', damping: 25, stiffness: 200 }
        },
        exit: { 
            x: '100%', 
            opacity: 0,
            transition: { type: 'spring', damping: 25, stiffness: 200 }
        }
    };

    const menuVariants = {
        hidden: { scale: 0.8, opacity: 0, y: 10 },
        visible: { 
            scale: 1, 
            opacity: 1, 
            y: 0,
            transition: { type: 'spring', damping: 20, stiffness: 300 }
        },
        exit: { 
            scale: 0.8, 
            opacity: 0, 
            y: 10,
            transition: { duration: 0.15 }
        }
    };

    return (
        <>
            {/* Floating Action Button Group */}
            {!assistantOpen && !scannerOpen && (
                <div className="fixed bottom-6 right-6 z-50">
                    {/* Menu Options */}
                    <AnimatePresence>
                        {showMenu && (
                            <motion.div 
                                className="absolute bottom-16 right-0 flex flex-col gap-3 mb-2"
                                variants={menuVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                            >
                                {/* Scanner Button */}
                                <motion.button
                                    onClick={() => {
                                        setScannerOpen(true);
                                        setShowMenu(false);
                                    }}
                                    className="group flex items-center gap-3"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <span className="px-3 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                        Animal Scanner
                                    </span>
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all">
                                        <ScannerIcon />
                                    </div>
                                </motion.button>

                                {/* Assistant Button */}
                                <motion.button
                                    onClick={() => {
                                        setAssistantOpen(true);
                                        setShowMenu(false);
                                    }}
                                    className="group flex items-center gap-3"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <span className="px-3 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                        Chat with Zooey
                                    </span>
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all">
                                        <ChatIcon />
                                    </div>
                                </motion.button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Main FAB */}
                    <motion.button
                        onClick={() => setShowMenu(!showMenu)}
                        className="relative"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        aria-label="Open AI Features"
                    >
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 animate-ping opacity-20"></div>
                        <div className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-xl shadow-emerald-500/30 transition-all duration-300 ${showMenu ? 'rotate-45' : ''}`}>
                            <motion.div
                                animate={{ rotate: showMenu ? 45 : 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                {showMenu ? (
                                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <line x1="12" y1="5" x2="12" y2="19"/>
                                        <line x1="5" y1="12" x2="19" y2="12"/>
                                    </svg>
                                ) : (
                                    <div className="relative">
                                        <SparkleIcon />
                                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
                                    </div>
                                )}
                            </motion.div>
                        </div>
                    </motion.button>
                </div>
            )}

            {/* AI Assistant Panel - Left side */}
            <AnimatePresence>
                {assistantOpen && (
                    <div className="fixed inset-0 z-[9999] flex justify-end">
                        <motion.div 
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setAssistantOpen(false)}
                        />
                        
                        <motion.div 
                            className="relative w-full md:w-[480px] lg:w-[520px] h-full bg-white shadow-2xl flex flex-col"
                            variants={panelVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                        >
                            {/* Assistant Header */}
                            <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 p-4 flex items-center justify-between text-white shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                                            <ChatIcon />
                                        </div>
                                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-emerald-700"></div>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-base flex items-center gap-2">
                                            Zooey AI
                                            <span className="text-xs font-normal px-2 py-0.5 bg-white/20 rounded-full">Assistant</span>
                                        </h3>
                                        <p className="text-xs text-emerald-100 flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                                            Online • Ready to help
                                        </p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setAssistantOpen(false)} 
                                    className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                                >
                                    <CloseIcon />
                                </button>
                            </div>

                            {/* Assistant Content */}
                            <div className="flex-1 overflow-hidden">
                                <AIChatAssistant embedded={true} />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* AI Scanner Panel - Right side */}
            <AnimatePresence>
                {scannerOpen && (
                    <div className="fixed inset-0 z-[9999] flex justify-end isolate">
                        <motion.div 
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setScannerOpen(false)}
                        />
                        
                        <motion.div 
                            className="relative w-full md:w-[520px] lg:w-[560px] h-full bg-white shadow-2xl flex flex-col overflow-hidden"
                            variants={panelVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                        >
                            {/* Scanner Header */}
                            <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 p-4 flex items-center justify-between text-white shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                                            <ScannerIcon />
                                        </div>
                                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-purple-400 rounded-full border-2 border-purple-700"></div>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-base flex items-center gap-2">
                                            Animal Scanner
                                            <span className="text-xs font-normal px-2 py-0.5 bg-white/20 rounded-full">AI</span>
                                        </h3>
                                        <p className="text-xs text-purple-100 flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse"></span>
                                            Ready to identify animals
                                        </p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setScannerOpen(false)} 
                                    className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                                >
                                    <CloseIcon />
                                </button>
                            </div>

                            {/* Scanner Content */}
                            <div className="flex-1 overflow-hidden min-h-0">
                                <AnimalClassifier embedded={true} />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

export default AIFloatingButton;
