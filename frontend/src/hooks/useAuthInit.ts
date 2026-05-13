import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { authService } from '@/services/auth.service';

/**
 * Auth initialization hook - restores user session on app load
 * Uses cookie-based authentication - NO localStorage
 */
export function useAuthInit() {
  const { setUser, setAuthStatus, setLoading, authStatus, isLoading } = useAuthStore();
  const hasInitialized = useRef(false);

  useEffect(() => {
    const initAuth = async () => {
      // Prevent multiple initializations using useRef guard
      if (hasInitialized.current) return;
      hasInitialized.current = true;

      try {
        // Cookie-based authentication - check session via /auth/me/
        const user = await authService.getMe();
        if (user) {
          setUser(user);
          setAuthStatus('authenticated');
        } else {
          setUser(null);
          setAuthStatus('unauthenticated');
        }
      } catch (error) {
        // Network/server errors only — 401 is handled inside getMe() as null (no throw).
        console.warn('Auth initialization failed:', error);
        setUser(null);
        setAuthStatus('unauthenticated');
      } finally {
        // Always stop loading, regardless of outcome
        setLoading(false);
      }
    };

    initAuth();
  }, [setUser, setAuthStatus, setLoading]);

  return { isLoading, authStatus };
}
