import { Envelope as MailIcon, Check as CheckIcon, AlertCircle as AlertCircleIcon, Search as SearchIcon, X as CloseIcon, Trash as TrashIcon, Reply as ReplyIcon, Loader as LoaderIcon } from 'reicon-react';
import { useEffect, useState } from 'react';
import { staffAPI, getProfileImageUrl } from '../../services/api-client';
import { notify } from '../../utils/toast';


const StaffMessages = ({ globalSearch = '' }) => {
    const [messages, setMessages] = useState([]);
    const [appeals, setAppeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('messages');
    const [typeFilter, setTypeFilter] = useState('all');
    
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);
    
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
                const response = await staffAPI.getMessages();
                setMessages(response.data?.messages || response.messages || []);
            } else {
                const response = await staffAPI.getAppeals();
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
            await staffAPI.markMessageRead(messageId);
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
            await staffAPI.markAllMessagesRead();
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
            await staffAPI.respondToMessage(selectedMessage.id, replyContent);
            if (activeTab === 'messages') {
                setMessages(messages.map(m => m.id === selectedMessage.id ? { ...m, admin_response: replyContent, is_read: true } : m));
            } else {
                setAppeals(appeals.map(a => a.id === selectedMessage.id ? { ...a, admin_response: replyContent, is_read: true } : a));
            }
            setShowReplyModal(false);
            setReplyContent('');
            setShowViewModal(false);
            notify.success('Reply sent.');
        } catch (err) {
            console.error('Error sending reply:', err);
            notify.error("Couldn't send reply.");
        } finally {
            setReplying(false);
        }
    };

    const handleDelete = async (messageId) => {
        if (!window.confirm('Are you sure you want to delete this message?')) return;
        try {
            await staffAPI.deleteMessage(messageId);
            if (activeTab === 'messages') {
                setMessages(messages.filter(m => m.id !== messageId));
            } else {
                setAppeals(appeals.filter(a => a.id !== messageId));
            }
            if (selectedMessage?.id === messageId) {
                setShowViewModal(false);
                setSelectedMessage(null);
            }
            notify.success('Message removed.');
        } catch (err) {
            console.error('Error deleting message:', err);
            notify.error("Couldn't remove message.");
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
                    <div className="absolute inset-0 rounded-full border-4 border-green-300"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-green-500 animate-spin"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-400/10 rounded-xl flex items-center justify-center text-green-800">
                        <MailIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
                        <p className="text-sm text-gray-500">View and respond to user messages</p>
                    </div>
                </div>
                
                {unreadCount > 0 && (
                    <button
                        onClick={handleMarkAllAsRead}
                        className="flex items-center gap-2 px-4 py-2.5 bg-green-400 text-gray-900 font-semibold rounded-xl hover:bg-green-400 transition-all shadow-lg shadow-green-400/50"
                    >
                        <CheckIcon className="w-4 h-4" />
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
                            ? 'bg-green-400 text-gray-900'
                            : 'bg-green-50 text-gray-500 hover:bg-green-50 hover:text-gray-900'
                    }`}
                >
                    Messages
                    {messages.filter(m => !m.is_read).length > 0 && (
                        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                            activeTab === 'messages' ? 'bg-green-50' : 'bg-green-400/20 text-green-800'
                        }`}>
                            {messages.filter(m => !m.is_read).length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('appeals')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
                        activeTab === 'appeals'
                            ? 'bg-green-400 text-gray-900'
                            : 'bg-green-50 text-gray-500 hover:bg-green-50 hover:text-gray-900'
                    }`}
                >
                    <AlertCircleIcon className="w-4 h-4" />
                    Appeals
                    {appeals.filter(a => !a.is_read).length > 0 && (
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                            activeTab === 'appeals' ? 'bg-white/40' : 'bg-orange-500/20 text-orange-700'
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
                        <SearchIcon className="w-4 h-4" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search messages..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-green-50 border border-green-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-300 transition-all"
                    />
                </div>
                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-4 py-3 bg-green-50 border border-green-300 rounded-xl text-gray-900 focus:outline-none focus:border-green-400 cursor-pointer"
                >
                    <option value="all">All Messages</option>
                    <option value="unread">Unread</option>
                    <option value="read">Read</option>
                    <option value="replied">Replied</option>
                </select>
            </div>

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-700">
                    {error}
                </div>
            )}

            {/* Messages List */}
            <div className="bg-white border border-green-300 rounded-2xl overflow-hidden">
                {getFilteredData().length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-500">
                            <MailIcon className="w-6 h-6" />
                        </div>
                        <p className="text-lg font-medium text-gray-500">No {activeTab} found</p>
                        <p className="text-sm text-gray-500 mt-1">When users send messages, they will appear here.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-green-200">
                        {getFilteredData().map((message) => (
                            <div
                                key={message.id}
                                className={`p-4 hover:bg-green-50 cursor-pointer transition-all ${
                                    !message.is_read ? 'bg-green-400/5 border-l-2 border-green-400' : ''
                                }`}
                                onClick={() => openMessage(message)}
                            >
                                <div className="flex items-start gap-4">
                                    <img
                                        src={getProfileImageUrl(message.sender_profile_image) || '/profile-img/default-avatar.svg'}
                                        alt={message.sender_name}
                                        className="w-10 h-10 rounded-full object-cover border border-green-300"
                                        onError={(e) => { e.target.onerror = null; e.target.src = '/profile-img/default-avatar.svg'; }}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className={`font-medium ${!message.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                                                    {message.sender_name || 'Unknown User'}
                                                </span>
                                                {!message.is_read && (
                                                    <span className="px-2 py-0.5 bg-green-400/20 text-green-800 rounded-full text-xs font-medium">
                                                        New
                                                    </span>
                                                )}
                                                {activeTab === 'appeals' && (
                                                    <span className="px-2 py-0.5 bg-orange-500/20 text-orange-700 rounded-full text-xs font-medium">
                                                        Appeal
                                                    </span>
                                                )}
                                                {message.admin_response && (
                                                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-700 rounded-full text-xs font-medium">
                                                        Replied
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-sm text-gray-500 whitespace-nowrap">
                                                {formatDate(message.created_at)}
                                            </span>
                                        </div>
                                        <p className={`text-sm mt-1 ${!message.is_read ? 'font-medium text-gray-900' : 'text-gray-500'}`}>
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white border border-green-300 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between p-5 border-b border-green-300">
                            <div className="flex items-center gap-3">
                                <img
                                    src={getProfileImageUrl(selectedMessage.sender_profile_image) || '/profile-img/default-avatar.svg'}
                                    alt={selectedMessage.sender_name}
                                    className="w-10 h-10 rounded-full object-cover border border-green-300"
                                    onError={(e) => { e.target.onerror = null; e.target.src = '/profile-img/default-avatar.svg'; }}
                                />
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">{selectedMessage.sender_name}</h2>
                                    <p className="text-sm text-gray-500">{selectedMessage.sender_email}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowViewModal(false)}
                                className="p-2 text-gray-500 hover:text-gray-900 hover:bg-green-50 rounded-lg transition"
                            >
                                <CloseIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-5">
                            <div className="flex items-center gap-2 mb-4">
                                {activeTab === 'appeals' && (
                                    <span className="px-2 py-1 bg-orange-500/20 text-orange-700 rounded-lg text-xs font-medium">
                                        Suspension Appeal
                                    </span>
                                )}
                                <span className="text-sm text-gray-500">
                                    {new Date(selectedMessage.created_at).toLocaleString()}
                                </span>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">{selectedMessage.subject}</h3>
                            <div className="prose prose-invert prose-sm max-w-none">
                                <p className="text-gray-700 whitespace-pre-wrap">{selectedMessage.content}</p>
                            </div>
                            
                            {selectedMessage.admin_response && (
                                <div className="mt-6 p-4 bg-green-400/10 border border-green-400/30 rounded-xl">
                                    <p className="text-sm font-medium text-green-800 mb-2">Response:</p>
                                    <p className="text-gray-700 whitespace-pre-wrap">{selectedMessage.admin_response}</p>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center justify-between p-5 border-t border-green-300">
                            <button
                                onClick={() => handleDelete(selectedMessage.id)}
                                className="flex items-center gap-2 px-4 py-2 text-red-700 hover:bg-red-500/10 rounded-xl transition-colors"
                            >
                                <TrashIcon className="w-4 h-4" />
                                <span>Delete</span>
                            </button>
                            <button
                                onClick={() => {
                                    setShowReplyModal(true);
                                    setReplyContent(selectedMessage.admin_response || '');
                                }}
                                className="flex items-center gap-2 px-4 py-2.5 bg-green-400 text-gray-900 font-semibold rounded-xl hover:bg-green-400 transition-all"
                            >
                                <ReplyIcon className="w-4 h-4" />
                                <span>{selectedMessage.admin_response ? 'Edit Reply' : 'Reply'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reply Modal */}
            {showReplyModal && selectedMessage && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white border border-green-300 rounded-2xl shadow-2xl w-full max-w-lg">
                        <div className="flex items-center justify-between p-5 border-b border-green-300">
                            <h2 className="text-lg font-bold text-gray-900">Reply to {selectedMessage.sender_name}</h2>
                            <button
                                onClick={() => setShowReplyModal(false)}
                                className="p-2 text-gray-500 hover:text-gray-900 hover:bg-green-50 rounded-lg transition"
                            >
                                <CloseIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-5">
                            <p className="text-sm text-gray-500 mb-4">
                                Replying to: <span className="text-gray-700 font-medium">{selectedMessage.subject}</span>
                            </p>
                            <textarea
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                placeholder="Type your response..."
                                rows={6}
                                className="w-full px-4 py-3 bg-green-50 border border-green-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-300 resize-none transition-all"
                            />
                        </div>
                        <div className="flex justify-end gap-3 p-5 border-t border-green-300">
                            <button
                                onClick={() => setShowReplyModal(false)}
                                className="px-4 py-2 text-gray-500 hover:text-gray-900 hover:bg-green-50 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReply}
                                disabled={replying || !replyContent.trim()}
                                className="flex items-center gap-2 px-4 py-2.5 bg-green-400 text-gray-900 font-semibold rounded-xl hover:bg-green-400 transition-all disabled:bg-gray-200 disabled:cursor-not-allowed"
                            >
                                {replying ? (
                                    <>
                                        <LoaderIcon className="animate-spin w-4 h-4" />
                                        <span>Sending...</span>
                                    </>
                                ) : (
                                    <>
                                        <ReplyIcon className="w-4 h-4" />
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

export default StaffMessages;
