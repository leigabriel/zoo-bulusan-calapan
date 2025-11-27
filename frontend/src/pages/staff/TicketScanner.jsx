import { useState, useRef, useEffect } from 'react';
import { staffAPI } from '../../services/api-client';

const CameraIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
        <circle cx="12" cy="13" r="4"/>
    </svg>
);

const ClipboardIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
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

const TicketScanner = () => {
    const [ticketCode, setTicketCode] = useState('');
    const [scanResult, setScanResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [cameraActive, setCameraActive] = useState(false);
    const [recentScans, setRecentScans] = useState([]);
    const videoRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        inputRef.current?.focus();
        return () => {
            if (cameraActive) stopCamera();
        };
    }, []);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' } 
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setCameraActive(true);
            }
        } catch (error) {
            console.error('Error accessing camera:', error);
            alert('Unable to access camera. Please check permissions.');
        }
    };

    const stopCamera = () => {
        if (videoRef.current?.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            setCameraActive(false);
        }
    };

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
            setTicketCode('');
            inputRef.current?.focus();
        } catch (error) {
            setScanResult({
                code,
                success: false,
                message: error.message || 'Failed to validate ticket',
                timestamp: new Date().toLocaleTimeString()
            });
        } finally {
            setLoading(false);
        }
    };

    const ResultCard = ({ result }) => (
        <div className={`p-6 rounded-2xl ${
            result.success ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'
        }`}>
            <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    result.success ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                }`}>
                    {result.success ? <CheckIcon /> : <XIcon />}
                </div>
                <div className="flex-1">
                    <h3 className={`text-xl font-bold ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                        {result.success ? 'Valid Ticket' : 'Invalid Ticket'}
                    </h3>
                    <p className="text-gray-600">{result.message}</p>
                    {result.ticket && (
                        <div className="mt-2 text-sm text-gray-500">
                            <p>Visitor: {result.ticket.visitorName}</p>
                            <p>Type: {result.ticket.ticketType}</p>
                            <p>Date: {result.ticket.visitDate}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Ticket Scanner</h1>
                <p className="text-gray-500">Scan or enter ticket codes for validation</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Manual Entry</h3>
                        <form onSubmit={handleManualValidation} className="space-y-4">
                            <div>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={ticketCode}
                                    onChange={(e) => setTicketCode(e.target.value.toUpperCase())}
                                    placeholder="Enter ticket code (e.g., ZB-2024-XXXXX)"
                                    className="w-full p-4 text-lg border border-gray-300 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none font-mono"
                                    disabled={loading}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading || !ticketCode.trim()}
                                className="w-full py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
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

                    <div className="bg-white p-6 rounded-2xl shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-800">Camera Scanner</h3>
                            <button
                                onClick={cameraActive ? stopCamera : startCamera}
                                className={`px-4 py-2 rounded-lg font-medium transition ${
                                    cameraActive 
                                        ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                                }`}
                            >
                                {cameraActive ? 'Stop Camera' : 'Start Camera'}
                            </button>
                        </div>
                        <div className="aspect-video bg-gray-900 rounded-xl overflow-hidden relative">
                            {cameraActive ? (
                                <>
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        playsInline
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-48 h-48 border-2 border-green-500 rounded-lg"></div>
                                    </div>
                                </>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500">
                                    <div className="text-center">
                                        <div className="flex justify-center mb-2"><CameraIcon /></div>
                                        <p>Camera is off</p>
                                        <p className="text-sm">Click "Start Camera" to scan QR codes</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {scanResult && <ResultCard result={scanResult} />}

                    <div className="bg-white p-6 rounded-2xl shadow-sm">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Scans</h3>
                        {recentScans.length > 0 ? (
                            <div className="space-y-2">
                                {recentScans.map((scan, index) => (
                                    <div 
                                        key={index}
                                        className={`flex items-center justify-between p-3 rounded-xl ${
                                            scan.success ? 'bg-green-50' : 'bg-red-50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className={scan.success ? 'text-green-500' : 'text-red-500'}>
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
                                            <span className="font-mono text-sm">{scan.code}</span>
                                        </div>
                                        <span className="text-xs text-gray-500">{scan.timestamp}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-gray-500 py-8">
                                <div className="flex justify-center mb-2"><ClipboardIcon /></div>
                                <p>No scans yet</p>
                            </div>
                        )}
                    </div>

                    <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                        <h4 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                            <InfoIcon /> Quick Tips
                        </h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                            <li>• Ticket codes are in format: ZB-2024-XXXXX</li>
                            <li>• Ensure good lighting when using camera</li>
                            <li>• Each ticket can only be validated once</li>
                            <li>• Contact admin for duplicate entry issues</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TicketScanner;
