/**
 * Ownership rules for Cloudinary assets.
 *
 * Every upload mints a publicId of the form:
 *
 *     <folder>/<prefix>_<userId>_<timestamp>_<16 hex chars>
 *
 * (see generatePublicId in middleware/cloudinary-upload.js), so ownership can be
 * recovered from the id itself without an extra database lookup.
 *
 * Before this existed, DELETE /api/upload accepted any publicId or URL from the
 * request body with no ownership check at all: any staff account could delete
 * another user's profile picture, resident ID document, or anyone else's
 * community photos.
 */

/** Assets that belong to the collection rather than to a person. */
const SHARED_PREFIXES = new Set(['general', 'animal', 'plant', 'event', 'community']);

/** Assets tied to one specific account. */
const PERSONAL_PREFIXES = new Set(['profile', 'resident_id']);

/**
 * Recover the owner from a publicId.
 *
 * The prefix itself may contain underscores (`resident_id`), so the three
 * trailing segments are read from the end and everything before them is the
 * prefix.
 *
 * @param {unknown} publicId
 * @returns {{ prefix: string, ownerId: number|null, folder: string|null,
 *             name: string }|null} null when the shape is unrecognised
 */
const parseAssetId = (publicId) => {
    if (typeof publicId !== 'string' || !publicId.trim()) return null;

    const cleaned = publicId.trim();
    const segments = cleaned.split('/').filter(Boolean);
    if (!segments.length) return null;

    const name = segments[segments.length - 1];
    const folder = segments.length > 1 ? segments.slice(0, -1).join('/') : null;

    const parts = name.split('_');
    if (parts.length < 4) return null;

    const hash = parts.pop();
    const timestamp = parts.pop();
    const owner = parts.pop();
    const prefix = parts.join('_');

    // randomBytes(8).toString('hex') is 16 hex chars; Date.now() is 13 digits.
    if (!/^[0-9a-f]{16}$/i.test(hash)) return null;
    if (!/^\d{10,}$/.test(timestamp)) return null;

    // Uploads made without an authenticated user are recorded as 'unknown'/'system'.
    const ownerId = /^\d+$/.test(owner) && Number(owner) > 0 ? Number(owner) : null;

    return { prefix, ownerId, folder, name };
};

/**
 * Decide whether a caller may delete an asset.
 *
 * Admins are operators and may delete anything. Staff may delete shared
 * collection assets and their own personal ones, never somebody else's profile
 * picture or ID document. An id that cannot be parsed fails closed for
 * everyone except an admin.
 *
 * @param {unknown} publicId
 * @param {{ id?: number, role?: string }|undefined} user
 * @returns {{ ok: boolean, reason: string, asset: object|null }}
 */
const canDeleteAsset = (publicId, user) => {
    const role = user?.role;
    const isAdmin = role === 'admin';
    const asset = parseAssetId(publicId);

    if (isAdmin) {
        return { ok: true, reason: 'admin', asset };
    }
    if (!user) {
        return { ok: false, reason: 'Unauthenticated.', asset };
    }
    if (!asset) {
        return {
            ok: false,
            reason: 'Unrecognised image identifier.',
            asset: null
        };
    }
    if (SHARED_PREFIXES.has(asset.prefix)) {
        return { ok: true, reason: `shared:${asset.prefix}`, asset };
    }
    if (PERSONAL_PREFIXES.has(asset.prefix) && asset.ownerId !== null && asset.ownerId === Number(user.id)) {
        return { ok: true, reason: `owner:${asset.prefix}`, asset };
    }
    return { ok: false, reason: 'You can only delete your own images.', asset };
};

module.exports = {
    parseAssetId,
    canDeleteAsset,
    SHARED_PREFIXES,
    PERSONAL_PREFIXES
};
