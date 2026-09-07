import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, Envelope, Home, Loader, Send, X } from 'reicon-react';
import { useNavigate } from 'react-router-dom';
import { chatAPI, getProfileImageUrl, messageAPI } from '../../services/api-client';
import { connectChatSocket } from '../../services/chat-socket';
import { notify } from '../../utils/toast';

const defaultAvatar = '/profile-img/default-avatar.svg';

const personName = (person) =>
    person?.name || [person?.firstName, person?.lastName].filter(Boolean).join(' ') || person?.username || 'Admin';

const recipientFor = (conversation) => conversation?.recipient?.type === 'admin'
    ? { name: 'Admin', role: 'General inbox', profileImage: null }
    : { ...conversation?.recipient, role: 'Zoo staff' };

const formatTime = (value) =>
    new Date(value).toLocaleString([], { hour: 'numeric', minute: '2-digit' });

const Avatar = ({ person, className = 'h-12 w-12' }) => (
    <img
        src={getProfileImageUrl(person?.profileImage) || defaultAvatar}
        alt=""
        onError={(event) => { event.currentTarget.src = defaultAvatar; }}
        className={`${className} rounded-full border border-gray-100 bg-gray-50 object-cover shrink-0`}
    />
);

const UserMessages = () => {
    const navigate = useNavigate();
    const endRef = useRef(null);
    const refreshTimerRef = useRef(null);
    const [recipients, setRecipients] = useState([]);
    const [conversations, setConversations] = useState([]);
    const [selected, setSelected] = useState(null);
    const [messages, setMessages] = useState([]);
    const [draft, setDraft] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [activeView, setActiveView] = useState('chats');
    const [supportMessages, setSupportMessages] = useState([]);
    const [supportLoading, setSupportLoading] = useState(true);
    const [selectedSupport, setSelectedSupport] = useState(null);
    const [supportReply, setSupportReply] = useState('');
    const [supportReplySending, setSupportReplySending] = useState(false);

    const loadConversations = useCallback(async () => {
        const response = await chatAPI.getConversations('user');
        setConversations(response.conversations || []);
        return response.conversations || [];
    }, []);

    const loadMessages = useCallback(async (conversation = selected) => {
        if (!conversation) return;
        const response = await chatAPI.getMessages(conversation.id, 'user');
        setMessages(response.messages || []);
        await chatAPI.markRead(conversation.id, 'user');
        setConversations((items) => items.map((item) => item.id === conversation.id ? { ...item, unreadCount: 0 } : item));
    }, [selected]);

    useEffect(() => {
        Promise.all([
            chatAPI.getRecipients(),
            loadConversations(),
            messageAPI.getMyMessages().catch(() => ({ messages: [] }))
        ]).then(([recipientResponse, , supportResponse]) => {
            setRecipients(recipientResponse.recipients || []);
            setSupportMessages(supportResponse.messages || []);
        }).catch((error) => notify.error(error.message || 'Could not load messages.')).finally(() => {
            setLoading(false);
            setSupportLoading(false);
        });
    }, [loadConversations]);

    useEffect(() => { if (selected) loadMessages(selected); }, [selected, loadMessages]);
    useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    useEffect(() => {
        const socket = connectChatSocket('user');
        const refresh = async () => {
            const items = await loadConversations().catch(() => []);
            if (selected) {
                const current = items.find((item) => item.recipientType === selected.recipientType && item.staffRecipientId === selected.staffRecipientId) || selected;
                loadMessages(current).catch(() => { });
            }
        };
        const scheduleRefresh = () => {
            clearTimeout(refreshTimerRef.current);
            refreshTimerRef.current = setTimeout(() => refresh(), 150);
        };
        const handleRead = (payload) => {
            if (payload?.readBy?.role === 'user') return;
            scheduleRefresh();
        };
        ['chat:message-created', 'chat:conversation-updated'].forEach((event) => socket.on(event, scheduleRefresh));
        socket.on('chat:conversation-read', handleRead);
        return () => {
            clearTimeout(refreshTimerRef.current);
            socket.disconnect();
        };
    }, [loadConversations, loadMessages, selected]);

    const chooseRecipient = async (recipient) => {
        try {
            const existing = conversations.find((item) => item.recipientType === recipient.type && (recipient.type === 'admin' || item.staffRecipientId === recipient.id));
            const conversation = existing || (await chatAPI.createConversation(recipient.type, recipient.id)).conversation;
            if (!existing) setConversations((items) => [conversation, ...items]);
            setSelected(conversation);
            setPickerOpen(false);
        } catch (error) { notify.error(error.message || 'Could not start conversation.'); }
    };

    const send = async (event) => {
        event.preventDefault();
        const content = draft.trim();
        if (!selected || !content || sending) return;
        setSending(true);
        try {
            const response = await chatAPI.sendMessage(selected.id, content, 'user');
            setMessages((items) => items.some((item) => item.id === response.message.id) ? items : [...items, response.message]);
            setDraft('');
            loadConversations().catch(() => { });
        } catch (error) { notify.error(error.message || 'Message was not sent.'); }
        finally { setSending(false); }
    };

    const sendSupportReply = async (event) => {
        event.preventDefault();
        const content = supportReply.trim();
        if (!selectedSupport || !content || supportReplySending || selectedSupport.case_status === 'closed') return;
        setSupportReplySending(true);
        try {
            await messageAPI.replyToMessage(selectedSupport.id, content);
            const updated = {
                ...selectedSupport,
                user_response: selectedSupport.user_response ? `${selectedSupport.user_response}\n\n${content}` : content,
                user_responded_at: new Date().toISOString(),
                case_status: 'open'
            };
            setSelectedSupport(updated);
            setSupportMessages((items) => items.map((item) => item.id === updated.id ? updated : item));
            setSupportReply('');
            notify.success('Reply sent.');
        } catch (error) {
            notify.error(error.message || 'Reply was not sent.');
        } finally {
            setSupportReplySending(false);
        }
    };

    if (loading) return <div className="flex h-[100dvh] items-center justify-center bg-white"><Loader className="h-8 w-8 animate-spin text-blue-500" /></div>;

    const recipient = recipientFor(selected);

    return (
        <div className="flex h-[100dvh] overflow-hidden bg-white text-gray-900 antialiased">
            {/* Sidebar List */}
            <aside className={`${selected || selectedSupport ? 'hidden md:flex' : 'flex'} w-full flex-col border-r border-gray-100 bg-gray-50/50 md:w-[380px]`}>
                <header className="flex flex-col gap-4 px-5 py-5 pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <button type="button" onClick={() => navigate(-1)} className="rounded-full p-2 text-gray-500 hover:bg-gray-200 transition-colors">
                                <ChevronLeft className="h-6 w-6" />
                            </button>
                            <h1 className="text-2xl font-bold tracking-tight">{activeView === 'chats' ? 'Chats' : 'Support Requests'}</h1>
                        </div>
                        <div className="flex items-center gap-1">
                            <button type="button" onClick={() => navigate('/')} className="rounded-full p-2 text-gray-500 hover:bg-gray-200 transition-colors">
                                <Home className="h-5 w-5" />
                            </button>
                            {activeView === 'chats' && <button type="button" onClick={() => setPickerOpen(true)} className="rounded-full bg-blue-50 p-2 text-blue-600 hover:bg-blue-100 transition-colors">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                            </button>}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1">
                        <button type="button" onClick={() => { setActiveView('chats'); setSelectedSupport(null); }} className={`rounded-lg px-3 py-2 text-xs font-bold transition ${activeView === 'chats' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>Live Chats</button>
                        <button type="button" onClick={() => { setActiveView('support'); setSelected(null); }} className={`rounded-lg px-3 py-2 text-xs font-bold transition ${activeView === 'support' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>Contact Support</button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto px-3 pb-4">
                    {activeView === 'support' ? (supportLoading ? (
                        <div className="flex h-64 items-center justify-center"><Loader className="h-7 w-7 animate-spin text-blue-500" /></div>
                    ) : supportMessages.length ? supportMessages.map((support) => (
                        <button type="button" key={support.id} onClick={() => setSelectedSupport(support)} className={`mb-1 w-full rounded-2xl p-4 text-left transition ${selectedSupport?.id === support.id ? 'bg-blue-500 text-white shadow-md' : 'hover:bg-gray-100'}`}>
                            <div className="flex items-start justify-between gap-3"><strong className="truncate text-sm">{support.subject}</strong><span className={`shrink-0 text-[10px] ${selectedSupport?.id === support.id ? 'text-blue-100' : 'text-gray-400'}`}>{support.created_at ? formatTime(support.created_at) : ''}</span></div>
                            <p className={`mt-2 line-clamp-2 text-sm ${selectedSupport?.id === support.id ? 'text-blue-50' : 'text-gray-500'}`}>{support.content}</p>
                            <span className={`mt-2 inline-block text-[10px] font-bold uppercase ${selectedSupport?.id === support.id ? 'text-blue-100' : support.admin_response ? 'text-emerald-600' : 'text-amber-600'}`}>{support.admin_response ? 'Replied' : 'Awaiting reply'}</span>
                        </button>
                    )) : (
                        <div className="flex flex-col items-center justify-center pt-20 text-center text-gray-500"><Envelope className="mb-4 h-8 w-8 text-gray-400" /><p className="text-sm font-medium">No support requests yet</p><p className="mt-1 text-xs text-gray-400">Contact Support messages will appear here.</p></div>
                    )) : conversations.map((conversation) => {
                        const person = recipientFor(conversation);
                        const isSelected = selected?.id === conversation.id;
                        return (
                            <button
                                type="button"
                                key={conversation.id}
                                onClick={() => setSelected(conversation)}
                                className={`mb-1 flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-all ${isSelected ? 'bg-blue-500 text-white shadow-md' : 'hover:bg-gray-100'}`}
                            >
                                <Avatar person={person} className="h-12 w-12 shadow-sm" />
                                <div className="min-w-0 flex-1">
                                    <div className="flex justify-between items-center mb-0.5">
                                        <strong className={`truncate font-semibold ${isSelected ? 'text-white' : 'text-gray-900'}`}>{personName(person)}</strong>
                                        <span className={`shrink-0 text-xs ${isSelected ? 'text-blue-100' : 'text-gray-400'}`}>
                                            {conversation.lastMessage?.createdAt ? formatTime(conversation.lastMessage.createdAt) : ''}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <p className={`min-w-0 flex-1 truncate text-sm ${isSelected ? 'text-blue-50' : 'text-gray-500'}`}>
                                            {conversation.lastMessage?.content || 'Start the conversation'}
                                        </p>
                                        {conversation.unreadCount > 0 && (
                                            <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${isSelected ? 'bg-white text-blue-600' : 'bg-red-500 text-white'}`}>
                                                {conversation.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                    {activeView === 'chats' && !conversations.length && (
                        <div className="flex flex-col items-center justify-center pt-20 text-center text-gray-500">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                                <Envelope className="h-8 w-8 text-gray-400" />
                            </div>
                            <p className="text-sm font-medium">No messages yet</p>
                            <p className="text-xs text-gray-400 mt-1">Tap the plus icon to start chatting</p>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Chat Area */}
            <main className={`${selected || selectedSupport ? 'flex' : 'hidden md:flex'} relative flex-1 flex-col bg-white`}>
                {activeView === 'support' ? (
                    selectedSupport ? (
                        <article className="flex h-full min-h-0 flex-col bg-white">
                            <header className="flex items-center gap-3 border-b border-gray-100 px-4 py-3 sm:px-6">
                                <button type="button" onClick={() => setSelectedSupport(null)} className="rounded-full p-2 text-gray-500 hover:bg-gray-100 md:hidden" aria-label="Back to support requests"><ChevronLeft className="h-6 w-6" /></button>
                                <div className="min-w-0"><h2 className="truncate font-bold text-gray-900">{selectedSupport.subject}</h2><p className="text-xs text-gray-500">{selectedSupport.created_at ? new Date(selectedSupport.created_at).toLocaleString() : 'Support request'} · <span className={selectedSupport.case_status === 'closed' ? 'text-gray-500' : 'text-emerald-600'}>{selectedSupport.case_status === 'closed' ? 'Closed' : 'Open'}</span></p></div>
                            </header>
                            <div className="flex-1 overflow-y-auto p-5 sm:p-8">
                                <div className="mx-auto max-w-2xl">
                                    <div className="rounded-2xl bg-blue-50 p-5"><p className="whitespace-pre-wrap text-sm leading-7 text-gray-800">{selectedSupport.content}</p><p className="mt-3 text-xs text-gray-500">You</p></div>
                                    {selectedSupport.user_response && <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-5"><p className="text-xs font-bold uppercase tracking-wider text-blue-700">Your reply</p><p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-gray-800">{selectedSupport.user_response}</p></div>}
                                    {selectedSupport.admin_response ? <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-5"><p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Support reply</p><p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-gray-800">{selectedSupport.admin_response}</p>{selectedSupport.responded_at && <p className="mt-3 text-xs text-gray-500">{new Date(selectedSupport.responded_at).toLocaleString()}</p>}</div> : <div className="mt-5 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">Your request is waiting for a support reply.</div>}
                                    {selectedSupport.case_status === 'closed' ? <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">This support case is closed. Start a new Contact Support request if you need more help.</div> : <form onSubmit={sendSupportReply} className="mt-6"><label htmlFor="support-reply" className="text-sm font-bold text-gray-900">Reply to support</label><textarea id="support-reply" value={supportReply} onChange={(event) => setSupportReply(event.target.value)} rows={4} maxLength={4000} placeholder="Add more information or reply to support..." className="mt-2 w-full resize-y rounded-xl border border-blue-100 bg-blue-50/30 px-4 py-3 text-sm leading-6 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" /><button type="submit" disabled={!supportReply.trim() || supportReplySending} className="mt-3 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50">{supportReplySending ? 'Sending...' : 'Send reply'}</button></form>}
                                </div>
                            </div>
                        </article>
                    ) : <div className="m-auto flex flex-col items-center text-center p-8"><Envelope className="h-10 w-10 text-blue-300" /><h3 className="mt-4 text-xl font-semibold text-gray-900">Select a support request</h3><p className="mt-2 max-w-sm text-sm text-gray-500">Open a request to read your message and any reply from support.</p></div>
                ) : selected ? (
                    <>
                        {/* Glassmorphism Header */}
                        <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-gray-100 bg-white/80 px-4 py-3 backdrop-blur-md">
                            <button type="button" onClick={() => setSelected(null)} className="rounded-full p-2 -ml-2 text-gray-500 md:hidden hover:bg-gray-100">
                                <ChevronLeft className="h-6 w-6" />
                            </button>
                            <Avatar person={recipient} className="h-10 w-10" />
                            <div className="flex flex-col">
                                <h2 className="font-semibold text-gray-900 leading-tight">{personName(recipient)}</h2>
                                <span className="text-xs text-green-500 font-medium">Online</span>
                            </div>
                        </header>

                        {/* Message Bubbles Area */}
                        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50/30">
                            <div className="mx-auto flex flex-col space-y-4 max-w-4xl">
                                {messages.map((message, index) => {
                                    const own = message.senderRole === 'user';
                                    const nextOwn = messages[index + 1]?.senderRole === 'user';
                                    const isLastInGroup = own !== nextOwn;

                                    return (
                                        <div key={message.id} className={`flex w-full ${own ? 'justify-end' : 'justify-start'}`}>
                                            <div
                                                className={`group relative max-w-[75%] px-4 py-2.5 text-[15px] leading-relaxed shadow-sm
                                                    ${own
                                                        ? `bg-blue-500 text-white rounded-2xl rounded-tr-sm ${isLastInGroup ? 'rounded-br-sm' : ''}`
                                                        : `bg-gray-100 text-gray-900 rounded-2xl rounded-tl-sm ${isLastInGroup ? 'rounded-bl-sm' : ''}`
                                                    }`
                                                }
                                            >
                                                <p className="whitespace-pre-wrap">{message.content}</p>

                                                <div className={`mt-1 flex items-center gap-1.5 text-[10px] select-none ${own ? 'text-blue-100 justify-end' : 'text-gray-400 justify-start'}`}>
                                                    <span>{formatTime(message.createdAt)}</span>
                                                    {own && (
                                                        <svg className={`h-3 w-3 ${message.isRead ? 'text-blue-200' : 'text-blue-300/50'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={endRef} className="h-1" />
                            </div>
                        </div>

                        {/* Chat Input */}
                        <form onSubmit={send} className="bg-white px-4 py-3 border-t border-gray-100">
                            <div className="mx-auto flex max-w-4xl items-end gap-2 bg-gray-100 rounded-3xl p-1 shadow-sm border border-gray-200/50">
                                <textarea
                                    value={draft}
                                    onChange={(event) => setDraft(event.target.value)}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter' && !event.shiftKey) {
                                            event.preventDefault();
                                            event.currentTarget.form.requestSubmit();
                                        }
                                    }}
                                    maxLength={4000}
                                    rows={1}
                                    placeholder="Type a message..."
                                    className="max-h-32 min-h-[44px] flex-1 resize-y bg-transparent px-4 py-2.5 text-[15px] outline-none placeholder:text-gray-400"
                                    style={{ border: 'none', boxShadow: 'none' }}
                                />
                                <button
                                    type="submit"
                                    disabled={!draft.trim() || sending}
                                    className="mb-0.5 mr-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                                >
                                    {sending ? <Loader className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 -ml-0.5" />}
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="m-auto flex flex-col items-center text-center">
                        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-blue-50/50">
                            <Envelope className="h-10 w-10 text-blue-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900">Your Messages</h3>
                        <p className="mt-2 max-w-sm text-sm text-gray-500">Send private photos and messages to your favorite connections.</p>
                        <button onClick={() => setPickerOpen(true)} className="mt-6 rounded-full bg-blue-500 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-blue-600 transition-colors">
                            Start a new chat
                        </button>
                    </div>
                )}
            </main>

            {/* Recipient Picker Modal */}
            {pickerOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-sm transition-opacity">
                    <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
                        <header className="flex items-center justify-between border-b border-gray-100 p-4">
                            <h2 className="text-lg font-bold text-gray-900 mx-auto pl-8">New Message</h2>
                            <button type="button" onClick={() => setPickerOpen(false)} className="rounded-full p-2 text-gray-400 bg-gray-50 hover:bg-gray-100 hover:text-gray-900 transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </header>
                        <div className="max-h-[60dvh] overflow-y-auto p-2">
                            {recipients.map((person) => (
                                <button
                                    type="button"
                                    key={`${person.type}-${person.id || 'general'}`}
                                    onClick={() => chooseRecipient(person)}
                                    className="flex w-full items-center gap-4 rounded-2xl p-3 text-left transition-colors hover:bg-gray-50"
                                >
                                    <Avatar person={person} className="h-12 w-12" />
                                    <div className="flex flex-col">
                                        <strong className="text-sm font-bold text-gray-900">{personName(person)}</strong>
                                        <span className="text-xs text-gray-500 font-medium">{person.type === 'admin' ? 'General inbox' : 'Zoo staff'}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserMessages;
