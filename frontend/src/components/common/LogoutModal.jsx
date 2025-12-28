import { useState, useEffect, useRef } from 'react';

const LogoutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12" aria-hidden="true">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
        <polyline points="16 17 21 12 16 7"/>
        <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
);

const LogoutModal = ({ isOpen, onClose, onConfirm, userName = 'User' }) => {
    const [loading, setLoading] = useState(false);
    const cancelButtonRef = useRef(null);

    // Handle escape key and focus management
    useEffect(() => {
        if (!isOpen) return;
        
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && !loading) {
                onClose();
            }
        };
        
        // Focus the cancel button when modal opens
        cancelButtonRef.current?.focus();
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', handleKeyDown);
        
        return () => {
            document.body.style.overflow = '';
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, loading, onClose]);

    if (!isOpen) return null;

    const handleConfirm = async () => {
        setLoading(true);
        try {
            await onConfirm();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-modal-title"
        >
            <div 
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={loading ? undefined : onClose}
                aria-hidden="true"
            />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-scale-in">
                <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6 text-center text-white">
                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <LogoutIcon />
                    </div>
                    <h2 id="logout-modal-title" className="text-2xl font-bold">Logout Confirmation</h2>
                </div>
                
                <div className="p-6 text-center">
                    <p className="text-gray-600 mb-2">
                        Hey <span className="font-semibold text-gray-800">{userName}</span>,
                    </p>
                    <p className="text-gray-600 mb-6">
                        Are you sure you want to logout from your account?
                    </p>
                    
                    <div className="flex gap-3">
                        <button
                            ref={cancelButtonRef}
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition disabled:opacity-50 touch-target"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={loading}
                            className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition disabled:opacity-50 flex items-center justify-center gap-2 touch-target"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Logging out...
                                </>
                            ) : (
                                'Yes, Logout'
                            )}
                        </button>
                    </div>
                </div>
            </div>
            
            <style>{`
                @keyframes scale-in {
                    from {
                        opacity: 0;
                        transform: scale(0.9);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
                .animate-scale-in {
                    animation: scale-in 0.2s ease-out;
                }
            `}</style>
        </div>
    );
};

export default LogoutModal;
