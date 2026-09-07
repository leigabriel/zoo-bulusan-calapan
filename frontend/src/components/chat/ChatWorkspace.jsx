import { Check, ChevronLeft, Envelope, Loader, Plus, Search, Send, X } from 'reicon-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { chatAPI, getProfileImageUrl } from '../../services/api-client';
import { connectChatSocket } from '../../services/chat-socket';
import { notify } from '../../utils/toast';

const defaultAvatar = '/profile-img/default-avatar.svg';

const personName = (person, fallback = 'Zoo Bulusan Support') => {
    if (!person) return fallback;
    if (person.name) return person.name;
    return [person.firstName, person.lastName].filter(Boolean).join(' ') || person.username || fallback;
};

const conversationPerson = (conversation, role) => role === 'user' ? conversation.recipient : conversation.user;

const conversationKey = (conversation) => conversation?.recipientType === 'admin'
    ? `admin:${conversation.userId}`
    : `staff:${conversation.userId}:${conversation.staffRecipientId}`;

const formatListTime = (value) => {
    if (!value) return '';
    const date = new Date(value);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const Avatar = ({ person, admin = false, size = 'h-11 w-11' }) => (
    <img
        src={admin ? '/bz-url-logo.png' : getProfileImageUrl(person?.profileImage) || defaultAvatar}
        alt=""
        className={`${size} shrink-0 rounded-full border border-emerald-100 bg-emerald-50 object-cover`}
        onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = defaultAvatar;
        }}
    />
);

const ChatWorkspace = ({ role = 'user', embedded = false, globalSearch = '' }) => {
    const [api] = useState(() => chatAPI.forRole(role));
    const [conversations, setConversations] = useState([]);
    const [recipients, setRecipients] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);
    const [creating, setCreating] = useState(false);
    const [showRecipients, setShowRecipients] = useState(false);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const [draft, setDraft] = useState('');
    const [error, setError] = useState('');
    const selectedIdRef = useRef(selectedId);
    const selectedRef = useRef(null);
    const messageEndRef = useRef(null);
    const refreshTimerRef = useRef(null);
    selectedIdRef.current = selectedId;

    const selected = conversations.find((conversation) => conversation.id === selectedId)
        || (selectedId && selectedRef.current)
        || null;

    const loadConversations = useCallback(async (quiet = false) => {
        if (!quiet) setLoading(true);
        try {
            const response = await api.getConversations();
            const fresh = response.conversations || [];
            setConversations(fresh);
            setSelectedId((current) => {
                if (!current || !selectedRef.current) return current;
                const key = conversationKey(selectedRef.current);
                if (!key) return current;
                const match = fresh.find((conversation) => conversationKey(conversation) === key);
                return match ? match.id : current;
            });
            setError('');
        } catch (loadError) {
            console.error('Error loading chat conversations:', loadError);
            if (!quiet) setError("Couldn't load conversations. Please try again.");
        } finally {
            if (!quiet) setLoading(false);
        }
    }, [api]);

    const loadMessages = useCallback(async (conversationId, quiet = false) => {
        if (!conversationId) return;
        if (!quiet) setLoadingMessages(true);
        try {
            const response = await api.getMessages(conversationId);
            if (selectedIdRef.current === conversationId) setMessages(response.messages || []);
        } catch (loadError) {
            console.error('Error loading chat messages:', loadError);
            if (!quiet) notify.error("Couldn't load this conversation.");
        } finally {
            if (!quiet) setLoadingMessages(false);
        }
    }, [api]);

    useEffect(() => {
        let cancelled = false;
        Promise.all([
            api.getConversations(),
            role === 'user' ? api.getRecipients() : Promise.resolve({ recipients: [] })
        ]).then(([conversationResponse, recipientResponse]) => {
            if (cancelled) return;
            const nextConversations = conversationResponse.conversations || [];
            setConversations(nextConversations);
            setRecipients(recipientResponse.recipients || []);
            if (role === 'user' && nextConversations.length === 0) setShowRecipients(true);
        }).catch((loadError) => {
            console.error('Error loading chat:', loadError);
            if (!cancelled) setError("Couldn't load chat. Please try again.");
        }).finally(() => {
            if (!cancelled) setLoading(false);
        });
        return () => { cancelled = true; };
    }, [api, role]);

    useEffect(() => {
        if (!selectedId) {
            setMessages([]);
            return;
        }
        loadMessages(selectedId);
        api.markRead(selectedId).then(() => {
            setConversations((items) => items.map((item) => item.id === selectedId ? { ...item, unreadCount: 0 } : item));
        }).catch((readError) => console.error('Error marking chat read:', readError));
    }, [api, loadMessages, selectedId]);

    useEffect(() => {
        if (!selectedId || !messages.length) return;
        const hasUnreadIncoming = messages.some((message) => message.senderRole !== role && !message.isRead);
        if (!hasUnreadIncoming) return;
        api.markRead(selectedId).then(() => {
            setConversations((items) => items.map((item) => item.id === selectedId ? { ...item, unreadCount: 0 } : item));
            setMessages((items) => items.map((message) => (message.senderRole !== role ? { ...message, isRead: true } : message)));
        }).catch(() => {});
    }, [api, messages, role, selectedId]);

    useEffect(() => {
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, [messages]);

    useEffect(() => {
        if (selected) selectedRef.current = selected;
    }, [selected]);

    useEffect(() => {
        const socket = connectChatSocket(role);
        const scheduleRefresh = () => {
            clearTimeout(refreshTimerRef.current);
            refreshTimerRef.current = setTimeout(() => {
                loadConversations(true);
                if (selectedIdRef.current) loadMessages(selectedIdRef.current, true);
            }, 150);
        };
        const handleRead = (payload) => {
            if (payload?.readBy?.role === role) return;
            scheduleRefresh();
        };
        socket.on('chat:message-created', scheduleRefresh);
        socket.on('chat:conversation-updated', scheduleRefresh);
        socket.on('chat:conversation-read', handleRead);
        return () => {
            clearTimeout(refreshTimerRef.current);
            socket.disconnect();
        };
    }, [role, loadConversations, loadMessages]);

    const selectConversation = (conversation) => {
        selectedRef.current = conversation;
        setSelectedId(conversation.id);
        setShowRecipients(false);
        setDraft('');
    };

    const startConversation = async (recipient) => {
        setCreating(true);
        try {
            const response = await api.createConversation(recipient.type, recipient.id);
            const conversation = response.conversation;
            selectedRef.current = conversation;
            setConversations((items) => [conversation, ...items.filter((item) => item.id !== conversation.id)]);
            setSelectedId(conversation.id);
            setShowRecipients(false);
        } catch (createError) {
            console.error('Error starting conversation:', createError);
            notify.error(createError.message || "Couldn't start the conversation.");
        } finally {
            setCreating(false);
        }
    };

    const sendMessage = async (event) => {
        event.preventDefault();
        const content = draft.trim();
        if (!selectedId || !content || sending) return;
        setSending(true);
        try {
            const response = await api.sendMessage(selectedId, content);
            setMessages((items) => items.some((item) => item.id === response.message.id) ? items : [...items, response.message]);
            setDraft('');
            loadConversations(true);
        } catch (sendError) {
            console.error('Error sending chat message:', sendError);
            notify.error(sendError.message || "Couldn't send your message.");
        } finally {
            setSending(false);
        }
    };

    const query = (globalSearch || search).trim().toLowerCase();
    const filteredConversations = conversations.filter((conversation) => {
        const person = conversationPerson(conversation, role);
        const matchesQuery = !query || personName(person).toLowerCase().includes(query)
            || conversation.lastMessage?.content?.toLowerCase().includes(query);
        return matchesQuery && (filter === 'all' || conversation.unreadCount > 0);
    });
    const totalUnread = conversations.reduce((sum, conversation) => sum + conversation.unreadCount, 0);
    const selectedPerson = selected && conversationPerson(selected, role);
    const selectedIsAdmin = selected?.recipientType === 'admin' && role === 'user';

    const recipientPicker = (
        <div className="flex h-full min-h-0 flex-col bg-white">
            <div className="flex items-center justify-between border-b border-emerald-100 p-5">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-600">New conversation</p>
                    <h2 className="mt-1 text-xl font-black text-gray-900">Choose a recipient</h2>
                </div>
                {conversations.length > 0 && <button type="button" onClick={() => setShowRecipients(false)} className="rounded-xl p-2 text-gray-500 hover:bg-gray-100" aria-label="Close recipient picker"><X className="h-5 w-5" /></button>}
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-5">
                {recipients.map((recipient) => (
                    <button key={`${recipient.type}-${recipient.id || 'general'}`} type="button" disabled={creating} onClick={() => startConversation(recipient)} className="flex w-full items-center gap-4 rounded-2xl border border-emerald-100 p-4 text-left transition hover:border-emerald-400 hover:bg-emerald-50 disabled:opacity-50">
                        <Avatar person={recipient} admin={recipient.type === 'admin'} size="h-12 w-12" />
                        <span className="min-w-0 flex-1"><span className="block truncate font-black text-gray-900">{personName(recipient)}</span><span className="mt-0.5 block text-sm capitalize text-gray-500">{recipient.type === 'admin' ? 'General support inbox' : 'Active staff member'}</span></span>
                        {creating ? <Loader className="h-4 w-4 animate-spin text-emerald-600" /> : <Plus className="h-5 w-5 text-emerald-600" />}
                    </button>
                ))}
                {!loading && recipients.length === 0 && <p className="rounded-2xl bg-gray-50 p-6 text-center text-sm text-gray-500">No active chat recipients are available right now.</p>}
            </div>
        </div>
    );

    const list = (
        <section className={`${selectedId || showRecipients ? 'hidden lg:flex' : 'flex'} min-h-0 flex-col border-emerald-100 bg-white lg:flex lg:border-r`} aria-label="Conversations list">
            <div className="border-b border-emerald-100 p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                    <div><h2 className="text-xl font-black text-gray-900">Conversations</h2><p className="text-xs font-semibold text-gray-400">{totalUnread} unread</p></div>
                    {role === 'user' && <button type="button" onClick={() => setShowRecipients(true)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-700"><Plus className="h-4 w-4" /> New</button>}
                </div>
                <label className="relative mt-4 block"><span className="sr-only">Search conversations</span><Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search conversations" className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-emerald-500" /></label>
                <div className="mt-3 flex gap-2">{['all', 'unread'].map((value) => <button key={value} type="button" onClick={() => setFilter(value)} className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${filter === value ? 'bg-emerald-100 text-emerald-800' : 'text-gray-500 hover:bg-gray-100'}`}>{value}</button>)}</div>
            </div>
            <div className="flex-1 overflow-y-auto">
                {loading ? <div className="flex h-64 items-center justify-center"><Loader className="h-7 w-7 animate-spin text-emerald-600" /></div> : filteredConversations.length ? filteredConversations.map((conversation) => {
                    const person = conversationPerson(conversation, role);
                    const admin = conversation.recipientType === 'admin' && role === 'user';
                    return <button key={conversation.id} type="button" onClick={() => selectConversation(conversation)} className={`flex w-full gap-3 border-b border-emerald-50 p-4 text-left transition hover:bg-emerald-50/70 ${selectedId === conversation.id ? 'bg-emerald-50' : ''}`}>
                        <span className="relative"><Avatar person={person} admin={admin} />{conversation.unreadCount > 0 && <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-emerald-600 px-1.5 py-0.5 text-center text-[10px] font-black text-white">{conversation.unreadCount}</span>}</span>
                        <span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><span className={`truncate ${conversation.unreadCount ? 'font-black' : 'font-bold'} text-gray-900`}>{personName(person)}</span><span className="shrink-0 text-[11px] text-gray-400">{formatListTime(conversation.lastMessageAt || conversation.updatedAt)}</span></span><span className={`mt-1 block truncate text-sm ${conversation.unreadCount ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>{conversation.lastMessage?.content || 'Start the conversation'}</span><span className="mt-1 block text-[10px] font-bold uppercase tracking-wider text-emerald-600">{admin ? 'Admin' : role === 'user' ? 'Staff' : 'User'}</span></span>
                    </button>;
                }) : <div className="flex h-64 flex-col items-center justify-center p-8 text-center"><Envelope className="h-8 w-8 text-emerald-300" /><p className="mt-3 font-bold text-gray-700">No conversations found</p><p className="mt-1 text-sm text-gray-500">{role === 'user' ? 'Choose New to message support.' : 'New assigned conversations will appear here.'}</p></div>}
            </div>
        </section>
    );

    const detail = showRecipients ? recipientPicker : selected ? (
        <section className={`${selectedId ? 'flex' : 'hidden lg:flex'} min-h-0 flex-col bg-slate-50 lg:flex`} aria-label="Conversation">
            <header className="flex items-center gap-3 border-b border-emerald-100 bg-white p-4 sm:px-6">
                <button type="button" onClick={() => setSelectedId(null)} className="rounded-xl p-2 text-gray-500 hover:bg-gray-100 lg:hidden" aria-label="Back to conversations"><ChevronLeft className="h-5 w-5" /></button>
                <Avatar person={selectedPerson} admin={selectedIsAdmin} />
                <div className="min-w-0 flex-1"><h2 className="truncate font-black text-gray-900">{personName(selectedPerson)}</h2><p className="text-xs font-bold capitalize text-emerald-600">{selectedIsAdmin ? 'General admin inbox' : role === 'user' ? 'Zoo staff' : 'Zoo visitor'}</p></div>
            </header>
            <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
                {loadingMessages ? <div className="flex h-full items-center justify-center"><Loader className="h-7 w-7 animate-spin text-emerald-600" /></div> : messages.length ? messages.map((message) => {
                    const mine = message.senderRole === role;
                    return <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] sm:max-w-[72%] ${mine ? 'items-end' : 'items-start'} flex flex-col`}><div className={`rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${mine ? 'rounded-br-md bg-emerald-600 text-white' : 'rounded-bl-md border border-emerald-100 bg-white text-gray-800'}`}><p className="whitespace-pre-wrap break-words">{message.content}</p></div><span className="mt-1 flex items-center gap-1 px-1 text-[10px] font-semibold text-gray-400">{formatListTime(message.createdAt)}{mine && <><Check className="h-3 w-3" /> {message.isRead ? 'Read' : 'Sent'}</>}</span></div></div>;
                }) : <div className="flex h-full flex-col items-center justify-center text-center"><Envelope className="h-9 w-9 text-emerald-300" /><p className="mt-3 font-bold text-gray-700">Start the conversation</p><p className="mt-1 text-sm text-gray-500">Messages are private between these participants.</p></div>}
                <div ref={messageEndRef} />
            </div>
            <form onSubmit={sendMessage} className="border-t border-emerald-100 bg-white p-3 sm:p-4"><div className="flex items-end gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-2 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100"><textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} rows={1} maxLength={4000} placeholder="Write a message..." className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none" /><button type="submit" disabled={!draft.trim() || sending} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Send message">{sending ? <Loader className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</button></div></form>
        </section>
    ) : <section className="hidden min-h-0 flex-col items-center justify-center bg-slate-50 text-center lg:flex"><Envelope className="h-10 w-10 text-emerald-300" /><p className="mt-4 font-black text-gray-800">Select a conversation</p><p className="mt-1 text-sm text-gray-500">Open a thread to read and reply.</p></section>;

    return <div className={`${embedded ? 'min-h-[620px]' : 'h-full'} overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm`}>
        {error && <div role="alert" className="border-b border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>}
        <div className={`${embedded ? 'h-[620px]' : 'h-full'} grid min-h-0 lg:grid-cols-[minmax(300px,38%)_1fr]`}>{list}{detail}</div>
    </div>;
};

export default ChatWorkspace;
