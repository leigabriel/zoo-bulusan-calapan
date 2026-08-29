const fs = require('fs');
const path = require('path');

const CONFIG_FILE = process.env.DONATION_CONFIG_FILE || path.join(__dirname, '..', 'data', 'donation-config.json');

const DEFAULT_CONFIG = {
    enabled: true,
    gcashNumber: '',
    accountName: '',
    note: ''
};

const readConfig = () => {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            const parsed = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
            return { ...DEFAULT_CONFIG, ...parsed };
        }
    } catch (error) {
        // fall back to defaults on read/parse errors
    }
    return { ...DEFAULT_CONFIG };
};

const writeConfig = (config) => {
    const cleaned = {
        enabled: Boolean(config.enabled),
        gcashNumber: String((config.gcashNumber || '').trim()),
        accountName: String((config.accountName || '').trim()),
        note: String((config.note || '').trim())
    };
    fs.mkdirSync(path.dirname(CONFIG_FILE), { recursive: true });
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(cleaned, null, 4), 'utf8');
    return cleaned;
};

module.exports = { readConfig, writeConfig };
