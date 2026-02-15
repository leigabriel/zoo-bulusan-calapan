import React, { useState, useRef, useEffect } from 'react';
import { ReactLenis } from 'lenis/react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const SendIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <line x1="22" y1="2" x2="11" y2="13" />
        <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
);

const CloseIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const ZooeyAvatar = () => (
    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden border-2 border-emerald-100 shadow-sm flex-shrink-0">
        <img
            src="https://images.unsplash.com/photo-1603415526960-f7e0328c63b1?auto=format&fit=crop&w=100&q=80"
            alt="Zooey Avatar"
            className="w-full h-full object-cover"
        />
    </div>
);

const AIChatAssistant = ({ onClose }) => {
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: "Mabuhay! I'm Zooey. I'm here to guide you through the Calapan Bulusan Zoo. How can I assist your journey today?"
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    useEffect(() => scrollToBottom(), [messages, loading]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;
        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/ai/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMsg, history: messages.slice(-5) })
            });
            const data = await response.json();
            if (data.success) {
                setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
            } else {
                setMessages(prev => [...prev, { role: 'assistant', content: "I'm having trouble connecting to the park's network. Please try again later." }]);
            }
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: "Network error. Please ensure you're connected to the internet." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-full flex flex-col bg-[#fcfdfd] relative">
            <header className="px-6 md:px-12 pt-10 md:pt-16 pb-6 relative z-10 bg-[#fcfdfd]/80 backdrop-blur-md">
                <div className="flex justify-between items-center mb-10">
                    <div className="flex items-center gap-3">
                        <ZooeyAvatar />
                        <div>
                            <div className="px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700">
                                Bulusan Intel
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 bg-white border border-emerald-100 text-emerald-950 rounded-full shadow-sm hover:bg-emerald-50 transition-all active:scale-90">
                        <CloseIcon />
                    </button>
                </div>
                <h1 className="text-4xl md:text-5xl font-serif text-emerald-950 leading-tight tracking-tight mb-2">Explore <br /> The Sanctuary</h1>
                <p className="text-lg md:text-xl font-serif text-emerald-800/40 italic">Nature is calling. Let's talk.</p>
            </header>

            <div className="flex-1 overflow-hidden px-6 md:px-12">
                <ReactLenis isChild className="h-full overflow-y-auto pr-2 custom-scrollbar">
                    <div className="space-y-12 pb-40 pt-4">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row items-start'}`}>
                                {msg.role === 'assistant' && <ZooeyAvatar />}
                                <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                    <span className={`text-[9px] font-bold uppercase tracking-widest mb-2 ${msg.role === 'user' ? 'text-emerald-500 mr-1' : 'text-emerald-900/30 ml-1'}`}>
                                        {msg.role === 'user' ? 'Explorer' : 'Zooey AI'}
                                    </span>
                                    <div className={`max-w-[95%] text-lg md:text-xl font-light leading-relaxed ${msg.role === 'user' ? 'text-emerald-900 text-right' : 'text-emerald-800'}`}>
                                        {msg.content}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div className="flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <ZooeyAvatar />
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-bold uppercase tracking-widest mb-2 text-emerald-500">
                                        Zooey is typing...
                                    </span>
                                    <div className="flex gap-1.5 px-3 py-2 bg-emerald-50/50 rounded-2xl rounded-tl-none border border-emerald-100/50">
                                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </ReactLenis>
            </div>

            <footer className="absolute bottom-0 left-0 w-full px-6 md:px-12 pb-8 md:pb-12 pt-6 bg-gradient-to-t from-[#fcfdfd] via-[#fcfdfd] to-transparent z-20">
                <div className="relative flex items-center bg-white border border-emerald-100 shadow-[0_20px_50px_rgba(6,78,59,0.05)] rounded-2xl p-2 transition-all focus-within:border-emerald-400 focus-within:shadow-[0_20px_50px_rgba(6,78,59,0.1)]">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Message Zooey..."
                        className="flex-1 bg-transparent px-5 py-3 text-base focus:outline-none text-emerald-950 placeholder-emerald-200"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || loading}
                        className="w-12 h-12 bg-emerald-600 text-white rounded-xl flex items-center justify-center hover:bg-emerald-700 disabled:opacity-20 transition-all shadow-lg shadow-emerald-200 active:scale-95"
                    >
                        <SendIcon />
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default AIChatAssistant;