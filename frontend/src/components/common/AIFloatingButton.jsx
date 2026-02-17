import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AIChatAssistant from '../features/ai-assistant/AIChatAssistant';

const AIFloatingButton = () => {
    const [assistantOpen, setAssistantOpen] = useState(false);

    const closePanels = () => {
        setAssistantOpen(false);
    };

    useEffect(() => {
        if (assistantOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [assistantOpen]);

    const panelVariants = {
        hidden: { x: '100%' },
        visible: { x: 0, transition: { type: 'spring', damping: 30, stiffness: 200 } },
        exit: { x: '100%', transition: { type: 'spring', damping: 30, stiffness: 200 } }
    };

    return (
        <>
            {!assistantOpen && (
                <div className="fixed bottom-6 right-6 z-50">
                    <button
                        onClick={() => setAssistantOpen(true)}
                        className="relative z-50 w-16 h-16 rounded-full text-white flex items-center justify-center shadow-2xl transition-all duration-500 transform active:scale-95 hover:shadow-emerald-600/30"
                    >
                        <img
                            src="https://cdn-icons-png.flaticon.com/128/9068/9068693.png"
                            className="w-16 h-16"
                            alt="Open Assistant"
                        />
                    </button>
                </div>
            )}

            <AnimatePresence>
                {assistantOpen && (
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
                            <AIChatAssistant onClose={closePanels} />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

export default AIFloatingButton;