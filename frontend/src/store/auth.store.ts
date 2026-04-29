import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';
import { tokenManager } from '@/core/auth/tokenManager';

interface AuthState {
  user: User | null;
  setUser: (user: User | null) => void;
  setAuth: (user: User, access: string, refresh: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      setAuth: (user, access, refresh) => {
        tokenManager.setTokens(access, refresh);
        set({ user });
      },
      logout: () => {
        tokenManager.clearTokens();
        set({ user: null });
      },
    }),
    {
      name: 'kili-auth',
      partialize: (s) => ({ user: s.user }),
    }
  )
);