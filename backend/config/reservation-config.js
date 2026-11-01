const fs = require('fs');
const path = require('path');

/**
 * Reservation availability settings. Kept separate from the payment configs
 * because availability is not a payment concern: an admin can close the whole
 * reservation page, or close only ticket bookings or only event bookings, while
 * leaving the payment setup untouched.
 */
const CONFIG_FILE = process.env.RESERVATION_CONFIG_FILE || path.join(__dirname, '..', 'data', 'reservation-config.json');

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

const readConfig = () => {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            const stored = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
            return {
                pageEnabled: toBoolean(stored.pageEnabled, DEFAULT_CONFIG.pageEnabled),
                ticketEnabled: toBoolean(stored.ticketEnabled, DEFAULT_CONFIG.ticketEnabled),
                eventEnabled: toBoolean(stored.eventEnabled, DEFAULT_CONFIG.eventEnabled)
            };
        }
    } catch (error) {
        console.error('Unable to read reservation config:', error.message);
    }
    return { ...DEFAULT_CONFIG };
};

const writeConfig = (config) => {
    const cleaned = {
        pageEnabled: toBoolean(config.pageEnabled, DEFAULT_CONFIG.pageEnabled),
        ticketEnabled: toBoolean(config.ticketEnabled, DEFAULT_CONFIG.ticketEnabled),
        eventEnabled: toBoolean(config.eventEnabled, DEFAULT_CONFIG.eventEnabled)
    };
    fs.mkdirSync(path.dirname(CONFIG_FILE), { recursive: true });
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(cleaned, null, 4), 'utf8');
    return cleaned;
};

module.exports = { readConfig, writeConfig, DEFAULT_CONFIG };
