import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const TicketIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 text-green-600">
        <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
        <path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/>
    </svg>
);

const ClipboardIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 text-blue-600">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
    </svg>
);

const AnimalIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 text-yellow-600">
        <circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/>
        <path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/>
    </svg>
);

const AIIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 text-purple-600">
        <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
        <path d="M9 14v2"/><path d="M15 14v2"/>
    </svg>
);

const CalendarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 text-red-600">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
);

const BookIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 text-teal-600">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
);

const PandaIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-green-600">
        <circle cx="12" cy="12" r="10"/>
        <circle cx="9" cy="10" r="2"/><circle cx="15" cy="10" r="2"/>
        <path d="M9 16s1.5 2 3 2 3-2 3-2"/>
    </svg>
);

const StarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-yellow-600">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
);

const UserHome = () => {
    const { user } = useAuth();

    const getUserDisplayName = () => {
        if (!user) return 'Guest';
        if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
        if (user.firstName) return user.firstName;
        if (user.username) return user.username;
        return 'Guest';
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <section className="bg-gradient-to-r from-green-600 to-teal-500 text-white py-16 px-4">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold mb-2">
                        Welcome back, {getUserDisplayName()}!
                    </h1>
                    <p className="opacity-90">Ready to explore the wonders of wildlife?</p>
                </div>
            </section>

            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <Link to="/tickets" className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-lg transition group">
                        <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
                            <TicketIcon />
                        </div>
                        <h3 className="font-bold text-gray-800 mb-1">Buy Tickets</h3>
                        <p className="text-sm text-gray-500">Book your zoo adventure today</p>
                    </Link>

                    <Link to="/my-tickets" className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-lg transition group">
                        <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
                            <ClipboardIcon />
                        </div>
                        <h3 className="font-bold text-gray-800 mb-1">My Tickets</h3>
                        <p className="text-sm text-gray-500">View your ticket history</p>
                    </Link>

                    <Link to="/animals" className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-lg transition group">
                        <div className="w-14 h-14 bg-yellow-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
                            <AnimalIcon />
                        </div>
                        <h3 className="font-bold text-gray-800 mb-1">Our Animals</h3>
                        <p className="text-sm text-gray-500">Discover our wildlife collection</p>
                    </Link>

                    <Link to="/animal-classifier" className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-lg transition group">
                        <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
                            <AIIcon />
                        </div>
                        <h3 className="font-bold text-gray-800 mb-1">AI Scanner</h3>
                        <p className="text-sm text-gray-500">Identify animals with AI</p>
                    </Link>

                    <Link to="/events" className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-lg transition group">
                        <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
                            <CalendarIcon />
                        </div>
                        <h3 className="font-bold text-gray-800 mb-1">Events</h3>
                        <p className="text-sm text-gray-500">See upcoming activities</p>
                    </Link>

                    <Link to="/animaldex" className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-lg transition group">
                        <div className="w-14 h-14 bg-teal-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
                            <BookIcon />
                        </div>
                        <h3 className="font-bold text-gray-800 mb-1">AnimalDex</h3>
                        <p className="text-sm text-gray-500">Your wildlife encyclopedia</p>
                    </Link>
                </div>

                <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <StarIcon /> What's New
                    </h2>
                    <div className="space-y-4">
                        <div className="flex gap-4 p-4 bg-green-50 rounded-xl">
                            <div className="flex-shrink-0"><PandaIcon /></div>
                            <div>
                                <h4 className="font-semibold text-gray-800">New Panda Exhibit</h4>
                                <p className="text-sm text-gray-600">Visit our newly opened panda enclosure with two adorable giant pandas!</p>
                            </div>
                        </div>
                        <div className="flex gap-4 p-4 bg-blue-50 rounded-xl">
                            <div className="flex-shrink-0 text-blue-600"><TicketIcon /></div>
                            <div>
                                <h4 className="font-semibold text-gray-800">Online Booking Now Available</h4>
                                <p className="text-sm text-gray-600">Skip the queue! Book your tickets online and get instant QR codes.</p>
                            </div>
                        </div>
                        <div className="flex gap-4 p-4 bg-yellow-50 rounded-xl">
                            <div className="flex-shrink-0 text-yellow-600"><AIIcon /></div>
                            <div>
                                <h4 className="font-semibold text-gray-800">AI Animal Scanner</h4>
                                <p className="text-sm text-gray-600">Try our new AI-powered animal identification feature during your visit!</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-r from-green-600 to-teal-500 rounded-2xl p-8 text-white text-center">
                    <h2 className="text-2xl font-bold mb-2">Plan Your Visit Today!</h2>
                    <p className="opacity-90 mb-6">Experience the wonder of wildlife at Bulusan Zoo</p>
                    <Link
                        to="/tickets"
                        className="inline-block px-8 py-3 bg-white text-green-700 font-bold rounded-xl hover:bg-gray-100 transition"
                    >
                        Get Tickets Now
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default UserHome;
