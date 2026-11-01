const { SETTING_KEYS, getSetting, saveSetting } = require('./settings-store');

/**
 * Reservation availability settings. Kept separate from the payment configs
 * because availability is not a payment concern: an admin can close the whole
 * reservation page, or close only ticket bookings or only event bookings, while
 * leaving the payment setup untouched.
 *
 * Values live in the app_settings table rather than a JSON file so an admin
 * change survives production restarts and redeploys.
 */
const DEFAULT_CONFIG = {
    pageEnabled: true,
    ticketEnabled: true,
    eventEnabled: true
};

// Only an explicit false-ish value disables a flag. Anything unrecognised keeps
// the previous behaviour so a malformed config cannot silently close bookings.
const toBoolean = (value, fallback) => {
    if (value === true || value === 'true' || value === 1 || value === '1') return true;
    if (value === false || value === 'false' || value === 0 || value === '0') return false;
    return fallback;
};

const normalizeConfig = (config = {}) => ({
    pageEnabled: toBoolean(config.pageEnabled, DEFAULT_CONFIG.pageEnabled),
    ticketEnabled: toBoolean(config.ticketEnabled, DEFAULT_CONFIG.ticketEnabled),
    eventEnabled: toBoolean(config.eventEnabled, DEFAULT_CONFIG.eventEnabled)
});

const readConfig = () => {
    const stored = getSetting(SETTING_KEYS.RESERVATION_ACCESS);
    return stored ? normalizeConfig(stored) : { ...DEFAULT_CONFIG };
};

const writeConfig = async (config) => {
    const cleaned = normalizeConfig(config);
    await saveSetting(SETTING_KEYS.RESERVATION_ACCESS, cleaned);
    return cleaned;
};

module.exports = { readConfig, writeConfig, normalizeConfig, DEFAULT_CONFIG };
