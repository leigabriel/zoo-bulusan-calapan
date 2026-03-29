import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RoleCompanionAssistant from '../features/ai-assistant/RoleCompanionAssistant';

const ROLE_MESSAGES = {
    admin: [
        'Need a strategy check?',
        'Review priorities with me.',
        'I can help with admin planning.',
        'Need a quick KPI summary?',
        'Ask for an action plan.'
    ],
    staff: [
        'Need shift guidance?',
        'Ask for a task checklist.',
        'I can help with reservations.',
        'Need moderation steps?',
        'Let us solve it quickly.'
    ]
};

const RoleCompanionFloatingButton = ({ role = 'staff' }) => {
    const normalizedRole = role === 'admin' ? 'admin' : 'staff';
    const messages = useMemo(() => ROLE_MESSAGES[normalizedRole], [normalizedRole]);

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
        return () => {
            document.body.style.overflow = '';
        };
    }, [assistantOpen]);

    useEffect(() => {
        if (assistantOpen) return;

        const cycle = () => {
            setShowMsg(true);
            setMsgIndex(prev => (prev + 1) % messages.length);
            setTimeout(() => setShowMsg(false), 2600);
        };

        const interval = setInterval(cycle, 5200);
        const initial = setTimeout(cycle, 1400);

        return () => {
            clearInterval(interval);
            clearTimeout(initial);
        };
    }, [assistantOpen, messages]);

    const panelVariants = {
        hidden: { x: '100%' },
        visible: { x: 0, transition: { type: 'spring', damping: 30, stiffness: 220 } },
        exit: { x: '100%', transition: { type: 'spring', damping: 30, stiffness: 220 } }
    };

    const bubbleColor = normalizedRole === 'admin' ? 'bg-emerald-800' : 'bg-gray-800';

    return (
        <>
            {!assistantOpen && (
                <div className="fixed bottom-0 right-0 z-[70] flex items-end justify-end p-4">
                    <div className="relative flex items-end">
                        <AnimatePresence>
                            {showMsg && (
                                <motion.div
                                    key={msgIndex}
                                    initial={{ opacity: 0, y: 6, scale: 0.92 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 6, scale: 0.92 }}
                                    transition={{ duration: 0.25 }}
                                    className={`absolute right-full mr-3 bottom-1 px-3 py-1.5 text-white text-sm font-medium rounded-lg shadow-lg whitespace-nowrap ${bubbleColor}`}
                                >
                                    {messages[msgIndex]}
                                    <div className={`absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 rotate-45 ${bubbleColor}`} />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <button
                            onClick={() => setAssistantOpen(true)}
                            className="relative z-50 w-20 h-20 flex items-center justify-center transition-transform duration-200 active:scale-95 hover:scale-110"
                            aria-label={`Open ${normalizedRole} AI companion`}
                        >
                            <img
                                src="/zusan.gif"
                                className="w-20 h-20 object-contain"
                                alt="Open AI Companion"
                                style={{ mixBlendMode: 'multiply' }}
                            />
                        </button>
                    </div>
                </div>
            )}

            <AnimatePresence>
                {assistantOpen && (
                    <div className="fixed inset-0 z-[120] flex justify-end">
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
                            <RoleCompanionAssistant role={normalizedRole} onClose={closePanels} />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

export default RoleCompanionFloatingButton;
