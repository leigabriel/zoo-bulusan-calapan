import { useState, useEffect, useRef } from 'react';

const LogoutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7" aria-hidden="true">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
);

const LogoutModal = ({ isOpen, onClose, onConfirm, userName = 'User' }) => {
    const [loading, setLoading] = useState(false);
    const cancelButtonRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && !loading) {
                onClose();
            }
        };

        cancelButtonRef.current?.focus();

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
            className="fixed inset-0 z-[150] flex items-center justify-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-modal-title"
        >
            <div
                className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
                onClick={loading ? undefined : onClose}
                aria-hidden="true"
            />

            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 p-6 sm:p-8 overflow-hidden animate-scale-in border border-gray-100">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-50 text-red-500 mb-6">
                    <LogoutIcon />
                </div>

                <div className="text-center mb-8">
                    <h2 id="logout-modal-title" className="text-xl font-extrabold text-gray-900 mb-2">
                        Logout Confirmation
                    </h2>
                    <p className="text-gray-500 text-[15px]">
                        Hey <span className="font-bold text-gray-800">{userName}</span>,
                    </p>
                    <p className="text-gray-500 text-[15px] mt-1 leading-relaxed">
                        Are you sure you want to logout from your account?
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        ref={cancelButtonRef}
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 px-5 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors disabled:opacity-50 touch-target order-2 sm:order-1"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={loading}
                        className="flex-1 px-5 py-3.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors disabled:opacity-70 flex items-center justify-center gap-2 shadow-md shadow-red-600/20 touch-target order-1 sm:order-2"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                <span>Logging out...</span>
                            </>
                        ) : (
                            <span>Yes, Logout</span>
                        )}
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes scale-in {
                    0% {
                        opacity: 0;
                        transform: scale(0.95) translateY(10px);
                    }
                    100% {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }
                .animate-scale-in {
                    animation: scale-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}</style>
        </div>
    );
};

export default LogoutModal;