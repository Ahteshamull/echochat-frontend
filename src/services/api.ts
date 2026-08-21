import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://frontend-task-chatapp.onrender.com/api';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject Bearer token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('chat_app_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to handle authentication errors (like expired tokens)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('chat_app_token');
        localStorage.removeItem('chat_app_user');
        // Redirect to login page if we are on a client route
        if (window.location.pathname.startsWith('/chat')) {
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);
