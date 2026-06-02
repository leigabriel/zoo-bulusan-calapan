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
