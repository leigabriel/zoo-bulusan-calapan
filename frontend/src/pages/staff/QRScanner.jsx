import { useState, useEffect, useRef } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { useAuth } from '../../hooks/use-auth';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { reservationAPI } from '../../services/api-client';
import { notify } from '../../utils/toast';

const Icons = {
    Scan: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M3.75 4.5a.75.75 0 01.75-.75h3a.75.75 0 010 1.5h-2.25v2.25a.75.75 0 01-1.5 0v-3zm12.75-.75a.75.75 0 01.75.75v3a.75.75 0 01-1.5 0V5.25h-2.25a.75.75 0 010-1.5h3zm-13.5 13.5a.75.75 0 01.75-.75h2.25v-2.25a.75.75 0 011.5 0v3a.75.75 0 01-.75.75h-3a.75.75 0 01-.75-.75zm13.5.75a.75.75 0 01-.75-.75v-2.25a.75.75 0 011.5 0v2.25h2.25a.75.75 0 010 1.5h-3z" clipRule="evenodd" />
        </svg>
    ),
    Check: () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
        </svg>
    )
};

const QRScanner = () => {
    const { user, isAuthenticated } = useAuth();
    const [scanResult, setScanResult] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const scannerRef = useRef(null);

    useEffect(() => {
        if (!isAuthenticated) return;

        const scanner = new Html5QrcodeScanner("qr-reader", {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            showTorchButtonIfSupported: true
        });

        scanner.render(
            async (decodedText) => {
                if (loading || scanResult) return;
                
                try {
                    setLoading(true);
                    setError(null);
                    // Pause scanner if possible or just rely on state guards
                    scanner.pause(true);
                    
                    const res = await reservationAPI.scanReservation(decodedText, false);
                    if (res.success && res.reservation) {
                        setScanResult({
                            ...res.reservation,
                            scanStatus: res.status,
                            qrData: decodedText
                        });
                        notify.success('Valid ticket detected!');
                    } else {
                        setError('Invalid or expired ticket sequence.');
                        notify.error('Invalid ticket.');
                        setTimeout(() => scanner.resume(), 3000);
                    }
                } catch (err) {
                    console.error('Scan Error:', err);
                    setError(err.message || 'Error processing ticket.');
                    notify.error('Error processing ticket.');
                    setTimeout(() => scanner.resume(), 3000);
                } finally {
                    setLoading(false);
                }
            },
            (err) => {
                // Ignore general read errors
            }
        );

        scannerRef.current = scanner;

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(console.error);
            }
        };
    }, [isAuthenticated, loading, scanResult]);

    const handleConfirmCheckIn = async () => {
        if (!scanResult?.qrData) return;
        setLoading(true);
        try {
            const res = await reservationAPI.scanReservation(scanResult.qrData, true);
            if (res.success) {
                notify.success('Check-in confirmed successfully.');
                setScanResult(null);
                setTimeout(() => scannerRef.current?.resume(), 1000);
            } else {
                notify.error(res.message || 'Failed to check-in.');
            }
        } catch (err) {
            console.error('Check-in Error:', err);
            notify.error('Error confirming check-in.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setScanResult(null);
        setError(null);
        scannerRef.current?.resume();
    };

    if (!isAuthenticated) return null;

    return (
        <div className="bg-[#ebebeb] min-h-screen font-oswald text-[#212631] selection:bg-[#212631] selection:text-[#ebebeb] flex flex-col">
            <Header />
            <main className="flex-1 flex flex-col pt-24 max-w-4xl mx-auto w-full px-4 mb-20">
                <div className="mb-10 text-center">
                    <h1 className="text-4xl font-black uppercase tracking-tighter mb-4 text-[#212631]">QR Ticket Scanner</h1>
                    <p className="text-[12px] tracking-[0.2em] uppercase font-bold text-[#212631]/60 max-w-2xl mx-auto leading-relaxed">
                        Scan visitor and event reservations to authorize entry.
                    </p>
                </div>

                <div className="flex flex-col md:flex-row gap-10 items-start">
                    <div className="flex-1 w-full bg-white p-4 shadow-xl border border-[#212631]/10 self-start sticky top-30">
                        <div id="qr-reader" className="w-full"></div>
                        <div className="mt-4 text-center">
                            {error && <span className="text-red-600 font-bold uppercase tracking-widest text-[10px]">{error}</span>}
                            {loading && !scanResult && <span className="text-[#212631] font-bold uppercase tracking-widest text-[10px]">Processing...</span>}
                        </div>
                    </div>

                    <div className="flex-1 w-full flex flex-col gap-5">
                        <h2 className="text-xl font-bold uppercase tracking-widest mb-4">Scan Information</h2>
                        
                        {!scanResult ? (
                            <div className="flex flex-col items-center justify-center p-12 border border-dashed border-[#212631]/30 text-[#212631]/50 h-64">
                                <Icons.Scan />
                                <span className="mt-4 text-[10px] font-bold tracking-[0.2em] uppercase">Waiting for scan...</span>
                            </div>
                        ) : (
                            <div className="bg-white p-6 shadow-md border border-[#212631]/10 flex flex-col gap-6">
                                <div>
                                    <span className="block text-[10px] tracking-[0.2em] uppercase font-bold text-[#212631]/50 mb-1">Reservation Type</span>
                                    <span className="text-lg font-black uppercase text-[#212631]">{scanResult.type}</span>
                                </div>
                                <div>
                                    <span className="block text-[10px] tracking-[0.2em] uppercase font-bold text-[#212631]/50 mb-1">Reference ID</span>
                                    <span className="text-md font-bold uppercase text-[#212631]">{scanResult.reference}</span>
                                </div>
                                <div>
                                    <span className="block text-[10px] tracking-[0.2em] uppercase font-bold text-[#212631]/50 mb-1">Guest Name</span>
                                    <span className="font-bold text-[#212631]">{scanResult.name}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="block text-[10px] tracking-[0.2em] uppercase font-bold text-[#212631]/50 mb-1">Date</span>
                                        <span className="font-bold text-[#212631]">{new Date(scanResult.date).toLocaleDateString()}</span>
                                    </div>
                                    <div>
                                        <span className="block text-[10px] tracking-[0.2em] uppercase font-bold text-[#212631]/50 mb-1">Time</span>
                                        <span className="font-bold text-[#212631]">{scanResult.time || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="block text-[10px] tracking-[0.2em] uppercase font-bold text-[#212631]/50 mb-1">Admissions</span>
                                        <span className="font-bold text-[#212631]">{scanResult.totalVisitors}</span>
                                    </div>
                                    <div>
                                        <span className="block text-[10px] tracking-[0.2em] uppercase font-bold text-[#212631]/50 mb-1">Status</span>
                                        <span className={`font-black uppercase tracking-widest text-[10px] ${scanResult.scanStatus === 'used' ? 'text-green-600' : scanResult.scanStatus === 'expired' ? 'text-red-600' : 'text-blue-600'}`}>
                                            {scanResult.scanStatus === 'used' ? 'Checked In' : scanResult.scanStatus}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-4 flex gap-3">
                                    <button 
                                        onClick={handleCancel}
                                        disabled={loading}
                                        className="flex-1 py-4 border border-[#212631]/20 text-[10px] tracking-[0.2em] uppercase font-bold text-[#212631] hover:bg-[#212631]/5 transition-colors cursor-pointer disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={handleConfirmCheckIn}
                                        disabled={loading || scanResult.scanStatus === 'used' || scanResult.scanStatus === 'expired'}
                                        className="flex-[2] py-4 bg-[#212631] text-white flex items-center justify-center gap-2 text-[10px] tracking-[0.2em] uppercase font-bold hover:bg-[#212631]/90 transition-colors cursor-pointer disabled:opacity-50"
                                    >
                                        {loading ? 'Checking...' : scanResult.scanStatus === 'used' ? 'Already Checked In' : scanResult.scanStatus === 'expired' ? 'Ticket Expired' : (
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
            </main>
            <Footer />
        </div>
    );
};

export default QRScanner;
