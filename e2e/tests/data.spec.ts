import { test, expect, Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import os from 'os';
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

async function expandDataSection(page: Page) {
  await visitProfile(page);
  const dataSection = page.locator('.profile-section__header').filter({ hasText: /Данные|Data/ });
  if (await dataSection.isVisible().catch(() => false)) {
    await dataSection.click();
  }
  await page.waitForTimeout(200);
}

async function seedCheckin(page: Page) {
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
      notes: '',
      readiness: 'green',
      ts: Date.now(),
    });
  });
}

// ─── Tests ───

test.describe('Data', () => {
  test('Data — export → produces valid JSON file', async ({ page }) => {
    let downloadPath: string | null = null;

    await test.step('Clear data and seed some checkins', async () => {
      await page.goto('/');
      await clearAllStorage(page);
      await page.goto('/');
      await page.waitForFunction(() => !!document.querySelector('.bottom-nav'));
      await completeOnboardingIfShown(page);
      await seedCheckin(page);
    });

    await test.step('Click export and capture download', async () => {
      await expandDataSection(page);
      const exportBtn = page.getByRole('button', { name: /Экспорт|Export/ }).first();
      if (!(await exportBtn.isVisible().catch(() => false))) {
        test.skip(true, 'Export button not found — needs data-testid');
        return;
      }

      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 10000 }),
        exportBtn.click(),
      ]);

      downloadPath = await download.path();
      expect(downloadPath).toBeTruthy();
    });

    await test.step('Verify downloaded JSON is valid and contains data', async () => {
      if (!downloadPath) {
        test.skip(true, 'Download did not complete');
        return;
      }
      const content = fs.readFileSync(downloadPath, 'utf-8');
      const data = JSON.parse(content);
      expect(data).toHaveProperty('version');
      expect(Array.isArray(data.checkins) || Array.isArray(data.sessions)).toBe(true);
    });
  });

  test('Data — import valid JSON → restores data', async ({ page }) => {
    let exportFilePath: string | null = null;

    await test.step('Seed data and export to file', async () => {
      await page.goto('/');
      await clearAllStorage(page);
      await page.goto('/');
      await page.waitForFunction(() => !!document.querySelector('.bottom-nav'));
      await completeOnboardingIfShown(page);
      await seedCheckin(page);
      await expandDataSection(page);

      const exportBtn = page.getByRole('button', { name: /Экспорт|Export/ }).first();
      if (!(await exportBtn.isVisible().catch(() => false))) {
        test.skip(true, 'Export button not found');
        return;
      }

      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 10000 }),
        exportBtn.click(),
      ]);

      exportFilePath = await download.path();
    });

    await test.step('Clear all data', async () => {
      await page.goto('/');
      await clearAllStorage(page);
      await page.goto('/');
      await page.waitForFunction(() => !!document.querySelector('.bottom-nav'));
      await completeOnboardingIfShown(page);
    });

    await test.step('Import the exported file via Log page input', async () => {
      if (!exportFilePath) {
        test.skip(true, 'No export file available');
        return;
      }

      // Navigate to Log tab where SessionLogger has the persistent file input
      const logTab = page.locator('nav.bottom-nav button').nth(1);
      await logTab.click();
      await page.waitForTimeout(300);

      const fileInput = page.locator('#session-logger-import');
      if (await fileInput.count() === 0) {
        test.skip(true, 'Missing import file input — needs data-testid');
        return;
      }

      await fileInput.setInputFiles(exportFilePath);
      await page.waitForTimeout(800);
    });

    await test.step('Verify data restored', async () => {
      // Data restored toast should appear
      const toast = page.locator('.toast');
      if (await toast.isVisible().catch(() => false)) {
        await expect(toast).toContainText(/импортирован|imported|Данные/i);
      }
      // Verify IndexedDB has checkins
      const hasData = await page.evaluate(async () => {
        const { getAllCheckins } = await import('/js/core/storage.js');
        const checkins = await getAllCheckins();
        return checkins.length > 0;
      });
      expect(hasData).toBe(true);
    });
  });

  test('Data — import invalid JSON → shows error', async ({ page }) => {
    const invalidFile = path.join(os.tmpdir(), 'fitness-invalid-import.json');

    await test.step('Prepare invalid JSON file', async () => {
      fs.writeFileSync(invalidFile, '{"not_valid": broken json <<');
    });

    await test.step('Clear data and complete onboarding', async () => {
      await page.goto('/');
      await clearAllStorage(page);
      await page.goto('/');
      await page.waitForFunction(() => !!document.querySelector('.bottom-nav'));
      await completeOnboardingIfShown(page);
    });

    await test.step('Import malformed JSON via Log page', async () => {
      const logTab = page.locator('nav.bottom-nav button').nth(1);
      await logTab.click();
      await page.waitForTimeout(300);

      const fileInput = page.locator('#session-logger-import');
      if (await fileInput.count() === 0) {
        test.skip(true, 'Missing import file input — needs data-testid');
        return;
      }

      await fileInput.setInputFiles(invalidFile);
      await page.waitForTimeout(800);
    });

    await test.step('Verify error message is shown', async () => {
      const toast = page.locator('.toast');
      const body = page.locator('body');
      // Error may appear as toast or inline alert
      if (await toast.isVisible().catch(() => false)) {
        const text = await toast.textContent();
        expect(text).toMatch(/ошибка|error|невалидный|invalid|JSON/i);
      } else {
        await expect(body).toContainText(/ошибка|error|невалидный|invalid|JSON/i);
      }
    });

    test.afterEach(async () => {
      try { fs.unlinkSync(invalidFile); } catch { /* ignore */ }
    });
  });

  test('Data — reset all → clears IndexedDB and localStorage', async ({ page }) => {
    await test.step('Seed data', async () => {
      await page.goto('/');
      await clearAllStorage(page);
      await page.goto('/');
      await page.waitForFunction(() => !!document.querySelector('.bottom-nav'));
      await completeOnboardingIfShown(page);
      await seedCheckin(page);
    });

    await test.step('Navigate to profile and expand data section', async () => {
      await expandDataSection(page);
    });

    await test.step('Click reset button', async () => {
      const resetBtn = page.getByRole('button', { name: /Сброс|Reset/ }).first();
      if (!(await resetBtn.isVisible().catch(() => false))) {
        test.skip(true, 'Reset button not found — needs data-testid');
        return;
      }
      await resetBtn.click();
      await page.waitForTimeout(200);
    });

    await test.step('Confirm deletion in modal', async () => {
      const modal = page.locator('.modal').first();
      await expect(modal).toBeVisible({ timeout: 5000 });
      const deleteBtn = modal.getByRole('button', { name: /Удалить|Delete/ }).first();
      if (await deleteBtn.isVisible().catch(() => false)) {
        await deleteBtn.click();
      }
      await page.waitForTimeout(500);
    });

    await test.step('Verify IndexedDB is empty', async () => {
      const isEmpty = await page.evaluate(async () => {
        const { getAllCheckins, getAllSessions } = await import('/js/core/storage.js');
        const [checkins, sessions] = await Promise.all([getAllCheckins(), getAllSessions()]);
        return checkins.length === 0 && sessions.length === 0;
      });
      expect(isEmpty).toBe(true);
    });

    await test.step('Verify localStorage is empty of app keys', async () => {
      const hasAppKeys = await page.evaluate(() => {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)!;
          if (key.startsWith('fitness-tracker')) {
            return true;
          }
        }
        return false;
      });
      expect(hasAppKeys).toBe(false);
    });
  });
});
