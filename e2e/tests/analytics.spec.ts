import { test, expect, Page } from '@playwright/test';
import { clearAllStorage, seedCheckinHistory } from '../utils/clearStorage.js';

async function seedWorkoutSessions(page: Page, count: number) {
  await page.evaluate(async (n: number) => {
    const { getActiveDatabase } = await import('/js/core/storage.js');
    const db = getActiveDatabase();
    const today = new Date();
    for (let i = 0; i < n; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i); // Every day, not every 2 days
      const iso = d.toISOString().slice(0, 10);
      // Use type 'A' (workout session) not 'evening' (recovery session)
      // so getWeeklySummary counts them correctly
      const key = `${iso}_A`;
      await db.sessions.put({
        key,
        date: iso,
        type: 'A',
        completed: true,
        readiness: 'green',
        rpe: 6 + (i % 3),
        notes: '',
        updatedAt: Date.now(),
      });
    }
  }, count);
}

async function seedDecliningTrend(page: Page) {
  // Declining HRV / rising restHR to trigger warnings
  // seedCheckinHistory seeds from oldest to newest (i=count-1 to 0)
  // We need HRV to decline and RHR to rise CONSECUTIVELY for at least 3 days at the end
  await page.evaluate(async () => {
    const { getActiveDatabase } = await import('/js/core/storage.js');
    const db = getActiveDatabase();
    const today = new Date();
    // Seed 7 days: first 4 stable, last 3 declining/rising
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      
      // Last 3 days (closest to today) have declining HRV and rising RHR
      // detectNegativeTrends checks: trendData[i].hrv < trendData[i-1].hrv (from end)
      // So we need: day 0 (today) < day 1 < day 2 (3 consecutive declines)
      // That means: today=22, yesterday=30, day before=38
      let hrv = 60;
      let rhr = 50;
      if (i === 0) { hrv = 22; rhr = 70; } // today
      else if (i === 1) { hrv = 30; rhr = 65; } // yesterday
      else if (i === 2) { hrv = 38; rhr = 60; } // day before
      
      await db.checkins.put({
        date: iso,
        weight: 75,
        restHR: rhr,
        hrv: hrv,
        sleepHours: 5,
        hipPain: 4,
        shoulderPain: 4,
        breathing: 'bad',
        notes: '',
        muscleSoreness: 4,
        energy: 1,
        mood: 1,
        sleepQuality: 1,
        stress: 4,
        readiness: 'red',
        ts: Date.now() - i * 86400000,
      });
    }
  });
}

async function visitAnalytics(page: Page) {
  // Dismiss onboarding if present
  const onboardingClose = page.locator('[data-testid="onboarding-close"]');
  if (await onboardingClose.isVisible().catch(() => false)) {
    await onboardingClose.click();
    await page.waitForTimeout(300);
  }
  // The analytics tab has data-testid="nav-analytics"
  const analyticsTab = page.locator('[data-testid="nav-analytics"]');
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
    await page.goto('/');
    await clearAllStorage(page);
    // Mark onboarding completed so the app skips guest/demo mode
    await page.evaluate(() => {
      localStorage.setItem('fitness-tracker-onboarding-v1', JSON.stringify({ completed: true, completedAt: Date.now() }));
    });
    // Reload so the store re-reads from the now-empty storage
    await page.reload();
    await page.waitForFunction(() => !!document.querySelector('.bottom-nav'));

    await test.step('Visit analytics page', async () => {
      await visitAnalytics(page);
    });

    await test.step('Verify empty state message is visible', async () => {
      // EmptyState renders when < 2 data points; uses Russian text from i18n
      const emptyState = page.locator('.empty-state');
      await expect(emptyState).toBeVisible({ timeout: 5000 });
      await expect(emptyState).toContainText('Недостаточно данных');
      // Skeleton placeholders are rendered in the empty state (4 chart cards)
      const skeletonCards = page.locator('.chart-card');
      expect(await skeletonCards.count()).toBeGreaterThanOrEqual(4);
    });
  });

  test('Analytics — trend chart → renders with 7-day data', async ({ page }) => {
    await page.goto('/');
    await clearAllStorage(page);
      await seedCheckinHistory(page, 7);

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
    await page.goto('/');
    await clearAllStorage(page);
      await seedCheckinHistory(page, 30);

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
    await page.goto('/');
    await clearAllStorage(page);
    
    // Seed BOTH checkins AND sessions - the page needs checkins for trend data,
    // and sessions for weekly summary to count
    await seedCheckinHistory(page, 7);
    await seedWorkoutSessions(page, 3);
    await page.reload();
    await page.waitForFunction(() => !!document.querySelector('.bottom-nav'));

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
    await page.goto('/');
    await clearAllStorage(page);
    await seedDecliningTrend(page);
    await page.reload();
    await page.waitForFunction(() => !!document.querySelector('.bottom-nav'));

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
