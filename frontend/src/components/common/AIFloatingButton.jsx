import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AIChatAssistant from '../features/ai-assistant/AIChatAssistant';
import AnimalClassifier from '../features/ai-scanner/AnimalClassifier';

const AIFloatingButton = () => {
    const [assistantOpen, setAssistantOpen] = useState(false);
    const [scannerOpen, setScannerOpen] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    const closePanels = () => {
        setAssistantOpen(false);
        setScannerOpen(false);
    };

    useEffect(() => {
        if (assistantOpen || scannerOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [assistantOpen, scannerOpen]);

    const panelVariants = {
        hidden: { x: '100%' },
        visible: { x: 0, transition: { type: 'spring', damping: 30, stiffness: 200 } },
        exit: { x: '100%', transition: { type: 'spring', damping: 30, stiffness: 200 } }
    };

    return (
        <>
            {!assistantOpen && !scannerOpen && (
                <div className="fixed bottom-6 right-6 z-50">
                    <AnimatePresence>
                        {showMenu && (
                            <motion.div
                                className="absolute bottom-20 right-0 flex flex-col gap-5 mb-2"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 15 }}
                            >
                                <button
                                    onClick={() => { setScannerOpen(true); setShowMenu(false); }}
                                    className="group relative flex items-center justify-center w-12 h-12 rounded-2xl bg-white text-emerald-600 shadow-xl border border-emerald-50 transition-all hover:bg-emerald-50"
                                >
                                    <span className="absolute right-full mr-4 px-3 py-1.5 bg-emerald-950/90 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                                        Scanner
                                    </span>
                                    <img src="https://api.iconify.design/solar:scanner-2-linear.svg?color=%2310b981" className="w-6 h-6" alt="Scanner" />
                                </button>

                                <button
                                    onClick={() => { setAssistantOpen(true); setShowMenu(false); }}
                                    className="group relative flex items-center justify-center w-12 h-12 rounded-2xl bg-white text-emerald-600 shadow-xl border border-emerald-50 transition-all hover:bg-emerald-50"
                                >
                                    <span className="absolute right-full mr-4 px-3 py-1.5 bg-emerald-950/90 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                                        Assistant
                                    </span>
                                    <img src="https://api.iconify.design/solar:chat-round-dots-linear.svg?color=%2310b981" className="w-6 h-6" alt="Assistant" />
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className={`relative z-50 w-20 h-20 rounded-full  text-white flex items-center justify-center shadow-2xl transition-all duration-500 transform active:scale-95 ${showMenu ? 'rotate-45 bg-emerald-950 shadow-emerald-900/20' : 'hover:shadow-emerald-600/30'}`}
                    >
                        <img
                            src={showMenu ? "https://api.iconify.design/solar:add-circle-linear.svg?color=white" : "https://cdn-icons-png.flaticon.com/128/9068/9068693.png"}
                            className="w-20 h-20"
                            alt="Toggle"
                        />
                    </button>
                </div>
            )}

            <AnimatePresence>
                {(assistantOpen || scannerOpen) && (
                    <div className="fixed inset-0 z-[100] flex justify-end">
                        <motion.div
                            className="absolute inset-0 bg-emerald-950/20 backdrop-blur-md"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={closePanels}
                        />

                        <motion.div
                            className="relative w-full md:w-3/4 lg:w-1/2 h-full bg-white shadow-2xl flex flex-col"
                            variants={panelVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {assistantOpen ? (
                                <AIChatAssistant onClose={closePanels} />
                            ) : (
                                <AnimalClassifier onClose={closePanels} embedded={true} />
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

export default AIFloatingButton;