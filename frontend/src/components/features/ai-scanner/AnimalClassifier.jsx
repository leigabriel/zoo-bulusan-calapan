import React, { useState, useEffect, useRef, useCallback } from 'react';
import Header from '../../Header';
import Footer from '../../Footer';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';

let cachedModel = null;

const RobotIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" /><path d="M12 7v4" /><line x1="8" y1="16" x2="8" y2="16" /><line x1="16" y1="16" x2="16" y2="16" /></svg>
);
const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
);
const UploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
);
const PawIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M12 10.5c-2.5 0-4.5 2.5-4.5 5.5 0 2 1.5 3.5 4.5 3.5s4.5-1.5 4.5-3.5c0-3-2-5.5-4.5-5.5zm-5.5-2c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm11 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-8-1.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm5 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/></svg>
);
const CameraIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
);
const LiveIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
);
const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
);
const SwitchCameraIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 19H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5"/><path d="M13 5h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-5"/><circle cx="12" cy="12" r="3"/><path d="m18 22-3-3 3-3"/><path d="m6 2 3 3-3 3"/></svg>
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

const AnimalClassifier = ({ embedded = false, expanded: controlledExpanded = false, onExpandChange = () => {} }) => {
    // State
    const [messages, setMessages] = useState([
        { id: 1, role: 'bot', type: 'text', content: "Hello! Upload a photo or use Camera to identify animals!" }
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
    
    // Camera Modal State
    const [showCameraModal, setShowCameraModal] = useState(false);
    const [cameraReady, setCameraReady] = useState(false);
    const [cameraFacing, setCameraFacing] = useState('environment');
    const [cameraError, setCameraError] = useState(null);
    const videoRef = useRef(null);
    const streamRef = useRef(null);

    // Live Detection State
    const [showLiveModal, setShowLiveModal] = useState(false);
    const [liveDetection, setLiveDetection] = useState(null);
    const [isDetecting, setIsDetecting] = useState(false);
    const liveVideoRef = useRef(null);
    const liveStreamRef = useRef(null);
    const animationRef = useRef(null);
    const [liveCameraFacing, setLiveCameraFacing] = useState('environment');
    const [liveCameraReady, setLiveCameraReady] = useState(false);
    const [liveCameraError, setLiveCameraError] = useState(null);
    const lastSavedAnimal = useRef(null);

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

    // Cleanup camera on unmount
    useEffect(() => {
        return () => {
            stopCameraStream();
            stopLiveDetection();
        };
    }, []);

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

    // Camera Functions
    const stopCameraStream = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setCameraReady(false);
    }, []);

    const startCameraStream = useCallback(async (facingMode) => {
        try {
            setCameraError(null);
            setCameraReady(false);
            
            // Stop existing stream
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            
            const constraints = {
                video: {
                    facingMode: facingMode,
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                },
                audio: false
            };
            
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;
            
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current.play()
                        .then(() => setCameraReady(true))
                        .catch(err => {
                            console.error('Video play failed:', err);
                            setCameraError('Failed to start video preview');
                        });
                };
            }
        } catch (err) {
            console.error('Camera access error:', err);
            setCameraError(
                err.name === 'NotAllowedError' 
                    ? 'Camera access denied. Please allow camera permission.' 
                    : 'Unable to access camera. Please try Upload instead.'
            );
        }
    }, []);

    const openCameraModal = useCallback(() => {
        setShowCameraModal(true);
        setCameraError(null);
        setCameraReady(false);
        
        // Small delay to ensure modal is rendered
        setTimeout(() => {
            startCameraStream(cameraFacing);
        }, 150);
    }, [cameraFacing, startCameraStream]);

    const closeCameraModal = useCallback(() => {
        stopCameraStream();
        setShowCameraModal(false);
        setCameraError(null);
    }, [stopCameraStream]);

    const switchCamera = useCallback(async () => {
        const newFacing = cameraFacing === 'environment' ? 'user' : 'environment';
        setCameraFacing(newFacing);
        await startCameraStream(newFacing);
    }, [cameraFacing, startCameraStream]);

    const capturePhoto = useCallback(() => {
        if (!videoRef.current || !cameraReady) return;
        
        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        
        // Mirror if using front camera
        if (cameraFacing === 'user') {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        
        // Close modal
        closeCameraModal();
        
        // Process the captured image
        currentFileName.current = `camera-capture-${Date.now()}.jpg`;
        setMessages(prev => [...prev, { id: Date.now(), role: 'user', type: 'image', content: dataUrl }]);
        setIsProcessing(true);
        setAnalysisImage(dataUrl);
    }, [cameraReady, cameraFacing, closeCameraModal]);

    // ========== LIVE DETECTION FUNCTIONS ==========
    const stopLiveDetection = useCallback(() => {
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        }
        if (liveStreamRef.current) {
            liveStreamRef.current.getTracks().forEach(track => track.stop());
            liveStreamRef.current = null;
        }
        if (liveVideoRef.current) {
            liveVideoRef.current.srcObject = null;
        }
        setLiveCameraReady(false);
        setIsDetecting(false);
        setLiveDetection(null);
        lastSavedAnimal.current = null;
    }, []);

    const startLiveCamera = useCallback(async (facingMode) => {
        try {
            setLiveCameraError(null);
            setLiveCameraReady(false);
            
            if (liveStreamRef.current) {
                liveStreamRef.current.getTracks().forEach(track => track.stop());
            }
            
            const constraints = {
                video: {
                    facingMode: facingMode,
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                },
                audio: false
            };
            
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            liveStreamRef.current = stream;
            
            if (liveVideoRef.current) {
                liveVideoRef.current.srcObject = stream;
                liveVideoRef.current.onloadedmetadata = () => {
                    liveVideoRef.current.play()
                        .then(() => {
                            setLiveCameraReady(true);
                            startDetectionLoop();
                        })
                        .catch(err => {
                            console.error('Live video play failed:', err);
                            setLiveCameraError('Failed to start video preview');
                        });
                };
            }
        } catch (err) {
            console.error('Live camera access error:', err);
            setLiveCameraError(
                err.name === 'NotAllowedError' 
                    ? 'Camera access denied. Please allow camera permission.' 
                    : 'Unable to access camera.'
            );
        }
    }, []);

    const startDetectionLoop = useCallback(() => {
        if (!model) return;
        
        setIsDetecting(true);
        
        const detectFrame = async () => {
            if (!liveVideoRef.current || !liveStreamRef.current || !model) {
                return;
            }
            
            const video = liveVideoRef.current;
            if (video.readyState !== 4) {
                animationRef.current = requestAnimationFrame(detectFrame);
                return;
            }

            try {
                const tensor = tf.tidy(() => {
                    const img = tf.browser.fromPixels(video);
                    const resized = tf.image.resizeBilinear(img, [150, 150]);
                    return resized.expandDims(0).div(255.0);
                });

                const predictions = await model.predict(tensor).data();
                const maxConfidence = Math.max(...predictions);
                const predictedIndex = predictions.indexOf(maxConfidence);
                const animalName = ANIMAL_CLASSES[predictedIndex] || 'Unknown';
                const confidencePct = (maxConfidence * 100).toFixed(1);

                tf.dispose(tensor);

                // Only show detection if confidence > 60%
                if (maxConfidence > 0.6) {
                    setLiveDetection({
                        animal: animalName,
                        confidence: confidencePct,
                        info: ANIMAL_INFO[animalName]
                    });
                } else {
                    setLiveDetection({
                        animal: 'Scanning...',
                        confidence: confidencePct,
                        info: { description: 'Point camera at an animal' }
                    });
                }
            } catch (err) {
                console.error('Detection error:', err);
            }

            // Continue loop (~8 FPS for performance)
            setTimeout(() => {
                animationRef.current = requestAnimationFrame(detectFrame);
            }, 125);
        };

        animationRef.current = requestAnimationFrame(detectFrame);
    }, [model]);

    const openLiveModal = useCallback(() => {
        setShowLiveModal(true);
        setLiveCameraError(null);
        setLiveCameraReady(false);
        setLiveDetection(null);
        lastSavedAnimal.current = null;
        
        setTimeout(() => {
            startLiveCamera(liveCameraFacing);
        }, 150);
    }, [liveCameraFacing, startLiveCamera]);

    const closeLiveModal = useCallback(() => {
        stopLiveDetection();
        setShowLiveModal(false);
        setLiveCameraError(null);
    }, [stopLiveDetection]);

    const switchLiveCamera = useCallback(async () => {
        const newFacing = liveCameraFacing === 'environment' ? 'user' : 'environment';
        setLiveCameraFacing(newFacing);
        stopLiveDetection();
        await startLiveCamera(newFacing);
    }, [liveCameraFacing, stopLiveDetection, startLiveCamera]);

    const saveLiveDetection = useCallback(() => {
        if (!liveDetection || liveDetection.animal === 'Scanning...' || !liveVideoRef.current) return;
        
        // Prevent duplicate saves
        if (lastSavedAnimal.current === liveDetection.animal) return;
        lastSavedAnimal.current = liveDetection.animal;

        const video = liveVideoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        
        if (liveCameraFacing === 'user') {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

        // Add to messages
        setMessages(prev => [...prev, 
            { id: Date.now(), role: 'user', type: 'image', content: dataUrl }
        ]);
        
        const info = ANIMAL_INFO[liveDetection.animal] || { description: "Unknown species" };
        addBotMessage(info.description, {
            animal: liveDetection.animal,
            confidence: liveDetection.confidence,
            icon: info.icon
        });

        // Save to database
        currentFileName.current = `live-detection-${Date.now()}.jpg`;
        saveToDatabase(liveDetection.animal, liveDetection.confidence);
        
        // Allow another save after 3 seconds
        setTimeout(() => {
            lastSavedAnimal.current = null;
        }, 3000);
    }, [liveDetection, liveCameraFacing]);

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

    // Styles based on embedded mode
    const containerClass = embedded
        ? "h-full flex flex-col bg-[#212631]"
        : "flex flex-col h-screen bg-[#111827]";

    return (
        <div className={containerClass}>
            {!embedded && <Header />}

            {/* --- MESSAGES AREA --- */}
            <main className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">

                {/* Hidden Image Processor */}
                {analysisImage && (
                    <img
                        ref={imageRef}
                        src={analysisImage}
                        className="hidden"
                        onLoad={() => setTimeout(runPrediction, 300)}
                        crossOrigin="anonymous"
                        alt="analysis"
                    />
                )}

                {messages.map((msg) => (
                    <div key={msg.id} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
                        <div className={`flex ${embedded ? 'max-w-[95%]' : 'max-w-[85%] md:max-w-[70%]'} ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} gap-2 items-end`}>

                            {/* Avatar */}
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'}`}>
                                {msg.role === 'user' ? <UserIcon /> : <RobotIcon />}
                            </div>

                            {/* Bubble */}
                            <div className={`p-3 shadow-sm text-sm ${msg.role === 'user'
                                    ? 'bg-green-600 border-2 border-black/50 text-white rounded-2xl rounded-br-none'
                                    : 'bg-[#1f2937] text-gray-100 rounded-2xl rounded-bl-none border border-gray-700'
                                }`}>
                                {msg.type === 'image' && (
                                    <img src={msg.content} alt="Upload" className={`rounded-lg ${embedded ? 'max-h-32' : 'max-h-48'} border border-white/20 mb-2`} />
                                )}

                                {msg.type === 'text' && <p className="leading-relaxed">{msg.content}</p>}

                                {msg.type === 'result' && (
                                    <div className={embedded ? 'min-w-[180px]' : 'min-w-[220px]'}>
                                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-600/50">
                                            <PawIcon className={`${embedded ? 'w-8 h-8' : 'w-10 h-10'} text-emerald-400`} />
                                            <div>
                                                <h3 className={`font-bold ${embedded ? 'text-base' : 'text-lg'} text-emerald-400`}>{msg.meta.animal}</h3>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-1.5 w-14 bg-gray-700 rounded-full overflow-hidden">
                                                        <div className="h-full bg-emerald-500 transition-all" style={{ width: `${msg.meta.confidence}%` }}></div>
                                                    </div>
                                                    <span className="text-xs text-gray-400 font-mono">{msg.meta.confidence}%</span>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-gray-300 italic leading-relaxed text-xs">
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
                        <div className="flex gap-2 items-end">
                            <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-white">
                                <RobotIcon />
                            </div>
                            <div className="bg-[#1f2937] px-3 py-2 rounded-2xl rounded-bl-none border border-gray-700 flex items-center gap-1.5">
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </main>

            {/* --- INPUT AREA --- */}
            <div className="p-3 bg-[#1f2937] border-t border-gray-700">
                <div className="max-w-4xl mx-auto">
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileSelect}
                    />

                    {/* Action Buttons - 3 options */}
                    <div className="flex gap-1.5 items-center">
                        {/* Upload Button */}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isProcessing || isModelLoading}
                            className={`flex-1 py-2 px-2 rounded-xl font-medium text-white flex items-center justify-center gap-1.5 transition-all text-xs ${isProcessing || isModelLoading
                                    ? 'bg-gray-700 cursor-not-allowed opacity-75'
                                    : 'bg-gradient-to-r from-[#2D5A27] to-[#3A8C7D] hover:opacity-95 active:scale-[0.98]'
                                }`}
                        >
                            {isModelLoading ? (
                                <span className="text-[10px]">Loading...</span>
                            ) : (
                                <>
                                    <UploadIcon />
                                    <span>Upload</span>
                                </>
                            )}
                        </button>

                        {/* Camera Capture Button */}
                        <button
                            onClick={openCameraModal}
                            disabled={isProcessing || isModelLoading}
                            className={`flex-1 py-2 px-2 rounded-xl font-medium flex items-center justify-center gap-1.5 transition-all text-xs ${isProcessing || isModelLoading
                                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-500 active:scale-[0.98]'
                                }`}
                        >
                            <CameraIcon />
                            <span>Camera</span>
                        </button>

                        {/* Live Detection Button */}
                        <button
                            onClick={openLiveModal}
                            disabled={isProcessing || isModelLoading}
                            className={`flex-1 py-2 px-2 rounded-xl font-medium flex items-center justify-center gap-1.5 transition-all text-xs ${isProcessing || isModelLoading
                                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-rose-500 to-orange-500 text-white hover:from-rose-600 hover:to-orange-600 active:scale-[0.98]'
                                }`}
                        >
                            <LiveIcon />
                            <span>Live</span>
                        </button>
                    </div>
                    
                    <p className="text-center text-[10px] text-gray-500 mt-1.5">
                        Upload • Capture • Real-time Detection
                    </p>
                </div>
            </div>

            {/* --- CAMERA CAPTURE MODAL --- */}
            {showCameraModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#1f2937] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-700">
                            <div className="flex items-center gap-2 text-white">
                                <CameraIcon />
                                <h3 className="font-bold">Camera Capture</h3>
                            </div>
                            <button
                                onClick={closeCameraModal}
                                className="p-1.5 hover:bg-gray-700 rounded-lg transition text-gray-400 hover:text-white"
                            >
                                <CloseIcon />
                            </button>
                        </div>

                        {/* Camera Preview */}
                        <div className="relative bg-black aspect-[4/3]">
                            <video
                                ref={videoRef}
                                className={`w-full h-full object-cover ${cameraFacing === 'user' ? 'scale-x-[-1]' : ''}`}
                                playsInline
                                muted
                                autoPlay
                            />
                            
                            {/* Loading State */}
                            {!cameraReady && !cameraError && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                                    <div className="text-center">
                                        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                                        <p className="text-gray-400 text-sm">Starting camera...</p>
                                    </div>
                                </div>
                            )}

                            {/* Error State */}
                            {cameraError && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                                    <div className="text-center p-6">
                                        <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                        </div>
                                        <p className="text-red-400 text-sm mb-4">{cameraError}</p>
                                        <button
                                            onClick={closeCameraModal}
                                            className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm hover:bg-gray-600 transition"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Frame Guide */}
                            {cameraReady && (
                                <div className="absolute inset-4 border-2 border-emerald-400/40 rounded-xl pointer-events-none">
                                    <div className="absolute -top-px -left-px w-6 h-6 border-t-2 border-l-2 border-emerald-400 rounded-tl-lg"></div>
                                    <div className="absolute -top-px -right-px w-6 h-6 border-t-2 border-r-2 border-emerald-400 rounded-tr-lg"></div>
                                    <div className="absolute -bottom-px -left-px w-6 h-6 border-b-2 border-l-2 border-emerald-400 rounded-bl-lg"></div>
                                    <div className="absolute -bottom-px -right-px w-6 h-6 border-b-2 border-r-2 border-emerald-400 rounded-br-lg"></div>
                                </div>
                            )}
                        </div>

                        {/* Camera Controls */}
                        <div className="p-4 bg-[#111827]">
                            <div className="flex items-center justify-center gap-6">
                                {/* Switch Camera */}
                                <button
                                    onClick={switchCamera}
                                    disabled={!cameraReady}
                                    className="p-3 bg-gray-700 hover:bg-gray-600 rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed text-white"
                                    title="Switch Camera"
                                >
                                    <SwitchCameraIcon />
                                </button>

                                {/* Capture Button */}
                                <button
                                    onClick={capturePhoto}
                                    disabled={!cameraReady}
                                    className="w-16 h-16 bg-white hover:bg-gray-100 rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg active:scale-95"
                                    title="Capture Photo"
                                >
                                    <div className="w-12 h-12 bg-emerald-500 rounded-full border-4 border-white"></div>
                                </button>

                                {/* Close Button */}
                                <button
                                    onClick={closeCameraModal}
                                    className="p-3 bg-red-500/20 hover:bg-red-500/30 rounded-full transition text-red-400"
                                    title="Cancel"
                                >
                                    <CloseIcon />
                                </button>
                            </div>
                            <p className="text-center text-xs text-gray-500 mt-3">
                                Point camera at an animal and tap to capture
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* --- LIVE DETECTION MODAL --- */}
            {showLiveModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
                    <div className="bg-[#1f2937] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-3 border-b border-gray-700 bg-gradient-to-r from-rose-600 to-orange-600">
                            <div className="flex items-center gap-2 text-white">
                                <LiveIcon />
                                <div>
                                    <h3 className="font-bold text-sm">Live Detection</h3>
                                    <p className="text-[10px] text-white/70">Real-time AI scanning</p>
                                </div>
                            </div>
                            <button
                                onClick={closeLiveModal}
                                className="p-1.5 hover:bg-white/20 rounded-lg transition text-white"
                            >
                                <CloseIcon />
                            </button>
                        </div>

                        {/* Live Camera Preview */}
                        <div className="relative bg-black aspect-[4/3]">
                            <video
                                ref={liveVideoRef}
                                className={`w-full h-full object-cover ${liveCameraFacing === 'user' ? 'scale-x-[-1]' : ''}`}
                                playsInline
                                muted
                                autoPlay
                            />
                            
                            {/* Loading State */}
                            {!liveCameraReady && !liveCameraError && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                                    <div className="text-center">
                                        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                                        <p className="text-gray-400 text-sm">Starting camera...</p>
                                    </div>
                                </div>
                            )}

                            {/* Error State */}
                            {liveCameraError && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                                    <div className="text-center p-6">
                                        <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                        </div>
                                        <p className="text-red-400 text-sm mb-4">{liveCameraError}</p>
                                        <button
                                            onClick={closeLiveModal}
                                            className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm hover:bg-gray-600 transition"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Scanning Frame */}
                            {liveCameraReady && (
                                <>
                                    {/* Corner brackets */}
                                    <div className="absolute inset-4 pointer-events-none">
                                        <div className="absolute -top-px -left-px w-8 h-8 border-t-3 border-l-3 border-orange-400 rounded-tl-lg"></div>
                                        <div className="absolute -top-px -right-px w-8 h-8 border-t-3 border-r-3 border-orange-400 rounded-tr-lg"></div>
                                        <div className="absolute -bottom-px -left-px w-8 h-8 border-b-3 border-l-3 border-orange-400 rounded-bl-lg"></div>
                                        <div className="absolute -bottom-px -right-px w-8 h-8 border-b-3 border-r-3 border-orange-400 rounded-br-lg"></div>
                                    </div>
                                    
                                    {/* Scanning line animation */}
                                    {isDetecting && (
                                        <div className="absolute inset-x-4 top-4 h-1 overflow-hidden">
                                            <div className="h-full w-full bg-gradient-to-r from-transparent via-orange-400 to-transparent animate-pulse"></div>
                                        </div>
                                    )}

                                    {/* Live indicator */}
                                    <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-600 px-2 py-1 rounded-full">
                                        <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                                        <span className="text-white text-[10px] font-bold">LIVE</span>
                                    </div>
                                </>
                            )}

                            {/* Detection Result Overlay */}
                            {liveDetection && liveCameraReady && (
                                <div className="absolute bottom-0 left-0 right-0 p-3">
                                    <div className={`bg-black/80 backdrop-blur-sm rounded-xl p-3 border-2 ${
                                        liveDetection.animal !== 'Scanning...' 
                                            ? 'border-emerald-500' 
                                            : 'border-gray-600'
                                    }`}>
                                        <div className="flex items-center gap-3">
                                            <PawIcon className={`w-10 h-10 flex-shrink-0 ${
                                                liveDetection.animal !== 'Scanning...' 
                                                    ? 'text-emerald-400' 
                                                    : 'text-gray-400'
                                            }`} />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h4 className={`font-bold text-lg ${
                                                        liveDetection.animal !== 'Scanning...' 
                                                            ? 'text-emerald-400' 
                                                            : 'text-gray-400'
                                                    }`}>
                                                        {liveDetection.animal}
                                                    </h4>
                                                    {liveDetection.animal !== 'Scanning...' && (
                                                        <span className="text-xs bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                                                            {liveDetection.confidence}%
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-400 truncate">
                                                    {liveDetection.info?.description || 'Point camera at an animal'}
                                                </p>
                                            </div>
                                            {liveDetection.animal !== 'Scanning...' && (
                                                <button
                                                    onClick={saveLiveDetection}
                                                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition flex-shrink-0"
                                                >
                                                    Save
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Live Controls */}
                        <div className="p-3 bg-[#111827] flex items-center justify-between">
                            <button
                                onClick={switchLiveCamera}
                                disabled={!liveCameraReady}
                                className="p-2.5 bg-gray-700 hover:bg-gray-600 rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed text-white"
                                title="Switch Camera"
                            >
                                <SwitchCameraIcon />
                            </button>

                            <div className="text-center">
                                <p className="text-[10px] text-gray-500">
                                    {isDetecting ? 'AI is analyzing frames...' : 'Starting detection...'}
                                </p>
                            </div>

                            <button
                                onClick={closeLiveModal}
                                className="px-4 py-2 bg-red-500/80 hover:bg-red-500 rounded-xl transition text-white text-sm font-medium"
                            >
                                Stop
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {!embedded && <Footer />}
        </div>
    );
};

export default AnimalClassifier;
