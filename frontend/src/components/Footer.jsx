import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";

const PillBadge = ({ text }) => (
    <div className="inline-block border border-white/20 text-white/50 px-4 py-1 rounded-full text-[11px] font-medium uppercase tracking-widest mb-5 select-none">
        {text}
    </div>
);

const SocialIcon = ({ children, label }) => (
    <a href="#" aria-label={label} className="w-9 h-9 border border-white/20 rounded-lg flex items-center justify-center text-white/60 hover:border-white hover:text-white hover:bg-white/5 transition-all">
        {children}
    </a>
);

const GiantTitle = () => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: false, margin: "0px" });
    const word = "bulusan".split("");

    return (
        <div ref={ref} className="relative w-full flex justify-center items-end mt-8 pointer-events-none">
            <div className="flex w-full justify-between items-end overflow-hidden">
                {word.map((char, i) => (
                    <motion.span
                        key={i}
                        className="inline-block lowercase select-none"
                        style={{
                            fontFamily: "'DM Sans', 'Inter', sans-serif",
                            fontSize: "clamp(4rem, 17vw, 22vw)",
                            fontWeight: 900,
                            lineHeight: 0.78,
                            letterSpacing: "-0.05em",
                            color: "#ffffff",
                        }}
                        initial={{ y: "100%", opacity: 0 }}
                        animate={isInView ? { y: "0%", opacity: 1 } : { y: "100%", opacity: 0 }}
                        transition={{
                            duration: 0.8,
                            delay: i * 0.07,
                            ease: [0.16, 1, 0.3, 1],
                        }}
                    >
                        {char}
                    </motion.span>
                ))}
            </div>
        </div>
    );
};

const Footer = () => {
    const currentYear = new Date().getFullYear();
    const footerRef = useRef(null);
    const isInView = useInView(footerRef, { once: false, margin: "-5%" });

    const quickLinks = [
        { path: "/", label: "Home" },
        { path: "/animals", label: "Animals" },
        { path: "/plants", label: "Plants" },
        { path: "/events", label: "Events" },
        { path: "/community", label: "Community" },
        { path: "/reservations", label: "Reservation" },
    ];

    const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

    return (
        <footer
            ref={footerRef}
            className="w-full relative overflow-x-hidden flex flex-col bg-black text-white pt-16 md:pt-24 pb-8 min-h-screen"
            style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}
        >
            <div className="relative z-10 flex flex-col flex-grow w-full px-6 md:px-14">

                {/* 3-Column Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-12">

                    {/* Column 1: Navigation */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.5 }}
                    >
                        <PillBadge text="explore" />
                        <ul className="flex flex-col">
                            {quickLinks.map((link) => (
                                <li key={link.label} className="border-b border-white/[0.06] last:border-b-0">
                                    <Link
                                        to={link.path}
                                        className="text-[2rem] font-bold tracking-tight leading-[1.1] lowercase block py-1 hover:text-white/40 transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    {/* Column 2: Location */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        <PillBadge text="location" />
                        <div className="text-[2rem] font-bold tracking-tight leading-[1.1] lowercase">
                            <p className="m-0">bulusan,</p>
                            <p className="m-0">calapan city</p>
                        </div>
                        <a
                            href="#"
                            className="inline-flex items-center gap-1.5 mt-5 text-sm font-medium text-white/50 border-b border-white/20 pb-0.5 hover:text-white hover:border-white transition-all"
                        >
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                            </svg>
                            Open in Google Maps
                        </a>
                    </motion.div>

                    {/* Column 3: Contact */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <PillBadge text="contact" />
                        <div className="text-[2rem] font-bold tracking-tight leading-[1.1] lowercase">
                            <a href="mailto:info@bulusanwildlife.com" className="hover:text-white/40 transition-colors block">
                                info@bulusan<br />wildlife.com
                            </a>
                            <p className="mt-3 text-[1.4rem] text-white/60 font-bold">(043) 123-4567</p>
                        </div>
                        <p className="text-[11px] mt-4 text-white/30 italic leading-relaxed">
                            *we're nature lovers: please leave a message.
                        </p>
                        <div className="flex gap-2 mt-6">
                            <SocialIcon label="LinkedIn">
                                <span className="font-bold text-sm">in</span>
                            </SocialIcon>
                            <SocialIcon label="Instagram">
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                                </svg>
                            </SocialIcon>
                            <SocialIcon label="TikTok">
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1.04-.1z" />
                                </svg>
                            </SocialIcon>
                        </div>
                    </motion.div>
                </div>

                {/* Divider */}
                <div className="w-full h-px bg-white/[0.08] mt-16 md:mt-20" />

                {/* Giant Title + Bottom Bar */}
                <div className="mt-auto flex flex-col justify-end">
                    <GiantTitle />
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={isInView ? { opacity: 1 } : {}}
                        transition={{ duration: 0.5, delay: 0.8 }}
                        className="mt-4 flex justify-between items-center"
                    >
                        <span className="text-[11px] font-medium text-white/30 uppercase tracking-widest">
                            © {currentYear} bwci.
                        </span>
                        <button
                            onClick={scrollToTop}
                            className="bg-white text-black px-5 py-1.5 rounded-full text-xs font-bold hover:opacity-70 transition-opacity"
                        >
                            back to top ↑
                        </button>
                    </motion.div>
                </div>

            </div>
        </footer>
    );
};

export default Footer;