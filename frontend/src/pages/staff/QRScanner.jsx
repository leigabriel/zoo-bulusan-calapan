import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { reservationAPI } from '../../services/api-client';
import { notify } from '../../utils/toast';

const Icons = {
    Scan: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10">
            <path d="M3 7V5a2 2 0 0 1 2-2h2" />
            <path d="M17 3h2a2 2 0 0 1 2 2v2" />
            <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
            <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
            <rect x="7" y="7" width="10" height="10" rx="1" />
        </svg>
    ),
    Check: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
            <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
        </svg>
    ),
    User: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    ),
    Camera: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
        </svg>
    ),
    Upload: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
    )
};

const QRScanner = () => {
    const { isAuthenticated } = useAuth();
    const [scanResult, setScanResult] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [scanMethod, setScanMethod] = useState('camera');

    const fileInputRef = useRef(null);
    const cameraScannerRef = useRef(null);
    const fileScannerRef = useRef(null);
    const lastScanRef = useRef({ text: '', time: 0 });

    const processQRText = async (decodedText, isCamera = true) => {
        try {
            const now = Date.now();
            if (decodedText === lastScanRef.current.text && now - lastScanRef.current.time < 2000) {
                return;
            }
            lastScanRef.current = { text: decodedText, time: now };
            setLoading(true);
            setError(null);

            if (isCamera && cameraScannerRef.current && cameraScannerRef.current.isScanning) {
                try {
                    await cameraScannerRef.current.stop();
                } catch (e) {
                    console.error(e);
                }
            }

            const res = await reservationAPI.scanReservation(decodedText, false);
            if (res.success && res.reservation) {
                setScanResult({
                    ...res.reservation,
                    scanStatus: res.status,
                    qrData: decodedText
                });
                notify.success('Valid ticket detected!');
            } else {
                setError(res.message || 'Invalid or expired ticket sequence.');
                notify.error('Invalid ticket.');
                if (isCamera) {
                    setTimeout(() => {
                        setError(null);
                        setScanResult(null);
                    }, 3000);
                }
            }
        } catch (err) {
            console.error(err);
            const errorMessage = typeof err === 'string' ? err : (err.message || 'Error processing ticket.');
            setError(errorMessage);
            notify.error('Error processing ticket.');
            if (isCamera) {
                setTimeout(() => {
                    setError(null);
                    setScanResult(null);
                }, 3000);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isAuthenticated || scanMethod !== 'camera' || scanResult || loading) return;

        let isMounted = true;

        const initCamera = async () => {
            try {
                await new Promise(r => setTimeout(r, 200));
                if (!isMounted) return;

                if (!cameraScannerRef.current) {
                    cameraScannerRef.current = new Html5Qrcode("qr-reader-camera");
                }

                const cameras = await Html5Qrcode.getCameras();
                if (!cameras || cameras.length === 0) {
                    throw new Error("No cameras found on device.");
                }

                const backCamera = cameras.find(c => c.label.toLowerCase().includes('back') || c.label.toLowerCase().includes('environment'));
                const cameraId = backCamera ? backCamera.id : cameras[0].id;

                const config = {
                    fps: 15,
                    qrbox: (viewfinderWidth, viewfinderHeight) => {
                        const size = Math.min(viewfinderWidth, viewfinderHeight, 280);
                        return { width: size, height: size };
                    },
                    aspectRatio: 1.0,
                    formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
                    experimentalFeatures: { useBarCodeDetectorIfSupported: true }
                };

                await cameraScannerRef.current.start(
                    cameraId,
                    config,
                    (text) => {
                        if (isMounted && !loading && !scanResult) processQRText(text, true);
                    },
                    () => { }
                );

            } catch (err) {
                console.error(err);
                if (isMounted) {
                    const errorMsg = typeof err === 'string' ? err : (err.message || 'Unknown camera error');
                    setError(`Could not access camera: ${errorMsg}. Please check permissions or try uploading an image.`);
                }
            }
        };

        initCamera();

        return () => {
            isMounted = false;
            if (cameraScannerRef.current) {
                if (cameraScannerRef.current.isScanning) {
                    cameraScannerRef.current.stop().catch(console.error);
                }
                try {
                    cameraScannerRef.current.clear();
                } catch (err) {
                    console.error(err);
                }
            }
        };
    }, [isAuthenticated, scanMethod, scanResult, loading]);

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            setLoading(true);
            setError(null);

            if (!fileScannerRef.current) {
                fileScannerRef.current = new Html5Qrcode("qr-reader-file");
            }

            const decodedText = await fileScannerRef.current.scanFile(file, true);
            await processQRText(decodedText, false);

        } catch (err) {
            console.error(err);
            setError('Could not read QR code from image. Please ensure the image is clear and contains a valid QR code.');
            notify.error('Could not read QR code from image.');
        } finally {
            if (fileScannerRef.current) {
                try { fileScannerRef.current.clear(); } catch (e) { }
            }
            setLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleConfirmCheckIn = async () => {
        if (!scanResult?.qrData) return;
        setLoading(true);
        try {
            const res = await reservationAPI.scanReservation(scanResult.qrData, true);
            if (res.success) {
                notify.success('Check-in confirmed successfully.');
                setScanResult({ ...scanResult, scanStatus: 'used' });
                setTimeout(() => {
                    setScanResult(null);
                }, 2000);
            } else {
                notify.error(res.message || 'Failed to check-in.');
            }
        } catch (err) {
            console.error(err);
            notify.error('Error confirming check-in.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setScanResult(null);
        setError(null);
    };

    if (!isAuthenticated) return null;

    return (
        <div className="max-w-[1400px] mx-auto space-y-10 p-4 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div>
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">QR Ticket Scanner</h1>
                    <p className="text-lg sm:text-xl text-gray-500 mt-3">Scan visitor and event reservations to view details and authorize entry</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                <div className="bg-white rounded-[2rem] shadow-2xl shadow-gray-200/50 flex flex-col h-full min-h-[700px] overflow-hidden border border-gray-100">
                    <div className="p-6 sm:p-8 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-4">
                            <Icons.Scan />
                            Scan Ticket
                        </h2>

                        <div className="flex bg-gray-200/50 rounded-2xl p-1.5 shadow-inner">
                            <button
                                onClick={() => {
                                    setError(null);
                                    setScanMethod('camera');
                                }}
                                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-base font-bold transition-all ${scanMethod === 'camera'
                                        ? 'bg-white text-gray-900 shadow-md'
                                        : 'text-gray-500 hover:text-gray-800'
                                    }`}
                            >
                                <Icons.Camera />
                                <span className="hidden sm:inline">Camera</span>
                            </button>
                            <button
                                onClick={() => {
                                    setError(null);
                                    setScanMethod('upload');
                                }}
                                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-base font-bold transition-all ${scanMethod === 'upload'
                                        ? 'bg-white text-gray-900 shadow-md'
                                        : 'text-gray-500 hover:text-gray-800'
                                    }`}
                            >
                                <Icons.Upload />
                                <span className="hidden sm:inline">Upload</span>
                            </button>
                        </div>
                    </div>

                    <div className="p-8 sm:p-12 flex-1 flex flex-col items-center justify-center relative bg-white">
                        {scanMethod === 'camera' && (
                            <div className="w-full max-w-xl flex flex-col items-center">
                                <div
                                    id="qr-reader-camera"
                                    className="w-full aspect-square rounded-[2.5rem] overflow-hidden shadow-inner border-[6px] border-gray-100 bg-black"
                                ></div>

                                {error && (
                                    <div className="mt-8 p-5 bg-red-50 text-red-700 rounded-2xl text-lg font-bold w-full text-center border-2 border-red-100">
                                        {error}
                                    </div>
                                )}
                            </div>
                        )}

                        {scanMethod === 'upload' && (
                            <div className="w-full max-w-xl flex flex-col items-center justify-center gap-6">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                />

                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full aspect-square rounded-[2.5rem] border-4 border-dashed border-gray-200 bg-gray-50/50 flex flex-col items-center justify-center gap-6 cursor-pointer hover:bg-gray-50 hover:border-gray-400 transition-all p-12 text-center"
                                >
                                    <div className="w-24 h-24 bg-white shadow-sm rounded-full flex items-center justify-center text-gray-400 mb-2">
                                        <Icons.Upload />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 text-2xl">Upload QR Image</p>
                                        <p className="text-gray-500 text-lg mt-3">Click to browse your files</p>
                                    </div>
                                </div>

                                {error && (
                                    <div className="mt-4 p-5 bg-red-50 text-red-700 rounded-2xl text-lg font-bold w-full text-center border-2 border-red-100">
                                        {error}
                                    </div>
                                )}
                            </div>
                        )}

                        <div
                            id="qr-reader-file"
                            style={{ position: 'fixed', left: '-9999px', top: '-9999px', width: '500px', height: '500px', opacity: 0, zIndex: -100 }}
                        ></div>

                        {loading && !scanResult && (
                            <div className="mt-8 p-5 bg-gray-900 text-white rounded-2xl text-xl font-bold w-full max-w-xl text-center shadow-xl flex items-center justify-center gap-4">
                                <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                                Processing Scan...
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-[2rem] shadow-2xl shadow-gray-200/50 flex flex-col h-full min-h-[700px] overflow-hidden border border-gray-100">
                    <div className="p-6 sm:p-8 border-b border-gray-100 bg-gray-50/50">
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-4">
                            <Icons.User />
                            Ticket Details
                        </h2>
                    </div>
                    <div className="p-8 sm:p-12 flex-1 flex flex-col">
                        {!scanResult ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 border-4 border-dashed border-gray-100 rounded-[2.5rem] p-12 bg-gray-50/50 min-h-[400px]">
                                <div className="w-28 h-28 bg-white rounded-full flex items-center justify-center text-gray-300 mb-8 shadow-sm">
                                    <Icons.Scan />
                                </div>
                                <p className="text-3xl font-bold text-gray-800">Waiting for scan</p>
                                <p className="text-lg text-gray-500 mt-4 text-center max-w-md">
                                    {scanMethod === 'camera'
                                        ? "Position the QR code clearly within the camera frame to automatically scan."
                                        : "Upload a high-quality image containing a QR code to view the ticket details."}
                                </p>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                                    <div>
                                        <span className="inline-block px-5 py-2 bg-gray-900 text-white text-sm font-extrabold uppercase tracking-widest rounded-full mb-4 shadow-md">
                                            {scanResult.type} Reservation
                                        </span>
                                        <h3 className="text-4xl font-extrabold text-gray-900 tracking-tight">{scanResult.reference}</h3>
                                    </div>
                                    <span className={`px-6 py-3 rounded-2xl text-lg font-bold uppercase tracking-widest shadow-sm border-2 ${scanResult.scanStatus === 'used' ? 'bg-gray-100 text-gray-700 border-gray-200' :
                                            scanResult.scanStatus === 'expired' ? 'bg-red-50 text-red-700 border-red-200' :
                                                'bg-blue-50 text-blue-700 border-blue-200'
                                        }`}>
                                        {scanResult.scanStatus === 'used' ? 'Checked In' : scanResult.scanStatus}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-10 gap-x-8 bg-gray-50 p-10 rounded-[2.5rem] border-2 border-gray-100 mt-4">
                                    <div className="col-span-1 sm:col-span-2">
                                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Guest Name</p>
                                        <p className="font-extrabold text-gray-900 text-4xl">{scanResult.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Date</p>
                                        <p className="font-bold text-gray-900 text-2xl">{new Date(scanResult.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Time</p>
                                        <p className="font-bold text-gray-900 text-2xl">{scanResult.time || 'Anytime'}</p>
                                    </div>
                                    <div className="col-span-1 sm:col-span-2">
                                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Admissions</p>
                                        <p className="font-bold text-gray-900 text-2xl flex items-center gap-3">
                                            <span className="bg-gray-900 text-white px-4 py-1 rounded-xl font-extrabold shadow-sm">{scanResult.totalVisitors}</span>
                                            {scanResult.totalVisitors === 1 ? 'Person' : 'People'}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-auto pt-10 flex flex-col sm:flex-row gap-5">
                                    <button
                                        onClick={handleCancel}
                                        disabled={loading}
                                        className="flex-1 py-5 px-6 bg-white border-2 border-gray-200 text-gray-700 rounded-2xl text-xl font-bold hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50"
                                    >
                                        Scan Another
                                    </button>
                                    <button
                                        onClick={handleConfirmCheckIn}
                                        disabled={loading || scanResult.scanStatus === 'used' || scanResult.scanStatus === 'expired'}
                                        className={`flex-[2] py-5 px-6 rounded-2xl text-xl flex items-center justify-center gap-3 font-extrabold transition-all shadow-lg border-2 ${scanResult.scanStatus === 'used' || scanResult.scanStatus === 'expired'
                                                ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                                                : 'bg-gray-900 border-gray-900 text-white hover:bg-black hover:border-black hover:shadow-xl hover:-translate-y-1'
                                            }`}
                                    >
                                        {loading ? (
                                            <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        ) : scanResult.scanStatus === 'used' ? (
                                            'Already Checked In'
                                        ) : scanResult.scanStatus === 'expired' ? (
                                            'Ticket Expired'
                                        ) : (
                                            <>
                                                <Icons.Check />
                                                <span>Confirm Check-in</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QRScanner;