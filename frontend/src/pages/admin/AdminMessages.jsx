import { useEffect, useState } from 'react';
import { messageAPI, getProfileImageUrl } from '../../services/api-client';

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
    const [activeTab, setActiveTab] = useState('messages'); // 'messages' or 'appeals'
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
        } catch (err) {
            console.error('Error sending reply:', err);
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
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-xl">
                        <MailIcon />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
                        <p className="text-sm text-gray-500">View and respond to user messages</p>
                    </div>
                </div>
                
                {unreadCount > 0 && (
                    <button
                        onClick={handleMarkAllAsRead}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                        <CheckIcon />
                        <span>Mark All as Read ({unreadCount})</span>
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setActiveTab('messages')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        activeTab === 'messages'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                    Messages
                    {messages.filter(m => !m.is_read).length > 0 && (
                        <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                            {messages.filter(m => !m.is_read).length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('appeals')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                        activeTab === 'appeals'
                            ? 'bg-orange-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                    <AlertIcon />
                    Appeals
                    {appeals.filter(a => !a.is_read).length > 0 && (
                        <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                            {appeals.filter(a => !a.is_read).length}
                        </span>
                    )}
                </button>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <SearchIcon />
                    </div>
                    <input
                        type="text"
                        placeholder="Search messages..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                </div>
                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                >
                    <option value="all">All Messages</option>
                    <option value="unread">Unread</option>
                    <option value="read">Read</option>
                    <option value="replied">Replied</option>
                </select>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                    {error}
                </div>
            )}

            {/* Messages List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {getFilteredData().length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <MailIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">No {activeTab} found</p>
                        <p className="text-sm">When users send messages, they will appear here.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {getFilteredData().map((message) => (
                            <div
                                key={message.id}
                                className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                                    !message.is_read ? 'bg-blue-50/50' : ''
                                }`}
                                onClick={() => openMessage(message)}
                            >
                                <div className="flex items-start gap-4">
                                    <img
                                        src={getProfileImageUrl(message.sender_profile_image) || '/profile-img/default-avatar.svg'}
                                        alt={message.sender_name}
                                        className="w-10 h-10 rounded-full object-cover"
                                        onError={(e) => { e.target.onerror = null; e.target.src = '/profile-img/default-avatar.svg'; }}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <span className={`font-medium ${!message.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                                                    {message.sender_name || 'Unknown User'}
                                                </span>
                                                {!message.is_read && (
                                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                                        New
                                                    </span>
                                                )}
                                                {activeTab === 'appeals' && (
                                                    <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                                                        Appeal
                                                    </span>
                                                )}
                                                {message.admin_response && (
                                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                                        Replied
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-sm text-gray-500 whitespace-nowrap">
                                                {formatDate(message.created_at)}
                                            </span>
                                        </div>
                                        <p className={`text-sm ${!message.is_read ? 'font-medium text-gray-800' : 'text-gray-600'}`}>
                                            {message.subject}
                                        </p>
                                        <p className="text-sm text-gray-500 truncate mt-1">
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
                            <div className="flex items-center gap-3">
                                <img
                                    src={getProfileImageUrl(selectedMessage.sender_profile_image) || '/profile-img/default-avatar.svg'}
                                    alt={selectedMessage.sender_name}
                                    className="w-10 h-10 rounded-full object-cover"
                                    onError={(e) => { e.target.onerror = null; e.target.src = '/profile-img/default-avatar.svg'; }}
                                />
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">{selectedMessage.sender_name}</h2>
                                    <p className="text-sm text-gray-500">{selectedMessage.sender_email}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowViewModal(false)}
                                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                            >
                                <CloseIcon />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                            <div className="flex items-center gap-2 mb-4">
                                {activeTab === 'appeals' && (
                                    <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-lg text-xs font-medium">
                                        Suspension Appeal
                                    </span>
                                )}
                                <span className="text-sm text-gray-500">
                                    {new Date(selectedMessage.created_at).toLocaleString()}
                                </span>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">{selectedMessage.subject}</h3>
                            <div className="prose prose-sm max-w-none">
                                <p className="text-gray-700 whitespace-pre-wrap">{selectedMessage.content}</p>
                            </div>
                            
                            {selectedMessage.admin_response && (
                                <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                                    <p className="text-sm font-medium text-emerald-800 mb-2">Your Response:</p>
                                    <p className="text-gray-700 whitespace-pre-wrap">{selectedMessage.admin_response}</p>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center justify-between p-4 sm:p-6 border-t border-gray-200 bg-gray-50">
                            <button
                                onClick={() => handleDelete(selectedMessage.id)}
                                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <TrashIcon />
                                <span>Delete</span>
                            </button>
                            <button
                                onClick={() => {
                                    setShowReplyModal(true);
                                    setReplyContent(selectedMessage.admin_response || '');
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
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
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
                        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
                            <h2 className="text-lg font-bold text-gray-900">Reply to {selectedMessage.sender_name}</h2>
                            <button
                                onClick={() => setShowReplyModal(false)}
                                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                            >
                                <CloseIcon />
                            </button>
                        </div>
                        <div className="p-4 sm:p-6">
                            <p className="text-sm text-gray-600 mb-4">
                                Replying to: <span className="font-medium">{selectedMessage.subject}</span>
                            </p>
                            <textarea
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                placeholder="Type your response..."
                                rows={6}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                            />
                        </div>
                        <div className="flex justify-end gap-3 p-4 sm:p-6 border-t border-gray-200 bg-gray-50">
                            <button
                                onClick={() => setShowReplyModal(false)}
                                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReply}
                                disabled={replying || !replyContent.trim()}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
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
