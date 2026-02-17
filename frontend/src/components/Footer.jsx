import React from 'react';
import { Link } from 'react-router-dom';

const Icons = {
    ChevronRight: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
    ),
    Facebook: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1V12h3l-.5 3h-2.5v6.8c4.56-.93 8-4.96 8-9.8z" />
        </svg>
    ),
    Instagram: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
        </svg>
    )
};

const Footer = () => {
    const currentYear = new Date().getFullYear();

    const quickLinks = [
        { path: '/', label: 'Home' },
        { path: '/animals', label: 'Animals' },
        { path: '/events', label: 'Events' },
        { path: '/about', label: 'About Us' }
    ];

    const contactInfo = [
        { text: 'Bulusan, Calapan City' },
        { text: '(043) 123-4567' },
        { text: 'info@bulusanwildlife.com' }
    ];

    return (
        <footer className="bg-[#08140e] text-[#f4f4f4] pt-16 md:pt-24 pb-8 md:pb-12 overflow-hidden">
            <div className="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-16">

                <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-16 mb-16 md:mb-24">

                    <div className="md:col-span-5 lg:col-span-4">
                        <div className="flex items-center gap-2 mb-8 md:mb-12">
                            <img
                                src="https://cdn-icons-png.flaticon.com/128/1864/1864472.png"
                                alt="Logo"
                                className="w-5 h-5 opacity-90"
                            />
                            <span className="text-[10px] md:text-[11px] font-bold tracking-[0.2em] uppercase">Bulusan Zoo</span>
                        </div>

                        <h4 className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.15em] mb-4 text-gray-400">
                            Email Us
                        </h4>
                        <div className="relative w-full max-w-sm group">
                            <input
                                type="email"
                                placeholder="Email"
                                className="w-full bg-transparent border-b border-white/20 py-3 md:py-4 pr-10 text-sm focus:outline-none focus:border-white/60 transition-colors placeholder:text-gray-600 rounded-none"
                            />
                            <button className="absolute right-0 top-1/2 -translate-y-1/2 text-white/40 group-hover:text-white transition-colors">
                                <Icons.ChevronRight />
                            </button>
                        </div>
                        <p className="mt-4 text-[10px] md:text-[11px] text-gray-500 leading-relaxed">
                            Your information is never disclosed to third parties.
                        </p>
                    </div>

                    <div className="md:col-span-7 lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 md:gap-8">
                        <div>
                            <h4 className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.15em] mb-6 md:mb-8 text-gray-400">Quick Links</h4>
                            <ul className="space-y-3 md:space-y-4">
                                {quickLinks.map((link) => (
                                    <li key={link.label}>
                                        <Link to={link.path} className="text-base md:text-[17px] font-medium hover:opacity-60 transition-opacity">
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.15em] mb-6 md:mb-8 text-gray-400">Contact Support</h4>
                            <ul className="space-y-3 md:space-y-4">
                                {contactInfo.map((item, index) => (
                                    <li key={index} className="text-base md:text-[17px] font-medium text-white/90">
                                        {item.text}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="relative py-8 md:py-12 pointer-events-none overflow-visible">
                    <h2 className="text-[8.5vw] md:text-[7.5vw] lg:text-[8.5vw] leading-none font-serif italic whitespace-nowrap opacity-[0.98] tracking-tight flex items-start">
                        Wildsight
                        <span className="text-[2vw] md:text-[2vw] not-italic ml-2 mt-2 md:mt-4 opacity-70">TM</span>
                        <span className="ml-8 md:ml-12 not-italic text-green-400">Bulusan Zoo</span>
                    </h2>
                </div>

                <div className="mt-8 md:mt-12 pt-8 md:pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                        <div className="flex gap-5">
                            <a href="#" className="opacity-50 hover:opacity-100 transition-opacity"><Icons.Facebook /></a>
                            <a href="#" className="opacity-50 hover:opacity-100 transition-opacity"><Icons.Instagram /></a>
                        </div>
                        <p className="text-[11px] md:text-[12px] text-gray-500 tracking-wide">
                            © Bulusan Wildlife {currentYear}, All Rights Reserved
                        </p>
                    </div>

                    <div className="flex flex-col gap-2 md:text-right w-full md:w-auto">
                        <p className="text-[10px] md:text-[11px] text-gray-500 max-w-md md:ml-auto">
                            No Surprises Act: You have the right to receive a Good Faith Estimate of what your services may cost
                        </p>
                        {/* <p className="text-[10px] text-gray-600 italic">
                            Designed by Canvas
                        </p> */}
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;