import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RoleCompanionAssistant from '../features/ai-assistant/RoleCompanionAssistant';
import { AI_ASSISTANT_ICON } from '../../config/ai-assistant-theme';
import useScrollLock from '../../hooks/use-scroll-lock';

const MotionDiv = motion.div;

const RoleCompanionFloatingButton = ({ role = 'staff', open, onOpenChange, hideTrigger = false }) => {
    const normalizedRole = role === 'admin' ? 'admin' : 'staff';

    const [internalOpen, setInternalOpen] = useState(false);
    const assistantOpen = open ?? internalOpen;
    const setAssistantOpen = onOpenChange ?? setInternalOpen;

    const closePanels = () => setAssistantOpen(false);

    useScrollLock(assistantOpen);

    useEffect(() => {
        if (!assistantOpen) return undefined;
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') setAssistantOpen(false);
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [assistantOpen, setAssistantOpen]);


    const panelVariants = {
        hidden: { x: '100%' },
        visible: { x: 0, transition: { type: 'spring', damping: 30, stiffness: 220 } },
        exit: { x: '100%', transition: { type: 'spring', damping: 30, stiffness: 220 } }
    };

    return (
        <>
            {!hideTrigger && !assistantOpen && (
                <div className="fixed bottom-0 right-0 z-50 flex items-end justify-end p-3 sm:p-4">
                    <div className="relative">
                        <button
                            onClick={() => setAssistantOpen(true)}
                            className="relative border border-gray-500 z-40 flex items-center justify-center
                       w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20
                       rounded-full bg-[#c6fe69]
                       shadow-lg
                       transition-transform duration-200
                       active:scale-95 hover:scale-110"
                        />

                        <img
                            src={AI_ASSISTANT_ICON}
                            className="absolute inset-0 m-auto z-50
                       w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12
                       object-contain pointer-events-none"
                            alt="Assistant Icon"
                        />
                    </div>
                </div>
            )}

            <AnimatePresence>
                {assistantOpen && (
                    <div className="fixed inset-0 z-[120] flex justify-end overscroll-none">
                        <MotionDiv
                            className="absolute inset-0 bg-emerald-900/15 backdrop-blur-md"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={closePanels}
                        />
                        <MotionDiv
                            className="relative w-full md:w-3/4 lg:w-1/2 h-[100dvh] min-h-0 bg-white shadow-2xl flex flex-col overflow-hidden overscroll-contain"
                            variants={panelVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            onClick={(e) => e.stopPropagation()}
                            data-lenis-prevent
                        >
                            <RoleCompanionAssistant role={normalizedRole} onClose={closePanels} />
                        </MotionDiv>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

export default RoleCompanionFloatingButton;
