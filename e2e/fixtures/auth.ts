// e2e/fixtures/auth.ts
// Guest mode helpers for Playwright E2E tests.

import type { Page } from '@playwright/test';

// ── Enter guest mode ─────────────────────────────────────────────────────────

/**
 * Navigates to the app with a clean state so that guest mode auto-triggers.
 * Guest mode is entered when:
 *   - IndexedDB has no sessions or checkins
 *   - onboarding is not completed
 *   - localStorage onboarding flag is absent
 *
 * This helper clears storage and reloads the page.
 */
export async function enterGuestMode(page: Page): Promise<void> {
  // Clear all app data via page context
  await page.evaluate(async () => {
    // Clear all IndexedDB databases
    const dbs = await window.indexedDB.databases();
    for (const dbInfo of dbs) {
      if (dbInfo.name) {
        window.indexedDB.deleteDatabase(dbInfo.name);
      }
    }

    // Clear localStorage
    const lsKeys = Object.keys(localStorage).filter((k) => k.startsWith('fitness-tracker'));
    lsKeys.forEach((k) => localStorage.removeItem(k));

    // Clear sessionStorage
    const ssKeys = Object.keys(sessionStorage).filter((k) => k.startsWith('fitness-tracker'));
    ssKeys.forEach((k) => sessionStorage.removeItem(k));
  });

  // Reload so the app boots into guest mode
  await page.reload();
  await page.waitForLoadState('networkidle');
}

// ── Check guest mode state ───────────────────────────────────────────────────

/**
 * Returns true if the guest mode badge is visible on the page.
 * NOTE: relies on the `.guest-badge` CSS class.
 *       Expected data-testid: `data-testid="guest-badge"`
 */
export async function isGuestMode(page: Page): Promise<boolean> {
  const badge = page.locator('.guest-badge');
  // Fallback to data-testid if/when added to app
  const testidBadge = page.locator('[data-testid="guest-badge"]');
  return (await badge.isVisible().catch(() => false)) || (await testidBadge.isVisible().catch(() => false));
}

// ── Exit guest mode ──────────────────────────────────────────────────────────

/**
 * Triggers onboarding from guest mode by clicking the
 * "Начать трекинг" (Start Tracking) button.
 * This clears guest session data and opens the onboarding wizard.
 *
 * NOTE: relies on the button text and `.btn-accent` class.
 *       Expected data-testid: `data-testid="start-tracking-btn"`
 */
export async function exitGuestMode(page: Page): Promise<void> {
  // Try data-testid first, then fallback to text + class
  const byTestId = page.locator('[data-testid="start-tracking-btn"]');
  const byText = page.locator('button:has-text("Начать трекинг")');
  const byClass = page.locator('.btn-accent:has-text("Начать трекинг")');

  const btn =
    (await byTestId.isVisible().catch(() => false))
      ? byTestId
      : (await byText.isVisible().catch(() => false))
        ? byText
        : byClass;

  await btn.click();

  // Wait for onboarding wizard to appear
  await page.waitForSelector('.onboarding-overlay, [data-testid="onboarding-overlay"]', {
    state: 'visible',
    timeout: 5000,
  });
}
