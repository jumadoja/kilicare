import { create } from 'zustand';

interface AppState {
  isOnline: boolean;
  locale: 'en' | 'sw';
  sidebarOpen: boolean;
  setOnline: (v: boolean) => void;
  setLocale: (l: 'en' | 'sw') => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  isOnline: true,
  locale: 'en',
  sidebarOpen: false,
  setOnline: (v) => set({ isOnline: v }),
  setLocale: (l) => set({ locale: l }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}));