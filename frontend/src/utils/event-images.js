import { BACKEND_BASE_URL } from '../services/api-client';

// Local zoo photography keeps the grid populated when an event has no image,
// instead of depending on a third-party host that can rate-limit or go away.
export const DEFAULT_EVENT_IMAGES = [
    '/bulusanzoo-images/bz1.jpg',
    '/bulusanzoo-images/bz2.jpg',
    '/bulusanzoo-images/bz3.jpg',
    '/bulusanzoo-images/bz4.jpg',
    '/bulusanzoo-images/bz5.jpg'
];

export const EVENT_IMAGE_FALLBACK = '/images/event-img-placeholder.jpg';

/**
 * Turns whatever the API stored into something the browser can load:
 * a missing value becomes a local default, an old http:// URL is upgraded so
 * it is not blocked as mixed content, and a relative /uploads path is pointed
 * at the API origin rather than the frontend origin.
 */
export const resolveEventImageUrl = (imageUrl, index = 0) => {
    const value = typeof imageUrl === 'string' ? imageUrl.trim() : '';

    if (!value) return DEFAULT_EVENT_IMAGES[index % DEFAULT_EVENT_IMAGES.length];
    if (value.startsWith('http://')) return `https://${value.slice('http://'.length)}`;
    if (value.startsWith('/uploads')) return `${BACKEND_BASE_URL}${value}`;

    return value;
};

/**
 * Last-resort fallback for a record whose image URL is broken. Guarded so a
 * missing placeholder cannot make the browser retry in a loop.
 */
export const handleEventImageError = (event) => {
    const image = event.currentTarget;
    if (image.src.includes(EVENT_IMAGE_FALLBACK)) return;
    image.src = EVENT_IMAGE_FALLBACK;
};
