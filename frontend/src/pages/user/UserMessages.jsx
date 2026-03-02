import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { messageAPI } from '../../services/api-client';
import { ReactLenis } from 'lenis/react';

const MailIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
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

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <line x1="22" y1="2" x2="11" y2="13" />
        <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
);

const UserMessages = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [showDetail, setShowDetail] = useState(false);
    const [filter, setFilter] = useState('all');
    
    // New message modal state
    const [showNewMessageModal, setShowNewMessageModal] = useState(false);
    const [newMessage, setNewMessage] = useState({ subject: '', content: '' });
    const [sending, setSending] = useState(false);
    const [sendSuccess, setSendSuccess] = useState(false);

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
            setError('Failed to load messages.');
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.subject.trim() || !newMessage.content.trim()) return;
        
        setSending(true);
        try {
            const response = await messageAPI.sendMessage({
                subject: newMessage.subject.trim(),
                content: newMessage.content.trim()
            });
            if (response.success) {
                setSendSuccess(true);
                setTimeout(() => {
                    setShowNewMessageModal(false);
                    setNewMessage({ subject: '', content: '' });
                    setSendSuccess(false);
                    fetchMessages();
                }, 1500);
            }
        } catch (err) {
            console.error('Error sending message:', err);
            setError('Failed to send message. Please try again.');
        } finally {
            setSending(false);
        }
    };

    const closeNewMessageModal = () => {
        setShowNewMessageModal(false);
        setNewMessage({ subject: '', content: '' });
        setSendSuccess(false);
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
        if (days === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        if (days === 1) return 'Yesterday';
        if (days < 7) return date.toLocaleDateString([], { weekday: 'short' });
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    const openMessage = (message) => {
        setSelectedMessage(message);
        setShowDetail(true);
    };

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                    <p className="text-gray-400 font-medium animate-pulse">Loading inbox...</p>
                </div>
            </div>
        );
    }

    return (
        <ReactLenis root>
            <div className="flex h-screen w-full overflow-hidden bg-white">
                <div className={`h-full flex flex-col relative border-r border-gray-100 shadow-xl overflow-hidden bg-slate-50/30 transition-all duration-500 ${showDetail ? 'hidden md:flex md:w-1/2' : 'w-full'}`}>
                    <header className="flex-shrink-0 px-6 lg:px-8 py-4 lg:py-6 flex items-center justify-between bg-white border-b border-gray-100 z-20">
                        <div className="flex items-center gap-3 lg:gap-4">
                            <button
                                onClick={() => navigate(-1)}
                                className="p-2 lg:p-2.5 rounded-xl bg-gray-50 text-gray-500 hover:bg-emerald-50 hover:text-emerald-600 transition-all duration-300"
                            >
                                <BackIcon />
                            </button>
                            <div>
                                <h2 className="text-xl lg:text-2xl font-bold text-gray-900">My Messages</h2>
                                <p className="text-[10px] lg:text-xs text-gray-400 font-medium uppercase tracking-widest">{messages.length} Threads</p>
                            </div>
                        </div>
                        <Link
                            to="/"
                            className="p-2 lg:p-2.5 rounded-xl bg-gray-50 text-gray-500 hover:bg-emerald-50 hover:text-emerald-600 transition-all duration-300"
                        >
                            <HomeIcon />
                        </Link>
                    </header>

                    <div className="flex-shrink-0 px-4 lg:px-8 py-3 lg:py-4 bg-white/50 backdrop-blur-sm border-b border-gray-100 flex items-center justify-between gap-2 lg:gap-4 overflow-x-auto no-scrollbar">
                        <div className="flex p-1 bg-gray-100 rounded-xl">
                            {['all', 'replied', 'pending'].map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-3 lg:px-5 py-1.5 lg:py-2 rounded-lg text-[10px] lg:text-xs font-bold transition-all duration-300 ${filter === f
                                            ? 'bg-white text-emerald-600 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-900'
                                        }`}
                                >
                                    {f.toUpperCase()}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setShowNewMessageModal(true)}
                            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] lg:text-xs font-bold py-2 lg:py-2.5 px-4 lg:px-6 rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95 whitespace-nowrap"
                        >
                            <PlusIcon />
                            NEW
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-3 lg:py-4 space-y-2 lg:space-y-3">
                        {error && (
                            <div className="p-3 lg:p-4 bg-red-50 text-red-600 text-sm rounded-2xl border border-red-100 animate-pulse">
                                {error}
                            </div>
                        )}

                        {filteredMessages.length > 0 ? (
                            filteredMessages.map(message => (
                                <div
                                    key={message.id}
                                    onClick={() => openMessage(message)}
                                    className={`group relative p-4 lg:p-6 cursor-pointer transition-all duration-300 rounded-2xl lg:rounded-3xl border ${selectedMessage?.id === message.id
                                            ? 'bg-white border-emerald-200 shadow-xl shadow-emerald-500/5 ring-1 ring-emerald-500/10'
                                            : 'bg-white/60 border-transparent hover:bg-white hover:border-gray-200 hover:shadow-lg'
                                        }`}
                                >
                                    <div className="flex gap-3 lg:gap-5">
                                        <div className={`w-10 h-10 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl flex-shrink-0 flex items-center justify-center transition-all duration-500 group-hover:rotate-6 ${message.admin_response ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                            }`}>
                                            <MailIcon />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <h3 className="font-bold text-gray-900 text-sm lg:text-lg truncate group-hover:text-emerald-700 transition-colors">
                                                    {message.subject}
                                                </h3>
                                                <span className="text-[9px] lg:text-[10px] font-bold text-gray-400 uppercase tracking-tighter bg-gray-50 px-1.5 lg:px-2 py-0.5 lg:py-1 rounded-md ml-2">
                                                    {formatDate(message.created_at)}
                                                </span>
                                            </div>
                                            <p className="text-xs lg:text-sm text-gray-500 line-clamp-1 mb-2 lg:mb-3 font-light leading-relaxed">
                                                {message.content}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                {message.admin_response ? (
                                                    <span className="inline-flex items-center gap-1 lg:gap-1.5 px-2 lg:px-3 py-0.5 lg:py-1 rounded-full bg-emerald-50 text-emerald-700 text-[9px] lg:text-[10px] font-black uppercase tracking-widest">
                                                        <span className="w-1 h-1 lg:w-1.5 lg:h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                                        Replied
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 lg:gap-1.5 px-2 lg:px-3 py-0.5 lg:py-1 rounded-full bg-amber-50 text-amber-700 text-[9px] lg:text-[10px] font-black uppercase tracking-widest">
                                                        <span className="w-1 h-1 lg:w-1.5 lg:h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                                        Pending
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 lg:py-20 text-center">
                                <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 lg:mb-6 text-gray-200 border-2 border-dashed border-gray-100">
                                    <MailIcon />
                                </div>
                                <h4 className="text-gray-900 font-bold text-lg mb-1">No Messages Yet</h4>
                                <p className="text-gray-400 text-sm max-w-xs">This folder is currently empty. Need help? Create a new ticket.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side - Message Detail Panel (~50% width) */}
                {showDetail && selectedMessage && (
                    <div className="w-full md:w-1/2 h-full flex flex-col border-l border-gray-100 bg-white shadow-2xl animate-in slide-in-from-right duration-300">
                        <header className="flex-shrink-0 px-6 lg:px-8 py-4 lg:py-6 border-b border-gray-100 flex items-center gap-4 lg:gap-6 bg-white/80 backdrop-blur-md">
                            <button
                                onClick={() => setShowDetail(false)}
                                className="p-2.5 lg:p-3 rounded-xl lg:rounded-2xl bg-gray-50 text-gray-500 hover:bg-emerald-600 hover:text-white transition-all duration-300 shadow-sm"
                            >
                                <CloseIcon />
                            </button>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg lg:text-xl font-bold text-gray-900 truncate tracking-tight">{selectedMessage.subject}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[9px] lg:text-[10px] font-black text-emerald-600 uppercase">Case #{selectedMessage.id?.toString().slice(-6)}</span>
                                    <span className="text-gray-300">•</span>
                                    <span className="text-[9px] lg:text-[10px] font-bold text-gray-400 uppercase tracking-wider">{new Date(selectedMessage.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </header>

                        <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6 lg:space-y-10">
                            {/* User message */}
                            <div className="flex flex-col items-end">
                                <div className="max-w-[85%] lg:max-w-[80%] bg-white border border-gray-100 p-4 lg:p-6 rounded-2xl lg:rounded-3xl rounded-tr-none shadow-xl shadow-gray-200/50">
                                    <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap font-medium">
                                        {selectedMessage.content}
                                    </p>
                                </div>
                                <span className="text-[9px] lg:text-[10px] font-black text-gray-300 mt-2 lg:mt-3 uppercase tracking-widest">Sent By You</span>
                            </div>

                            {/* Admin response or waiting state */}
                            {selectedMessage.admin_response ? (
                                <div className="flex flex-col items-start animate-in fade-in slide-in-from-bottom-4 duration-700">
                                    <div className="flex items-center gap-3 mb-3 lg:mb-4">
                                        <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl lg:rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                            <ReplyIcon />
                                        </div>
                                        <div>
                                            <p className="text-[10px] lg:text-xs font-black text-gray-900 uppercase">Official Support</p>
                                            <p className="text-[9px] lg:text-[10px] font-bold text-gray-400 uppercase">Verified Agent</p>
                                        </div>
                                    </div>
                                    <div className="max-w-[85%] lg:max-w-[80%] bg-emerald-50/50 border border-emerald-100 p-4 lg:p-6 rounded-2xl lg:rounded-3xl rounded-tl-none">
                                        <p className="text-sm leading-relaxed text-emerald-900 whitespace-pre-wrap">
                                            {selectedMessage.admin_response}
                                        </p>
                                    </div>
                                    {selectedMessage.responded_at && (
                                        <span className="text-[9px] lg:text-[10px] font-black text-emerald-600/40 mt-2 lg:mt-3 uppercase tracking-widest">
                                            Responded {formatDate(selectedMessage.responded_at)}
                                        </span>
                                    )}
                                </div>
                            ) : (
                                <div className="bg-slate-50 border border-slate-100 p-6 lg:p-8 rounded-2xl lg:rounded-3xl text-center border-dashed">
                                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 lg:mb-4 shadow-sm">
                                        <div className="w-2 h-2 bg-amber-500 rounded-full animate-ping"></div>
                                    </div>
                                    <p className="text-[10px] lg:text-xs font-black text-slate-800 uppercase tracking-widest mb-1">Awaiting Agent Assignment</p>
                                    <p className="text-[9px] lg:text-[10px] text-slate-500 font-medium">We'll notify you as soon as a response is posted.</p>
                                </div>
                            )}
                        </div>

                        <div className="flex-shrink-0 p-4 lg:p-6 border-t border-gray-100 bg-white">
                            <button
                                onClick={() => setShowDetail(false)}
                                className="w-full py-3 lg:py-4 bg-gray-900 text-white text-[10px] lg:text-xs font-black uppercase tracking-[0.15em] lg:tracking-[0.2em] rounded-xl lg:rounded-2xl hover:bg-emerald-600 transition-all duration-500 shadow-xl shadow-gray-900/10 active:scale-[0.98]"
                            >
                                Close Conversation
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* New Message Modal */}
            {showNewMessageModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl lg:rounded-3xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 fade-in duration-300">
                        {sendSuccess ? (
                            <div className="p-8 text-center">
                                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Message Sent!</h3>
                                <p className="text-gray-500 text-sm">Your message has been submitted. We'll respond shortly.</p>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between p-5 lg:p-6 border-b border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                                            <MailIcon />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900">New Message</h3>
                                            <p className="text-xs text-gray-400">Send a message to support</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={closeNewMessageModal}
                                        className="p-2 rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                                    >
                                        <CloseIcon />
                                    </button>
                                </div>

                                <form onSubmit={handleSendMessage} className="p-5 lg:p-6 space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
                                        <input
                                            type="text"
                                            value={newMessage.subject}
                                            onChange={(e) => setNewMessage(prev => ({ ...prev, subject: e.target.value }))}
                                            placeholder="What is this about?"
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
                                        <textarea
                                            value={newMessage.content}
                                            onChange={(e) => setNewMessage(prev => ({ ...prev, content: e.target.value }))}
                                            placeholder="Describe your issue or question in detail..."
                                            rows={5}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm resize-none"
                                            required
                                        />
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={closeNewMessageModal}
                                            className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={sending || !newMessage.subject.trim() || !newMessage.content.trim()}
                                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <SendIcon />
                                            {sending ? 'Sending...' : 'Send Message'}
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}
        </ReactLenis>
    );
};

export default UserMessages;