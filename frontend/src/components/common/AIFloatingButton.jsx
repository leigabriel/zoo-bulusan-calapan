import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AIChatAssistant from '../features/ai-assistant/AIChatAssistant';
import useScrollLock from '../../hooks/use-scroll-lock';

const MotionDiv = motion.div;

const AIFloatingButton = () => {
    const [assistantOpen, setAssistantOpen] = useState(false);

    const closePanels = () => setAssistantOpen(false);

    useScrollLock(assistantOpen);

    useEffect(() => {
        if (!assistantOpen) return undefined;
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') closePanels();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [assistantOpen]);

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
                        <button
                            onClick={() => setAssistantOpen(true)}
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
                    <div className="fixed inset-0 z-[100] flex justify-end overscroll-none">
                        <MotionDiv
                            className="absolute inset-0 bg-emerald-900/15 backdrop-blur-md"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={closePanels}
                        />
                        <MotionDiv
                            className="relative w-full md:w-3/5 h-[100dvh] min-h-0 bg-white shadow-2xl flex flex-col overflow-hidden overscroll-contain"
                            variants={panelVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            onClick={(e) => e.stopPropagation()}
                            data-lenis-prevent
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
