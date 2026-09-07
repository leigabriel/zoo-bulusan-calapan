const TrashIcon = ({ className = 'w-5 h-5' }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M3 6h18" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <line x1="10" y1="11" x2="10" y2="17" />
        <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
);

const ConfirmModal = ({ title, message, confirmLabel = 'Confirm', loading = false, onCancel, onConfirm }) => (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
        <div className="bg-white border border-green-200 rounded-2xl w-full max-w-md p-6">
            <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-700 flex items-center justify-center mx-auto mb-4">
                <TrashIcon className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">{title}</h3>
            <p className="text-gray-500 text-center mb-6">{message}</p>
            <div className="flex gap-3">
                <button onClick={onCancel} disabled={loading} className="flex-1 px-4 py-3 bg-green-50 hover:bg-green-100 text-gray-900 rounded-xl font-medium transition disabled:opacity-50">
                    Cancel
                </button>
                <button onClick={onConfirm} disabled={loading} className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-gray-900 rounded-xl font-medium transition disabled:opacity-50">
                    {loading ? 'Processing...' : confirmLabel}
                </button>
            </div>
        </div>
    </div>
);

export default ConfirmModal;