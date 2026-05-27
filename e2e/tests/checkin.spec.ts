import { test, expect, Page } from '@playwright/test';
import { CheckinPage } from '../pages/CheckinPage';
import { TodayPage } from '../pages/TodayPage';

// ─── Inline helpers ───

async function clearAllData(page: Page) {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
    const req = indexedDB.deleteDatabase('FitnessAppDB');
    return new Promise<void>((resolve, reject) => {
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
      req.onblocked = () => resolve();
    });
  });
}

async function markOnboardingCompleted(page: Page) {
  await page.evaluate(() => {
    localStorage.setItem('fitness-tracker-onboarding-v1', JSON.stringify({ completed: true, completedAt: Date.now() }));
  });
}

async function setCheckinTier(page: Page, tier: 'full' | 'medium' | 'light') {
  await page.evaluate(async (tierValue) => {
    const { saveSetting } = await import('/js/core/storage.js');
    await saveSetting('checkinTier', tierValue);
  }, tier);
}

// ─── Tests ───

test.describe('Checkin', () => {
  test.beforeEach(async ({ page }) => {
    await clearAllData(page);
    await markOnboardingCompleted(page);
  });

  test('Checkin — full tier submission → recovery score updates', async ({ page }) => {
    const checkin = new CheckinPage(page);
    const today = new TodayPage(page);

    await test.step('Set full tier and load app', async () => {
      await setCheckinTier(page, 'full');
      await page.goto('/');
      await page.waitForFunction(() => !!document.querySelector('.bottom-nav'));
    });

    await test.step('Navigate to Log page and open check-in form', async () => {
      await checkin.goto();
      await checkin.form.waitFor({ state: 'visible', timeout: 5000 });
    });

    await test.step('Fill full tier metrics', async () => {
      await checkin.weightInput.fill('75');
      await checkin.rhrInput.fill('58');
      await checkin.hrvInput.fill('65');
      await checkin.sleepInput.fill('7.5');
      await checkin.setScaleValue(checkin.sorenessSlider, 2);
    });

    await test.step('Submit check-in and verify success', async () => {
      await checkin.submitButton.click();
      await checkin.successMessage.waitFor({ state: 'visible', timeout: 5000 });
    });

    await test.step('Verify recovery score appears on Today page', async () => {
      await today.goto();
      const score = await today.getRecoveryScore();
      expect(score).not.toBeNull();
      expect(score).toBeGreaterThan(0);
    });
  });

  test('Checkin — medium tier submission → recovery score updates', async ({ page }) => {
    const checkin = new CheckinPage(page);
    const today = new TodayPage(page);

    await test.step('Set medium tier and load app', async () => {
      await setCheckinTier(page, 'medium');
      await page.goto('/');
      await page.waitForFunction(() => !!document.querySelector('.bottom-nav'));
    });

    await test.step('Navigate to Log page and open check-in form', async () => {
      await checkin.goto();
      await checkin.form.waitFor({ state: 'visible', timeout: 5000 });
    });

    await test.step('Fill medium tier metrics (no HRV field expected)', async () => {
      await checkin.weightInput.fill('76');
      await checkin.rhrInput.fill('62');
      // HRV input should not exist in medium tier
      const hrvVisible = await checkin.hrvInput.isVisible().catch(() => false);
      expect(hrvVisible).toBe(false);
      await checkin.setScaleValue(checkin.sorenessSlider, 3);
    });

    await test.step('Submit and verify recovery score updates', async () => {
      await checkin.submitButton.click();
      await checkin.successMessage.waitFor({ state: 'visible', timeout: 5000 });
      await today.goto();
      const score = await today.getRecoveryScore();
      expect(score).not.toBeNull();
      expect(score).toBeGreaterThan(0);
    });
  });

  test('Checkin — light tier submission → recovery score updates', async ({ page }) => {
    const checkin = new CheckinPage(page);
    const today = new TodayPage(page);

    await test.step('Set light tier and load app', async () => {
      await setCheckinTier(page, 'light');
      await page.goto('/');
      await page.waitForFunction(() => !!document.querySelector('.bottom-nav'));
    });

    await test.step('Navigate to Log page and open check-in form', async () => {
      await checkin.goto();
      await checkin.form.waitFor({ state: 'visible', timeout: 5000 });
    });

    await test.step('Fill light tier metrics (weight + soreness only)', async () => {
      await checkin.weightInput.fill('74');
      // RHR and HRV inputs should not exist in light tier
      const rhrVisible = await checkin.rhrInput.isVisible().catch(() => false);
      const hrvVisible = await checkin.hrvInput.isVisible().catch(() => false);
      expect(rhrVisible).toBe(false);
      expect(hrvVisible).toBe(false);
      await checkin.setScaleValue(checkin.sorenessSlider, 2);
    });

    await test.step('Submit and verify recovery score updates', async () => {
      await checkin.submitButton.click();
      await checkin.successMessage.waitFor({ state: 'visible', timeout: 5000 });
      await today.goto();
      const score = await today.getRecoveryScore();
      expect(score).not.toBeNull();
      expect(score).toBeGreaterThan(0);
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

    await test.step('Seed 3 days of check-in history', async () => {
      await page.evaluate(async () => {
        const { saveCheckin } = await import('/js/core/storage.js');
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
      await checkin.weightInput.fill('75');
      await checkin.rhrInput.fill('60');
      await checkin.hrvInput.fill('60');
      await checkin.sleepInput.fill('8');
      await checkin.setScaleValue(checkin.sorenessSlider, 2);
      await checkin.submitButton.click();
      await checkin.successMessage.waitFor({ state: 'visible', timeout: 5000 });
    });

    await test.step('Verify trend indicators are visible', async () => {
      await checkin.goto();
      await checkin.form.waitFor({ state: 'visible', timeout: 5000 });
      // TrendIndicator or sparkline rows should be present when history exists
      const hasTrend = await page.locator('.trend-indicator, .checkin-sparkline-row').first().isVisible().catch(() => false);
      expect(hasTrend).toBe(true);
    });
  });
});
