import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { env } from '@/config/env';
import { tokenManager } from '@/core/auth/tokenManager';
import { authEvents } from '@/core/auth/authEvents';
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

// Online/offline detection
let isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    isOnline = true;
    console.log('[Network] Connection restored');
  });
  
  window.addEventListener('offline', () => {
    isOnline = false;
    console.log('[Network] Connection lost');
  });
}

const api = axios.create({
  baseURL: env.API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenManager.getAccess();
    console.log('[TRACE][REQUEST]');
    console.log('URL:', config.url);
    console.log('METHOD:', config.method);
    console.log('TOKEN:', token);
    if (token) config.headers.Authorization = `Bearer ${token}`;
    console.log('AUTH HEADER:', config.headers.Authorization);
    return config;
  },
  (err) => Promise.reject(err)
);

let refreshing = false;
let queue: Array<{ resolve: (t: string) => void; reject: (e: unknown) => void }> = [];

const flush = (err: unknown, token: string | null) => {
  queue.forEach((p) => (err ? p.reject(err) : p.resolve(token!)));
  queue = [];
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
      console.log('[TRACE][401 DETECTED]', error.config?.url);
      if (refreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject });
        }).then((t) => {
          orig.headers.Authorization = `Bearer ${t}`;
          return api(orig);
        });
      }
      orig._retry = true;
      refreshing = true;
      const refresh = tokenManager.getRefresh();
      if (!refresh) {
        tokenManager.clearTokens();
        Router.replace('/login');
        return Promise.reject(error);
      }
      try {
        const { data } = await api.post('/auth/token/refresh/', { refresh: refresh });
        tokenManager.setTokens(data.access, data.refresh);
        authEvents.emit('AUTH_REFRESH');
        flush(null, data.access);
        orig.headers.Authorization = `Bearer ${data.access}`;
        return api(orig);
      } catch (e) {
        flush(e, null);
        tokenManager.clearTokens();
        Router.replace('/login');
        return Promise.reject(e);
      } finally {
        refreshing = false;
      }
    }
    
    // Network resilience: retry logic for retryable errors
    if (isRetryableError(error) && !orig._retry) {
      orig._retry = true;
      orig._retryCount = (orig._retryCount || 0) + 1;
      
      if (orig._retryCount <= MAX_RETRIES) {
        const delay = getRetryDelay(orig._retryCount - 1);
        console.log(`[Network] Retry attempt ${orig._retryCount}/${MAX_RETRIES} after ${Math.round(delay)}ms`);
        
        return new Promise((resolve) => {
          setTimeout(() => resolve(api(orig)), delay);
        });
      } else {
        console.error('[Network] Max retries reached for:', error.config?.url);
      }
    }
    
    // Check offline status
    if (!isOnline) {
      console.error('[Network] Request failed - offline mode');
      // You could queue requests here for later
    }
    
    return Promise.reject(error);
  }
);

// Subscribe to token updates to update default Authorization header
authEvents.on('AUTH_TOKEN_UPDATED', () => {
  const token = tokenManager.getAccess();
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
});

// Handle proactive refresh events
authEvents.on('AUTH_REFRESH', async () => {
  const refresh = tokenManager.getRefresh();
  if (!refresh || refreshing) return;

  console.log('[AXIOS] Handling AUTH_REFRESH event');
  refreshing = true;

  try {
    const { data } = await api.post('/auth/token/refresh/', { refresh });
    tokenManager.setTokens(data.access, data.refresh);
    console.log('[AXIOS] Proactive refresh successful');
  } catch (e) {
    console.error('[AXIOS] Proactive refresh failed', e);
    tokenManager.clearTokens();
    Router.replace('/login');
  } finally {
    refreshing = false;
  }
});

export default api;