import { create } from 'zustand';
import { User } from '@/types';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  user: User | null;
  authStatus: AuthStatus;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setAuthStatus: (status: AuthStatus) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  authStatus: 'loading', // Start as loading to prevent premature redirects
  isLoading: true, // Start as loading during auth initialization
  setUser: (user) => {
    const currentStatus = get().authStatus;
    set({ 
      user, 
      authStatus: user ? 'authenticated' : 'unauthenticated',
      isLoading: false
    });
  },
  setAuthStatus: (status) => {
    // Only allow status change if it's different
    const currentStatus = get().authStatus;
    if (currentStatus !== status) {
      set({ authStatus: status, isLoading: false });
    }
  },
  setLoading: (loading) => {
    set({ isLoading: loading });
  },
  reset: () => {
    set({ 
      user: null, 
      authStatus: 'unauthenticated',
      isLoading: false
    });
  },
}));