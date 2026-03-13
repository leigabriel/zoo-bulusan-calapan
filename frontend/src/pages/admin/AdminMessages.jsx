import { useEffect, useState } from 'react';
import { messageAPI, getProfileImageUrl } from '../../services/api-client';
import { notify } from '../../utils/toast';

// Icons
const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
    </svg>
);

const MailIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
    </svg>
);

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
);

const ReplyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <polyline points="9 17 4 12 9 7" />
        <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
    </svg>
);

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const AlertIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
);

const AdminMessages = ({ globalSearch = '' }) => {
    const [messages, setMessages] = useState([]);
    const [appeals, setAppeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('messages');
    const [typeFilter, setTypeFilter] = useState('all');
    
    // View message modal
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);
    
    // Reply modal
    const [showReplyModal, setShowReplyModal] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [replying, setReplying] = useState(false);

    const effectiveSearch = globalSearch || searchQuery;

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            if (activeTab === 'messages') {
                const response = await messageAPI.getAllMessages();
                setMessages(response.data?.messages || response.messages || []);
            } else {
                const response = await messageAPI.getAppeals();
                setAppeals(response.data?.appeals || response.appeals || []);
            }
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Failed to load data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (messageId) => {
        try {
            await messageAPI.markAsRead(messageId);
            if (activeTab === 'messages') {
                setMessages(messages.map(m => m.id === messageId ? { ...m, is_read: true } : m));
            } else {
                setAppeals(appeals.map(a => a.id === messageId ? { ...a, is_read: true } : a));
            }
            if (selectedMessage?.id === messageId) {
                setSelectedMessage({ ...selectedMessage, is_read: true });
            }
        } catch (err) {
            console.error('Error marking as read:', err);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await messageAPI.markAllAsRead();
            if (activeTab === 'messages') {
                setMessages(messages.map(m => ({ ...m, is_read: true })));
            } else {
                setAppeals(appeals.map(a => ({ ...a, is_read: true })));
            }
        } catch (err) {
            console.error('Error marking all as read:', err);
        }
    };

    const handleReply = async () => {
        if (!replyContent.trim() || !selectedMessage) return;
        setReplying(true);
        try {
            await messageAPI.respondToMessage(selectedMessage.id, replyContent);
            if (activeTab === 'messages') {
                setMessages(messages.map(m => m.id === selectedMessage.id ? { ...m, admin_response: replyContent, is_read: true } : m));
            } else {
                setAppeals(appeals.map(a => a.id === selectedMessage.id ? { ...a, admin_response: replyContent, is_read: true } : a));
            }
            setShowReplyModal(false);
            setReplyContent('');
            setShowViewModal(false);
            notify.success('Reply sent successfully.');
        } catch (err) {
            console.error('Error sending reply:', err);
            notify.error('We could not send your reply. Please try again.');
        } finally {
            setReplying(false);
        }
    };

    const handleDelete = async (messageId) => {
        if (!window.confirm('Are you sure you want to delete this message?')) return;
        try {
            await messageAPI.deleteMessage(messageId);
            if (activeTab === 'messages') {
                setMessages(messages.filter(m => m.id !== messageId));
            } else {
                setAppeals(appeals.filter(a => a.id !== messageId));
            }
            if (selectedMessage?.id === messageId) {
                setShowViewModal(false);
                setSelectedMessage(null);
            }
        } catch (err) {
            console.error('Error deleting message:', err);
        }
    };

    const openMessage = (message) => {
        setSelectedMessage(message);
        setShowViewModal(true);
        if (!message.is_read) {
            handleMarkAsRead(message.id);
        }
    };

    const getFilteredData = () => {
        const data = activeTab === 'messages' ? messages : appeals;
        return data.filter(item => {
            const matchesSearch = effectiveSearch === '' ||
                item.subject?.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
                item.content?.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
                item.sender_name?.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
                item.sender_email?.toLowerCase().includes(effectiveSearch.toLowerCase());
            
            const matchesType = typeFilter === 'all' || 
                (typeFilter === 'unread' && !item.is_read) ||
                (typeFilter === 'read' && item.is_read) ||
                (typeFilter === 'replied' && item.admin_response);
            
            return matchesSearch && matchesType;
        });
    };

    const unreadCount = (activeTab === 'messages' ? messages : appeals).filter(m => !m.is_read).length;

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
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-4 border-[#2a2a2a]"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#8cff65] animate-spin"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#8cff65]/10 rounded-xl flex items-center justify-center text-[#8cff65]">
                        <MailIcon />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Messages</h1>
                        <p className="text-sm text-gray-500">View and respond to user messages</p>
                    </div>
                </div>
                
                {unreadCount > 0 && (
                    <button
                        onClick={handleMarkAllAsRead}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#8cff65] text-[#0a0a0a] font-semibold rounded-xl hover:bg-[#9dff7a] transition-all shadow-lg shadow-[#8cff65]/20"
                    >
                        <CheckIcon />
                        <span>Mark All as Read ({unreadCount})</span>
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
                <button
                    onClick={() => setActiveTab('messages')}
                    className={`px-4 py-2.5 rounded-xl font-medium transition-all ${
                        activeTab === 'messages'
                            ? 'bg-[#8cff65] text-[#0a0a0a]'
                            : 'bg-[#1e1e1e] text-gray-400 hover:bg-[#2a2a2a] hover:text-white'
                    }`}
                >
                    Messages
                    {messages.filter(m => !m.is_read).length > 0 && (
                        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                            activeTab === 'messages' ? 'bg-black/20' : 'bg-[#8cff65]/20 text-[#8cff65]'
                        }`}>
                            {messages.filter(m => !m.is_read).length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('appeals')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
                        activeTab === 'appeals'
                            ? 'bg-orange-500 text-white'
                            : 'bg-[#1e1e1e] text-gray-400 hover:bg-[#2a2a2a] hover:text-white'
                    }`}
                >
                    <AlertIcon />
                    Appeals
                    {appeals.filter(a => !a.is_read).length > 0 && (
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                            activeTab === 'appeals' ? 'bg-white/20' : 'bg-orange-500/20 text-orange-400'
                        }`}>
                            {appeals.filter(a => !a.is_read).length}
                        </span>
                    )}
                </button>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500">
                        <SearchIcon />
                    </div>
                    <input
                        type="text"
                        placeholder="Search messages..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#8cff65] focus:ring-1 focus:ring-[#8cff65]/20 transition-all"
                    />
                </div>
                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-4 py-3 bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl text-white focus:outline-none focus:border-[#8cff65] cursor-pointer"
                >
                    <option value="all">All Messages</option>
                    <option value="unread">Unread</option>
                    <option value="read">Read</option>
                    <option value="replied">Replied</option>
                </select>
            </div>

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
                    {error}
                </div>
            )}

            {/* Messages List */}
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl overflow-hidden">
                {getFilteredData().length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-[#1e1e1e] rounded-full flex items-center justify-center mx-auto mb-4 text-gray-600">
                            <MailIcon />
                        </div>
                        <p className="text-lg font-medium text-gray-400">No {activeTab} found</p>
                        <p className="text-sm text-gray-600 mt-1">When users send messages, they will appear here.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-[#2a2a2a]">
                        {getFilteredData().map((message) => (
                            <div
                                key={message.id}
                                className={`p-4 hover:bg-[#1e1e1e] cursor-pointer transition-all ${
                                    !message.is_read ? 'bg-[#8cff65]/5 border-l-2 border-[#8cff65]' : ''
                                }`}
                                onClick={() => openMessage(message)}
                            >
                                <div className="flex items-start gap-4">
                                    <img
                                        src={getProfileImageUrl(message.sender_profile_image) || '/profile-img/default-avatar.svg'}
                                        alt={message.sender_name}
                                        className="w-10 h-10 rounded-full object-cover border border-[#2a2a2a]"
                                        onError={(e) => { e.target.onerror = null; e.target.src = '/profile-img/default-avatar.svg'; }}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className={`font-medium ${!message.is_read ? 'text-white' : 'text-gray-300'}`}>
                                                    {message.sender_name || 'Unknown User'}
                                                </span>
                                                {!message.is_read && (
                                                    <span className="px-2 py-0.5 bg-[#8cff65]/20 text-[#8cff65] rounded-full text-xs font-medium">
                                                        New
                                                    </span>
                                                )}
                                                {activeTab === 'appeals' && (
                                                    <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded-full text-xs font-medium">
                                                        Appeal
                                                    </span>
                                                )}
                                                {message.admin_response && (
                                                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium">
                                                        Replied
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-sm text-gray-500 whitespace-nowrap">
                                                {formatDate(message.created_at)}
                                            </span>
                                        </div>
                                        <p className={`text-sm mt-1 ${!message.is_read ? 'font-medium text-gray-200' : 'text-gray-400'}`}>
                                            {message.subject}
                                        </p>
                                        <p className="text-sm text-gray-600 truncate mt-1">
                                            {message.content}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* View Message Modal */}
            {showViewModal && selectedMessage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between p-5 border-b border-[#2a2a2a]">
                            <div className="flex items-center gap-3">
                                <img
                                    src={getProfileImageUrl(selectedMessage.sender_profile_image) || '/profile-img/default-avatar.svg'}
                                    alt={selectedMessage.sender_name}
                                    className="w-10 h-10 rounded-full object-cover border border-[#2a2a2a]"
                                    onError={(e) => { e.target.onerror = null; e.target.src = '/profile-img/default-avatar.svg'; }}
                                />
                                <div>
                                    <h2 className="text-lg font-bold text-white">{selectedMessage.sender_name}</h2>
                                    <p className="text-sm text-gray-500">{selectedMessage.sender_email}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowViewModal(false)}
                                className="p-2 text-gray-500 hover:text-white hover:bg-[#2a2a2a] rounded-lg transition"
                            >
                                <CloseIcon />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-5">
                            <div className="flex items-center gap-2 mb-4">
                                {activeTab === 'appeals' && (
                                    <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded-lg text-xs font-medium">
                                        Suspension Appeal
                                    </span>
                                )}
                                <span className="text-sm text-gray-500">
                                    {new Date(selectedMessage.created_at).toLocaleString()}
                                </span>
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-4">{selectedMessage.subject}</h3>
                            <div className="prose prose-invert prose-sm max-w-none">
                                <p className="text-gray-300 whitespace-pre-wrap">{selectedMessage.content}</p>
                            </div>
                            
                            {selectedMessage.admin_response && (
                                <div className="mt-6 p-4 bg-[#8cff65]/10 border border-[#8cff65]/30 rounded-xl">
                                    <p className="text-sm font-medium text-[#8cff65] mb-2">Your Response:</p>
                                    <p className="text-gray-300 whitespace-pre-wrap">{selectedMessage.admin_response}</p>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center justify-between p-5 border-t border-[#2a2a2a]">
                            <button
                                onClick={() => handleDelete(selectedMessage.id)}
                                className="flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                            >
                                <TrashIcon />
                                <span>Delete</span>
                            </button>
                            <button
                                onClick={() => {
                                    setShowReplyModal(true);
                                    setReplyContent(selectedMessage.admin_response || '');
                                }}
                                className="flex items-center gap-2 px-4 py-2.5 bg-[#8cff65] text-[#0a0a0a] font-semibold rounded-xl hover:bg-[#9dff7a] transition-all"
                            >
                                <ReplyIcon />
                                <span>{selectedMessage.admin_response ? 'Edit Reply' : 'Reply'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reply Modal */}
            {showReplyModal && selectedMessage && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl shadow-2xl w-full max-w-lg">
                        <div className="flex items-center justify-between p-5 border-b border-[#2a2a2a]">
                            <h2 className="text-lg font-bold text-white">Reply to {selectedMessage.sender_name}</h2>
                            <button
                                onClick={() => setShowReplyModal(false)}
                                className="p-2 text-gray-500 hover:text-white hover:bg-[#2a2a2a] rounded-lg transition"
                            >
                                <CloseIcon />
                            </button>
                        </div>
                        <div className="p-5">
                            <p className="text-sm text-gray-500 mb-4">
                                Replying to: <span className="text-gray-300 font-medium">{selectedMessage.subject}</span>
                            </p>
                            <textarea
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                placeholder="Type your response..."
                                rows={6}
                                className="w-full px-4 py-3 bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#8cff65] focus:ring-1 focus:ring-[#8cff65]/20 resize-none transition-all"
                            />
                        </div>
                        <div className="flex justify-end gap-3 p-5 border-t border-[#2a2a2a]">
                            <button
                                onClick={() => setShowReplyModal(false)}
                                className="px-4 py-2 text-gray-400 hover:text-white hover:bg-[#2a2a2a] rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReply}
                                disabled={replying || !replyContent.trim()}
                                className="flex items-center gap-2 px-4 py-2.5 bg-[#8cff65] text-[#0a0a0a] font-semibold rounded-xl hover:bg-[#9dff7a] transition-all disabled:bg-gray-600 disabled:cursor-not-allowed"
                            >
                                {replying ? (
                                    <>
                                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        <span>Sending...</span>
                                    </>
                                ) : (
                                    <>
                                        <ReplyIcon />
                                        <span>Send Reply</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default AdminMessages;
