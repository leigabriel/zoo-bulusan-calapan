import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AIChatAssistant from '../features/ai-assistant/AIChatAssistant';
import { AI_ASSISTANT_ICON } from '../../config/ai-assistant-theme';

const AIFloatingButton = () => {
    const [assistantOpen, setAssistantOpen] = useState(false);

    const closePanels = () => setAssistantOpen(false);

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
                <div className="fixed bottom-0 right-0 z-50 flex items-end justify-end p-4">
                    <div className="relative flex items-end">
                        <button
                            onClick={() => setAssistantOpen(true)}
                            className="relative z-50 w-25 h-25 flex items-center justify-center transition-transform duration-200 active:scale-95 hover:scale-110"
                        >
                            <img
                                src={AI_ASSISTANT_ICON}
                                className="w-25 h-25 object-contain"
                                alt="Open Assistant"
                            />
                        </button>
                    </div>
                </div>
            )}

            <AnimatePresence>
                {assistantOpen && (
                    <div className="fixed inset-0 z-[100] flex justify-end">
                        <motion.div
                            className="absolute inset-0 bg-emerald-900/15 backdrop-blur-md"
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