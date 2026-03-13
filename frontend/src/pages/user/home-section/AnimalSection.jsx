import React from 'react';
import { motion } from 'framer-motion';

const AnimalSection = () => {
    // Framer Motion variants for a lightweight staggered animation
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2,
                delayChildren: 0.1,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }, // Smooth easing
        },
    };

    return (
        <section className="bg-[#ebebeb] text-[#212631] w-full min-h-screen px-5 py-12 md:py-24 font-sans overflow-hidden">
            <motion.div
                className="max-w-[1400px] mx-auto flex flex-col gap-12 md:gap-20"
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }} // Triggers slightly before scrolling into view
            >

                {/* Header Content */}
                <div className="flex flex-col md:flex-row justify-between items-start gap-8 md:gap-12">
                    <motion.h1
                        variants={itemVariants}
                        className="text-5xl md:text-6xl lg:text-[5.5rem] leading-[1.05] tracking-tight font-bold flex-1"
                    >
                        Instinct<br />Before Form.
                    </motion.h1>

                    <motion.p
                        variants={itemVariants}
                        className="text-[#38d091] text-xl md:text-2xl lg:text-3xl leading-snug font-normal flex-1 max-w-[600px] pt-2"
                    >
                        We capture nature through observation — a visual dialogue between instinct and environment, where animals are not just seen, but understood.
                    </motion.p>
                </div>

                {/* Media & Meta Container */}
                <motion.div variants={itemVariants} className="flex flex-col gap-4">

                    {/* Meta Data Row */}
                    <div className="flex justify-between items-center text-sm md:text-base">
                        <span className="text-[#38d091]">(025)</span>
                        <div className="flex gap-4">
                            <span className="font-semibold">Wilderness</span>
                            <span className="text-[#38d091] hidden sm:inline-block">Species Identity, Habitat Curation</span>
                        </div>
                    </div>

                    {/* Image Area */}
                    <div className="relative w-full rounded-sm overflow-hidden group">
                        {/* Using an Unsplash placeholder. 
              The aspect ratio changes cleanly from mobile to desktop. 
            */}
                        <img
                            src="https://images.unsplash.com/photo-1546182990-dffeafbe841d?q=80&w=2000&auto=format&fit=crop"
                            alt="Lion in the wild"
                            className="w-full h-[50vh] md:h-[70vh] lg:h-[80vh] object-cover transition-transform duration-1000 group-hover:scale-105"
                        />

                        {/* Image Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 flex justify-between items-end text-white z-10">
                            <span className="text-sm md:text-base font-medium">Serengeti 06:15 AM</span>
                            <a
                                href="#more"
                                className="text-sm md:text-base font-medium border-b border-white pb-0.5 hover:text-[#38d091] hover:border-[#38d091] transition-colors"
                            >
                                See More &rarr;
                            </a>
                        </div>
                    </div>

                </motion.div>
            </motion.div>
        </section>
    );
};

export default AnimalSection;