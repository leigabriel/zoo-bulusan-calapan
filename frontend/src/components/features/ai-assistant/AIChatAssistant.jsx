import React, { useState, useRef, useEffect } from 'react';
import { ReactLenis } from 'lenis/react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const SendIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
);

const CloseIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const ZooeyAvatarSmall = () => (
    <div className="w-10 h-10 rounded-2xl overflow-hidden border-2 border-white shadow-md flex-shrink-0 bg-emerald-50">
        <img
            src="https://cdn-icons-png.flaticon.com/128/1864/1864472.png"
            alt="Zooey"
            className="w-full h-full object-cover p-1"
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
        <div className="h-full flex flex-col bg-white overflow-hidden">
            <header className="px-6 md:px-12 pt-12 pb-10 bg-white shrink-0 relative">
                <div className="flex justify-between items-start mb-10">
                    <div className="flex flex-col items-start gap-6">
                        <div className="relative group">
                            <div className="w-24 h-24 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-emerald-900/10 ring-8 ring-emerald-50/50 overflow-hidden transition-transform duration-500 hover:scale-105">
                                <img
                                    src="https://cdn-icons-png.flaticon.com/128/1864/1864472.png"
                                    className="w-20 h-20 object-contain p-2"
                                    alt="Zooey Large Logo"
                                />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full animate-pulse shadow-sm"></div>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-2xl font-black text-emerald-950 tracking-tighter">Zooey <span className="text-emerald-500">AI</span></h2>
                            </div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mt-1">Virtual Wildlife Expert</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-4 bg-gray-50 text-gray-400 rounded-3xl hover:bg-red-50 hover:text-red-500 transition-all active:scale-95 shadow-sm"
                    >
                        <CloseIcon />
                    </button>
                </div>

                <h1 className="text-4xl md:text-6xl font-black text-emerald-950 leading-[1] tracking-tighter max-w-md">
                    Explore the <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500">Zoo Sanctuary.</span>
                </h1>
            </header>

            <div className="flex-1 overflow-hidden relative bg-[#FBFBFC]">
                <ReactLenis isChild className="h-full overflow-y-auto px-6 md:px-12 py-8 custom-scrollbar">
                    <div className="max-w-4xl mx-auto space-y-12">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex gap-5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row items-end'}`}>
                                {msg.role === 'assistant' && <ZooeyAvatarSmall />}
                                <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div className={`px-7 py-5 text-base md:text-xl font-medium rounded-[2.5rem] leading-relaxed shadow-sm ${msg.role === 'user'
                                            ? 'bg-emerald-600 text-white rounded-br-none shadow-emerald-200'
                                            : 'bg-white text-emerald-950 border border-emerald-100/30 rounded-bl-none'
                                        }`}>
                                        {msg.content}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div className="flex items-end gap-4">
                                <ZooeyAvatarSmall />
                                <div className="bg-white border border-emerald-100/30 px-6 py-5 rounded-[2.5rem] rounded-bl-none shadow-sm flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                    <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                    <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-bounce" />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} className="h-40" />
                    </div>
                </ReactLenis>

                <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 bg-gradient-to-t from-[#FBFBFC] via-[#FBFBFC] to-transparent pointer-events-none">
                    <div className="max-w-4xl mx-auto pointer-events-auto">
                        <div className="relative flex items-center bg-white border border-emerald-100/50 shadow-2xl shadow-emerald-900/10 rounded-[3rem] p-3 transition-all focus-within:ring-8 focus-within:ring-emerald-500/5 focus-within:border-emerald-400 group">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Message Zooey..."
                                className="flex-1 bg-transparent px-8 py-4 text-emerald-950 placeholder-gray-300 outline-none font-bold text-lg md:text-xl"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || loading}
                                className="w-16 h-16 bg-emerald-600 text-white rounded-full flex items-center justify-center hover:bg-emerald-700 disabled:opacity-20 transition-all shadow-xl active:scale-90"
                            >
                                <SendIcon />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIChatAssistant;