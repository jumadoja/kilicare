import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { env } from '@/config/env';
import { API } from '@/lib/constants';

// Cookie-based authentication - NO localStorage usage
// Tokens are stored in httpOnly cookies by the backend
// Frontend relies on cookies automatically sent by browser

const api = axios.create({
  baseURL: env.API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
  withCredentials: true, // CRITICAL: Enable cookie sending
});

// Request interceptor - cookies are sent automatically by browser
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // No manual token attachment - cookies handle authentication
    return config;
  },
  (err) => Promise.reject(err)
);

// Refresh flow control
let refreshPromise: Promise<void> | null = null;
let isRefreshing = false;

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    const url = originalRequest.url ?? '';
    const isRefreshCall =
      url.includes('token/refresh') || url.includes('/auth/token/refresh');

    // Handle 401 unauthorized - attempt refresh ONCE (never recurse from refresh endpoint)
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isRefreshing &&
      !isRefreshCall
    ) {
      originalRequest._retry = true;
      isRefreshing = true;

      // If refresh is already in progress, wait for it
      if (refreshPromise) {
        await refreshPromise;
        isRefreshing = false;
        return api(originalRequest);
      }

      // Start token refresh using cookies
      refreshPromise = (async () => {
        try {
          if (typeof window === 'undefined') {
            throw new Error('SSR - cannot refresh token');
          }
          
          // Backend handles refresh via cookies automatically
          // No need to send refresh token manually
          const response = await api.post(API.AUTH.REFRESH, {}, {
            headers: { 'Content-Type': 'application/json' }
          });
          
          // New access token is set in httpOnly cookie by backend
          // No frontend storage needed
        } catch (refreshError) {
          // Refresh failed — only redirect away from public auth pages (avoid loops / noise on /login).
          if (typeof window !== 'undefined') {
            const path = window.location.pathname;
            const onPublicAuth =
              path.startsWith('/login') ||
              path.startsWith('/register') ||
              path.startsWith('/forgot-password') ||
              path.startsWith('/reset-password');
            if (!onPublicAuth) {
              window.location.href = '/login';
            }
          }
          throw refreshError;
        } finally {
          refreshPromise = null;
          isRefreshing = false;
        }
      })();

      try {
        await refreshPromise;
        return api(originalRequest);
      } catch {
        // Retry failed, error will propagate
        throw error;
      }
    }

    return Promise.reject(error);
  }
);

export default api;