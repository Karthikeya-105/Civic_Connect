import axios from 'axios';

// Use env var if set, otherwise detect prod vs dev automatically
const BASE_URL = import.meta.env.VITE_API_URL ||
    (import.meta.env.PROD
        ? 'https://civic-connect-api-oumt.onrender.com'
        : 'http://localhost:10000');

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 30000,
});

// Attach token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Handle 401
api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(err);
    }
);

export default api;
