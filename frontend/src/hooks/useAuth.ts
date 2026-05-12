import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';
import { wsManager } from '@/core/websocket';
import { parseApiError } from '@/core/errors';
import { LoginPayload, RegisterPayload, User } from '@/types';

export function useAuth() {
  const { setUser, user } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (data: { user: User }) => {
      // Use user data directly from login response (no additional API call needed)
      setUser(data.user);
      toast.success('Karibu! kwenye kilicare app');
      router.push('/feed');
    },
    onError: (e: any) => {
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
      // Error handling done by calling component
    },
    // UI side effects (toasts, redirects) handled by pages
    // Hook only returns state: isRegistering, error
  });

  const logout = async () => {
    try {
      // Call logout API if available
      await authService.logout();
    } catch { 
      // Ignore API errors - continue with local cleanup
    }
    
    // Complete local cleanup
    setUser(null);
    
    // Clear all query cache
    queryClient.clear();
    
    // Disconnect WebSocket connections
    if (typeof window !== 'undefined') {
      wsManager.disconnectAll();
    }
    
    // Safe redirect without causing hooks order issues
    router.push('/login');
  };

  return {
    user,
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    register: registerMutation.mutate,
    registerAsync: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    logout,
  };
}