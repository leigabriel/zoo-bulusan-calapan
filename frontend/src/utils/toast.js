import { toast } from 'react-toastify';

const fallbackMessages = {
    saved: 'Changes saved successfully.',
    deleted: 'Item removed successfully.',
    loading: 'Processing your request...',
    retry: 'Something went wrong. Please try again.',
    required: 'Please complete all required fields.'
};

const friendlyMessage = (message, fallbackKey = 'retry') => {
    if (!message || typeof message !== 'string') {
        return fallbackMessages[fallbackKey] || fallbackMessages.retry;
    }

    const cleaned = message
        .replace(/request failed with status \d+/i, 'Something went wrong. Please try again.')
        .replace(/server error/ig, 'Something went wrong. Please try again.')
        .replace(/upload error/ig, 'We could not upload your file.')
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
