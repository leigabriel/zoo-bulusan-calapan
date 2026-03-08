import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

const STORAGE_KEYS = {
    admin: { token: 'admin_token', user: 'admin_user' },
    staff: { token: 'staff_token', user: 'staff_user' },
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
    if (role === 'staff') return STORAGE_KEYS.staff;
    return STORAGE_KEYS.user;
};

const getSessionType = (role) => {
    if (role === 'admin') return 'admin';
    if (role === 'staff') return 'staff';
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
                // Check localStorage first for persistent session, then sessionStorage for backward compatibility
                const storedToken = localStorage.getItem(`${keys.token}_${tabId}`) 
                    || localStorage.getItem(keys.token)
                    || sessionStorage.getItem(`${keys.token}_${tabId}`) 
                    || sessionStorage.getItem(keys.token);
                const storedUser = localStorage.getItem(`${keys.user}_${tabId}`) 
                    || localStorage.getItem(keys.user)
                    || sessionStorage.getItem(`${keys.user}_${tabId}`) 
                    || sessionStorage.getItem(keys.user);

                if (storedToken && storedUser) {
                    try {
                        const userData = JSON.parse(storedUser);
                        setToken(storedToken);
                        setUser(userData);
                        setSessionType(type);
                        
                        // Migrate to localStorage if found in sessionStorage only
                        if (!localStorage.getItem(keys.token)) {
                            localStorage.setItem(keys.token, storedToken);
                            localStorage.setItem(keys.user, storedUser);
                        }
                        break;
                    } catch (e) {
                        // Clean up invalid data
                        localStorage.removeItem(`${keys.token}_${tabId}`);
                        localStorage.removeItem(`${keys.user}_${tabId}`);
                        localStorage.removeItem(keys.token);
                        localStorage.removeItem(keys.user);
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
        
        // Store in localStorage for persistence across browser sessions
        localStorage.setItem(keys.token, authToken);
        localStorage.setItem(keys.user, JSON.stringify(userData));
        
        // Also store per-tab in sessionStorage for multi-tab support
        if (tabId) {
            sessionStorage.setItem(`${keys.token}_${tabId}`, authToken);
            sessionStorage.setItem(`${keys.user}_${tabId}`, JSON.stringify(userData));
        }
        
        setToken(authToken);
        setUser(userData);
        setSessionType(sessionTypeVal);
    }, []);

    const logout = useCallback(() => {
        const tabId = sessionStorage.getItem(TAB_ID_KEY);
        if (sessionType) {
            const keys = STORAGE_KEYS[sessionType] || STORAGE_KEYS.user;
            
            // Clear from localStorage (persistent storage)
            localStorage.removeItem(keys.token);
            localStorage.removeItem(keys.user);
            localStorage.removeItem(`${keys.token}_${tabId}`);
            localStorage.removeItem(`${keys.user}_${tabId}`);
            
            // Clear from sessionStorage
            if (tabId) {
                sessionStorage.removeItem(`${keys.token}_${tabId}`);
                sessionStorage.removeItem(`${keys.user}_${tabId}`);
            }
            sessionStorage.removeItem(keys.token);
            sessionStorage.removeItem(keys.user);
        }

        setToken(null);
        setUser(null);
        setSessionType(null);
    }, [sessionType]);

    const updateUser = useCallback((userData) => {
        const keys = getStorageKeys(userData.role || sessionType);
        const tabId = sessionStorage.getItem(TAB_ID_KEY);
        const userDataStr = JSON.stringify(userData);
        
        // Update in localStorage for persistence
        localStorage.setItem(keys.user, userDataStr);
        
        // Update in sessionStorage for tab tracking
        if (tabId) {
            sessionStorage.setItem(`${keys.user}_${tabId}`, userDataStr);
        }
        
        setUser(userData);
    }, [sessionType]);

    const isAuthenticated = Boolean(token && user);
    const isAdmin = user?.role === 'admin';
    const isStaff = user?.role === 'staff';
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
