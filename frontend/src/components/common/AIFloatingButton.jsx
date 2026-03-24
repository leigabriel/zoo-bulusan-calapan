import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AIChatAssistant from '../features/ai-assistant/AIChatAssistant';

const MESSAGES = [
    "Need help?", "Ask me anything!", "Lost? I gotchu.",
    "Having trouble?", "Let's figure it out.", "I'm right here 👀",
    "Stuck? Talk to me.", "Try asking me!", "Questions welcome.",
    "I don't bite 🌿", "Go ahead, ask.", "Here if you need me.",
];

const AIFloatingButton = () => {
    const [assistantOpen, setAssistantOpen] = useState(false);
    const [msgIndex, setMsgIndex] = useState(0);
    const [showMsg, setShowMsg] = useState(false);

    const closePanels = () => setAssistantOpen(false);

    useEffect(() => {
        if (assistantOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [assistantOpen]);

    useEffect(() => {
        if (assistantOpen) return;

        const cycle = () => {
            setShowMsg(true);
            setMsgIndex(prev => (prev + 1) % MESSAGES.length);
            setTimeout(() => setShowMsg(false), 3000);
        };

        const interval = setInterval(cycle, 5000);
        const initial = setTimeout(cycle, 1500);

        return () => { clearInterval(interval); clearTimeout(initial); };
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
                        <AnimatePresence>
                            {showMsg && (
                                <motion.div
                                    key={msgIndex}
                                    initial={{ opacity: 0, y: 6, scale: 0.92 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 6, scale: 0.92 }}
                                    transition={{ duration: 0.25 }}
                                    className="absolute right-full mr-3 bottom-1 px-3 py-1.5 bg-gray-800 text-white text-sm font-medium rounded-lg shadow-lg whitespace-nowrap"
                                >
                                    {MESSAGES[msgIndex]}
                                    <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 bg-gray-800 rotate-45" />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <button
                            onClick={() => setAssistantOpen(true)}
                            className="relative z-50 w-25 h-25 flex items-center justify-center transition-transform duration-200 active:scale-95 hover:scale-110"
                        >
                            <img
                                src="/zusan.webp"
                                className="w-25 h-25 object-contain"
                                alt="Open Assistant"
                                style={{ mixBlendMode: 'multiply' }}
                            />
                        </button>
                    </div>
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