import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';

const hotspots = [
    { id: 'carabao', title: 'Carabao', desc: 'A symbol of hard work and perseverance in Philippine agriculture.', top: '56%', left: '39%' },
    { id: 'man', title: 'Man', desc: 'Looking towards a sustainable future for wildlife and nature.', top: '50%', left: '51%' },
    { id: 'deer', title: 'Deer', desc: 'Representing the graceful and endangered native fauna we protect.', top: '65%', left: '60%' }
];

const BulusanSection = () => {
    const [activeSpot, setActiveSpot] = useState(null);
    const containerRef = useRef(null);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start 85%", "start start"]
    });

    const clipPath = useTransform(scrollYProgress, [0, 1], ['circle(5% at 50% 50%)', 'circle(150% at 50% 50%)']);
    const imageScale = useTransform(scrollYProgress, [0, 1], [1.15, 1]);

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
            className="relative w-full h-full bg-[#1a1e26] m-0 p-0 overflow-hidden"
        >
            <motion.div
                style={{ clipPath }}
                className="absolute inset-0 w-full h-full overflow-hidden"
            >
                <motion.img
                    style={{ scale: imageScale }}
                    src="/bulusan.webp"
                    alt="Bulusan Park"
                    className="w-full h-full object-cover"
                    loading="lazy"
                />
                <div className="absolute top-0 left-0 w-full h-48 sm:h-64 bg-gradient-to-b from-[#1a1e26]/80 via-[#1a1e26]/40 to-transparent z-10 pointer-events-none" />
                <div className="absolute top-2 sm:top-4 md:top-6 left-0 w-full flex justify-center z-20 pointer-events-none px-2 sm:px-6">
                    <motion.h2
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: false, amount: 0.6 }}
                        variants={{
                            visible: { transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
                            hidden: {}
                        }}
                        aria-label="Bulusan"
                        className="text-white text-[20vw] sm:text-[20vw] font-normal tracking-wide uppercase text-center drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)] leading-[0.8] w-full whitespace-nowrap m-0 p-0"
                    >
                        {"Bulusan".split("").map((char, index) => (
                            <motion.span
                                key={index}
                                aria-hidden="true"
                                variants={{
                                    hidden: { opacity: 0 },
                                    visible: { opacity: 1 }
                                }}
                            >
                                {char}
                            </motion.span>
                        ))}
                    </motion.h2>
                </div>
                <div className="absolute inset-0 z-30">
                    {hotspots.map((spot) => {
                        const isActive = activeSpot === spot.id;
                        const hasActive = activeSpot !== null;

                        return (
                            <div
                                key={spot.id}
                                className="hotspot-container absolute flex items-center justify-center cursor-pointer"
                                style={{
                                    top: spot.top,
                                    left: spot.left,
                                    transform: 'translate(-50%, -50%)',
                                    zIndex: isActive ? 50 : 20
                                }}
                                onMouseEnter={() => setActiveSpot(spot.id)}
                                onMouseLeave={() => setActiveSpot(null)}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveSpot(prev => prev === spot.id ? null : spot.id);
                                }}
                            >
                                <motion.div
                                    animate={{ opacity: hasActive ? (isActive ? 1 : 0.3) : 1 }}
                                    transition={{ duration: 0.3 }}
                                    className="relative flex items-center justify-center w-8 h-8 md:w-10 md:h-10"
                                >
                                    <motion.div
                                        animate={{
                                            scale: isActive ? [1, 1.1, 1] : [1, 1.4, 1],
                                            opacity: isActive ? 1 : [0.6, 0, 0.6]
                                        }}
                                        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                                        className="absolute w-full h-full bg-white rounded-full"
                                    />
                                    <motion.div
                                        className="w-2.5 h-2.5 md:w-3 md:h-3 bg-white rounded-full shadow-lg z-10"
                                        animate={{ scale: isActive ? 1.3 : 1 }}
                                        transition={{ duration: 0.2 }}
                                    />
                                </motion.div>
                                <AnimatePresence>
                                    {isActive && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                            transition={{ duration: 0.2, ease: "easeOut" }}
                                            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-[200px] sm:w-[240px] md:w-[280px] p-3 md:p-5 bg-white shadow-xl rounded-lg border border-gray-100 cursor-default pointer-events-auto"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <h4 className="text-gray-900 font-bold text-sm md:text-lg mb-1">
                                                {spot.title}
                                            </h4>
                                            <p className="text-gray-600 text-xs md:text-sm leading-relaxed">
                                                {spot.desc}
                                            </p>
                                            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-b border-r border-gray-100 rotate-45" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>
            </motion.div>
        </section>
    );
};

export default BulusanSection;
