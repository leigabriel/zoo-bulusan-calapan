const PawIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12">
        <circle cx="11" cy="4" r="2"/>
        <circle cx="18" cy="8" r="2"/>
        <circle cx="20" cy="16" r="2"/>
        <path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/>
    </svg>
);

const PredictionModal = ({ isOpen, onClose, prediction, animalInfo }) => {
    if (!isOpen) return null;

    const confidenceColor = prediction?.confidence >= 0.8
        ? 'text-green-600'
        : prediction?.confidence >= 0.5
        ? 'text-yellow-600'
        : 'text-red-600';

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div 
                className="bg-white rounded-3xl max-w-md w-full overflow-hidden animate-scale-in"
                onClick={e => e.stopPropagation()}
            >
                <div className="bg-gradient-to-r from-green-600 to-teal-500 p-6 text-white text-center">
                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <PawIcon />
                    </div>
                    <h2 className="text-2xl font-bold">{prediction?.label || 'Unknown'}</h2>
                    <p className={`text-lg font-medium ${confidenceColor.replace('text-', 'text-white/')}`}>
                        {prediction?.confidence ? `${(prediction.confidence * 100).toFixed(1)}% confidence` : 'Processing...'}
                    </p>
                </div>

                <div className="p-6">
                    {animalInfo && (
                        <div className="mb-6">
                            <h3 className="font-bold text-gray-800 mb-2">Did you know?</h3>
                            <p className="text-gray-600">{animalInfo.description}</p>
                        </div>
                    )}

                    {prediction?.topPredictions && (
                        <div className="mb-6">
                            <h3 className="font-bold text-gray-800 mb-3">Other possibilities</h3>
                            <div className="space-y-2">
                                {prediction.topPredictions.slice(1, 4).map((pred, index) => (
                                    <div key={index} className="flex items-center justify-between">
                                        <span className="text-gray-600">{pred.label}</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-green-500 rounded-full"
                                                    style={{ width: `${pred.confidence * 100}%` }}
                                                />
                                            </div>
                                            <span className="text-sm text-gray-500 w-12 text-right">
                                                {(pred.confidence * 100).toFixed(0)}%
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition"
                        >
                            Close
                        </button>
                        <button
                            onClick={() => {
                                onClose();
                            }}
                            className="flex-1 py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition"
                        >
                            Scan Again
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PredictionModal;
