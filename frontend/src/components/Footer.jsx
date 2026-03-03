import React from 'react';
import { Link } from 'react-router-dom';

const Icons = {
    ChevronRight: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
    ),
    ArrowUp: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
            <line x1="12" y1="19" x2="12" y2="5"></line>
            <polyline points="5 12 12 5 19 12"></polyline>
        </svg>
    )
};

const Footer = () => {
    const currentYear = new Date().getFullYear();

    const quickLinks = [
        { path: '/', label: 'Home' },
        { path: '/animals', label: 'Collections' },
        { path: '/events', label: 'Events' },
        { path: '/about', label: 'Company' }
    ];

    const contactInfo = [
        { text: 'Bulusan, Calapan City' },
        { text: '(043) 123-4567' },
        { text: 'info@bulusanwildlife.com' }
    ];

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <footer className="bg-[#00FF00] text-[#212631] pt-12 md:pt-16 pb-6 px-6 md:px-12 relative overflow-hidden">

            <div className="flex justify-between items-start mb-24 relative z-10">
                <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-[0.9]">
                    Wildlife<br />
                    Conservation
                </h1>
                <button
                    onClick={scrollToTop}
                    className="p-3 border-2 border-[#212631] rounded-lg hover:bg-[#212631] hover:text-[#00FF00] transition-colors cursor-pointer"
                    aria-label="Scroll to top"
                >
                    <Icons.ArrowUp />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 lg:gap-8 mb-8 relative z-10">

                <div>
                    <h4 className="text-sm md:text-base font-black uppercase tracking-wide mb-6">Bulusan Zoo</h4>
                    <ul className="space-y-1">
                        {contactInfo.map((item, index) => (
                            <li key={index} className="text-sm md:text-base font-medium uppercase tracking-wide">
                                {item.text}
                            </li>
                        ))}
                    </ul>
                </div>

                <div>
                    <h4 className="text-sm md:text-base font-black uppercase tracking-wide mb-6">Navigation</h4>
                    <ul className="space-y-1">
                        {quickLinks.map((link) => (
                            <li key={link.label}>
                                <Link to={link.path} className="text-sm md:text-base font-medium uppercase tracking-wide hover:opacity-60 transition-opacity">
                                    {link.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>

                <div>
                    <h4 className="text-sm md:text-base font-black uppercase tracking-wide mb-6">Newsletter</h4>
                    <div className="relative w-full max-w-[250px] group">
                        <input
                            type="email"
                            placeholder="EMAIL ADDRESS"
                            className="w-full bg-transparent border-b-2 border-[#212631] py-2 pr-10 text-sm font-bold placeholder-[#212631]/60 focus:outline-none focus:border-[#212631] uppercase transition-colors rounded-none"
                        />
                        <button className="absolute right-0 top-1/2 -translate-y-1/2 text-[#212631] hover:opacity-60 transition-opacity">
                            <Icons.ChevronRight />
                        </button>
                    </div>
                    <p className="mt-3 text-[10px] md:text-xs font-medium uppercase opacity-70 tracking-wide max-w-[250px]">
                        Your information is never disclosed to third parties.
                    </p>
                </div>

                <div>
                    <h4 className="text-sm md:text-base font-black uppercase tracking-wide mb-6">Follow</h4>
                    <ul className="space-y-1">
                        <li>
                            <a href="#" className="text-sm md:text-base font-medium uppercase tracking-wide hover:opacity-60 transition-opacity">Facebook</a>
                        </li>
                        <li>
                            <a href="#" className="text-sm md:text-base font-medium uppercase tracking-wide hover:opacity-60 transition-opacity">Instagram</a>
                        </li>
                    </ul>
                </div>

            </div>

            <div className="w-full relative z-10 flex justify-center items-center overflow-hidden -mx-2 md:mb-4">
                <h2 className="text-[20vw] md:text-[23vw] font-bold leading-[0.75] tracking-wider text-[#212631] lowercase">
                    bulusan
                </h2>
            </div>

            <div className="border border-[#212631] rounded-sm p-3 md:p-4 flex flex-col md:flex-row justify-between items-center gap-4 relative z-10">
                <div className="flex items-center gap-4">
                    <span className="text-sm md:text-base font-bold uppercase tracking-wide">
                        ©{currentYear} Bulusan Zoo
                    </span>
                    <span className="hidden md:inline-block text-xs uppercase font-medium opacity-80">
                        Bulusan Wildlife Conservation Inc.
                    </span>
                </div>

                <div className="text-xs md:text-sm font-medium uppercase tracking-wide text-center md:text-right">
                    No Surprises Act – Good Faith Estimate
                </div>
            </div>

        </footer>
    );
};

export default Footer;