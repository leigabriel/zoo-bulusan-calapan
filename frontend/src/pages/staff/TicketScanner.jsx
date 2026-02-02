import { useState, useRef, useEffect, useCallback } from 'react';
import { staffAPI } from '../../services/api-client';
import { sanitizeInput } from '../../utils/sanitize';

// Icons
const CameraIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
        <circle cx="12" cy="13" r="4"/>
    </svg>
);

const QRIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <rect x="3" y="3" width="7" height="7"/>
        <rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/>
    </svg>
);

const ClipboardIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
    </svg>
);

const InfoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="16" x2="12" y2="12"/>
        <line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
);

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
        <polyline points="20 6 9 17 4 12"/>
    </svg>
);

const XIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
);

const TicketIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
        <path d="M13 5v2"/>
        <path d="M13 17v2"/>
        <path d="M13 11v2"/>
    </svg>
);

const TicketScanner = () => {
    const [ticketCode, setTicketCode] = useState('');
    const [scanResult, setScanResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [cameraActive, setCameraActive] = useState(false);
    const [cameraError, setCameraError] = useState(null);
    const [recentScans, setRecentScans] = useState([]);
    const [todayStats, setTodayStats] = useState({ scanned: 0, valid: 0, invalid: 0 });
    const [scanMode, setScanMode] = useState('manual'); // 'manual' or 'camera'
    
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const inputRef = useRef(null);
    const scannerRef = useRef(null);
    const animationRef = useRef(null);

    // Load html5-qrcode dynamically
    useEffect(() => {
        const loadQRScanner = async () => {
            if (!window.Html5Qrcode) {
                const script = document.createElement('script');
                script.src = 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js';
                script.async = true;
                document.body.appendChild(script);
            }
        };
        loadQRScanner();
        inputRef.current?.focus();
        
        return () => {
            stopCamera();
        };
    }, []);

    const startCamera = async () => {
        try {
            setCameraError(null);
            
            // Check if the qr-reader element exists
            const qrReaderElement = document.getElementById('qr-reader');
            if (!qrReaderElement) {
                throw new Error('QR reader element not found');
            }
            
            // Try using html5-qrcode library if available
            if (window.Html5Qrcode) {
                // Stop any existing scanner first
                if (scannerRef.current) {
                    try {
                        await scannerRef.current.stop();
                    } catch (e) {
                        // Ignore stop errors
                    }
                    scannerRef.current = null;
                }
                
                const html5QrCode = new window.Html5Qrcode("qr-reader");
                scannerRef.current = html5QrCode;
                
                // Get available cameras first
                const devices = await window.Html5Qrcode.getCameras();
                if (!devices || devices.length === 0) {
                    throw new Error('No cameras found on this device');
                }
                
                await html5QrCode.start(
                    { facingMode: "environment" },
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1.777778
                    },
                    async (decodedText) => {
                        // QR code successfully scanned
                        if (!loading) {
                            // Stop scanning temporarily to prevent multiple scans
                            try {
                                await html5QrCode.pause(true);
                            } catch (e) {
                                // Ignore pause errors
                            }
                            await validateTicket(decodedText);
                            // Resume scanning after validation
                            setTimeout(() => {
                                try {
                                    html5QrCode.resume();
                                } catch (e) {
                                    // Ignore resume errors
                                }
                            }, 2000);
                        }
                    },
                    (errorMessage) => {
                        // Continuous scanning - errors are expected when no QR is in view
                    }
                );
                
                setCameraActive(true);
            } else {
                // Wait for library to load
                let attempts = 0;
                while (!window.Html5Qrcode && attempts < 20) {
                    await new Promise(resolve => setTimeout(resolve, 200));
                    attempts++;
                }
                
                if (window.Html5Qrcode) {
                    // Retry with loaded library
                    startCamera();
                    return;
                }
                
                // Fallback to basic camera access
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { facingMode: 'environment' } 
                });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    setCameraActive(true);
                }
            }
        } catch (error) {
            console.error('Error accessing camera:', error);
            let errorMessage = 'Unable to access camera. ';
            
            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                errorMessage += 'Camera permission was denied. Please allow camera access in your browser settings.';
            } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
                errorMessage += 'No camera found on this device.';
            } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
                errorMessage += 'Camera is being used by another application.';
            } else if (error.message) {
                errorMessage += error.message;
            } else {
                errorMessage += 'Please check permissions and try again.';
            }
            
            setCameraError(errorMessage);
            setCameraActive(false);
        }
    };

    const stopCamera = useCallback(() => {
        if (scannerRef.current) {
            scannerRef.current.stop().catch(console.error);
            scannerRef.current = null;
        }
        if (videoRef.current?.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        }
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }
        setCameraActive(false);
    }, []);

    const handleManualValidation = async (e) => {
        e.preventDefault();
        if (!ticketCode.trim()) return;
        await validateTicket(ticketCode.trim());
    };

    const validateTicket = async (code) => {
        setLoading(true);
        setScanResult(null);
        
        try {
            const response = await staffAPI.validateTicket(code);
            
            const result = {
                code,
                ...response,
                timestamp: new Date().toLocaleTimeString()
            };
            
            setScanResult(result);
            setRecentScans(prev => [result, ...prev.slice(0, 9)]);
            setTodayStats(prev => ({
                scanned: prev.scanned + 1,
                valid: result.success ? prev.valid + 1 : prev.valid,
                invalid: !result.success ? prev.invalid + 1 : prev.invalid
            }));
            setTicketCode('');
            inputRef.current?.focus();
        } catch (error) {
            const result = {
                code,
                success: false,
                message: error.message || 'Failed to validate ticket',
                timestamp: new Date().toLocaleTimeString()
            };
            setScanResult(result);
            setRecentScans(prev => [result, ...prev.slice(0, 9)]);
            setTodayStats(prev => ({
                ...prev,
                scanned: prev.scanned + 1,
                invalid: prev.invalid + 1
            }));
        } finally {
            setLoading(false);
        }
    };

    const ResultCard = ({ result }) => (
        <div className={`p-6 rounded-2xl border ${
            result.success 
                ? 'bg-[#8cff65]/10 border-[#8cff65]/30' 
                : 'bg-red-500/10 border-red-500/30'
        }`}>
            <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    result.success ? 'bg-[#8cff65]/20 text-[#8cff65]' : 'bg-red-500/20 text-red-400'
                }`}>
                    {result.success ? <CheckIcon /> : <XIcon />}
                </div>
                <div className="flex-1">
                    <h3 className={`text-xl font-bold ${result.success ? 'text-[#8cff65]' : 'text-red-400'}`}>
                        {result.success ? 'Valid Ticket ✓' : 'Invalid Ticket ✗'}
                    </h3>
                    <p className="text-gray-400">{result.message}</p>
                    {result.ticket && (
                        <div className="mt-3 p-3 bg-[#0a0a0a] rounded-xl space-y-1">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Visitor:</span>
                                <span className="text-white">{result.ticket.visitorName || result.ticket.visitor_name}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Type:</span>
                                <span className="text-white capitalize">{result.ticket.ticketType || result.ticket.ticket_type}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Quantity:</span>
                                <span className="text-white">{result.ticket.quantity || 1}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Visit Date:</span>
                                <span className="text-white">{result.ticket.visitDate || result.ticket.visit_date}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Booking Ref:</span>
                                <span className="text-[#8cff65] font-mono">{result.ticket.booking_reference}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Scanned Today</p>
                            <p className="text-2xl font-bold text-white">{todayStats.scanned}</p>
                        </div>
                        <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400">
                            <QRIcon />
                        </div>
                    </div>
                </div>
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4">
                    <p className="text-gray-400 text-sm">Valid</p>
                    <p className="text-2xl font-bold text-[#8cff65]">{todayStats.valid}</p>
                </div>
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4">
                    <p className="text-gray-400 text-sm">Invalid</p>
                    <p className="text-2xl font-bold text-red-400">{todayStats.invalid}</p>
                </div>
            </div>

            {/* Mode Toggle */}
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-2">
                <div className="flex gap-2">
                    <button
                        onClick={() => { setScanMode('manual'); stopCamera(); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition ${
                            scanMode === 'manual'
                                ? 'bg-[#8cff65] text-black'
                                : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
                        }`}
                    >
                        <ClipboardIcon />
                        Manual Entry
                    </button>
                    <button
                        onClick={() => setScanMode('camera')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition ${
                            scanMode === 'camera'
                                ? 'bg-[#8cff65] text-black'
                                : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
                        }`}
                    >
                        <CameraIcon />
                        Camera Scan
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Scanner Section */}
                <div className="space-y-6">
                    {scanMode === 'manual' ? (
                        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <TicketIcon />
                                Enter Ticket Code or QR Code
                            </h3>
                            <form onSubmit={handleManualValidation} className="space-y-4">
                                <div>
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={ticketCode}
                                        onChange={(e) => setTicketCode(sanitizeInput(e.target.value.toUpperCase()))}
                                        placeholder="Enter booking reference (ZB-XXXXXXXX) or QR code"
                                        className="w-full p-4 text-lg bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl text-white placeholder-gray-500 focus:border-[#8cff65] outline-none font-mono"
                                        disabled={loading}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading || !ticketCode.trim()}
                                    className="w-full py-4 bg-[#8cff65] text-black font-bold rounded-xl hover:bg-[#7ae554] transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                            Validating...
                                        </span>
                                    ) : (
                                        'Validate Ticket'
                                    )}
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <CameraIcon />
                                    QR Code Scanner
                                </h3>
                                <button
                                    onClick={cameraActive ? stopCamera : startCamera}
                                    className={`px-4 py-2 rounded-xl font-medium transition ${
                                        cameraActive 
                                            ? 'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20' 
                                            : 'bg-[#8cff65]/10 border border-[#8cff65]/30 text-[#8cff65] hover:bg-[#8cff65]/20'
                                    }`}
                                >
                                    {cameraActive ? 'Stop Camera' : 'Start Camera'}
                                </button>
                            </div>
                            
                            {cameraError && (
                                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                                    {cameraError}
                                </div>
                            )}
                            
                            <div className="aspect-video bg-[#0a0a0a] rounded-xl overflow-hidden relative">
                                {/* QR reader div - always present but hidden when camera is off */}
                                <div 
                                    id="qr-reader" 
                                    className={`w-full h-full ${cameraActive ? 'block' : 'hidden'}`}
                                    style={{ minHeight: '200px' }}
                                ></div>
                                
                                {!cameraActive && (
                                    <div className="w-full h-full flex items-center justify-center absolute inset-0">
                                        <div className="text-center text-gray-500">
                                            <div className="flex justify-center mb-3">
                                                <div className="w-16 h-16 bg-[#1a1a1a] rounded-2xl flex items-center justify-center">
                                                    <QRIcon />
                                                </div>
                                            </div>
                                            <p className="font-medium">Camera is off</p>
                                            <p className="text-sm mt-1">Click "Start Camera" to scan QR codes</p>
                                        </div>
                                    </div>
                                )}
                                {cameraActive && (
                                    <div className="absolute bottom-3 left-3 right-3 text-center z-10">
                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-black/70 rounded-lg text-white text-sm">
                                            <div className="w-2 h-2 bg-[#8cff65] rounded-full animate-pulse"></div>
                                            Scanning for QR codes...
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            <canvas ref={canvasRef} className="hidden" />
                            <video ref={videoRef} autoPlay playsInline className="hidden" />
                        </div>
                    )}

                    {/* Result Display */}
                    {scanResult && <ResultCard result={scanResult} />}
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* Recent Scans */}
                    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-white mb-4">Recent Scans</h3>
                        {recentScans.length > 0 ? (
                            <div className="space-y-2 max-h-80 overflow-y-auto">
                                {recentScans.map((scan, index) => (
                                    <div 
                                        key={index}
                                        className={`flex items-center justify-between p-3 rounded-xl border ${
                                            scan.success 
                                                ? 'bg-[#8cff65]/5 border-[#8cff65]/20' 
                                                : 'bg-red-500/5 border-red-500/20'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className={scan.success ? 'text-[#8cff65]' : 'text-red-400'}>
                                                {scan.success ? (
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                                                        <polyline points="20 6 9 17 4 12"/>
                                                    </svg>
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                                                        <line x1="18" y1="6" x2="6" y2="18"/>
                                                        <line x1="6" y1="6" x2="18" y2="18"/>
                                                    </svg>
                                                )}
                                            </span>
                                            <span className="font-mono text-sm text-white">{scan.code?.substring(0, 16)}{scan.code?.length > 16 ? '...' : ''}</span>
                                        </div>
                                        <span className="text-xs text-gray-500">{scan.timestamp}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-gray-500 py-8">
                                <div className="flex justify-center mb-3">
                                    <div className="w-12 h-12 bg-[#0a0a0a] rounded-xl flex items-center justify-center">
                                        <ClipboardIcon />
                                    </div>
                                </div>
                                <p>No scans yet</p>
                            </div>
                        )}
                    </div>

                    {/* Quick Tips */}
                    <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-2xl">
                        <h4 className="font-bold text-blue-400 mb-3 flex items-center gap-2">
                            <InfoIcon /> Quick Tips
                        </h4>
                        <ul className="text-sm text-blue-300 space-y-2">
                            <li className="flex items-start gap-2">
                                <span className="text-blue-500">•</span>
                                <span>Booking codes are in format: ZB-XXXXXXXX</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-500">•</span>
                                <span>QR codes contain a unique 16-character hex code</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-500">•</span>
                                <span>Ensure good lighting when using camera scanner</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-500">•</span>
                                <span>Each ticket can only be validated once per visit date</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-500">•</span>
                                <span>Contact admin for duplicate entry or refund issues</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TicketScanner;
