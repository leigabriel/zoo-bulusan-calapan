import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { reservationAPI } from '../../services/api-client';
import { notify } from '../../utils/toast';

const Icons = {
    Scan: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7 sm:h-8 sm:w-8">
            <path d="M3 7V5a2 2 0 0 1 2-2h2" />
            <path d="M17 3h2a2 2 0 0 1 2 2v2" />
            <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
            <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
            <rect x="7" y="7" width="10" height="10" rx="1" />
        </svg>
    ),
    Check: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
            <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
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

const ResultModal = ({ scanResult, loading, onClose, onConfirm }) => {
    if (!scanResult) return null;

    const statusClass = scanResult.scanStatus === 'used'
        ? 'bg-gray-100 text-gray-700 border-gray-200'
        : scanResult.scanStatus === 'expired'
            ? 'bg-red-50 text-red-700 border-red-200'
            : 'bg-emerald-50 text-emerald-700 border-emerald-200';

    return (
        <div
            className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-slate-950/55 p-0 sm:p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="scan-result-title"
        >
            <button type="button" className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Close scan result" />
            <div className="relative flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[1.75rem] bg-white shadow-2xl sm:max-h-[90dvh] sm:rounded-[1.75rem]">
            <div className="flex items-start justify-between gap-4 border-b border-emerald-100 bg-emerald-50/50 px-4 py-4 sm:px-6">
                    <div className="min-w-0">
                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700">Verified reservation</p>
                        <h2 id="scan-result-title" className="mt-1 truncate text-xl font-extrabold tracking-tight text-gray-900 sm:text-2xl">Ticket details</h2>
                    </div>
                    <button type="button" onClick={onClose} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-xl text-gray-500 shadow-sm ring-1 ring-gray-200 transition hover:bg-emerald-50 hover:text-emerald-700" aria-label="Close ticket details">
                        &times;
                    </button>
                </div>

                <div className="overflow-y-auto p-4 sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                            <span className="mb-2 inline-flex rounded-full bg-gray-900 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-white sm:text-xs">
                                {scanResult.type} reservation
                            </span>
                            <h3 className="break-all text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">{scanResult.reference}</h3>
                        </div>
                        <span className={`inline-flex w-fit shrink-0 rounded-xl border px-3 py-2 text-xs font-bold uppercase tracking-wider ${statusClass}`}>
                            {scanResult.scanStatus === 'used' ? 'Checked In' : scanResult.scanStatus}
                        </span>
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-5 rounded-2xl border border-gray-100 bg-gray-50 p-4 sm:grid-cols-2 sm:p-5">
                        <div className="sm:col-span-2">
                            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">Guest name</p>
                            <p className="mt-1 break-words text-xl font-extrabold text-gray-900 sm:text-2xl">{scanResult.name}</p>
                            {scanResult.email && <p className="mt-1 break-all text-sm text-gray-500">{scanResult.email}</p>}
                        </div>

                        {scanResult.type === 'event' && scanResult.eventName && (
                            <div className="sm:col-span-2">
                                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">Event</p>
                                <p className="mt-1 text-base font-bold text-gray-900 sm:text-lg">{scanResult.eventName}</p>
                                {scanResult.eventDescription && <p className="mt-1 text-sm leading-relaxed text-gray-500">{scanResult.eventDescription}</p>}
                            </div>
                        )}

                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">Date</p>
                            <p className="mt-1 text-sm font-bold text-gray-900 sm:text-base">{new Date(scanResult.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">Time</p>
                            <p className="mt-1 text-sm font-bold text-gray-900 sm:text-base">{scanResult.time || 'Anytime'}</p>
                        </div>
                        <div className="sm:col-span-2">
                            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">Admissions</p>
                            <p className="mt-1 flex items-center gap-2 text-sm font-bold text-gray-900 sm:text-base">
                                <span className="rounded-lg bg-gray-900 px-2.5 py-1 text-white">{scanResult.totalVisitors}</span>
                                {scanResult.totalVisitors === 1 ? 'Person' : 'People'}
                            </p>
                        </div>

                        {scanResult.type === 'ticket' ? (
                            <div className="grid grid-cols-2 gap-4 border-t border-gray-200 pt-4 sm:col-span-2 sm:grid-cols-4">
                                <div><p className="text-[10px] font-bold uppercase text-gray-400">Adults</p><p className="mt-1 font-bold text-gray-900">{scanResult.adultQuantity || 0}</p></div>
                                <div><p className="text-[10px] font-bold uppercase text-gray-400">Children</p><p className="mt-1 font-bold text-gray-900">{scanResult.childQuantity || 0}</p></div>
                                <div><p className="text-[10px] font-bold uppercase text-gray-400">Residents</p><p className="mt-1 font-bold text-gray-900">{scanResult.residentQuantity || 0}</p></div>
                                <div><p className="text-[10px] font-bold uppercase text-gray-400">Amount</p><p className="mt-1 font-bold text-gray-900">&#8369;{Number(scanResult.ticketAmount || 0).toLocaleString()}</p></div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4 border-t border-gray-200 pt-4 sm:col-span-2">
                                <div><p className="text-[10px] font-bold uppercase text-gray-400">Payment</p><p className="mt-1 font-bold text-gray-900">&#8369;{Number(scanResult.paymentAmount || 0).toLocaleString()}</p></div>
                                <div><p className="text-[10px] font-bold uppercase text-gray-400">Payment status</p><p className="mt-1 font-bold uppercase text-gray-900">{scanResult.paymentStatus || 'unpaid'}</p></div>
                                {scanResult.eventEndTime && <div><p className="text-[10px] font-bold uppercase text-gray-400">End time</p><p className="mt-1 font-bold text-gray-900">{scanResult.eventEndTime}</p></div>}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-gray-100 bg-white p-4 sm:flex-row sm:p-6">
                    <button type="button" onClick={onClose} disabled={loading} className="min-h-12 flex-1 rounded-xl border-2 border-gray-200 px-4 text-sm font-bold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50">Scan another</button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading || scanResult.scanStatus === 'used' || scanResult.scanStatus === 'expired'}
                        className={`min-h-12 flex-[2] rounded-xl border-2 px-4 text-sm font-extrabold transition ${scanResult.scanStatus === 'used' || scanResult.scanStatus === 'expired' ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400' : 'border-emerald-700 bg-emerald-700 text-white hover:bg-emerald-800'}`}
                    >
                        {loading ? <span className="mx-auto block h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : scanResult.scanStatus === 'used' ? 'Already checked in' : scanResult.scanStatus === 'expired' ? 'Ticket expired' : <span className="inline-flex items-center justify-center gap-2"><Icons.Check /><span>Confirm check-in</span></span>}
                    </button>
                </div>
            </div>
        </div>
    );
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
    const processingScanRef = useRef(false);

    const processQRText = async (decodedText, isCamera = true) => {
        try {
            const now = Date.now();
            if (decodedText === lastScanRef.current.text && now - lastScanRef.current.time < 2000) {
                return;
            }
            lastScanRef.current = { text: decodedText, time: now };
            processingScanRef.current = true;
            setLoading(true);
            setError(null);

            const res = await reservationAPI.scanReservation(decodedText, false);
            if (res.success && res.reservation) {
                setScanResult({
                    ...res.reservation,
                    scanStatus: res.status,
                    qrData: decodedText
                });
                notify.success('Ticket verified.');
            } else {
                setError(res.message || 'Invalid or expired ticket.');
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
            const errorMessage = typeof err === 'string' ? err : (err.message || "Couldn't process ticket.");
            setError(errorMessage);
            notify.error("Couldn't process ticket.");
            if (isCamera) {
                setTimeout(() => {
                    setError(null);
                    setScanResult(null);
                }, 3000);
            }
        } finally {
            processingScanRef.current = false;
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isAuthenticated || scanMethod !== 'camera' || scanResult) return;

        let isMounted = true;
        let scanner;

        const initCamera = async () => {
            try {
                await new Promise(r => setTimeout(r, 200));
                if (!isMounted) return;

                scanner = new Html5Qrcode("qr-reader-camera");
                cameraScannerRef.current = scanner;

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

                // Using facingMode lets the browser select the rear camera on phones
                // and prompts for permission without requiring camera enumeration first.
                await scanner.start(
                    { facingMode: 'environment' },
                    config,
                    (text) => {
                        if (isMounted && !processingScanRef.current && !scanResult) {
                            processQRText(text, true);
                        }
                    },
                    () => { }
                );

                if (!isMounted && scanner.isScanning) {
                    await scanner.stop();
                }

            } catch (err) {
                console.error(err);
                if (isMounted) {
                    const errorMsg = typeof err === 'string' ? err : (err.message || 'Unknown camera error');
                    const secureContextHint = window.isSecureContext
                        ? ''
                        : ' Camera access requires HTTPS or localhost.';
                    setError(`Could not access camera: ${errorMsg}.${secureContextHint} Please check permissions or try uploading an image.`);
                }
            }
        };

        initCamera();

        return () => {
            isMounted = false;
            if (scanner) {
                const stopCamera = async () => {
                    try {
                        if (scanner.isScanning) await scanner.stop();
                        scanner.clear();
                    } catch (err) {
                        console.error('Unable to stop QR camera:', err);
                    } finally {
                        if (cameraScannerRef.current === scanner) {
                            cameraScannerRef.current = null;
                        }
                    }
                };
                stopCamera();
            }
        };
    }, [isAuthenticated, scanMethod, scanResult]);

    useEffect(() => {
        if (!scanResult) return undefined;

        const previousOverflow = document.body.style.overflow;
        const handleKeyDown = (event) => {
            if (event.key === 'Escape' && !loading) setScanResult(null);
        };

        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [scanResult, loading]);

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
            setError("Couldn't read QR code. Please ensure the image is clear.");
            notify.error("Couldn't read QR code.");
        } finally {
            if (fileScannerRef.current) {
                try {
                    fileScannerRef.current.clear();
                } catch (err) {
                    console.error('Unable to clear QR image scanner:', err);
                }
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
                notify.success('Check-in confirmed.');
                setScanResult({ ...scanResult, scanStatus: 'used' });
                setTimeout(() => {
                    setScanResult(null);
                }, 2000);
            } else {
                notify.error(res.message || 'Check-in failed.');
            }
        } catch (err) {
            console.error(err);
            notify.error("Couldn't confirm check-in.");
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
        <div className="mx-auto w-full max-w-5xl space-y-6 p-3 sm:space-y-8 sm:p-6 lg:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">QR Ticket Scanner</h1>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-500 sm:text-base">Scan visitor and event reservations to view details and authorize entry.</p>
                </div>
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                    Scanner ready
                </div>
            </div>

            <div className="w-full overflow-hidden rounded-[1.5rem] border border-gray-100 bg-white shadow-xl shadow-gray-200/50 sm:rounded-[2rem]">
                    <div className="flex flex-col gap-4 border-b border-gray-100 bg-gray-50/60 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                        <div className="flex items-center gap-3">
                            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-sm shadow-emerald-700/20 sm:h-12 sm:w-12">
                                <Icons.Scan />
                            </span>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">Scan ticket</h2>
                                <p className="mt-0.5 text-xs text-gray-500 sm:text-sm">Choose a method to verify entry</p>
                            </div>
                        </div>

                        <div className="grid w-full grid-cols-2 rounded-xl bg-gray-200/50 p-1 shadow-inner sm:w-auto sm:rounded-2xl sm:p-1.5">
                            <button
                                type="button"
                                onClick={() => {
                                    setError(null);
                                    setScanMethod('camera');
                                }}
                                aria-pressed={scanMethod === 'camera'}
                                className={`flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-bold transition-all sm:rounded-xl sm:px-5 sm:py-3 sm:text-base ${scanMethod === 'camera'
                                        ? 'bg-white text-gray-900 shadow-md'
                                        : 'text-gray-500 hover:text-gray-800'
                                    }`}
                            >
                                <Icons.Camera />
                                <span className="hidden sm:inline">Camera</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setError(null);
                                    setScanMethod('upload');
                                }}
                                aria-pressed={scanMethod === 'upload'}
                                className={`flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-bold transition-all sm:rounded-xl sm:px-5 sm:py-3 sm:text-base ${scanMethod === 'upload'
                                        ? 'bg-white text-gray-900 shadow-md'
                                        : 'text-gray-500 hover:text-gray-800'
                                    }`}
                            >
                                <Icons.Upload />
                                <span className="hidden sm:inline">Upload</span>
                            </button>
                        </div>
                    </div>

                    <div className="relative flex min-h-[min(70dvh,42rem)] flex-col items-center justify-center bg-white p-4 sm:min-h-[36rem] sm:p-10">
                        {scanMethod === 'camera' && (
                            <div className="flex w-full max-w-xl flex-col items-center">
                                <div className="mb-3 flex w-full items-center justify-between gap-3 px-1">
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">Live camera</p>
                                        <p className="text-xs text-gray-500">Center the QR code inside the frame</p>
                                    </div>
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                        Auto scan
                                    </span>
                                </div>
                                <div
                                    id="qr-reader-camera"
                                    className="aspect-square w-full overflow-hidden rounded-[1.5rem] border-4 border-gray-100 bg-slate-950 shadow-[0_16px_35px_rgba(15,23,42,0.12)] sm:rounded-[2rem] sm:border-[6px]"
                                ></div>

                                {error && (
                                    <div role="alert" className="mt-5 w-full rounded-xl border border-red-100 bg-red-50 p-4 text-center text-sm font-bold text-red-700 sm:text-base">
                                        {error}
                                    </div>
                                )}
                            </div>
                        )}

                        {scanMethod === 'upload' && (
                            <div className="flex w-full max-w-xl flex-col items-center justify-center gap-5">
                                <div className="mb-1 w-full px-1">
                                    <p className="text-sm font-bold text-gray-900">Upload an image</p>
                                    <p className="mt-0.5 text-xs text-gray-500">Use a clear QR code image for the best result</p>
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                />

                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                     className="group flex aspect-square w-full cursor-pointer flex-col items-center justify-center gap-4 rounded-[1.5rem] border-2 border-dashed border-emerald-200 bg-emerald-50/30 p-6 text-center transition-all hover:border-emerald-400 hover:bg-emerald-50 sm:rounded-[2rem] sm:border-4 sm:p-12"
                                 >
                                    <div className="mb-1 flex h-16 w-16 items-center justify-center rounded-full bg-white text-emerald-700 shadow-sm transition-transform group-hover:scale-105 sm:h-24 sm:w-24">
                                        <Icons.Upload />
                                    </div>
                                    <div>
                                         <p className="text-lg font-bold text-gray-900 sm:text-2xl">Upload QR Image</p>
                                         <p className="mt-2 text-sm text-gray-500 sm:mt-3 sm:text-lg">Tap to browse your files</p>
                                    </div>
                                </div>

                                {error && (
                                    <div role="alert" className="mt-4 w-full rounded-xl border border-red-100 bg-red-50 p-4 text-center text-sm font-bold text-red-700 sm:text-base">
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
                            <div className="mt-5 flex w-full max-w-xl items-center justify-center gap-3 rounded-xl bg-gray-900 p-4 text-sm font-bold text-white shadow-xl sm:text-base">
                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                Processing scan...
                            </div>
                        )}
                    </div>
            </div>
            <ResultModal scanResult={scanResult} loading={loading} onClose={handleCancel} onConfirm={handleConfirmCheckIn} />
        </div>
    );
};

export default QRScanner;