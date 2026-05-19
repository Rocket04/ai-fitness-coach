// js/stores/useUIStore.ts
// Zustand store for UI state

import { create } from 'zustand';
import type { ToastType } from '../core/types.js';

interface UIState {
  activeTab: number;
  showReadiness: boolean;
  manualOverride: 'green' | 'yellow' | 'red' | 'unknown';
  dataLoaded: boolean;
  // Toast notification
  toast: {
    message: string;
    type: ToastType;
    visible: boolean;
  };
  // Actions
  setActiveTab: (value: number) => void;
  setShowReadiness: (value: boolean) => void;
  setManualOverride: (value: 'green' | 'yellow' | 'red' | 'unknown') => void;
  setDataLoaded: (value: boolean) => void;
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  hideToast: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeTab: 0,
  showReadiness: false,
  manualOverride: 'unknown',
  dataLoaded: false,
  toast: {
    message: '',
    type: 'success',
    visible: false,
  },
  
  setActiveTab: (activeTab) => set({ activeTab }),
  setShowReadiness: (showReadiness) => set({ showReadiness }),
  setManualOverride: (manualOverride) => set({ manualOverride }),
  setDataLoaded: (dataLoaded) => set({ dataLoaded }),
  
  showToast: (message, type = 'success', duration = 2000) => {
    set({ toast: { message, type, visible: true } });
    setTimeout(() => set({ toast: { message: '', type: 'success', visible: false } }), duration);
  },
  
  hideToast: () => set({ toast: { message: '', type: 'success', visible: false } }),
}));
