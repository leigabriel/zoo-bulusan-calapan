/**
 * Validation rules for client-supplied image data.
 *
 * POST /api/upload/base64 sits behind `protect` only, so any signed-in visitor
 * could previously hand the server an arbitrary string and choose any upload
 * type. That let them write into folders such as zoo-bulusan/resident-id-images
 * and push unbounded payloads at the metered Cloudinary account.
 */

// Mirrors ALLOWED_MIME_TYPES / MAX_FILE_SIZE in middleware/cloudinary-upload.js.
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** Decoded-byte ceiling, matching the multer path. */
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** Upload types a regular visitor may use. */
const USER_TYPES = ['general'];

/** Upload types staff may use. */
const STAFF_TYPES = ['general', 'animal', 'plant', 'event', 'community', 'profile', 'residentId'];

/** Largest data: URL string we will even look at, before decoding. */
const MAX_DATA_URL_CHARS = Math.ceil((MAX_IMAGE_BYTES * 4) / 3) + 1024;

/**
 * Validate a base64 image data URL.
 *
 * @param {unknown} value - Untrusted request body value
 * @param {object} [options]
 * @param {number} [options.maxBytes]
 * @returns {{ ok: true, mimeType: string, dataUrl: string, approxBytes: number }
 *          |{ ok: false, error: string }}
 */
const validateBase64Image = (value, options = {}) => {
    const maxBytes = options.maxBytes ?? MAX_IMAGE_BYTES;

    if (typeof value !== 'string' || !value.trim()) {
        return { ok: false, error: 'No image data provided.' };
    }

    const dataUrl = value.trim();

    if (dataUrl.length > MAX_DATA_URL_CHARS) {
        return { ok: false, error: 'Image is too large.' };
    }

    // Only real image data URLs. This also rejects raw base64, http(s) URLs and
    // text/html payloads that Cloudinary would otherwise have to guess at.
    const match = /^data:(image\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/]+={0,2})$/i.exec(dataUrl);
    if (!match) {
        return { ok: false, error: 'Image must be a base64-encoded image.' };
    }

    const mimeType = match[1].toLowerCase();
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
        return { ok: false, error: 'Only JPEG, PNG and WebP images are allowed.' };
    }

    const payload = match[2];
    const approxBytes = Math.floor((payload.length * 3) / 4);
    if (approxBytes > maxBytes) {
        return { ok: false, error: 'Image is too large. Maximum size is 5MB.' };
    }

    // Reject base64 that does not decode cleanly, so nothing malformed reaches
    // the SDK and turns into a confusing upstream error.
    let buffer;
    try {
        buffer = Buffer.from(payload, 'base64');
    } catch {
        return { ok: false, error: 'Image data could not be decoded.' };
    }
    if (!buffer.length) {
        return { ok: false, error: 'Image data is empty.' };
    }

    return { ok: true, mimeType, dataUrl, approxBytes };
};

/**
 * Which upload types a caller may use.
 *
 * @param {string|undefined} role
 * @returns {string[]}
 */
const allowedTypesForRole = (role) => {
    if (role === 'admin' || role === 'staff') return [...STAFF_TYPES];
    return [...USER_TYPES];
};

module.exports = {
    validateBase64Image,
    allowedTypesForRole,
    ALLOWED_MIME_TYPES,
    MAX_IMAGE_BYTES,
    USER_TYPES,
    STAFF_TYPES
};
