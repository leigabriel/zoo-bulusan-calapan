import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ReactLenis } from 'lenis/react';
import { getAuthHeaders, API_BASE_URL } from '../../../services/api-client';

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

const VoiceIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
);

const Modal = ({ title, subtitle, cancelLabel, confirmLabel, onCancel, onConfirm }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(33,38,49,0.2)', backdropFilter: 'blur(6px)' }} onClick={onCancel}>
        <div className="rounded-2xl p-8 w-80 flex flex-col gap-6" style={{ background: '#ebebeb', border: '1px solid #d4d4d4' }} onClick={e => e.stopPropagation()}>
            <div className="flex flex-col gap-1">
                <p className="text-xl font-bold" style={{ color: '#212631' }}>{title}</p>
                <p className="text-base" style={{ color: '#888' }}>{subtitle}</p>
            </div>
            <div className="flex gap-3">
                <button onClick={onCancel} className="flex-1 py-3 rounded-xl text-base font-semibold transition-all active:scale-95" style={{ background: '#dcdcdc', color: '#212631' }}>
                    {cancelLabel}
                </button>
                <button onClick={onConfirm} className="flex-1 py-3 rounded-xl text-base font-semibold transition-all active:scale-95" style={{ background: '#212631', color: '#ebebeb' }}>
                    {confirmLabel}
                </button>
            </div>
        </div>
    </div>
);

const AssistantAvatar = ({ role = 'staff' }) => (
    <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0" style={{ background: role === 'admin' ? '#d8f5d0' : '#dcdcdc' }}>
        <img src="/zusan.gif" alt="Companion" className="w-full h-full object-cover p-1" />
    </div>
);

const ROLE_CONFIG = {
    admin: {
        name: 'Zusan AdminOps',
        status: 'Admin Companion · Online',
        introTitle: 'Admin Companion is ready.',
        introText: 'I help with operations planning, KPI interpretation, team alignment, and moderation policy decisions for Zoo Bulusan.',
        greeting: "Magandang araw. I am your Admin Companion. I can help with priorities, reporting, escalations, and strategic actions for the admin panel.",
        suggestions: [
            'Give me today\'s admin priorities.',
            'Draft a short action plan for reservations and staffing.',
            'How should I triage community moderation issues?'
        ],
        placeholder: 'Ask your admin companion...'
    },
    staff: {
        name: 'Zusan StaffMate',
        status: 'Staff Companion · Online',
        introTitle: 'Staff Companion is ready.',
        introText: 'I help with daily shift tasks, reservation verification, moderation workflows, and quick operational checklists.',
        greeting: "Mabuhay. I am your Staff Companion. I can help you with shift tasks, reservation checks, and moderation workflows in the staff portal.",
        suggestions: [
            'What should I check first this shift?',
            'Give me a checklist for reservation verification.',
            'How do I handle a reported community comment?'
        ],
        placeholder: 'Ask your staff companion...'
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

const detectMessageLanguage = (text = '') => {
    const normalized = String(text || '').toLowerCase();
    const tagalogSignals = [
        'ang', 'mga', 'sa', 'ng', 'si', 'namin', 'natin', 'ako', 'ikaw', 'kayo',
        'paki', 'pwede', 'maaari', 'salamat', 'kamusta', 'kumusta', 'ano', 'saan',
        'kailan', 'paano', 'bakit', 'gusto', 'kailangan', 'tulong', 'opo', 'po'
    ];

    const hitCount = tagalogSignals.reduce((count, word) => {
        const regex = new RegExp(`\\b${word}\\b`, 'i');
        return regex.test(normalized) ? count + 1 : count;
    }, 0);

    return hitCount >= 2 ? 'tl-PH' : 'en-US';
};

const pickPreferredVoice = (voices, langTag = 'en-US') => {
    if (!voices || voices.length === 0) return null;

    const femaleHints = ['female', 'zira', 'aria', 'jenny', 'samantha', 'hazel', 'katya', 'rose'];
    const accentHints = langTag === 'tl-PH'
        ? ['philippine', 'filipino', 'tagalog', 'tl-ph']
        : ['uk', 'british', 'australia', 'india', 'english'];

    const byLang = voices.filter(v => (v.lang || '').toLowerCase().startsWith(langTag.slice(0, 2).toLowerCase()));
    const voicePool = byLang.length > 0 ? byLang : voices;

    const exactAccentFemale = voicePool.find(v => {
        const name = (v.name || '').toLowerCase();
        const lang = (v.lang || '').toLowerCase();
        return accentHints.some(h => name.includes(h) || lang.includes(h)) && femaleHints.some(h => name.includes(h));
    });
    if (exactAccentFemale) return exactAccentFemale;

    const femaleByName = voicePool.find(v => femaleHints.some(h => (v.name || '').toLowerCase().includes(h)));
    if (femaleByName) return femaleByName;

    const accentByName = voicePool.find(v => {
        const name = (v.name || '').toLowerCase();
        const lang = (v.lang || '').toLowerCase();
        return accentHints.some(h => name.includes(h) || lang.includes(h));
    });
    if (accentByName) return accentByName;

    return voicePool[0] || voices[0] || null;
};

const RoleCompanionAssistant = ({ onClose, role = 'staff' }) => {
    const normalizedRole = role === 'admin' ? 'admin' : 'staff';
    const config = ROLE_CONFIG[normalizedRole];

    const [started, setStarted] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [showCloseConfirm, setShowCloseConfirm] = useState(false);
    const [showSidebarModal, setShowSidebarModal] = useState(false);
    const [speakingMessageIndex, setSpeakingMessageIndex] = useState(null);
    const [ttsSupported, setTtsSupported] = useState(false);
    const [availableVoices, setAvailableVoices] = useState([]);

    const messagesEndRef = useRef(null);
    const panelRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    useEffect(() => {
        const handleOutside = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target) && !showCloseConfirm && !showSidebarModal && window.innerWidth >= 768) {
                setShowSidebarModal(true);
            }
        };
        document.addEventListener('mousedown', handleOutside);
        return () => document.removeEventListener('mousedown', handleOutside);
    }, [showCloseConfirm, showSidebarModal]);

    useEffect(() => {
        const hasSupport = typeof window !== 'undefined' && 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance !== 'undefined';
        setTtsSupported(hasSupport);
        if (!hasSupport) return undefined;

        const updateVoices = () => {
            setAvailableVoices(window.speechSynthesis.getVoices() || []);
        };

        updateVoices();
        window.speechSynthesis.onvoiceschanged = updateVoices;

        return () => {
            window.speechSynthesis.onvoiceschanged = null;
            window.speechSynthesis.cancel();
            setSpeakingMessageIndex(null);
        };
    }, []);

    const assistantIdentity = useMemo(() => config.name, [config.name]);

    const stopSpeech = () => {
        if (!ttsSupported) return;
        window.speechSynthesis.cancel();
        setSpeakingMessageIndex(null);
    };

    const speakMessage = (content, index) => {
        if (!ttsSupported || !content) return;

        if (speakingMessageIndex === index && window.speechSynthesis.speaking) {
            stopSpeech();
            return;
        }

        window.speechSynthesis.cancel();

        const utterance = new window.SpeechSynthesisUtterance(content);
        const langTag = detectMessageLanguage(content);
        utterance.lang = langTag;

        const selectedVoice = pickPreferredVoice(availableVoices, langTag);
        if (selectedVoice) utterance.voice = selectedVoice;

        const expressive = /!|\?|important|urgent|salamat|mabuhay|mahalaga/i.test(content);
        utterance.pitch = expressive ? 1.25 : 1.15;
        utterance.rate = expressive ? 0.98 : 0.92;
        utterance.volume = 1;

        utterance.onstart = () => setSpeakingMessageIndex(index);
        utterance.onend = () => setSpeakingMessageIndex(null);
        utterance.onerror = () => setSpeakingMessageIndex(null);

        window.speechSynthesis.speak(utterance);
    };

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
            setMessages(prev => [...prev, { role: 'assistant', content: cleanAssistantText(assistantText) }]);
        } catch {
            setMessages(prev => [...prev, { role: 'assistant', content: cleanAssistantText('Network error. Please check your connection.') }]);
        } finally {
            setLoading(false);
        }
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
            {showCloseConfirm && (
                <Modal
                    title={`Close ${assistantIdentity}?`}
                    subtitle="Your conversation will not be saved."
                    cancelLabel="Cancel"
                    confirmLabel="Close"
                    onCancel={() => setShowCloseConfirm(false)}
                    onConfirm={() => {
                        stopSpeech();
                        onClose();
                    }}
                />
            )}
            {showSidebarModal && (
                <Modal
                    title={`Leave ${assistantIdentity}?`}
                    subtitle="You clicked outside the chat."
                    cancelLabel="Stay"
                    confirmLabel="Close"
                    onCancel={() => setShowSidebarModal(false)}
                    onConfirm={() => {
                        stopSpeech();
                        onClose();
                    }}
                />
            )}

            <div ref={panelRef} className="h-full flex flex-col overflow-hidden" style={{ background: '#ebebeb', color: '#212631' }}>

                <div className="px-7 pt-8 pb-6 flex items-center justify-between shrink-0" style={{ borderBottom: '1px solid #d4d4d4' }}>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-10 h-10 rounded-xl overflow-hidden" style={{ background: '#dcdcdc' }}>
                                <img src="/zusan.gif" alt={assistantIdentity} className="w-full h-full object-cover p-1" />
                            </div>
                            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2" style={{ background: '#4ade80', borderColor: '#ebebeb' }} />
                        </div>
                        <div>
                            <p className="text-base font-bold" style={{ color: '#212631' }}>{assistantIdentity}</p>
                            <p className="text-sm" style={{ color: '#999' }}>{config.status}</p>
                        </div>
                    </div>
                    <button onClick={() => setShowCloseConfirm(true)} className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90" style={{ background: '#dcdcdc', color: '#666' }}>
                        <CloseIcon />
                    </button>
                </div>

                {!started ? (
                    <div className="flex-1 flex flex-col px-7 py-10 overflow-y-auto">
                        <div className="flex-1 flex flex-col gap-10">
                            <div className="w-16 h-16 rounded-2xl overflow-hidden" style={{ background: '#dcdcdc' }}>
                                <img src="/zusan.gif" alt={assistantIdentity} className="w-full h-full object-cover p-2" />
                            </div>

                            <div className="flex flex-col gap-3">
                                <p className="text-3xl font-bold leading-tight" style={{ color: '#212631' }}>
                                    {config.introTitle}
                                </p>
                                <p className="text-lg leading-relaxed" style={{ color: '#777' }}>
                                    {config.introText}
                                </p>
                            </div>

                            <div className="flex flex-col gap-3">
                                <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: '#aaa' }}>Try asking</p>
                                {config.suggestions.map((q) => (
                                    <button
                                        key={q}
                                        onClick={() => handleSend(q)}
                                        className="text-left px-5 py-4 rounded-2xl text-base font-medium transition-all active:scale-98 hover:opacity-80"
                                        style={{ background: '#fff', color: '#212631', border: '1px solid #d4d4d4' }}
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mt-10 flex items-center gap-3 px-5 py-3 rounded-2xl" style={{ background: '#fff', border: '1px solid #d4d4d4' }}>
                            <input
                                type="text"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyPress={e => e.key === 'Enter' && handleSend()}
                                placeholder={config.placeholder}
                                className="flex-1 bg-transparent outline-none text-base font-medium py-1.5"
                                style={{ color: '#212631' }}
                            />
                            <button
                                onClick={() => handleSend()}
                                disabled={!input.trim() || loading}
                                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90 disabled:opacity-25"
                                style={{ background: '#212631', color: '#ebebeb' }}
                            >
                                <SendIcon />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 overflow-hidden relative">
                        <ReactLenis isChild className="h-full overflow-y-auto px-7 py-8">
                            <div className="flex flex-col gap-6 max-w-2xl mx-auto">
                                {messages.map((msg, i) => (
                                    <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'items-end'}`}>
                                        {msg.role === 'assistant' && <AssistantAvatar role={normalizedRole} />}
                                        <div className="max-w-[80%]">
                                            <div
                                                className="px-5 py-4 text-base leading-relaxed font-medium whitespace-pre-wrap break-words"
                                                style={msg.role === 'user'
                                                    ? { background: '#212631', color: '#ebebeb', borderRadius: '1rem 1rem 0.25rem 1rem' }
                                                    : { background: '#fff', color: '#212631', border: '1px solid #e0e0e0', borderRadius: '0.25rem 1rem 1rem 1rem' }
                                                }
                                            >
                                                {msg.content}
                                            </div>

                                            {msg.role === 'assistant' && (
                                                <button
                                                    type="button"
                                                    onClick={() => speakMessage(msg.content, i)}
                                                    disabled={!ttsSupported}
                                                    className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all disabled:opacity-40"
                                                    style={{
                                                        background: speakingMessageIndex === i ? '#212631' : '#fff',
                                                        color: speakingMessageIndex === i ? '#ebebeb' : '#212631',
                                                        borderColor: '#d4d4d4'
                                                    }}
                                                >
                                                    <VoiceIcon />
                                                    {speakingMessageIndex === i ? 'Stop Voice' : 'Text to Voice'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {loading && (
                                    <div className="flex items-end gap-3">
                                        <AssistantAvatar role={normalizedRole} />
                                        <div className="px-5 py-4 flex gap-1.5" style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '0.25rem 1rem 1rem 1rem' }}>
                                            {[0, 150, 300].map(d => (
                                                <span key={d} className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#bbb', animationDelay: `${d}ms` }} />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div ref={messagesEndRef} className="h-24" />
                            </div>
                        </ReactLenis>

                        <div className="absolute bottom-0 left-0 w-full px-7 pb-7 pt-10" style={{ background: 'linear-gradient(to top, #ebebeb 65%, transparent)' }}>
                            <div className="max-w-2xl mx-auto flex items-center gap-3 px-5 py-3 rounded-2xl" style={{ background: '#fff', border: '1px solid #d4d4d4' }}>
                                <input
                                    type="text"
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyPress={e => e.key === 'Enter' && handleSend()}
                                    placeholder={config.placeholder}
                                    className="flex-1 bg-transparent outline-none text-base font-medium py-1.5"
                                    style={{ color: '#212631' }}
                                />
                                <button
                                    onClick={() => handleSend()}
                                    disabled={!input.trim() || loading}
                                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90 disabled:opacity-25"
                                    style={{ background: '#212631', color: '#ebebeb' }}
                                >
                                    <SendIcon />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default RoleCompanionAssistant;
