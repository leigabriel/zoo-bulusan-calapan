const POST_REPORT_REASONS = ['spam', 'harassment', 'hate_speech', 'inappropriate',
                             'misinformation', 'personal_info', 'other'];
const REASON_DETAIL_REQUIRED = 'other';
const REASON_DETAIL_MAX = 500;

/**
 * Validate a visitor's report of a community post.
 *
 * A detail is optional on every reason and mandatory on `other`: moderators triage from
 * the queue and need to read why a post was reported whichever reason was chosen, not
 * only when the reporter could not find a matching reason. An absent detail is stored
 * as NULL so the queue can tell "no explanation given" from "explained".
 *
 * @param {{ reason?: unknown, detail?: unknown }} input
 * @returns {{ ok: boolean, reason: string|null, detail: string|null, error: string|null }}
 */
const validatePostReport = ({ reason, detail } = {}) => {
    if (!POST_REPORT_REASONS.includes(reason)) {
        return { ok: false, reason: null, detail: null, error: 'Please choose a reason for this report.' };
    }

    const text = typeof detail === 'string'
        ? detail.replace(/\s+/g, ' ').trim().slice(0, REASON_DETAIL_MAX)
        : '';

    if (reason === REASON_DETAIL_REQUIRED && !text) {
        return { ok: false, reason: null, detail: null, error: 'Please describe the issue.' };
    }

    return { ok: true, reason, detail: text || null, error: null };
};

module.exports = { validatePostReport, POST_REPORT_REASONS };
