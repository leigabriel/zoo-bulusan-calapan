import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RoleCompanionAssistant from '../features/ai-assistant/RoleCompanionAssistant';
import { AI_ASSISTANT_ICON } from '../../config/ai-assistant-theme';

const RoleCompanionFloatingButton = ({ role = 'staff' }) => {
    const normalizedRole = role === 'admin' ? 'admin' : 'staff';

    const [assistantOpen, setAssistantOpen] = useState(false);

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


    const panelVariants = {
        hidden: { x: '100%' },
        visible: { x: 0, transition: { type: 'spring', damping: 30, stiffness: 220 } },
        exit: { x: '100%', transition: { type: 'spring', damping: 30, stiffness: 220 } }
    };

    return (
        <>
            {!assistantOpen && (
                <div className="fixed bottom-0 right-0 z-[70] flex items-end justify-end p-4">
                    <div className="relative flex items-end">
                        <button
                            onClick={() => setAssistantOpen(true)}
                            className="relative z-50 w-20 h-20 flex items-center justify-center transition-transform duration-200 active:scale-95 hover:scale-110"
                            aria-label={`Open ${normalizedRole} AI companion`}
                        >
                            <img
                                src={AI_ASSISTANT_ICON}
                                className="w-20 h-20 object-contain"
                                alt="Open AI Companion"
                            />
                        </button>
                    </div>
                </div>
            )}

            <AnimatePresence>
                {assistantOpen && (
                    <div className="fixed inset-0 z-[120] flex justify-end">
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
                            <RoleCompanionAssistant role={normalizedRole} onClose={closePanels} />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

export default RoleCompanionFloatingButton;
