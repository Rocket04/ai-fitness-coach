// js/domains/onboarding/useTourStore.ts
// State management for the guided tour feature

import { create } from 'zustand';

export interface TourState {
  isActive: boolean;
  currentStep: number;
  totalSteps: number;

  hasCompletedTour: boolean;
  completedSteps: number[];

  startTour: () => void;
  endTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  skipTour: () => void;
  markCompleted: () => void;
  resetTour: () => void;
}

const STORAGE_KEY = 'fitness-tour-state';

function loadTourState(): Partial<TourState> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Failed to load tour state:', e);
  }
  return {};
}

function saveTourState(state: { hasCompletedTour: boolean; completedSteps: number[] }) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save tour state:', e);
  }
}

export const useTourStore = create<TourState>((set, get) => {
  const savedState = loadTourState();

  return {
    isActive: false,
    currentStep: 0,
    totalSteps: 8,
    hasCompletedTour: savedState.hasCompletedTour ?? false,
    completedSteps: savedState.completedSteps ?? [],

    startTour: () => {
      set({ isActive: true, currentStep: 0 });
    },

    endTour: () => {
      set({ isActive: false });
      get().markCompleted();
    },

    nextStep: () => {
      const { currentStep, totalSteps } = get();
      if (currentStep < totalSteps - 1) {
        set({ currentStep: currentStep + 1 });
      } else {
        get().endTour();
      }
    },

    prevStep: () => {
      const { currentStep } = get();
      if (currentStep > 0) {
        set({ currentStep: currentStep - 1 });
      }
    },

    goToStep: (step: number) => {
      const { totalSteps } = get();
      if (step >= 0 && step < totalSteps) {
        set({ currentStep: step });
      }
    },

    skipTour: () => {
      set({ isActive: false });
    },

    markCompleted: () => {
      const { completedSteps } = get();
      const newState = {
        hasCompletedTour: true,
        completedSteps: [...new Set([...completedSteps, Date.now()])],
      };
      set(newState);
      saveTourState(newState);
    },

    resetTour: () => {
      const newState = {
        hasCompletedTour: false,
        completedSteps: [],
      };
      set({ ...newState, isActive: false, currentStep: 0 });
      saveTourState(newState);
    },
  };
});
