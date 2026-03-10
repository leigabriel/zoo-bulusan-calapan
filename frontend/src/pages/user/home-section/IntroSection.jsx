import React from 'react';
import { motion } from 'framer-motion';

const IntroSection = () => {
    const titleText = "Animals and Plants";

    return (
        <section className="bg-[#ebebeb] flex items-center px-6 py-12 md:px-16 md:py-24 w-full overflow-hidden">
            <div className="max-w-[1450px] mx-auto w-full flex flex-col">
                <h1 className="text-[#212631] text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-medium leading-tight md:leading-[1.1] tracking-tight">
                    <motion.span
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: false, amount: 0.5 }}
                        variants={{
                            visible: { transition: { staggerChildren: 0.05 } },
                            hidden: {}
                        }}
                        aria-label={titleText}
                    >
                        {titleText.split("").map((char, index) => (
                            <motion.span
                                key={index}
                                aria-hidden="true"
                                variants={{
                                    hidden: { opacity: 0 },
                                    visible: { opacity: 1 }
                                }}
                            >
                                {char === " " ? "\u00A0" : char}
                            </motion.span>
                        ))}
                    </motion.span>
                </h1>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ duration: 0.8, delay: 0.6, ease: 'easeOut' }}
                    className="mt-4 text-[#212631]/80 text-xl md:text-lg lg:text-xl max-w-3xl"
                >
                    Discover a diverse collection of animals and plants from around the world, each with unique stories and characteristics that inspire wonder and conservation.
                </motion.p>
            </div>
        </section>
    );
};

export default IntroSection;