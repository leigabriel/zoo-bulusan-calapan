import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const AboutSection = () => {
    const titleText = "About Bulusan Zoo";

    return (
        <section className="bg-[#007a55] flex-1 flex items-center px-6 py-10 md:px-16 md:py-16 w-full overflow-hidden">
            <div className="max-w-[1500px] mx-auto w-full flex flex-col justify-center h-full">
                <h2 className="text-[#ebebeb] text-2xl md:text-3xl lg:text-4xl uppercase tracking-wide mb-8 md:mb-16 flex">
                    <motion.span
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: false, amount: 0.5 }}
                        variants={{
                            visible: { transition: { staggerChildren: 0.06 } },
                            hidden: {}
                        }}
                    >
                        {titleText.split("").map((char, index) => (
                            <motion.span
                                key={index}
                                variants={{
                                    hidden: { opacity: 0, display: 'none' },
                                    visible: { opacity: 1, display: 'inline' }
                                }}
                            >
                                {char === " " ? "\u00A0" : char}
                            </motion.span>
                        ))}
                    </motion.span>
                </h2>
                <div className="mb-8 md:mb-16">
                    {['Founded in 2015,', 'Bulusan Wildlife & Nature Park', 'began as a small conservation', 'initiative in Calapan City.'].map((line, i) => (
                        <p key={i} className="text-[#ebebeb] text-5xl sm:text-7xl md:text-7xl lg:text-7xl leading-[1.15] md:leading-[1.1] tracking-tight">
                            <span className="overflow-hidden inline-block w-full" style={{ verticalAlign: 'bottom' }}>
                                <span style={{ display: 'block' }}>{line}</span>
                            </span>
                        </p>
                    ))}
                </div>
                <div className="self-end mt-auto md:mt-0">
                    <Link to="/about" className="border border-[#ebebeb]/30 text-[#ebebeb] text-xs md:text-sm font-bold tracking-widest uppercase px-8 py-4 hover:bg-[#212631] hover:text-[#ebebeb] transition-all duration-300 inline-block">More</Link>
                </div>
            </div>
        </section>
    );
};

export default AboutSection;