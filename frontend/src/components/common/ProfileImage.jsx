import { useState, useCallback, useEffect } from 'react';
import { getProfileImageUrl } from '../services/api-client';
import { isDefaultAvatar, getDefaultAvatarSvg, getInitials } from '../utils/profile-avatars';

/**
 * ProfileImage Component
 * Handles profile image loading with fallback support for:
 * - Google profile images
 * - Locally uploaded images
 * - Default avatar selection
 * - Error handling with fallback to initials
 */
const ProfileImage = ({
    src,
    firstName = '',
    lastName = '',
    size = 'md',
    className = '',
    onClick,
    showEditButton = false,
    onEditClick
}) => {
    const [imageError, setImageError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [finalSrc, setFinalSrc] = useState(null);

    // Size configurations
    const sizeClasses = {
        xs: 'w-8 h-8',
        sm: 'w-10 h-10',
        md: 'w-16 h-16',
        lg: 'w-24 h-24',
        xl: 'w-32 h-32',
        '2xl': 'w-40 h-40'
    };

    const textSizes = {
        xs: 'text-xs',
        sm: 'text-sm',
        md: 'text-xl',
        lg: 'text-2xl',
        xl: 'text-3xl',
        '2xl': 'text-4xl'
    };

    // Resolve the image URL
    useEffect(() => {
        setImageError(false);
        setIsLoading(true);

        if (!src) {
            setFinalSrc(null);
            setIsLoading(false);
            return;
        }

        // Check if it's a default avatar key
        if (isDefaultAvatar(src)) {
            const svgUrl = getDefaultAvatarSvg(src);
            setFinalSrc(svgUrl);
            setIsLoading(false);
            return;
        }

        // Resolve the URL
        const resolvedUrl = getProfileImageUrl(src);
        setFinalSrc(resolvedUrl);
    }, [src]);

    const handleError = useCallback(() => {
        setImageError(true);
        setIsLoading(false);
    }, []);

    const handleLoad = useCallback(() => {
        setIsLoading(false);
    }, []);

    // Get initials for fallback
    const initials = getInitials(firstName, lastName);

    // Show initials fallback
    const showFallback = !finalSrc || imageError;

    return (
        <div
            className={`relative rounded-full overflow-hidden ${sizeClasses[size]} ${className}`}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            style={{ cursor: onClick ? 'pointer' : undefined }}
        >
            {/* Loading state */}
            {isLoading && !showFallback && (
                <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
                    <div className="w-1/3 h-1/3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                </div>
            )}

            {/* Image */}
            {!showFallback && (
                <img
                    src={finalSrc}
                    alt={`${firstName} ${lastName}`.trim() || 'Profile'}
                    className={`w-full h-full object-cover ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
                    onError={handleError}
                    onLoad={handleLoad}
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                />
            )}

            {/* Fallback with initials */}
            {showFallback && (
                <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                    <span className={`font-bold text-white ${textSizes[size]}`}>
                        {initials}
                    </span>
                </div>
            )}

            {/* Edit button overlay */}
            {showEditButton && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onEditClick?.();
                    }}
                    className="absolute bottom-0 right-0 p-1.5 bg-white rounded-full shadow-lg border border-gray-100 text-gray-700 hover:text-emerald-600 transition-colors"
                    aria-label="Edit profile image"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                        <circle cx="12" cy="13" r="4" />
                    </svg>
                </button>
            )}
        </div>
    );
};

export default ProfileImage;