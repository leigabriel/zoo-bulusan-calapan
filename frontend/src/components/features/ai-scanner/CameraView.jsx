import { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';

const CameraView = forwardRef(({ onCapture, onError }, ref) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [isActive, setIsActive] = useState(false);
    const [facingMode, setFacingMode] = useState('environment');

    useImperativeHandle(ref, () => ({
        startCamera,
        stopCamera,
        captureImage,
        switchCamera
    }));

    useEffect(() => {
        return () => stopCamera();
    }, []);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode, width: { ideal: 640 }, height: { ideal: 480 } }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setIsActive(true);
            }
        } catch (error) {
            console.error('Error accessing camera:', error);
            onError?.('Unable to access camera. Please check permissions.');
        }
    };

    const stopCamera = () => {
        if (videoRef.current?.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            setIsActive(false);
        }
    };

    const captureImage = () => {
        if (!videoRef.current || !canvasRef.current) return null;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);

        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        onCapture?.(imageData, canvas);
        return imageData;
    };

    const switchCamera = async () => {
        stopCamera();
        setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
        setTimeout(startCamera, 100);
    };

    return (
        <div className="relative w-full aspect-video bg-gray-900 rounded-2xl overflow-hidden">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />

            {isActive && (
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-green-400 rounded-2xl">
                        <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-green-400 rounded-tl"></div>
                        <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-green-400 rounded-tr"></div>
                        <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-green-400 rounded-bl"></div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-green-400 rounded-br"></div>
                    </div>
                </div>
            )}

            {!isActive && (
                <div className="absolute inset-0 flex items-center justify-center text-white">
                    <div className="text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 mx-auto mb-4">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                            <circle cx="12" cy="13" r="4"/>
                        </svg>
                        <p className="text-lg">Camera is off</p>
                        <p className="text-sm opacity-70">Click Start to begin scanning</p>
                    </div>
                </div>
            )}

            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                <button
                    onClick={isActive ? stopCamera : startCamera}
                    className={`px-6 py-2 rounded-full font-medium transition ${
                        isActive
                            ? 'bg-red-500 text-white hover:bg-red-600'
                            : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                >
                    {isActive ? 'Stop' : 'Start'}
                </button>
                {isActive && (
                    <>
                        <button
                            onClick={captureImage}
                            className="px-6 py-2 bg-white text-gray-800 rounded-full font-medium hover:bg-gray-100 transition"
                        >
                            Capture
                        </button>
                        <button
                            onClick={switchCamera}
                            className="px-4 py-2 bg-gray-700 text-white rounded-full hover:bg-gray-600 transition flex items-center justify-center"
                            title="Switch Camera"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                                <path d="M23 4v6h-6"/>
                                <path d="M1 20v-6h6"/>
                                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                            </svg>
                        </button>
                    </>
                )}
            </div>
        </div>
    );
});

CameraView.displayName = 'CameraView';

export default CameraView;
