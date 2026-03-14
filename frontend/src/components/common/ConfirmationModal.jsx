import { useEffect, useRef } from 'react';

const ConfirmationModal = ({
    isOpen,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    onConfirm,
    onClose,
    danger = false,
    loading = false,
    requireInput = false,
    inputLabel = 'Reason',
    inputPlaceholder = 'Enter details',
    inputValue = '',
    onInputChange,
    confirmDisabled = false
}) => {
    const cancelButtonRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (event) => {
            if (event.key === 'Escape' && !loading) {
                onClose();
            }
        };

        document.body.style.overflow = 'hidden';
        cancelButtonRef.current?.focus();
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.style.overflow = '';
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, loading, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[220] flex items-center justify-center p-4" role="dialog" aria-modal="true">
            <button
                type="button"
                aria-label="Close"
                onClick={loading ? undefined : onClose}
                className="absolute inset-0 bg-black/55 backdrop-blur-sm"
            />

            <div className="relative w-full max-w-md bg-white border border-gray-200 shadow-2xl p-6">
                <h3 className="text-lg font-black uppercase tracking-tight text-gray-900">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-gray-600">{message}</p>

                {requireInput && (
                    <div className="mt-4">
                        <label className="block text-[11px] uppercase tracking-[0.15em] font-bold text-gray-500 mb-2">
                            {inputLabel}
                        </label>
                        <textarea
                            value={inputValue}
                            onChange={(event) => onInputChange?.(event.target.value)}
                            className="w-full border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-700"
                            rows={3}
                            placeholder={inputPlaceholder}
                            maxLength={255}
                        />
                    </div>
                )}

                <div className="mt-6 flex items-center justify-end gap-3">
                    <button
                        ref={cancelButtonRef}
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 border border-gray-300 text-xs font-black uppercase tracking-[0.15em] text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading || confirmDisabled}
                        className={`px-4 py-2 border text-xs font-black uppercase tracking-[0.15em] transition-colors disabled:opacity-50 ${danger
                            ? 'bg-red-600 border-red-600 text-white hover:bg-red-700'
                            : 'bg-[#212631] border-[#212631] text-white hover:bg-black'
                            }`}
                    >
                        {loading ? 'Processing...' : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
