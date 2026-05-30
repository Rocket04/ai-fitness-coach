import { test, expect, Page } from '@playwright/test';
import { clearAllStorage } from '../utils/clearStorage.js';

async function ensureGuestMode(page: Page) {
  // Guest mode auto-activates when no data + onboarding incomplete
  await clearAllStorage(page);
  await page.goto('/');
  await page.waitForFunction(() => !!document.querySelector('.bottom-nav'));
  // Wait a tick for store init
  await page.waitForTimeout(500);
}

async function completeOnboardingFromGuest(page: Page) {
  // Trigger onboarding via "Начать трекинг"
  const startBtn = page.locator('button:has-text("Начать трекинг")');
  if (await startBtn.isVisible().catch(() => false)) {
    await startBtn.click();
  }
  await page.waitForTimeout(300);

  // Walk through wizard
  for (let step = 0; step < 5; step++) {
    const content = page.locator('.onboarding-content');
    if (!(await content.isVisible().catch(() => false))) break;

    // Step 1: primary CTA
    const primary = page.locator('.onboarding-btn--primary').first();
    if (await primary.isVisible().catch(() => false)) {
      await primary.click();
      await page.waitForTimeout(200);
      continue;
    }

    // Goal selection step
    const goalCard = page.locator('.onboarding-goal-card').first();
    if (await goalCard.isVisible().catch(() => false)) {
      await goalCard.click();
      await page.waitForTimeout(100);
    }

    // Training day chip
    const dayChip = page.locator('.onboarding-days-section .chip, .onboarding-days-section button').first();
    if (await dayChip.isVisible().catch(() => false)) await dayChip.click();

    // Advance button
    const nextBtn = page.locator('button:has-text("Далее"), .onboarding-btn--next').first();
    if (await nextBtn.isVisible().catch(() => false)) await nextBtn.click();

    // Complete button on last step
    const doneBtn = page.locator('button:has-text("Готово"), button:has-text("Завершить")').first();
    if (await doneBtn.isVisible().catch(() => false)) await doneBtn.click();

    await page.waitForTimeout(300);
  }
}

// ─── Tests ───

test.describe('Guest', () => {
  test('Guest — badge → displays in guest mode', async ({ page }) => {
    await test.step('Enter guest mode by clearing all data', async () => {
      await ensureGuestMode(page);
    });

    await test.step('Verify guest badge is visible', async () => {
      const badge = page.locator('.guest-badge');
      await expect(badge).toBeVisible({ timeout: 5000 });
      await expect(badge).toContainText('ГОСТЕВОЙ');
    });
  });

  test('Guest — start tracking → triggers onboarding', async ({ page }) => {
    await test.step('Enter guest mode', async () => {
      await ensureGuestMode(page);
    });

    await test.step('Click "Начать трекинг"', async () => {
      const btn = page.locator('button:has-text("Начать трекинг")');
      await expect(btn).toBeVisible({ timeout: 5000 });
      await btn.click();
    });

    await test.step('Verify onboarding wizard opens', async () => {
      const wizard = page.locator('.onboarding-content');
      await expect(wizard).toBeVisible({ timeout: 5000 });
    });
  });

  test('Guest — data persists → in sessionStorage', async ({ page }) => {
    await test.step('Enter guest mode', async () => {
      await ensureGuestMode(page);
    });

    await test.step('Add a check-in as guest', async () => {
      // Navigate to Log tab and add check-in data via UI
      const logTab = page.locator('nav.bottom-nav button').nth(1);
      await logTab.click();
      await page.waitForTimeout(300);

      // Try to submit a simple check-in if form is visible
      const form = page.locator('form, .checkin-form');
      if (await form.isVisible().catch(() => false)) {
        const submit = page.getByRole('button', { name: /Сохранить|Submit/ }).first();
        if (await submit.isVisible().catch(() => false)) {
          // Fill minimal fields
          const inputs = page.locator('input[type="number"]');
          const count = await inputs.count();
          for (let i = 0; i < Math.min(count, 2); i++) {
            await inputs.nth(i).fill('70');
          }
          await submit.click();
          await page.waitForTimeout(400);
        }
      }
    });

    await test.step('Verify data stored in sessionStorage, not localStorage/IndexedDB', async () => {
      const guestKeys = await page.evaluate(() => {
        const keys: string[] = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          keys.push(sessionStorage.key(i)!);
        }
        return keys;
      });
      expect(guestKeys.some(k => k.includes('guest'))).toBe(true);

      const localKeys = await page.evaluate(() => {
        const keys: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          keys.push(localStorage.key(i)!);
        }
        return keys;
      });
      // Guest data should not be in localStorage
      expect(localKeys.some(k => k.includes('guest'))).toBe(false);
    });
  });

  test('Guest — onboarding completion → transitions to tracked mode', async ({ page }) => {
    await test.step('Enter guest mode', async () => {
      await ensureGuestMode(page);
    });

    await test.step('Complete onboarding from guest', async () => {
      await completeOnboardingFromGuest(page);
    });

    await test.step('Verify guest badge disappears', async () => {
      await page.waitForTimeout(600);
      const badge = page.locator('.guest-badge');
      await expect(badge).toHaveCount(0);
    });
  });
});
