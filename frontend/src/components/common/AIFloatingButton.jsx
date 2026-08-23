import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import AIChatAssistant from '../features/ai-assistant/AIChatAssistant';

const MotionDiv = motion.div;

const AIFloatingButton = () => {
    const [assistantOpen, setAssistantOpen] = useState(false);
    const [bubbleIndex, setBubbleIndex] = useState(0);
    const [bubbleVisible, setBubbleVisible] = useState(false);
    const { user } = useAuth();

    const username = user?.firstName || user?.username || 'there';
    const bubbleMessages = [
        `Hi ${username}, how may I help you today?`,
        'I can help you discover animals, plan your visit, find feeding times, and explore the zoo.',
        'Ask me anything about Bulusan Zoo and I will point you in the right direction.'
    ];

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
        let closeTimer;
        let nextTimer;
        let startTimer;

        const scheduleCycle = () => {
            closeTimer = setTimeout(() => {
                setBubbleVisible(false);
                nextTimer = setTimeout(() => {
                    setBubbleIndex(index => (index + 1) % bubbleMessages.length);
                    setBubbleVisible(true);
                    scheduleCycle();
                }, 6000);
            }, 5000);
        };

        startTimer = setTimeout(() => {
            setBubbleVisible(true);
            scheduleCycle();
        }, 700);

        return () => {
            clearTimeout(startTimer);
            clearTimeout(closeTimer);
            clearTimeout(nextTimer);
        };
    }, [bubbleMessages.length]);

    const panelVariants = {
        hidden: { x: '100%' },
        visible: { x: 0, transition: { type: 'spring', damping: 30, stiffness: 200 } },
        exit: { x: '100%', transition: { type: 'spring', damping: 30, stiffness: 200 } }
    };

    return (
        <>
            {!assistantOpen && (
                <div className="fixed bottom-0 right-0 z-50 flex items-end justify-end p-3 sm:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                    <div className="relative">
                        <AnimatePresence mode="wait">
                            {bubbleVisible && !assistantOpen && (
                                <MotionDiv
                                    key={bubbleIndex}
                                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 4, scale: 0.96, transition: { duration: 1 } }}
                                    transition={{ duration: 0.28, ease: 'easeOut' }}
                                    className="absolute right-0 bottom-[calc(100%+0.75rem)] w-[min(18rem,calc(100vw-2rem))] rounded-2xl rounded-br-md border border-emerald-100 bg-white px-4 py-3.5 text-left shadow-[0_14px_35px_rgba(15,67,43,0.16)]"
                                >
                                    <div className="flex items-start gap-2.5">
                                        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-xs font-bold text-emerald-700">AI</span>
                                        <p className="text-[13px] font-medium leading-relaxed text-slate-700">{bubbleMessages[bubbleIndex]}</p>
                                    </div>
                                    <span className="absolute -bottom-2 right-5 h-4 w-4 rotate-45 border-b border-r border-emerald-100 bg-white" />
                                </MotionDiv>
                            )}
                        </AnimatePresence>
                        <button
                            onClick={() => { setBubbleVisible(false); setAssistantOpen(true); }}
                            type="button"
                            aria-label="Open Zusan AI assistant"
                            className="relative cursor-pointer border-0 bg-transparent z-40 flex items-center justify-center
                       w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20
                       transition-transform duration-200
                       active:scale-95 hover:scale-110"
                         >
                             <img
                                 src="/zusan-ai.svg"
                                 className="w-full h-full object-contain pointer-events-none"
                                 alt="Open Zusan AI assistant"
                             />
                         </button>
                    </div>
                </div>
            )}

            <AnimatePresence>
                {assistantOpen && (
                    <div className="fixed inset-0 z-[100] flex justify-end">
                        <MotionDiv
                            className="absolute inset-0 bg-emerald-900/15 backdrop-blur-md"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={closePanels}
                        />
                        <MotionDiv
                            className="relative w-full md:w-3/5 h-[100dvh] min-h-0 bg-white shadow-2xl flex flex-col overflow-hidden"
                            variants={panelVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <AIChatAssistant onClose={closePanels} />
                        </MotionDiv>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

export default AIFloatingButton;
