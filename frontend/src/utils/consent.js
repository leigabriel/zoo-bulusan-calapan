const CONSENT_LOG_KEY = 'bulusan_consent_log_v1';
const COOKIE_CONSENT_KEY = 'bulusan_cookie_consent_v1';

export const getCookieConsent = () => {
    try {
        const raw = localStorage.getItem(COOKIE_CONSENT_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

export const setCookieConsent = (accepted) => {
    const record = {
        decision: accepted ? 'accepted' : 'declined',
        timestamp: new Date().toISOString()
    };
    try {
        localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(record));
    } catch {
        // Storage can be unavailable in private browsing or restricted contexts.
    }
    return record;
};

const readLog = () => {
    try {
        const raw = localStorage.getItem(CONSENT_LOG_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
};

const writeLog = (entries) => {
    try {
        localStorage.setItem(CONSENT_LOG_KEY, JSON.stringify(entries));
    } catch {
        // Storage can be unavailable in private browsing or restricted contexts.
    }
};

export const appendConsentRecord = ({ type, summary, data }) => {
    const record = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type,
        summary,
        timestamp: new Date().toISOString(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        data: data || null
    };
    const log = readLog();
    log.push(record);
    writeLog(log);
    return record;
};

export const getConsentLog = () => readLog();

export const clearConsentLog = () => writeLog([]);