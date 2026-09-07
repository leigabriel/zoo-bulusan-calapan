import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, Envelope, Home, Loader, Send, X } from 'reicon-react';
import { useNavigate } from 'react-router-dom';
import { chatAPI, getProfileImageUrl } from '../../services/api-client';
import { connectChatSocket } from '../../services/chat-socket';
import { notify } from '../../utils/toast';

const defaultAvatar = '/profile-img/default-avatar.svg';
const personName = (person) => person?.name || [person?.firstName, person?.lastName].filter(Boolean).join(' ') || person?.username || 'Admin';
const recipientFor = (conversation) => conversation?.recipient?.type === 'admin'
    ? { name: 'Admin', role: 'General inbox', profileImage: null }
    : { ...conversation?.recipient, role: 'Zoo staff' };
const formatTime = (value) => new Date(value).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

const Avatar = ({ person, className = 'h-11 w-11' }) => <img src={getProfileImageUrl(person?.profileImage) || defaultAvatar} alt="" onError={(event) => { event.currentTarget.src = defaultAvatar; }} className={`${className} rounded-full border border-emerald-100 bg-emerald-50 object-cover`} />;

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
        Promise.all([chatAPI.getRecipients(), loadConversations()]).then(([recipientResponse]) => {
            setRecipients(recipientResponse.recipients || []);
        }).catch((error) => notify.error(error.message || 'Could not load messages.')).finally(() => setLoading(false));
    }, [loadConversations]);

    useEffect(() => { if (selected) loadMessages(selected); }, [selected, loadMessages]);
    useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    useEffect(() => {
        const socket = connectChatSocket('user');
        const refresh = async () => {
            const items = await loadConversations().catch(() => []);
            if (selected) {
                const current = items.find((item) => item.recipientType === selected.recipientType && item.staffRecipientId === selected.staffRecipientId) || selected;
                loadMessages(current).catch(() => {});
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
            loadConversations().catch(() => {});
        } catch (error) { notify.error(error.message || 'Message was not sent.'); }
        finally { setSending(false); }
    };

    if (loading) return <div className="flex h-[100dvh] items-center justify-center bg-[#f3f6f2]"><Loader className="h-8 w-8 animate-spin text-emerald-700" /></div>;
    const recipient = recipientFor(selected);

    return (
        <div className="flex h-[100dvh] overflow-hidden bg-[#f3f6f2] text-slate-900">
            <aside className={`${selected ? 'hidden md:flex' : 'flex'} w-full flex-col border-r border-emerald-100 bg-white md:w-[340px]`}>
                <header className="flex items-center gap-3 border-b p-4"><button type="button" onClick={() => navigate(-1)} className="rounded-xl bg-slate-100 p-2.5"><ChevronLeft className="h-5 w-5" /></button><div className="flex-1"><h1 className="text-xl font-black">My Messages</h1><p className="text-xs text-slate-500">Private conversations</p></div><button type="button" onClick={() => navigate('/')} className="rounded-xl bg-slate-100 p-2.5"><Home className="h-5 w-5" /></button></header>
                <button type="button" onClick={() => setPickerOpen(true)} className="m-4 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white">Choose a recipient</button>
                <div className="flex-1 overflow-y-auto">
                    {conversations.map((conversation) => { const person = recipientFor(conversation); return <button type="button" key={conversation.id} onClick={() => setSelected(conversation)} className="flex w-full gap-3 border-b border-slate-100 p-4 text-left hover:bg-emerald-50"><Avatar person={person} /><span className="min-w-0 flex-1"><span className="flex justify-between gap-2"><strong className="truncate">{personName(person)}</strong><small className="shrink-0 text-slate-400">{conversation.lastMessage?.createdAt ? formatTime(conversation.lastMessage.createdAt) : ''}</small></span><span className="mt-1 flex items-center gap-2"><span className="min-w-0 flex-1 truncate text-sm text-slate-500">{conversation.lastMessage?.content || 'Start the conversation'}</span>{conversation.unreadCount > 0 && <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-bold text-white">{conversation.unreadCount}</span>}</span></span></button>; })}
                    {!conversations.length && <div className="p-10 text-center text-sm text-slate-500"><Envelope className="mx-auto mb-3 h-8 w-8 text-emerald-300" />Choose Admin or a staff member to begin.</div>}
                </div>
            </aside>

            <main className={`${selected ? 'flex' : 'hidden md:flex'} min-w-0 flex-1 flex-col`}>
                {selected ? <><header className="flex items-center gap-3 border-b border-emerald-100 bg-white px-4 py-3"><button type="button" onClick={() => setSelected(null)} className="rounded-xl p-2 md:hidden"><ChevronLeft className="h-5 w-5" /></button><Avatar person={recipient} /><div><h2 className="font-black">{personName(recipient)}</h2><p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">{recipient.role}</p></div></header>
                    <div className="flex-1 overflow-y-auto p-4 sm:p-7"><div className="mx-auto max-w-3xl space-y-4">{messages.map((message) => { const own = message.senderRole === 'user'; return <div key={message.id} className={`flex ${own ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[82%] rounded-2xl px-4 py-3 shadow-sm ${own ? 'rounded-br-sm bg-emerald-700 text-white' : 'rounded-bl-sm border border-emerald-100 bg-white text-slate-800'}`}><p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p><div className={`mt-1 flex items-center justify-end gap-2 text-[10px] ${own ? 'text-emerald-100' : 'text-slate-400'}`}><span>{formatTime(message.createdAt)}</span>{own && <span>{message.isRead ? 'Read' : 'Sent'}</span>}</div></div></div>; })}<div ref={endRef} /></div></div>
                    <form onSubmit={send} className="border-t border-emerald-100 bg-white p-3 sm:p-4"><div className="mx-auto flex max-w-3xl items-end gap-2"><textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.currentTarget.form.requestSubmit(); } }} maxLength={4000} rows={1} placeholder="Write a message..." className="max-h-36 min-h-12 flex-1 resize-y rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500" /><button type="submit" disabled={!draft.trim() || sending} className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-700 text-white disabled:opacity-40">{sending ? <Loader className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}</button></div></form></> : <div className="m-auto text-center text-slate-400"><Envelope className="mx-auto mb-4 h-12 w-12 text-emerald-200" /><p className="font-bold text-slate-600">Select a conversation</p></div>}
            </main>

            {pickerOpen && <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-5"><div className="max-h-[85dvh] w-full max-w-lg overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"><header className="flex items-center justify-between border-b p-5"><div><h2 className="text-xl font-black">Who would you like to message?</h2><p className="text-sm text-slate-500">Select one recipient</p></div><button type="button" onClick={() => setPickerOpen(false)} className="rounded-xl bg-slate-100 p-2"><X className="h-5 w-5" /></button></header><div className="max-h-[60dvh] overflow-y-auto p-3">{recipients.map((person) => <button type="button" key={`${person.type}-${person.id || 'general'}`} onClick={() => chooseRecipient(person)} className="flex w-full items-center gap-3 rounded-2xl p-3 text-left hover:bg-emerald-50"><Avatar person={person} /><span><strong className="block">{personName(person)}</strong><small className="font-semibold uppercase tracking-wide text-emerald-700">{person.type === 'admin' ? 'General inbox' : 'Zoo staff'}</small></span></button>)}</div></div></div>}
        </div>
    );
};

export default UserMessages;
