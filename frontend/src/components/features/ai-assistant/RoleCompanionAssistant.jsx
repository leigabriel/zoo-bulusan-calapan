import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ReactLenis } from 'lenis/react';
import { useNavigate } from 'react-router-dom';
import { getAuthHeaders, API_BASE_URL } from '../../../services/api-client';
import { AI_ASSISTANT_ICON, AI_ASSISTANT_THEME } from '../../../config/ai-assistant-theme';
import ZooCard from './ZooCard';

const THEME = {
    ...AI_ASSISTANT_THEME,
    accent: '#00cd57',
    accentDark: '#00b84e',
    accentSoft: '#e6fbea'
};

const SendIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
);

const CloseIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const MenuIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-5 h-5">
        <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
);

const PlusIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
        <path d="M12 5v14M5 12h14" />
    </svg>
);

const TrashIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
    </svg>
);

const AssistantAvatar = ({ role = 'staff' }) => (
    <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0" style={{ background: role === 'admin' ? THEME.accentSoft : THEME.surfaceMuted }}>
        <img src={AI_ASSISTANT_ICON} alt="Companion" className="w-full h-full object-contain p-1.5" />
    </div>
);

const OperationalCard = ({ data }) => {
    const isEventReservation = data.kind === 'event';
    const label = isEventReservation ? 'Event reservation' : 'Ticket reservation';
    return (
        <div className="rounded-2xl p-4" style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}>
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: THEME.accentDark }}>{label}</p>
                    <p className="mt-1 text-sm font-bold truncate" style={{ color: THEME.text }}>{data.title || 'Reservation'}</p>
                </div>
                <span className="shrink-0 rounded-full px-2.5 py-1 text-[10px] uppercase font-bold" style={{ background: THEME.accentSoft, color: THEME.accentDark }}>
                    {data.status || 'pending'}
                </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs" style={{ color: THEME.textMuted }}>
                {data.reference && <div><span className="block text-[10px] uppercase" style={{ color: THEME.textSoft }}>Reference</span>{data.reference}</div>}
                {data.date && <div><span className="block text-[10px] uppercase" style={{ color: THEME.textSoft }}>Date</span>{data.date}</div>}
                {data.visitors !== undefined && <div><span className="block text-[10px] uppercase" style={{ color: THEME.textSoft }}>Visitors</span>{data.visitors}</div>}
                {data.participants !== undefined && <div><span className="block text-[10px] uppercase" style={{ color: THEME.textSoft }}>Participants</span>{data.participants}</div>}
            </div>
        </div>
    );
};

const ResponseCard = ({ data }) => {
    if (['animal', 'plant', 'zoo-event'].includes(data.kind)) return <ZooCard data={data} theme={THEME} />;
    return <OperationalCard data={data} />;
};

const ROLE_CONFIG = {
    admin: {
        name: 'AI Assist',
        status: 'Admin workspace · Online',
        introTitle: 'AI Assist is ready.',
        introText: 'Ask for operational summaries, current events, ticket and reservation lists, or a focused next-step plan.',
        greeting: "Magandang araw. I am AI Assist for the admin workspace. Ask for a safe operational summary or the next action.",
        suggestions: [
            'List current events and their status.',
            'Show today\'s ticket reservations.',
            'Summarize today\'s admin priorities.'
        ],
        placeholder: 'Ask AI Assist about operations...'
    },
    staff: {
        name: 'AI Assist',
        status: 'Staff workspace · Online',
        introTitle: 'AI Assist is ready.',
        introText: 'Ask for shift guidance, current events, ticket and reservation lists, or clear step-by-step actions.',
        greeting: "Mabuhay. I am AI Assist for the staff workspace. Tell me the task and I will give safe, practical steps.",
        suggestions: [
            'Give me my shift checklist.',
            'List pending ticket reservations.',
            'What are the current events?'
        ],
        placeholder: 'Ask AI Assist about operations...'
    }
};

const cleanAssistantText = (text = '') => {
    if (!text) return '';

    return String(text)
        .replace(/[•●○■□▪▫◆◇★☆→✓✔✦✧✨]/g, '-')
        .replace(/\p{Extended_Pictographic}/gu, '')
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
};

const createChatSession = () => ({
    id: `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: 'New chat',
    messages: [],
    updatedAt: Date.now()
});

const createConversationTitle = (message = '') => {
    const text = message.toLowerCase();
    const titleGroups = [
        { words: ['reservation', 'booking'], titles: ['Reservation Review', 'Booking Desk', 'Reservation Check'] },
        { words: ['ticket', 'tickets'], titles: ['Ticket Operations', 'Ticket Review', 'Visitor Tickets'] },
        { words: ['event', 'events', 'calendar'], titles: ['Event Planning', 'Event Schedule', 'Program Review'] },
        { words: ['animal', 'animals', 'plant', 'plants'], titles: ['Records Review', 'Zoo Records', 'Collection Notes'] },
        { words: ['staff', 'shift', 'priority', 'task'], titles: ['Daily Operations', 'Staff Planning', 'Operations Brief'] }
    ];
    const group = titleGroups.find(candidate => candidate.words.some(word => text.includes(word)));
    const titles = group?.titles || ['Operations Notes', 'Zoo Workspace', 'Quick Brief', 'Daily Review'];
    return titles[Math.floor(Math.random() * titles.length)];
};

const RoleCompanionAssistant = ({ onClose, role = 'staff' }) => {
    const normalizedRole = role === 'admin' ? 'admin' : 'staff';
    const config = ROLE_CONFIG[normalizedRole];
    const navigate = useNavigate();

    const [started, setStarted] = useState(false);
    const [messages, setMessages] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [activeSessionId, setActiveSessionId] = useState(null);
    const [sessionHydrated, setSessionHydrated] = useState(false);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [sessionSidebarOpen, setSessionSidebarOpen] = useState(false);

    const messagesEndRef = useRef(null);

    useEffect(() => {
        const loadSessions = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/ai/companion/sessions`, {
                    headers: getAuthHeaders(normalizedRole)
                });
                const data = await response.json();
                let parsedSessions = data.success && Array.isArray(data.sessions) ? data.sessions : [];

                if (parsedSessions.length === 0) {
                    const createResponse = await fetch(`${API_BASE_URL}/ai/companion/sessions`, {
                        method: 'POST',
                        headers: getAuthHeaders(normalizedRole),
                        body: JSON.stringify({ title: 'New chat', messages: [] })
                    });
                    const createData = await createResponse.json();
                    parsedSessions = createData.success && createData.session ? [createData.session] : [];
                }

                if (parsedSessions.length > 0) {
                    const active = parsedSessions[0];
                    setSessions(parsedSessions);
                    setActiveSessionId(active.id);
                    setMessages(active.messages || []);
                    setStarted((active.messages || []).length > 0);
                }
            } catch {
                const freshSession = createChatSession();
                setSessions([freshSession]);
                setActiveSessionId(freshSession.id);
                setMessages([]);
                setStarted(false);
            } finally {
                setSessionHydrated(true);
            }
        };

        loadSessions();
    }, [normalizedRole]);

    useEffect(() => {
        if (!sessionHydrated || !activeSessionId) return;

        setSessions(prev => prev.map(session => session.id === activeSessionId
            ? { ...session, messages, updatedAt: Date.now() }
            : session
        ));

        fetch(`${API_BASE_URL}/ai/companion/sessions/${activeSessionId}`, {
            method: 'PUT',
            headers: getAuthHeaders(normalizedRole),
            body: JSON.stringify({ messages })
        }).catch(() => {
            // Keep the conversation available in the current view if saving is temporarily unavailable.
        });
    }, [activeSessionId, messages, normalizedRole, sessionHydrated]);

    useEffect(() => {
        if (!sessionHydrated || !activeSessionId) return;
        const firstUserMessage = messages.find(message => message.role === 'user')?.content;
        if (!firstUserMessage) return;
        const currentSession = sessions.find(session => session.id === activeSessionId);
        if (currentSession?.title !== 'New chat') return;
        const title = createConversationTitle(firstUserMessage);

        setSessions(prev => prev.map(session => session.id === activeSessionId && session.title === 'New chat'
            ? { ...session, title }
            : session
        ));

        fetch(`${API_BASE_URL}/ai/companion/sessions/${activeSessionId}`, {
            method: 'PUT',
            headers: getAuthHeaders(normalizedRole),
            body: JSON.stringify({ title })
        }).catch(() => {
            // The active conversation remains usable if title saving is temporarily unavailable.
        });
    }, [activeSessionId, messages, normalizedRole, sessionHydrated, sessions]);

    const selectSession = (session) => {
        setActiveSessionId(session.id);
        setMessages(session.messages || []);
        setStarted((session.messages || []).length > 0);
        setInput('');
        setSessionSidebarOpen(false);
    };

    const startNewSession = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/ai/companion/sessions`, {
                method: 'POST',
                headers: getAuthHeaders(normalizedRole),
                body: JSON.stringify({ title: 'New chat', messages: [] })
            });
            const data = await response.json();
            if (!data.success || !data.session) return;
            const newSession = data.session;
            setSessions(prev => [newSession, ...prev]);
            setActiveSessionId(newSession.id);
            setMessages([]);
            setStarted(false);
            setInput('');
            setSessionSidebarOpen(false);
        } catch {
            // Do not switch away from the current conversation if creation fails.
        }
    };

    const deleteSession = async (sessionId) => {
        try {
            await fetch(`${API_BASE_URL}/ai/companion/sessions/${sessionId}`, {
                method: 'DELETE',
                headers: getAuthHeaders(normalizedRole)
            });
        } catch {
            return;
        }

        const remaining = sessions.filter(session => session.id !== sessionId);
        if (remaining.length === 0) {
            setSessions([]);
            await startNewSession();
            return;
        }

        setSessions(remaining);
        if (sessionId === activeSessionId) {
            const nextActive = remaining[0];
            setActiveSessionId(nextActive.id);
            setMessages(nextActive.messages || []);
            setStarted((nextActive.messages || []).length > 0);
        }
        setInput('');
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    const assistantIdentity = useMemo(() => config.name, [config.name]);
    const activeSession = sessions.find(session => session.id === activeSessionId);

    const sendToAPI = async (msg, history) => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/ai/companion/chat`, {
                method: 'POST',
                headers: getAuthHeaders(normalizedRole),
                body: JSON.stringify({ message: msg, history: history.slice(-8) })
            });
            const data = await response.json();
            const assistantText = data.success ? data.response : 'I could not process that request. Please try again.';
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: cleanAssistantText(assistantText),
                cards: data.cards || [],
                action: data.action || null
            }]);
        } catch {
            setMessages(prev => [...prev, { role: 'assistant', content: cleanAssistantText('Network error. Please check your connection.'), cards: [], action: null }]);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = (action) => {
        if (!action?.href) return;
        onClose?.();
        navigate(action.href);
    };

    const handleSend = async (overrideMsg) => {
        const userMsg = (overrideMsg || input).trim();
        if (!userMsg || loading) return;
        setInput('');

        const base = started ? messages : [{ role: 'assistant', content: config.greeting }];
        if (!started) setStarted(true);

        const next = [...base, { role: 'user', content: userMsg }];
        setMessages(next);
        await sendToAPI(userMsg, next);
    };

    return (
        <>
            <div className="relative h-full min-h-0 flex overflow-hidden" style={{ background: THEME.base, color: THEME.text }} data-lenis-prevent>
                {sessionSidebarOpen && (
                    <button
                        type="button"
                        aria-label="Close chat sessions"
                        onClick={() => setSessionSidebarOpen(false)}
                        className="fixed inset-0 z-20 bg-slate-950/20 md:hidden"
                    />
                )}

                <aside
                    className={`${sessionSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} fixed md:relative inset-y-0 left-0 z-30 w-72 shrink-0 flex flex-col transition-transform duration-200 md:transition-none`}
                    style={{ background: '#f7f8f6', borderRight: `1px solid ${THEME.border}` }}
                    aria-label="Chat sessions"
                >
                    <div className="p-4 flex items-center justify-between">
                        <p className="text-sm font-bold" style={{ color: THEME.text }}>Chat history</p>
                        <button
                            type="button"
                            onClick={() => setSessionSidebarOpen(false)}
                            className="p-2 rounded-lg md:hidden"
                            style={{ color: THEME.textMuted }}
                            aria-label="Close chat history"
                        >
                            <CloseIcon />
                        </button>
                    </div>
                    <div className="px-3">
                        <button
                            type="button"
                            onClick={startNewSession}
                            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                            style={{ background: THEME.accentDark, color: '#f7fff9' }}
                        >
                            <PlusIcon />
                            New chat
                        </button>
                    </div>
                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-4 space-y-1" data-lenis-prevent>
                        {[...sessions].sort((a, b) => b.updatedAt - a.updatedAt).map(session => (
                            <div
                                key={session.id}
                                className="group flex items-center gap-1 rounded-xl transition-colors"
                                style={{ background: session.id === activeSessionId ? THEME.accentSoft : 'transparent' }}
                            >
                                <button
                                    type="button"
                                    onClick={() => selectSession(session)}
                                    className="min-w-0 flex-1 text-left px-3 py-2.5 text-sm truncate"
                                    style={{ color: THEME.text }}
                                >
                                    {session.title || 'New chat'}
                                </button>
                                <button
                                    type="button"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        deleteSession(session.id);
                                    }}
                                    className="mr-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                                    style={{ color: THEME.textMuted }}
                                    aria-label={`Delete ${session.title || 'chat'}`}
                                >
                                    <TrashIcon />
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="p-4 text-xs leading-relaxed" style={{ color: THEME.textSoft, borderTop: `1px solid ${THEME.border}` }}>
                        Conversations are kept in this browser tab and separated by role.
                    </div>
                </aside>

                <div className="min-w-0 min-h-0 flex-1 flex flex-col overflow-hidden">

                <div className="px-4 sm:px-7 pt-5 sm:pt-8 pb-5 sm:pb-6 flex items-center justify-between shrink-0" style={{ borderBottom: `1px solid ${THEME.border}` }}>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setSessionSidebarOpen(true)}
                            className="p-2 rounded-lg md:hidden"
                            style={{ color: THEME.textMuted }}
                            aria-label="Open chat history"
                        >
                            <MenuIcon />
                        </button>
                        <div className="relative">
                            <div className="w-10 h-10 rounded-xl overflow-hidden" style={{ background: THEME.accentSoft }}>
                                <img src={AI_ASSISTANT_ICON} alt={assistantIdentity} className="w-full h-full object-contain p-1.5" />
                            </div>
                            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2" style={{ background: THEME.accent, borderColor: THEME.base }} />
                        </div>
                        <div>
                            <p className="text-base font-bold" style={{ color: THEME.text }}>{assistantIdentity}</p>
                            <p className="text-sm truncate max-w-[12rem]" style={{ color: THEME.textMuted }}>{activeSession?.title || config.status}</p>
                        </div>
                    </div>
                    <button onClick={() => onClose?.()} className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90" style={{ background: THEME.accentSoft, color: THEME.textMuted }} aria-label={`Close ${assistantIdentity}`}>
                        <CloseIcon />
                    </button>
                </div>

                {!started ? (
                    <div className="min-h-0 flex-1 flex flex-col px-7 py-10 overflow-y-auto overscroll-contain" data-lenis-prevent>
                        <div className="flex-1 flex flex-col gap-10">
                            <div className="w-16 h-16 rounded-2xl overflow-hidden" style={{ background: THEME.accentSoft }}>
                                <img src={AI_ASSISTANT_ICON} alt={assistantIdentity} className="w-full h-full object-contain p-2" />
                            </div>

                            <div className="flex flex-col gap-3">
                                <p className="text-3xl font-bold leading-tight" style={{ color: THEME.text }}>
                                    {config.introTitle}
                                </p>
                                <p className="text-lg leading-relaxed" style={{ color: THEME.textMuted }}>
                                    {config.introText}
                                </p>
                            </div>

                            <div className="flex flex-col gap-3">
                                <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: THEME.textSoft }}>Try asking</p>
                                {config.suggestions.map((q) => (
                                    <button
                                        key={q}
                                        onClick={() => handleSend(q)}
                                        className="text-left px-5 py-4 rounded-2xl text-base font-medium transition-all active:scale-98 hover:opacity-80"
                                        style={{ background: THEME.surface, color: THEME.text, border: `1px solid ${THEME.border}` }}
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mt-10 flex items-center gap-3 px-5 py-3 rounded-2xl" style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}>
                            <input
                                type="text"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyPress={e => e.key === 'Enter' && handleSend()}
                                placeholder={config.placeholder}
                                className="flex-1 bg-transparent outline-none text-base font-medium py-1.5"
                                style={{ color: THEME.text }}
                            />
                            <button
                                onClick={() => handleSend()}
                                disabled={!input.trim() || loading}
                                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90 disabled:opacity-25"
                                style={{ background: THEME.accentDark, color: '#f7fff9' }}
                            >
                                <SendIcon />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="min-h-0 flex-1 overflow-hidden relative" data-lenis-prevent>
                        <ReactLenis isChild className="h-full overflow-y-auto overscroll-contain px-7 py-8" data-lenis-prevent>
                            <div className="flex flex-col gap-6 max-w-2xl mx-auto">
                                {messages.map((msg, i) => (
                                    <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'items-end'}`}>
                                        {msg.role === 'assistant' && <AssistantAvatar role={normalizedRole} />}
                                        <div className="max-w-[80%]">
                                            <div
                                                className="px-5 py-4 text-base leading-relaxed font-medium whitespace-pre-wrap break-words"
                                                style={msg.role === 'user'
                                                    ? { background: THEME.accentDark, color: '#f7fff9', borderRadius: '1rem 1rem 0.25rem 1rem' }
                                                    : { background: THEME.surface, color: THEME.text, border: `1px solid ${THEME.border}`, borderRadius: '0.25rem 1rem 1rem 1rem' }
                                                }
                                            >
                                                {msg.content}
                                            </div>

                                            {msg.cards?.length > 0 && (
                                                <div className="w-full space-y-2">
                                                    {msg.cards.map((card, cardIndex) => (
                                                        <ResponseCard key={`${card.kind}-${card.reference || card.id || cardIndex}`} data={card} />
                                                    ))}
                                                </div>
                                            )}

                                            {msg.action && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleAction(msg.action)}
                                                    className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95"
                                                    style={msg.action.variant === 'ghost'
                                                        ? { background: THEME.surface, color: THEME.text, border: `1px solid ${THEME.border}` }
                                                        : { background: THEME.accentDark, color: '#f7fff9' }}
                                                >
                                                    {msg.action.label}
                                                </button>
                                            )}

                                        </div>
                                    </div>
                                ))}

                                {loading && (
                                    <div className="flex items-end gap-3">
                                        <AssistantAvatar role={normalizedRole} />
                                        <div className="px-5 py-4 flex gap-1.5" style={{ background: THEME.surface, border: `1px solid ${THEME.border}`, borderRadius: '0.25rem 1rem 1rem 1rem' }}>
                                            {[0, 150, 300].map(d => (
                                                <span key={d} className="w-2 h-2 rounded-full animate-bounce" style={{ background: THEME.textSoft, animationDelay: `${d}ms` }} />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div ref={messagesEndRef} className="h-24" />
                            </div>
                        </ReactLenis>

                        <div className="absolute bottom-0 left-0 w-full px-7 pb-7 pt-10" style={{ background: `linear-gradient(to top, ${THEME.base} 65%, transparent)` }}>
                            <div className="max-w-2xl mx-auto flex items-center gap-3 px-5 py-3 rounded-2xl" style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}>
                                <input
                                    type="text"
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyPress={e => e.key === 'Enter' && handleSend()}
                                    placeholder={config.placeholder}
                                    className="flex-1 bg-transparent outline-none text-base font-medium py-1.5"
                                    style={{ color: THEME.text }}
                                />
                                <button
                                    onClick={() => handleSend()}
                                    disabled={!input.trim() || loading}
                                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90 disabled:opacity-25"
                                    style={{ background: THEME.accentDark, color: '#f7fff9' }}
                                >
                                    <SendIcon />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                </div>
            </div>
        </>
    );
};

export default RoleCompanionAssistant;
