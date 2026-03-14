import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";

// Helper component for the pill-shaped badges (like "looking for a job?")
const PillBadge = ({ text }) => (
    <div className="bg-white text-black px-4 py-1.5 rounded-full text-xs md:text-sm font-bold inline-block mb-6 shadow-sm select-none">
        {text}
    </div>
);

// Helper component for the social icons
const SocialIcon = ({ children }) => (
    <a href="#" className="w-8 h-8 md:w-10 md:h-10 border-2 border-white rounded-lg flex items-center justify-center hover:bg-white hover:text-[#38d091] transition-colors">
        {children}
    </a>
);

// The massive edge-to-edge title at the bottom
const GiantTitle = () => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: false, margin: "0px" });
    const word = "bulusan".split("");

    return (
        <div ref={ref} className="relative w-full flex justify-center items-end mt-20 md:mt-32 pointer-events-none">

            {/* Decorative Floating "Stickers" mimicking the image's playful vibe */}
            <motion.div
                className="absolute top-[-20%] left-[10%] md:left-[20%] bg-white text-[#38d091] font-black text-sm md:text-xl px-4 py-2 rounded-full rotate-[-12deg] shadow-lg"
                initial={{ scale: 0, opacity: 0 }} animate={isInView ? { scale: 1, opacity: 1 } : {}} transition={{ delay: 0.8, type: "spring" }}
            >
                100% WILD
            </motion.div>
            <motion.div
                className="absolute top-[-10%] right-[15%] md:right-[25%] bg-yellow-300 text-black font-black text-xs md:text-lg px-3 py-3 rounded-full rotate-[15deg] shadow-lg"
                initial={{ scale: 0, opacity: 0 }} animate={isInView ? { scale: 1, opacity: 1 } : {}} transition={{ delay: 1, type: "spring" }}
            >
                🌿 ZOO
            </motion.div>

            <div className="flex w-full justify-between items-end overflow-hidden px-4 md:px-10">
                {word.map((char, i) => (
                    <motion.span
                        key={i}
                        className="inline-block lowercase select-none"
                        style={{
                            fontFamily: "'Arial Rounded MT Bold', 'Nunito', 'Inter', sans-serif",
                            fontSize: "clamp(4rem, 18vw, 22vw)",
                            fontWeight: 900,
                            lineHeight: 0.75,
                            letterSpacing: "-0.04em",
                            color: "#ffffff",
                        }}
                        initial={{ y: "100%", opacity: 0 }}
                        animate={isInView ? { y: "0%", opacity: 1 } : { y: "100%", opacity: 0 }}
                        transition={{
                            duration: 0.8,
                            delay: i * 0.08,
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
        <div className="w-full bg-white"> {/* Assuming parent body is white for the rounded corners to show */}
            <footer
                ref={footerRef}
                className="w-full relative overflow-x-hidden flex flex-col pt-16 md:pt-24 pb-6 min-h-[90svh]"
                style={{ backgroundColor: "#212631", color: "#ffffff", fontFamily: "'Inter', sans-serif" }}
            >
                <div className="relative z-10 flex flex-col flex-grow w-full px-6 md:px-14">

                    {/* Top Section: 3 Columns matching the image layout */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-10 pointer-events-auto">

                        {/* Column 1: Navigation */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }}>
                            <PillBadge text="explore" />
                            <ul className="flex flex-col gap-1 md:gap-2">
                                {quickLinks.map((link) => (
                                    <li key={link.label}>
                                        <Link
                                            to={link.path}
                                            className="text-3xl md:text-[2.5rem] font-bold tracking-tight hover:opacity-70 transition-opacity block lowercase"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>

                        {/* Column 2: Office / Location */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.1 }}>
                            <PillBadge text="location" />
                            <div className="text-3xl md:text-[2.5rem] font-bold tracking-tight leading-none lowercase">
                                <p>bulusan,</p>
                                <p>calapan city</p>
                            </div>
                            <a
                                href="#"
                                className="inline-block mt-6 text-lg md:text-xl font-medium border-b-[3px] border-white/40 pb-0.5 hover:border-white transition-colors"
                            >
                                Google Maps
                            </a>
                        </motion.div>

                        {/* Column 3: Contact */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.2 }}>
                            <PillBadge text="contact" />
                            <div className="text-3xl md:text-[2.5rem] font-bold tracking-tight leading-none lowercase">
                                <a href="mailto:info@bulusanwildlife.com" className="hover:opacity-70 transition-opacity block truncate">
                                    info@bulusan<br className="hidden md:block" />wildlife.com
                                </a>
                                <p className="mt-4 md:mt-2 text-2xl md:text-3xl">(043) 123-4567</p>
                            </div>
                            <p className="text-xs md:text-sm mt-4 opacity-90 font-medium">
                                *we're nature lovers: please leave a message.
                            </p>

                            {/* Social Icons matching the image's layout */}
                            <div className="flex gap-3 mt-6">
                                <SocialIcon>
                                    <span className="font-bold text-sm">in</span>
                                </SocialIcon>
                                <SocialIcon>
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
                                </SocialIcon>
                                <SocialIcon>
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1.04-.1z" /></svg>
                                </SocialIcon>
                            </div>
                        </motion.div>
                    </div>

                    {/* Giant Bottom Title */}
                    <div className="mt-auto flex flex-col justify-end">
                        <GiantTitle />

                        {/* Bottom Bar: Copyright & Back to Top mimicking the "credits" badge */}
                        <motion.div
                            initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ duration: 0.5, delay: 0.8 }}
                            className="mt-4 flex justify-between items-center pointer-events-auto"
                        >
                            <span className="text-xs md:text-sm font-semibold opacity-80 lowercase">
                                © {currentYear} bwci.
                            </span>

                            <button
                                onClick={scrollToTop}
                                className="bg-black text-white px-4 py-1.5 rounded-full text-xs md:text-sm font-bold shadow-md hover:bg-gray-800 transition-colors"
                            >
                                back to top
                            </button>
                        </motion.div>
                    </div>

                </div>
            </footer>
        </div>
    );
};

export default Footer;