import { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

const SuccessCheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="w-16 h-16">
        <circle cx="12" cy="12" r="10" fill="#10B981" className="animate-scale-in" />
        <path 
            d="M7 12.5l3 3 7-7" 
            stroke="white" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="animate-check-draw"
        />
    </svg>
);

const AuthSuccessModal = ({ 
    isOpen, 
    onClose, 
    type = 'login', // 'login' | 'register'
    userName = '',
    message = '',
    autoCloseDelay = 2500 // Auto-close after 2.5 seconds
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const modalRef = useRef(null);
    const timerRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            document.body.style.overflow = 'hidden';

            // Auto-close timer
            if (autoCloseDelay > 0) {
                timerRef.current = setTimeout(() => {
                    handleClose();
                }, autoCloseDelay);
            }

            return () => {
                if (timerRef.current) {
                    clearTimeout(timerRef.current);
                }
            };
        } else {
            setIsVisible(false);
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen, autoCloseDelay]);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => {
            onClose?.();
        }, 200);
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                handleClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const titles = {
        login: 'Welcome Back!',
        register: 'Account Created!'
    };

    const descriptions = {
        login: userName ? `Great to see you again, ${userName}!` : 'You have successfully logged in.',
        register: 'Your account has been created successfully.'
    };

    const displayMessage = message || descriptions[type];
    const displayTitle = titles[type];

    const modalContent = (
        <div
            className={`fixed inset-0 z-[200] flex items-center justify-center transition-opacity duration-200 ${
                isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-success-title"
        >
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div 
                ref={modalRef}
                className={`relative bg-white rounded-3xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden transform transition-all duration-300 ${
                    isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
                }`}
            >
                {/* Success Animation Background */}
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-emerald-50 to-transparent" />
                
                {/* Content */}
                <div className="relative px-6 pt-8 pb-6 sm:px-8 sm:pt-10 sm:pb-8">
                    {/* Icon */}
                    <div className="flex justify-center mb-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-emerald-400/20 rounded-full animate-ping-slow" />
                            <SuccessCheckIcon />
                        </div>
                    </div>

                    {/* Title */}
                    <h2 
                        id="auth-success-title"
                        className="text-xl sm:text-2xl font-bold text-gray-900 text-center mb-2"
                    >
                        {displayTitle}
                    </h2>

                    {/* Message */}
                    <p className="text-gray-500 text-center text-sm sm:text-base leading-relaxed mb-6">
                        {displayMessage}
                    </p>

                    {/* Progress bar for auto-close */}
                    {autoCloseDelay > 0 && (
                        <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-emerald-500 rounded-full animate-progress"
                                style={{ 
                                    animationDuration: `${autoCloseDelay}ms`,
                                    animationTimingFunction: 'linear'
                                }}
                            />
                        </div>
                    )}

                    {/* Optional: Manual close button */}
                    <button
                        onClick={handleClose}
                        className="w-full mt-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                    >
                        Continue
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes scale-in {
                    0% {
                        transform: scale(0);
                        opacity: 0;
                    }
                    50% {
                        transform: scale(1.1);
                    }
                    100% {
                        transform: scale(1);
                        opacity: 1;
                    }
                }
                
                @keyframes check-draw {
                    0% {
                        stroke-dasharray: 20;
                        stroke-dashoffset: 20;
                    }
                    100% {
                        stroke-dasharray: 20;
                        stroke-dashoffset: 0;
                    }
                }
                
                @keyframes ping-slow {
                    0% {
                        transform: scale(1);
                        opacity: 0.5;
                    }
                    75%, 100% {
                        transform: scale(1.5);
                        opacity: 0;
                    }
                }
                
                @keyframes progress {
                    0% {
                        width: 100%;
                    }
                    100% {
                        width: 0%;
                    }
                }
                
                .animate-scale-in {
                    animation: scale-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                }
                
                .animate-check-draw {
                    animation: check-draw 0.4s ease-out 0.3s forwards;
                    stroke-dasharray: 20;
                    stroke-dashoffset: 20;
                }
                
                .animate-ping-slow {
                    animation: ping-slow 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
                }
                
                .animate-progress {
                    animation: progress linear forwards;
                }
            `}</style>
        </div>
    );

    return ReactDOM.createPortal(modalContent, document.body);
};

export default AuthSuccessModal;