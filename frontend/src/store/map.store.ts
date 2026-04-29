import { create } from 'zustand';
import { Tip, SOSAlert } from '@/types';

type MarkerType = 'tip' | 'experience' | 'sos';

interface MapState {
  showTips: boolean;
  showExperiences: boolean;
  showSOS: boolean;
  selectedId: number | null;
  selectedType: MarkerType | null;
  tips: Tip[];
  sosAlerts: SOSAlert[];
  toggleTips: () => void;
  toggleExperiences: () => void;
  toggleSOS: () => void;
  select: (id: number | null, type: MarkerType | null) => void;
  setTips: (tips: Tip[]) => void;
  setSosAlerts: (a: SOSAlert[]) => void;
}

export const useMapStore = create<MapState>((set) => ({
  showTips: true,
  showExperiences: true,
  showSOS: true,
  selectedId: null,
  selectedType: null,
  tips: [],
  sosAlerts: [],
  toggleTips: () => set((s) => ({ showTips: !s.showTips })),
  toggleExperiences: () => set((s) => ({ showExperiences: !s.showExperiences })),
  toggleSOS: () => set((s) => ({ showSOS: !s.showSOS })),
  select: (id, type) => set({ selectedId: id, selectedType: type }),
  setTips: (tips) => set({ tips }),
  setSosAlerts: (sosAlerts) => set({ sosAlerts }),
}));