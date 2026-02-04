// API Base URL - ensure no trailing slash
const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');

const STORAGE_KEYS = {
    admin: { token: 'admin_token', user: 'admin_user' },
    staff: { token: 'staff_token', user: 'staff_user' },
    user: { token: 'user_token', user: 'user_data' }
};

const TAB_ID_KEY = 'TAB_ID';

const getTabId = () => sessionStorage.getItem(TAB_ID_KEY);

const getAuthHeaders = (type = 'user') => {
    const keys = STORAGE_KEYS[type] || STORAGE_KEYS.user;
    const tabId = getTabId();
    const token = tabId ? sessionStorage.getItem(`${keys.token}_${tabId}`) : sessionStorage.getItem(keys.token);
    return {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(tabId && { 'X-Tab-ID': tabId })
    };
};

export const authAPI = {
    register: async (userData) => {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(userData)
        });
        return response.json();
    },

    login: async (credentials) => {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(credentials)
        });
        return response.json();
    },

    getProfile: async (type = 'user') => {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: getAuthHeaders(type)
        });
        return response.json();
    },

    updatePassword: async (passwordData, type = 'user') => {
        const response = await fetch(`${API_BASE_URL}/auth/updatepassword`, {
            method: 'PUT',
            headers: getAuthHeaders(type),
            body: JSON.stringify(passwordData)
        });
        return response.json();
    },

    logout: async (type = 'user') => {
        const response = await fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            headers: getAuthHeaders(type)
        });
        return response.json();
    }
};


export const isAuthenticated = (type = 'user') => {
    const keys = STORAGE_KEYS[type] || STORAGE_KEYS.user;
    const tabId = getTabId();
    return !!(tabId ? sessionStorage.getItem(`${keys.token}_${tabId}`) : sessionStorage.getItem(keys.token));
};

export const getCurrentUser = (type = 'user') => {
    const keys = STORAGE_KEYS[type] || STORAGE_KEYS.user;
    const tabId = getTabId();
    const userData = tabId ? sessionStorage.getItem(`${keys.user}_${tabId}`) : sessionStorage.getItem(keys.user);
    return userData ? JSON.parse(userData) : null;
};

export const clearAuth = (type = 'user') => {
    const keys = STORAGE_KEYS[type] || STORAGE_KEYS.user;
    const tabId = getTabId();
    if (tabId) {
        sessionStorage.removeItem(`${keys.token}_${tabId}`);
        sessionStorage.removeItem(`${keys.user}_${tabId}`);
    } else {
        sessionStorage.removeItem(keys.token);
        sessionStorage.removeItem(keys.user);
    }
};

export const clearAllAuth = () => {
    Object.values(STORAGE_KEYS).forEach(keys => {
        Object.keys(sessionStorage).forEach(k => {
            if (k.startsWith(keys.token) || k.startsWith(keys.user)) {
                sessionStorage.removeItem(k);
            }
        });
    });
};

export const saveAuth = (token, user, type = 'user') => {
    const keys = STORAGE_KEYS[type] || STORAGE_KEYS.user;
    const tabId = getTabId();
    if (tabId) {
        sessionStorage.setItem(`${keys.token}_${tabId}`, token);
        sessionStorage.setItem(`${keys.user}_${tabId}`, JSON.stringify(user));
    } else {
        sessionStorage.setItem(keys.token, token);
        sessionStorage.setItem(keys.user, JSON.stringify(user));
    }
};

/**
 * Get the full URL for a profile image
 * Handles various formats: full URLs, relative paths, and filenames
 */
export const getProfileImageUrl = (profileImg) => {
    if (!profileImg) return null;
    
    // If it's already a full URL (http/https), use it directly
    if (profileImg.startsWith('http')) {
        return profileImg;
    }
    
    // If it's a relative path starting with /uploads, prepend the backend URL
    if (profileImg.startsWith('/uploads')) {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 
            API_BASE_URL.replace('/api', '') || 
            '';
        return `${backendUrl}${profileImg}`;
    }
    
    // Legacy: if it's in the frontend's profile-img folder
    if (profileImg.startsWith('/profile-img/')) {
        return profileImg;
    }
    
    // Default: assume it's in the backend uploads
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 
        API_BASE_URL.replace('/api', '') || 
        '';
    return `${backendUrl}/uploads/profile-images/${profileImg}`;
};

export default {
    authAPI,
    isAuthenticated,
    getCurrentUser,
    clearAuth,
    clearAllAuth,
    saveAuth,
    getProfileImageUrl
};