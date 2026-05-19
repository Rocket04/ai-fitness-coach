// js/stores/useSessionStore.ts
// Zustand store for session data and session form state

import { create } from 'zustand';
import type { Session } from '../core/types.js';

interface SessionState {
  sessions: Session[];
  // Session form
  rpe: number;
  sessionNote: string;
  durationMinutes: number;
  testPullUps: number;
  testPushUps: number;
  testPlank: number;
  // Actions
  setSessions: (sessions: Session[]) => void;
  setRpe: (value: number) => void;
  setSessionNote: (value: string) => void;
  setDurationMinutes: (value: number) => void;
  setTestPullUps: (value: number) => void;
  setTestPushUps: (value: number) => void;
  setTestPlank: (value: number) => void;
  resetSessionForm: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  sessions: [],
  rpe: 0,
  sessionNote: '',
  durationMinutes: 45,
  testPullUps: 0,
  testPushUps: 0,
  testPlank: 0,
  
  setSessions: (sessions) => set({ sessions }),
  setRpe: (rpe) => set({ rpe }),
  setSessionNote: (sessionNote) => set({ sessionNote }),
  setDurationMinutes: (durationMinutes) => set({ durationMinutes }),
  setTestPullUps: (testPullUps) => set({ testPullUps }),
  setTestPushUps: (testPushUps) => set({ testPushUps }),
  setTestPlank: (testPlank) => set({ testPlank }),
  
  resetSessionForm: () => set({
    rpe: 0,
    sessionNote: '',
    durationMinutes: 45,
    testPullUps: 0,
    testPushUps: 0,
    testPlank: 0,
  }),
}));
