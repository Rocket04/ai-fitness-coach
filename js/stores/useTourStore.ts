// js/stores/useTourStore.ts
// State management for the guided tour feature

import { create } from 'zustand';

export interface TourState {
  // Tour visibility
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
  
  // Completion tracking
  hasCompletedTour: boolean;
  completedSteps: number[];
  
  // Actions
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

// Load initial state from localStorage
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

// Save state to localStorage
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
    // Initial state
    isActive: false,
    currentStep: 0,
    totalSteps: 8,
    hasCompletedTour: savedState.hasCompletedTour ?? false,
    completedSteps: savedState.completedSteps ?? [],
    
    // Start the tour
    startTour: () => {
      set({ isActive: true, currentStep: 0 });
    },
    
    // End the tour
    endTour: () => {
      set({ isActive: false });
      get().markCompleted();
    },
    
    // Go to next step
    nextStep: () => {
      const { currentStep, totalSteps } = get();
      if (currentStep < totalSteps - 1) {
        set({ currentStep: currentStep + 1 });
      } else {
        get().endTour();
      }
    },
    
    // Go to previous step
    prevStep: () => {
      const { currentStep } = get();
      if (currentStep > 0) {
        set({ currentStep: currentStep - 1 });
      }
    },
    
    // Jump to specific step
    goToStep: (step: number) => {
      const { totalSteps } = get();
      if (step >= 0 && step < totalSteps) {
        set({ currentStep: step });
      }
    },
    
    // Skip the tour
    skipTour: () => {
      set({ isActive: false });
      // Don't mark as completed if skipped
    },
    
    // Mark tour as completed
    markCompleted: () => {
      const { completedSteps } = get();
      const newState = {
        hasCompletedTour: true,
        completedSteps: [...new Set([...completedSteps, Date.now()])],
      };
      set(newState);
      saveTourState(newState);
    },
    
    // Reset tour state (for testing)
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
