'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAppStore } from '@/store/app.store';
import { useAuthStore } from '@/store/auth.store';
import { useAuthInit } from '@/hooks/useAuthInit';
import { wsManager, WS_URLS } from '@/core/websocket';
import api from '@/core/api/axios';
import { API } from '@/lib/constants';

// Cookie-based Authentication Provider
// Production-grade auth with React Rules of Hooks compliance
// Stable dependencies and no race conditions

const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // === ALL HOOKS MUST BE DECLARED FIRST ===
  const { setOnline } = useAppStore();
  const { isLoading, authStatus } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [websocketInitialized, setWebsocketInitialized] = useState(false);
  
  // Use the new auth initialization hook
  useAuthInit();
  
  // === STABLE CALLBACKS ===
  const handleWebSocketConnection = useCallback(() => {
    if (!websocketInitialized && typeof window !== 'undefined') {
      // WebSocket uses cookie-based authentication now
      // No localStorage token needed
      wsManager.connect('sos', WS_URLS.sos());
      setWebsocketInitialized(true);
    }
  }, [websocketInitialized]);

  const handleWebSocketDisconnection = useCallback(() => {
    if (websocketInitialized) {
      wsManager.disconnect('sos');
      setWebsocketInitialized(false);
    }
  }, [websocketInitialized]);

  // === WEBSOCKET MANAGEMENT ===
  useEffect(() => {
    if (isLoading) return;
    
    if (authStatus === 'authenticated') {
      handleWebSocketConnection();
    } else {
      handleWebSocketDisconnection();
    }
  }, [isLoading, authStatus, handleWebSocketConnection, handleWebSocketDisconnection]);

  // === ROUTE PROTECTION ===
  useEffect(() => {
    if (isLoading) return;
    
    const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));
    
    if (!isPublic && authStatus === 'unauthenticated') {
      router.push('/login');
    } else if (isPublic && authStatus === 'authenticated') {
      router.push('/feed');
    }
  }, [pathname, isLoading, authStatus, router]);

  // === NETWORK MONITORING ===
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnline]);

  // === CONDITIONAL RENDERING (AFTER ALL HOOKS) ===
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-kili-gold animate-spin" />
          <p className="text-text-muted text-sm font-body">Inapakia...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}