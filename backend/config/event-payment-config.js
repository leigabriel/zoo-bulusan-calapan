const fs = require('fs');
const path = require('path');

const CONFIG_FILE = process.env.EVENT_PAYMENT_CONFIG_FILE || path.join(__dirname, '..', 'data', 'event-payment-config.json');

const DEFAULT_CONFIG = {
    qrphEnabled: false,
    amountPerParticipant: 0,
    currency: 'PHP'
};

const readConfig = () => {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            const stored = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
            return { ...DEFAULT_CONFIG, ...stored, qrphEnabled: stored.qrphEnabled ?? stored.enabled ?? DEFAULT_CONFIG.qrphEnabled };
        }
    } catch (error) {
        console.error('Unable to read event payment config:', error.message);
    }
    return { ...DEFAULT_CONFIG };
};

const writeConfig = (config) => {
    const amount = Number(config.amountPerParticipant);
    const cleaned = {
        qrphEnabled: Boolean(config.qrphEnabled ?? config.enabled),
        amountPerParticipant: Number.isFinite(amount) && amount >= 0 ? Math.round(amount * 100) / 100 : 0,
        currency: 'PHP'
    };
    fs.mkdirSync(path.dirname(CONFIG_FILE), { recursive: true });
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(cleaned, null, 4), 'utf8');
    return cleaned;
};

module.exports = { readConfig, writeConfig };
