import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';
import { wsManager } from '@/core/websocket';
import { tokenManager } from '@/core/auth/tokenManager';
import { parseApiError } from '@/core/errors';
import { LoginPayload, RegisterPayload } from '@/types';

export function useAuth() {
  const { setAuth, logout: storeLogout, user } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: (p: LoginPayload) => authService.login(p),
    onSuccess: (data) => {
      setAuth(data.user, data.access_token, data.refresh_token);
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

  const token = tokenManager.getAccess();
  const { data: freshUser } = useQuery({
    queryKey: ['me'],
    queryFn: authService.getMe,
    enabled: !!token,
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
    router.push('/login');
  };

  return {
    user: freshUser ?? user,
    isAuthenticated: tokenManager.isAuthenticated(),
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    register: registerMutation.mutate,
    registerAsync: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    logout,
  };
}