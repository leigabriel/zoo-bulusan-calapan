const crypto = require('crypto');

const PREFIX = 'pid_';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

const getKey = () => crypto.createHash('sha256')
    .update(process.env.PUBLIC_ID_SECRET || process.env.JWT_SECRET || 'development-only-public-id-secret')
    .digest();

const isOpaqueId = value => typeof value === 'string' && value.startsWith(PREFIX);

const encodePublicId = value => {
    if (value === null || value === undefined || value === '' || !Number.isFinite(Number(value))) return value;

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
    const encrypted = Buffer.concat([
        cipher.update(String(Number(value)), 'utf8'),
        cipher.final()
    ]);
    const tag = cipher.getAuthTag();
    return `${PREFIX}${Buffer.concat([iv, tag, encrypted]).toString('base64url')}`;
};

const decodePublicId = value => {
    if (!isOpaqueId(value)) return value;

    try {
        const payload = Buffer.from(value.slice(PREFIX.length), 'base64url');
        if (payload.length <= IV_LENGTH + TAG_LENGTH) return null;

        const iv = payload.subarray(0, IV_LENGTH);
        const tag = payload.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
        const encrypted = payload.subarray(IV_LENGTH + TAG_LENGTH);
        const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), iv);
        decipher.setAuthTag(tag);
        const decoded = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
        return /^\d+$/.test(decoded) ? decoded : null;
    } catch {
        return null;
    }
};

const decodeNested = value => {
    if (typeof value === 'string') return isOpaqueId(value) ? decodePublicId(value) : value;
    if (Array.isArray(value)) return value.map(decodeNested);
    if (value instanceof Date) return value;
    if (!value || typeof value !== 'object') return value;
    return Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, decodeNested(nested)]));
};

const isIdentifierKey = key => key === 'id' || key.endsWith('Id') || key.endsWith('_id');

const encodeNested = (value, key = '') => {
    if (value instanceof Date) return value;
    if (isIdentifierKey(key) && ((typeof value === 'number' && Number.isInteger(value)) || (typeof value === 'string' && /^\d+$/.test(value)))) {
        return encodePublicId(value);
    }
    if (Array.isArray(value)) return value.map(item => encodeNested(item));
    if (!value || typeof value !== 'object') return value;
    return Object.fromEntries(Object.entries(value).map(([childKey, nested]) => [childKey, encodeNested(nested, childKey)]));
};

const decodeRequestIdentifiers = (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = body => originalJson(encodeNested(body));

    req.body = decodeNested(req.body);

    const url = new URL(req.originalUrl || req.url, 'http://public-id.local');
    url.pathname = url.pathname.split('/').map(segment => {
        const decoded = decodePublicId(segment);
        return decoded === null ? segment : decoded;
    }).join('/');
    for (const [key, value] of url.searchParams.entries()) {
        const decoded = decodePublicId(value);
        if (decoded !== null) url.searchParams.set(key, decoded);
    }
    req.url = `${url.pathname}${url.search}`;
    next();
};

module.exports = {
    encodePublicId,
    decodePublicId,
    decodeRequestIdentifiers
};