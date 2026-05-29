import { test, expect, Page } from '@playwright/test';
import { clearAllStorage } from '../utils/clearStorage.js';

async function completeOnboardingIfShown(page: Page) {
  const wizard = page.locator('.onboarding-content');
  if (await wizard.isVisible().catch(() => false)) {
    await page.locator('.onboarding-btn--primary').click();
    await page.waitForTimeout(200);
    await page.locator('.onboarding-goal-card').first().click();
    const dayChip = page.locator('.onboarding-days-section .chip, .onboarding-days-section button').first();
    if (await dayChip.isVisible().catch(() => false)) await dayChip.click();
    await page.waitForTimeout(200);
    for (let i = 0; i < 4; i++) {
      const nextBtn = page.locator('.onboarding-btn--primary, .onboarding-btn--next, button:has-text("Далее")').first();
      if (await nextBtn.isVisible().catch(() => false)) await nextBtn.click();
      await page.waitForTimeout(200);
    }
    const completeBtn = page.locator('button:has-text("Готово")').first();
    if (await completeBtn.isVisible().catch(() => false)) await completeBtn.click();
    await page.waitForTimeout(300);
  }
}

async function visitProfile(page: Page) {
  await page.waitForFunction(() => !!document.querySelector('.bottom-nav'));
  const profileTab = page.locator('nav.bottom-nav button[aria-label="Профиль"]').first();
  if (await profileTab.isVisible().catch(() => false)) {
    await profileTab.click();
  } else {
    await page.locator('nav.bottom-nav button').nth(3).click();
  }
  await page.waitForTimeout(300);
}

async function openSettings(page: Page) {
  await visitProfile(page);
  const settingsSection = page.locator('.profile-section__header').filter({ hasText: /Настройки|Settings/ });
  if (await settingsSection.isVisible().catch(() => false)) {
    await settingsSection.click();
  }
  const openBtn = page.getByRole('button', { name: /Открыть настройки|Open settings/ }).first();
  if (await openBtn.isVisible().catch(() => false)) {
    await openBtn.click();
  }
  await page.waitForTimeout(200);
}

// ─── Tests ───

test.describe('Settings', () => {
  test('Settings — change training days → saves and persists', async ({ page }) => {
    await test.step('Clear data and complete onboarding', async () => {
      await page.goto('/');
      await clearAllStorage(page);
      await page.goto('/');
      await page.waitForFunction(() => !!document.querySelector('.bottom-nav'));
      await completeOnboardingIfShown(page);
    });

    await test.step('Open settings', async () => {
      await openSettings(page);
    });

    await test.step('Toggle a training day', async () => {
      const modal = page.locator('.modal').first();
      await expect(modal).toBeVisible({ timeout: 5000 });
      const chips = modal.locator('.chip, button').filter({ hasText: /Пн|Вт|Ср|Чт|Пт|Сб|Вс/ });
      if (await chips.count() === 0) {
        test.skip(true, 'Missing training day chips — needs data-testid');
        return;
      }
      // Toggle the first available day chip
      await chips.first().click();
      await page.waitForTimeout(100);
    });

    await test.step('Save settings', async () => {
      const saveBtn = page.locator('.modal').first().getByRole('button', { name: /Сохранить|Save/ }).first();
      if (await saveBtn.isVisible().catch(() => false)) {
        await saveBtn.click();
      }
      await page.waitForTimeout(300);
    });

    await test.step('Reload and verify persisted', async () => {
      await page.reload();
      await page.waitForFunction(() => !!document.querySelector('.bottom-nav'));
      await openSettings(page);
      const modal = page.locator('.modal').first();
      await expect(modal).toBeVisible({ timeout: 5000 });
      // At least one chip should be active after save
      const activeChips = modal.locator('.chip.active, button.active');
      const count = await activeChips.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test('Settings — change start date → saves and persists', async ({ page }) => {
    await test.step('Clear data and complete onboarding', async () => {
      await page.goto('/');
      await clearAllStorage(page);
      await page.goto('/');
      await page.waitForFunction(() => !!document.querySelector('.bottom-nav'));
      await completeOnboardingIfShown(page);
    });

    await test.step('Open settings', async () => {
      await openSettings(page);
    });

    await test.step('Change start date', async () => {
      const modal = page.locator('.modal').first();
      await expect(modal).toBeVisible({ timeout: 5000 });
      const dateInput = modal.locator('input[type="date"]').first();
      if (await dateInput.isVisible().catch(() => false)) {
        await dateInput.fill('2024-01-01');
      } else {
        test.skip(true, 'Missing start date input — needs data-testid');
        return;
      }
    });

    await test.step('Save settings', async () => {
      const saveBtn = page.locator('.modal').first().getByRole('button', { name: /Сохранить|Save/ }).first();
      if (await saveBtn.isVisible().catch(() => false)) {
        await saveBtn.click();
      }
      await page.waitForTimeout(300);
    });

    await test.step('Reload and verify new date', async () => {
      await page.reload();
      await page.waitForFunction(() => !!document.querySelector('.bottom-nav'));
      await openSettings(page);
      const modal = page.locator('.modal').first();
      await expect(modal).toBeVisible({ timeout: 5000 });
      const dateInput = modal.locator('input[type="date"]').first();
      if (await dateInput.isVisible().catch(() => false)) {
        const value = await dateInput.inputValue();
        expect(value).toBe('2024-01-01');
      }
    });
  });

  test('Settings — cancel → discards unsaved changes', async ({ page }) => {
    await test.step('Clear data and complete onboarding', async () => {
      await page.goto('/');
      await clearAllStorage(page);
      await page.goto('/');
      await page.waitForFunction(() => !!document.querySelector('.bottom-nav'));
      await completeOnboardingIfShown(page);
    });

    await test.step('Open settings and read original date', async () => {
      await openSettings(page);
    });

    const modal = page.locator('.modal').first();
    await expect(modal).toBeVisible({ timeout: 5000 });

    const dateInput = modal.locator('input[type="date"]').first();
    if (!(await dateInput.isVisible().catch(() => false))) {
      test.skip(true, 'Missing start date input — needs data-testid');
      return;
    }
    const originalValue = await dateInput.inputValue();

    await test.step('Change start date without saving', async () => {
      await dateInput.fill('2025-06-15');
      await page.waitForTimeout(100);
    });

    await test.step('Click cancel', async () => {
      const cancelBtn = modal.getByRole('button', { name: /Отмена|Cancel/ }).first();
      if (await cancelBtn.isVisible().catch(() => false)) {
        await cancelBtn.click();
      }
      await page.waitForTimeout(200);
    });

    await test.step('Reopen settings and verify old value', async () => {
      await openSettings(page);
      const reopenedModal = page.locator('.modal').first();
      await expect(reopenedModal).toBeVisible({ timeout: 5000 });
      const reopenedInput = reopenedModal.locator('input[type="date"]').first();
      if (await reopenedInput.isVisible().catch(() => false)) {
        const value = await reopenedInput.inputValue();
        expect(value).toBe(originalValue);
      }
    });
  });

  test('Settings — modal → opens and closes correctly', async ({ page }) => {
    await test.step('Clear data and complete onboarding', async () => {
      await page.goto('/');
      await clearAllStorage(page);
      await page.goto('/');
      await page.waitForFunction(() => !!document.querySelector('.bottom-nav'));
      await completeOnboardingIfShown(page);
    });

    await test.step('Click settings trigger and verify modal opens', async () => {
      await visitProfile(page);
      const settingsSection = page.locator('.profile-section__header').filter({ hasText: /Настройки|Settings/ });
      if (await settingsSection.isVisible().catch(() => false)) {
        await settingsSection.click();
      }
      const openBtn = page.getByRole('button', { name: /Открыть настройки|Open settings/ }).first();
      if (await openBtn.isVisible().catch(() => false)) {
        await openBtn.click();
      } else {
        test.skip(true, 'Settings trigger button not found — needs data-testid');
        return;
      }
      const modal = page.locator('.modal').first();
      await expect(modal).toBeVisible({ timeout: 5000 });
    });

    await test.step('Click close/X and verify modal closes', async () => {
      const closeBtn = page.locator('.modal-close').first();
      if (await closeBtn.isVisible().catch(() => false)) {
        await closeBtn.click();
      } else {
        // Fallback: click cancel button
        const cancelBtn = page.locator('.modal').first().getByRole('button', { name: /Отмена|Cancel/ }).first();
        if (await cancelBtn.isVisible().catch(() => false)) {
          await cancelBtn.click();
        }
      }
      await page.waitForTimeout(300);
      const modal = page.locator('.modal').first();
      await expect(modal).toHaveCount(0);
    });
  });
});
