import { authAPI } from './api-client';

const STORAGE_KEYS = {
    admin: { token: 'admin_token', user: 'admin_user' },
    staff: { token: 'staff_token', user: 'staff_user' },
    user: { token: 'user_token', user: 'user_data' }
};

const TAB_ID_KEY = 'TAB_ID';

const getStorageKeys = (role) => {
    if (role === 'admin') return STORAGE_KEYS.admin;
    if (['staff', 'vet'].includes(role)) return STORAGE_KEYS.staff;
    return STORAGE_KEYS.user;
};

const getTabId = () => sessionStorage.getItem(TAB_ID_KEY);

export const login = async (email, password, loginType = 'user') => {
    // authAPI.login will include X-Tab-ID header (from api-client.getAuthHeaders)
    const response = await authAPI.login({ identifier: email, password, loginType });
    
    if (response.success && response.token && response.user) {
        const keys = getStorageKeys(response.user.role);
        const tabId = getTabId();
        if (tabId) {
            sessionStorage.setItem(`${keys.token}_${tabId}`, response.token);
            sessionStorage.setItem(`${keys.user}_${tabId}`, JSON.stringify(response.user));
        } else {
            sessionStorage.setItem(keys.token, response.token);
            sessionStorage.setItem(keys.user, JSON.stringify(response.user));
        }
    }
    
    return response;
};

export const register = async (fullName, email, password) => {
    const response = await authAPI.register({ fullName, email, password, role: 'user' });
    
    if (response.success && response.token && response.user) {
        const keys = STORAGE_KEYS.user;
        const tabId = getTabId();
        if (tabId) {
            sessionStorage.setItem(`${keys.token}_${tabId}`, response.token);
            sessionStorage.setItem(`${keys.user}_${tabId}`, JSON.stringify(response.user));
        } else {
            sessionStorage.setItem(keys.token, response.token);
            sessionStorage.setItem(keys.user, JSON.stringify(response.user));
        }
    }
    
    return response;
};

export const logout = (role = 'user') => {
    const keys = getStorageKeys(role);
    const tabId = getTabId();
    if (tabId) {
        sessionStorage.removeItem(`${keys.token}_${tabId}`);
        sessionStorage.removeItem(`${keys.user}_${tabId}`);
    } else {
        sessionStorage.removeItem(keys.token);
        sessionStorage.removeItem(keys.user);
    }
};

export const logoutAll = () => {
    // clears all session entries across tabs (use with caution)
    Object.values(STORAGE_KEYS).forEach(keys => {
        Object.keys(sessionStorage).forEach(k => {
            if (k.startsWith(keys.token) || k.startsWith(keys.user)) {
                sessionStorage.removeItem(k);
            }
        });
    });
};

export const getCurrentUser = (type = 'user') => {
    const keys = STORAGE_KEYS[type] || STORAGE_KEYS.user;
    const tabId = getTabId();
    const userData = tabId ? sessionStorage.getItem(`${keys.user}_${tabId}`) : sessionStorage.getItem(keys.user);
    return userData ? JSON.parse(userData) : null;
};

export const getToken = (type = 'user') => {
    const keys = STORAGE_KEYS[type] || STORAGE_KEYS.user;
    const tabId = getTabId();
    return tabId ? sessionStorage.getItem(`${keys.token}_${tabId}`) : sessionStorage.getItem(keys.token);
};

export const isAuthenticated = (type = 'user') => {
    return !!getToken(type);
};

export const updateStoredUser = (userData, type = 'user') => {
    const keys = STORAGE_KEYS[type] || STORAGE_KEYS.user;
    const tabId = getTabId();
    if (tabId) {
        sessionStorage.setItem(`${keys.user}_${tabId}`, JSON.stringify(userData));
    } else {
        sessionStorage.setItem(keys.user, JSON.stringify(userData));
    }
};

export default {
    login,
    register,
    logout,
    logoutAll,
    getCurrentUser,
    getToken,
    isAuthenticated,
    updateStoredUser
};
