import axios from 'axios';

import { clearSession, getToken } from '../utils/session';

const api = axios.create({
  // Vite proxies /api to Spring Boot during local development. Set
  // VITE_API_BASE_URL only when the API is hosted at another origin.
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = getToken();

    if (token) {
      config.headers.Authorization = token.startsWith('Bearer ')
        ? token
        : `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url || '';
    const isAuthenticationRequest =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register/student') ||
      requestUrl.includes('/auth/student/password-recovery');

    if (status === 401 && !isAuthenticationRequest) {
      clearSession();

      if (window.location.pathname !== '/login') {
        window.location.replace('/login');
      }
    }

    if (!error.response) {
      console.error('PulseUp backend connection failed:', error.message);
    }

    return Promise.reject(error);
  },
);

export default api;
