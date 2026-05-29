import { test, expect, Page } from '@playwright/test';
import { OnboardingPage } from '../pages/OnboardingPage';
import { TodayPage } from '../pages/TodayPage';
import { clearAllStorage } from '../utils/clearStorage.js';

async function ensureOnboardingShows(page: Page) {
  // Onboarding shows when: hasExistingData === true AND onboardingCompleted === false
  // Guest mode is skipped when hasExistingData === true
  await clearAllStorage(page);

  // Seed 1 checkin so app sees existing data → no guest mode
  await page.evaluate(async () => {
    const { saveCheckin } = await import('/js/core/storage.js');
    const today = new Date().toISOString().slice(0, 10);
    await saveCheckin({
      date: today,
      weight: 70,
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
      ts: Date.now(),
    });
  });

  // Remove onboarding completion flag
  await page.evaluate(() => {
    localStorage.removeItem('fitness-tracker-onboarding-v1');
  });

  await page.reload();
  await page.waitForFunction(() => !!document.querySelector('.bottom-nav'));
  await page.waitForTimeout(300);
}

// ─── Tests ───

test.describe('Onboarding', () => {
  test('Onboarding — complete 5-step flow → app initializes with selected settings', async ({ page }) => {
    const onboarding = new OnboardingPage(page);
    const today = new TodayPage(page);

    await test.step('Clear data and set up so onboarding appears', async () => {
      await ensureOnboardingShows(page);
      await expect(onboarding.overlay).toBeVisible({ timeout: 5000 });
    });

    await test.step('Step 1: Start onboarding', async () => {
      await onboarding.valueStep.waitFor({ state: 'visible' });
      await page.locator('.onboarding-content--value .btn-accent').click();
      await expect(onboarding.goalStep).toBeVisible();
    });

    await test.step('Step 2: Select goal and training days', async () => {
      const goalCard = onboarding.goalOptions.filter({ hasText: /Набрать форму/i });
      await goalCard.click();
      await onboarding.dayChips.filter({ hasText: 'Пн' }).click();
      await onboarding.dayChips.filter({ hasText: 'Ср' }).click();
      await onboarding.dayChips.filter({ hasText: 'Пт' }).click();
      await onboarding.nextButton.click();
      await expect(onboarding.sportsStep).toBeVisible();
    });

    await test.step('Step 3: Select sports', async () => {
      await onboarding.sportChips.filter({ hasText: /Бег/i }).click();
      await onboarding.nextButton.click();
      await expect(onboarding.gadgetsStep).toBeVisible();
    });

    await test.step('Step 4: Select gadgets', async () => {
      await onboarding.gadgetCards.filter({ hasText: /Смарт-часы/i }).click();
      await onboarding.nextButton.click();
      await expect(onboarding.recoveryStep).toBeVisible();
    });

    await test.step('Step 5: Complete onboarding', async () => {
      await onboarding.finishButton.click();
      await onboarding.overlay.waitFor({ state: 'hidden', timeout: 5000 });
    });

    await test.step('Verify app shows Today page with settings applied', async () => {
      await expect(page.locator('.today-page')).toBeVisible();
      // Verify onboarding is marked completed in localStorage
      const onboardingCompleted = await page.evaluate(() => {
        const raw = localStorage.getItem('fitness-tracker-onboarding-v1');
        if (!raw) return false;
        try {
          const state = JSON.parse(raw);
          return state.completed === true;
        } catch {
          return false;
        }
      });
      expect(onboardingCompleted).toBe(true);
    });
  });

  test('Onboarding — close wizard → returns to landing state', async ({ page }) => {
    const onboarding = new OnboardingPage(page);

    await test.step('Advance to step 2', async () => {
      await ensureOnboardingShows(page);
      await onboarding.valueStep.waitFor({ state: 'visible' });
      await page.locator('.onboarding-content--value .btn-accent').click();
      await expect(onboarding.goalStep).toBeVisible();
    });

    await test.step('Click close button', async () => {
      await onboarding.closeButton.click();
      await onboarding.overlay.waitFor({ state: 'hidden', timeout: 5000 });
    });

    await test.step('Verify Today page is visible', async () => {
      await expect(page.locator('.today-page')).toBeVisible();
    });
  });

  test('Onboarding — step validation → cannot advance without required selection', async ({ page }) => {
    const onboarding = new OnboardingPage(page);

    await test.step('Advance to step 2 (Goal)', async () => {
      await ensureOnboardingShows(page);
      await onboarding.valueStep.waitFor({ state: 'visible' });
      await page.locator('.onboarding-content--value .btn-accent').click();
      await expect(onboarding.goalStep).toBeVisible();
    });

    await test.step('Try to advance without selecting goal or days', async () => {
      const canProceed = await onboarding.canAdvance();
      expect(canProceed).toBe(false);
    });

    await test.step('Select goal and day — advance button should enable', async () => {
      await onboarding.goalOptions.filter({ hasText: /Стать сильнее/i }).click();
      await onboarding.dayChips.filter({ hasText: 'Пн' }).click();
      const canProceed = await onboarding.canAdvance();
      expect(canProceed).toBe(true);
    });
  });

  test('Onboarding — gadget selection → auto-detects correct tier', async ({ page }) => {
    const onboarding = new OnboardingPage(page);

    await test.step('Complete steps 1–3 to reach gadget step', async () => {
      await ensureOnboardingShows(page);
      await onboarding.valueStep.waitFor({ state: 'visible' });
      await page.locator('.onboarding-content--value .btn-accent').click();
      await expect(onboarding.goalStep).toBeVisible();

      await onboarding.goalOptions.filter({ hasText: /Похудеть/i }).click();
      await onboarding.dayChips.filter({ hasText: 'Пн' }).click();
      await onboarding.nextButton.click();
      await expect(onboarding.sportsStep).toBeVisible();

      await onboarding.sportChips.filter({ hasText: /Бег/i }).click();
      await onboarding.nextButton.click();
      await expect(onboarding.gadgetsStep).toBeVisible();
    });

    await test.step('Select HRV monitor → tier should be full', async () => {
      await onboarding.gadgetCards.filter({ hasText: /HRV-монитор/i }).click();
      const tierText = await page.locator('.onboarding-tier-value').textContent();
      expect(tierText).toContain('Полный');
    });

    await test.step('Switch to smart watch only → tier should be medium', async () => {
      // Deselect HRV monitor and select smart watch
      await onboarding.gadgetCards.filter({ hasText: /HRV-монитор/i }).click();
      await onboarding.gadgetCards.filter({ hasText: /Смарт-часы/i }).click();
      const tierText = await page.locator('.onboarding-tier-value').textContent();
      expect(tierText).toContain('Средний');
    });

    await test.step('Switch to manual → tier should be light', async () => {
      await onboarding.gadgetCards.filter({ hasText: /Смарт-часы/i }).click();
      await onboarding.gadgetCards.filter({ hasText: /Ручной ввод/i }).click();
      const tierText = await page.locator('.onboarding-tier-value').textContent();
      expect(tierText).toContain('Лёгкий');
    });
  });
});
