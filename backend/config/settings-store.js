const db = require('./database');

/**
 * Database-backed store for the settings an administrator changes in Admin
 * Settings.
 *
 * These values used to live in local JSON files. That works on a developer
 * machine, but production hosts either reset the container filesystem on
 * redeploy or mount it read-only, so a saved setting silently reverted to the
 * last deployed value. The app_settings table is part of the database, so it
 * survives restarts and redeploys like every other piece of zoo data.
 *
 * The config modules are called synchronously throughout the codebase (for
 * example when building SQL price literals), so reads are served from an
 * in-memory cache. The cache is primed at boot and updated on every successful
 * write, which means a change is visible immediately after the admin saves.
 *
 * The cache is per process. If the API is ever scaled to several instances, a
 * change made through one instance reaches the others on their next restart or
 * reload; the database row itself is always correct.
 */
const SETTING_KEYS = Object.freeze({
    TICKET_PAYMENT: 'ticket_payment',
    EVENT_PAYMENT: 'event_payment',
    RESERVATION_ACCESS: 'reservation_access',
    LEGAL_POLICIES: 'legal_policies'
});

const cache = new Map();

const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

// mysql2 returns JSON columns as objects, but a text column or an older driver
// version can hand back the raw string, so accept both shapes.
const parseValue = (value) => {
    if (isPlainObject(value)) return value;
    if (typeof value !== 'string') return null;
    try {
        const parsed = JSON.parse(value);
        return isPlainObject(parsed) ? parsed : null;
    } catch {
        return null;
    }
};

const getSetting = (key) => {
    const value = cache.get(key);
    return value ? { ...value } : null;
};

const saveSetting = async (key, value) => {
    if (!isPlainObject(value)) {
        throw new TypeError('Setting value must be an object');
    }
    const payload = JSON.stringify(value);
    await db.query(
        `INSERT INTO app_settings (setting_key, setting_value) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE setting_value = ?`,
        [key, payload, payload]
    );
    cache.set(key, { ...value });
    return { ...value };
};

const loadSettings = async () => {
    const [rows] = await db.query('SELECT setting_key, setting_value FROM app_settings');
    cache.clear();
    for (const row of rows) {
        const value = parseValue(row.setting_value);
        if (value) cache.set(row.setting_key, value);
    }
    return cache.size;
};

module.exports = { SETTING_KEYS, getSetting, loadSettings, saveSetting };

