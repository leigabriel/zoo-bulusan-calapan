import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { ZOO_DIRECTIONS_URL } from "../config/zoo-location";

const MotionDiv = motion.div;
const MotionSpan = motion.span;

const PillBadge = ({ text }) => (
    <div className="inline-block border border-white/20 text-white/50 px-4 py-1 rounded-full text-[11px] font-medium uppercase tracking-widest mb-5 select-none">
        {text}
    </div>
);

const GiantTitle = () => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: false, margin: "0px" });

    return (
        <div ref={ref} className="relative w-full mt-8 pointer-events-none overflow-hidden flex items-end justify-between gap-4">
            <MotionSpan
                className="block text-left select-none"
                style={{
                    fontFamily: "'Mistral', 'Brush Script MT', cursive",
                    fontSize: "clamp(3.5rem, 16vw, 20vw)",
                    fontWeight: 400,
                    lineHeight: 1,
                    letterSpacing: 0,
                    color: "#05df72",
                    textShadow: "0 10px 45px rgba(0,0,0,0.95), 0 2px 10px rgba(0,0,0,0.85)",
                }}
                initial={{ y: "100%", opacity: 0 }}
                animate={isInView ? { y: "0%", opacity: 1 } : { y: "100%", opacity: 0 }}
                transition={{
                    duration: 0.8,
                    ease: [0.16, 1, 0.3, 1],
                }}
            >
                Bulusan Zoo
            </MotionSpan>
            <img
                src="/images/bz-url-logo.png"
                alt="Bulusan Zoo logo"
                className="w-14 h-14 md:w-20 md:h-20 object-contain select-none flex-shrink-0 mb-2"
            />
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
        { path: "/game", label: "Game" },
        { path: "/map", label: "Map" },
        { path: "/about", label: "About" },
        { path: "/reservations", label: "Reservation" },
    ];

    const legalLinks = [
        { path: "/privacy", label: "Privacy Policy" },
        { path: "/terms", label: "Terms of Service" },
        { path: "/cookies", label: "Cookie Policy" },
        { path: "/refund-policy", label: "Refund Policy" },
    ];

    return (
        <footer
            ref={footerRef}
            data-header-theme="dark"
            className="relative flex min-h-screen w-full flex-col overflow-hidden bg-black pt-16 pb-8 text-white md:pt-24"
            style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}
        >
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-[clamp(200px,32vw,440px)] bg-[url('/images/grass-footer.png')] bg-bottom bg-no-repeat bg-[length:100%_auto]"
            />
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/85 via-black/30 to-transparent"
            />

            <div className="relative z-10 flex flex-grow w-full flex-col px-6 md:px-14">

                {/* 3-Column Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-12">

                    {/* Column 1: Navigation */}
                    <MotionDiv
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
                                        className="text-[2rem] md:text-[1.7rem] lg:text-[2rem] font-bold uppercase tracking-tight leading-[1.1] block py-1 hover:text-green-400 transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </MotionDiv>

                    {/* Column 2: Location */}
                    <MotionDiv
                        initial={{ opacity: 0, y: 20 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        <PillBadge text="location" />
                        <div className="text-[2rem] md:text-[1.5rem] lg:text-[2rem] font-bold uppercase tracking-tight leading-[1.1]">
                            <p className="m-0">barangay bulusan,</p>
                            <p className="m-0 text-green-400">calapan city</p>
                            <p className="m-0 text-white/50">oriental mindoro</p>
                        </div>
                        <a
                            href={ZOO_DIRECTIONS_URL}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 mt-5 text-sm font-medium text-green-400 border-b border-green-400/40 pb-0.5 hover:text-white hover:border-white transition-all"
                        >
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                            </svg>
                            Open in Google Maps
                        </a>
                    </MotionDiv>

                    {/* Column 3: Contact */}
                    <MotionDiv
                        initial={{ opacity: 0, y: 20 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <PillBadge text="contact" />
                        <div className="font-bold tracking-tight leading-[1.1]">
                            <a href="tel:+63432887291" className="block text-[2rem] md:text-[1.5rem] lg:text-[2rem] text-green-400 hover:text-white transition-colors">
                                (043) 288-7291
                            </a>
                            <p className="mt-2 text-[11px] font-medium uppercase tracking-widest text-white/35">Direct park contact published by City CEED</p>
                            <a href="mailto:bulusanzoo@gmail.com" className="mt-6 block break-words text-[15px] text-white/85 hover:text-green-400 transition-colors lg:text-base">
                                bulusanzoo@gmail.com
                            </a>
                            <a href="tel:+639672336074" className="mt-2 block text-[15px] text-white/85 hover:text-green-400 transition-colors lg:text-base">
                                0967 233 6074
                            </a>
                        </div>
                        <p className="text-[11px] mt-4 text-white/35 leading-relaxed">
                            City Tourism, Culture &amp; Arts Office contacts are for visitor assistance, not direct park operations.
                        </p>
                    </MotionDiv>
                </div>

                {/* Divider */}
                <div className="w-full h-px bg-white/[0.08] mt-16 md:mt-20" />

                {/* Giant Title + Bottom Bar */}
                <div className="mt-auto flex flex-col justify-end">
                    <GiantTitle />
                    <MotionDiv
                        initial={{ opacity: 0 }}
                        animate={isInView ? { opacity: 1 } : {}}
                        transition={{ duration: 0.5, delay: 0.8 }}
                        className="mt-4 flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4"
                        style={{ textShadow: "0 1px 4px rgba(0,0,0,0.9)" }}
                    >
                        <span className="text-[11px] font-medium text-white/50 uppercase tracking-widest">
                            © {currentYear} Bulusan Zoo. All rights reserved.
                        </span>
                        <ul className="flex flex-wrap gap-x-5 gap-y-2">
                            {legalLinks.map((link) => (
                                <li key={link.path}>
                                    <Link
                                        to={link.path}
                                        className="text-[11px] font-medium text-white/60 uppercase tracking-widest hover:text-green-400 transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </MotionDiv>
                </div>

            </div>
        </footer>
    );
};

export default Footer;
