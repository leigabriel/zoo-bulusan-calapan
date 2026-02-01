const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
    const data = await response.json();
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

    getTickets: async () => {
        const response = await fetch(`${API_BASE_URL}/admin/tickets`, {
            headers: getAuthHeaders('admin')
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

    getActiveTickets: async () => {
        const response = await fetch(`${API_BASE_URL}/staff/tickets/active`, {
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

export { getToken, getAuthHeaders, API_BASE_URL };
