import { gooeyToast } from 'goey-toast';

// A success toast already states the outcome in its title, so an automatic
// subtitle ("Changes saved." under "Settings saved.") only adds noise. Only
// errors and warnings get a short next-step hint; callers that have something
// more useful to say can still pass an explicit description.
const actionHint = (type) => {
    if (type === 'error') return 'Please try again.';
    if (type === 'warning') return 'Please check and try again.';
    return null;
};

const fallbackMessages = {
    saved: 'Changes saved.',
    deleted: 'Removed successfully.',
    loading: 'Please wait...',
    retry: 'Please try again.',
    required: 'Please fill in the required fields.'
};

const soundUrls = {
    success: '/sound/success-sfx.mp3',
    error: '/sound/error-sfx.mp3'
};
const sounds = {};

const playToastSound = (type) => {
    if (typeof Audio === 'undefined' || !soundUrls[type]) return;
    const audio = sounds[type] || new Audio(soundUrls[type]);
    sounds[type] = audio;
    audio.volume = 0.45;
    audio.currentTime = 0;
    audio.play().catch(() => {});
};

const friendlyMessage = (message, fallbackKey = 'retry') => {
    if (!message || typeof message !== 'string') {
        return fallbackMessages[fallbackKey] || fallbackMessages.retry;
    }

    const lowerMessage = message.toLowerCase();
    const has = (...needles) => needles.some((needle) => lowerMessage.includes(needle));

    // The browser's own network errors are the most common technical string a
    // visitor sees. "Failed to fetch", "Load failed" and the socket errno codes
    // all mean the request never reached the server, so say that in plain words.
    if (has('network error', 'offline', 'failed to fetch', 'load failed', 'networkerror',
        'econnrefused', 'etimedout', 'enotfound', 'net::err')) {
        return "You're offline. Check your connection and try again.";
    }

    if (has('unauthorized', '401', 'forbidden', 'permission')) {
        return "You don't have permission to do that.";
    }

    if (has('not found', '404')) {
        return "We couldn't find what you're looking for.";
    }

    if (has('timed out', 'timeout', 'took too long', 'temporarily unavailable')) {
        return 'This is taking longer than usual. Please try again.';
    }

    if (has('file too large', 'size limit')) {
        return "That file is too big. Please pick a smaller one.";
    }

    // Expired credentials and parser/server failures are not something the visitor
    // can act on from the current page, so never show the raw text.
    if (has('jwt expired', 'token expired', 'invalid token', 'session expired')) {
        return 'Your session expired. Please sign in again.';
    }

    if (has('internal server error', 'bad gateway', 'service unavailable', 'gateway timeout',
        'invalid server response', 'unexpected token', 'cannot read propert')) {
        return 'Something went wrong. Please try again.';
    }

    // Upload failures often arrive as "Upload error: Unexpected field. Use ...",
    // which is middleware wording, not something a visitor can act on.
    if (has('upload error', 'unexpected field')) {
        return "We couldn't upload your file. Please try again.";
    }

    const cleaned = message
        .replace(/request failed with status \d+/i, 'Something went wrong.')
        .replace(/server error/ig, 'Something went wrong.')
        .trim();

    return cleaned || fallbackMessages[fallbackKey] || fallbackMessages.retry;
};

const showToast = (type, message, options) => {
    const title = friendlyMessage(message, type === 'error' ? 'retry' : type === 'warning' ? 'required' : 'saved');
    playToastSound(type);
    const toastOptions = { ...options };
    const hint = toastOptions.description === undefined ? actionHint(type) : null;
    if (hint) toastOptions.description = hint;
    return type === 'default' ? gooeyToast(title, toastOptions) : gooeyToast[type](title, toastOptions);
};

export const notify = {
    success: (message, options) => showToast('success', message, options),
    error: (message, options) => showToast('error', message, options),
    info: (message, options) => showToast('info', message, options),
    warning: (message, options) => showToast('warning', message, options),
    loading: (message, options) => showToast('info', message, { duration: Infinity, description: 'Working on it. This may take a moment.', ...options }),
    promise: (promise, config) => gooeyToast.promise(promise, config),
    update: (id, { type = 'default', message, title, isLoading = false, ...options } = {}) => {
        if (!isLoading) playToastSound(type);
        const resolvedTitle = friendlyMessage(title || message, type === 'error' ? 'retry' : 'saved');
        const resolvedType = isLoading ? 'info' : type;
        const nextOptions = { ...options, title: resolvedTitle, type: resolvedType };
        const hint = options.description === undefined ? actionHint(resolvedType) : null;
        if (hint) nextOptions.description = hint;
        gooeyToast.update(id, nextOptions);
    },
    dismiss: (id) => gooeyToast.dismiss(id)
};

export { friendlyMessage };
