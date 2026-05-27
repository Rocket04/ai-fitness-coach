// e2e/utils/assertions.ts
// Custom Playwright assertion helpers for Smart Fitness Coach E2E tests.

import type { Page } from '@playwright/test';

// ── Recovery ring color assertions ────────────────────────────────────────────

/**
 * Asserts that the recovery ring stroke color matches the expected readiness color.
 * Maps readiness status to CSS color values used by the app.
 */
export async function expectRecoveryColor(page: Page, color: 'green' | 'yellow' | 'red') {
  const colorMap = {
    green: ['var(--green)', '#4ade80', '#22c55e', 'rgb(74, 222, 128)', 'rgb(34, 197, 94)'],
    yellow: ['var(--yellow)', '#facc15', '#eab308', 'rgb(250, 204, 21)', 'rgb(234, 179, 8)'],
    red: ['var(--red)', '#f87171', '#ef4444', 'rgb(248, 113, 113)', 'rgb(239, 68, 68)'],
  };

  // Target the progress circle stroke or the ring gradient
  const ring = page.locator('.hero-ring--large .readiness-ring__progress, .readiness-ring__progress');
  await ring.waitFor({ state: 'visible', timeout: 5000 });

  const style = await ring.evaluate((el) => {
    const computed = window.getComputedStyle(el);
    return computed.stroke || computed.color || el.getAttribute('style') || '';
  });

  const allowed = colorMap[color];
  const matches = allowed.some((c) => style.includes(c));

  if (!matches) {
    throw new Error(
      `Expected recovery ring color to be "${color}" (one of ${allowed.join(', ')}), but got: "${style}"`
    );
  }
}

// ── IndexedDB assertions ─────────────────────────────────────────────────────

/**
 * Asserts that IndexedDB (Dexie) has no user data in sessions or checkins stores.
 * Clears demo mode DB as well if it exists.
 */
export async function expectIndexedDBEmpty(page: Page) {
  const isEmpty = await page.evaluate(async () => {
    const dbs = await window.indexedDB.databases();
    const dbNames = dbs.map((db) => db.name);

    // Check main app DB
    const mainDb = dbs.find((db) => db.name === 'FitnessAppDB');
    const demoDb = dbs.find((db) => db.name === 'SmartFitnessCoachDemo');

    async function checkStore(dbName: string, storeName: string): Promise<number> {
      return new Promise((resolve, reject) => {
        const req = window.indexedDB.open(dbName);
        req.onsuccess = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(storeName)) {
            resolve(0);
            return;
          }
          const tx = db.transaction(storeName, 'readonly');
          const store = tx.objectStore(storeName);
          const countReq = store.count();
          countReq.onsuccess = () => resolve(countReq.result);
          countReq.onerror = () => reject(countReq.error);
        };
        req.onerror = () => reject(req.error);
      });
    }

    let totalRecords = 0;

    if (mainDb) {
      totalRecords += await checkStore('FitnessAppDB', 'sessions');
      totalRecords += await checkStore('FitnessAppDB', 'checkins');
    }

    if (demoDb) {
      totalRecords += await checkStore('SmartFitnessCoachDemo', 'sessions');
      totalRecords += await checkStore('SmartFitnessCoachDemo', 'checkins');
    }

    return totalRecords === 0;
  });

  if (!isEmpty) {
    throw new Error('Expected IndexedDB to be empty, but found user data in sessions or checkins stores');
  }
}

/**
 * Asserts that IndexedDB contains at least N checkin records.
 */
export async function expectCheckinCount(page: Page, minCount: number) {
  const count = await page.evaluate(async () => {
    return new Promise<number>((resolve, reject) => {
      const req = window.indexedDB.open('FitnessAppDB');
      req.onsuccess = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('checkins')) {
          resolve(0);
          return;
        }
        const tx = db.transaction('checkins', 'readonly');
        const store = tx.objectStore('checkins');
        const countReq = store.count();
        countReq.onsuccess = () => resolve(countReq.result);
        countReq.onerror = () => reject(countReq.error);
      };
      req.onerror = () => reject(req.error);
    });
  });

  if (count < minCount) {
    throw new Error(`Expected at least ${minCount} checkins in IndexedDB, but found ${count}`);
  }
}

/**
 * Asserts that IndexedDB contains at least N session records.
 */
export async function expectSessionCount(page: Page, minCount: number) {
  const count = await page.evaluate(async () => {
    return new Promise<number>((resolve, reject) => {
      const req = window.indexedDB.open('FitnessAppDB');
      req.onsuccess = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('sessions')) {
          resolve(0);
          return;
        }
        const tx = db.transaction('sessions', 'readonly');
        const store = tx.objectStore('sessions');
        const countReq = store.count();
        countReq.onsuccess = () => resolve(countReq.result);
        countReq.onerror = () => reject(countReq.error);
      };
      req.onerror = () => reject(req.error);
    });
  });

  if (count < minCount) {
    throw new Error(`Expected at least ${minCount} sessions in IndexedDB, but found ${count}`);
  }
}

// ── Guest mode assertions ────────────────────────────────────────────────────

/**
 * Asserts that the guest badge is visible on the page.
 */
export async function expectGuestModeVisible(page: Page) {
  const badge = page.locator('.guest-badge');
  await badge.waitFor({ state: 'visible', timeout: 5000 });
}

/**
 * Asserts that the demo badge is visible on the page.
 */
export async function expectDemoModeVisible(page: Page) {
  const badge = page.locator('.demo-badge');
  await badge.waitFor({ state: 'visible', timeout: 5000 });
}
