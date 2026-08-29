export const formatSafeDate = (value, options = {}) => {
    if (!value) return '-';
    const raw = typeof value === 'object' && value?.date ? value.date : value;
    const normalized = typeof raw === 'string' ? raw.trim() : raw;
    const date = typeof normalized === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(normalized)
        ? new Date(`${normalized}T00:00:00`)
        : new Date(normalized);
    if (Number.isNaN(date.getTime())) return '-';
    return options.timeStyle || options.hour || options.minute || options.second
        ? date.toLocaleString('en-US', options)
        : date.toLocaleDateString('en-US', options);
};

export const getDateTimestamp = value => {
    if (!value) return 0;
    const raw = typeof value === 'object' && value?.date ? value.date : value;
    const date = new Date(typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? `${raw}T00:00:00` : raw);
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
};