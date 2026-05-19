// js/stores/useCheckinStore.ts
// Zustand store for checkin data and checkin form state

import { create } from 'zustand';
import type { Checkin, BreathingStatus } from '../core/types.js';

interface CheckinState {
  checkins: Checkin[];
  // Checkin form
  weight: number;
  restHR: number;
  hrv: number;
  sleepHours: number;
  hipPain: number;
  shoulderPain: number;
  breathing: BreathingStatus;
  notes: string;
  // Subjective metrics
  muscleSoreness: number;
  energy: number;
  mood: number;
  sleepQuality: number;
  stress: number;
  // Actions
  setCheckins: (checkins: Checkin[]) => void;
  setWeight: (value: number) => void;
  setRestHR: (value: number) => void;
  setHrv: (value: number) => void;
  setSleepHours: (value: number) => void;
  setHipPain: (value: number) => void;
  setShoulderPain: (value: number) => void;
  setBreathing: (value: BreathingStatus) => void;
  setNotes: (value: string) => void;
  setMuscleSoreness: (value: number) => void;
  setEnergy: (value: number) => void;
  setMood: (value: number) => void;
  setSleepQuality: (value: number) => void;
  setStress: (value: number) => void;
  resetCheckinForm: () => void;
}

export const useCheckinStore = create<CheckinState>((set) => ({
  checkins: [],
  weight: 0,
  restHR: 0,
  hrv: 0,
  sleepHours: 0,
  hipPain: 0,
  shoulderPain: 0,
  breathing: 'good',
  notes: '',
  muscleSoreness: 0,
  energy: 0,
  mood: 0,
  sleepQuality: 0,
  stress: 0,
  
  setCheckins: (checkins) => set({ checkins }),
  setWeight: (weight) => set({ weight }),
  setRestHR: (restHR) => set({ restHR }),
  setHrv: (hrv) => set({ hrv }),
  setSleepHours: (sleepHours) => set({ sleepHours }),
  setHipPain: (hipPain) => set({ hipPain }),
  setShoulderPain: (shoulderPain) => set({ shoulderPain }),
  setBreathing: (breathing) => set({ breathing }),
  setNotes: (notes) => set({ notes }),
  setMuscleSoreness: (muscleSoreness) => set({ muscleSoreness }),
  setEnergy: (energy) => set({ energy }),
  setMood: (mood) => set({ mood }),
  setSleepQuality: (sleepQuality) => set({ sleepQuality }),
  setStress: (stress) => set({ stress }),
  
  resetCheckinForm: () => set({
    weight: 0,
    restHR: 0,
    hrv: 0,
    sleepHours: 0,
    hipPain: 0,
    shoulderPain: 0,
    breathing: 'good',
    notes: '',
    muscleSoreness: 0,
    energy: 0,
    mood: 0,
    sleepQuality: 0,
    stress: 0,
  }),
}));
