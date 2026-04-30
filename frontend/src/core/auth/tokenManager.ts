import { authEvents } from './authEvents';

const K = {
  ACCESS: 'kili_access_token',
  REFRESH: 'kili_refresh_token',
} as const;

const isBrowser = typeof window !== 'undefined';

const isTokenExpired = (token: string | null): boolean => {
  if (!token) return true;
  try {
    const payload = token.split('.')[1];
    if (!payload) return true;
    const decoded = JSON.parse(atob(payload));
    return decoded.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

const getTokenExpiry = (token: string | null): number | null => {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const decoded = JSON.parse(atob(payload));
    return decoded.exp * 1000;
  } catch {
    return null;
  }
};

let refreshTimer: ReturnType<typeof setTimeout> | null = null;
let isClearing = false; // Guard to prevent repeated clearing

export const tokenManager = {
  setTokens(access: string, refresh: string) {
    if (!isBrowser) return;
    console.log('[TOKEN SET][ACCESS]', access);
    console.log('[TOKEN SET][REFRESH]', refresh);
    window.localStorage.setItem(K.ACCESS, access);
    window.localStorage.setItem(K.REFRESH, refresh);
    isClearing = false; // Reset guard when new tokens are set
    authEvents.emit('AUTH_TOKEN_UPDATED');
    tokenManager.scheduleProactiveRefresh();
  },
  getAccess: (): string | null => {
    if (!isBrowser) return null;
    const token = window.localStorage.getItem(K.ACCESS);
    if (isTokenExpired(token)) {
      // Only clear if not already clearing (prevent infinite loop)
      if (!isClearing) {
        console.log('[TOKEN] expired → clearing');
        tokenManager.clearTokens();
      }
      return null;
    }
    return token;
  },
  getRefresh: (): string | null =>
    isBrowser ? window.localStorage.getItem(K.REFRESH) : null,
  clearTokens() {
    if (!isBrowser) return;
    if (isClearing) return; // Prevent repeated clearing
    isClearing = true;
    console.log('[TOKEN CLEARED]');
    Object.values(K).forEach((k) => window.localStorage.removeItem(k));
    authEvents.emit('AUTH_LOGOUT');
    if (refreshTimer) {
      clearTimeout(refreshTimer);
      refreshTimer = null;
    }
  },
  isAuthenticated: (): boolean => {
    if (!isBrowser) return false;
    const token = window.localStorage.getItem(K.ACCESS);
    return !!token && !isTokenExpired(token);
  },
  /**
   * Schedule proactive token refresh 30 seconds before expiry
   */
  scheduleProactiveRefresh() {
    if (!isBrowser) return;
    if (refreshTimer) {
      clearTimeout(refreshTimer);
      refreshTimer = null;
    }

    const token = window.localStorage.getItem(K.ACCESS);
    const expiry = getTokenExpiry(token);
    if (!expiry) return;

    const now = Date.now();
    const timeUntilExpiry = expiry - now;
    const refreshBuffer = 30_000; // 30 seconds before expiry

    if (timeUntilExpiry <= refreshBuffer) {
      // Token expires soon, trigger refresh immediately
      console.log('[TOKEN] expires soon → triggering refresh');
      authEvents.emit('AUTH_REFRESH');
    } else {
      // Schedule refresh before expiry
      const delay = timeUntilExpiry - refreshBuffer;
      console.log(`[TOKEN] scheduling proactive refresh in ${Math.round(delay / 1000)}s`);
      refreshTimer = setTimeout(() => {
        console.log('[TOKEN] proactive refresh triggered');
        authEvents.emit('AUTH_REFRESH');
        refreshTimer = null;
      }, delay);
    }
  },
};