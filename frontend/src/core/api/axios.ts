import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { env } from '@/config/env';
import { tokenManager } from '@/core/auth/tokenManager';
import { authEvents } from '@/core/auth/authEvents';
import { API } from '@/lib/constants';
import Router from 'next/router';

// Network resilience configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const RETRY_STATUS_CODES = [408, 429, 500, 502, 503, 504];

// Exponential backoff with jitter
function getRetryDelay(attempt: number): number {
  const baseDelay = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
  const jitter = Math.random() * 0.3 * baseDelay; // Add 30% jitter
  return baseDelay + jitter;
}

// Check if error is retryable
function isRetryableError(error: AxiosError): boolean {
  if (!error.response) {
    // Network errors (no response) are retryable
    return true;
  }
  
  const status = error.response.status;
  return RETRY_STATUS_CODES.includes(status);
}

// Get CSRF token from cookie
function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  
  const getCookie = (name: string): string | null => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
  };
  
  return getCookie('csrftoken') || getCookie('csrf_token');
}

// Online/offline detection
let isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    isOnline = true;
  });
  
  window.addEventListener('offline', () => {
    isOnline = false;
  });
}

const api = axios.create({
  baseURL: env.API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
  withCredentials: true,
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenManager.getAccess();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    
    // Add CSRF token to non-GET requests
    if (config.method !== 'get') {
      const csrfToken = getCsrfToken();
      if (csrfToken) {
        config.headers['X-CSRFToken'] = csrfToken;
      }
    }
    
    return config;
  },
  (err) => Promise.reject(err)
);

let refreshPromise: Promise<string | null> | null = null;
let queue: Array<{ resolve: (t: string) => void; reject: (e: unknown) => void }> = [];

const flush = (err: unknown, token: string | null) => {
  queue.forEach((p) => (err ? p.reject(err) : p.resolve(token!)));
  queue = [];
};

const performRefresh = async (): Promise<string> => {
  const refresh = tokenManager.getRefresh();
  if (!refresh) {
    tokenManager.clearTokens();
    Router.replace('/login');
    throw new Error('No refresh token');
  }

  try {
    const { data } = await api.post(API.AUTH.REFRESH, { refresh: refresh });
    tokenManager.setTokens(data.access, data.refresh);
    authEvents.emit('AUTH_REFRESH');
    return data.access;
  } catch (e) {
    tokenManager.clearTokens();
    Router.replace('/login');
    throw e;
  }
};

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const orig = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
      _retryCount?: number;
    };

    // Handle 401 unauthorized (token refresh)
    if (error.response?.status === 401 && !orig._retry) {
      
      // Use promise-based locking instead of boolean flag
      if (refreshPromise) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject });
        }).then((t) => {
          orig.headers.Authorization = `Bearer ${t}`;
          return api(orig);
        });
      }

      orig._retry = true;
      refreshPromise = performRefresh();

      try {
        const newToken = await refreshPromise;
        flush(null, newToken);
        orig.headers.Authorization = `Bearer ${newToken}`;
        return api(orig);
      } catch (e) {
        flush(e, null);
        return Promise.reject(e);
      } finally {
        refreshPromise = null;
      }
    }
    
    // Network resilience: retry logic for retryable errors
    if (isRetryableError(error) && !orig._retry) {
      orig._retry = true;
      orig._retryCount = (orig._retryCount || 0) + 1;
      
      if (orig._retryCount <= MAX_RETRIES) {
        const delay = getRetryDelay(orig._retryCount - 1);
        
        return new Promise((resolve) => {
          setTimeout(() => resolve(api(orig)), delay);
        });
      }
    }
    
    // Check offline status
    if (!isOnline) {
      // You could queue requests here for later
    }
    
    return Promise.reject(error);
  }
);

// Subscribe to token updates to update default Authorization header
const unsubscribeTokenUpdated = authEvents.on('AUTH_TOKEN_UPDATED', () => {
  const token = tokenManager.getAccess();
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
});

// Handle proactive refresh events
const unsubscribeAuthRefresh = authEvents.on('AUTH_REFRESH', async () => {
  const refresh = tokenManager.getRefresh();
  if (!refresh || refreshPromise) return;

  refreshPromise = performRefresh();

  try {
    await refreshPromise;
  } catch (e) {
    // Silent fail - token refresh will be handled by 401 interceptor
  } finally {
    refreshPromise = null;
  }
});

// Export cleanup function for module unload (if needed)
export const cleanupAxiosAuthListeners = () => {
  unsubscribeTokenUpdated();
  unsubscribeAuthRefresh();
};

export default api;