import {
    AlertTriangle,
    Check,
    ChevronRight,
    Envelope,
    Loader,
    Reply,
    Search,
    Trash,
    X
} from 'reicon-react';
import { useEffect, useRef, useState } from 'react';
import { getProfileImageUrl } from '../../services/api-client';
import { notify } from '../../utils/toast';
import ConfirmationModal from '../common/ConfirmationModal';

const defaultAvatar = '/profile-img/default-avatar.svg';

const getCollection = (response, key) => (
    response?.data?.[key] || response?.[key] || []
);

const normalizeAppeal = (appeal) => ({
    ...appeal,
    sender_name: appeal.sender_name || appeal.user_name || 'Unknown user',
    sender_email: appeal.sender_email || appeal.user_email || '',
    sender_profile_image: appeal.sender_profile_image || appeal.user_profile_image || appeal.profile_image,
    subject: appeal.subject || 'Suspension appeal',
    content: appeal.content || appeal.appeal_message || appeal.appealMessage || '',
    status: (appeal.status || 'pending').toLowerCase(),
    recordType: 'appeal'
});

const formatShortDate = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Unknown date';
    const days = Math.floor((Date.now() - date.getTime()) / 86400000);
    if (days === 0) return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    if (days === 1) return 'Yesterday';
    if (days < 7) return date.toLocaleDateString('en-US', { weekday: 'short' });
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const StatusBadge = ({ item, isAppeal }) => {
    if (isAppeal) {
        const styles = {
            approved: 'bg-emerald-100 text-emerald-800',
            rejected: 'bg-red-100 text-red-700',
            pending: 'bg-amber-100 text-amber-800'
        };
        return <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${styles[item.status] || styles.pending}`}>{item.status}</span>;
    }
    if (item.admin_response) return <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-bold text-blue-700">Replied</span>;
    if (!item.is_read) return <span className="rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-bold text-green-800">New</span>;
    return null;
};

const Avatar = ({ item, size = 'h-11 w-11' }) => (
    <img
        src={getProfileImageUrl(item.sender_profile_image) || defaultAvatar}
        alt=""
        className={`${size} shrink-0 rounded-full border border-green-100 bg-green-50 object-cover`}
        onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = defaultAvatar;
        }}
    />
);

const MessageWorkspace = ({ globalSearch = '', api, roleLabel }) => {
    const [messages, setMessages] = useState([]);
    const [appeals, setAppeals] = useState([]);
    const [loadedTabs, setLoadedTabs] = useState({ messages: false, appeals: false });
    const [activeTab, setActiveTab] = useState('messages');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const [selected, setSelected] = useState(null);
    const [reply, setReply] = useState('');
    const [replying, setReplying] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const closeButtonRef = useRef(null);

    const isAppeal = activeTab === 'appeals';
    const currentItems = isAppeal ? appeals : messages;

    useEffect(() => {
        if (loadedTabs[activeTab]) return;
        let cancelled = false;
        const load = async () => {
            setLoading(true);
            setError('');
            try {
                const response = isAppeal ? await api.getAppeals() : await api.getMessages();
                if (cancelled) return;
                if (isAppeal) {
                    const records = getCollection(response, 'user_appeals').length
                        ? getCollection(response, 'user_appeals')
                        : getCollection(response, 'appeals');
                    setAppeals(records.map(normalizeAppeal));
                } else {
                    setMessages(getCollection(response, 'messages').map((message) => ({ ...message, recordType: 'message' })));
                }
                setLoadedTabs((tabs) => ({ ...tabs, [activeTab]: true }));
            } catch (loadError) {
                console.error('Error loading message workspace:', loadError);
                if (!cancelled) setError(`Couldn't load ${isAppeal ? 'appeals' : 'messages'}. Please try again.`);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, [activeTab, api, isAppeal, loadedTabs]);

    useEffect(() => {
        if (!selected) return;
        const handleKeyDown = (event) => {
            if (event.key === 'Escape' && !replying) setSelected(null);
        };
        document.addEventListener('keydown', handleKeyDown);
        closeButtonRef.current?.focus();
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [replying, selected]);

    const switchTab = (tab) => {
        setActiveTab(tab);
        setFilter('all');
        setSelected(null);
        setReply('');
    };

    const openItem = (item) => {
        setSelected(item);
        setReply(item.admin_response || '');
        if (item.recordType === 'appeal' || item.is_read) return;
        api.markRead(item.id).then(() => {
            setMessages((items) => items.map((message) => message.id === item.id ? { ...message, is_read: true } : message));
            setSelected((current) => current?.id === item.id ? { ...current, is_read: true } : current);
        }).catch((readError) => console.error('Error marking message as read:', readError));
    };

    const markAllRead = async () => {
        if (isAppeal) return;
        try {
            await api.markAllRead();
            setMessages((items) => items.map((message) => ({ ...message, is_read: true })));
            setSelected((item) => item ? { ...item, is_read: true } : item);
            notify.success('All messages marked as read.');
        } catch (readError) {
            console.error('Error marking all messages as read:', readError);
            notify.error("Couldn't mark messages as read.");
        }
    };

    const sendReply = async () => {
        if (isAppeal || selected?.recordType !== 'message' || !reply.trim()) return;
        setReplying(true);
        try {
            const responseText = reply.trim();
            await api.respond(selected.id, responseText);
            setMessages((items) => items.map((message) => message.id === selected.id
                ? { ...message, admin_response: responseText, is_read: true }
                : message));
            setSelected((item) => ({ ...item, admin_response: responseText, is_read: true }));
            notify.success('Reply sent.');
        } catch (replyError) {
            console.error('Error sending reply:', replyError);
            notify.error(replyError.message || "Couldn't send reply.");
        } finally {
            setReplying(false);
        }
    };

    const deleteMessage = async () => {
        if (!deleteTarget || deleteTarget.recordType !== 'message' || isAppeal) return;
        setDeleting(true);
        try {
            await api.delete(deleteTarget.id);
            setMessages((items) => items.filter((message) => message.id !== deleteTarget.id));
            setSelected(null);
            setDeleteTarget(null);
            notify.success('Message removed.');
        } catch (deleteError) {
            console.error('Error deleting message:', deleteError);
            notify.error(deleteError.message || "Couldn't remove message.");
        } finally {
            setDeleting(false);
        }
    };

    const query = (globalSearch || search).trim().toLowerCase();
    const filteredItems = currentItems.filter((item) => {
        const matchesSearch = !query || [item.sender_name, item.sender_email, item.subject, item.content]
            .some((value) => value?.toLowerCase().includes(query));
        const matchesFilter = filter === 'all'
            || (isAppeal ? item.status === filter : (
                (filter === 'unread' && !item.is_read)
                || (filter === 'read' && item.is_read)
                || (filter === 'replied' && item.admin_response)
            ));
        return matchesSearch && matchesFilter;
    });

    const messageUnread = messages.filter((message) => !message.is_read).length;
    const pendingAppeals = appeals.filter((appeal) => appeal.status === 'pending').length;

    const detail = selected && (
        <article className="flex h-full min-h-0 flex-col bg-white" aria-labelledby="message-detail-title">
            <header className="flex items-start justify-between gap-4 border-b border-green-100 p-5 sm:p-6">
                <div className="flex min-w-0 items-center gap-3">
                    <Avatar item={selected} />
                    <div className="min-w-0">
                        <p className="truncate font-bold text-gray-900">{selected.sender_name}</p>
                        <p className="truncate text-sm text-gray-500">{selected.sender_email || 'No email provided'}</p>
                    </div>
                </div>
                <button ref={closeButtonRef} type="button" onClick={() => setSelected(null)} aria-label="Close details" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 lg:hidden">
                    <X className="h-5 w-5" />
                </button>
            </header>

            <div className="flex-1 overflow-y-auto p-5 sm:p-6">
                <div className="mb-4 flex flex-wrap items-center gap-2">
                    <StatusBadge item={selected} isAppeal={isAppeal} />
                    <span className="text-xs font-medium text-gray-500">{new Date(selected.created_at).toLocaleString()}</span>
                </div>
                <h2 id="message-detail-title" className="text-xl font-black tracking-tight text-gray-900 sm:text-2xl">{selected.subject}</h2>
                <p className="mt-5 whitespace-pre-wrap text-[15px] leading-7 text-gray-700">{selected.content || 'No message content provided.'}</p>

                {selected.suspension_reason && isAppeal && (
                    <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Suspension reason</p>
                        <p className="mt-2 text-sm leading-6 text-gray-700">{selected.suspension_reason}</p>
                    </div>
                )}

                {isAppeal ? (
                    <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                        <p className="font-bold">Appeals are read-only here</p>
                        <p className="mt-1">Use the Appeals or user management review workflow to approve or reject this request. Message actions do not apply to appeal records.</p>
                        {selected.admin_response && <p className="mt-3 border-t border-amber-200 pt-3"><strong>Review response:</strong> {selected.admin_response}</p>}
                    </div>
                ) : (
                    <div className="mt-7 border-t border-green-100 pt-6">
                        <label htmlFor="message-reply" className="text-sm font-bold text-gray-900">Reply to {selected.sender_name}</label>
                        <textarea
                            id="message-reply"
                            value={reply}
                            onChange={(event) => setReply(event.target.value)}
                            rows={5}
                            placeholder="Write a clear, helpful response..."
                            className="mt-3 w-full resize-y rounded-xl border border-green-200 bg-green-50/50 px-4 py-3 text-sm leading-6 text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
                        />
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                            <button type="button" onClick={() => setDeleteTarget(selected)} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-50">
                                <Trash className="h-4 w-4" /> Delete
                            </button>
                            <button type="button" onClick={sendReply} disabled={replying || !reply.trim()} className="inline-flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50">
                                {replying ? <Loader className="h-4 w-4 animate-spin" /> : <Reply className="h-4 w-4" />}
                                {replying ? 'Sending...' : selected.admin_response ? 'Update reply' : 'Send reply'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </article>
    );

    return (
        <div className="space-y-5">
            <div className="flex flex-col justify-between gap-4 rounded-2xl border border-green-400 bg-gradient-to-r from-green-300 via-green-400 to-green-500 p-5 text-gray-900 shadow-sm sm:flex-row sm:items-end sm:p-7">
                <div>
                    <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-green-950">
                        <Envelope className="h-4 w-4" /> Communications
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-gray-900">Messages</h1>
                    <p className="mt-1 text-sm text-green-950/80">Manage user conversations as {roleLabel}.</p>
                </div>
                {!isAppeal && messageUnread > 0 && (
                    <button type="button" onClick={markAllRead} className="inline-flex items-center justify-center gap-2 rounded-xl border border-green-200 bg-white px-4 py-2.5 text-sm font-bold text-green-800 shadow-sm hover:bg-green-50">
                        <Check className="h-4 w-4" /> Mark all read ({messageUnread})
                    </button>
                )}
            </div>

            <div className="rounded-2xl border border-green-100 bg-white p-2 shadow-sm">
                <div className="grid grid-cols-2 gap-2" role="tablist" aria-label="Communication type">
                    <button type="button" role="tab" aria-selected={!isAppeal} onClick={() => switchTab('messages')} className={`rounded-xl px-4 py-3 text-left transition ${!isAppeal ? 'bg-green-600 text-white shadow-sm' : 'text-gray-600 hover:bg-green-50'}`}>
                        <span className="flex items-center justify-between gap-2"><span className="font-bold">Inbox</span><span className={`rounded-full px-2 py-0.5 text-xs font-bold ${!isAppeal ? 'bg-white/20' : 'bg-gray-100'}`}>{messages.length}</span></span>
                        <span className={`mt-0.5 block text-xs ${!isAppeal ? 'text-green-50' : 'text-gray-400'}`}>{messageUnread} unread</span>
                    </button>
                    <button type="button" role="tab" aria-selected={isAppeal} onClick={() => switchTab('appeals')} className={`rounded-xl px-4 py-3 text-left transition ${isAppeal ? 'bg-amber-500 text-white shadow-sm' : 'text-gray-600 hover:bg-amber-50'}`}>
                        <span className="flex items-center justify-between gap-2"><span className="font-bold">Appeals</span><span className={`rounded-full px-2 py-0.5 text-xs font-bold ${isAppeal ? 'bg-white/20' : 'bg-gray-100'}`}>{appeals.length}</span></span>
                        <span className={`mt-0.5 block text-xs ${isAppeal ? 'text-amber-50' : 'text-gray-400'}`}>{pendingAppeals} pending, read-only</span>
                    </button>
                </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
                <label className="relative flex-1">
                    <span className="sr-only">Search {isAppeal ? 'appeals' : 'messages'}</span>
                    <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${isAppeal ? 'appeals' : 'messages'}...`} className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100" />
                </label>
                <label>
                    <span className="sr-only">Filter results</span>
                    <select value={filter} onChange={(event) => setFilter(event.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 outline-none focus:border-green-500 sm:w-44">
                        <option value="all">All ({currentItems.length})</option>
                        {isAppeal ? <><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></> : <><option value="unread">Unread</option><option value="read">Read</option><option value="replied">Replied</option></>}
                    </select>
                </label>
            </div>

            {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">{error}</div>}

            <div className="grid min-h-[560px] overflow-hidden rounded-2xl border border-green-100 bg-white shadow-sm lg:grid-cols-[minmax(320px,42%)_1fr]">
                <section className="min-w-0 border-green-100 lg:border-r" aria-label={isAppeal ? 'Appeals list' : 'Messages list'}>
                    <div className="border-b border-green-100 px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">{filteredItems.length} {filteredItems.length === 1 ? 'result' : 'results'}</div>
                    {loading ? (
                        <div className="flex h-72 items-center justify-center"><Loader className="h-7 w-7 animate-spin text-green-600" aria-label="Loading" /></div>
                    ) : filteredItems.length === 0 ? (
                        <div className="flex h-72 flex-col items-center justify-center p-8 text-center">
                            <div className="rounded-full bg-green-50 p-4 text-green-700">{isAppeal ? <AlertTriangle className="h-6 w-6" /> : <Envelope className="h-6 w-6" />}</div>
                            <p className="mt-4 font-bold text-gray-800">No matching {isAppeal ? 'appeals' : 'messages'}</p>
                            <p className="mt-1 text-sm text-gray-500">Try a different search or filter.</p>
                        </div>
                    ) : (
                        <div className="max-h-[620px] divide-y divide-green-50 overflow-y-auto">
                            {filteredItems.map((item) => (
                                <button key={item.id} type="button" onClick={() => openItem(item)} aria-pressed={selected?.id === item.id} className={`flex w-full items-start gap-3 p-4 text-left transition hover:bg-green-50/70 ${selected?.id === item.id ? 'bg-green-50 ring-inset lg:ring-2 lg:ring-green-400' : ''} ${!isAppeal && !item.is_read ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-transparent'}`}>
                                    <Avatar item={item} />
                                    <span className="min-w-0 flex-1">
                                        <span className="flex items-start justify-between gap-2">
                                            <span className="truncate font-bold text-gray-900">{item.sender_name}</span>
                                            <span className="shrink-0 text-xs text-gray-400">{formatShortDate(item.created_at)}</span>
                                        </span>
                                        <span className="mt-1 flex items-center gap-2"><span className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-700">{item.subject}</span><StatusBadge item={item} isAppeal={isAppeal} /></span>
                                        <span className="mt-1 block truncate text-sm text-gray-500">{item.content || 'No content'}</span>
                                    </span>
                                    <ChevronRight className="mt-3 h-4 w-4 shrink-0 text-gray-300 lg:hidden" />
                                </button>
                            ))}
                        </div>
                    )}
                </section>

                <section className="hidden min-w-0 lg:block" aria-label="Selected item details">
                    {detail || <div className="flex h-full min-h-[560px] flex-col items-center justify-center p-10 text-center"><Envelope className="h-9 w-9 text-green-300" /><p className="mt-4 font-bold text-gray-700">Select an item to open it</p><p className="mt-1 max-w-xs text-sm text-gray-500">Read the full conversation and respond without leaving this workspace.</p></div>}
                </section>
            </div>

            {selected && (
                <div className="fixed inset-0 z-[180] lg:hidden" role="dialog" aria-modal="true" aria-labelledby="message-detail-title">
                    <button type="button" aria-label="Close details" onClick={() => setSelected(null)} className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" />
                    <div className="absolute inset-x-0 bottom-0 max-h-[92dvh] overflow-hidden rounded-t-3xl bg-white shadow-2xl">{detail}</div>
                </div>
            )}

            <ConfirmationModal
                isOpen={Boolean(deleteTarget)}
                title="Delete message?"
                message="This permanently removes the message and cannot be undone."
                confirmLabel="Delete message"
                onConfirm={deleteMessage}
                onClose={() => !deleting && setDeleteTarget(null)}
                danger
                loading={deleting}
            />
        </div>
    );
};

export default MessageWorkspace;
