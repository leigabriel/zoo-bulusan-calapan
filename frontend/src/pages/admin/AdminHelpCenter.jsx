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

const UsersIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);

const TicketIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
    </svg>
);

const SettingsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
);

const ChartIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
);

const AdminHelpCenter = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedFaq, setExpandedFaq] = useState(null);

    const faqs = [
        {
            id: 1,
            question: 'How do I create a new event?',
            answer: 'Navigate to the Events page from the sidebar, click on the "Add Event" button. Fill in the event details including title, date, time, description, and any additional information. Click "Create Event" to save.',
            category: 'Events'
        },
        {
            id: 2,
            question: 'How do I manage user accounts?',
            answer: 'Go to the Manage Users page from the sidebar. You can view all registered users, edit their information, change their roles (Admin, Staff, User), or delete accounts. Use the search and filter options to find specific users.',
            category: 'Users'
        },
        {
            id: 3,
            question: 'How do I view ticket sales and reports?',
            answer: 'Access the Reports page to generate detailed reports on ticket sales, revenue, and visitor statistics. Select the report type, date range, and click Generate. You can export reports as PDF or Excel files.',
            category: 'Reports'
        },
        {
            id: 4,
            question: 'How do I update ticket prices?',
            answer: 'Navigate to Tickets in the admin panel. Find the ticket type you want to modify and click the edit button. Update the price and any other details, then save your changes.',
            category: 'Tickets'
        },
        {
            id: 5,
            question: 'How do I view analytics and metrics?',
            answer: 'The Analytics page provides comprehensive insights into user growth, ticket sales trends, revenue statistics, and event performance. Use the time range selector to view data for different periods.',
            category: 'Analytics'
        },
        {
            id: 6,
            question: 'How do I reset a user\'s password?',
            answer: 'In the Manage Users section, find the user account and click on the edit button. There you\'ll find an option to reset or update their password. The user will receive an email notification.',
            category: 'Users'
        },
    ];

    const systemGuides = [
        {
            title: 'Getting Started Guide',
            description: 'Learn the basics of the admin dashboard and its features',
            icon: BookIcon,
            color: 'bg-blue-500/10 text-blue-400',
        },
        {
            title: 'User Management',
            description: 'How to manage staff, admins, and visitor accounts',
            icon: UsersIcon,
            color: 'bg-purple-500/10 text-purple-400',
        },
        {
            title: 'Ticket & Events',
            description: 'Managing tickets, pricing, and creating events',
            icon: TicketIcon,
            color: 'bg-[#8cff65]/10 text-[#8cff65]',
        },
        {
            title: 'Reports & Analytics',
            description: 'Understanding your data and generating reports',
            icon: ChartIcon,
            color: 'bg-yellow-500/10 text-yellow-400',
        },
        {
            title: 'System Settings',
            description: 'Configure system preferences and options',
            icon: SettingsIcon,
            color: 'bg-pink-500/10 text-pink-400',
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
                <h1 className="text-3xl font-bold text-white mb-2">How can we help you?</h1>
                <p className="text-gray-500">Search our help center or browse the guides below</p>
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
                    <p className="text-gray-500 text-sm mb-4">Chat with our support team for instant help</p>
                    <button className="text-[#8cff65] font-medium text-sm flex items-center gap-1 hover:underline">
                        Start Chat <ExternalLinkIcon />
                    </button>
                </div>

                <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6 hover:border-blue-500/30 transition-all cursor-pointer group">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 mb-4 group-hover:scale-110 transition-transform">
                        <MailIcon />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Email Support</h3>
                    <p className="text-gray-500 text-sm mb-4">Send us an email and we'll respond within 24 hours</p>
                    <a href="mailto:support@zoobulusan.com" className="text-blue-400 font-medium text-sm flex items-center gap-1 hover:underline">
                        support@zoobulusan.com <ExternalLinkIcon />
                    </a>
                </div>

                <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6 hover:border-purple-500/30 transition-all cursor-pointer group">
                    <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400 mb-4 group-hover:scale-110 transition-transform">
                        <PhoneIcon />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Phone Support</h3>
                    <p className="text-gray-500 text-sm mb-4">Call us during business hours (9AM - 5PM)</p>
                    <a href="tel:+639123456789" className="text-purple-400 font-medium text-sm flex items-center gap-1 hover:underline">
                        +63 912 345 6789 <ExternalLinkIcon />
                    </a>
                </div>
            </div>

            {/* System Guides */}
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-6">
                    <BookIcon />
                    <h2 className="text-xl font-bold text-white">System Guides</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
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
                    <h2 className="text-xl font-bold text-white">Video Tutorials</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['Dashboard Overview', 'Managing Events', 'User Administration'].map((title, index) => (
                        <div key={index} className="relative group cursor-pointer">
                            <div className="aspect-video bg-[#1e1e1e] rounded-xl flex items-center justify-center overflow-hidden border border-[#2a2a2a] group-hover:border-[#8cff65]/30 transition-all">
                                <div className="w-16 h-16 bg-[#8cff65]/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <svg className="w-6 h-6 text-[#8cff65] ml-1" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z" />
                                    </svg>
                                </div>
                            </div>
                            <h4 className="mt-3 text-white font-medium">{title}</h4>
                            <p className="text-gray-500 text-sm">5:30 min</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Still Need Help */}
            <div className="bg-gradient-to-r from-[#8cff65]/10 to-[#4ade80]/5 border border-[#8cff65]/20 rounded-2xl p-8 text-center">
                <h3 className="text-xl font-bold text-white mb-2">Still need help?</h3>
                <p className="text-gray-400 mb-6">Our support team is available 24/7 to assist you</p>
                <button className="px-8 py-3 bg-gradient-to-r from-[#8cff65] to-[#4ade80] text-[#0a0a0a] font-semibold rounded-xl hover:from-[#9dff7a] hover:to-[#5ceb91] transition-all shadow-lg shadow-[#8cff65]/20">
                    Contact Support
                </button>
            </div>
        </div>
    );
};

export default AdminHelpCenter;