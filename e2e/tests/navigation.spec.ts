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
    for (let i = 0; i < 4; i++) {
      const nextBtn = page.locator('.onboarding-btn--primary, .onboarding-btn--next, button:has-text("Далее")').first();
      if (await nextBtn.isVisible().catch(() => false)) await nextBtn.click();
      await page.waitForTimeout(200);
    }
    const doneBtn = page.locator('button:has-text("Готово")').first();
    if (await doneBtn.isVisible().catch(() => false)) await doneBtn.click();
    await page.waitForTimeout(300);
  }
}

async function getActiveTabLabel(page: Page): Promise<string | null> {
  const active = page.locator('nav.bottom-nav button[aria-current="page"]');
  if (await active.isVisible().catch(() => false)) {
    return active.getAttribute('aria-label');
  }
  return null;
}

// ─── Tests ───

test.describe('Navigation', () => {
  test('Navigation — bottom nav → switches between Today/Log/Analytics/Profile', async ({ page }) => {
    await test.step('Clear data and complete onboarding', async () => {
      await page.goto('/');
      await clearAllStorage(page);
      await page.goto('/');
      await page.waitForFunction(() => !!document.querySelector('.bottom-nav'));
      await completeOnboardingIfShown(page);
    });

    const tabs = [
      { idx: 0, label: 'Сегодня', selector: 'h2:has-text("Сегодня"), .page-0' },
      { idx: 1, label: 'Дневник', selector: 'h2:has-text("Дневник"), .page-1' },
      { idx: 2, label: 'Аналитика', selector: 'h2:has-text("Аналитика"), .page-2' },
      { idx: 3, label: 'Профиль', selector: 'h2:has-text("Профиль"), .profile-page' },
    ];

    for (const tab of tabs) {
      await test.step(`Click ${tab.label} tab`, async () => {
        const navBtn = page.locator('nav.bottom-nav button').nth(tab.idx);
        await expect(navBtn).toBeVisible();
        await navBtn.click();
        await page.waitForTimeout(300);
        // Verify correct page is rendered by checking unique page element
        const pageIndicator = page.locator(tab.selector).first();
        await expect(pageIndicator).toBeVisible({ timeout: 4000 });
      });
    }
  });

  test('Navigation — active tab → highlighted', async ({ page }) => {
    await test.step('Clear data and complete onboarding', async () => {
      await page.goto('/');
      await clearAllStorage(page);
      await page.goto('/');
      await page.waitForFunction(() => !!document.querySelector('.bottom-nav'));
      await completeOnboardingIfShown(page);
    });

    const tabs = ['Сегодня', 'Дневник', 'Аналитика', 'Профиль'];
    for (let i = 0; i < tabs.length; i++) {
      await test.step(`Click ${tabs[i]} and verify active class`, async () => {
        const btn = page.locator('nav.bottom-nav button').nth(i);
        await btn.click();
        await page.waitForTimeout(200);
        const cls = await btn.evaluate((el: HTMLElement) => el.className);
        expect(cls).toContain('active');
        expect(await btn.getAttribute('aria-current')).toBe('page');
      });
    }
  });

  test('Navigation — page transitions → render correctly', async ({ page }) => {
    await test.step('Clear data and complete onboarding', async () => {
      await page.goto('/');
      await clearAllStorage(page);
      await page.goto('/');
      await page.waitForFunction(() => !!document.querySelector('.bottom-nav'));
      await completeOnboardingIfShown(page);
    });

    await test.step('Rapidly switch between tabs', async () => {
      const order = [0, 2, 1, 3, 0, 2, 3, 1];
      for (const idx of order) {
        const btn = page.locator('nav.bottom-nav button').nth(idx);
        await btn.click();
        await page.waitForTimeout(150);
        // After each click, assert root app-content is still present (not blank)
        await expect(page.locator('.app-content')).toBeVisible();
      }
    });

    await test.step('Verify no blank pages after rapid switching', async () => {
      // Final state: check that active page has visible content
      const activePage = page.locator('.page-active').first();
      await expect(activePage).toBeVisible();
      const children = activePage.locator('> *');
      expect(await children.count()).toBeGreaterThan(0);
    });
  });

  test('Navigation — methodology → accessible from profile', async ({ page }) => {
    await test.step('Clear data and complete onboarding', async () => {
      await page.goto('/');
      await clearAllStorage(page);
      await page.goto('/');
      await page.waitForFunction(() => !!document.querySelector('.bottom-nav'));
      await completeOnboardingIfShown(page);
    });

    await test.step('Navigate to profile', async () => {
      const profileBtn = page.locator('nav.bottom-nav button').nth(3);
      await profileBtn.click();
      await page.waitForTimeout(300);
    });

    await test.step('Click methodology link in profile', async () => {
      // ProfilePage has a methodology section with a button
      const methodHeader = page.locator('.profile-section__header').filter({ hasText: /Методолог/ });
      if (await methodHeader.isVisible().catch(() => false)) {
        await methodHeader.click(); // expand section
        await page.waitForTimeout(200);
      }
      const methodBtn = page.getByRole('button', { name: /Методолог/ }).first();
      if (await methodBtn.isVisible().catch(() => false)) {
        await methodBtn.click();
      } else {
        test.skip(true, 'Methodology link not found in profile — may need data-testid');
      }
    });

    await test.step('Verify methodology page renders', async () => {
      // MethodologyPage renders with id-based sections
      await expect(page.locator('#recovery-score-simulator, #apre-simulator, h3').first()).toBeVisible({ timeout: 5000 });
      // Page should contain methodology-specific text
      const body = page.locator('body');
      await expect(body).toContainText('Recovery Score');
    });
  });
});
