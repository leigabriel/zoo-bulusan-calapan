import React, { useState, useRef, useEffect } from 'react';
import { ReactLenis } from 'lenis/react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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

const Avatar = () => (
    <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0" style={{ background: '#dcdcdc' }}>
        <img src="/zusan.gif" alt="Zusan" className="w-full h-full object-cover p-1" />
    </div>
);

const SUGGESTIONS = [
    "What animals can I see today?",
    "When is feeding time?",
    "Tell me about the conservation program."
];

const GREETING = "Mabuhay! I'm Zusan. I'm here to guide you through the Calapan Bulusan Zoo. Ask me anything about our animals, exhibits, or how to get around.";

const AIChatAssistant = ({ onClose }) => {
    const [started, setStarted] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [showCloseConfirm, setShowCloseConfirm] = useState(false);
    const [showSidebarModal, setShowSidebarModal] = useState(false);
    const messagesEndRef = useRef(null);
    const panelRef = useRef(null);
    const inputRef = useRef(null);

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

    const sendToAPI = async (msg, history) => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/ai/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: msg, history: history.slice(-5) })
            });
            const data = await response.json();
            setMessages(prev => [...prev, { role: 'assistant', content: data.success ? data.response : "I'm having trouble connecting. Please try again." }]);
        } catch {
            setMessages(prev => [...prev, { role: 'assistant', content: "Network error. Please check your connection." }]);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async (overrideMsg) => {
        const userMsg = (overrideMsg || input).trim();
        if (!userMsg || loading) return;
        setInput('');

        const base = started ? messages : [{ role: 'assistant', content: GREETING }];
        if (!started) setStarted(true);

        const next = [...base, { role: 'user', content: userMsg }];
        setMessages(next);
        await sendToAPI(userMsg, next);
    };

    return (
        <>
            {showCloseConfirm && (
                <Modal
                    title="Close Zusan?"
                    subtitle="Your conversation will not be saved."
                    cancelLabel="Cancel"
                    confirmLabel="Close"
                    onCancel={() => setShowCloseConfirm(false)}
                    onConfirm={onClose}
                />
            )}
            {showSidebarModal && (
                <Modal
                    title="Leave Zusan?"
                    subtitle="You clicked outside the chat."
                    cancelLabel="Stay"
                    confirmLabel="Close"
                    onCancel={() => setShowSidebarModal(false)}
                    onConfirm={onClose}
                />
            )}

            <div ref={panelRef} className="h-full flex flex-col overflow-hidden" style={{ background: '#ebebeb', color: '#212631' }}>

                <div className="px-7 pt-8 pb-6 flex items-center justify-between shrink-0" style={{ borderBottom: '1px solid #d4d4d4' }}>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-10 h-10 rounded-xl overflow-hidden" style={{ background: '#dcdcdc' }}>
                                <img src="/zusan.gif" alt="Zusan" className="w-full h-full object-cover p-1" />
                            </div>
                            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2" style={{ background: '#4ade80', borderColor: '#ebebeb' }} />
                        </div>
                        <div>
                            <p className="text-base font-bold" style={{ color: '#212631' }}>Zusan</p>
                            <p className="text-sm" style={{ color: '#999' }}>Wildlife Guide · Online</p>
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
                                <img src="/zusan.gif" alt="Zusan" className="w-full h-full object-cover p-2" />
                            </div>

                            <div className="flex flex-col gap-3">
                                <p className="text-3xl font-bold leading-tight" style={{ color: '#212631' }}>
                                    Meet Zusan,<br />your zoo guide.
                                </p>
                                <p className="text-lg leading-relaxed" style={{ color: '#777' }}>
                                    Zusan is an AI assistant for Calapan Bulusan Zoo. Ask about animals, feeding schedules, exhibits, and conservation — or anything about your visit.
                                </p>
                            </div>

                            <div className="flex flex-col gap-3">
                                <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: '#aaa' }}>Try asking</p>
                                {SUGGESTIONS.map((q) => (
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
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyPress={e => e.key === 'Enter' && handleSend()}
                                placeholder="Ask Zusan anything..."
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
                                        {msg.role === 'assistant' && <Avatar />}
                                        <div
                                            className="max-w-[80%] px-5 py-4 text-base leading-relaxed font-medium"
                                            style={msg.role === 'user'
                                                ? { background: '#212631', color: '#ebebeb', borderRadius: '1rem 1rem 0.25rem 1rem' }
                                                : { background: '#fff', color: '#212631', border: '1px solid #e0e0e0', borderRadius: '0.25rem 1rem 1rem 1rem' }
                                            }
                                        >
                                            {msg.content}
                                        </div>
                                    </div>
                                ))}

                                {loading && (
                                    <div className="flex items-end gap-3">
                                        <Avatar />
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
                                    placeholder="Ask Zusan anything..."
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

export default AIChatAssistant;
