// e2e/fixtures/seedData.ts
// Data seeding utilities for Playwright E2E tests.
// Uses Dexie API directly via the app's db instance.

import { db } from '../../js/core/storage.js';
import type { Checkin, Session } from '../../js/core/types.js';

// ── Low-level helpers ────────────────────────────────────────────────────────

function makeISODate(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals = 1): number {
  const val = Math.random() * (max - min) + min;
  return Math.round(val * 10 ** decimals) / 10 ** decimals;
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Clears all application data:
 * - IndexedDB (all Dexie stores: sessions, checkins, settings, achievements)
 * - localStorage (all fitness-tracker prefixed keys)
 * - sessionStorage (all fitness-tracker prefixed keys)
 */
export async function clearAllData(): Promise<void> {
  // Clear Dexie stores via db instance
  await db.transaction('rw', db.sessions, db.checkins, db.settings, db.achievements, async () => {
    await Promise.all([
      db.sessions.clear(),
      db.checkins.clear(),
      db.settings.clear(),
      db.achievements.clear(),
    ]);
  });

  // Clear localStorage keys prefixed with fitness-tracker
  const lsKeys = Object.keys(localStorage).filter((k) => k.startsWith('fitness-tracker'));
  lsKeys.forEach((k) => localStorage.removeItem(k));

  // Clear sessionStorage keys prefixed with fitness-tracker
  const ssKeys = Object.keys(sessionStorage).filter((k) => k.startsWith('fitness-tracker'));
  ssKeys.forEach((k) => sessionStorage.removeItem(k));
}

/**
 * Seeds N days of daily check-in records into IndexedDB.
 * Records are created for the last N days (including today).
 */
export async function seedCheckinHistory(count: number): Promise<Checkin[]> {
  const checkins: Checkin[] = [];

  for (let i = 0; i < count; i++) {
    const offset = -(count - 1 - i); // oldest first: e.g. for count=7: -6, -5, ..., 0
    const date = makeISODate(offset);

    checkins.push({
      date,
      sleepHours: randomFloat(5.5, 9),
      restHR: randomInt(50, 75),
      hrv: randomInt(40, 80),
      hipPain: randomInt(1, 3),
      shoulderPain: randomInt(1, 3),
      breathing: ['good', 'mild', 'bad'][randomInt(0, 2)] as Checkin['breathing'],
      weight: randomFloat(65, 95, 1),
      notes: `Auto-seeded check-in #${i + 1}`,
      muscleSoreness: randomInt(1, 4),
      energy: randomInt(2, 5),
      mood: randomInt(2, 5),
      sleepQuality: randomInt(2, 5),
      stress: randomInt(1, 4),
      readiness: ['green', 'yellow', 'red'][randomInt(0, 2)] as Checkin['readiness'],
      ts: Date.now() + offset * 86400000,
    });
  }

  await db.checkins.bulkPut(checkins);
  return checkins;
}

/**
 * Seeds N workout sessions into IndexedDB.
 * Sessions span the last N training days with varied sport types.
 */
export async function seedWorkoutSessions(count: number): Promise<Session[]> {
  const sessions: Session[] = [];
  const types: Session['type'][] = ['A', 'B', 'C', 'running', 'strength', 'mobility'];
  const modes: Session['mode'][] = ['full', 'yellow', 'minimum', 'deload'];

  for (let i = 0; i < count; i++) {
    const offset = -(count - 1 - i);
    const date = makeISODate(offset);
    const type = types[i % types.length];
    const key = `${date}_${type}`;

    sessions.push({
      key,
      date,
      type,
      completed: true,
      readiness: ['green', 'yellow', 'red'][randomInt(0, 2)] as Session['readiness'],
      rpe: randomFloat(4, 9, 1),
      durationMinutes: randomInt(30, 90),
      sessionLoad: randomInt(120, 400),
      hipPain: randomInt(1, 3),
      shoulderPain: randomInt(1, 3),
      notes: `Auto-seeded session #${i + 1}`,
      mode: modes[i % modes.length],
      updatedAt: Date.now() + offset * 86400000,
      testResults:
        i % 3 === 0
          ? {
              pullUps: randomInt(5, 20),
              pushUps: randomInt(10, 40),
              plankSec: randomInt(30, 120),
            }
          : undefined,
    });
  }

  await db.sessions.bulkPut(sessions);
  return sessions;
}

// ── Pre-defined scenarios ────────────────────────────────────────────────────

export type DemoScenarioName = 'fresh-install' | 'week-of-checkins' | 'active-training';

interface DemoScenarioResult {
  checkins: Checkin[];
  sessions: Session[];
}

/**
 * Seeds a pre-defined demo scenario into IndexedDB.
 *
 * Scenarios:
 *   'fresh-install'    — no data, onboarding not completed
 *   'week-of-checkins' — 7 days of check-ins, no sessions
 *   'active-training'  — 7 check-ins + 3 workout sessions
 */
export async function seedDemoScenario(name: DemoScenarioName): Promise<DemoScenarioResult> {
  // Always start clean
  await clearAllData();

  switch (name) {
    case 'fresh-install': {
      // No data; ensure onboarding flag is also cleared
      localStorage.removeItem('fitness-tracker-onboarding-completed');
      return { checkins: [], sessions: [] };
    }

    case 'week-of-checkins': {
      const checkins = await seedCheckinHistory(7);
      return { checkins, sessions: [] };
    }

    case 'active-training': {
      const [checkins, sessions] = await Promise.all([
        seedCheckinHistory(7),
        seedWorkoutSessions(3),
      ]);
      return { checkins, sessions };
    }

    default:
      throw new Error(`Unknown demo scenario: ${name}`);
  }
}
