/**
 * Turns a stored user_agent string into something an admin can read at a glance.
 *
 * The Logs page has to answer "what device was this on?", and both log tables
 * already store the raw header. Everything here is best-effort classification:
 * an unrecognised string still returns a usable label rather than throwing.
 */

const OS_RULES = [
    // Order matters: Android and iPad both claim to be Mac/Linux in some UAs,
    // and Edge/Chrome both claim to be Safari.
    [/windows nt|windows phone|win64|win32/i, 'Windows'],
    [/iphone|ipad|ipod|ios/i, 'iOS'],
    [/android/i, 'Android'],
    [/cros/i, 'ChromeOS'],
    [/mac os x|macintosh/i, 'macOS'],
    [/ubuntu|fedora|debian|linux/i, 'Linux'],
    [/^node(\/|$)|postman|insomnia|curl|wget|python-requests/i, 'Server / CLI']
];

const BROWSER_RULES = [
    [/edg[ea]?\//i, 'Edge'],
    [/opr\/|opera/i, 'Opera'],
    [/samsungbrowser/i, 'Samsung Internet'],
    [/firefox\/|fxios/i, 'Firefox'],
    [/chrome\/|crios/i, 'Chrome'],
    [/safari\//i, 'Safari'],
    [/msie|trident/i, 'Internet Explorer']
];

const toLabel = (value) => {
    const text = String(value ?? '').trim();
    return text && text.toLowerCase() !== 'unknown' ? text : '';
};

/**
 * Device class from the UA string.
 *
 * @param {string|null|undefined} userAgent
 * @returns {'Desktop'|'Mobile'|'Tablet'|'Bot'|'Server / CLI'|'Unknown'}
 */
export const deviceType = (userAgent) => {
    const ua = toLabel(userAgent);
    if (!ua) return 'Unknown';
    if (/bot|crawler|spider|headlesschrome/i.test(ua)) return 'Bot';
    if (/node|postman|insomnia|curl|wget|python-requests/i.test(ua)) return 'Server / CLI';
    if (/ipad|tablet|playbook|silk/i.test(ua) || (/android/i.test(ua) && !/mobile/i.test(ua))) return 'Tablet';
    if (/mobi|iphone|ipod|android/i.test(ua)) return 'Mobile';
    return 'Desktop';
};

/**
 * @param {string|null|undefined} userAgent
 * @returns {string} e.g. 'Windows', or 'Unknown'
 */
export const deviceOs = (userAgent) => {
    const ua = toLabel(userAgent);
    if (!ua) return 'Unknown';
    const match = OS_RULES.find(([pattern]) => pattern.test(ua));
    return match ? match[1] : 'Unknown';
};

/**
 * @param {string|null|undefined} userAgent
 * @returns {string} e.g. 'Firefox', or 'Unknown'
 */
export const deviceBrowser = (userAgent) => {
    const ua = toLabel(userAgent);
    if (!ua) return 'Unknown';
    const match = BROWSER_RULES.find(([pattern]) => pattern.test(ua));
    return match ? match[1] : 'Other';
};

/**
 * Everything the Device column shows.
 *
 * @param {string|null|undefined} userAgent
 * @returns {{type: string, os: string, browser: string, label: string}}
 */
export const describeUserAgent = (userAgent) => {
    const ua = toLabel(userAgent);
    if (!ua) return { type: 'Unknown', os: 'Unknown', browser: 'Unknown', label: 'Unknown' };
    const type = deviceType(ua);
    const os = deviceOs(ua);
    const browser = deviceBrowser(ua);
    // A server/CLI caller has no browser to name; repeating the type would read
    // like a rendering bug.
    if (type === 'Server / CLI' || type === 'Bot') return { type, os, browser, label: type };
    return { type, os, browser, label: `${type} · ${os} · ${browser}` };
};