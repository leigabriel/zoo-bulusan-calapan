const { SETTING_KEYS, getSetting, saveSetting } = require('./settings-store');

/**
 * Ticket payment settings, deliberately kept separate from the event payment
 * config in config/event-payment-config.js. The two reservations live in
 * different tables and are priced differently (tickets are per head and per
 * category; events are a flat fee per participant), so they get independent
 * toggles and independent prices. An admin can turn one on without touching
 * the other.
 *
 * Values are stored in the app_settings table so they survive production
 * restarts and redeploys.
 */
const DEFAULT_CONFIG = {
    qrphEnabled: false,
    adultPrice: 40,
    childPrice: 20,
    residentPrice: 0,
    currency: 'PHP'
};

// Prices are clamped to a sane non-negative range rather than rejected, so a
// mistyped admin value cannot produce a negative or absurd charge.
const toPrice = (value, fallback) => {
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount < 0) return fallback;
    return Math.round(amount * 100) / 100;
};

const normalizeConfig = (config = {}) => ({
    // Tolerate the older `enabled` key the way the event config does.
    qrphEnabled: Boolean(config.qrphEnabled ?? config.enabled),
    adultPrice: toPrice(config.adultPrice, DEFAULT_CONFIG.adultPrice),
    childPrice: toPrice(config.childPrice, DEFAULT_CONFIG.childPrice),
    residentPrice: toPrice(config.residentPrice, DEFAULT_CONFIG.residentPrice),
    currency: 'PHP'
});

const readConfig = () => {
    const stored = getSetting(SETTING_KEYS.TICKET_PAYMENT);
    return stored ? normalizeConfig(stored) : { ...DEFAULT_CONFIG };
};

const writeConfig = async (config) => {
    const cleaned = normalizeConfig(config);
    await saveSetting(SETTING_KEYS.TICKET_PAYMENT, cleaned);
    return cleaned;
};

module.exports = { readConfig, writeConfig, normalizeConfig, DEFAULT_CONFIG };
