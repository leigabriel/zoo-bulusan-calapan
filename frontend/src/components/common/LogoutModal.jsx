import { useState, useEffect, useRef } from 'react';
import useScrollLock from '../../hooks/use-scroll-lock';
import { Logout, Loader } from 'reicon-react';

const LogoutModal = ({ isOpen, onClose, onConfirm, userName = 'User' }) => {
    const [loading, setLoading] = useState(false);
    const cancelButtonRef = useRef(null);
    useScrollLock(isOpen);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && !loading) {
                onClose();
            }
        };

        cancelButtonRef.current?.focus();

        document.addEventListener('keydown', handleKeyDown);

        return () => {
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
                    <Logout size={28} className="w-7 h-7" aria-hidden="true" />
                </div>

                <div className="text-center mb-8">
                    <h2 id="logout-modal-title" className="text-xl font-extrabold text-gray-900 mb-2">
                        Logout Confirmation
                    </h2>
                    <p className="text-gray-500 text-[15px] mt-1 leading-relaxed">
                        Are you sure you want to logout?
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
                                <Loader size={20} className="animate-spin h-5 w-5 text-white" aria-hidden="true" />
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
