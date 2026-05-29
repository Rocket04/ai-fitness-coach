import { describe, it, expect } from 'vitest';
import { createStore } from 'zustand/vanilla';
import { createCheckinSlice, type CheckinSlice } from '../../stores/slices/checkinSlice.js';

// Create a vanilla test store using the slice (mimicking useAppStore)
function createTestStore() {
  return createStore<CheckinSlice>((set, get) => {
    const checkin = createCheckinSlice(set, get);
    return { ...checkin };
  });
}

describe('checkinSlice', () => {
  it('setWeight updates weight', () => {
    const store = createTestStore();
    store.getState().setWeight(75);
    expect(store.getState().weight).toBe(75);
  });

  it('setSleepHours updates sleepHours', () => {
    const store = createTestStore();
    store.getState().setSleepHours(7.5);
    expect(store.getState().sleepHours).toBe(7.5);
  });

  it('setSleepQuality updates sleepQuality', () => {
    const store = createTestStore();
    store.getState().setSleepQuality(4);
    expect(store.getState().sleepQuality).toBe(4);
  });

  it('setEnergy updates energy', () => {
    const store = createTestStore();
    store.getState().setEnergy(5);
    expect(store.getState().energy).toBe(5);
  });

  it('setMood updates mood', () => {
    const store = createTestStore();
    store.getState().setMood(3);
    expect(store.getState().mood).toBe(3);
  });

  it('setStress updates stress', () => {
    const store = createTestStore();
    store.getState().setStress(2);
    expect(store.getState().stress).toBe(2);
  });

  it('setRestHR updates restHR', () => {
    const store = createTestStore();
    store.getState().setRestHR(65);
    expect(store.getState().restHR).toBe(65);
  });

  it('setHrv updates hrv', () => {
    const store = createTestStore();
    store.getState().setHrv(45);
    expect(store.getState().hrv).toBe(45);
  });

  it('setHipPain updates hipPain', () => {
    const store = createTestStore();
    store.getState().setHipPain(2);
    expect(store.getState().hipPain).toBe(2);
  });

  it('setShoulderPain updates shoulderPain', () => {
    const store = createTestStore();
    store.getState().setShoulderPain(1);
    expect(store.getState().shoulderPain).toBe(1);
  });

  it('setBreathing updates breathing', () => {
    const store = createTestStore();
    store.getState().setBreathing('bad');
    expect(store.getState().breathing).toBe('bad');
  });

  it('setNotes updates notes', () => {
    const store = createTestStore();
    store.getState().setNotes('Test note');
    expect(store.getState().notes).toBe('Test note');
  });

  it('setMuscleSoreness updates muscleSoreness', () => {
    const store = createTestStore();
    store.getState().setMuscleSoreness(3);
    expect(store.getState().muscleSoreness).toBe(3);
  });
});
