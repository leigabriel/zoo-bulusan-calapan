import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import AnimalClassifier from './AnimalClassifier';

const Icons = {
    Robot: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <rect x="3" y="11" width="18" height="10" rx="2" />
            <circle cx="12" cy="5" r="2" />
            <path d="M12 7v4" />
            <line x1="8" y1="16" x2="8" y2="16" />
            <line x1="16" y1="16" x2="16" y2="16" />
        </svg>
    ),
    Camera: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
        </svg>
    ),
    Send: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
    ),
    Close: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    ),
    Maximize: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <polyline points="15 3 21 3 21 9" />
            <polyline points="9 21 3 21 3 15" />
            <line x1="21" y1="3" x2="14" y2="10" />
            <line x1="3" y1="21" x2="10" y2="14" />
        </svg>
    ),
    Minimize: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <polyline points="4 14 10 14 10 20" />
            <polyline points="20 10 14 10 14 4" />
            <line x1="14" y1="10" x2="21" y2="3" />
            <line x1="3" y1="21" x2="10" y2="14" />
        </svg>
    ),
    Message: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
    ),
    Brain: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" />
            <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" />
        </svg>
    ),
    Ticket: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
            <path d="M13 5v2" />
            <path d="M13 17v2" />
            <path d="M13 11v2" />
        </svg>
    )
};

const Home = () => {
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [chatMode, setChatMode] = useState('assistant');
    const [chatInput, setChatInput] = useState('');
    const [messages, setMessages] = useState([
        { type: 'bot', text: "Hello! I'm your AI Zoo Assistant. I can help with real-time info about exhibits, tickets, and events." }
    ]);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isChatOpen, isExpanded]);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const [isLoading, setIsLoading] = useState(false);

    const handleChatSubmit = async () => {
        if (!chatInput.trim() || isLoading) return;
        const userMsg = chatInput;
        setMessages([...messages, { type: 'user', text: userMsg }]);
        setChatInput('');
        setIsLoading(true);

        try {
            const response = await fetch(`${API_URL}/ai/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMsg,
                    history: messages.slice(-10).map(m => ({
                        role: m.type === 'user' ? 'user' : 'assistant',
                        content: m.text
                    }))
                })
            });

            const data = await response.json();

            if (data.success) {
                setMessages(prev => [...prev, { type: 'bot', text: data.response }]);
            } else {
                setMessages(prev => [...prev, { 
                    type: 'bot', 
                    text: "I'm sorry, I'm having trouble connecting right now. Please try again later or contact our staff directly at info@zoobulusan.com" 
                }]);
            }
        } catch (error) {
            console.error('Chat error:', error);
            // Fallback to basic responses if AI service is unavailable
            let fallbackResponse = "I'm having trouble connecting to the AI service. ";
            const lowerMsg = userMsg.toLowerCase();
            if (lowerMsg.includes('ticket') || lowerMsg.includes('price')) {
                fallbackResponse = "Ticket prices: Adult ₱40, Child ₱20, Senior ₱30, Student ₱25, Bulusan Residents FREE. Visit our Tickets page to book!";
            } else if (lowerMsg.includes('animal') || lowerMsg.includes('see')) {
                fallbackResponse = "We have a variety of animals including the Philippine Eagle, deer, macaques, pythons, and crocodiles. Visit our Animals page for more!";
            } else if (lowerMsg.includes('time') || lowerMsg.includes('open') || lowerMsg.includes('hour')) {
                fallbackResponse = "We're open Tuesday-Sunday, 8AM-5PM. Closed on Mondays for maintenance. Last entry at 4PM.";
            } else {
                fallbackResponse = "I can help with animal info, tickets, and events. What would you like to know?";
            }
            setMessages(prev => [...prev, { type: 'bot', text: fallbackResponse }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col font-sans">
            <Header />

            {isChatOpen && (
                <div
                    className={`fixed bottom-[100px] right-6 bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden transition-all duration-300 border border-gray-100 ${isExpanded ? 'w-[90vw] md:w-[600px] h-[80vh]' : 'w-[90vw] md:w-[380px] h-[520px]'
                        }`}
                >
                    <div className="bg-gradient-to-r from-[#2D5A27] to-[#3A8C7D] p-4 flex justify-between items-center text-white shadow-md">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                                {chatMode === 'assistant' ? <Icons.Robot /> : <Icons.Camera />}
                            </div>
                            <div>
                                <h3 className="font-bold text-lg leading-tight">{chatMode === 'assistant' ? 'AI Assistant' : 'Animal Classifier'}</h3>
                                <div className="flex items-center gap-1.5 opacity-90">
                                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                                    <p className="text-xs font-medium">{chatMode === 'assistant' ? 'Online' : 'Ready'}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="p-2 hover:bg-white/10 rounded-full transition"
                            >
                                {isExpanded ? <Icons.Minimize /> : <Icons.Maximize />}
                            </button>
                            <button
                                onClick={() => setIsChatOpen(false)}
                                className="p-2 hover:bg-white/10 rounded-full transition"
                            >
                                <Icons.Close />
                            </button>
                        </div>
                    </div>

                    <div className="flex border-b border-gray-100 bg-white">
                        <button
                            onClick={() => setChatMode('assistant')}
                            className={`flex-1 py-3 text-sm font-semibold transition flex items-center justify-center gap-2 ${chatMode === 'assistant' ? 'text-green-700 border-b-2 border-green-600 bg-green-50/50' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            <span className="scale-90"><Icons.Robot /></span> AI Assistant
                        </button>
                        <button
                            onClick={() => setChatMode('classifier')}
                            className={`flex-1 py-3 text-sm font-semibold transition flex items-center justify-center gap-2 ${chatMode === 'classifier' ? 'text-green-700 border-b-2 border-green-600 bg-green-50/50' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            <span className="scale-90"><Icons.Camera /></span> Classify Animal
                        </button>
                    </div>

                    {chatMode === 'assistant' ? (
                        <>
                            <div className="flex-1 p-4 overflow-y-auto bg-gray-50 scroll-smooth">
                                {messages.map((msg, idx) => (
                                    <div key={idx} className={`mb-4 flex items-end gap-2 ${msg.type === 'bot' ? '' : 'flex-row-reverse'}`}>
                                        {msg.type === 'bot' && (
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-600 to-teal-600 flex items-center justify-center flex-shrink-0 text-white shadow-sm">
                                                <div className="scale-75"><Icons.Robot /></div>
                                            </div>
                                        )}
                                        <div className={`py-3 px-4 rounded-2xl max-w-[85%] shadow-sm text-sm leading-relaxed ${msg.type === 'bot' ? 'bg-white border border-gray-100 text-gray-700 rounded-bl-none' : 'bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-br-none'}`}>
                                            <p>{msg.text}</p>
                                        </div>
                                    </div>
                                ))}
                                {isLoading && (
                                    <div className="mb-4 flex items-end gap-2">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-600 to-teal-600 flex items-center justify-center flex-shrink-0 text-white shadow-sm">
                                            <div className="scale-75"><Icons.Robot /></div>
                                        </div>
                                        <div className="py-3 px-4 rounded-2xl bg-white border border-gray-100 rounded-bl-none shadow-sm">
                                            <div className="flex gap-1">
                                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                            <div className="p-4 bg-white border-t border-gray-100 flex gap-2 items-center">
                                <input
                                    className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition text-sm disabled:bg-gray-100"
                                    placeholder="Ask about tickets, animals, or events..."
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleChatSubmit()}
                                    disabled={isLoading}
                                />
                                <button
                                    onClick={handleChatSubmit}
                                    disabled={!chatInput.trim() || isLoading}
                                    className="w-11 h-11 rounded-xl bg-green-600 text-white flex items-center justify-center hover:bg-green-700 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                >
                                    <Icons.Send />
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 overflow-y-auto bg-gray-50">
                            <AnimalClassifier embedded={true} />
                        </div>
                    )}
                </div>
            )}

            <button
                onClick={() => setIsChatOpen(!isChatOpen)}
                className="fixed bottom-6 right-6 w-16 h-16 rounded-full bg-gradient-to-br from-[#2D5A27] to-[#3A8C7D] text-white flex items-center justify-center shadow-lg hover:shadow-green-900/30 cursor-pointer hover:scale-105 active:scale-95 transition-all z-40 group"
            >
                <div className="group-hover:animate-bounce">
                    <Icons.Message />
                </div>
            </button>

            <section className="relative h-[600px] text-white flex items-center justify-center text-center bg-cover bg-center" style={{ backgroundImage: `linear-gradient(rgba(45, 90, 39, 0.85), rgba(58, 140, 125, 0.85)), url('https://images.unsplash.com/photo-1548013146-72479768bada?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')` }}>
                <div className="relative z-10 px-4 max-w-5xl mx-auto">
                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full mb-8 text-sm font-semibold text-green-50">
                        <Icons.Brain />
                        <span>AI-Driven Smart Zoo</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight leading-tight">Wildlife Wonder Awaits</h1>
                    <p className="text-xl md:text-2xl mb-10 max-w-2xl mx-auto text-gray-100 font-light">Immerse yourself in nature with our cloud-powered zoo experience.</p>
                    <div className="flex flex-col sm:flex-row gap-5 justify-center">
                        <Link to="/tickets" className="bg-white text-green-800 px-8 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-gray-50 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                            <Icons.Ticket />
                            <span>Plan Your Visit</span>
                        </Link>
                    </div>
                </div>
            </section>

            <section className="py-24 bg-gradient-to-b from-green-50 to-white">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-4xl font-bold text-green-900 mb-4">Online Ticket Booking</h2>
                    <p className="text-green-700 mb-16 text-lg max-w-2xl mx-auto">Secure cloud-based reservations with instant digital confirmation and QR code access.</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {[
                            { title: 'Child Admission', price: '₱20', desc: 'Ages 4-12' },
                            { title: 'Adult Admission', price: '₱40', desc: 'Ages 13+' },
                            { title: 'Bulusan Residents', price: 'FREE', desc: 'With Valid ID' }
                        ].map((t, i) => (
                            <div key={i} className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 border border-green-100 group hover:-translate-y-2">
                                <h3 className="text-2xl font-bold text-green-800 mb-3">{t.title}</h3>
                                <div className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-teal-600 mb-6">{t.price}</div>
                                <p className="text-gray-500 mb-8 font-medium">{t.desc}</p>
                                <Link to="/tickets">
                                    <button className="w-full py-4 rounded-xl text-white font-bold bg-gradient-to-r from-green-600 to-teal-600 hover:shadow-lg hover:opacity-95 transition">Book Now</button>
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default Home;