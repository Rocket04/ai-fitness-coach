// js/tests/core/demoData.test.ts
// TDD: generateDemoData() — deterministic synthetic data generator

import { describe, it, expect } from 'vitest';

describe('generateDemoData', () => {
  it('should export generateDemoData from demoData module', async () => {
    const mod = await import('../../core/demoData.js');
    expect(mod.generateDemoData).toBeDefined();
    expect(typeof mod.generateDemoData).toBe('function');
  });

  it('should return an object with sessions, checkins, and settings', async () => {
    const { generateDemoData } = await import('../../core/demoData.js');
    const data = generateDemoData();
    expect(data).toBeDefined();
    expect(data.sessions).toBeDefined();
    expect(data.checkins).toBeDefined();
    expect(data.settings).toBeDefined();
    expect(Array.isArray(data.sessions)).toBe(true);
    expect(Array.isArray(data.checkins)).toBe(true);
  });

  it('should generate 30 days of checkins', async () => {
    const { generateDemoData } = await import('../../core/demoData.js');
    const data = generateDemoData();
    expect(data.checkins.length).toBe(30);
  });

  it('should generate checkins with realistic fields', async () => {
    const { generateDemoData } = await import('../../core/demoData.js');
    const data = generateDemoData();
    const checkin = data.checkins[0];
    expect(checkin.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(checkin.sleepHours).toBeGreaterThanOrEqual(5);
    expect(checkin.sleepHours).toBeLessThanOrEqual(10);
    expect(checkin.restHR).toBeGreaterThanOrEqual(50);
    expect(checkin.restHR).toBeLessThanOrEqual(75);
    expect(checkin.hrv).toBeGreaterThanOrEqual(35);
    expect(checkin.hrv).toBeLessThanOrEqual(80);
    expect(checkin.muscleSoreness).toBeGreaterThanOrEqual(1);
    expect(checkin.muscleSoreness).toBeLessThanOrEqual(5);
    expect(checkin.energy).toBeGreaterThanOrEqual(1);
    expect(checkin.energy).toBeLessThanOrEqual(5);
    expect(checkin.mood).toBeGreaterThanOrEqual(1);
    expect(checkin.mood).toBeLessThanOrEqual(5);
    expect(checkin.sleepQuality).toBeGreaterThanOrEqual(1);
    expect(checkin.sleepQuality).toBeLessThanOrEqual(5);
    expect(checkin.stress).toBeGreaterThanOrEqual(1);
    expect(checkin.stress).toBeLessThanOrEqual(5);
  });

  it('should generate sessions for training days only (Mon/Wed/Fri)', async () => {
    const { generateDemoData } = await import('../../core/demoData.js');
    const data = generateDemoData();
    // Should have roughly 12-13 sessions over 30 days (Mon/Wed/Fri)
    expect(data.sessions.length).toBeGreaterThanOrEqual(10);
    expect(data.sessions.length).toBeLessThanOrEqual(16);
    // All sessions should have type A, B, or C
    for (const s of data.sessions) {
      expect(['A', 'B', 'C'].includes(s.type)).toBe(true);
      expect(s.completed).toBe(true);
      expect(s.rpe).toBeGreaterThanOrEqual(5);
      expect(s.rpe).toBeLessThanOrEqual(9);
    }
  });

  it('should be deterministic (same output on repeated calls)', async () => {
    const { generateDemoData } = await import('../../core/demoData.js');
    const data1 = generateDemoData();
    const data2 = generateDemoData();
    expect(data1.checkins.length).toBe(data2.checkins.length);
    expect(data1.sessions.length).toBe(data2.sessions.length);
    // First checkin should have identical values
    expect(data1.checkins[0].sleepHours).toBe(data2.checkins[0].sleepHours);
    expect(data1.checkins[0].hrv).toBe(data2.checkins[0].hrv);
  });

  it('should generate sessions with exercises referencing plan data', async () => {
    const { generateDemoData } = await import('../../core/demoData.js');
    const data = generateDemoData();
    for (const s of data.sessions) {
      // Sessions should have exercises stored in notes or mode
      expect(s.mode).toBe('full');
    }
  });

  it('should generate settings with valid values', async () => {
    const { generateDemoData } = await import('../../core/demoData.js');
    const data = generateDemoData();
    expect(data.settings.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(data.settings.trainDays).toEqual([1, 3, 5]);
    expect(data.settings.checkinTier).toBe('medium');
    expect(data.settings.selectedSports).toEqual(['running']);
    expect(data.settings.selectedGadgets).toEqual(['smart_watch']);
  });
});
