// js/stores/useSettingsStore.ts
// Zustand store for application settings

import { create } from 'zustand';

interface SettingsState {
  startDate: string | null;
  trainDays: number[];
  // Settings modal state
  showSettings: boolean;
  editStartDate: string;
  editTrainDays: number[];
  // Actions
  setStartDate: (value: string | null) => void;
  setTrainDays: (value: number[]) => void;
  setShowSettings: (value: boolean) => void;
  setEditStartDate: (value: string) => void;
  setEditTrainDays: (value: number[]) => void;
  toggleDay: (day: number) => void;
  openSettings: () => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  startDate: null,
  trainDays: [1, 3, 5],
  showSettings: false,
  editStartDate: '',
  editTrainDays: [1, 3, 5],
  
  setStartDate: (startDate) => set({ startDate }),
  setTrainDays: (trainDays) => set({ trainDays }),
  setShowSettings: (showSettings) => set({ showSettings }),
  setEditStartDate: (editStartDate) => set({ editStartDate }),
  setEditTrainDays: (editTrainDays) => set({ editTrainDays }),
  
  toggleDay: (day) => {
    const { editTrainDays } = get();
    set({
      editTrainDays: editTrainDays.includes(day)
        ? editTrainDays.filter(d => d !== day)
        : [...editTrainDays, day].sort((a, b) => a - b)
    });
  },
  
  openSettings: () => {
    const { startDate, trainDays } = get();
    set({
      editStartDate: startDate || '',
      editTrainDays: trainDays,
      showSettings: true,
    });
  },
}));
