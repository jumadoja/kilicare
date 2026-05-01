'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppStore } from '@/store/app.store';
import { wsManager, WS_URLS } from '@/core/websocket';
import { tokenManager } from '@/core/auth/tokenManager';
import { initAxiosAuthListeners, cleanupAxiosAuthListeners } from '@/core/api/axios';
import { authEvents } from '@/core/auth/authEvents';

const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setOnline } = useAppStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Initialize axios auth listeners and token refresh scheduling
  useEffect(() => {
    if (!isHydrated) return;
    
    // Initialize axios listeners
    initAxiosAuthListeners();
    
    // Schedule proactive token refresh
    tokenManager.scheduleProactiveRefresh();
    
    // Handle proactive refresh events
    const unsubscribeRefresh = authEvents.on('AUTH_REFRESH', async () => {
      // Refresh logic is handled by axios interceptor
    });

    return () => {
      cleanupAxiosAuthListeners();
      unsubscribeRefresh();
    };
  }, [isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    const token = tokenManager.getAccess();
    const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));
    if (!token && !isPublic) router.replace('/login');
    if (token && isPublic) router.replace('/feed');
  }, [pathname, router, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    const token = tokenManager.getAccess();
    if (token) {
      wsManager.connect('sos', WS_URLS.sos());
    } else {
      wsManager.disconnectAll();
    }
  }, [isHydrated]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, [setOnline]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'kili_access_token' || e.key === 'kili_refresh_token') {
        const token = tokenManager.getAccess();
        if (!token) {
          router.replace('/login');
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [router]);

  return <>{children}</>;
}