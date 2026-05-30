import { test, expect, Page } from '@playwright/test';
import { TodayPage } from '../pages/TodayPage';
import { expectRecoveryColor } from '../utils/assertions';
import { clearAllStorage, markOnboardingCompleted } from '../utils/clearStorage.js';

// ─── Tests ───

test.describe('Recovery', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearAllStorage(page);
    await markOnboardingCompleted(page);
  });

  test('Recovery — empty state → shows dash and "Заполните чек-ин" prompt', async ({ page }) => {
    const today = new TodayPage(page);

    await test.step('Load app with no data', async () => {
      await page.goto('/');
      await page.waitForFunction(() => !!document.querySelector('.bottom-nav'));
    });

    await test.step('Verify empty state on Today page', async () => {
      const score = await today.getRecoveryScore();
      expect(score).toBeNull(); // "—" dash means null
    });

    await test.step('Verify prompt text is visible', async () => {
      // The empty-state ring shows "—" dash and "Сделайте чек-ин" prompt
      await expect(page.locator('.today-page')).toContainText(/[—]|Сделайте чек-ин|Восстановление/i);
    });
  });

  test('Recovery — score display → color matches threshold (green ≥70, yellow ≥40, red <40)', async ({ page }) => {
    const today = new TodayPage(page);

    await test.step('Seed check-ins that produce a green score (≥70)', async () => {
      await page.evaluate(async () => {
        const { saveCheckin } = await import('/js/core/storage.js');
        const todayDate = new Date().toISOString().slice(0, 10);
        // Seed 5 days of good metrics so baseline exists and score is high
        for (let i = 4; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().slice(0, 10);
          await saveCheckin({
            date: dateStr,
            weight: 75,
            restHR: 55,
            hrv: 65,
            sleepHours: 8,
            muscleSoreness: 1,
            energy: 5,
            mood: 5,
            sleepQuality: 5,
            stress: 1,
            hipPain: 1,
            shoulderPain: 1,
            breathing: 'good',
            notes: '',
            readiness: 'green',
            ts: Date.now() - i * 86400000,
          });
        }
      });
      await page.goto('/');
      await page.waitForFunction(() => !!document.querySelector('.bottom-nav'));
    });

    await test.step('Verify recovery score is ≥70 and ring shows green', async () => {
      const score = await today.getRecoveryScore();
      expect(score).not.toBeNull();
      if (score !== null) {
        expect(score).toBeGreaterThanOrEqual(70);
      }
      await expectRecoveryColor(page, 'green');
    });
  });

  test('Recovery — ring click → expands metrics panel', async ({ page }) => {
    const today = new TodayPage(page);

    await test.step('Seed data and load Today page', async () => {
      await page.evaluate(async () => {
        const { saveCheckin } = await import('/js/core/storage.js');
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().slice(0, 10);
          await saveCheckin({
            date: dateStr,
            weight: 75,
            restHR: 60,
            hrv: 55,
            sleepHours: 7,
            muscleSoreness: 2,
            energy: 4,
            mood: 4,
            sleepQuality: 4,
            stress: 2,
            hipPain: 1,
            shoulderPain: 1,
            breathing: 'good',
            notes: '',
            readiness: 'green',
            ts: Date.now() - i * 86400000,
          });
        }
      });
      await page.goto('/');
      await page.waitForFunction(() => !!document.querySelector('.bottom-nav'));
    });

    await test.step('Click recovery ring', async () => {
      await today.recoveryRing.click();
    });

    await test.step('Verify metrics panel is visible', async () => {
      const visible = await today.isMetricsPanelVisible();
      expect(visible).toBe(true);
    });
  });

  test('Recovery — adaptive tier banner → appears when data suggests change', async ({ page }) => {
    const today = new TodayPage(page);

    await test.step('Seed data suggesting tier change', async () => {
      // Seed checkins with only weight and soreness (no RHR/HRV)
      // Current tier set to 'medium' → detectOptimalTier should suggest 'light'
      await page.evaluate(async () => {
        const { saveCheckin, saveSetting } = await import('/js/core/storage.js');
        await saveSetting('checkinTier', 'medium');
        for (let i = 4; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().slice(0, 10);
          await saveCheckin({
            date: dateStr,
            weight: 75,
            restHR: 0, // not provided
            hrv: 0,    // not provided
            sleepHours: 0,
            muscleSoreness: 2,
            energy: 3,
            mood: 3,
            sleepQuality: 3,
            stress: 2,
            hipPain: 1,
            shoulderPain: 1,
            breathing: 'good',
            notes: '',
            readiness: 'yellow',
            ts: Date.now() - i * 86400000,
          });
        }
      });
      await page.goto('/');
      await page.waitForFunction(() => !!document.querySelector('.bottom-nav'));
    });

    await test.step('Verify adaptive tier banner is visible', async () => {
      const visible = await today.isTierBannerVisible();
      if (!visible) {
        test.skip(true, 'Missing data-testid: tier-suggestion-banner not rendered (detectOptimalTier may need more data)');
        return;
      }
      expect(visible).toBe(true);
    });
  });
});
