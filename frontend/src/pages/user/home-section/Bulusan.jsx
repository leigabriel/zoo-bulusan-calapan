import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';

const hotspots = [
    { id: 'carabao', title: 'Carabao', desc: 'A symbol of hard work and perseverance in Philippine agriculture.', top: '56%', left: '39%' },
    { id: 'man', title: 'Man', desc: 'Looking towards a sustainable future for wildlife and nature.', top: '50%', left: '51%' },
    { id: 'deer', title: 'Deer', desc: 'Representing the graceful and endangered native fauna we protect.', top: '65%', left: '60%' }
];

const Bulusan = () => {
    const [activeSpot, setActiveSpot] = useState(null);
    const containerRef = useRef(null);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"]
    });

    const scale = useTransform(scrollYProgress, [0, 0.4], [1.1, 1]);
    const backgroundOpacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.5, 1, 1, 0.5]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('.hotspot-container')) setActiveSpot(null);
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    return (
        <section
            ref={containerRef}
            className="relative w-full h-[70vh] md:h-screen bg-[#1a1e26] overflow-hidden m-0 p-0"
        >
            {/* Background Image - Blurs when ANY spot is active */}
            <motion.div
                style={{ scale, opacity: backgroundOpacity }}
                animate={{
                    filter: activeSpot ? 'brightness(0.4) blur(6px)' : 'brightness(1) blur(0px)',
                }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="absolute inset-0 w-full h-full"
            >
                <img
                    src="/bulusan.webp"
                    alt="Bulusan Park"
                    className="w-full h-full object-cover"
                />
            </motion.div>

            {/* Interactive Layer */}
            <div className="absolute inset-0">
                {hotspots.map((spot, index) => {
                    const isActive = activeSpot === spot.id;
                    const hasActive = activeSpot !== null;

                    return (
                        <motion.div
                            key={spot.id}
                            initial={{ opacity: 0, scale: 0 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            animate={{
                                opacity: hasActive ? (isActive ? 1 : 0.3) : 1,
                                filter: hasActive ? (isActive ? 'blur(0px)' : 'blur(4px)') : 'blur(0px)',
                                zIndex: isActive ? 50 : 20,
                            }}
                            transition={{
                                delay: hasActive ? 0 : 0.2 + (index * 0.1),
                                duration: 0.4,
                                ease: "easeOut"
                            }}
                            className="hotspot-container absolute flex items-center justify-center cursor-pointer"
                            style={{ top: spot.top, left: spot.left, transform: 'translate(-50%, -50%)' }}
                            onMouseEnter={() => setActiveSpot(spot.id)}
                            onMouseLeave={() => setActiveSpot(null)}
                            onClick={(e) => {
                                e.stopPropagation();
                                setActiveSpot(prev => prev === spot.id ? null : spot.id);
                            }}
                        >
                            {/* The Point of Interest */}
                            <div className="relative flex items-center justify-center w-10 h-10">
                                <motion.div
                                    animate={{
                                        scale: isActive ? [1, 1.2, 1] : [1, 1.5, 1],
                                        opacity: isActive ? 1 : [0.5, 0, 0.5]
                                    }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="absolute w-full h-full bg-white rounded-full"
                                />
                                <motion.div
                                    className="w-3 h-3 bg-white rounded-full shadow-xl z-10"
                                    animate={{ scale: isActive ? 1.4 : 1 }}
                                    transition={{ duration: 0.2 }}
                                />
                            </div>

                            {/* Clean, Simple Modal Card */}
                            <AnimatePresence>
                                {isActive && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 8 }}
                                        transition={{ duration: 0.2, ease: "easeOut" }}
                                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-[220px] md:w-[280px] p-4 md:p-5 bg-white shadow-xl rounded-lg border border-gray-100 cursor-default"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <h4 className="text-gray-900 font-bold text-base md:text-lg mb-1.5">
                                            {spot.title}
                                        </h4>
                                        <p className="text-gray-600 text-sm md:text-base leading-relaxed">
                                            {spot.desc}
                                        </p>

                                        {/* Simple Tooltip Arrow */}
                                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-b border-r border-gray-100 rotate-45" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>
        </section>
    );
};

export default Bulusan;