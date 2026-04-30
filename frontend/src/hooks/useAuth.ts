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

export function useAuth() {
  const { setAuth, logout: storeLogout, user } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
    if (typeof window !== 'undefined') {
      setToken(tokenManager.getAccess());
    }
  }, []);

  const loginMutation = useMutation({
    mutationFn: (p: LoginPayload) => authService.login(p),
    onSuccess: (data) => {
      setAuth(data.user, data.access_token, data.refresh_token);
      setToken(data.access_token);
      toast.success(`Karibu, ${data.user.username}! 🌍`);
      router.push('/feed');
    },
    onError: (e) => toast.error(parseApiError(e)),
  });

  const registerMutation = useMutation({
    mutationFn: (p: RegisterPayload) => authService.register(p),
    onSuccess: () => {
      toast.success('Akaunti imeundwa! Tafadhali ingia. 🎉');
    },
    onError: (e) => toast.error(parseApiError(e)),
  });

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
    wsManager.disconnectAll();
    queryClient.clear();
    storeLogout();
    setToken(null);
    router.push('/login');
  };

  return {
    user: freshUser ?? user,
    isAuthenticated: isHydrated ? tokenManager.isAuthenticated() : false,
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    register: registerMutation.mutate,
    registerAsync: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    logout,
  };
}