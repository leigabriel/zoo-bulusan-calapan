import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ReactLenis } from 'lenis/react';
import {
    motion,
    useScroll,
    useTransform,
    useSpring,
    useInView,
    useMotionValue,
    AnimatePresence,
} from 'framer-motion';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import AIFloatingButton from '../../components/common/AIFloatingButton';
import HeroSection3D from './HeroSection3D';
import '../../App.css';

const ease = [0.16, 1, 0.3, 1];
const easeOut = [0.0, 0.0, 0.2, 1];
const springCfg = { stiffness: 80, damping: 25, restDelta: 0.001 };

// --- Sub-components ---

function SplitReveal({ children, delay = 0, className = '' }) {
    const triggerRef = useRef(null);
    const inView = useInView(triggerRef, { once: false, amount: 0.1 });
    return (
        <span ref={triggerRef} className={`overflow-hidden inline-block w-full ${className}`} style={{ verticalAlign: 'bottom' }}>
            <motion.span
                initial={{ y: '112%', rotate: 1.8 }}
                animate={inView ? { y: '0%', rotate: 0 } : { y: '112%', rotate: 1.8 }}
                transition={{ duration: 1.05, delay, ease }}
                style={{ transformOrigin: 'bottom left', display: 'block' }}
            >
                {children}
            </motion.span>
        </span>
    );
}

function MagneticButton({ children, className, to }) {
    const ref = useRef(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const sx = useSpring(x, { stiffness: 180, damping: 18 });
    const sy = useSpring(y, { stiffness: 180, damping: 18 });
    const onMove = (e) => {
        const r = ref.current.getBoundingClientRect();
        x.set((e.clientX - (r.left + r.width / 2)) * 0.38);
        y.set((e.clientY - (r.top + r.height / 2)) * 0.38);
    };
    const onLeave = () => { x.set(0); y.set(0); };
    return (
        <motion.div ref={ref} style={{ x: sx, y: sy }} onMouseMove={onMove} onMouseLeave={onLeave}>
            <Link to={to} className={className}>{children}</Link>
        </motion.div>
    );
}

function CounterNumber({ value, suffix = '' }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: false, amount: 0.1 });
    const [display, setDisplay] = useState(0);
    useEffect(() => {
        if (!inView) { setDisplay(0); return; }
        let start = null;
        let id;
        const run = (ts) => {
            if (!start) start = ts;
            const p = Math.min((ts - start) / 1600, 1);
            const eased = 1 - Math.pow(1 - p, 4);
            setDisplay(Math.round(eased * value));
            if (p < 1) id = requestAnimationFrame(run);
        };
        id = requestAnimationFrame(run);
        return () => cancelAnimationFrame(id);
    }, [inView, value]);
    return <span ref={ref}>{display}{suffix}</span>;
}

function HorizontalMarquee({ text, speed = 38, opacity = 0.07 }) {
    const repeated = Array(10).fill(text);
    return (
        <div className="overflow-hidden whitespace-nowrap select-none">
            <motion.div
                className="inline-flex gap-16"
                animate={{ x: ['0%', '-50%'] }}
                transition={{ duration: speed, repeat: Infinity, ease: 'linear' }}
            >
                {[...repeated, ...repeated].map((t, i) => (
                    <span key={i} className="text-[7vw] font-bold uppercase tracking-widest" style={{ color: `rgba(33,38,49,${opacity})` }}>{t}</span>
                ))}
            </motion.div>
        </div>
    );
}

// --- Data ---

const animalArticles = [
    { key: 'parrot', num: '01', title: 'Parrot', desc: 'A white parrot is a predominantly white bird, commonly a cockatoo such as the Umbrella Cockatoo or the Sulphur-crested Cockatoo. It has a strong curved beak, zygodactyl feet, and a movable crest used for communication.', className: 'py-16 md:py-24 md:pr-12 lg:pr-16 flex flex-col h-full', link: null },
    { key: 'tiger', num: '02', title: 'Tiger', desc: 'A tiger is a large, powerful wild cat known for its distinctive orange coat with black stripes. It is a top predator, primarily hunting deer, wild boar, and other large mammals.', className: 'py-16 md:py-24 md:px-12 lg:px-16 flex flex-col h-full', link: null },
    { key: 'monkey', num: '03', title: 'Monkey', desc: 'A monkey is a primate known for its agility, intelligence, and social behavior. Most species have flexible limbs, prehensile hands or tails, and keen eyesight.', className: 'py-16 md:py-24 md:pl-12 lg:pl-16 flex flex-col h-full', link: '/animals' },
];

const animalHoverImages = {
    parrot: 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=600&h=600&fit=crop',
    tiger: 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=600&h=600&fit=crop',
    monkey: 'https://images.unsplash.com/photo-1540573133985-87b6da6d54a9?w=600&h=600&fit=crop',
};

const plantArticles = [
    { key: 'sunflower', num: '01', title: 'Sunflower', desc: "A sunflower is a tall, fast-growing plant known for its large, bright yellow flower heads that track the sun's movement. Native to North America, it produces edible seeds.", className: 'py-16 md:py-24 md:pr-12 lg:pr-16 flex flex-col h-full', link: null },
    { key: 'rose', num: '02', title: 'Rose', desc: 'A rose is a woody perennial flowering plant of the genus Rosa, celebrated for its layered petals and rich fragrance. It comes in hundreds of varieties.', className: 'py-16 md:py-24 md:px-12 lg:px-16 flex flex-col h-full', link: null },
    { key: 'sampaguita', num: '03', title: 'Sampaguita', desc: 'Sampaguita is a small, star-shaped white flower and the national flower of the Philippines. Known for its intense, sweet fragrance, it is commonly strung into garlands.', className: 'py-16 md:py-24 md:pl-12 lg:pl-16 flex flex-col h-full', link: '/plants' },
];

const plantHoverImages = {
    sunflower: 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=600&h=600&fit=crop',
    rose: 'https://images.unsplash.com/photo-1455582916367-25f75bfc6710?w=600&h=600&fit=crop',
    sampaguita: 'https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=600&h=600&fit=crop',
};

const faqData = [
    { question: 'What are the operating hours of Bulusan Zoo?', answer: 'Bulusan Zoo is open daily from 8:00 AM to 5:00 PM. We recommend arriving early to fully experience all our wildlife exhibits.' },
    { question: 'How can I purchase/reserve tickets for my visit?', answer: "Tickets can be purchased/reserved directly through our website or at the main entrance gate. We accept cash only at this time." },
    { question: 'Is there a special rate for local residents?', answer: 'Yes, entrance is free for local residents of Bulusan Calapan City. Please bring a valid government-issued ID to avail of this benefit.' },
    { question: 'Are animal feeding sessions open to the public?', answer: "We have scheduled interactive feeding sessions and wildlife shows throughout the day. Check the 'Events' section for the latest schedule." },
    { question: 'Is the park accessible for persons with disabilities?', answer: 'Yes, Bulusan Zoo features paved pathways suitable for wheelchairs and priority access for PWDs and senior citizens.' },
    { question: 'Does the zoo support conservation programs?', answer: 'Absolutely. A portion of every ticket sale goes directly toward our local wildlife rescue and rehabilitation initiatives.' },
];

// --- Sections ---

function ArticleCard({ a, i, onMove, setHovered, onTap }) {
    const cardRef = useRef(null);
    const cardInView = useInView(cardRef, { once: false, amount: 0.15 });
    return (
        <article
            ref={cardRef}
            className={a.className}
            onMouseMove={(e) => onMove(e, a.key)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onTap(a.key)}
        >
            <motion.div
                initial={{ opacity: 0, y: 60, filter: 'blur(4px)' }}
                animate={cardInView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : { opacity: 0, y: 60, filter: 'blur(4px)' }}
                transition={{ duration: 1.1, delay: i * 0.18, ease }}
            >
                <div className="text-[#212631]/40 text-xs md:text-sm font-medium tracking-widest mb-6 lg:mb-8">
                    <span className="text-[#212631]/25 mr-2">•</span>{a.num}
                </div>
            </motion.div>

            <div className="overflow-hidden mb-4 lg:mb-6">
                <motion.h3
                    initial={{ y: '110%', skewY: 3 }}
                    animate={cardInView ? { y: '0%', skewY: 0 } : { y: '110%', skewY: 3 }}
                    transition={{ duration: 0.9, delay: i * 0.18 + 0.12, ease }}
                    className="text-[1.75rem] md:text-3xl lg:text-4xl font-bold text-[#212631] tracking-tight"
                >
                    {a.title}
                </motion.h3>
            </div>

            <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={cardInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.9, delay: i * 0.18 + 0.3, ease }}
                className="text-base md:text-lg lg:text-xl text-[#212631]/70 leading-relaxed mb-8 lg:mb-12"
            >
                {a.desc}
            </motion.p>
            {a.link && (
                <div className="mt-auto pt-12">
                    <MagneticButton to={a.link} className="border border-[#212631]/30 text-[#212631] text-xs md:text-sm font-bold tracking-widest uppercase px-8 py-4 hover:bg-[#212631] hover:text-[#ebebeb] transition-all duration-300 inline-block">
                        View All
                    </MagneticButton>
                </div>
            )}
        </article>
    );
}

function ArticleGrid({ articles, images, label }) {
    const [hovered, setHovered] = useState(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [popup, setPopup] = useState(null);
    const sectionRef = useRef(null);
    const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start end', 'end start'] });
    const lineRevealWidth = useTransform(scrollYProgress, [0.05, 0.35], ['0%', '100%']);
    const smoothLine = useSpring(lineRevealWidth, { stiffness: 60, damping: 20 });
    const onMove = (e, key) => { setHovered(key); setMousePos({ x: e.clientX, y: e.clientY }); };
    const onTap = (key) => { if (window.matchMedia('(hover: none)').matches) setPopup(key); };

    return (
        <div ref={sectionRef}>
            <div className="max-w-[1600px] border border-[#212631]/10 mx-auto px-6 md:px-12 lg:px-16">
                <div className="relative mb-0 pt-8 md:pt-12">
                    <div className="h-[1px] bg-[#d1d1d1] w-full" />
                    <motion.div className="absolute top-8 md:top-12 left-0 h-[1px] bg-[#212631]" style={{ width: smoothLine }} />
                    <span className="inline-block mt-3 text-[10px] font-bold tracking-[0.25em] text-[#212631]/40 uppercase">{label}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#d1d1d1]">
                    {articles.map((a, i) => (<ArticleCard key={a.key} a={a} i={i} onMove={onMove} setHovered={setHovered} onTap={onTap} />))}
                </div>
            </div>
            <AnimatePresence>
                {hovered && (
                    <motion.div
                        className="hidden md:block fixed z-50 pointer-events-none"
                        style={{ left: mousePos.x + 22, top: mousePos.y - 130 }}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                    >
                        <div className="w-56 h-56 overflow-hidden shadow-2xl border border-[#d1d1d1]">
                            <img src={images[hovered]} alt={hovered} className="w-full h-full object-cover" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function EventsSection({ eventsRef, eventsScale }) {
    const inView = useInView(eventsRef, { once: false, amount: 0.25 });
    const { scrollYProgress } = useScroll({ target: eventsRef, offset: ['start end', 'end start'] });
    const bgY = useTransform(scrollYProgress, [0, 1], ['-8%', '8%']);
    const smoothBgY = useSpring(bgY, springCfg);
    const gridOpacity = useTransform(scrollYProgress, [0.1, 0.4], [0, 0.5]);

    return (
        <section ref={eventsRef} id="events-section" className="relative bg-[#ebebeb] p-3 sm:p-4 md:p-6 lg:p-10 min-h-[10vh] sm:min-h-[80vh] md:min-h-screen flex items-center justify-center overflow-hidden w-full">
            <motion.div
                style={{ scale: eventsScale }}
                className="relative w-full max-w-[1500px] min-h-[400px] sm:min-h-[500px] md:aspect-video bg-[#08140e] rounded-xl sm:rounded-2xl md:rounded-sm overflow-hidden shadow-2xl"
            >
                <motion.div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                        backgroundImage: `url('/bulusan.png')`,
                        y: smoothBgY,
                        scale: 1.15,
                        opacity: 0.18,
                    }}
                />
                <motion.div
                    className="absolute inset-0"
                    style={{
                        opacity: gridOpacity,
                        backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(255,255,255,0.04) 39px, rgba(255,255,255,0.04) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(255,255,255,0.04) 39px, rgba(255,255,255,0.04) 40px)`,
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-[#0d2218]/80 via-[#08140e]/60 to-[#08140e]/90" />
                <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full p-6 sm:p-8 md:p-16 lg:p-24 min-h-[400px] sm:min-h-[500px]">
                    <motion.div
                        initial={{ opacity: 0, scaleX: 0 }}
                        animate={inView ? { opacity: 1, scaleX: 1 } : { opacity: 0, scaleX: 0 }}
                        transition={{ duration: 0.8, ease: easeOut }}
                        style={{ originX: 0 }}
                        className="w-12 h-[1px] bg-emerald-400/60 mb-8 md:mb-12"
                    />
                    <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-7xl font-medium text-white tracking-tight leading-tight md:leading-[1.05] break-words mb-6 sm:mb-8 md:mb-10 max-w-xl">
                        {['Wildlife', 'Events'].map((word, i) => (
                            <div key={word} className="overflow-hidden">
                                <motion.span
                                    initial={{ y: '115%', opacity: 0 }}
                                    animate={inView ? { y: '0%', opacity: 1 } : { y: '115%', opacity: 0 }}
                                    transition={{ duration: 1.0, delay: i * 0.14, ease }}
                                    style={{ display: 'block' }}
                                >
                                    {word}
                                </motion.span>
                            </div>
                        ))}
                    </h2>
                    <motion.p
                        initial={{ opacity: 0, y: 28, filter: 'blur(6px)' }}
                        animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : { opacity: 0, y: 28, filter: 'blur(6px)' }}
                        transition={{ duration: 0.9, delay: 0.38, ease }}
                        className="text-gray-400 text-sm sm:text-base md:text-lg leading-relaxed mb-10 sm:mb-12 md:mb-14 font-light max-w-md mx-auto"
                    >
                        Experience unforgettable moments with our animals through live feedings and shows.
                    </motion.p>
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={inView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.7, delay: 0.55, ease }}
                    >
                        <Link to="/events" className="group flex items-center bg-white rounded-md sm:rounded-[2px] overflow-hidden transition-all active:scale-95 shadow-2xl hover:bg-gray-100 min-h-[44px]">
                            <span className="px-4 py-3 sm:px-6 sm:py-3.5 md:px-8 md:py-4 text-[9px] sm:text-[10px] md:text-[11px] font-bold uppercase tracking-[0.1em] sm:tracking-[0.2em] text-teal-700 border-r border-gray-100 whitespace-nowrap">View All Events</span>
                            <div className="px-3 py-3 sm:px-4 sm:py-3.5 md:px-5 md:py-4 bg-gray-50 flex items-center justify-center min-h-[44px] min-w-[44px]">
                                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-700 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </div>
                        </Link>
                    </motion.div>
                </div>
            </motion.div>
        </section>
    );
}

function FaqSection() {
    const [activeIndex, setActiveIndex] = useState(null);
    const sectionRef = useRef(null);
    const headingRef = useRef(null);
    const headingInView = useInView(headingRef, { once: false, amount: 0.1 });
    const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start end', 'end start'] });
    const labelX = useTransform(scrollYProgress, [0.05, 0.3], ['-4%', '0%']);
    const smoothLabelX = useSpring(labelX, springCfg);

    return (
        <section ref={sectionRef} id="faq-section" className="py-16 sm:py-20 md:py-24 bg-[#ebebeb] w-full">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[1500px]">
                <motion.div style={{ x: smoothLabelX }} className="flex items-center gap-4 mb-6 md:mb-8">
                    <motion.div
                        initial={{ scaleX: 0 }}
                        whileInView={{ scaleX: 1 }}
                        viewport={{ once: false, amount: 0.5 }}
                        transition={{ duration: 0.7, ease: easeOut }}
                        style={{ originX: 0 }}
                        className="w-8 h-[1px] bg-[#212631]/30"
                    />
                    <span className="text-[10px] tracking-[0.25em] text-[#212631]/40 uppercase">Questions</span>
                </motion.div>
                <div ref={headingRef} className="overflow-hidden mb-12 md:mb-16">
                    <motion.h2
                        initial={{ y: '115%', skewY: 2 }}
                        animate={headingInView ? { y: '0%', skewY: 0 } : { y: '115%', skewY: 2 }}
                        transition={{ duration: 1.0, ease }}
                        className="text-3xl sm:text-4xl md:text-6xl lg:text-8xl font-bold text-gray-900 tracking-tight"
                    >
                        FAQ
                    </motion.h2>
                </div>
                <div className="border-b border-gray-200">
                    {faqData.map((item, index) => (
                        <div key={index} className="border-t border-gray-200">
                            <button
                                onClick={() => setActiveIndex(activeIndex === index ? null : index)}
                                className="w-full py-6 flex items-center justify-between text-left group transition-all"
                            >
                                <motion.span className="text-base sm:text-lg md:text-2xl font-medium text-gray-800 pr-8 leading-snug break-words">
                                    {item.question}
                                </motion.span>
                                <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${activeIndex === index ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
                                    <svg className={`w-4 h-4 transition-transform duration-300 ${activeIndex === index ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </button>
                            <AnimatePresence>
                                {activeIndex === index && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.4, ease }}
                                        className="overflow-hidden"
                                    >
                                        <p className="text-gray-500 text-sm sm:text-base md:text-xl pb-8 max-w-4xl leading-relaxed">
                                            {item.answer}
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// --- Main Page ---

const Home = () => {
    const aboutRef = useRef(null);
    const { scrollYProgress: aboutP } = useScroll({ target: aboutRef, offset: ['start end', 'end start'] });
    const aboutX = useSpring(useTransform(aboutP, [0, 1], ['-5%', '1%']), springCfg);

    const eventsRef = useRef(null);
    const { scrollYProgress: eventsP } = useScroll({ target: eventsRef, offset: ['start end', 'end start'] });
    const eventsScale = useSpring(useTransform(eventsP, [0, 0.6], [0.86, 1]), { stiffness: 55, damping: 20 });

    return (
        <ReactLenis root options={{ lerp: 0.075, duration: 1.5, smoothWheel: true }}>
            <div className="relative min-h-screen bg-[#ebebeb]">
                <Header />
                <AIFloatingButton />

                <main>
                    {/* 3D HERO SECTION */}
                    <HeroSection3D />

                    <div className="bg-[#ebebeb] py-5 overflow-hidden">
                        <HorizontalMarquee text="Bulusan Zoo · Wildlife · Nature · Conservation" speed={42} />
                    </div>

                    {/* ABOUT SECTION */}
                    <section ref={aboutRef} className="bg-[#ebebeb] min-h-[40vh] flex items-center px-6 py-20 md:px-16 md:py-32 w-full overflow-hidden">
                        <div className="max-w-[1500px] mx-auto w-full flex flex-col">
                            <h2 className="text-[#212631] text-2xl md:text-3xl lg:text-4xl uppercase tracking-wide mb-16 md:mb-24">
                                <SplitReveal>About Bulusan Zoo</SplitReveal>
                            </h2>
                            <motion.div style={{ x: aboutX }} className="mb-16 md:mb-24">
                                {['Founded in 2015,', 'Bulusan Wildlife & Nature Park', 'began as a small conservation', 'initiative in Calapan City.'].map((line, i) => (
                                    <p key={i} className="text-[#212631] text-4xl sm:text-5xl md:text-6xl lg:text-[5.5rem] leading-[1.2] md:leading-[1.1] tracking-tight">
                                        <SplitReveal delay={i * 0.075}>{line}</SplitReveal>
                                    </p>
                                ))}
                            </motion.div>
                            <motion.div initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: false, amount: 0.3 }} transition={{ duration: 0.9, ease }} className="self-end">
                                <MagneticButton to="/about" className="border border-[#212631]/30 text-[#212631] text-xs md:text-sm font-bold tracking-widest uppercase px-8 py-4 hover:bg-[#212631] hover:text-[#ebebeb] transition-all duration-300 inline-block">More</MagneticButton>
                            </motion.div>
                        </div>
                    </section>

                    {/* STATS SECTION */}
                    <section className="bg-[#ebebeb] py-12 md:py-16 overflow-hidden">
                        <div className="max-w-[1500px] mx-auto px-6 md:px-16 grid grid-cols-3 gap-4 md:gap-12">
                            {[{ value: 10, suffix: '+', label: 'Species' }, { value: 15, suffix: '+', label: 'Plants' }, { value: 100, suffix: '+', label: 'Visitors / Year' }].map((stat, i) => (
                                <motion.div key={i} className="flex flex-col items-start">
                                    <span className="text-3xl sm:text-5xl md:text-7xl font-bold text-[#212631] tabular-nums leading-none"><CounterNumber value={stat.value} suffix={stat.suffix} /></span>
                                    <span className="text-[#212631]/50 text-[10px] sm:text-xs md:text-sm uppercase tracking-widest mt-1 md:mt-3">{stat.label}</span>
                                </motion.div>
                            ))}
                        </div>
                    </section>

                    {/* WILDLIFE & FLORA GRIDS */}
                    <section id="animal" className="w-full bg-[#ebebeb] text-[#212631] py-12">
                        <ArticleGrid articles={animalArticles} images={animalHoverImages} label="— Wildlife" />
                    </section>

                    <section id="plant" className="w-full bg-[#ebebeb] text-[#212631] py-12">
                        <ArticleGrid articles={plantArticles} images={plantHoverImages} label="— Flora" />
                    </section>

                    {/* EVENTS SECTION */}
                    <EventsSection eventsRef={eventsRef} eventsScale={eventsScale} />

                    {/* FAQ SECTION */}
                    <FaqSection />

                    {/* PRICING SECTION */}
                    <section id="tickets-section" className="py-16 sm:py-20 md:py-24 bg-[#ebebeb] w-full">
                        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[1500px]">
                            <div className="mb-14">
                                <span className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase block mb-3">PRICING</span>
                                <h2 className="text-2xl sm:text-4xl font-medium text-gray-900 leading-tight">
                                    <SplitReveal delay={0.1}>Choose the right ticket for you</SplitReveal>
                                </h2>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-3 border border-[#212631]/20 overflow-hidden shadow-sm mb-12 rounded-lg lg:rounded-none">
                                {[
                                    { label: 'ADULT', price: '₱40', desc: 'Ages 18-59. Perfect for those who want the full experience.' },
                                    { label: 'CHILD', price: '₱20', desc: 'Ages 5-17. Launch your first visit and start exploring within minutes.' },
                                    { label: 'RESIDENT', price: 'FREE', desc: 'Exclusive for local residents of Calapan City.' },
                                ].map((t, i) => (
                                    <motion.div key={i} initial={{ opacity: 0, y: 56 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false, amount: 0.15 }} transition={{ duration: 0.9, delay: i * 0.15, ease }} className="flex flex-col p-9 bg-white border-b lg:border-r lg:border-b-0 border-gray-300 last:border-0">
                                        <span className="text-[10px] font-bold tracking-[0.15em] text-gray-400 uppercase mb-6">{t.label}</span>
                                        <div className="text-[44px] font-medium text-gray-900 leading-none mb-6">{t.price}</div>
                                        <div className="h-[1px] w-full bg-gray-100 mb-8" />
                                        <p className="text-[18px] leading-relaxed text-gray-500 min-h-[80px]">{t.desc}</p>
                                    </motion.div>
                                ))}
                            </div>
                            <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false, amount: 0.3 }} className="flex justify-center">
                                <Link to="/reservations">
                                    <button className="px-12 py-4 bg-gray-900 text-white text-sm font-bold tracking-widest uppercase rounded-full hover:bg-gray-800 transition-all shadow-lg shadow-gray-200">Reserve Now!</button>
                                </Link>
                            </motion.div>
                        </div>
                    </section>
                </main>

                <Footer />
            </div>
        </ReactLenis>
    );
};

export default Home;