import { gooeyToast } from 'goey-toast';

const fallbackMessages = {
    saved: 'Changes saved.',
    deleted: 'Removed successfully.',
    loading: 'Working on it...',
    retry: 'Something went wrong. Please try again.',
    required: 'Please fill in all required fields.'
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
        return "File is too large. Please try a smaller one.";
    }

    const cleaned = message
        .replace(/request failed with status \d+/i, 'Something went wrong.')
        .replace(/server error/ig, 'Something went wrong.')
        .replace(/upload error/ig, "Couldn't upload your file.")
        .trim();

    return cleaned || fallbackMessages[fallbackKey] || fallbackMessages.retry;
};

const showToast = (type, message, options) => {
    const title = friendlyMessage(message, type === 'error' ? 'retry' : type === 'warning' ? 'required' : 'saved');
    return type === 'default' ? gooeyToast(title, options) : gooeyToast[type](title, options);
};

export const notify = {
    success: (message, options) => showToast('success', message, options),
    error: (message, options) => showToast('error', message, options),
    info: (message, options) => showToast('info', message, options),
    warning: (message, options) => showToast('warning', message, options),
    loading: (message, options) => showToast('info', message, { ...options, duration: Infinity }),
    promise: (promise, config) => gooeyToast.promise(promise, config),
    update: (id, { type = 'default', message, title, isLoading = false, ...options } = {}) => {
        gooeyToast.update(id, {
            ...options,
            title: friendlyMessage(title || message, type === 'error' ? 'retry' : 'saved'),
            type: isLoading ? 'info' : type
        });
    },
    dismiss: (id) => gooeyToast.dismiss(id)
};

export { friendlyMessage };
