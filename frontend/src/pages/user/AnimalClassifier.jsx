import React, { useState, useEffect, useRef } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';

let cachedModel = null;

const RobotIcon = () => (
    <svg xmlns="http:www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" /><path d="M12 7v4" /><line x1="8" y1="16" x2="8" y2="16" /><line x1="16" y1="16" x2="16" y2="16" /></svg>
);
const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
);
const CameraIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" /></svg>
);
const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
);
const PawIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M12 10.5c-2.5 0-4.5 2.5-4.5 5.5 0 2 1.5 3.5 4.5 3.5s4.5-1.5 4.5-3.5c0-3-2-5.5-4.5-5.5zm-5.5-2c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm11 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-8-1.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm5 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/></svg>
);

const ANIMAL_INFO = {
    'Bear': { description: "Bears have an excellent sense of smell, better than dogs.", icon: "bear" },
    'Bird': { description: "Birds are the only animals with feathers.", icon: "bird" },
    'Cat': { description: "Cats use their whiskers to navigate in the dark.", icon: "cat" },
    'Cow': { description: "Cows have best friends and get stressed when separated.", icon: "cow" },
    'Deer': { description: "Deer antlers grow faster than any other living tissue.", icon: "deer" },
    'Dog': { description: "A dog's nose print is unique, much like a human fingerprint.", icon: "dog" },
    'Dolphin': { description: "Dolphins give themselves names.", icon: "dolphin" },
    'Elephant': { description: "Elephants are the only mammals that can't jump.", icon: "elephant" },
    'Giraffe': { description: "A giraffe's tongue is purple to prevent sunburn!", icon: "giraffe" },
    'Horse': { description: "Horses can sleep standing up.", icon: "horse" },
    'Kangaroo': { description: "Kangaroos cannot walk backwards.", icon: "kangaroo" },
    'Lion': { description: "A lion's roar can be heard from 5 miles away.", icon: "lion" },
    'Panda': { description: "Pandas spend up to 14 hours a day eating.", icon: "panda" },
    'Tiger': { description: "No two tigers have the same stripes.", icon: "tiger" },
    'Zebra': { description: "Zebras stripes act as a bug repellent.", icon: "zebra" }
};
const ANIMAL_CLASSES = Object.keys(ANIMAL_INFO);

const AnimalClassifier = ({ embedded = false }) => {
    // State
    const [messages, setMessages] = useState([
        { id: 1, role: 'bot', type: 'text', content: "Hello! Upload a photo, and I'll identify the animal for you." }
    ]);
    const [model, setModel] = useState(cachedModel);
    const [isModelLoading, setIsModelLoading] = useState(!cachedModel);
    const [isProcessing, setIsProcessing] = useState(false);

    // Refs
    const imageRef = useRef(null);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const currentFileName = useRef('');
    const [analysisImage, setAnalysisImage] = useState(null);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    // 1. Load Model
    useEffect(() => {
        const loadModel = async () => {
            if (cachedModel) { setIsModelLoading(false); return; }
            try {
                await tf.ready();
                const loadedModel = await tf.loadLayersModel('/models/model.json');

                // Warmup GPU
                const zero = tf.zeros([1, 150, 150, 3]);
                loadedModel.predict(zero).dispose();
                zero.dispose();

                cachedModel = loadedModel;
                setModel(loadedModel);
                setIsModelLoading(false);
            } catch (err) {
                console.error(err);
                addBotMessage("Error: Could not load the AI model.");
                setIsModelLoading(false);
            }
        };
        loadModel();
    }, []);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isProcessing]);

    // 2. Handle File
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        currentFileName.current = file.name;
        const imageUrl = URL.createObjectURL(file);

        // Add User Message
        setMessages(prev => [...prev, { id: Date.now(), role: 'user', type: 'image', content: imageUrl }]);

        // Start Processing
        setIsProcessing(true);
        setAnalysisImage(imageUrl);
        e.target.value = '';
    };

    const addBotMessage = (text, meta = null) => {
        setMessages(prev => [...prev, { id: Date.now(), role: 'bot', type: meta ? 'result' : 'text', content: text, meta }]);
    };

    // 3. Predict
    const runPrediction = async () => {
        if (!model || !imageRef.current) return;

        try {
            const tensor = tf.tidy(() => {
                const img = tf.browser.fromPixels(imageRef.current);
                const resized = tf.image.resizeBilinear(img, [150, 150]);
                return resized.expandDims(0).div(255.0);
            });

            const predictions = await model.predict(tensor).data();
            const maxConfidence = Math.max(...predictions);
            const predictedIndex = predictions.indexOf(maxConfidence);
            const animalName = ANIMAL_CLASSES[predictedIndex] || 'Unknown';
            const confidencePct = (maxConfidence * 100).toFixed(1);

            tf.dispose(tensor);

            const info = ANIMAL_INFO[animalName] || { description: "Unknown species", icon: "question" };

            // Save to DB
            saveToDatabase(animalName, confidencePct);

            addBotMessage(info.description, {
                animal: animalName,
                confidence: confidencePct,
                icon: info.icon
            });

        } catch (error) {
            console.error(error);
            addBotMessage("Sorry, I encountered an error analyzing that image.");
        } finally {
            setIsProcessing(false);
            setAnalysisImage(null);
        }
    };

    // 4. Save to Database
    const saveToDatabase = async (animal, confidence) => {
        try {
            const tabId = sessionStorage.getItem('TAB_ID');
            const token = tabId ? sessionStorage.getItem(`user_token_${tabId}`) : sessionStorage.getItem('user_token');
            await fetch(`${API_URL}/predictions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                    ...(tabId ? { 'X-Tab-ID': tabId } : {})
                },
                body: JSON.stringify({
                    filename: currentFileName.current,
                    prediction: animal,
                    confidence: parseFloat(confidence)
                })
            });
        } catch (err) { console.error("DB Save Failed", err); }
    };

    return (
        <div className={embedded ? "h-full flex flex-col bg-gray-50" : "flex flex-col h-screen bg-[#111827]"}>
            {!embedded && <Header />}

            {/* --- MESSAGES AREA --- */}
            <main className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">

                {/* Hidden Image Processor */}
                {analysisImage && (
                    <img
                        ref={imageRef}
                        src={analysisImage}
                        className="hidden"
                        onLoad={() => setTimeout(runPrediction, 500)}
                        crossOrigin="anonymous"
                        alt="analysis"
                    />
                )}

                {messages.map((msg) => (
                    <div key={msg.id} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
                        <div className={`flex max-w-[85%] md:max-w-[70%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} gap-3 items-end`}>

                            {/* Avatar */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'}`}>
                                {msg.role === 'user' ? <UserIcon /> : <RobotIcon />}
                            </div>

                            {/* Bubble */}
                            <div className={`p-4 shadow-sm text-sm md:text-base ${msg.role === 'user'
                                    ? 'bg-green-600 border-2 border-black/50 text-white rounded-2xl rounded-br-none'
                                    : 'bg-[#1f2937] text-gray-100 rounded-2xl rounded-bl-none border border-gray-700'
                                }`}>
                                {msg.type === 'image' && (
                                    <img src={msg.content} alt="Upload" className="rounded-lg max-h-60 border border-white/20 mb-2" />
                                )}

                                {msg.type === 'text' && <p>{msg.content}</p>}

                                {msg.type === 'result' && (
                                    <div className="min-w-[220px]">
                                        <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-600/50">
                                            <PawIcon className="w-10 h-10 text-emerald-400" />
                                            <div>
                                                <h3 className="font-bold text-lg text-emerald-400">{msg.meta.animal}</h3>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-1.5 w-16 bg-gray-700 rounded-full overflow-hidden">
                                                        <div className="h-full bg-emerald-500" style={{ width: `${msg.meta.confidence}%` }}></div>
                                                    </div>
                                                    <span className="text-xs text-gray-400 font-mono">{msg.meta.confidence}%</span>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-gray-300 italic leading-relaxed text-sm">
                                            "{msg.content}"
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {/* Loading Indicator */}
                {isProcessing && (
                    <div className="flex w-full justify-start">
                        <div className="flex gap-3 items-end">
                            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white">
                                <RobotIcon />
                            </div>
                            <div className="bg-[#1f2937] px-4 py-3 rounded-2xl rounded-bl-none border border-gray-700 flex items-center gap-1.5">
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></span>
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></span>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </main>

            {/* --- INPUT AREA --- */}
            <div className={`p-4 ${embedded ? 'bg-white border-t' : 'bg-[#1f2937] border-t border-gray-700'}`}>
                <div className="max-w-4xl mx-auto">
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileSelect}
                    />

                    {/* Chat Input Bar */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isProcessing || isModelLoading}
                            className={`flex-1 py-3 px-6 rounded-xl font-medium text-white flex items-center justify-center gap-2 transition-all shadow-lg ${isProcessing || isModelLoading
                                    ? 'bg-gray-700 cursor-not-allowed opacity-75'
                                    : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 active:scale-[0.98]'
                                }`}
                        >
                            {isModelLoading ? (
                                <>Loading Model...</>
                            ) : (
                                <>
                                    <CameraIcon />
                                    <span>Upload Photo</span>
                                </>
                            )}
                        </button>
                    </div>
                    <p className="text-center text-xs text-gray-500 mt-2">
                        Upload a clear image of an animal to identify it.
                    </p>
                </div>
            </div>

            {!embedded && <Footer />}
        </div>
    );
};

export default AnimalClassifier;