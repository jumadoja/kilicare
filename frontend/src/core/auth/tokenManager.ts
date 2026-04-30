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

const isValidJWT = (token: string | null): boolean => {
  if (!token) return false;
  const parts = token.split('.');
  return parts.length === 3;
};

const safeGetItem = (key: string): string | null => {
  if (!isBrowser) return null;
  try {
    return window.localStorage.getItem(key);
  } catch (e) {
    console.error('[Storage] Failed to get item:', key, e);
    return null;
  }
};

const safeSetItem = (key: string, value: string): void => {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(key, value);
  } catch (e) {
    console.error('[Storage] Failed to set item:', key, e);
  }
};

const safeRemoveItem = (key: string): void => {
  if (!isBrowser) return;
  try {
    window.localStorage.removeItem(key);
  } catch (e) {
    console.error('[Storage] Failed to remove item:', key, e);
  }
};

let refreshTimer: ReturnType<typeof setTimeout> | null = null;
let isClearing = false; // Guard to prevent repeated clearing

export const tokenManager = {
  setTokens(access: string, refresh: string) {
    if (!isBrowser) return;
    console.log('[TOKEN SET][ACCESS]', access);
    console.log('[TOKEN SET][REFRESH]', refresh);
    safeSetItem(K.ACCESS, access);
    safeSetItem(K.REFRESH, refresh);
    isClearing = false; // Reset guard when new tokens are set
    authEvents.emit('AUTH_TOKEN_UPDATED');
    authEvents.emit('AUTH_LOGIN');
    tokenManager.scheduleProactiveRefresh();
  },

  getAccess: (): string | null => {
    if (!isBrowser) return null;
    const token = safeGetItem(K.ACCESS);
    if (!isValidJWT(token) || isTokenExpired(token)) {
      if (!isClearing) {
        console.log('[TOKEN] invalid/expired → clearing');
        tokenManager.clearTokens();
      }
      return null;
    }
    return token;
  },

  getRefresh: (): string | null => {
    if (!isBrowser) return null;
    return safeGetItem(K.REFRESH);
  },

  clearTokens() {
    if (!isBrowser) return;
    if (isClearing) return; // Prevent repeated clearing
    isClearing = true;
    console.log('[TOKEN CLEARED]');
    Object.values(K).forEach((k) => safeRemoveItem(k));
    authEvents.emit('AUTH_LOGOUT');
    if (refreshTimer) {
      clearTimeout(refreshTimer);
      refreshTimer = null;
    }
  },

  isAuthenticated: (): boolean => {
    if (!isBrowser) return false;
    const token = safeGetItem(K.ACCESS);
    return !!token && isValidJWT(token) && !isTokenExpired(token);
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

    const token = safeGetItem(K.ACCESS);
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