import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sanitizeInput } from '../../../utils/sanitize';

// Modern Icons
const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
    </svg>
);

const SparkleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"/>
    </svg>
);

const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd"/>
    </svg>
);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Animated AI Avatar Background
const AIAvatarBackground = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/95 via-emerald-800/90 to-teal-900/95 z-10"></div>
        
        {/* Abstract pattern background */}
        <div className="absolute inset-0 opacity-10">
            <svg viewBox="0 0 400 400" className="w-full h-full">
                <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/>
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)"/>
            </svg>
        </div>
        
        {/* Floating orbs animation */}
        <motion.div 
            className="absolute top-20 right-10 w-32 h-32 rounded-full bg-gradient-to-br from-emerald-400/20 to-teal-500/20 blur-2xl"
            animate={{ y: [0, -20, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
            className="absolute bottom-32 left-5 w-24 h-24 rounded-full bg-gradient-to-br from-cyan-400/20 to-emerald-500/20 blur-xl"
            animate={{ y: [0, 15, 0], x: [0, 10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        
        {/* AI Avatar Silhouette */}
        <div className="absolute bottom-0 right-0 w-64 h-80 opacity-15 z-0">
            <svg viewBox="0 0 200 300" fill="white" className="w-full h-full">
                <ellipse cx="100" cy="50" rx="35" ry="40" />
                <path d="M65 85 Q50 120 55 180 L145 180 Q150 120 135 85 Z" />
                <ellipse cx="100" cy="35" rx="25" ry="28" />
                <path d="M60 30 Q50 60 55 100 Q75 70 100 65 Q125 70 145 100 Q150 60 140 30 Q120 5 100 5 Q80 5 60 30" />
            </svg>
        </div>
    </div>
);

const AIChatAssistant = ({ embedded = false }) => {
    const [messages, setMessages] = useState([
        {
            id: 1,
            role: 'assistant',
            content: "Mabuhay! I'm Zooey, your AI assistant. I can help with:\n\n- Ticket prices and hours\n- Our animals and exhibits\n- Zoo zones and facilities\n- Events and activities\n\nHow can I assist you today?"
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        const newMessageId = Date.now();
        setInput('');
        setMessages(prev => [...prev, { id: newMessageId, role: 'user', content: userMessage }]);
        setLoading(true);
        setIsTyping(true);

        try {
            const response = await fetch(`${API_URL}/ai/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage,
                    history: messages.slice(-10)
                })
            });

            const data = await response.json();

            if (data.success) {
                const content = data.response + (data.source === 'fallback' ? '\n\n(AI service not configured)' : '');
                setMessages(prev => [...prev, { id: Date.now(), role: 'assistant', content }]);
            } else {
                setMessages(prev => [...prev, {
                    id: Date.now(),
                    role: 'assistant',
                    content: "I'm having trouble connecting. Please try again or contact info@zoobulusan.com"
                }]);
            }
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, {
                id: Date.now(),
                role: 'assistant',
                content: "Something went wrong. Please check your connection and try again."
            }]);
        } finally {
            setLoading(false);
            setIsTyping(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const quickQuestions = [
        "Ticket prices?",
        "What animals?",
        "Operating hours?",
        "How to book?"
    ];

    return (
        <div className="flex flex-col h-full relative overflow-hidden">
            <AIAvatarBackground />

            <div className="relative z-20 flex flex-col h-full">
                <div className="px-5 pt-5 pb-4"></ div>
                {/* Header
                <div className="px-5 pt-5 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                                <SparkleIcon />
                            </div>
                            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-emerald-900"></span>
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-lg flex items-center gap-2">
                                Zooey
                                <span className="text-xs font-normal bg-white/20 px-2 py-0.5 rounded-full">AI</span>
                            </h3>
                            <p className="text-emerald-200/80 text-xs flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                                Ready to help
                            </p>
                        </div>
                    </div>
                </div> */}

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar">
                    <AnimatePresence mode="popLayout">
                        {messages.map((msg) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                                className={`flex gap-3 mb-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                            >
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                    msg.role === 'user'
                                        ? 'bg-white/20 text-white'
                                        : 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-md'
                                }`}>
                                    {msg.role === 'user' ? <UserIcon /> : <SparkleIcon />}
                                </div>
                                <div className={`max-w-[80%] ${msg.role === 'user' ? 'text-right' : ''}`}>
                                    <div className={`px-4 py-3 rounded-2xl ${
                                        msg.role === 'user'
                                            ? 'bg-white text-gray-800 rounded-tr-md shadow-md'
                                            : 'bg-white/10 backdrop-blur-sm text-white border border-white/10 rounded-tl-md'
                                    }`}>
                                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Typing indicator */}
                    <AnimatePresence>
                        {isTyping && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="flex gap-3 mb-4"
                            >
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white shadow-md">
                                    <SparkleIcon />
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm px-4 py-3 rounded-2xl rounded-tl-md border border-white/10">
                                    <div className="flex gap-1.5 items-center">
                                        <motion.span className="w-2 h-2 bg-emerald-400 rounded-full" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} />
                                        <motion.span className="w-2 h-2 bg-emerald-400 rounded-full" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} />
                                        <motion.span className="w-2 h-2 bg-emerald-400 rounded-full" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                </div>

                {/* Quick questions */}
                {messages.length === 1 && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="px-4 pb-3">
                        <p className="text-emerald-200/60 text-xs mb-2 font-medium">Quick questions:</p>
                        <div className="flex flex-wrap gap-2">
                            {quickQuestions.map((q, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => { setInput(q); setTimeout(handleSend, 100); }}
                                    className="text-xs px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all border border-white/10 hover:border-white/20"
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Input */}
                <div className="p-4 bg-black/20 backdrop-blur-sm border-t border-white/10">
                    <div className="flex gap-3 items-end">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(sanitizeInput(e.target.value))}
                            onKeyPress={handleKeyPress}
                            placeholder="Ask me anything..."
                            className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 text-sm transition-all"
                            disabled={loading}
                        />
                        <motion.button
                            onClick={handleSend}
                            disabled={!input.trim() || loading}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <SendIcon />
                        </motion.button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIChatAssistant;
