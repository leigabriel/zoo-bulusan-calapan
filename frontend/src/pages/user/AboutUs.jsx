import React, { useRef } from 'react';
import { ReactLenis } from 'lenis/react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import AIFloatingButton from '../../components/common/AIFloatingButton';

const E = [0.16, 1, 0.3, 1];
const OPT = { once: false, margin: '-6%' };

const Chars = ({ text, className = '', delay = 0, stagger = 0.034 }) => {
    const ref = useRef(null);
    const inView = useInView(ref, OPT);
    return (
        <span ref={ref} className={`inline-flex flex-wrap ${className}`} aria-label={text}>
            {text.split('').map((ch, i) => (
                <span
                    key={i}
                    className="overflow-hidden inline-block"
                    style={{ whiteSpace: ch === ' ' ? 'pre' : 'normal' }}
                >
                    <motion.span
                        className="inline-block"
                        initial={{ y: '115%', opacity: 0 }}
                        animate={inView ? { y: '0%', opacity: 1 } : { y: '115%', opacity: 0 }}
                        transition={{ duration: 0.7, delay: delay + i * stagger, ease: E }}
                    >
                        {ch}
                    </motion.span>
                </span>
            ))}
        </span>
    );
};

const Reveal = ({ children, delay = 0, className = '' }) => {
    const ref = useRef(null);
    const inView = useInView(ref, OPT);
    return (
        <motion.div
            ref={ref}
            className={className}
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
            transition={{ duration: 0.75, delay, ease: E }}
        >
            {children}
        </motion.div>
    );
};

const ClipReveal = ({ children, delay = 0, className = '' }) => {
    const ref = useRef(null);
    const inView = useInView(ref, OPT);
    return (
        <div className={`overflow-hidden ${className}`}>
            <motion.div
                ref={ref}
                initial={{ y: '100%' }}
                animate={inView ? { y: '0%' } : { y: '100%' }}
                transition={{ duration: 0.72, delay, ease: E }}
            >
                {children}
            </motion.div>
        </div>
    );
};

const Wire = ({ delay = 0, className = '', vertical = false }) => {
    const ref = useRef(null);
    const inView = useInView(ref, OPT);
    return (
        <motion.div
            ref={ref}
            className={`bg-[#212631]/15 ${vertical ? 'w-px origin-top' : 'h-px origin-left'} ${className}`}
            initial={{ scale: 0 }}
            animate={inView ? { scale: 1 } : { scale: 0 }}
            transition={{ duration: 1.05, delay, ease: E }}
        />
    );
};

const Stat = ({ value, label, delay = 0 }) => {
    const ref = useRef(null);
    const inView = useInView(ref, OPT);
    return (
        <div ref={ref} className="flex flex-col gap-1">
            <motion.span
                className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#212631]/40"
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.5, delay, ease: E }}
            >
                {label}
            </motion.span>
            <div className="overflow-hidden">
                <motion.span
                    className="block text-5xl sm:text-6xl md:text-7xl font-extralight text-[#212631] tracking-tighter leading-[0.9]"
                    initial={{ y: '105%' }}
                    animate={inView ? { y: '0%' } : { y: '105%' }}
                    transition={{ duration: 0.85, delay: delay + 0.1, ease: E }}
                >
                    {value}
                </motion.span>
            </div>
        </div>
    );
};

const Feature = ({ title, desc, index }) => {
    const ref = useRef(null);
    const inView = useInView(ref, OPT);
    const d = index * 0.1;
    return (
        <div ref={ref} className="group flex flex-col gap-4 py-7 md:py-8">
            <div className="flex items-start gap-4">
                <motion.span
                    className="text-[10px] font-medium text-[#212631]/30 tracking-widest pt-1 shrink-0"
                    initial={{ opacity: 0 }}
                    animate={inView ? { opacity: 1 } : { opacity: 0 }}
                    transition={{ duration: 0.5, delay: d, ease: E }}
                >
                    {String(index + 1).padStart(2, '0')}
                </motion.span>
                <div className="flex-1">
                    <ClipReveal delay={d + 0.08}>
                        <h3 className="text-xl sm:text-2xl md:text-2xl font-medium text-[#212631] tracking-tight leading-snug mb-3">
                            {title}
                        </h3>
                    </ClipReveal>
                    <motion.p
                        className="text-sm text-[#212631]/55 leading-relaxed"
                        initial={{ opacity: 0, y: 10 }}
                        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                        transition={{ duration: 0.65, delay: d + 0.22, ease: E }}
                    >
                        {desc}
                    </motion.p>
                </div>
            </div>
        </div>
    );
};

const JournalHero = ({ entry }) => {
    const ref = useRef(null);
    const inView = useInView(ref, { once: false, margin: '-3%' });
    const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
    const imgY = useTransform(scrollYProgress, [0, 1], ['-10%', '10%']);
    const overlayO = useTransform(scrollYProgress, [0, 0.5, 1], [0.55, 0.35, 0.55]);

    return (
        <article ref={ref} className={`${entry.grid} group`}>
            <div className={`relative overflow-hidden mb-6 md:mb-8 ${entry.aspect} bg-[#212631]/5 rounded-sm`}>
                <motion.div className="absolute w-full h-[120%] -top-[10%]" style={{ y: imgY }}>
                    <img src={entry.image} alt={entry.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-[1400ms] ease-out" />
                </motion.div>
                <motion.div className="absolute inset-0 bg-[#212631]" style={{ opacity: overlayO }} />
                <div className="absolute inset-0 flex items-center justify-center z-10 p-6 sm:p-10">
                    <div className="overflow-hidden">
                        <motion.h2
                            className="text-white text-4xl sm:text-6xl md:text-[7vw] lg:text-[9vw] font-medium tracking-tight uppercase leading-none text-center"
                            initial={{ y: '110%' }}
                            animate={inView ? { y: '0%' } : { y: '110%' }}
                            transition={{ duration: 1.05, delay: 0.12, ease: E }}
                        >
                            {entry.title}
                        </motion.h2>
                    </div>
                </div>
                <motion.div
                    className="absolute inset-0 bg-[#ebebeb] origin-bottom z-20"
                    initial={{ scaleY: 1 }}
                    animate={inView ? { scaleY: 0 } : { scaleY: 1 }}
                    transition={{ duration: 1.2, ease: E }}
                />
            </div>
            <div className="max-w-lg">
                <Wire delay={0.3} className="mb-5" />
                <ClipReveal delay={0.36} className="mb-2">
                    <h3 className="text-base md:text-lg font-medium text-[#212631] tracking-tight">{entry.title}</h3>
                </ClipReveal>
                <Reveal delay={0.5} y={10}>
                    <p className="text-sm text-[#212631]/55 leading-relaxed mb-5">{entry.desc}</p>
                    <div className="flex items-center gap-3 cursor-pointer group/cta">
                        <span className="text-[10px] font-medium uppercase tracking-[0.2em]">Explore Story</span>
                        <div className="h-px bg-[#212631] w-6 group-hover/cta:w-14 transition-all duration-500 ease-out" />
                    </div>
                </Reveal>
            </div>
        </article>
    );
};

const JournalCard = ({ entry, index }) => {
    const ref = useRef(null);
    const inView = useInView(ref, { once: false, margin: '-4%' });
    const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
    const imgY = useTransform(scrollYProgress, [0, 1], ['-10%', '10%']);
    const d = (index % 3) * 0.07;

    return (
        <motion.article
            ref={ref}
            className={`${entry.grid} group`}
            initial={{ opacity: 0, y: 40 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
            transition={{ duration: 0.85, delay: d, ease: E }}
        >
            <div className={`relative overflow-hidden mb-5 ${entry.aspect} bg-[#212631]/5 rounded-sm`}>
                <motion.div className="absolute w-full h-[120%] -top-[10%]" style={{ y: imgY }}>
                    <img src={entry.image} alt={entry.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-[1400ms] ease-out" />
                </motion.div>
                <motion.div
                    className="absolute inset-0 bg-[#ebebeb] origin-top z-10"
                    initial={{ scaleY: 1 }}
                    animate={inView ? { scaleY: 0 } : { scaleY: 1 }}
                    transition={{ duration: 1.0, delay: d + 0.06, ease: E }}
                />
            </div>
            <Wire delay={d + 0.26} className="mb-4" />
            <ClipReveal delay={d + 0.3} className="mb-2">
                <h3 className="text-base md:text-lg font-medium text-[#212631] tracking-tight leading-snug">{entry.title}</h3>
            </ClipReveal>
            <Reveal delay={d + 0.44} y={8}>
                <p className="text-sm text-[#212631]/55 leading-relaxed mb-4">{entry.desc}</p>
                <div className="flex items-center gap-3 cursor-pointer group/cta">
                    <span className="text-[10px] font-medium uppercase tracking-[0.2em]">Explore Story</span>
                    <div className="h-px bg-[#212631] w-5 group-hover/cta:w-12 transition-all duration-500 ease-out" />
                </div>
            </Reveal>
        </motion.article>
    );
};

const AboutUs = () => {
    const heroRef = useRef(null);
    const { scrollYProgress: hp } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });

    const badgeY = useTransform(hp, [0, 1], [0, -60]);
    const badgeO = useTransform(hp, [0, 0.4], [1, 0]);
    const titleY = useTransform(hp, [0, 1], [0, -40]);
    const descY = useTransform(hp, [0, 1], [0, -20]);
    const statsY = useTransform(hp, [0, 1], [0, -30]);

    const journalEntries = [
        { id: 1, title: 'BULUSAN ECO-TRAIL', desc: 'Discover the 1-hour immersive trek through century-old forests ending at the shores of Brgy. Parang.', image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09', grid: 'col-span-12', aspect: 'aspect-[4/5] md:aspect-[21/8]', isHero: true },
        { id: 2, title: 'Native Species Care', desc: 'Our mini zoo focuses on the rehabilitation of endemic wildlife from the Oriental Mindoro region.', image: 'https://images.unsplash.com/photo-1631886131312-be57ef8311c0?q=80&w=685&auto=format&fit=crop', grid: 'col-span-12 md:col-span-4', aspect: 'aspect-square' },
        { id: 3, title: 'Calapan City Sanctuary', desc: 'Located just 3km from the city market, providing a lush recreational haven for residents and tourists.', image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e', grid: 'col-span-12 md:col-span-4', aspect: 'aspect-square' },
        { id: 4, title: 'Join Our Rangers', desc: 'Help protect the biodiversity of MIMAROPA. We are looking for volunteers for our forest monitoring teams.', image: 'https://images.unsplash.com/photo-1568437827868-bab780f2f54e?w=500&auto=format&fit=crop&q=60', grid: 'col-span-12 md:col-span-4', aspect: 'aspect-square' },
    ];

    const features = [
        { title: 'Eco-Trail Access', desc: 'Access the famous Bulusan Mountain Trail, a prime route for trekking and bird watching.' },
        { title: 'Wildlife Rescue', desc: 'Our facilities provide temporary shelter and care for displaced native animals in Oriental Mindoro.' },
        { title: 'Recreation Area', desc: "Enjoy picnic grounds, camping sites, and wall-climbing facilities within the park's lush interior." },
    ];

    return (
        <ReactLenis root>
            <div className="min-h-screen bg-[#ebebeb] text-[#212631] selection:bg-emerald-200 overflow-x-hidden flex flex-col">
                <Header />

                <main className="flex-grow">

                    <section ref={heroRef} className="min-h-screen pt-24 md:pt-28 flex flex-col justify-between mx-auto px-4 sm:px-6 md:px-10 max-w-[1500px]">

                        <motion.div style={{ y: badgeY, opacity: badgeO }} className="mt-8 md:mt-12">
                            <Reveal delay={0}>
                                <p className="text-[10px] sm:text-xs font-medium tracking-[0.3em] text-[#155f15] uppercase flex items-center gap-2.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                                    Preserving Calapan's Green Heart
                                </p>
                            </Reveal>
                        </motion.div>

                        <motion.div style={{ y: titleY }} className="flex-1 flex items-center py-10 md:py-0">
                            <div className="w-full">
                                <h1 className="text-[clamp(3.2rem,9.5vw,8rem)] font-medium tracking-[-0.035em] text-[#212631] leading-[0.86] mb-0">
                                    <Chars text="Bulusan" delay={0.08} stagger={0.044} />
                                    <br />
                                    <span className="flex items-baseline gap-[0.15em] flex-wrap">
                                        <Chars text="Nature" delay={0.36} stagger={0.038} />
                                        <Chars
                                            text="Zoo"
                                            className="text-[#212631]"
                                            delay={0.62}
                                            stagger={0.044}
                                        />
                                    </span>
                                </h1>
                            </div>
                        </motion.div>

                        <Wire delay={0.2} className="mb-0" />

                        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-8 sm:gap-6 py-8 md:py-10">
                            <motion.div style={{ y: descY }} className="sm:w-[55%] lg:w-[48%]">
                                <Reveal delay={0.7}>
                                    <p className="text-sm sm:text-base text-[#212631]/58 leading-relaxed">
                                        A 32-acre sanctuary in Calapan City blending century-old rainforests with wildlife education and sustainable eco-tourism.
                                    </p>
                                </Reveal>
                            </motion.div>

                            <motion.div style={{ y: statsY }} className="flex gap-10 sm:gap-12 md:gap-16 sm:justify-end">
                                <Stat value="98%" label="Deflection" delay={0.45} />
                                <Stat value="10+" label="Species" delay={0.58} />
                            </motion.div>
                        </div>
                    </section>

                    <section className="mx-auto px-4 sm:px-6 md:px-10 max-w-[1500px] pb-20 md:pb-28">
                        <Wire delay={0} className="mb-0" />
                        <div className="divide-y divide-[#212631]/10">
                            {features.map((f, i) => (
                                <Feature key={i} title={f.title} desc={f.desc} index={i} />
                            ))}
                        </div>
                    </section>

                    <section className="mx-auto px-4 sm:px-6 md:px-10 max-w-[1500px]">
                        <Wire className="mb-12 md:mb-16" />

                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-10 md:mb-16 gap-4">
                            <h2 className="text-[clamp(3rem,9vw,8rem)] font-medium tracking-tight leading-none text-[#212631]">
                                <Chars text="Archive" delay={0} stagger={0.055} />
                            </h2>
                            <Reveal delay={0.3}>
                                <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#212631]/38 sm:mb-2">
                                    Calapan Chronicles / 2026
                                </p>
                            </Reveal>
                        </div>

                        <div className="grid grid-cols-12 gap-x-4 sm:gap-x-6 md:gap-x-8 gap-y-12 sm:gap-y-16 md:gap-y-20 pb-24 md:pb-32">
                            {journalEntries.map((entry, i) =>
                                entry.isHero
                                    ? <JournalHero key={entry.id} entry={entry} />
                                    : <JournalCard key={entry.id} entry={entry} index={i} />
                            )}
                        </div>
                    </section>

                </main>

                <Footer />
                <AIFloatingButton />
            </div>
        </ReactLenis>
    );
};

export default AboutUs;