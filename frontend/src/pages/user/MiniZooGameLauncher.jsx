import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const GAME_URL = import.meta.env.VITE_MINIZOO_GAME_URL || 'http://localhost:5174';

function MiniZooGameModal({ isOpen, onClose }) {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setIsLoading(true);
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center">
            <div 
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="relative w-full h-full max-w-[95vw] max-h-[95vh] m-4 rounded-2xl overflow-hidden shadow-2xl bg-sky-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all duration-200 group"
                    title="Close game"
                >
                    <svg className="w-6 h-6 text-gray-700 group-hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-sky-200 z-5">
                        <div className="text-center">
                            <div className="w-16 h-16 border-4 border-white border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-lg font-medium text-gray-700">Loading Mini Zoo...</p>
                        </div>
                    </div>
                )}
                
                <iframe
                    src={GAME_URL}
                    className="w-full h-full border-0"
                    title="Mini Zoo Game"
                    allow="accelerometer; gyroscope; fullscreen"
                    onLoad={() => setIsLoading(false)}
                />
            </div>
        </div>
    );
}

function MiniZooGameLauncher() {
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleGoBack = () => navigate(-1);

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center p-6">
            <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center shadow-lg">
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>

                <h1 className="text-3xl font-bold text-gray-800 mb-3">Mini Zoo Game</h1>
                <p className="text-gray-600 mb-8">
                    Explore a beautiful 3D cartoon zoo! Walk around, discover animals, and enjoy the peaceful environment.
                </p>

                <div className="grid grid-cols-2 gap-4 mb-8 text-left">
                    <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
                        <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm text-gray-700">3D Cartoon World</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
                        <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm text-gray-700">Realistic Animals</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
                        <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm text-gray-700">PC & Mobile</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
                        <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm text-gray-700">Jump & Explore</span>
                    </div>
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full py-4 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-3"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Play Now
                </button>

                <button
                    onClick={handleGoBack}
                    className="mt-4 text-gray-500 hover:text-gray-700 text-sm flex items-center justify-center gap-2 mx-auto transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                    Go Back
                </button>

                <div className="mt-6 p-4 bg-gray-50 rounded-lg text-left">
                    <p className="text-xs text-gray-500 font-medium mb-2">Controls:</p>
                    <p className="text-xs text-gray-500">
                        <span className="font-medium">PC:</span> WASD to move, Space to jump, Shift to run, Click-drag to look
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        <span className="font-medium">Mobile:</span> Joystick to move, tap jump button, drag to look around
                    </p>
                </div>
            </div>

            <MiniZooGameModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    );
}

export { MiniZooGameModal };
export default MiniZooGameLauncher;
