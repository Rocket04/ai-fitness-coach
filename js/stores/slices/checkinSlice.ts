// js/stores/slices/checkinSlice.ts
// Checkin form state + simple setters

import type { BreathingStatus } from '../../core/types.js';

export interface CheckinSlice {
  weight: number;
  restHR: number;
  hrv: number;
  sleepHours: number;
  hipPain: number;
  shoulderPain: number;
  breathing: BreathingStatus;
  notes: string;
  muscleSoreness: number;
  energy: number;
  mood: number;
  sleepQuality: number;
  stress: number;
  setWeight: (v: number) => void;
  setRestHR: (v: number) => void;
  setHrv: (v: number) => void;
  setSleepHours: (v: number) => void;
  setHipPain: (v: number) => void;
  setShoulderPain: (v: number) => void;
  setBreathing: (v: BreathingStatus) => void;
  setNotes: (v: string) => void;
  setMuscleSoreness: (v: number) => void;
  setEnergy: (v: number) => void;
  setMood: (v: number) => void;
  setSleepQuality: (v: number) => void;
  setStress: (v: number) => void;
}

export function createCheckinSlice(
  set: (partial: Partial<CheckinSlice>) => void,
  _get: () => CheckinSlice
): CheckinSlice {
  return {
    weight: 0,
    restHR: 0,
    hrv: 0,
    sleepHours: 0,
    hipPain: 0,
    shoulderPain: 0,
    breathing: 'good' as BreathingStatus,
    notes: '',
    muscleSoreness: 0,
    energy: 0,
    mood: 0,
    sleepQuality: 0,
    stress: 0,

    setWeight: (v: number) => set({ weight: v }),
    setRestHR: (v: number) => set({ restHR: v }),
    setHrv: (v: number) => set({ hrv: v }),
    setSleepHours: (v: number) => set({ sleepHours: v }),
    setHipPain: (v: number) => set({ hipPain: v }),
    setShoulderPain: (v: number) => set({ shoulderPain: v }),
    setBreathing: (v: BreathingStatus) => set({ breathing: v }),
    setNotes: (v: string) => set({ notes: v }),
    setMuscleSoreness: (v: number) => set({ muscleSoreness: v }),
    setEnergy: (v: number) => set({ energy: v }),
    setMood: (v: number) => set({ mood: v }),
    setSleepQuality: (v: number) => set({ sleepQuality: v }),
    setStress: (v: number) => set({ stress: v }),
  };
}
