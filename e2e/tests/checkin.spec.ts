import { test, expect, Page } from '@playwright/test';
import { CheckinPage } from '../pages/CheckinPage';
import { TodayPage } from '../pages/TodayPage';
import { clearAllStorage, markOnboardingCompleted } from '../utils/clearStorage.js';

async function setCheckinTier(page: Page, tier: 'full' | 'medium' | 'light') {
  await page.evaluate(async (tierValue) => {
    const { saveSetting } = await import('/js/core/storage.js');
    await saveSetting('checkinTier', tierValue);
  }, tier);
}

// ─── Tests ───

test.describe('Checkin', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearAllStorage(page);
    // Mark onboarding completed and set tier before reload
    await page.evaluate(() => {
      localStorage.setItem('fitness-tracker-onboarding-v1', JSON.stringify({ completed: true, completedAt: Date.now() }));
    });
    // Reload so the app reinitializes with a fresh empty DB
    await page.reload();
    await page.waitForFunction(() => !!document.querySelector('.bottom-nav'));
  });

  test('Checkin — full tier submission → recovery score updates', async ({ page }) => {
    const checkin = new CheckinPage(page);

    await test.step('Set full tier', async () => {
      await setCheckinTier(page, 'full');
      await page.reload();
      await page.waitForFunction(() => !!document.querySelector('.bottom-nav'));
    });

    await test.step('Navigate to Log page', async () => {
      await page.locator('[data-testid="nav-log"]').click();
      await page.waitForLoadState('domcontentloaded');
    });

    await test.step('Submit full tier check-in', async () => {
      await checkin.submitFullTier(75, 58, 65, 7.5, 2);
    });

    await test.step('Verify recovery score on Today page', async () => {
      await page.locator('[data-testid="nav-today"]').click();
      await page.waitForLoadState('domcontentloaded');
      const score = await page.locator('[data-testid="checkin-trigger"] .readiness-ring__score').textContent();
      const parsed = parseInt(score?.trim() || '', 10);
      expect(parsed).toBeGreaterThan(0);
    });
  });

  test('Checkin — medium tier submission → recovery score updates', async ({ page }) => {
    const checkin = new CheckinPage(page);

    await test.step('Set medium tier', async () => {
      await setCheckinTier(page, 'medium');
      await page.reload();
      await page.waitForFunction(() => !!document.querySelector('.bottom-nav'));
    });

    await test.step('Navigate to Log page', async () => {
      await page.locator('[data-testid="nav-log"]').click();
      await page.waitForLoadState('domcontentloaded');
    });

    await test.step('Submit medium tier check-in', async () => {
      await checkin.submitMediumTier(76, 62, 3);
    });

    await test.step('Verify recovery score updates', async () => {
      await page.locator('[data-testid="nav-today"]').click();
      await page.waitForLoadState('domcontentloaded');
      const score = await page.locator('[data-testid="checkin-trigger"] .readiness-ring__score').textContent();
      const parsed = parseInt(score?.trim() || '', 10);
      expect(parsed).toBeGreaterThan(0);
    });
  });

  test('Checkin — light tier submission → recovery score updates', async ({ page }) => {
    const checkin = new CheckinPage(page);

    await test.step('Set light tier', async () => {
      await setCheckinTier(page, 'light');
      await page.reload();
      await page.waitForFunction(() => !!document.querySelector('.bottom-nav'));
    });

    await test.step('Navigate to Log page', async () => {
      await page.locator('[data-testid="nav-log"]').click();
      await page.waitForLoadState('domcontentloaded');
    });

    await test.step('Submit light tier check-in', async () => {
      await checkin.submitLightTier(74, 2);
    });

    await test.step('Verify recovery score updates', async () => {
      await page.locator('[data-testid="nav-today"]').click();
      await page.waitForLoadState('domcontentloaded');
      const score = await page.locator('[data-testid="checkin-trigger"] .readiness-ring__score').textContent();
      const parsed = parseInt(score?.trim() || '', 10);
      expect(parsed).toBeGreaterThan(0);
    });
  });

  test('Checkin — empty submission → validation error', async ({ page }) => {
    const checkin = new CheckinPage(page);

    await test.step('Load app and navigate to Log page', async () => {
      await page.goto('/');
      await page.waitForFunction(() => !!document.querySelector('.bottom-nav'));
      await checkin.goto();
      await checkin.form.waitFor({ state: 'visible', timeout: 5000 });
    });

    await test.step('Submit without filling any fields', async () => {
      await checkin.submitButton.click();
    });

    await test.step('Verify validation error message', async () => {
      const error = await checkin.getValidationErrors();
      expect(error).toContain('хотя бы одно поле');
    });
  });

  test('Checkin — trend indicators → display when historical data exists', async ({ page }) => {
    const checkin = new CheckinPage(page);

    await test.step('Seed 3 days of check-in history and set tier', async () => {
      await page.evaluate(async () => {
        const { saveCheckin, saveSetting } = await import('/js/core/storage.js');
        await saveSetting('checkinTier', 'full');
        const today = new Date();
        for (let i = 2; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().slice(0, 10);
          await saveCheckin({
            date: dateStr,
            weight: 75 + i * 0.5,
            restHR: 60 + i,
            hrv: 55 + i * 2,
            sleepHours: 7 + i * 0.2,
            muscleSoreness: 2,
            energy: 4,
            mood: 4,
            sleepQuality: 4,
            stress: 2,
            hipPain: 1,
            shoulderPain: 1,
            breathing: 'good',
            notes: `Seed day ${i}`,
            readiness: 'green',
            ts: Date.now() - i * 86400000,
          });
        }
      });
      await page.reload();
      await page.waitForFunction(() => !!document.querySelector('.bottom-nav'));
    });

    await test.step('Navigate to Log page and open form', async () => {
      await checkin.goto();
      await checkin.form.waitFor({ state: 'visible', timeout: 5000 });
    });

    await test.step('Fill and submit new check-in', async () => {
      await checkin.submitFullTier(75, 60, 60, 8, 2);
    });

    await test.step('Verify trend indicators are visible', async () => {
      const hasTrend = await page.locator('.trend-indicator, .checkin-sparkline-row').first().isVisible().catch(() => false);
      expect(hasTrend).toBe(true);
    });
  });
});
