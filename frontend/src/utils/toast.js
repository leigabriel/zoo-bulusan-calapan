import { toast } from 'react-toastify';

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

    // Modern polished app style: short, natural, no technical jargon
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

    if (lowerMessage.includes('already exists') || lowerMessage.includes('duplicate')) {
        return "This already exists.";
    }

    if (lowerMessage.includes('invalid') || lowerMessage.includes('validation')) {
        return "Please check your information and try again.";
    }

    if (lowerMessage.includes('file too large') || lowerMessage.includes('size limit')) {
        return "File is too large. Please try a smaller one.";
    }

    const cleaned = message
        .replace(/request failed with status \d+/i, 'Something went wrong.')
        .replace(/server error/ig, 'Something went wrong.')
        .replace(/upload error/ig, "Couldn't upload your file.")
        .replace(/failed/ig, 'could not be completed')
        .replace(/error/ig, 'issue')
        .trim();

    return cleaned || fallbackMessages[fallbackKey] || fallbackMessages.retry;
};

export const notify = {
    success: (message, options) => toast.success(friendlyMessage(message, 'saved'), options),
    error: (message, options) => toast.error(friendlyMessage(message, 'retry'), options),
    info: (message, options) => toast.info(friendlyMessage(message, 'loading'), options),
    warning: (message, options) => toast.warning(friendlyMessage(message, 'required'), options),
    loading: (message, options) => toast.loading(friendlyMessage(message, 'loading'), options),
    update: (id, { type = 'default', message, isLoading = false, autoClose = 3000 } = {}) => {
        toast.update(id, {
            render: friendlyMessage(message, type === 'error' ? 'retry' : 'saved'),
            type,
            isLoading,
            autoClose,
            closeButton: true
        });
    },
    dismiss: (id) => toast.dismiss(id)
};

export { friendlyMessage };
