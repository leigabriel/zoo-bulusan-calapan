import { useState } from 'react';
import { DEFAULT_AVATARS, AVATAR_KEYS, getDefaultAvatarSvg } from '../../utils/profile-avatars';

/**
 * AvatarSelector Component
 * Allows users to select from predefined animal-themed avatars
 * Uses a two-step confirmation flow: select avatar then confirm
 */
const AvatarSelector = ({ selectedAvatar, onSelect, onClose }) => {
    // Internal pending selection state (not yet confirmed)
    const [pendingAvatar, setPendingAvatar] = useState(selectedAvatar);
    const [hoveredAvatar, setHoveredAvatar] = useState(null);

    const handleConfirm = () => {
        if (pendingAvatar) {
            onSelect(pendingAvatar);
            // Don't call onClose here - let the parent handle it after saving
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-5 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Choose Avatar</h2>
                            <p className="text-sm text-gray-500 mt-1">Select an animal avatar for your profile</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            aria-label="Close"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-gray-500">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Avatar Grid */}
                <div className="p-5 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 180px)' }}>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                        {AVATAR_KEYS.map((key) => {
                            const avatar = DEFAULT_AVATARS[key];
                            const isSelected = pendingAvatar === key;
                            const isHovered = hoveredAvatar === key;

                            return (
                                <button
                                    key={key}
                                    onClick={() => setPendingAvatar(key)}
                                    onMouseEnter={() => setHoveredAvatar(key)}
                                    onMouseLeave={() => setHoveredAvatar(null)}
                                    className={`
                                        relative aspect-square rounded-xl transition-all duration-200
                                        flex flex-col items-center justify-center gap-1 p-2
                                        ${isSelected 
                                            ? 'ring-2 ring-emerald-500 ring-offset-2 scale-105' 
                                            : 'hover:scale-105 hover:shadow-lg'
                                        }
                                    `}
                                    style={{ backgroundColor: avatar.bgColor }}
                                    aria-label={`Select ${avatar.name} avatar`}
                                    aria-pressed={isSelected}
                                >
                                    <span className="text-3xl sm:text-4xl">{avatar.emoji}</span>
                                    <span className="text-xs font-medium text-gray-700 truncate w-full text-center">
                                        {avatar.name}
                                    </span>
                                    
                                    {/* Selected indicator */}
                                    {isSelected && (
                                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="w-3 h-3">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-gray-100 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 px-4 border border-gray-200 rounded-xl font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!pendingAvatar}
                        className="flex-1 py-2.5 px-4 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AvatarSelector;