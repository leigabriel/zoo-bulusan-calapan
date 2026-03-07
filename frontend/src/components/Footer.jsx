import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import GridDistortion from "./GridDistortion";

const ArrowUp = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4 md:w-5 md:h-5"
    >
        <line x1="12" y1="19" x2="12" y2="5" />
        <polyline points="5 12 12 5 19 12" />
    </svg>
);

const SplitText = ({ text, className = "", delay = 0, staggerDelay = 0.035 }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: false, margin: "-5%" });

    return (
        <span ref={ref} className={`inline-flex overflow-hidden ${className}`} aria-label={text}>
            {text.split("").map((char, i) => (
                <motion.span
                    key={i}
                    className="inline-block"
                    style={{ whiteSpace: char === " " ? "pre" : "normal", textShadow: "0px 2px 10px rgba(0,0,0,0.3)" }}
                    initial={{ y: "110%", opacity: 0 }}
                    animate={isInView ? { y: "0%", opacity: 1 } : { y: "110%", opacity: 0 }}
                    transition={{
                        duration: 0.65,
                        delay: delay + i * staggerDelay,
                        ease: [0.16, 1, 0.3, 1],
                    }}
                >
                    {char}
                </motion.span>
            ))}
        </span>
    );
};

const BulusanTitle = () => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: false, margin: "-5%" });
    const letters = "bulusan zoo".split("");

    return (
        <div ref={ref} className="flex justify-start items-end overflow-hidden px-6 md:px-14">
            {letters.map((char, i) => (
                <motion.span
                    key={i}
                    className="inline-block select-none"
                    style={{
                        fontSize: "clamp(1.5rem, 17vw, 17vw)",
                        fontFamily: "'Times New Roman', Georgia, serif",
                        fontStyle: "italic",
                        fontWeight: 900,
                        lineHeight: 0.85,
                        letterSpacing: "-0.02em",
                        color: "#ffffff",
                    }}
                    initial={{ y: "100%", opacity: 0 }}
                    animate={isInView ? { y: "0%", opacity: 1 } : { y: "100%", opacity: 0 }}
                    transition={{
                        duration: 0.8,
                        delay: i * 0.06,
                        ease: [0.16, 1, 0.3, 1],
                    }}
                >
                    {char}
                </motion.span>
            ))}
            <motion.span
                className="inline-block select-none"
                style={{
                    fontSize: "clamp(1.8rem, 4.5vw, 4.5vw)",
                    fontFamily: "'Times New Roman', Georgia, serif",
                    fontWeight: 900,
                    lineHeight: 0.85,
                    color: "#ffffff",
                    marginLeft: "0.15em",
                    marginBottom: "0.5em",
                }}
                initial={{ opacity: 0, y: 16 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
                transition={{ duration: 0.5, delay: 0.5 }}
            >
                ®
            </motion.span>
        </div>
    );
};

const AnimatedLink = ({ to, children, delay = 0, index }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: false, margin: "-5%" });
    const [hovered, setHovered] = useState(false);

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, x: -8 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -8 }}
            transition={{ duration: 0.4, delay }}
            className="relative flex items-center gap-4"
            style={{ height: "1.7em" }}
            onHoverStart={() => setHovered(true)}
            onHoverEnd={() => setHovered(false)}
        >
            <span
                className="select-none opacity-60"
                style={{ fontSize: "clamp(9px, 1vw, 13px)", minWidth: "1.8rem", color: "#ffffff" }}
            >
                ({String.fromCharCode(73 + index)})
            </span>
            <Link
                to={to}
                className="relative uppercase tracking-[0.15em]"
                style={{ fontSize: "clamp(10px, 1.1vw, 14px)", color: "#ffffff", fontWeight: 500 }}
            >
                <motion.span animate={{ opacity: hovered ? 0.6 : 1 }} transition={{ duration: 0.2 }} className="block">
                    {children}
                </motion.span>
                <motion.span
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: hovered ? 1 : 0 }}
                    transition={{ duration: 0.25 }}
                    className="absolute bottom-0 left-0 w-full h-px origin-left"
                    style={{ backgroundColor: "#ffffff", opacity: 0.6 }}
                />
            </Link>
        </motion.div>
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
        { path: "/reservations", label: "Reservation" },
        { path: "/about", label: "About" },
    ];

    const contactInfo = [
        "Bulusan, Calapan City",
        "(043) 123-4567",
        "info@bulusanwildlife.com",
    ];

    const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

    return (
        <footer
            ref={footerRef}
            className="min-h-screen relative overflow-hidden"
            style={{ backgroundColor: "#007a55", color: "#ffffff" }}
        >
            <div className="absolute inset-0 z-0 pointer-events-auto opacity-45 mix-blend-overlay bg-black">
                <GridDistortion
                    imageSrc="bulusan.webp"
                    grid={15}
                    mouse={0.1}
                    strength={0.15}
                    relaxation={0.9}
                    noiseStrength={0.12}
                />
            </div>

            <div className="relative z-10 flex flex-col justify-between h-full px-6 md:px-14 py-10 pointer-events-none">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                    transition={{ duration: 0.6 }}
                    className="flex justify-between items-start border-b pb-8 pointer-events-auto"
                    style={{ borderColor: "rgba(255,255,255,0.2)" }}
                >
                    <div
                        style={{
                            fontFamily: "'Times New Roman', Georgia, serif",
                            fontStyle: "italic",
                            fontWeight: 900,
                            fontSize: "clamp(1.8rem, 5vw, 5.5vw)",
                            color: "#ffffff",
                            lineHeight: 1.1,
                        }}
                    >
                        <SplitText text="Wildlife" delay={0.05} staggerDelay={0.04} />
                        <br />
                        <SplitText text="Conservation" delay={0.3} staggerDelay={0.03} />
                    </div>

                    <motion.button
                        onClick={scrollToTop}
                        initial={{ opacity: 0 }}
                        animate={isInView ? { opacity: 1 } : {}}
                        transition={{ duration: 0.5, delay: 0.5 }}
                        whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-2 border px-3 py-2 uppercase tracking-widest transition-colors mt-2 md:mt-0"
                        style={{
                            borderColor: "rgba(255,255,255,0.4)",
                            color: "#ffffff",
                            fontSize: "clamp(9px, 0.9vw, 12px)",
                        }}
                    >
                        <ArrowUp />
                        <span className="hidden md:inline">Top</span>
                    </motion.button>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-y-10 gap-x-6 mt-10 md:mt-14 pointer-events-auto font-medium">
                    <div className="sm:col-span-2">
                        <h4
                            className="uppercase tracking-[0.2em] mb-4 md:mb-6 opacity-80"
                            style={{ fontSize: "clamp(9px, 0.85vw, 12px)", color: "#ffffff" }}
                        >
                            Navigation
                        </h4>
                        <ul className="space-y-1">
                            {quickLinks.map((link, i) => (
                                <li key={link.label}>
                                    <AnimatedLink to={link.path} delay={0.1 + i * 0.05} index={i}>
                                        {link.label}
                                    </AnimatedLink>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4
                            className="uppercase tracking-[0.2em] mb-4 md:mb-6 opacity-80"
                            style={{ fontSize: "clamp(9px, 0.85vw, 16px)", color: "#ffffff" }}
                        >
                            Contact
                        </h4>
                        <ul className="space-y-2">
                            {contactInfo.map((item, i) => (
                                <motion.li
                                    key={i}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={isInView ? { opacity: 0.9, y: 0 } : {}}
                                    transition={{ duration: 0.4, delay: 0.2 + i * 0.07 }}
                                    style={{ fontSize: "clamp(10px, 1vw, 14px)", color: "#ffffff" }}
                                >
                                    {item}
                                </motion.li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4
                            className="uppercase tracking-[0.2em] mb-4 md:mb-6 opacity-80"
                            style={{ fontSize: "clamp(9px, 0.85vw, 16px)", color: "#ffffff" }}
                        >
                            Organization
                        </h4>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={isInView ? { opacity: 0.95 } : { opacity: 0 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            className="leading-relaxed max-w-sm md:max-w-none"
                            style={{ fontSize: "clamp(10px, 1vw, 14px)", color: "#ffffff" }}
                        >
                            Bulusan Wildlife Conservation Inc. is committed to habitat protection,
                            biodiversity awareness, and sustainable conservation programs.
                        </motion.p>
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="mt-12 md:mt-16 mb-4 pointer-events-auto"
                >
                    <p
                        className="leading-relaxed max-w-lg"
                        style={{ fontSize: "clamp(10px, 1vw, 13px)", color: "#ffffff", opacity: 0.95 }}
                    >
                        We are here when you want quiet nature for no particular reason.{" "}
                        <Link
                            to="/reservation"
                            className="underline underline-offset-2 hover:opacity-70 transition-opacity"
                            style={{ textDecorationColor: "rgba(255,255,255,0.6)" }}
                        >
                            Visit us
                        </Link>{" "}
                        and we will show you wildlife that matches your wonder.
                    </p>
                </motion.div>

                <div className="mt-2 -mx-6 md:-mx-14 overflow-hidden pointer-events-none">
                    <BulusanTitle />
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    className="mt-6 border-t pt-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-2 md:gap-0 pointer-events-auto"
                    style={{ borderColor: "rgba(255,255,255,0.2)" }}
                >
                    <span
                        className="uppercase tracking-widest opacity-70"
                        style={{ fontSize: "clamp(9px, 0.85vw, 11px)", color: "#ffffff" }}
                    >
                        © {currentYear} Bulusan Zoo
                    </span>
                    <span
                        className="uppercase tracking-widest opacity-60"
                        style={{ fontSize: "clamp(9px, 0.85vw, 11px)", color: "#ffffff" }}
                    >
                        Bulusan Wildlife Conservation Inc.
                    </span>
                </motion.div>
            </div>
        </footer>
    );
};

export default Footer;