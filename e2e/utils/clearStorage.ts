// e2e/utils/clearStorage.ts
// Shared utility to clear all app storage (localStorage, sessionStorage, IndexedDB).
// Must be called AFTER page.goto('/') so the page has a proper origin context.

import type { Page } from '@playwright/test';

export async function clearAllStorage(page: Page): Promise<void> {
  // Navigate to the app first if not already there
  const url = page.url();
  if (!url.includes('localhost:3000')) {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  }

  // Clear localStorage/sessionStorage
  await page.evaluate(() => {
    try { localStorage.clear(); } catch { /* ignore */ }
    try { sessionStorage.clear(); } catch { /* ignore */ }
  });

  // Close any open IndexedDB connections and delete databases.
  // We must open each DB first so the browser can close its existing connection,
  // then delete. Without this, deleteDatabase may be blocked or silently fail.
  await page.evaluate(async () => {
    try {
      const dbs = await window.indexedDB.databases();
      for (const dbInfo of dbs) {
        if (dbInfo.name) {
          await new Promise<void>((resolve) => {
            const openReq = window.indexedDB.open(dbInfo.name!);
            openReq.onsuccess = () => {
              openReq.result.close();
              const delReq = window.indexedDB.deleteDatabase(dbInfo.name!);
              delReq.onsuccess = () => resolve();
              delReq.onerror = () => resolve();
              delReq.onblocked = () => resolve();
            };
            openReq.onerror = () => {
              const delReq = window.indexedDB.deleteDatabase(dbInfo.name!);
              delReq.onsuccess = () => resolve();
              delReq.onerror = () => resolve();
              delReq.onblocked = () => resolve();
            };
          });
        }
      }
    } catch {
      for (const name of ['FitnessAppDB', 'SmartFitnessCoachDemo']) {
        await new Promise<void>((resolve) => {
          const delReq = window.indexedDB.deleteDatabase(name);
          delReq.onsuccess = () => resolve();
          delReq.onerror = () => resolve();
          delReq.onblocked = () => resolve();
        });
      }
    }
  });
}

export async function seedCheckinHistory(page: Page, days: number): Promise<void> {
  await page.evaluate(async (count: number) => {
    const { getActiveDatabase } = await import('/js/core/storage.js');
    const db = getActiveDatabase();
    const today = new Date();
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      await db.checkins.put({
        date: iso,
        sleepHours: 6.5 + Math.random() * 2.5,
        restHR: 50 + Math.floor(Math.random() * 25),
        hrv: 40 + Math.floor(Math.random() * 40),
        hipPain: 1 + Math.floor(Math.random() * 3),
        shoulderPain: 1 + Math.floor(Math.random() * 3),
        breathing: (['good', 'mild', 'bad'] as const)[Math.floor(Math.random() * 3)],
        weight: 70 + Math.random() * 5,
        notes: `E2E seeded #${count - i}`,
        muscleSoreness: 1 + Math.floor(Math.random() * 4),
        energy: 2 + Math.floor(Math.random() * 4),
        mood: 2 + Math.floor(Math.random() * 4),
        sleepQuality: 2 + Math.floor(Math.random() * 4),
        stress: 1 + Math.floor(Math.random() * 4),
        readiness: (['green', 'yellow', 'red'] as const)[Math.floor(Math.random() * 3)],
        ts: Date.now() + (i - count + 1) * 86400000,
      });
    }
  }, days);
}

export async function markOnboardingCompleted(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.setItem('fitness-tracker-onboarding-v1', JSON.stringify({ completed: true, completedAt: Date.now() }));
  });
}
