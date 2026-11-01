const { SETTING_KEYS, getSetting, saveSetting } = require('./settings-store');

/**
 * Event payment settings, stored independently from ticket payments.
 *
 * Values live in the app_settings table so an admin change survives production
 * restarts and redeploys.
 */
const DEFAULT_CONFIG = {
    qrphEnabled: false,
    amountPerParticipant: 0,
    currency: 'PHP'
};

const normalizeConfig = (config = {}) => {
    const amount = Number(config.amountPerParticipant);
    return {
        qrphEnabled: Boolean(config.qrphEnabled ?? config.enabled),
        amountPerParticipant: Number.isFinite(amount) && amount >= 0 ? Math.round(amount * 100) / 100 : 0,
        currency: 'PHP'
    };
};

const readConfig = () => {
    const stored = getSetting(SETTING_KEYS.EVENT_PAYMENT);
    return stored ? normalizeConfig(stored) : { ...DEFAULT_CONFIG };
};

const writeConfig = async (config) => {
    const cleaned = normalizeConfig(config);
    await saveSetting(SETTING_KEYS.EVENT_PAYMENT, cleaned);
    return cleaned;
};

module.exports = { readConfig, writeConfig, normalizeConfig, DEFAULT_CONFIG };
