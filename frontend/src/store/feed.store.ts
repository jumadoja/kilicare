import { create } from 'zustand';
import { Moment } from '@/types';

interface FeedState {
  moments: Moment[];
  activeIndex: number;
  isMuted: boolean;
  setMoments: (m: Moment[]) => void;
  appendMoments: (m: Moment[]) => void;
  setActiveIndex: (i: number) => void;
  toggleMute: () => void;
  updateMoment: (id: number, updates: Partial<Moment>) => void;
}

export const useFeedStore = create<FeedState>((set) => ({
  moments: [],
  activeIndex: 0,
  isMuted: true,
  setMoments: (moments) => set({ moments }),
  appendMoments: (m) => set((s) => ({ moments: [...s.moments, ...m] })),
  setActiveIndex: (activeIndex) => set({ activeIndex }),
  toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),
  updateMoment: (id, updates) =>
    set((s) => ({ moments: s.moments.map((m) => m.id === id ? { ...m, ...updates } : m) })),
}));