const fs = require('fs');
const path = require('path');

/**
 * Ticket payment settings, deliberately kept separate from the event payment
 * config in config/event-payment-config.js. The two reservations live in
 * different tables and are priced differently (tickets are per head and per
 * category; events are a flat fee per participant), so they get independent
 * toggles and independent prices. An admin can turn one on without touching
 * the other.
 */
const CONFIG_FILE = process.env.TICKET_PAYMENT_CONFIG_FILE || path.join(__dirname, '..', 'data', 'ticket-payment-config.json');

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

const readConfig = () => {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            const stored = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
            const merged = { ...DEFAULT_CONFIG, ...stored };
            // Tolerate the older `enabled` key the way the event config does.
            merged.qrphEnabled = Boolean(stored.qrphEnabled ?? stored.enabled ?? DEFAULT_CONFIG.qrphEnabled);
            return {
                qrphEnabled: merged.qrphEnabled,
                adultPrice: toPrice(merged.adultPrice, DEFAULT_CONFIG.adultPrice),
                childPrice: toPrice(merged.childPrice, DEFAULT_CONFIG.childPrice),
                residentPrice: toPrice(merged.residentPrice, DEFAULT_CONFIG.residentPrice),
                currency: merged.currency || 'PHP'
            };
        }
    } catch (error) {
        console.error('Unable to read ticket payment config:', error.message);
    }
    return { ...DEFAULT_CONFIG };
};

const writeConfig = (config) => {
    const cleaned = {
        qrphEnabled: Boolean(config.qrphEnabled ?? config.enabled),
        adultPrice: toPrice(config.adultPrice, DEFAULT_CONFIG.adultPrice),
        childPrice: toPrice(config.childPrice, DEFAULT_CONFIG.childPrice),
        residentPrice: toPrice(config.residentPrice, DEFAULT_CONFIG.residentPrice),
        currency: 'PHP'
    };
    fs.mkdirSync(path.dirname(CONFIG_FILE), { recursive: true });
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(cleaned, null, 4), 'utf8');
    return cleaned;
};

module.exports = { readConfig, writeConfig, DEFAULT_CONFIG };