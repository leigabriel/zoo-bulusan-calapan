import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

const STORAGE_KEYS = {
    admin: { token: 'admin_token', user: 'admin_user' },
    staff: { token: 'staff_token', user: 'staff_user' },
    vet: { token: 'staff_token', user: 'staff_user' },
    user: { token: 'user_token', user: 'user_data' }
};

const TAB_ID_KEY = 'TAB_ID';

// Simple UUID v4 generator for tab IDs
const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

const getStorageKeys = (role) => {
    if (role === 'admin') return STORAGE_KEYS.admin;
    if (['staff', 'vet'].includes(role)) return STORAGE_KEYS.staff;
    return STORAGE_KEYS.user;
};

const getSessionType = (role) => {
    if (role === 'admin') return 'admin';
    if (['staff', 'vet'].includes(role)) return 'staff';
    return 'user';
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sessionType, setSessionType] = useState(null);

    useEffect(() => {
        const initAuth = () => {
            // ensure this tab has a unique tab id stored in sessionStorage
            let tabId = sessionStorage.getItem(TAB_ID_KEY);
            if (!tabId) {
                tabId = generateUUID();
                sessionStorage.setItem(TAB_ID_KEY, tabId);
            }

            for (const [type, keys] of Object.entries(STORAGE_KEYS)) {
                // tokens and users are stored per-tab as `${key}_${tabId}` in sessionStorage
                const storedToken = sessionStorage.getItem(`${keys.token}_${tabId}`) || sessionStorage.getItem(keys.token);
                const storedUser = sessionStorage.getItem(`${keys.user}_${tabId}`) || sessionStorage.getItem(keys.user);

                if (storedToken && storedUser) {
                    try {
                        const userData = JSON.parse(storedUser);
                        setToken(storedToken);
                        setUser(userData);
                        setSessionType(type);
                        break;
                    } catch (e) {
                        sessionStorage.removeItem(`${keys.token}_${tabId}`);
                        sessionStorage.removeItem(`${keys.user}_${tabId}`);
                    }
                }
            }
            setLoading(false);
        };
        initAuth();
    }, []);

    const login = useCallback((userData, authToken, type = null) => {
        const sessionTypeVal = type || getSessionType(userData.role);
        const keys = getStorageKeys(userData.role);
        const tabId = sessionStorage.getItem(TAB_ID_KEY);
        if (tabId) {
            sessionStorage.setItem(`${keys.token}_${tabId}`, authToken);
            sessionStorage.setItem(`${keys.user}_${tabId}`, JSON.stringify(userData));
        } else {
            sessionStorage.setItem(keys.token, authToken);
            sessionStorage.setItem(keys.user, JSON.stringify(userData));
        }
        setToken(authToken);
        setUser(userData);
        setSessionType(sessionTypeVal);
    }, []);

    const logout = useCallback(() => {
        const tabId = sessionStorage.getItem(TAB_ID_KEY);
        if (sessionType) {
            const keys = STORAGE_KEYS[sessionType] || STORAGE_KEYS.user;
            if (tabId) {
                sessionStorage.removeItem(`${keys.token}_${tabId}`);
                sessionStorage.removeItem(`${keys.user}_${tabId}`);
            } else {
                sessionStorage.removeItem(keys.token);
                sessionStorage.removeItem(keys.user);
            }
        }

        // Do NOT clear other tabs' sessionStorage entries; only clear this tab's items
        setToken(null);
        setUser(null);
        setSessionType(null);
    }, [sessionType]);

    const updateUser = useCallback((userData) => {
        const keys = getStorageKeys(userData.role || sessionType);
        const tabId = sessionStorage.getItem(TAB_ID_KEY);
        if (tabId) {
            sessionStorage.setItem(`${keys.user}_${tabId}`, JSON.stringify(userData));
        } else {
            sessionStorage.setItem(keys.user, JSON.stringify(userData));
        }
        setUser(userData);
    }, [sessionType]);

    const isAuthenticated = Boolean(token && user);
    const isAdmin = user?.role === 'admin';
    const isStaff = ['staff', 'vet'].includes(user?.role);
    const isUser = user?.role === 'user';

    const hasRole = useCallback((roles) => {
        if (!user) return false;
        if (typeof roles === 'string') return user.role === roles;
        return roles.includes(user.role);
    }, [user]);

    const value = {
        user,
        token,
        loading,
        sessionType,
        isAuthenticated,
        isAdmin,
        isStaff,
        isUser,
        login,
        logout,
        updateUser,
        hasRole
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
