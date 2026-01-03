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
        { id: 'tickets', label: 'Tickets & Booking', icon: Icons.Ticket },
        { id: 'ai', label: 'AI Features', icon: Icons.Robot },
        { id: 'map', label: 'Zoo Map', icon: Icons.Map },
        { id: 'account', label: 'Account', icon: Icons.User }
    ];

    const faqs = [
        {
            category: 'tickets',
            question: 'How do I purchase tickets?',
            answer: 'To purchase tickets, navigate to the "Tickets" page from the main menu. Select the number of tickets for each category (Adult, Child, Senior, or Bulusan Resident), choose your preferred visit date and time, fill in guest information, and complete the payment process.'
        },
        {
            category: 'tickets',
            question: 'Can I cancel or reschedule my booking?',
            answer: 'Yes! You can cancel or reschedule your booking up to 24 hours before your scheduled visit for a full refund. Go to "My Tickets" to manage your bookings.'
        },
        {
            category: 'tickets',
            question: 'What are the ticket prices?',
            answer: 'Adult Pass (18-59): ₱40, Child Pass (4-17): ₱20, Senior Pass (60+): ₱30, Bulusan Resident: FREE with valid ID.'
        },
        {
            category: 'tickets',
            question: 'Is there a maximum number of tickets I can book?',
            answer: 'Yes, you can book a maximum of 10 tickets per transaction. For larger groups, please contact us directly.'
        },
        {
            category: 'ai',
            question: 'What is the AI Animal Scanner?',
            answer: 'The AI Animal Scanner uses advanced machine learning to identify animals from photos. Simply point your camera at an animal or upload a photo, and our AI will tell you what species it is along with interesting facts.'
        },
        {
            category: 'ai',
            question: 'How does the AI Assistant work?',
            answer: 'Our AI Assistant can answer questions about the zoo, animals, events, and help you plan your visit. Click the chat button to start a conversation!'
        },
        {
            category: 'ai',
            question: 'What is the AnimalDex?',
            answer: 'The AnimalDex is your personal collection of animals you\'ve discovered at the zoo. Use the AI Scanner to identify animals and add them to your AnimalDex. Try to collect them all!'
        },
        {
            category: 'map',
            question: 'How do I use the interactive zoo map?',
            answer: 'Go to the "Map" page to see an interactive layout of the zoo. You can click on different areas to learn about exhibits, find facilities like restrooms and food stalls, and get directions.'
        },
        {
            category: 'map',
            question: 'Are there accessibility features on the map?',
            answer: 'Yes! Our map shows wheelchair-accessible paths, accessible restrooms, and rest areas. Look for the accessibility icons on the map.'
        },
        {
            category: 'account',
            question: 'How do I create an account?',
            answer: 'Click on "Login" in the top navigation, then select "Sign Up". Fill in your details including name, email, and password. You\'ll receive a confirmation email to activate your account.'
        },
        {
            category: 'account',
            question: 'How do I reset my password?',
            answer: 'On the login page, click "Forgot Password" and enter your email address. We\'ll send you a link to reset your password.'
        },
        {
            category: 'account',
            question: 'How can I update my profile?',
            answer: 'Go to your Profile page by clicking on your avatar in the header. Click "Edit Profile" to update your personal information.'
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
        { label: 'Buy Tickets', path: '/tickets', icon: Icons.Ticket, color: 'bg-emerald-500' },
        { label: 'AI Scanner', path: '/classifier', icon: Icons.Camera, color: 'bg-purple-500' },
        { label: 'Zoo Map', path: '/map', icon: Icons.Map, color: 'bg-blue-500' },
        { label: 'My Profile', path: '/profile', icon: Icons.User, color: 'bg-teal-500' }
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Floating Navigation */}
            <div className="fixed top-4 left-4 right-4 z-50 flex justify-between items-center pointer-events-none">
                <button
                    onClick={() => navigate(-1)}
                    className="pointer-events-auto flex items-center gap-2 px-4 py-2.5 bg-white/90 backdrop-blur-sm text-gray-700 rounded-full shadow-lg hover:bg-white hover:shadow-xl transition-all duration-300 font-medium"
                >
                    <Icons.Back />
                    <span className="hidden sm:inline">Back</span>
                </button>
                <Link
                    to="/"
                    className="pointer-events-auto flex items-center gap-2 px-4 py-2.5 bg-white/90 backdrop-blur-sm text-gray-700 rounded-full shadow-lg hover:bg-white hover:shadow-xl transition-all duration-300 font-medium"
                >
                    <Icons.Home />
                    <span className="hidden sm:inline">Home</span>
                </Link>
            </div>

            {/* Hero Section */}
            <section className="relative text-white py-20 pt-24 text-center bg-cover bg-center" style={{ backgroundImage: 'linear-gradient(135deg, rgba(59,130,246,0.92), rgba(16,185,129,0.92)), url(https://images.unsplash.com/photo-1564349683136-77e08dba1ef7)' }}>
                <div className="relative z-10 container mx-auto px-4">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Help Center</h1>
                    <p className="text-lg max-w-xl mx-auto opacity-90 font-light mb-8">How can we help you today?</p>
                    
                    {/* Search Bar */}
                    <div className="max-w-xl mx-auto">
                        <div className="relative">
                            <Icons.Search />
                            <input
                                type="text"
                                placeholder="Search for help..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/20 backdrop-blur-sm text-white placeholder-white/70 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white/30 transition-all"
                            />
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70">
                                <Icons.Search />
                            </div>
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
                            className="bg-white rounded-2xl p-4 md:p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border border-gray-100 flex flex-col items-center text-center gap-2 md:gap-3"
                        >
                            <div className={`w-12 h-12 ${link.color} rounded-xl flex items-center justify-center text-white`}>
                                <link.icon />
                            </div>
                            <span className="font-medium text-gray-800 text-sm md:text-base">{link.label}</span>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-grow container mx-auto px-4 py-8 md:py-12">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Categories Sidebar */}
                    <div className="lg:w-64 flex-shrink-0">
                        <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100 sticky top-24">
                            <h3 className="font-semibold text-gray-800 mb-4 px-2">Categories</h3>
                            
                            {/* Mobile: Horizontal scroll */}
                            <div className="lg:hidden flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
                                {helpCategories.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setActiveCategory(cat.id)}
                                        className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                                            activeCategory === cat.id
                                                ? 'bg-emerald-500 text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                                            activeCategory === cat.id
                                                ? 'bg-emerald-50 text-emerald-700'
                                                : 'text-gray-600 hover:bg-gray-50'
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
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                            <div className="p-4 md:p-6 border-b border-gray-100">
                                <h2 className="text-xl font-bold text-gray-800">Frequently Asked Questions</h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    {filteredFaqs.length} {filteredFaqs.length === 1 ? 'result' : 'results'} found
                                </p>
                            </div>
                            
                            <div className="divide-y divide-gray-100">
                                {filteredFaqs.length > 0 ? (
                                    filteredFaqs.map((faq, index) => (
                                        <div key={index} className="p-4 md:p-6">
                                            <button
                                                onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                                                className="w-full flex items-start justify-between gap-4 text-left"
                                            >
                                                <div className="flex-grow">
                                                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium mb-2 ${
                                                        faq.category === 'tickets' ? 'bg-emerald-100 text-emerald-700' :
                                                        faq.category === 'ai' ? 'bg-purple-100 text-purple-700' :
                                                        faq.category === 'map' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-teal-100 text-teal-700'
                                                    }`}>
                                                        {faq.category === 'tickets' ? 'Tickets' :
                                                         faq.category === 'ai' ? 'AI Features' :
                                                         faq.category === 'map' ? 'Map' : 'Account'}
                                                    </span>
                                                    <h3 className="font-semibold text-gray-800">{faq.question}</h3>
                                                </div>
                                                <div className="text-gray-400 flex-shrink-0 mt-4">
                                                    {expandedFaq === index ? <Icons.ChevronUp /> : <Icons.ChevronDown />}
                                                </div>
                                            </button>
                                            {expandedFaq === index && (
                                                <div className="mt-4 pt-4 border-t border-gray-100">
                                                    <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-8 text-center">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Icons.Search />
                                        </div>
                                        <h3 className="font-semibold text-gray-800 mb-2">No results found</h3>
                                        <p className="text-sm text-gray-500">Try adjusting your search or filter</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contact Section */}
                <div className="mt-12">
                    <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 md:p-12 text-white">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl md:text-3xl font-bold mb-2">Still need help?</h2>
                            <p className="opacity-90">Our team is ready to assist you</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-4xl mx-auto">
                            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 md:p-6 text-center">
                                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                                    <Icons.Mail />
                                </div>
                                <h3 className="font-semibold mb-1">Email Us</h3>
                                <p className="text-sm opacity-90">info@bulusanwildlife.com</p>
                            </div>
                            
                            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 md:p-6 text-center">
                                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                                    <Icons.Phone />
                                </div>
                                <h3 className="font-semibold mb-1">Call Us</h3>
                                <p className="text-sm opacity-90">(043) 123-4567</p>
                            </div>
                            
                            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 md:p-6 text-center">
                                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                                    <Icons.Clock />
                                </div>
                                <h3 className="font-semibold mb-1">Operating Hours</h3>
                                <p className="text-sm opacity-90">8:00 AM - 5:00 PM Daily</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Help;
