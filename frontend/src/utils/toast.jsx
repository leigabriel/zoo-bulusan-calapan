import { gooeyToast } from 'goey-toast';

const actionHint = (title, type) => {
    if (type === 'error') return 'Sorry, something went wrong. Please try again.';
    if (type === 'warning') return 'Please check the highlighted parts and try again.';
    if (type !== 'success') return 'Please take a look at the details above.';

    const t = title.toLowerCase();
    if (/(added|created|submitted|new)/.test(t)) return "Done! You can now see it in the list.";
    if (/(updated|saved|changed|edited)/.test(t)) return 'Done! Your changes have been saved.';
    if (/(deleted|removed|moved to trash|cancelled|canceled|archived|declined|deactivated)/.test(t)) return "It's been removed from the list. You can still bring it back from the trash.";
    if (/(restored|restore)/.test(t)) return 'It is back where it belongs.';
    if (/(liked|hearted|shared|followed|joined)/.test(t)) return 'Thanks for your support!';
    if (/(copied|exported|downloaded|printed)/.test(t)) return 'It is ready — just paste or save it anywhere.';
    if (/(verified|checked|confirmed|checked in|checked-in)/.test(t)) return 'All done, everything is confirmed now.';
    if (/(read|marked as read|replied|sent|posted|commented)/.test(t)) return 'Everyone can now see it.';
    if (/(refund|payment|charged)/.test(t)) return "We'll check it and get back to you soon.";
    if (/(approved|approve)/.test(t)) return 'It is now approved and out for everyone to see.';
    return 'All set — nothing more needed from you.';
};

const fallbackMessages = {
    saved: 'Done! Your changes are saved.',
    deleted: 'Done! It has been removed.',
    loading: 'Working on it...',
    retry: 'Something went wrong. Please try again.',
    required: 'Please fill in the missing details first.'
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

    if (lowerMessage.includes('network error') || lowerMessage.includes('offline')) {
        return "You're offline. Check your connection and try again.";
    }

    if (lowerMessage.includes('unauthorized') || lowerMessage.includes('401') || lowerMessage.includes('permission')) {
        return "You don't have permission to do that.";
    }

    if (lowerMessage.includes('not found') || lowerMessage.includes('404')) {
        return "We couldn't find what you're looking for.";
    }

    if (lowerMessage.includes('file too large') || lowerMessage.includes('size limit')) {
        return "That file is too big. Please pick a smaller one.";
    }

    const cleaned = message
        .replace(/request failed with status \d+/i, 'Something went wrong.')
        .replace(/server error/ig, 'Something went wrong.')
        .replace(/upload error/ig, "We couldn't upload your file.")
        .trim();

    return cleaned || fallbackMessages[fallbackKey] || fallbackMessages.retry;
};

const showToast = (type, message, options) => {
    const title = friendlyMessage(message, type === 'error' ? 'retry' : type === 'warning' ? 'required' : 'saved');
    playToastSound(type);
    const description = options?.description ?? actionHint(title, type);
    const toastOptions = { description, ...options };
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
        gooeyToast.update(id, {
            ...options,
            title: resolvedTitle,
            type: isLoading ? 'info' : type,
            description: options.description ?? actionHint(resolvedTitle, isLoading ? 'info' : type)
        });
    },
    dismiss: (id) => gooeyToast.dismiss(id)
};

export { friendlyMessage };
