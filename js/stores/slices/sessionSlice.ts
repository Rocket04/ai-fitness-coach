// js/stores/slices/sessionSlice.ts
// Session form state + simple setters + pending result tracking

import type { ApreExerciseResult, SetResult } from '../../core/types.js';

export interface SessionSlice {
  rpe: number;
  sessionNote: string;
  durationMinutes: number;
  testPullUps: number;
  testPushUps: number;
  testPlank: number;
  pendingApreResults: ApreExerciseResult[];
  pendingSetResults: SetResult[];
  postSessionFatigue: number;
  postSessionPain: number;
  setRpe: (v: number) => void;
  setSessionNote: (v: string) => void;
  setDurationMinutes: (v: number) => void;
  setTestPullUps: (v: number) => void;
  setTestPushUps: (v: number) => void;
  setTestPlank: (v: number) => void;
  updateApreResult: (result: ApreExerciseResult) => void;
  updateSetResult: (result: SetResult) => void;
  setPostSessionFatigue: (v: number) => void;
  setPostSessionPain: (v: number) => void;
}

export function createSessionSlice(set: (partial: Record<string, unknown>) => void, get: () => any): SessionSlice {
  return {
    rpe: 0,
    sessionNote: '',
    durationMinutes: 45,
    testPullUps: 0,
    testPushUps: 0,
    testPlank: 0,
    pendingApreResults: [],
    pendingSetResults: [],
    postSessionFatigue: 0,
    postSessionPain: 0,

    setRpe: (v: number) => set({ rpe: v }),
    setSessionNote: (v: string) => set({ sessionNote: v }),
    setDurationMinutes: (v: number) => set({ durationMinutes: v }),
    setTestPullUps: (v: number) => set({ testPullUps: v }),
    setTestPushUps: (v: number) => set({ testPushUps: v }),
    setTestPlank: (v: number) => set({ testPlank: v }),

    updateApreResult: (result: ApreExerciseResult) => {
      const pendingApreResults = (get() as any).pendingApreResults as ApreExerciseResult[];
      const updated = [
        ...pendingApreResults.filter((r: ApreExerciseResult) => r.exerciseName !== result.exerciseName),
        result,
      ];
      set({ pendingApreResults: updated });
    },

    updateSetResult: (result: SetResult) => {
      const pendingSetResults = (get() as any).pendingSetResults as SetResult[];
      const idx = pendingSetResults.findIndex(
        (r: SetResult) => r.exerciseName === result.exerciseName && r.setNumber === result.setNumber
      );
      if (idx >= 0) {
        const updated = [...pendingSetResults];
        updated[idx] = result;
        set({ pendingSetResults: updated });
      } else {
        set({ pendingSetResults: [...pendingSetResults, result] });
      }
    },

    setPostSessionFatigue: (v: number) => set({ postSessionFatigue: v }),
    setPostSessionPain: (v: number) => set({ postSessionPain: v }),
  };
}
