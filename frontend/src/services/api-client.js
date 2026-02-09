// Dynamically determine API URL based on current hostname
// This allows both localhost and network IP access (e.g., 10.53.28.57)
const getApiBaseUrl = () => {
    // If env variable is explicitly set (and not the default localhost), use it
    const envUrl = import.meta.env.VITE_API_URL;
    if (envUrl && !envUrl.includes('localhost')) {
        return envUrl.replace(/\/$/, '');
    }
    
    // Dynamically use current hostname with backend port
    const backendPort = import.meta.env.VITE_BACKEND_PORT || '5000';
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    
    return `${protocol}//${hostname}:${backendPort}/api`;
};

const getBackendBaseUrl = () => {
    const envUrl = import.meta.env.VITE_BACKEND_URL;
    if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('0.0.0.0')) {
        return envUrl.replace(/\/$/, '');
    }
    
    const backendPort = import.meta.env.VITE_BACKEND_PORT || '5000';
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    
    return `${protocol}//${hostname}:${backendPort}`;
};

// API Base URL - ensure no trailing slash
const API_BASE_URL = getApiBaseUrl();

// Backend Base URL (for OAuth and file uploads)
const BACKEND_BASE_URL = getBackendBaseUrl();

export const STORAGE_KEYS = {
    admin: { token: 'admin_token', user: 'admin_user' },
    staff: { token: 'staff_token', user: 'staff_user' },
    vet: { token: 'staff_token', user: 'staff_user' },
    user: { token: 'user_token', user: 'user_data' }
};

const TAB_ID_KEY = 'TAB_ID';

const getTabId = () => {
    try {
        return sessionStorage.getItem(TAB_ID_KEY);
    } catch (e) {
        return null;
    }
};

const getToken = (type = 'user') => {
    const keys = STORAGE_KEYS[type] || STORAGE_KEYS.user;
    const tabId = getTabId();
    // Prefer tab-scoped token; fall back to non-scoped token for compatibility
    if (tabId) {
        return sessionStorage.getItem(`${keys.token}_${tabId}`) || sessionStorage.getItem(keys.token) || null;
    }
    return sessionStorage.getItem(keys.token) || null;
};

const getAuthHeaders = (type = 'user') => {
    const token = getToken(type);
    const tabId = getTabId();
    return {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(tabId && { 'X-Tab-ID': tabId })
    };
};

// Auth headers without Content-Type for FormData uploads
const getAuthHeadersMultipart = (type = 'user') => {
    const token = getToken(type);
    const tabId = getTabId();
    return {
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(tabId && { 'X-Tab-ID': tabId })
    };
};

const handleResponse = async (response) => {
    // Handle empty responses
    const text = await response.text();
    
    if (!text) {
        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
        }
        return { success: true };
    }
    
    // Try to parse as JSON
    let data;
    try {
        data = JSON.parse(text);
    } catch (e) {
        // Response is not JSON
        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
        }
        throw new Error('Invalid server response');
    }
    
    if (!response.ok) {
        throw new Error(data.message || 'Request failed');
    }
    return data;
};

export const authAPI = {
    register: async (userData) => {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        return handleResponse(response);
    },

    login: async (credentials) => {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(credentials)
        });
        return handleResponse(response);
    },

    getProfile: async (type = 'user') => {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: getAuthHeaders(type)
        });
        return handleResponse(response);
    },

    updateProfile: async (profileData, type = 'user') => {
        const response = await fetch(`${API_BASE_URL}/auth/profile`, {
            method: 'PUT',
            headers: getAuthHeaders(type),
            body: JSON.stringify(profileData)
        });
        return handleResponse(response);
    },

    updatePassword: async (passwordData, type = 'user') => {
        const response = await fetch(`${API_BASE_URL}/auth/updatepassword`, {
            method: 'PUT',
            headers: getAuthHeaders(type),
            body: JSON.stringify(passwordData)
        });
        return handleResponse(response);
    },

    deleteAccount: async (data, type = 'user') => {
        const response = await fetch(`${API_BASE_URL}/auth/account`, {
            method: 'DELETE',
            headers: getAuthHeaders(type),
            body: JSON.stringify(data)
        });
        return handleResponse(response);
    },

    logout: async (type = 'user') => {
        const response = await fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            headers: getAuthHeaders(type)
        });
        return handleResponse(response);
    },

    uploadProfileImage: async (file, type = 'user') => {
        const formData = new FormData();
        formData.append('profileImage', file);

        const response = await fetch(`${API_BASE_URL}/auth/profile/image`, {
            method: 'POST',
            headers: getAuthHeadersMultipart(type),
            body: formData
        });
        return handleResponse(response);
    },

    deleteProfileImage: async (type = 'user') => {
        const response = await fetch(`${API_BASE_URL}/auth/profile/image`, {
            method: 'DELETE',
            headers: getAuthHeaders(type)
        });
        return handleResponse(response);
    }
};

export const adminAPI = {
    getDashboard: async () => {
        const response = await fetch(`${API_BASE_URL}/admin/dashboard`, {
            headers: getAuthHeaders('admin')
        });
        return handleResponse(response);
    },

    getUsers: async () => {
        const response = await fetch(`${API_BASE_URL}/admin/users`, {
            headers: getAuthHeaders('admin')
        });
        return handleResponse(response);
    },

    createUser: async (userData) => {
        const response = await fetch(`${API_BASE_URL}/admin/users`, {
            method: 'POST',
            headers: getAuthHeaders('admin'),
            body: JSON.stringify(userData)
        });
        return handleResponse(response);
    },

    updateUser: async (id, userData) => {
        const response = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders('admin'),
            body: JSON.stringify(userData)
        });
        return handleResponse(response);
    },

    deleteUser: async (id) => {
        const response = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders('admin')
        });
        return handleResponse(response);
    },

    getAnimals: async () => {
        const response = await fetch(`${API_BASE_URL}/admin/animals`, {
            headers: getAuthHeaders('admin')
        });
        return handleResponse(response);
    },

    createAnimal: async (animalData) => {
        const response = await fetch(`${API_BASE_URL}/admin/animals`, {
            method: 'POST',
            headers: getAuthHeaders('admin'),
            body: JSON.stringify(animalData)
        });
        return handleResponse(response);
    },

    updateAnimal: async (id, animalData) => {
        const response = await fetch(`${API_BASE_URL}/admin/animals/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders('admin'),
            body: JSON.stringify(animalData)
        });
        return handleResponse(response);
    },

    deleteAnimal: async (id) => {
        const response = await fetch(`${API_BASE_URL}/admin/animals/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders('admin')
        });
        return handleResponse(response);
    },

    getEvents: async () => {
        const response = await fetch(`${API_BASE_URL}/admin/events`, {
            headers: getAuthHeaders('admin')
        });
        return handleResponse(response);
    },

    createEvent: async (eventData) => {
        const response = await fetch(`${API_BASE_URL}/admin/events`, {
            method: 'POST',
            headers: getAuthHeaders('admin'),
            body: JSON.stringify(eventData)
        });
        return handleResponse(response);
    },

    updateEvent: async (id, eventData) => {
        const response = await fetch(`${API_BASE_URL}/admin/events/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders('admin'),
            body: JSON.stringify(eventData)
        });
        return handleResponse(response);
    },

    deleteEvent: async (id) => {
        const response = await fetch(`${API_BASE_URL}/admin/events/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders('admin')
        });
        return handleResponse(response);
    },

    getTickets: async () => {
        const response = await fetch(`${API_BASE_URL}/admin/tickets`, {
            headers: getAuthHeaders('admin')
        });
        return handleResponse(response);
    },

    getTicketById: async (id) => {
        const response = await fetch(`${API_BASE_URL}/admin/tickets/${id}`, {
            headers: getAuthHeaders('admin')
        });
        return handleResponse(response);
    },

    updateTicketStatus: async (id, statusData) => {
        const response = await fetch(`${API_BASE_URL}/admin/tickets/${id}/status`, {
            method: 'PUT',
            headers: getAuthHeaders('admin'),
            body: JSON.stringify(statusData)
        });
        return handleResponse(response);
    },

    getRevenueReport: async (startDate, endDate) => {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        
        const response = await fetch(`${API_BASE_URL}/admin/reports/revenue?${params}`, {
            headers: getAuthHeaders('admin')
        });
        return handleResponse(response);
    },

    getAnalytics: async (timeRange = 'week') => {
        const response = await fetch(`${API_BASE_URL}/admin/analytics?timeRange=${timeRange}`, {
            headers: getAuthHeaders('admin')
        });
        return handleResponse(response);
    },

    uploadImage: async (file) => {
        const formData = new FormData();
        formData.append('image', file);
        
        const token = getToken('admin');
        const response = await fetch(`${API_BASE_URL}/admin/upload-image`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        return handleResponse(response);
    },

    // Notifications
    getNotifications: async () => {
        const response = await fetch(`${API_BASE_URL}/admin/notifications`, {
            headers: getAuthHeaders('admin')
        });
        return handleResponse(response);
    },

    markNotificationRead: async (id) => {
        const response = await fetch(`${API_BASE_URL}/admin/notifications/${id}/read`, {
            method: 'PUT',
            headers: getAuthHeaders('admin')
        });
        return handleResponse(response);
    },

    markAllNotificationsRead: async () => {
        const response = await fetch(`${API_BASE_URL}/admin/notifications/read-all`, {
            method: 'PUT',
            headers: getAuthHeaders('admin')
        });
        return handleResponse(response);
    }
};

export const staffAPI = {
    getDashboard: async () => {
        const response = await fetch(`${API_BASE_URL}/staff/dashboard`, {
            headers: getAuthHeaders('staff')
        });
        return handleResponse(response);
    },

    getAnimals: async () => {
        const response = await fetch(`${API_BASE_URL}/staff/animals`, {
            headers: getAuthHeaders('staff')
        });
        return handleResponse(response);
    },

    updateAnimalStatus: async (id, status) => {
        const response = await fetch(`${API_BASE_URL}/staff/animals/${id}/status`, {
            method: 'PUT',
            headers: getAuthHeaders('staff'),
            body: JSON.stringify({ status })
        });
        return handleResponse(response);
    },

    validateTicket: async (code) => {
        const response = await fetch(`${API_BASE_URL}/staff/tickets/validate`, {
            method: 'POST',
            headers: getAuthHeaders('staff'),
            body: JSON.stringify({ code })
        });
        return handleResponse(response);
    },

    checkTicket: async (code) => {
        const response = await fetch(`${API_BASE_URL}/staff/tickets/check`, {
            method: 'POST',
            headers: getAuthHeaders('staff'),
            body: JSON.stringify({ code })
        });
        return handleResponse(response);
    },

    markTicketUsed: async (ticketId) => {
        const response = await fetch(`${API_BASE_URL}/staff/tickets/mark-used`, {
            method: 'POST',
            headers: getAuthHeaders('staff'),
            body: JSON.stringify({ ticketId })
        });
        return handleResponse(response);
    },

    getActiveTickets: async () => {
        const response = await fetch(`${API_BASE_URL}/staff/tickets/active`, {
            headers: getAuthHeaders('staff')
        });
        return handleResponse(response);
    },

    // New ticket endpoints
    getTickets: async (filters = {}) => {
        const params = new URLSearchParams();
        if (filters.status) params.append('status', filters.status);
        if (filters.date) params.append('date', filters.date);
        if (filters.search) params.append('search', filters.search);
        
        const response = await fetch(`${API_BASE_URL}/staff/tickets?${params}`, {
            headers: getAuthHeaders('staff')
        });
        return handleResponse(response);
    },

    getTodayTickets: async () => {
        const response = await fetch(`${API_BASE_URL}/staff/tickets/today`, {
            headers: getAuthHeaders('staff')
        });
        return handleResponse(response);
    },

    getTicketById: async (id) => {
        const response = await fetch(`${API_BASE_URL}/staff/tickets/${id}`, {
            headers: getAuthHeaders('staff')
        });
        return handleResponse(response);
    },

    updateTicketStatus: async (id, statusData) => {
        const response = await fetch(`${API_BASE_URL}/staff/tickets/${id}/status`, {
            method: 'PUT',
            headers: getAuthHeaders('staff'),
            body: JSON.stringify(statusData)
        });
        return handleResponse(response);
    },

    // Events endpoints
    getEvents: async () => {
        const response = await fetch(`${API_BASE_URL}/staff/events`, {
            headers: getAuthHeaders('staff')
        });
        return handleResponse(response);
    },

    getUpcomingEvents: async () => {
        const response = await fetch(`${API_BASE_URL}/staff/events/upcoming`, {
            headers: getAuthHeaders('staff')
        });
        return handleResponse(response);
    },

    // Users endpoints (read-only for staff)
    getUsers: async () => {
        const response = await fetch(`${API_BASE_URL}/staff/users`, {
            headers: getAuthHeaders('staff')
        });
        return handleResponse(response);
    },

    getUserById: async (id) => {
        const response = await fetch(`${API_BASE_URL}/staff/users/${id}`, {
            headers: getAuthHeaders('staff')
        });
        return handleResponse(response);
    },

    // ====== CRUD Operations for Staff ======

    // Animals CRUD
    createAnimal: async (animalData) => {
        const response = await fetch(`${API_BASE_URL}/staff/animals`, {
            method: 'POST',
            headers: getAuthHeaders('staff'),
            body: JSON.stringify(animalData)
        });
        return handleResponse(response);
    },

    updateAnimal: async (id, animalData) => {
        const response = await fetch(`${API_BASE_URL}/staff/animals/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders('staff'),
            body: JSON.stringify(animalData)
        });
        return handleResponse(response);
    },

    deleteAnimal: async (id) => {
        const response = await fetch(`${API_BASE_URL}/staff/animals/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders('staff')
        });
        return handleResponse(response);
    },

    // Events CRUD
    createEvent: async (eventData) => {
        const response = await fetch(`${API_BASE_URL}/staff/events`, {
            method: 'POST',
            headers: getAuthHeaders('staff'),
            body: JSON.stringify(eventData)
        });
        return handleResponse(response);
    },

    updateEvent: async (id, eventData) => {
        const response = await fetch(`${API_BASE_URL}/staff/events/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders('staff'),
            body: JSON.stringify(eventData)
        });
        return handleResponse(response);
    },

    deleteEvent: async (id) => {
        const response = await fetch(`${API_BASE_URL}/staff/events/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders('staff')
        });
        return handleResponse(response);
    },

    // Users CRUD
    createUser: async (userData) => {
        const response = await fetch(`${API_BASE_URL}/staff/users`, {
            method: 'POST',
            headers: getAuthHeaders('staff'),
            body: JSON.stringify(userData)
        });
        return handleResponse(response);
    },

    updateUser: async (id, userData) => {
        const response = await fetch(`${API_BASE_URL}/staff/users/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders('staff'),
            body: JSON.stringify(userData)
        });
        return handleResponse(response);
    },

    deleteUser: async (id) => {
        const response = await fetch(`${API_BASE_URL}/staff/users/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders('staff')
        });
        return handleResponse(response);
    },

    // Dashboard stats
    getDashboardStats: async () => {
        const response = await fetch(`${API_BASE_URL}/staff/dashboard`, {
            headers: getAuthHeaders('staff')
        });
        return handleResponse(response);
    },

    getRecentTickets: async () => {
        const response = await fetch(`${API_BASE_URL}/staff/recent-tickets`, {
            headers: getAuthHeaders('staff')
        });
        return handleResponse(response);
    },

    // Notifications
    getNotifications: async () => {
        const response = await fetch(`${API_BASE_URL}/staff/notifications`, {
            headers: getAuthHeaders('staff')
        });
        return handleResponse(response);
    },

    markNotificationRead: async (id) => {
        const response = await fetch(`${API_BASE_URL}/staff/notifications/${id}/read`, {
            method: 'PUT',
            headers: getAuthHeaders('staff')
        });
        return handleResponse(response);
    },

    markAllNotificationsRead: async () => {
        const response = await fetch(`${API_BASE_URL}/staff/notifications/read-all`, {
            method: 'PUT',
            headers: getAuthHeaders('staff')
        });
        return handleResponse(response);
    }
};

export const userAPI = {
    getAnimals: async () => {
        const response = await fetch(`${API_BASE_URL}/users/animals`);
        return handleResponse(response);
    },

    getAnimal: async (id) => {
        const response = await fetch(`${API_BASE_URL}/users/animals/${id}`);
        return handleResponse(response);
    },

    getEvents: async () => {
        const response = await fetch(`${API_BASE_URL}/users/events`);
        return handleResponse(response);
    },

    purchaseTicket: async (ticketData) => {
        const response = await fetch(`${API_BASE_URL}/users/tickets/purchase`, {
            method: 'POST',
            headers: getAuthHeaders('user'),
            body: JSON.stringify(ticketData)
        });
        return handleResponse(response);
    },

    getMyTickets: async () => {
        const response = await fetch(`${API_BASE_URL}/users/tickets`, {
            headers: getAuthHeaders('user')
        });
        return handleResponse(response);
    },

    getProfile: async () => {
        const response = await fetch(`${API_BASE_URL}/users/profile`, {
            headers: getAuthHeaders('user')
        });
        return handleResponse(response);
    },

    updateProfile: async (profileData) => {
        const response = await fetch(`${API_BASE_URL}/users/profile`, {
            method: 'PUT',
            headers: getAuthHeaders('user'),
            body: JSON.stringify(profileData)
        });
        return handleResponse(response);
    },

    getSlotAvailability: async (date) => {
        const response = await fetch(`${API_BASE_URL}/users/tickets/availability?date=${encodeURIComponent(date)}`);
        return handleResponse(response);
    }
};

export const predictionAPI = {
    create: async (predictionData) => {
        const token = getToken('user');
        const response = await fetch(`${API_BASE_URL}/predictions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` })
            },
            body: JSON.stringify(predictionData)
        });
        return handleResponse(response);
    },

    getAll: async (page = 1, limit = 15) => {
        const response = await fetch(`${API_BASE_URL}/predictions?page=${page}&limit=${limit}`, {
            headers: getAuthHeaders('admin')
        });
        return handleResponse(response);
    },

    delete: async (ids) => {
        const response = await fetch(`${API_BASE_URL}/predictions`, {
            method: 'DELETE',
            headers: getAuthHeaders('admin'),
            body: JSON.stringify({ ids })
        });
        return handleResponse(response);
    },

    clearAll: async () => {
        const response = await fetch(`${API_BASE_URL}/predictions/clear`, {
            method: 'DELETE',
            headers: getAuthHeaders('admin')
        });
        return handleResponse(response);
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
        return `${BACKEND_BASE_URL}${profileImg}`;
    }
    
    // Legacy: if it's in the frontend's profile-img folder
    if (profileImg.startsWith('/profile-img/')) {
        return profileImg;
    }
    
    // Default: assume it's in the backend uploads
    return `${BACKEND_BASE_URL}/uploads/profile-images/${profileImg}`;
};

export { getToken, getAuthHeaders, API_BASE_URL, BACKEND_BASE_URL };
