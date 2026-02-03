import { useState } from 'react';

// Icons
const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
    </svg>
);

const HelpCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
);

const BookIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
);

const MessageIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
);

const MailIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
    </svg>
);

const PhoneIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
);

const VideoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
);

const ChevronDownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <polyline points="6 9 12 15 18 9" />
    </svg>
);

const ExternalLinkIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
);

const ScannerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M3 7V5a2 2 0 0 1 2-2h2" />
        <path d="M17 3h2a2 2 0 0 1 2 2v2" />
        <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
        <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
        <rect x="7" y="7" width="10" height="10" rx="1" />
    </svg>
);

const TicketIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
    </svg>
);

const AnimalsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" className="w-5 h-5">
        <path d="M226.5 92.9c14.3 42.9-.3 86.2-32.6 96.8s-70.1-15.6-84.4-58.5s.3-86.2 32.6-96.8s70.1 15.6 84.4 58.5zM100.4 198.6c18.9 32.4 14.3 70.1-10.2 84.1s-59.7-.9-78.5-33.3S-2.7 179.3 21.8 165.3s59.7 .9 78.5 33.3zM69.2 401.2C121.6 259.9 214.7 224 256 224s134.4 35.9 186.8 177.2c3.6 9.7 5.2 20.1 5.2 30.5v1.6c0 25.8-20.9 46.7-46.7 46.7c-11.5 0-22.9-1.4-34-4.2l-88-22c-15.3-3.8-31.3-3.8-46.6 0l-88 22c-11.1 2.8-22.5 4.2-34 4.2C84.9 480 64 459.1 64 433.3v-1.6c0-10.4 1.6-20.8 5.2-30.5zM421.8 282.7c-24.5-14-29.1-51.7-10.2-84.1s54-47.3 78.5-33.3s29.1 51.7 10.2 84.1s-54 47.3-78.5 33.3zM310.1 189.7c-32.3-10.6-46.9-53.9-32.6-96.8s52.1-69.1 84.4-58.5s46.9 53.9 32.6 96.8s-52.1 69.1-84.4 58.5z" />
    </svg>
);

const EventsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
);

const StaffHelpCenter = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedFaq, setExpandedFaq] = useState(null);

    const faqs = [
        {
            id: 1,
            question: 'How do I scan and validate tickets?',
            answer: 'Navigate to the Ticket Scanner page from the sidebar. Click "Start Camera" to activate your device camera. Point the camera at the visitor\'s QR code ticket. The system will automatically validate the ticket and display the result.',
            category: 'Scanner'
        },
        {
            id: 2,
            question: 'How do I manage animal records?',
            answer: 'Go to the Manage Animals page from the sidebar. You can view all animals, add new ones using the "Add Animal" button, edit existing records, or remove animals from the system. Keep health status updated regularly.',
            category: 'Animals'
        },
        {
            id: 3,
            question: 'How do I check ticket status?',
            answer: 'Access the Tickets page to view all tickets. You can filter by status (pending, confirmed, used, cancelled) and search by booking reference or visitor name. Click on a ticket to view full details.',
            category: 'Tickets'
        },
        {
            id: 4,
            question: 'How do I manage events?',
            answer: 'Navigate to the Events page. You can view the calendar of upcoming events, create new events, edit existing ones, or cancel events. Events can be filtered by status and date range.',
            category: 'Events'
        },
        {
            id: 5,
            question: 'What if the ticket scanner shows "Invalid Ticket"?',
            answer: 'An invalid ticket could mean: the ticket has already been used, the ticket is expired (past visit date), the ticket was cancelled, or the QR code is damaged. Ask the visitor for their booking reference to verify manually.',
            category: 'Scanner'
        },
        {
            id: 6,
            question: 'How do I update visitor information?',
            answer: 'Go to Manage Users and find the visitor. Click the edit button to update their information. Note that you can only edit regular user accounts, not admin or staff accounts.',
            category: 'Users'
        },
    ];

    const systemGuides = [
        {
            title: 'Ticket Scanner Guide',
            description: 'How to validate tickets using the QR scanner',
            icon: ScannerIcon,
            color: 'bg-blue-500/10 text-blue-400',
        },
        {
            title: 'Animal Management',
            description: 'Adding, editing, and tracking animal records',
            icon: AnimalsIcon,
            color: 'bg-[#8cff65]/10 text-[#8cff65]',
        },
        {
            title: 'Ticket Management',
            description: 'Processing and managing visitor tickets',
            icon: TicketIcon,
            color: 'bg-purple-500/10 text-purple-400',
        },
        {
            title: 'Event Operations',
            description: 'Creating and managing zoo events',
            icon: EventsIcon,
            color: 'bg-yellow-500/10 text-yellow-400',
        },
    ];

    const filteredFaqs = searchQuery
        ? faqs.filter(faq =>
            faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.category.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : faqs;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center max-w-2xl mx-auto">
                <div className="w-16 h-16 bg-[#8cff65]/10 rounded-full flex items-center justify-center mx-auto mb-4 text-[#8cff65]">
                    <HelpCircleIcon />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">Staff Help Center</h1>
                <p className="text-gray-500">Find answers to common questions and learn how to use the staff portal</p>
            </div>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
                <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                        <SearchIcon />
                    </div>
                    <input
                        type="text"
                        placeholder="Search for help..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#141414] border border-[#2a2a2a] rounded-2xl py-4 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-[#8cff65] focus:ring-2 focus:ring-[#8cff65]/20 transition-all text-lg"
                    />
                </div>
            </div>

            {/* Quick Contact Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6 hover:border-[#8cff65]/30 transition-all cursor-pointer group">
                    <div className="w-12 h-12 bg-[#8cff65]/10 rounded-xl flex items-center justify-center text-[#8cff65] mb-4 group-hover:scale-110 transition-transform">
                        <MessageIcon />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Live Chat</h3>
                    <p className="text-gray-500 text-sm mb-4">Chat with admin support for instant help</p>
                    <button className="text-[#8cff65] font-medium text-sm flex items-center gap-1 hover:underline">
                        Start Chat <ExternalLinkIcon />
                    </button>
                </div>

                <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6 hover:border-blue-500/30 transition-all cursor-pointer group">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 mb-4 group-hover:scale-110 transition-transform">
                        <MailIcon />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Email Support</h3>
                    <p className="text-gray-500 text-sm mb-4">Send us an email for detailed inquiries</p>
                    <a href="mailto:staff-support@zoobulusan.com" className="text-blue-400 font-medium text-sm flex items-center gap-1 hover:underline">
                        staff-support@zoobulusan.com <ExternalLinkIcon />
                    </a>
                </div>

                <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6 hover:border-purple-500/30 transition-all cursor-pointer group">
                    <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400 mb-4 group-hover:scale-110 transition-transform">
                        <PhoneIcon />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Admin Hotline</h3>
                    <p className="text-gray-500 text-sm mb-4">Call admin during work hours (8AM - 6PM)</p>
                    <a href="tel:+639123456789" className="text-purple-400 font-medium text-sm flex items-center gap-1 hover:underline">
                        +63 912 345 6789 <ExternalLinkIcon />
                    </a>
                </div>
            </div>

            {/* System Guides */}
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-6">
                    <BookIcon />
                    <h2 className="text-xl font-bold text-white">Quick Guides</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {systemGuides.map((guide, index) => (
                        <div
                            key={index}
                            className="p-4 bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl hover:border-[#8cff65]/30 transition-all cursor-pointer group"
                        >
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${guide.color} group-hover:scale-110 transition-transform`}>
                                <guide.icon />
                            </div>
                            <h4 className="font-semibold text-white text-sm mb-1">{guide.title}</h4>
                            <p className="text-gray-500 text-xs">{guide.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* FAQs */}
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-6">
                    <HelpCircleIcon />
                    <h2 className="text-xl font-bold text-white">Frequently Asked Questions</h2>
                </div>

                {filteredFaqs.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <p>No FAQs match your search.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredFaqs.map((faq) => (
                            <div
                                key={faq.id}
                                className="border border-[#2a2a2a] rounded-xl overflow-hidden"
                            >
                                <button
                                    onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                                    className="w-full flex items-center justify-between p-4 text-left hover:bg-[#1e1e1e] transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="px-2 py-0.5 bg-[#8cff65]/10 text-[#8cff65] text-xs font-medium rounded">
                                            {faq.category}
                                        </span>
                                        <span className="text-white font-medium">{faq.question}</span>
                                    </div>
                                    <span className={`text-gray-400 transition-transform ${expandedFaq === faq.id ? 'rotate-180' : ''}`}>
                                        <ChevronDownIcon />
                                    </span>
                                </button>
                                {expandedFaq === faq.id && (
                                    <div className="px-4 pb-4 pt-0">
                                        <div className="p-4 bg-[#1e1e1e] rounded-lg text-gray-300 text-sm leading-relaxed">
                                            {faq.answer}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Video Tutorials */}
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-6">
                    <VideoIcon />
                    <h2 className="text-xl font-bold text-white">Training Videos</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['Ticket Scanning Tutorial', 'Animal Record Management', 'Daily Operations Guide'].map((title, index) => (
                        <div key={index} className="relative group cursor-pointer">
                            <div className="aspect-video bg-[#1e1e1e] rounded-xl flex items-center justify-center overflow-hidden border border-[#2a2a2a] group-hover:border-[#8cff65]/30 transition-all">
                                <div className="w-16 h-16 bg-[#8cff65]/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <svg className="w-6 h-6 text-[#8cff65] ml-1" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z" />
                                    </svg>
                                </div>
                            </div>
                            <h4 className="mt-3 text-white font-medium">{title}</h4>
                            <p className="text-gray-500 text-sm">4:30 min</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Still Need Help */}
            <div className="bg-gradient-to-r from-[#8cff65]/10 to-[#4ade80]/5 border border-[#8cff65]/20 rounded-2xl p-8 text-center">
                <h3 className="text-xl font-bold text-white mb-2">Need more assistance?</h3>
                <p className="text-gray-400 mb-6">Contact the admin team for additional support</p>
                <button className="px-8 py-3 bg-gradient-to-r from-[#8cff65] to-[#4ade80] text-[#0a0a0a] font-semibold rounded-xl hover:from-[#9dff7a] hover:to-[#5ceb91] transition-all shadow-lg shadow-[#8cff65]/20">
                    Contact Admin
                </button>
            </div>
        </div>
    );
};

export default StaffHelpCenter;