const getApiUrl = () => import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/api`;

export const getVisitorKey = () => {
    try {
        const storageKey = 'zoo_visitor_key';
        let key = localStorage.getItem(storageKey);
        if (!key) {
            key = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
            localStorage.setItem(storageKey, key);
        }
        return key;
    } catch {
        return null;
    }
};

export const trackVisit = (path) => {
    const visitorKey = getVisitorKey();
    if (!visitorKey) return;

    fetch(`${getApiUrl()}/analytics/visit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorKey, path: path || window.location.pathname }),
        keepalive: true
    }).catch(() => {});
};