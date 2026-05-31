import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Icons
const Icons = {
    Back: () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
    ),
    Home: () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
    ),
    Ticket: () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
    ),
    Camera: () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    ),
    Map: () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
    ),
    User: () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
    ),
    ChevronDown: () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
    ),
    ChevronUp: () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        </svg>
    ),
    Mail: () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
    ),
    Phone: () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
    ),
    Clock: () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    Search: () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
    ),
    Book: () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
    ),
    Robot: () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <rect x="3" y="11" width="18" height="10" rx="2" />
            <circle cx="12" cy="5" r="2" />
            <path d="M12 7v4" />
            <circle cx="8" cy="16" r="1" />
            <circle cx="16" cy="16" r="1" />
        </svg>
    )
};

const Help = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedFaq, setExpandedFaq] = useState(null);
    const [activeCategory, setActiveCategory] = useState('all');

    const helpCategories = [
        { id: 'all', label: 'All Topics', icon: Icons.Book },
        { id: 'tickets', label: 'Tickets & Entry', icon: Icons.Ticket },
        { id: 'reservations', label: 'Reservations & Events', icon: Icons.Clock },
        { id: 'ai', label: 'AI Scanner & Assistant', icon: Icons.Robot },
        { id: 'map', label: 'Map & Navigation', icon: Icons.Map },
        { id: 'account', label: 'Account & Profile', icon: Icons.User },
        { id: 'community', label: 'Community & Messages', icon: Icons.Mail }
    ];

    const CATEGORY_META = {
        tickets: { label: 'Tickets', badge: 'bg-emerald-100 text-emerald-700' },
        reservations: { label: 'Reservations', badge: 'bg-lime-100 text-lime-700' },
        ai: { label: 'AI Tools', badge: 'bg-green-100 text-green-700' },
        map: { label: 'Map', badge: 'bg-emerald-100 text-emerald-700' },
        account: { label: 'Account', badge: 'bg-teal-100 text-teal-700' },
        community: { label: 'Community', badge: 'bg-emerald-50 text-emerald-700' }
    };

    const faqs = [
        {
            category: 'tickets',
            question: 'How do I buy tickets for a visit?',
            answer: 'Open Tickets from the main menu, choose your ticket types, pick a visit date, and complete the checkout flow. Your ticket confirmation appears in My Tickets.'
        },
        {
            category: 'tickets',
            question: 'How do Bulusan resident tickets work?',
            answer: 'Select the Bulusan Resident ticket type and upload a clear photo of your valid resident ID. Approval status appears in My Tickets once verified.'
        },
        {
            category: 'reservations',
            question: 'How do I reserve a spot for an event?',
            answer: 'Visit Events, select an activity, and complete the reservation form. You can review your request in Reservations after submission.'
        },
        {
            category: 'reservations',
            question: 'Where can I view or update my reservations?',
            answer: 'Go to Reservations to review ticket and event requests. If changes are allowed for your booking, you will see the available actions there.'
        },
        {
            category: 'ai',
            question: 'How do I use the AI Animal Scanner?',
            answer: 'Open the AI Scanner, take a clear photo, and submit it for identification. For best results, use good lighting and keep the subject centered.'
        },
        {
            category: 'ai',
            question: 'What can the AI Assistant help with?',
            answer: 'The AI Assistant answers questions about animals, exhibits, ticketing, events, and navigation. Tap the chat button to get help any time.'
        },
        {
            category: 'map',
            question: 'Where is the interactive zoo map?',
            answer: 'Open the Map page from the main menu. Use the map to locate exhibits, facilities, and walking routes.'
        },
        {
            category: 'map',
            question: 'Does the map include accessible routes?',
            answer: 'Yes. Accessibility markers highlight ramps, rest areas, and easier walking paths where available.'
        },
        {
            category: 'account',
            question: 'How do I reset my password?',
            answer: 'On the Login screen, select Forgot Password and follow the email reset instructions.'
        },
        {
            category: 'account',
            question: 'How do I update my profile photo?',
            answer: 'Open your Profile page, choose Edit Profile, and upload a new image. Save changes to apply the update.'
        },
        {
            category: 'community',
            question: 'How do I post updates in the community?',
            answer: 'Go to Community, tap Create Post, add your text or photo, and submit. Posts appear after moderation if required.'
        },
        {
            category: 'community',
            question: 'How do I report a post or message?',
            answer: 'Use the Report option on a post or message to flag content. Our staff review reports and take action based on guidelines.'
        }
    ];

    const filteredFaqs = faqs.filter(faq => {
        const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
        const matchesSearch = searchQuery === '' ||
            faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const quickLinks = [
        { label: 'Buy Tickets', path: '/tickets', icon: Icons.Ticket },
        { label: 'AI Scanner', path: '/classifier', icon: Icons.Camera },
        { label: 'Upcoming Events', path: '/events', icon: Icons.Clock },
        { label: 'Zoo Map', path: '/map', icon: Icons.Map }
    ];

    return (
        <div className="min-h-screen bg-[#f2fbf4] text-[#1f2d23] flex flex-col">
            {/* Floating Navigation */}
            <div className="fixed top-4 left-4 right-4 z-50 flex justify-between items-center pointer-events-none">
                <button
                    onClick={() => navigate(-1)}
                    className="pointer-events-auto flex items-center gap-2 px-4 py-2.5 bg-white/90 backdrop-blur-sm text-emerald-900 rounded-full shadow-lg border border-emerald-100 hover:shadow-xl transition-all duration-300 font-medium"
                >
                    <Icons.Back />
                    <span className="hidden sm:inline">Back</span>
                </button>
                <Link
                    to="/"
                    className="pointer-events-auto flex items-center gap-2 px-4 py-2.5 bg-white/90 backdrop-blur-sm text-emerald-900 rounded-full shadow-lg border border-emerald-100 hover:shadow-xl transition-all duration-300 font-medium"
                >
                    <Icons.Home />
                    <span className="hidden sm:inline">Home</span>
                </Link>
            </div>

            {/* Hero Section */}
            <section className="relative py-20 pt-28 text-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#effbf3] via-[#ddf3e5] to-[#cce9d7]" />
                <div className="absolute -top-24 right-0 w-72 h-72 rounded-full bg-[#bfe6cc] opacity-40 blur-3xl" />
                <div className="relative z-10 container mx-auto px-4">
                    <p className="text-xs uppercase tracking-[0.35em] font-semibold text-emerald-700/80 bg-white/70 border border-emerald-200 inline-flex px-4 py-2 rounded-full mb-6">
                        Zoo Bulusan Help
                    </p>
                    <h1 className="text-4xl md:text-5xl font-bold mb-3 tracking-tight">Help Center</h1>
                    <p className="text-base md:text-lg max-w-2xl mx-auto text-emerald-900/70 mb-8">
                        Find answers for tickets, reservations, AI tools, and planning your visit.
                    </p>

                    {/* Search Bar */}
                    <div className="max-w-xl mx-auto">
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-700">
                                <Icons.Search />
                            </div>
                            <input
                                type="text"
                                placeholder="Search for help..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white text-emerald-900 placeholder-emerald-700/50 border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 transition-all"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Quick Links */}
            <div className="container mx-auto px-4 -mt-8 relative z-10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    {quickLinks.map((link, index) => (
                        <Link
                            key={index}
                            to={user ? link.path : '/login'}
                            className="bg-white rounded-2xl p-4 md:p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border border-emerald-100 flex flex-col items-center text-center gap-2 md:gap-3"
                        >
                            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center">
                                <link.icon />
                            </div>
                            <span className="font-medium text-emerald-900 text-sm md:text-base">{link.label}</span>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-grow container mx-auto px-4 py-8 md:py-12">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Categories Sidebar */}
                    <div className="lg:w-64 flex-shrink-0">
                        <div className="bg-white rounded-2xl shadow-lg p-4 border border-emerald-100 sticky top-24">
                            <h3 className="font-semibold text-emerald-900 mb-4 px-2">Categories</h3>

                            {/* Mobile: Horizontal scroll */}
                            <div className="lg:hidden flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
                                {helpCategories.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setActiveCategory(cat.id)}
                                        className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${activeCategory === cat.id
                                                ? 'bg-emerald-600 text-white'
                                                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                                            }`}
                                    >
                                        <cat.icon />
                                        <span className="text-sm font-medium whitespace-nowrap">{cat.label}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Desktop: Vertical list */}
                            <div className="hidden lg:block space-y-1">
                                {helpCategories.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setActiveCategory(cat.id)}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${activeCategory === cat.id
                                                ? 'bg-emerald-100 text-emerald-800'
                                                : 'text-emerald-900/60 hover:bg-emerald-50'
                                            }`}
                                    >
                                        <cat.icon />
                                        <span className="font-medium text-sm">{cat.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* FAQ Content */}
                    <div className="flex-grow">
                        <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 overflow-hidden">
                            <div className="p-4 md:p-6 border-b border-emerald-100">
                                <h2 className="text-xl font-bold text-emerald-900">Frequently Asked Questions</h2>
                                <p className="text-sm text-emerald-900/60 mt-1">
                                    {filteredFaqs.length} {filteredFaqs.length === 1 ? 'result' : 'results'} found
                                </p>
                            </div>

                            <div className="divide-y divide-emerald-100">
                                {filteredFaqs.length > 0 ? (
                                    filteredFaqs.map((faq, index) => {
                                        const meta = CATEGORY_META[faq.category] || { label: 'General', badge: 'bg-emerald-100 text-emerald-700' };
                                        return (
                                        <div key={index} className="p-4 md:p-6">
                                            <button
                                                onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                                                className="w-full flex items-start justify-between gap-4 text-left"
                                            >
                                                <div className="flex-grow">
                                                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium mb-2 ${meta.badge}`}>
                                                        {meta.label}
                                                    </span>
                                                    <h3 className="font-semibold text-emerald-900">{faq.question}</h3>
                                                </div>
                                                <div className="text-emerald-700/60 flex-shrink-0 mt-4">
                                                    {expandedFaq === index ? <Icons.ChevronUp /> : <Icons.ChevronDown />}
                                                </div>
                                            </button>
                                            {expandedFaq === index && (
                                                <div className="mt-4 pt-4 border-t border-emerald-100">
                                                    <p className="text-emerald-900/70 leading-relaxed">{faq.answer}</p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                    })
                                ) : (
                                    <div className="p-8 text-center">
                                        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
                                            <Icons.Search />
                                        </div>
                                        <h3 className="font-semibold text-emerald-900 mb-2">No results found</h3>
                                        <p className="text-sm text-emerald-900/60">Try adjusting your search or filter</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contact Section */}
                <div className="mt-12">
                    <div className="bg-[#e3f6ea] border border-emerald-200 rounded-3xl p-6 md:p-12 text-emerald-900">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl md:text-3xl font-bold mb-2">Still need help?</h2>
                            <p className="text-emerald-900/70">Our team is ready to assist you</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-4xl mx-auto">
                            <div className="bg-white rounded-2xl p-4 md:p-6 text-center border border-emerald-100 shadow-sm">
                                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center mx-auto mb-3">
                                    <Icons.Mail />
                                </div>
                                <h3 className="font-semibold mb-1">Email Us</h3>
                                <p className="text-sm text-emerald-900/70">info@bulusanwildlife.com</p>
                            </div>

                            <div className="bg-white rounded-2xl p-4 md:p-6 text-center border border-emerald-100 shadow-sm">
                                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center mx-auto mb-3">
                                    <Icons.Phone />
                                </div>
                                <h3 className="font-semibold mb-1">Call Us</h3>
                                <p className="text-sm text-emerald-900/70">(043) 123-4567</p>
                            </div>

                            <div className="bg-white rounded-2xl p-4 md:p-6 text-center border border-emerald-100 shadow-sm">
                                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center mx-auto mb-3">
                                    <Icons.Clock />
                                </div>
                                <h3 className="font-semibold mb-1">Operating Hours</h3>
                                <p className="text-sm text-emerald-900/70">8:00 AM - 5:00 PM Daily</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Help;
