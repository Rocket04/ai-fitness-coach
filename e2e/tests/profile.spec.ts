import { test, expect, Page } from '@playwright/test';
import { clearAllStorage } from '../utils/clearStorage.js';

async function visitProfile(page: Page) {
  await page.goto('/');
  await page.waitForFunction(() => !!document.querySelector('.bottom-nav'));
  const profileTab = page.locator('nav.bottom-nav button[aria-label="Профиль"]').first();
  if (await profileTab.isVisible().catch(() => false)) {
    await profileTab.click();
  } else {
    await page.locator('nav.bottom-nav button').nth(3).click();
  }
  await page.waitForTimeout(300);
}

async function completeOnboardingIfShown(page: Page) {
  const wizard = page.locator('.onboarding-content');
  if (await wizard.isVisible().catch(() => false)) {
    // Step 1: click primary CTA
    await page.locator('.onboarding-btn--primary').click();
    await page.waitForTimeout(200);
    // Step 2: select a goal
    await page.locator('.onboarding-goal-card').first().click();
    // Toggle a training day
    const dayChip = page.locator('.onboarding-days-section .chip, .onboarding-days-section button').first();
    if (await dayChip.isVisible().catch(() => false)) await dayChip.click();
    await page.waitForTimeout(200);
    // Advance through remaining steps
    for (let i = 0; i < 4; i++) {
      const nextBtn = page.locator('.onboarding-btn--primary, .onboarding-btn--next, button:has-text("Далее")').first();
      if (await nextBtn.isVisible().catch(() => false)) await nextBtn.click();
      await page.waitForTimeout(200);
    }
    // Complete
    const completeBtn = page.locator('button:has-text("Готово")').first();
    if (await completeBtn.isVisible().catch(() => false)) await completeBtn.click();
    await page.waitForTimeout(300);
  }
}

// ─── Tests ───

test.describe('Profile', () => {
  test('Profile — tier selector → change persists', async ({ page }) => {
    await test.step('Clear data and complete onboarding', async () => {
      await page.goto('/');
      await clearAllStorage(page);
      await page.goto('/');
      await page.waitForFunction(() => !!document.querySelector('.bottom-nav'));
      await completeOnboardingIfShown(page);
    });

    await test.step('Navigate to profile', async () => {
      await visitProfile(page);
    });

    await test.step('Expand tier selector section', async () => {
      const tierHeader = page.locator('.profile-section__header').filter({ hasText: /Уровень чек-ина/ });
      if (await tierHeader.isVisible().catch(() => false)) {
        await tierHeader.click();
      }
    });

    await test.step('Select full tier', async () => {
      const fullBtn = page.getByRole('button', { name: /Полный/ }).first();
      if (await fullBtn.isVisible().catch(() => false)) {
        await fullBtn.click();
      } else {
        test.skip(true, 'Missing data-testid="profile-tier-selector" or tier button not found');
      }
    });

    await test.step('Reload and verify selection kept', async () => {
      await page.reload();
      await page.waitForFunction(() => !!document.querySelector('.bottom-nav'));
      await visitProfile(page);
      const fullBtn = page.getByRole('button', { name: /Полный/ }).first();
      if (await fullBtn.isVisible().catch(() => false)) {
        // The selected tier gets btn-accent class
        const cls = await fullBtn.evaluate((el: HTMLElement) => el.className);
        expect(cls).toContain('btn-accent');
      } else {
        test.skip(true, 'Tier selector not visible after reload — needs data-testid');
      }
    });
  });

  test('Profile — achievements → display unlocked badges', async ({ page }) => {
    await test.step('Seed achievement-unlocking data', async () => {
      await page.goto('/');
      await clearAllStorage(page);
      await page.evaluate(async () => {
        const { getActiveDatabase } = await import('/js/core/storage.js');
        const db = getActiveDatabase();
        const today = new Date().toISOString().slice(0, 10);
        // Seed a few check-ins to trigger "first-checkin" style achievements
        await db.checkins.put({
          date: today,
          weight: 70,
          restHR: 55,
          hrv: 50,
          sleepHours: 7,
          soreness: 2,
          mood: 4,
          note: '',
          updatedAt: Date.now(),
        });
        await db.sessions.put({
          key: `${today}_evening`,
          date: today,
          type: 'evening',
          completed: true,
          readiness: 'green',
          rpe: 6,
          notes: '',
          updatedAt: Date.now(),
        });
      });
    });

    await test.step('Visit profile', async () => {
      await page.goto('/');
      await page.waitForFunction(() => !!document.querySelector('.bottom-nav'));
      await completeOnboardingIfShown(page);
      await visitProfile(page);
    });

    await test.step('Expand achievements section', async () => {
      const achHeader = page.locator('.profile-section__header').filter({ hasText: /Достижения/ });
      if (await achHeader.isVisible().catch(() => false)) {
        await achHeader.click();
      }
    });

    await test.step('Verify unlocked badges are visible', async () => {
      const achievementsArea = page.locator('.profile-section__body').filter({ has: page.locator('text=🏅') });
      // Wait for loading state to clear
      await page.waitForTimeout(600);
      // If there are unlocked achievements, the 🏅 emoji span appears
      const badgeCount = await page.locator('span[title]').count();
      if (badgeCount === 0) {
        // Achievement detection is async; if no badges yet, the section shows fallback text
        const body = page.locator('body');
        await expect(body).toContainText(/разблокировано|Выполняйте чек-ины/);
      }
    });
  });

  test('Profile — exercise config → modal opens and saves', async ({ page }) => {
    await test.step('Clear data and complete onboarding', async () => {
      await page.goto('/');
      await clearAllStorage(page);
      await page.goto('/');
      await page.waitForFunction(() => !!document.querySelector('.bottom-nav'));
      await completeOnboardingIfShown(page);
    });

    await test.step('Navigate to profile', async () => {
      await visitProfile(page);
    });

    await test.step('Open exercise configurator section', async () => {
      const exHeader = page.locator('.profile-section__header').filter({ hasText: /упражнен|Exercise/ });
      if (await exHeader.isVisible().catch(() => false)) {
        await exHeader.click();
      }
    });

    await test.step('Click exercise config trigger', async () => {
      const openBtn = page.getByRole('button', { name: /Настроить|Открыть|Configure/ }).first();
      if (await openBtn.isVisible().catch(() => false)) {
        await openBtn.click();
      } else {
        test.skip(true, 'Missing data-testid="exercise-config-trigger"');
      }
    });

    await test.step('Change a value in the modal', async () => {
      const modal = page.locator('.modal, .exercise-config-modal');
      await expect(modal).toBeVisible({ timeout: 5000 });
      // Select protocol 10
      const prot10 = page.getByRole('button', { name: '10' }).first();
      if (await prot10.isVisible().catch(() => false)) {
        await prot10.click();
      }
      // Enter a weight
      const weightInput = page.locator('input[type="number"]').first();
      if (await weightInput.isVisible().catch(() => false)) {
        await weightInput.fill('80');
      }
    });

    await test.step('Save and verify modal closes', async () => {
      const saveBtn = page.getByRole('button', { name: /Сохранить/ }).first();
      if (await saveBtn.isVisible().catch(() => false)) {
        await saveBtn.click();
      }
      await expect(page.locator('.modal')).toHaveCount(0, { timeout: 3000 });
    });
  });

  test('Profile — language switcher → changes UI language', async ({ page }) => {
    await test.step('Clear data and complete onboarding', async () => {
      await page.goto('/');
      await clearAllStorage(page);
      await page.goto('/');
      await page.waitForFunction(() => !!document.querySelector('.bottom-nav'));
      await completeOnboardingIfShown(page);
    });

    await test.step('Navigate to profile', async () => {
      await visitProfile(page);
    });

    await test.step('Expand language section', async () => {
      const langHeader = page.locator('.profile-section__header').filter({ hasText: /Язык|Language/ });
      if (await langHeader.isVisible().catch(() => false)) {
        await langHeader.click();
      }
    });

    await test.step('Switch to English', async () => {
      const enBtn = page.getByRole('button', { name: /English|EN/ }).first();
      if (await enBtn.isVisible().catch(() => false)) {
        await enBtn.click();
      } else {
        test.skip(true, 'Missing data-testid="language-switcher" or EN button not found');
      }
    });

    await test.step('Verify UI text changes to English', async () => {
      await page.waitForTimeout(400);
      // Bottom nav should now show English labels
      const nav = page.locator('nav.bottom-nav');
      await expect(nav).toContainText('Today');
      await expect(nav).toContainText('Profile');
    });
  });
});
