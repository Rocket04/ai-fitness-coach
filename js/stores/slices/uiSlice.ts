// js/stores/slices/uiSlice.ts
// UI state + simple setters

import type { ManualStatus, ToastType, WeeklyTemplate } from '../../core/types.js';

export interface UiSlice {
  activeTab: number;
  showReadiness: boolean;
  showSettings: boolean;
  showResetConfirm: boolean;
  editStartDate: string;
  editTrainDays: number[];
  manualOverride: ManualStatus;
  toast: { message: string; type: ToastType; visible: boolean };
  weeklyTemplate: WeeklyTemplate;
  setActiveTab: (v: number) => void;
  setShowReadiness: (v: boolean) => void;
  setShowSettings: (v: boolean) => void;
  setShowResetConfirm: (v: boolean) => void;
  setEditStartDate: (v: string) => void;
  setEditTrainDays: (v: number[]) => void;
}

export function createUiSlice(set: (partial: Record<string, unknown>) => void, _get: () => any): UiSlice {
  return {
    activeTab: 0,
    showReadiness: false,
    showSettings: false,
    showResetConfirm: false,
    editStartDate: '',
    editTrainDays: [1, 2, 3, 4, 5, 6],
    manualOverride: 'unknown' as ManualStatus,
    toast: { message: '', type: 'success' as ToastType, visible: false },
    weeklyTemplate: {
      days: ['calisthenics', 'walking', 'stretching', 'calisthenics', 'walking', 'stretching', null] as (string | null)[],
      sportOrder: ['calisthenics', 'walking', 'stretching'] as string[],
    },

    setActiveTab: (v: number) => set({ activeTab: v }),
    setShowReadiness: (v: boolean) => set({ showReadiness: v }),
    setShowSettings: (v: boolean) => set({ showSettings: v }),
    setShowResetConfirm: (v: boolean) => set({ showResetConfirm: v }),
    setEditStartDate: (v: string) => set({ editStartDate: v }),
    setEditTrainDays: (v: number[]) => set({ editTrainDays: v }),
  };
}
