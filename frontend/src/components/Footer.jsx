import React from 'react';
import { Link } from 'react-router-dom';

// --- Embedded Icons (No external files needed) ---
const Icons = {
    Paw: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path d="M19 5c-1.1 0-2 .9-2 2v.5c-.85-.18-1.78-.17-2.5 0V7c0-1.1-.9-2-2-2s-2 .9-2 2v1.07c-1.07.6-2.06 1.34-3 2.18V9c0-1.1-.9-2-2-2s-2 .9-2 2v5.18c0 3.2 3.52 5.82 8.5 5.82s8.5-2.62 8.5-5.82V7c0-1.1-.9-2-2-2zm-6.5 2c.28 0 .5.22.5.5v1.23c-.32.06-.65.14-.97.24V7.5c0-.28.22-.5.5-.5zM5.5 9c.28 0 .5.22.5.5v3.13c-1.18.96-1.5 2.15-1.5 3.19 0 1.07 1.43 2.18 4.5 2.18s4.5-1.11 4.5-2.18c0-1.04-.32-2.23-1.5-3.19V9.5c0-.28.22-.5.5-.5s.5.22.5.5v5.03c.87.5 1.74.83 2.5 1.02V9.5c0-.28.22-.5.5-.5s.5.22.5.5v6.5c0 1.93-3.13 3.5-7 3.5s-7-1.57-7-3.5v-6c0-.28.22-.5.5-.5z" />
            <circle cx="9" cy="5" r="1.5" /><circle cx="15" cy="5" r="1.5" /><circle cx="5" cy="9" r="1.5" /><circle cx="19" cy="9" r="1.5" /><circle cx="12" cy="14" r="2" />
        </svg>
    ),
    ChevronRight: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
            <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
    ),
    MapPin: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
        </svg>
    ),
    Phone: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 4.5V4.5z" clipRule="evenodd" />
        </svg>
    ),
    Envelope: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
            <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
        </svg>
    ),
    Facebook: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
    ),
    Instagram: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772 4.902 4.902 0 011.772-1.153c.636-.247 1.363-.416 2.427-.465C9.673 2.013 10.03 2 12.48 2h-1.65zm-2.06 2h4.522c.28 0 .55.013.806.024.96.043 1.487.2 1.835.334.46.178.79.39 1.135.734.345.345.556.674.734 1.135.134.348.291.875.334 1.836.011.256.024.526.024.806v4.522c0 .28-.013.55-.024.806-.043.96-.2 1.487-.334 1.835-.178.46-.39.79-.734 1.135-.345.345-.674.556-1.135.734-.348.134-.875.291-1.836.334-.256.011-.526.024-.806.024h-4.522c-.28 0-.55-.013-.806-.024-.96-.043-1.487-.2-1.835-.334-.46-.178-.79-.39-1.135-.734-.345-.345-.556-.674-.734-1.135-.134-.348-.291-.875-.334-1.836-.011-.256-.024-.526-.024-.806v-4.522c0-.28.013-.55.024-.806.043-.96.2-1.487.334-1.835.178-.46.39-.79.734-1.135.345-.345.674-.556 1.135-.734.348-.134.875-.291 1.836-.334.256-.011.526-.024.806-.024zM12.001 7.333a4.667 4.667 0 100 9.334 4.667 4.667 0 000-9.334zm0 2a2.667 2.667 0 110 5.334 2.667 2.667 0 010-5.334zm5.334-3.667a1.333 1.333 0 100 2.666 1.333 1.333 0 000-2.666z" clipRule="evenodd" />
        </svg>
    ),
    Twitter: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
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
        { Icon: Icons.MapPin, text: 'Bulusan, Calapan City' },
        { Icon: Icons.Phone, text: '(043) 123-4567' },
        { Icon: Icons.Envelope, text: 'info@bulusanwildlife.com' }
    ];

    const socialLinks = [
        { Icon: Icons.Facebook, href: '#' },
        { Icon: Icons.Instagram, href: '#' },
        { Icon: Icons.Twitter, href: '#' }
    ];

    return (
        <footer className="bg-gradient-to-br from-[#2D5A27] to-[#3A8C7D] text-white py-12 md:py-16">
            <div className="container mx-auto px-4 sm:px-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">

                    {/* Brand Section */}
                    <div>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 rounded-full bg-white/25 flex items-center justify-center">
                                <img
                                    src="https://cdn-icons-png.flaticon.com/128/5068/5068980.png"
                                    alt="Logo"
                                    className="w-6 h-6 invert brightness-0 filter"
                                />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold">Bulusan Wildlife</h3>
                                <p className="text-sm opacity-90">AI-Powered Nature Park</p>
                            </div>
                        </div>
                        <p className="text-sm opacity-90 mb-4 leading-relaxed">
                            Cloud-based zoo management system with real-time AI assistance for modern wildlife conservation.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="font-bold text-lg mb-6">Quick Links</h4>
                        <ul className="space-y-3 text-sm opacity-90">
                            {quickLinks.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        to={link.path}
                                        className="hover:text-white hover:underline transition flex items-center gap-2 group"
                                    >
                                        <div className="opacity-70 group-hover:opacity-100 transition">
                                            <Icons.ChevronRight />
                                        </div>
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact Support */}
                    <div>
                        <h4 className="font-bold text-lg mb-6">Contact Support</h4>
                        <ul className="space-y-3 text-sm opacity-90">
                            {contactInfo.map((item, index) => (
                                <li key={index} className="flex items-center gap-3">
                                    <item.Icon />
                                    <span>{item.text}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Social Media */}
                    <div>
                        <h4 className="font-bold text-lg mb-6">Connect With Us</h4>
                        <div className="flex gap-3 mt-6">
                            {socialLinks.map((social, index) => (
                                <a
                                    key={index}
                                    href={social.href}
                                    aria-label={`Follow us on ${['Facebook', 'Instagram', 'Twitter'][index]}`}
                                    className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition group touch-target"
                                >
                                    <div className="group-hover:scale-110 transition">
                                        <social.Icon />
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Copyright */}
                <div className="border-t border-green-600 mt-12 pt-8 text-center text-sm opacity-90">
                    <p>© {currentYear} Bulusan Wildlife & Nature Park. AI-Driven Smart Zoo Management System</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;