import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { messageAPI } from '../../services/api-client';

const MailIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
    </svg>
);

const BackIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
);

const HomeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
);

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const ReplyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <polyline points="9 17 4 12 9 7" />
        <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
    </svg>
);

const UserMessages = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchMessages();
    }, []);

    const fetchMessages = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await messageAPI.getMyMessages();
            setMessages(response.messages || []);
        } catch (err) {
            console.error('Error fetching messages:', err);
            setError('Failed to load messages. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const filteredMessages = messages.filter(msg => {
        if (filter === 'all') return true;
        if (filter === 'replied') return msg.admin_response;
        if (filter === 'pending') return !msg.admin_response;
        return true;
    });

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) {
            return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        } else if (days === 1) {
            return 'Yesterday';
        } else if (days < 7) {
            return date.toLocaleDateString('en-US', { weekday: 'short' });
        }
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const openMessage = (message) => {
        setSelectedMessage(message);
        setShowModal(true);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <div className="fixed top-4 left-4 right-4 z-50 flex justify-between items-center pointer-events-none">
                <button
                    onClick={() => navigate(-1)}
                    className="pointer-events-auto flex items-center gap-2 px-4 py-2.5 bg-white/90 backdrop-blur-sm text-gray-700 rounded-full shadow-lg hover:bg-white hover:shadow-xl transition-all duration-300 font-medium"
                >
                    <BackIcon />
                    <span className="hidden sm:inline">Back</span>
                </button>
                <Link
                    to="/"
                    className="pointer-events-auto flex items-center gap-2 px-4 py-2.5 bg-white/90 backdrop-blur-sm text-gray-700 rounded-full shadow-lg hover:bg-white hover:shadow-xl transition-all duration-300 font-medium"
                >
                    <HomeIcon />
                    <span className="hidden sm:inline">Home</span>
                </Link>
            </div>

            <section className="relative text-white py-20 pt-24 text-center bg-cover bg-center" style={{ backgroundImage: 'linear-gradient(135deg, rgba(16,185,129,0.92), rgba(20,184,166,0.92)), url(https://images.unsplash.com/photo-1564349683136-77e08dba1ef7)' }}>
                <div className="relative z-10 container mx-auto px-4">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <MailIcon />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">My Messages</h1>
                    <p className="text-lg max-w-xl mx-auto opacity-90 font-light">View your support conversations and replies</p>
                </div>
            </section>

            <div className="max-w-4xl mx-auto px-4 py-8 flex-grow w-full">
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700">
                        {error}
                    </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <div className="flex flex-wrap gap-2">
                        {['all', 'replied', 'pending'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-5 py-2 rounded-full text-sm font-semibold capitalize transition-all ${
                                    filter === f
                                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                                        : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                                }`}
                            >
                                {f === 'all' ? 'All Messages' : f === 'replied' ? 'Replied' : 'Awaiting Reply'}
                            </button>
                        ))}
                    </div>
                    <Link
                        to="/help"
                        className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-full hover:shadow-lg transition-all"
                    >
                        Contact Support
                    </Link>
                </div>

                {filteredMessages.length > 0 ? (
                    <div className="space-y-4">
                        {filteredMessages.map(message => (
                            <div
                                key={message.id}
                                onClick={() => openMessage(message)}
                                className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden"
                            >
                                <div className="p-5">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-gray-800 text-lg truncate">
                                                {message.subject}
                                            </h3>
                                            <p className="text-sm text-gray-500 mt-1">
                                                {formatDate(message.created_at)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 ml-4">
                                            {message.admin_response ? (
                                                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full flex items-center gap-1">
                                                    <ReplyIcon />
                                                    Replied
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                                                    Pending
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-gray-600 text-sm line-clamp-2">
                                        {message.content}
                                    </p>
                                    {message.admin_response && (
                                        <div className="mt-3 pt-3 border-t border-gray-100">
                                            <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium mb-1">
                                                <ReplyIcon />
                                                <span>Admin Response</span>
                                            </div>
                                            <p className="text-gray-600 text-sm line-clamp-2">
                                                {message.admin_response}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <MailIcon />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">No messages found</h3>
                        <p className="text-gray-500 mb-6">
                            {filter === 'all'
                                ? "You haven't sent any messages yet"
                                : filter === 'replied'
                                    ? "No replied messages"
                                    : "No pending messages"}
                        </p>
                        <Link
                            to="/help"
                            className="inline-block px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium rounded-xl hover:shadow-lg transition"
                        >
                            Contact Support
                        </Link>
                    </div>
                )}
            </div>

            {showModal && selectedMessage && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-gray-800 truncate pr-4">
                                {selectedMessage.subject}
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition flex-shrink-0"
                            >
                                <CloseIcon />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1">
                            <div className="space-y-6">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-gray-500">Your Message</span>
                                        <span className="text-xs text-gray-400">
                                            {new Date(selectedMessage.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <p className="text-gray-700 whitespace-pre-wrap">{selectedMessage.content}</p>
                                    </div>
                                </div>

                                {selectedMessage.admin_response ? (
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-emerald-600 flex items-center gap-2">
                                                <ReplyIcon />
                                                Admin Response
                                            </span>
                                            {selectedMessage.responded_at && (
                                                <span className="text-xs text-gray-400">
                                                    {new Date(selectedMessage.responded_at).toLocaleString()}
                                                </span>
                                            )}
                                        </div>
                                        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                                            <p className="text-gray-700 whitespace-pre-wrap">{selectedMessage.admin_response}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200 text-center">
                                        <p className="text-yellow-700 font-medium">Awaiting response from support team</p>
                                        <p className="text-yellow-600 text-sm mt-1">We'll get back to you as soon as possible</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100">
                            <button
                                onClick={() => setShowModal(false)}
                                className="w-full py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserMessages;
