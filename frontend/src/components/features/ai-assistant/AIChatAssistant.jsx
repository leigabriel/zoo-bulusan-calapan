import React, { useEffect, useRef, useState } from 'react';
import { ReactLenis } from 'lenis/react';
import { useNavigate } from 'react-router-dom';
import { AI_ASSISTANT_THEME } from '../../../config/ai-assistant-theme';
import { getAuthHeaders, API_BASE_URL } from '../../../services/api-client';
import TicketCard from './TicketCard';
import ZooCard from './ZooCard';

const THEME = AI_ASSISTANT_THEME;

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

const Avatar = () => (
    <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0" style={{ background: THEME.accentSoft }}>
        <img src="/zusan-ai.svg" alt="Zusan" className="w-full h-full object-contain p-1.5" />
    </div>
);

const SUGGESTIONS = [
    'What animals can I see today?',
    'When is feeding time?',
    'What plants are in your collection?',
    'Any upcoming events?',
    'Tell me about the conservation program.'
];

const GREETING = "Mabuhay! I'm Zusan. I'm here to guide you through the Calapan Bulusan Zoo. Ask me anything about our animals, exhibits, or how to get around.";

const createLocalSession = () => ({
    id: `local-chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: 'New chat',
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
});

const createConversationTitle = (message = '') => {
    const cleaned = String(message).replace(/\s+/g, ' ').trim();
    if (!cleaned) return 'New chat';
    return cleaned.length > 42 ? `${cleaned.slice(0, 42).trim()}...` : cleaned;
};

const sortSessions = sessions => [...sessions].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

const AIChatAssistant = ({ onClose }) => {
    const navigate = useNavigate();
    const [started, setStarted] = useState(false);
    const [messages, setMessages] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [activeSessionId, setActiveSessionId] = useState(null);
    const [sessionHydrated, setSessionHydrated] = useState(false);
    const [persistenceEnabled, setPersistenceEnabled] = useState(false);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [sessionSidebarOpen, setSessionSidebarOpen] = useState(false);
    const messagesEndRef = useRef(null);
    const panelRef = useRef(null);

    const activeSession = sessions.find(session => session.id === activeSessionId);

    useEffect(() => {
        const loadSessions = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/ai/sessions`, { headers: getAuthHeaders('user') });
                const data = await response.json();
                if (!response.ok || !data.success) throw new Error('Could not load sessions');

                setPersistenceEnabled(true);
                let loadedSessions = Array.isArray(data.sessions) ? data.sessions : [];
                if (loadedSessions.length === 0) {
                    const createResponse = await fetch(`${API_BASE_URL}/ai/sessions`, {
                        method: 'POST',
                        headers: getAuthHeaders('user'),
                        body: JSON.stringify({ title: 'New chat', messages: [] })
                    });
                    const createData = await createResponse.json();
                    loadedSessions = createData.success && createData.session ? [createData.session] : [];
                }
                if (loadedSessions.length > 0) {
                    const active = sortSessions(loadedSessions)[0];
                    setSessions(loadedSessions);
                    setActiveSessionId(active.id);
                    setMessages(active.messages || []);
                    setStarted((active.messages || []).length > 0);
                } else {
                    setPersistenceEnabled(false);
                    const freshSession = createLocalSession();
                    setSessions([freshSession]);
                    setActiveSessionId(freshSession.id);
                }
            } catch {
                const freshSession = createLocalSession();
                setSessions([freshSession]);
                setActiveSessionId(freshSession.id);
                setMessages([]);
                setStarted(false);
            } finally {
                setSessionHydrated(true);
            }
        };

        loadSessions();
    }, []);

    useEffect(() => {
        if (!sessionHydrated || !activeSessionId || !persistenceEnabled) return;

        setSessions(previous => previous.map(session => session.id === activeSessionId
            ? { ...session, messages, updatedAt: Date.now() }
            : session
        ));

        fetch(`${API_BASE_URL}/ai/sessions/${activeSessionId}`, {
            method: 'PUT',
            headers: getAuthHeaders('user'),
            body: JSON.stringify({ messages })
        }).catch(() => {
            // Keep the current conversation usable if saving is temporarily unavailable.
        });
    }, [activeSessionId, messages, persistenceEnabled, sessionHydrated]);

    useEffect(() => {
        if (!sessionHydrated || !activeSessionId || !messages.length) return;
        const firstUserMessage = messages.find(message => message.role === 'user')?.content;
        const currentSession = sessions.find(session => session.id === activeSessionId);
        if (!firstUserMessage || currentSession?.title !== 'New chat') return;

        const title = createConversationTitle(firstUserMessage);
        setSessions(previous => previous.map(session => session.id === activeSessionId ? { ...session, title } : session));
        if (persistenceEnabled) {
            fetch(`${API_BASE_URL}/ai/sessions/${activeSessionId}`, {
                method: 'PUT',
                headers: getAuthHeaders('user'),
                body: JSON.stringify({ title })
            }).catch(() => {
                // The title can be generated again on the next load if saving fails.
            });
        }
    }, [activeSessionId, messages, persistenceEnabled, sessionHydrated, sessions]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    const selectSession = session => {
        setActiveSessionId(session.id);
        setMessages(session.messages || []);
        setStarted((session.messages || []).length > 0);
        setInput('');
        setSessionSidebarOpen(false);
    };

    const startNewSession = async () => {
        if (!persistenceEnabled) {
            const freshSession = createLocalSession();
            setSessions(previous => [freshSession, ...previous]);
            setActiveSessionId(freshSession.id);
            setMessages([]);
            setStarted(false);
            setInput('');
            setSessionSidebarOpen(false);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/ai/sessions`, {
                method: 'POST',
                headers: getAuthHeaders('user'),
                body: JSON.stringify({ title: 'New chat', messages: [] })
            });
            const data = await response.json();
            if (!response.ok || !data.success || !data.session) return;
            setSessions(previous => [data.session, ...previous]);
            setActiveSessionId(data.session.id);
            setMessages([]);
            setStarted(false);
            setInput('');
            setSessionSidebarOpen(false);
        } catch {
            // Keep the current conversation selected if creating a new one fails.
        }
    };

    const deleteSession = async sessionId => {
        if (persistenceEnabled) {
            try {
                const response = await fetch(`${API_BASE_URL}/ai/sessions/${sessionId}`, {
                    method: 'DELETE',
                    headers: getAuthHeaders('user')
                });
                if (!response.ok) return;
            } catch {
                return;
            }
        }

        const remaining = sessions.filter(session => session.id !== sessionId);
        if (remaining.length === 0) {
            setSessions([]);
            await startNewSession();
            return;
        }

        setSessions(remaining);
        if (sessionId === activeSessionId) {
            const next = sortSessions(remaining)[0];
            setActiveSessionId(next.id);
            setMessages(next.messages || []);
            setStarted((next.messages || []).length > 0);
        }
        setInput('');
    };

    const sendToAPI = async (message, history) => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/ai/chat`, {
                method: 'POST',
                headers: getAuthHeaders('user'),
                body: JSON.stringify({ message, history: history.slice(-8) })
            });
            const data = await response.json();
            setMessages(previous => [...previous, {
                role: 'assistant',
                content: data.success ? data.response : "I'm having trouble connecting. Please try again.",
                cards: data.cards || [],
                action: data.action || null
            }]);
        } catch {
            setMessages(previous => [...previous, { role: 'assistant', content: 'Network error. Please check your connection.', cards: [], action: null }]);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async overrideMessage => {
        const userMessage = (overrideMessage || input).trim();
        if (!userMessage || loading) return;
        setInput('');
        const base = started ? messages : [{ role: 'assistant', content: GREETING }];
        if (!started) setStarted(true);
        const next = [...base, { role: 'user', content: userMessage }];
        setMessages(next);
        await sendToAPI(userMessage, next);
    };

    const handleAction = action => {
        if (!action?.href) return;
        onClose?.();
        navigate(action.href);
    };

    const renderComposer = () => (
        <div className="flex items-center gap-3 px-4 sm:px-5 py-2.5 sm:py-3 pb-[calc(0.625rem+env(safe-area-inset-bottom))] sm:pb-3 rounded-2xl shrink-0" style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}>
            <input
                type="text"
                value={input}
                onChange={event => setInput(event.target.value)}
                onKeyDown={event => event.key === 'Enter' && handleSend()}
                placeholder="Ask Zusan anything..."
                className="min-w-0 flex-1 bg-transparent outline-none text-base font-medium py-2"
                style={{ color: THEME.text }}
                aria-label="Message Zusan"
            />
            <button type="button" onClick={() => handleSend()} disabled={!input.trim() || loading} className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center transition-all active:scale-90 disabled:opacity-25" style={{ background: THEME.accentDark, color: '#142018' }} aria-label="Send message">
                <SendIcon />
            </button>
        </div>
    );

    return (
        <>
            <div ref={panelRef} className="relative h-full min-h-0 flex overflow-hidden" style={{ background: THEME.base, color: THEME.text }} data-lenis-prevent>
                {sessionSidebarOpen && <button type="button" aria-label="Close chat history" onClick={() => setSessionSidebarOpen(false)} className="fixed inset-0 z-20 bg-slate-950/20 md:hidden" />}

                <aside className={`${sessionSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} fixed md:relative inset-y-0 left-0 z-30 w-72 shrink-0 flex flex-col transition-transform duration-200 md:transition-none`} style={{ background: '#f7f8f6', borderRight: `1px solid ${THEME.border}` }} aria-label="Chat history">
                    <div className="pt-[max(1rem,env(safe-area-inset-top))] p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-bold" style={{ color: THEME.text }}>Chat history</p>
                            <p className="text-xs mt-0.5" style={{ color: THEME.textSoft }}>Your saved conversations</p>
                        </div>
                        <button type="button" onClick={() => setSessionSidebarOpen(false)} className="p-2 rounded-lg md:hidden" style={{ color: THEME.textMuted }} aria-label="Close chat history"><CloseIcon /></button>
                    </div>
                    <div className="px-3">
                        <button type="button" onClick={startNewSession} className="w-full min-h-11 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors" style={{ background: THEME.accentDark, color: '#142018' }}>
                            <PlusIcon /> New chat
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto px-2 py-4 space-y-1 overscroll-contain" data-lenis-prevent>
                        {sortSessions(sessions).map(session => (
                            <div key={session.id} className="group flex items-center gap-1 rounded-xl" style={{ background: session.id === activeSessionId ? THEME.accentSoft : 'transparent' }}>
                                <button type="button" onClick={() => selectSession(session)} className="min-w-0 flex-1 text-left px-3 py-3 text-sm truncate" style={{ color: THEME.text }}>
                                    {session.title || 'New chat'}
                                </button>
                                <button type="button" onClick={event => { event.stopPropagation(); deleteSession(session.id); }} className="mr-2 p-2 rounded-lg opacity-60 sm:opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity" style={{ color: THEME.textMuted }} aria-label={`Delete ${session.title || 'chat'}`}>
                                    <TrashIcon />
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="p-4 text-xs leading-relaxed" style={{ color: THEME.textSoft, borderTop: `1px solid ${THEME.border}` }}>
                        Chats are saved to your account and only visible to you.
                    </div>
                </aside>

                <div className="min-w-0 min-h-0 flex-1 flex flex-col overflow-hidden">
                    <header className="px-4 sm:px-7 pt-[max(1rem,env(safe-area-inset-top))] pb-4 sm:pb-6 flex items-center justify-between gap-4 shrink-0" style={{ borderBottom: `1px solid ${THEME.border}` }}>
                        <div className="flex items-center gap-3 min-w-0">
                            <button type="button" onClick={() => setSessionSidebarOpen(true)} className="p-2 -ml-2 rounded-lg md:hidden" style={{ color: THEME.textMuted }} aria-label="Open chat history"><MenuIcon /></button>
                            <div className="relative shrink-0">
                                <div className="w-10 h-10 rounded-xl overflow-hidden" style={{ background: THEME.accentSoft }}><img src="/zusan-ai.svg" alt="Zusan" className="w-full h-full object-contain p-1.5" /></div>
                                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2" style={{ background: THEME.accent, borderColor: THEME.base }} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-base font-bold" style={{ color: THEME.text }}>Zusan</p>
                                <p className="text-xs sm:text-sm truncate" style={{ color: THEME.textMuted }}>{activeSession?.title || 'Wildlife Guide · Online'}</p>
                            </div>
                        </div>
                        <button type="button" aria-label="Close Zusan AI assistant" onClick={() => onClose?.()} className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center transition-all active:scale-90" style={{ background: THEME.accentSoft, color: THEME.textMuted }}><CloseIcon /></button>
                    </header>

                    {!sessionHydrated ? (
                        <div className="flex-1 flex items-center justify-center p-6" style={{ color: THEME.textMuted }}>Loading your chats...</div>
                    ) : !started ? (
                        <div className="flex-1 min-h-0 flex flex-col px-4 sm:px-7 py-6 sm:py-10 overflow-y-auto overscroll-contain" data-lenis-prevent>
                            <div className="flex-1 flex flex-col gap-7 sm:gap-10">
                                <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0" style={{ background: THEME.accentSoft }}><img src="/zusan-ai.svg" alt="Zusan" className="w-full h-full object-contain p-2" /></div>
                                <div className="flex flex-col gap-3">
                                    <p className="text-2xl sm:text-3xl font-bold leading-tight" style={{ color: THEME.text }}>Meet Zusan,<br />your zoo guide.</p>
                                    <p className="text-base sm:text-lg leading-relaxed" style={{ color: THEME.textMuted }}>Zusan is an AI assistant for Calapan Bulusan Zoo. Ask about animals, feeding schedules, exhibits, and conservation, or anything about your visit.</p>
                                </div>
                                <div className="flex flex-col gap-3">
                                    <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: THEME.textSoft }}>Try asking</p>
                                    {SUGGESTIONS.map(question => <button key={question} type="button" onClick={() => handleSend(question)} className="w-full text-left px-4 sm:px-5 py-3.5 sm:py-4 rounded-2xl text-sm sm:text-base font-medium leading-snug transition-all active:scale-[0.99] hover:opacity-80" style={{ background: THEME.surface, color: THEME.text, border: `1px solid ${THEME.border}` }}>{question}</button>)}
                                </div>
                            </div>
                            <div className="mt-7 sm:mt-10">{renderComposer()}</div>
                        </div>
                    ) : (
                        <div className="flex-1 min-h-0 overflow-hidden relative">
                            <ReactLenis isChild className="h-full overflow-y-auto overscroll-contain px-4 sm:px-7 py-6 sm:py-8" data-lenis-prevent>
                                <div className="flex flex-col gap-5 sm:gap-6 max-w-2xl mx-auto min-w-0 pb-28">
                                    {messages.map((message, index) => {
                                        const isUser = message.role === 'user';
                                        return (
                                            <div key={`${message.role}-${index}`} className={`flex min-w-0 gap-2.5 sm:gap-3 ${isUser ? 'flex-row-reverse' : 'items-end'}`}>
                                                {!isUser && <Avatar />}
                                                <div className={`min-w-0 flex-1 flex flex-col gap-2.5 ${isUser ? 'items-end' : 'items-start'}`}>
                                                    {!isUser && <span className="px-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: THEME.textSoft }}>Zusan · wildlife guide</span>}
                                                    <div className="max-w-[88%] sm:max-w-[80%] px-4 sm:px-5 py-3.5 sm:py-4 text-sm sm:text-base leading-relaxed font-medium whitespace-pre-wrap break-words" style={isUser ? { background: THEME.accentDark, color: '#142018', borderRadius: '1rem 1rem 0.25rem 1rem' } : { background: THEME.surface, color: THEME.text, border: `1px solid ${THEME.border}`, borderRadius: '0.25rem 1rem 1rem 1rem', boxShadow: '0 2px 8px rgba(15,23,42,0.04)' }}>{message.content}</div>
                                                    {message.cards?.length > 0 && <div className="w-full flex flex-col gap-2.5">{message.cards.map((card, cardIndex) => card.kind === 'animal' || card.kind === 'plant' || card.kind === 'zoo-event' ? <ZooCard key={`${card.name || card.title || cardIndex}-${cardIndex}`} data={card} /> : <TicketCard key={`${card.reference || cardIndex}-${cardIndex}`} data={card} />)}</div>}
                                                    {message.action && <button type="button" onClick={() => handleAction(message.action)} className="inline-flex items-center gap-2 min-h-10 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 hover:opacity-90" style={message.action.variant === 'ghost' ? { background: THEME.surface, color: THEME.text, border: `1px solid ${THEME.border}` } : { background: THEME.accentDark, color: '#142018' }}>{message.action.label}</button>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {loading && <div className="flex items-end gap-2.5 sm:gap-3"><Avatar /><div className="px-5 py-4 flex gap-1.5 rounded-[0.25rem_1rem_1rem_1rem]" style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}>{[0, 150, 300].map(delay => <span key={delay} className="w-2 h-2 rounded-full animate-bounce" style={{ background: THEME.textSoft, animationDelay: `${delay}ms` }} />)}</div></div>}
                                    <div ref={messagesEndRef} className="h-12" />
                                </div>
                            </ReactLenis>
                            <div className="absolute bottom-0 left-0 w-full px-4 sm:px-7 pt-10 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-7" style={{ background: `linear-gradient(to top, ${THEME.base} 65%, transparent)` }}><div className="max-w-2xl mx-auto">{renderComposer()}</div></div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default AIChatAssistant;
