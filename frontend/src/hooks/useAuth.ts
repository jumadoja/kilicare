import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';
import { wsManager } from '@/core/websocket';
import { tokenManager } from '@/core/auth/tokenManager';
import { parseApiError } from '@/core/errors';
import { LoginPayload, RegisterPayload } from '@/types';
import { useState, useEffect } from 'react';
import { authEvents } from '@/core/auth/authEvents';

export function useAuth() {
  const { setUser, user } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Listen to token updates to keep state in sync
  useEffect(() => {
    if (!isHydrated) return;

    const handleTokenUpdate = () => {
      // Token state is now derived from tokenManager, no local state needed
    };

    const unsubscribe1 = authEvents.on('AUTH_TOKEN_UPDATED', handleTokenUpdate);
    const unsubscribe2 = authEvents.on('AUTH_REFRESH', handleTokenUpdate);

    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  }, [isHydrated]);

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (res) => {
      console.log("FRONTEND STEP 1: Login success callback called");
      console.log("FRONTEND STEP 2: Full response object:", res);
      console.log("FRONTEND STEP 3: res.data:", res.data);
      const data = res.data;
      console.log("FRONTEND STEP 4: Extracted data:", data);
      console.log("FRONTEND STEP 5: data.access_token:", data?.access_token);
      console.log("FRONTEND STEP 6: data.refresh_token:", data?.refresh_token);
      console.log("FRONTEND STEP 7: data.user:", data?.user);
      tokenManager.setTokens(data.access_token, data.refresh_token);
      setUser(data.user);
      toast.success('Karibu! 🎉');
    },
    onError: (e: any) => {
      console.log("FRONTEND ERROR STEP 1: Login error callback called");
      console.log("FRONTEND ERROR STEP 2: Full error object:", e);
      console.log("FRONTEND ERROR STEP 3: e.response:", e.response);
      console.log("FRONTEND ERROR STEP 4: e.response?.data:", e.response?.data);
      if (e.response?.status === 423) {
        toast.error("Akaunti imefungwa kwa muda. Jaribu tena baada ya muda.");
      } else {
        toast.error(parseApiError(e));
      }
    },
  });

  const registerMutation = useMutation({
    mutationFn: authService.register,
    onError: (e: any) => {
      console.log("HOOK ERROR:", e.response?.data);
    },
    // UI side effects (toasts, redirects) handled by pages
    // Hook only returns state: isRegistering, error
  });

  // Token is now derived from tokenManager directly
  const token = isHydrated ? tokenManager.getAccess() : null;

  const { data: freshUser } = useQuery({
    queryKey: ['me'],
    queryFn: authService.getMe,
    enabled: !!token && isHydrated,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const logout = async () => {
    try {
      const refresh = tokenManager.getRefresh();
      if (refresh) await authService.logout(refresh);
    } catch { /* ignore */ }
    // wsManager.disconnectAll() is called via AUTH_LOGOUT event listener in websocket manager
    // Removing direct call here to prevent duplicate disconnection
    tokenManager.clearTokens();
    setUser(null);
    queryClient.clear();
    router.push('/login');
  };

  return {
    user: freshUser ?? user,
    token,
    isAuthenticated: isHydrated ? tokenManager.isAuthenticated() : false,
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    register: registerMutation.mutate,
    registerAsync: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    logout,
  };
}