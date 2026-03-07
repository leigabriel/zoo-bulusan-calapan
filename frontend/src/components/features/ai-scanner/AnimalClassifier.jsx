import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../../Header';
import Footer from '../../Footer';
import { userAPI } from '../../../services/api-client';
import { 
    loadLocalModel, 
    isModelReady, 
    detectAnimal, 
    getCurrentSource,
    getSourceDisplayName 
} from '../../../services/ai-detection-service';
import { fetchAnimalDescription } from '../../../services/animal-description-service';
import { ANIMAL_DATABASE, AI_SOURCE } from '../../../config/ai-service-config';

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
const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
);
const SwitchCameraIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 19H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5"/><path d="M13 5h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-5"/><circle cx="12" cy="12" r="3"/><path d="m18 22-3-3 3-3"/><path d="m6 2 3 3-3 3"/></svg>
);

// Use unified animal database from config
const ANIMAL_INFO = ANIMAL_DATABASE;

// Detect mobile device
const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
        || window.innerWidth < 768;
};

const AnimalClassifier = ({ embedded = false, expanded: controlledExpanded = false, onExpandChange = () => {} }) => {
    const [messages, setMessages] = useState([
        { id: 1, role: 'bot', type: 'text', content: `Hello! Upload a photo or use Camera to identify animals! (Using ${getSourceDisplayName()})` }
    ]);
    const [isModelLoading, setIsModelLoading] = useState(!isModelReady());
    const [isProcessing, setIsProcessing] = useState(false);

    const [showCollectionModal, setShowCollectionModal] = useState(false);
    const [capturedAnimal, setCapturedAnimal] = useState(null);
    const [capturedImage, setCapturedImage] = useState(null);
    const [isAddingToCollection, setIsAddingToCollection] = useState(false);
    const [collectionNotification, setCollectionNotification] = useState(null);

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
    const [isMobile, setIsMobile] = useState(isMobileDevice());
    const videoRef = useRef(null);
    const streamRef = useRef(null);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    // Check for mobile on resize
    useEffect(() => {
        const handleResize = () => setIsMobile(isMobileDevice());
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // 1. Load Model (only for local source)
    useEffect(() => {
        const initModel = async () => {
            // Skip loading if using API source
            if (AI_SOURCE === 'animaldetect') {
                setIsModelLoading(false);
                return;
            }
            
            if (isModelReady()) { 
                setIsModelLoading(false); 
                return; 
            }
            
            try {
                await loadLocalModel();
                setIsModelLoading(false);
            } catch (err) {
                console.error(err);
                addBotMessage("Error: Could not load the AI model.");
                setIsModelLoading(false);
            }
        };
        initModel();
    }, []);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isProcessing]);

    // Cleanup camera on unmount
    useEffect(() => {
        return () => {
            stopCameraStream();
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
                    width: { ideal: isMobile ? 1080 : 640 },
                    height: { ideal: isMobile ? 1920 : 480 }
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
        
        // Prevent background scroll on mobile
        if (isMobile) {
            document.body.style.overflow = 'hidden';
        }
        
        // Small delay to ensure modal is rendered
        setTimeout(() => {
            startCameraStream(cameraFacing);
        }, 150);
    }, [cameraFacing, startCameraStream, isMobile]);

    const closeCameraModal = useCallback(() => {
        stopCameraStream();
        setShowCameraModal(false);
        setCameraError(null);
        
        // Restore background scroll
        document.body.style.overflow = '';
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

    const addBotMessage = (text, meta = null) => {
        setMessages(prev => [...prev, { id: Date.now(), role: 'bot', type: meta ? 'result' : 'text', content: text, meta }]);
    };

    // 3. Predict using AI detection service
    const runPrediction = async () => {
        if (!imageRef.current) {
            console.warn('[Scanner] No image reference available');
            return;
        }
        
        // For local model, check if it's ready
        if (AI_SOURCE === 'local' && !isModelReady()) {
            addBotMessage("Please wait, AI model is still loading...");
            return;
        }

        console.log('[Scanner] Starting prediction...');

        try {
            // Use the unified detection service
            const result = await detectAnimal(imageRef.current);
            
            console.log('[Scanner] Detection result received:', result);
            
            // Handle unsuccessful detection with specific error messages
            if (!result.success) {
                const errorMessage = result.error || "Sorry, I couldn't identify the animal in this image.";
                console.warn('[Scanner] Detection unsuccessful:', result.errorType, result.error);
                
                // Show specific error message based on type
                if (result.errorType === 'EMPTY_RESULT' || result.errorType === 'NO_ANIMAL_DETECTED') {
                    addBotMessage("I couldn't detect any animal in this image. Please try a clearer photo with the animal more visible.");
                } else if (result.fallbackAttempted) {
                    addBotMessage(`${errorMessage} (Both AI services were tried)`);
                } else {
                    addBotMessage(errorMessage);
                }
                return;
            }

            const { animal: animalName, confidence, category, isBulusanAnimal, fallback, source, warning } = result;
            const confidencePct = parseFloat(confidence);
            
            // Log detection source and result
            console.log('[Scanner] Detection successful:', { 
                animalName, 
                confidence: confidencePct + '%', 
                source, 
                fallback,
                warning 
            });
            
            // Handle low confidence warning
            if (warning) {
                console.warn('[Scanner] Detection warning:', warning);
            }
            
            // Check if detection result is valid (not Unknown with 0% confidence)
            if (animalName === 'Unknown' || confidencePct === 0) {
                addBotMessage("I couldn't confidently identify the animal in this image. The detection result was inconclusive. Please try a different image.");
                return;
            }
            
            // Fetch description from Wikipedia API (this is now the PRIMARY source)
            let animalDescription = "";
            let animalCategory = category || "Animal";
            let wikipediaData = null;
            
            try {
                console.log('[Scanner] Fetching Wikipedia description for:', animalName);
                const descriptionResult = await fetchAnimalDescription(animalName);
                
                if (descriptionResult.success && descriptionResult.description) {
                    animalDescription = descriptionResult.description;
                    animalCategory = descriptionResult.category || category || "Animal";
                    wikipediaData = {
                        title: descriptionResult.title,
                        thumbnail: descriptionResult.thumbnail,
                        pageUrl: descriptionResult.pageUrl,
                        scientificName: descriptionResult.scientificName
                    };
                    console.log('[Scanner] Wikipedia description fetched successfully');
                } else {
                    // Generate a simple description without relying on internal database
                    animalDescription = `A ${animalName.toLowerCase()} has been detected with ${confidencePct}% confidence.`;
                    if (descriptionResult.error) {
                        console.warn('[Scanner] Wikipedia fetch had error:', descriptionResult.error);
                    }
                }
            } catch (descError) {
                console.warn('[Scanner] Description fetch failed:', descError);
                // Generate a simple description without relying on internal database  
                animalDescription = `A ${animalName.toLowerCase()} has been detected. Description unavailable at this time.`;
            }
            
            // Check if animal is in Bulusan Zoo (this is the ONLY thing we use internal DB for)
            const bulusanInfo = ANIMAL_INFO[animalName];
            const isInBulusan = bulusanInfo?.bulusan || isBulusanAnimal || false;

            // Save to prediction database
            saveToDatabase(animalName, confidencePct);

            // Build result message
            let resultMessage = animalDescription;
            if (fallback) {
                resultMessage += '';
            }
            
            // Add source indicator for debugging (can be removed in production)
            if (source) {
                console.log('[Scanner] Result source:', source);
            }
            
            addBotMessage(resultMessage, {
                animal: animalName,
                confidence: confidencePct,
                icon: animalName.toLowerCase(),
                isBulusanAnimal: isInBulusan,
                category: animalCategory,
                wikipediaData
            });

            // Show collection modal for recognized animals with confidence > 40%
            // Lowered threshold slightly since we've improved detection
            if (confidencePct > 40 && animalName !== 'Unknown') {
                const imageToSave = analysisImage;
                setCapturedAnimal({
                    name: animalName,
                    confidence: confidencePct,
                    description: animalDescription,
                    category: animalCategory,
                    icon: animalName.toLowerCase(),
                    isBulusanAnimal: isInBulusan,
                    capturedAt: new Date().toISOString(),
                    wikipediaData
                });
                setCapturedImage(imageToSave);
                setShowCollectionModal(true);
            }

        } catch (error) {
            // This should rarely happen now since detectAnimal handles errors internally
            console.error('[Scanner] Unexpected detection error:', error);
            const userMessage = error.message || "Sorry, I encountered an error analyzing that image. Please try again.";
            addBotMessage(userMessage);
        } finally {
            setIsProcessing(false);
            setAnalysisImage(null);
        }
    };

    const showNotification = useCallback((message, type = 'success') => {
        setCollectionNotification({ message, type });
        setTimeout(() => setCollectionNotification(null), 3000);
    }, []);

    const addToCollection = useCallback(async () => {
        if (!capturedAnimal || isAddingToCollection) return;
        
        setIsAddingToCollection(true);
        
        try {
            // Try to save to database first
            const response = await userAPI.addToCollection({
                animalName: capturedAnimal.name,
                description: capturedAnimal.description || '',
                category: capturedAnimal.category || 'Unknown',
                confidence: capturedAnimal.confidence || 0,
                capturedImage: capturedImage
            });

            if (response.success) {
                showNotification(`${capturedAnimal.name} added to your collection!`, 'success');
                addBotMessage(`Great! ${capturedAnimal.name} has been added to your collection. View it in your profile!`);
            } else if (response.message?.includes('already')) {
                showNotification(`${capturedAnimal.name} is already in your collection`, 'info');
            } else {
                // Fallback to localStorage if database fails
                const existingCollection = JSON.parse(localStorage.getItem('animalCollection') || '[]');
                const alreadyExists = existingCollection.some(a => a.name === capturedAnimal.name);
                
                if (alreadyExists) {
                    showNotification(`${capturedAnimal.name} is already in your collection`, 'info');
                } else {
                    const newAnimal = {
                        ...capturedAnimal,
                        image: capturedImage,
                        addedAt: new Date().toISOString()
                    };
                    existingCollection.push(newAnimal);
                    localStorage.setItem('animalCollection', JSON.stringify(existingCollection));
                    showNotification(`${capturedAnimal.name} saved locally! Log in to sync.`, 'success');
                    addBotMessage(`${capturedAnimal.name} saved locally. Log in to sync your collection across devices!`);
                }
            }
        } catch (error) {
            console.error('Error saving to database, using localStorage:', error);
            // Fallback to localStorage if API call fails (e.g., not logged in)
            const existingCollection = JSON.parse(localStorage.getItem('animalCollection') || '[]');
            const alreadyExists = existingCollection.some(a => a.name === capturedAnimal.name);
            
            if (alreadyExists) {
                showNotification(`${capturedAnimal.name} is already in your collection`, 'info');
            } else {
                const newAnimal = {
                    ...capturedAnimal,
                    image: capturedImage,
                    addedAt: new Date().toISOString()
                };
                existingCollection.push(newAnimal);
                localStorage.setItem('animalCollection', JSON.stringify(existingCollection));
                showNotification(`${capturedAnimal.name} saved locally! Log in to sync.`, 'success');
                addBotMessage(`${capturedAnimal.name} saved locally. Log in to sync your collection across devices!`);
            }
        } finally {
            setIsAddingToCollection(false);
            setShowCollectionModal(false);
            setCapturedAnimal(null);
            setCapturedImage(null);
        }
    }, [capturedAnimal, capturedImage, isAddingToCollection, showNotification]);

    const closeCollectionModal = useCallback(() => {
        if (isAddingToCollection) return; // Prevent closing while saving
        setShowCollectionModal(false);
        setCapturedAnimal(null);
        setCapturedImage(null);
    }, [isAddingToCollection]);

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

    // Animation variants
    const messageVariants = {
        hidden: { opacity: 0, y: 20, scale: 0.95 },
        visible: { 
            opacity: 1, 
            y: 0, 
            scale: 1,
            transition: { type: 'spring', damping: 20, stiffness: 300 }
        }
    };

    // Styles based on embedded mode
    const containerClass = embedded
        ? "h-full flex flex-col bg-gradient-to-b from-slate-50 to-purple-50 overflow-hidden"
        : "flex flex-col h-screen bg-gradient-to-b from-slate-100 to-purple-100";

    return (
        <div className={containerClass}>
            {!embedded && <Header />}

            {/* --- MESSAGES AREA --- */}
            <main className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar min-h-0">

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

                <AnimatePresence mode="popLayout">
                {messages.map((msg) => (
                    <motion.div 
                        key={msg.id} 
                        className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        variants={messageVariants}
                        initial="hidden"
                        animate="visible"
                        layout
                    >
                        <div className={`flex ${embedded ? 'max-w-[95%]' : 'max-w-[85%] md:max-w-[70%]'} ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} gap-2.5 items-end`}>

                            {/* Avatar */}
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-md ${msg.role === 'user' ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white' : 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white'}`}>
                                {msg.role === 'user' ? <UserIcon /> : <RobotIcon />}
                            </div>

                            {/* Bubble */}
                            <div className={`p-3.5 shadow-sm text-sm ${msg.role === 'user'
                                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl rounded-br-sm'
                                    : 'bg-white text-gray-700 rounded-2xl rounded-bl-sm shadow-md border border-purple-100'
                                }`}>
                                {msg.type === 'image' && (
                                    <img src={msg.content} alt="Upload" className={`rounded-lg ${embedded ? 'max-h-32' : 'max-h-48'} border border-white/20 mb-2`} />
                                )}

                                {msg.type === 'text' && <p className="leading-relaxed">{msg.content}</p>}

                                {msg.type === 'result' && (
                                    <div className={embedded ? 'min-w-[180px]' : 'min-w-[220px]'}>
                                        <div className="flex items-center gap-3 mb-2 pb-2 border-b border-purple-200">
                                            <div className="p-2 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl">
                                                <PawIcon className={`${embedded ? 'w-6 h-6' : 'w-8 h-8'} text-purple-600`} />
                                            </div>
                                            <div>
                                                <h3 className={`font-bold ${embedded ? 'text-base' : 'text-lg'} text-purple-700`}>{msg.meta.animal}</h3>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-2 w-16 bg-purple-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all" style={{ width: `${msg.meta.confidence}%` }}></div>
                                                    </div>
                                                    <span className="text-xs text-purple-600 font-semibold">{msg.meta.confidence}%</span>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-gray-600 italic leading-relaxed text-xs">
                                            "{msg.content}"
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}
                </AnimatePresence>

                {/* Loading Indicator */}
                {isProcessing && (
                    <motion.div 
                        className="flex w-full justify-start"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="flex gap-2.5 items-end">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
                                <RobotIcon />
                            </div>
                            <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-sm shadow-md border border-purple-100 flex items-center gap-1.5">
                                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></span>
                                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                            </div>
                        </div>
                    </motion.div>
                )}

                <div ref={messagesEndRef} />
            </main>

            {/* --- INPUT AREA --- */}
            <div className="p-4 bg-white/80 backdrop-blur-sm border-t border-purple-100">
                <div className="max-w-4xl mx-auto">
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileSelect}
                    />

                    {/* Action Buttons - 3 options */}
                    <div className="flex gap-2 items-center">
                        {/* Upload Button */}
                        <motion.button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isProcessing || isModelLoading}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`flex-1 py-2.5 px-3 rounded-xl font-medium text-white flex items-center justify-center gap-2 transition-all text-sm shadow-md ${isProcessing || isModelLoading
                                    ? 'bg-gray-300 cursor-not-allowed opacity-75'
                                    : 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:shadow-lg hover:shadow-purple-500/25'
                                }`}
                        >
                            {isModelLoading ? (
                                <span className="text-xs">Loading AI...</span>
                            ) : (
                                <>
                                    <UploadIcon />
                                    <span>Upload</span>
                                </>
                            )}
                        </motion.button>

                        {/* Camera Capture Button */}
                        <motion.button
                            onClick={openCameraModal}
                            disabled={isProcessing || isModelLoading}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`flex-1 py-2.5 px-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all text-sm shadow-md ${isProcessing || isModelLoading
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:shadow-lg hover:shadow-blue-500/25'
                                }`}
                        >
                            <CameraIcon />
                            <span>Camera</span>
                        </motion.button>
                    </div>
                    
                    <p className="text-center text-xs text-purple-400 mt-2 font-medium">
                        Upload an image or capture with camera
                    </p>
                </div>
            </div>

            {/* --- MOBILE FULL-PAGE CAMERA VIEW --- */}
            {showCameraModal && isMobile && ReactDOM.createPortal(
                <div className="fixed inset-0 z-[9999] bg-black flex flex-col">
                    {/* Camera Preview - Full Screen */}
                    <div className="flex-1 relative overflow-hidden">
                        <video
                            ref={videoRef}
                            className={`w-full h-full object-cover ${cameraFacing === 'user' ? 'scale-x-[-1]' : ''}`}
                            playsInline
                            muted
                            autoPlay
                        />
                        
                        {/* Loading State */}
                        {!cameraReady && !cameraError && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black">
                                <div className="text-center">
                                    <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                    <p className="text-gray-300 text-sm">Starting camera...</p>
                                </div>
                            </div>
                        )}

                        {/* Error State */}
                        {cameraError && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black">
                                <div className="text-center p-6">
                                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                    </div>
                                    <p className="text-red-400 text-base mb-6">{cameraError}</p>
                                    <button
                                        onClick={closeCameraModal}
                                        className="px-6 py-3 bg-gray-800 text-white rounded-xl text-sm font-medium hover:bg-gray-700 transition"
                                    >
                                        Go Back
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Frame Guide */}
                        {cameraReady && (
                            <div className="absolute inset-6 border-2 border-purple-400/50 rounded-2xl pointer-events-none">
                                <div className="absolute -top-px -left-px w-10 h-10 border-t-3 border-l-3 border-purple-400 rounded-tl-2xl"></div>
                                <div className="absolute -top-px -right-px w-10 h-10 border-t-3 border-r-3 border-purple-400 rounded-tr-2xl"></div>
                                <div className="absolute -bottom-px -left-px w-10 h-10 border-b-3 border-l-3 border-purple-400 rounded-bl-2xl"></div>
                                <div className="absolute -bottom-px -right-px w-10 h-10 border-b-3 border-r-3 border-purple-400 rounded-br-2xl"></div>
                            </div>
                        )}

                        {/* Top Controls */}
                        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
                            <button
                                onClick={closeCameraModal}
                                className="w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white"
                            >
                                <CloseIcon />
                            </button>
                            <div className="px-4 py-2 bg-black/50 backdrop-blur-sm rounded-full">
                                <p className="text-white text-xs font-medium">Point at an animal</p>
                            </div>
                            <button
                                onClick={switchCamera}
                                disabled={!cameraReady}
                                className="w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white disabled:opacity-50"
                            >
                                <SwitchCameraIcon />
                            </button>
                        </div>
                    </div>

                    {/* Bottom Controls */}
                    <div className="bg-black p-6 flex items-center justify-center" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
                        <button
                            onClick={capturePhoto}
                            disabled={!cameraReady}
                            className="w-20 h-20 bg-white hover:bg-gray-100 rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg active:scale-95 border-4 border-purple-300"
                        >
                            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full"></div>
                        </button>
                    </div>
                </div>,
                document.body
            )}

            {/* --- CAMERA CAPTURE MODAL (Desktop) --- */}
            <AnimatePresence>
            {showCameraModal && !isMobile && (
                <motion.div 
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div 
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b border-purple-100 bg-gradient-to-r from-purple-600 to-indigo-600">
                            <div className="flex items-center gap-2 text-white">
                                <CameraIcon />
                                <h3 className="font-bold">Camera Capture</h3>
                            </div>
                            <button
                                onClick={closeCameraModal}
                                className="p-1.5 hover:bg-white/20 rounded-lg transition text-white"
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
                                <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                                    <div className="text-center">
                                        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
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
                                <div className="absolute inset-4 border-2 border-purple-400/40 rounded-xl pointer-events-none">
                                    <div className="absolute -top-px -left-px w-6 h-6 border-t-2 border-l-2 border-purple-400 rounded-tl-lg"></div>
                                    <div className="absolute -top-px -right-px w-6 h-6 border-t-2 border-r-2 border-purple-400 rounded-tr-lg"></div>
                                    <div className="absolute -bottom-px -left-px w-6 h-6 border-b-2 border-l-2 border-purple-400 rounded-bl-lg"></div>
                                    <div className="absolute -bottom-px -right-px w-6 h-6 border-b-2 border-r-2 border-purple-400 rounded-br-lg"></div>
                                </div>
                            )}
                        </div>

                        {/* Camera Controls */}
                        <div className="p-4 bg-slate-100">
                            <div className="flex items-center justify-center gap-6">
                                {/* Switch Camera */}
                                <button
                                    onClick={switchCamera}
                                    disabled={!cameraReady}
                                    className="p-3 bg-slate-200 hover:bg-slate-300 rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed text-purple-600"
                                    title="Switch Camera"
                                >
                                    <SwitchCameraIcon />
                                </button>

                                {/* Capture Button */}
                                <button
                                    onClick={capturePhoto}
                                    disabled={!cameraReady}
                                    className="w-16 h-16 bg-white hover:bg-gray-50 rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg active:scale-95 border-4 border-purple-200"
                                    title="Capture Photo"
                                >
                                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full"></div>
                                </button>

                                {/* Close Button */}
                                <button
                                    onClick={closeCameraModal}
                                    className="p-3 bg-red-100 hover:bg-red-200 rounded-full transition text-red-500"
                                    title="Cancel"
                                >
                                    <CloseIcon />
                                </button>
                            </div>
                            <p className="text-center text-xs text-slate-500 mt-3">
                                Point camera at an animal and tap to capture
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            )}
            </AnimatePresence>

            <AnimatePresence>
            {showCollectionModal && capturedAnimal && ReactDOM.createPortal(
                <motion.div 
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div 
                        className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                    >
                        <div className="relative">
                            {capturedImage && (
                                <img 
                                    src={capturedImage} 
                                    alt={capturedAnimal.name}
                                    className="w-full h-48 object-cover"
                                />
                            )}
                            <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                                capturedAnimal.isBulusanAnimal 
                                    ? 'bg-emerald-500 text-white' 
                                    : 'bg-blue-500 text-white'
                            }`}>
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                {capturedAnimal.isBulusanAnimal ? 'Zoo Animal' : 'Identified'}
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                                <h3 className="text-white text-2xl font-bold">{capturedAnimal.name}</h3>
                                <p className="text-white/80 text-sm">{capturedAnimal.confidence}% Match</p>
                            </div>
                        </div>
                        
                        <div className="p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                    capturedAnimal.isBulusanAnimal ? 'bg-emerald-100' : 'bg-blue-100'
                                }`}>
                                    <PawIcon className={`w-5 h-5 ${
                                        capturedAnimal.isBulusanAnimal ? 'text-emerald-600' : 'text-blue-600'
                                    }`} />
                                </div>
                                <span className={`text-xs font-bold uppercase tracking-wider ${
                                    capturedAnimal.isBulusanAnimal ? 'text-emerald-600' : 'text-blue-600'
                                }`}>
                                    {capturedAnimal.isBulusanAnimal ? 'Zoo Bulusan Animal' : 'Animal Identified'}
                                </span>
                            </div>
                            <p className="text-gray-600 text-sm leading-relaxed mb-5">
                                {capturedAnimal.description}
                            </p>
                            
                            <div className="flex gap-3">
                                <button
                                    onClick={closeCollectionModal}
                                    disabled={isAddingToCollection}
                                    className="flex-1 py-3 px-4 border-2 border-gray-200 text-gray-600 rounded-xl font-semibold hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={addToCollection}
                                    disabled={isAddingToCollection}
                                    className={`flex-1 py-3 px-4 text-white rounded-xl font-semibold transition shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                                        capturedAnimal.isBulusanAnimal 
                                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-emerald-500/25'
                                            : 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-blue-500/25'
                                    }`}
                                >
                                    {isAddingToCollection ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Saving...
                                        </>
                                    ) : (
                                        'Add to Collection'
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>,
                document.body
            )}
            </AnimatePresence>

            {/* Collection Notification Toast */}
            <AnimatePresence>
            {collectionNotification && ReactDOM.createPortal(
                <motion.div 
                    className="fixed bottom-6 left-1/2 z-[10000] -translate-x-1/2"
                    initial={{ opacity: 0, y: 50, x: '-50%' }}
                    animate={{ opacity: 1, y: 0, x: '-50%' }}
                    exit={{ opacity: 0, y: 20, x: '-50%' }}
                >
                    <div className={`px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 ${
                        collectionNotification.type === 'success' 
                            ? 'bg-emerald-500 text-white' 
                            : collectionNotification.type === 'error'
                                ? 'bg-red-500 text-white'
                                : 'bg-blue-500 text-white'
                    }`}>
                        {collectionNotification.type === 'success' && (
                            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        )}
                        {collectionNotification.type === 'info' && (
                            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        )}
                        {collectionNotification.type === 'error' && (
                            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        )}
                        <span className="font-medium text-sm">{collectionNotification.message}</span>
                    </div>
                </motion.div>,
                document.body
            )}
            </AnimatePresence>

            {!embedded && <Footer />}
        </div>
    );
};

export default AnimalClassifier;
