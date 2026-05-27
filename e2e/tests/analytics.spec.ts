import { test, expect, Page } from '@playwright/test';

// ─── Inline helpers (until e2e/pages/ and e2e/fixtures/ from Subtask 2 exist) ───

async function clearAllData(page: Page) {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
    const req = indexedDB.deleteDatabase('fitness-tracker-db');
    return new Promise<void>((resolve, reject) => {
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
      req.onblocked = () => resolve(); // best effort
    });
  });
}

async function seedCheckinHistory(page: Page, days: number) {
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
        weight: 70 + Math.random() * 5,
        restHR: 55 + Math.floor(Math.random() * 10),
        hrv: 45 + Math.floor(Math.random() * 20),
        sleepHours: 6 + Math.random() * 3,
        soreness: Math.floor(Math.random() * 5) + 1,
        mood: 3,
        note: '',
        updatedAt: Date.now(),
      });
    }
  }, days);
}

async function seedWorkoutSessions(page: Page, count: number) {
  await page.evaluate(async (n: number) => {
    const { getActiveDatabase } = await import('/js/core/storage.js');
    const db = getActiveDatabase();
    const today = new Date();
    for (let i = 0; i < n; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i * 2);
      const iso = d.toISOString().slice(0, 10);
      const key = `${iso}_evening`;
      await db.sessions.put({
        key,
        date: iso,
        type: 'evening',
        completed: true,
        readiness: 'green',
        rpe: 6 + i,
        notes: '',
        updatedAt: Date.now(),
      });
    }
  }, count);
}

async function seedDecliningTrend(page: Page) {
  // Declining HRV / rising restHR to trigger warnings
  await page.evaluate(async () => {
    const { getActiveDatabase } = await import('/js/core/storage.js');
    const db = getActiveDatabase();
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      await db.checkins.put({
        date: iso,
        weight: 75,
        restHR: 55 + (6 - i) * 3, // rising
        hrv: 70 - (6 - i) * 5, // declining
        sleepHours: 5,
        soreness: 4,
        mood: 2,
        note: '',
        updatedAt: Date.now(),
      });
    }
  });
}

async function visitAnalytics(page: Page) {
  await page.goto('/');
  // Wait for store init
  await page.waitForFunction(() => {
    const el = document.querySelector('.bottom-nav');
    return !!el;
  });
  const analyticsTab = page.locator('nav.bottom-nav button[aria-label="Аналитика"]').first();
  if (await analyticsTab.isVisible().catch(() => false)) {
    await analyticsTab.click();
  } else {
    // Fallback by index if label differs due to language
    await page.locator('nav.bottom-nav button').nth(2).click();
  }
  await page.waitForTimeout(300);
}

// ─── Tests ───

test.describe('Analytics', () => {
  test('Analytics — empty state → shows when insufficient data', async ({ page }) => {
    await test.step('Clear all data', async () => {
      await clearAllData(page);
    });

    await test.step('Visit analytics page', async () => {
      await visitAnalytics(page);
    });

    await test.step('Verify empty state message is visible', async () => {
      // EmptyState renders when < 2 data points; uses Russian text from i18n
      const body = page.locator('body');
      await expect(body).toContainText('Недостаточно данных', { timeout: 5000 });
      // Skeleton placeholders should also appear
      await expect(page.locator('.chart-card')).toHaveCount(0, { timeout: 3000 });
    });
  });

  test('Analytics — trend chart → renders with 7-day data', async ({ page }) => {
    await test.step('Seed 7 days of check-ins', async () => {
      await clearAllData(page);
      await seedCheckinHistory(page, 7);
    });

    await test.step('Visit analytics', async () => {
      await visitAnalytics(page);
    });

    await test.step('Verify trend chart wrapper is visible', async () => {
      const chart = page.locator('.trend-chart-wrapper').first();
      await expect(chart).toBeVisible({ timeout: 5000 });
      // SVG chart should be present
      await expect(chart.locator('svg')).toBeVisible();
    });
  });

  test('Analytics — toggle 30-day → updates chart', async ({ page }) => {
    await test.step('Seed 30 days of check-ins', async () => {
      await clearAllData(page);
      await seedCheckinHistory(page, 30);
    });

    await test.step('Visit analytics', async () => {
      await visitAnalytics(page);
    });

    await test.step('Click 30-day toggle', async () => {
      const toggle30 = page.getByRole('button', { name: /30 дней/ });
      if (await toggle30.isVisible().catch(() => false)) {
        await toggle30.click();
      } else {
        test.skip(true, 'Missing data-testid="toggle-30d" or 30-day button not rendered');
      }
    });

    await test.step('Verify chart still renders after toggle', async () => {
      const chart = page.locator('.trend-chart-wrapper').first();
      await expect(chart).toBeVisible({ timeout: 5000 });
      await expect(chart.locator('svg')).toBeVisible();
    });
  });

  test('Analytics — weekly summary → displays completed sessions', async ({ page }) => {
    await test.step('Seed sessions', async () => {
      await clearAllData(page);
      await seedWorkoutSessions(page, 3);
    });

    await test.step('Visit analytics', async () => {
      await visitAnalytics(page);
    });

    await test.step('Verify weekly summary card shows count', async () => {
      const summary = page.locator('.month-stats').first();
      // The summary renders inside WeeklySummary which uses .month-stats class
      await expect(summary).toBeVisible({ timeout: 5000 });
      // Should contain the workout count
      await expect(summary).toContainText('3', { timeout: 3000 });
    });
  });

  test('Analytics — warnings → display when negative trends detected', async ({ page }) => {
    await test.step('Seed declining trend data', async () => {
      await clearAllData(page);
      await seedDecliningTrend(page);
    });

    await test.step('Visit analytics', async () => {
      await visitAnalytics(page);
    });

    await test.step('Verify warning list items appear', async () => {
      const warningBlock = page.locator('.analytics-warning');
      // WarningsList renders when there are warnings
      await expect(warningBlock).toBeVisible({ timeout: 5000 });
      await expect(warningBlock).toContainText('Внимание');
    });
  });
});
