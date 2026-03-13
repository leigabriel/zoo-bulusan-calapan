/**
 * Default Profile Avatars System
 * Animal-themed avatars for users who don't have a profile image
 */

// Default avatars available for selection
// Using emoji-based SVG avatars for reliability (no external dependencies)
export const DEFAULT_AVATARS = {
    deer: {
        name: 'Deer',
        emoji: '🦌',
        color: '#8B4513',
        bgColor: '#FFF8DC'
    },
    owl: {
        name: 'Owl',
        emoji: '🦉',
        color: '#4A4A4A',
        bgColor: '#F5F5DC'
    },
    dove: {
        name: 'Dove',
        emoji: '🕊️',
        color: '#87CEEB',
        bgColor: '#F0F8FF'
    },
    eagle: {
        name: 'Eagle',
        emoji: '🦅',
        color: '#8B4513',
        bgColor: '#FFF5EE'
    },
    horse: {
        name: 'Horse',
        emoji: '🐴',
        color: '#654321',
        bgColor: '#F5DEB3'
    },
    tiger: {
        name: 'Tiger',
        emoji: '🐯',
        color: '#FF8C00',
        bgColor: '#FFFACD'
    },
    monkey: {
        name: 'Monkey',
        emoji: '🐵',
        color: '#8B4513',
        bgColor: '#FAEBD7'
    },
    ostrich: {
        name: 'Ostrich',
        emoji: '🦩',
        color: '#FF69B4',
        bgColor: '#FFE4E1'
    },
    parrot: {
        name: 'Parrot',
        emoji: '🦜',
        color: '#32CD32',
        bgColor: '#F0FFF0'
    },
    rabbit: {
        name: 'Rabbit',
        emoji: '🐰',
        color: '#FFB6C1',
        bgColor: '#FFF0F5'
    }
};

// Array of avatar keys for iteration
export const AVATAR_KEYS = Object.keys(DEFAULT_AVATARS);

/**
 * Get avatar data by key
 */
export const getAvatarByKey = (key) => {
    return DEFAULT_AVATARS[key] || null;
};

/**
 * Check if a string is a default avatar key
 */
export const isDefaultAvatar = (value) => {
    return value && AVATAR_KEYS.includes(value);
};

/**
 * Generate SVG data URL for a default avatar
 */
export const getDefaultAvatarSvg = (avatarKey) => {
    const avatar = DEFAULT_AVATARS[avatarKey];
    if (!avatar) return null;
    
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
            <rect width="100" height="100" fill="${avatar.bgColor}"/>
            <text x="50" y="60" font-size="50" text-anchor="middle" dominant-baseline="middle">${avatar.emoji}</text>
        </svg>
    `.trim();
    
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

/**
 * Generate random avatar key
 */
export const getRandomAvatarKey = () => {
    const randomIndex = Math.floor(Math.random() * AVATAR_KEYS.length);
    return AVATAR_KEYS[randomIndex];
};

/**
 * Get initials from name for fallback display
 */
export const getInitials = (firstName, lastName) => {
    const first = (firstName || '').charAt(0).toUpperCase();
    const last = (lastName || '').charAt(0).toUpperCase();
    return first + last || '?';
};