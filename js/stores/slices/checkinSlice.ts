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

export function createCheckinSlice(): CheckinSlice {
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

    setWeight: (v: number) => ({ weight: v }),
    setRestHR: (v: number) => ({ restHR: v }),
    setHrv: (v: number) => ({ hrv: v }),
    setSleepHours: (v: number) => ({ sleepHours: v }),
    setHipPain: (v: number) => ({ hipPain: v }),
    setShoulderPain: (v: number) => ({ shoulderPain: v }),
    setBreathing: (v: BreathingStatus) => ({ breathing: v }),
    setNotes: (v: string) => ({ notes: v }),
    setMuscleSoreness: (v: number) => ({ muscleSoreness: v }),
    setEnergy: (v: number) => ({ energy: v }),
    setMood: (v: number) => ({ mood: v }),
    setSleepQuality: (v: number) => ({ sleepQuality: v }),
    setStress: (v: number) => ({ stress: v }),
  };
}
