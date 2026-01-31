import axios from 'axios';

const API_URL = '/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const authService = {
    async register(email, password, name) {
        const response = await api.post('/auth/register', { email, password, name });
        return response.data;
    },

    async login(email, password) {
        const response = await api.post('/auth/login', { email, password });
        return response.data;
    },

    async getMe() {
        const response = await api.get('/auth/me');
        return response.data;
    }
};

export const sessionService = {
    async createSession(name, isPublic = false) {
        const response = await api.post('/sessions', { name, isPublic });
        return response.data;
    },

    async getSession(sessionId) {
        const response = await api.get(`/sessions/${sessionId}`);
        return response.data;
    },

    async getSessionByInvite(inviteCode) {
        const response = await api.get(`/sessions/invite/${inviteCode}`);
        return response.data;
    },

    async getSessionHistory(sessionId) {
        const response = await api.get(`/sessions/${sessionId}/history`);
        return response.data;
    },

    async getMySessions() {
        const response = await api.get('/sessions/my-sessions');
        return response.data;
    },

    async deleteSession(sessionId) {
        await api.delete(`/sessions/${sessionId}`);
    }
};

export default api;
