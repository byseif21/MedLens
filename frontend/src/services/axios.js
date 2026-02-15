import axios from 'axios';
import { getAccessToken, getCurrentUser, clearSession } from './auth';

const rawApiUrl = import.meta.env.VITE_API_URL;

// Check if we are in a production environment
const isProduction = !import.meta.env.DEV;

// Determine API Origin
// 1. Prefer environment variable if set
// 2. Fallback to current origin in production (assumes proxy)
// 3. Fallback to localhost:8000 in development
const API_ORIGIN = rawApiUrl || (isProduction ? window.location.origin : 'http://localhost:8000');

const apiClient = axios.create({
  baseURL: API_ORIGIN,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000,
});

// Custom factory method to create new axios instances
// Use this for external APIs (like direct communication with Smart Glasses)
// to avoid sending backend auth tokens to unrelated servers.
apiClient.create = (config = {}) => {
  return axios.create({
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 30000,
    ...config,
  });
};

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add user ID header for connection endpoints
    const user = getCurrentUser();
    if (user?.id) {
      config.headers['X-User-ID'] = user.id;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
let authErrorCallback = null;

export const registerAuthErrorCallback = (callback) => {
  authErrorCallback = callback;
};

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // check for 401 Unauthorized OR 403 Forbidden
    const status = error.response?.status;
    const isAuthError = status === 401 || status === 403;

    if (isAuthError && !error.config?.skipAuthRedirect) {
      if (authErrorCallback) {
        authErrorCallback();
      } else {
        // fallback
        clearSession();
        window.location.replace('/login');
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
