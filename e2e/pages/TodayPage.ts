// e2e/pages/TodayPage.ts
// Page object for the Today ("Сегодня") tab — main dashboard.

import type { Page, Locator } from '@playwright/test';

export class TodayPage {
  readonly page: Page;

  // ── Locators ─────────────────────────────────────────────────────────────────

  /** Recovery score ring (SVG circle). NOTE: add data-testid="recovery-ring" */
  readonly recoveryRing: Locator;

  /** Status pill below the ring (green/yellow/red). NOTE: add data-testid="status-pill" */
  readonly statusPill: Locator;

  /** Metrics / sparkline panel (tap ring to expand). */
  readonly metricsPanel: Locator;

  /** Training / workout card header. NOTE: add data-testid="training-card" */
  readonly workoutCard: Locator;

  /** Rest day card. NOTE: add data-testid="rest-day-card" */
  readonly restDayCard: Locator;

  /** Tomorrow preview card. */
  readonly tomorrowCard: Locator;

  /** Coach tips panel. */
  readonly coachTipsPanel: Locator;

  /** Weekly 7-day strip. */
  readonly weeklyStrip: Locator;

  /** Adaptive tier suggestion banner. */
  readonly tierBanner: Locator;

  /** Bottom nav "Сегодня" item. */
  readonly navToday: Locator;

  /** Bottom nav "Журнал" item (leads to CheckinForm). */
  readonly navLog: Locator;

  constructor(page: Page) {
    this.page = page;
    this.recoveryRing = page.locator('.hero-ring--large, [data-testid="recovery-ring"]');
    this.statusPill = page.locator('.status-pill, [data-testid="status-pill"]');
    this.metricsPanel = page.locator('.sparkline-card, [data-testid="sparkline-card"]');
    this.workoutCard = page.locator('.training-header, [data-testid="training-card"]');
    this.restDayCard = page.locator('.rest-day-card, [data-testid="rest-day-card"]');
    this.tomorrowCard = page.locator('.tomorrow-card, [data-testid="tomorrow-card"]');
    this.coachTipsPanel = page.locator('.collapsible__header:has-text("Советы"), [data-testid="coach-tips-panel"]');
    this.weeklyStrip = page.locator('.weekly-strip, [data-testid="weekly-strip"]');
    this.tierBanner = page.locator('.tier-suggestion-banner, [data-testid="tier-suggestion-banner"]');
    this.navToday = page.locator('.bottom-nav__item:has-text("Сегодня"), [data-testid="nav-today"]');
    this.navLog = page.locator('.bottom-nav__item:has-text("Журнал"), [data-testid="nav-log"]');
  }

  // ── Navigation ───────────────────────────────────────────────────────────────

  async goto(): Promise<void> {
    await this.navToday.click();
    await this.page.waitForLoadState('networkidle');
  }

  // ── Actions ──────────────────────────────────────────────────────────────────

  /**
   * Reads the recovery score value displayed inside the ring.
   * Returns the numeric score (0-100) or null if the ring shows "—".
   */
  async getRecoveryScore(): Promise<number | null> {
    const ring = this.recoveryRing;
    await ring.waitFor({ state: 'visible', timeout: 5000 });

    // The score is in the <text> element with class readiness-ring__score
    const scoreText = await ring.locator('.readiness-ring__score, text').textContent();
    if (!scoreText || scoreText.trim() === '—') return null;

    const parsed = parseInt(scoreText.trim(), 10);
    return Number.isNaN(parsed) ? null : parsed;
  }

  /**
   * Taps the recovery ring to expand/collapse the sparkline metrics panel.
   */
  async clickCheckin(): Promise<void> {
    // In the current UI the ring toggles sparklines; if a dedicated
    // check-in button exists elsewhere, adjust selector.
    await this.recoveryRing.click();
  }

  /**
   * Expands the metrics panel by tapping the recovery ring.
   */
  async expandMetrics(): Promise<void> {
    await this.recoveryRing.click();
    await this.metricsPanel.first().waitFor({ state: 'visible', timeout: 3000 });
  }

  /**
   * Returns true if the sparkline metrics panel is visible.
   */
  async isMetricsPanelVisible(): Promise<boolean> {
    return this.metricsPanel.first().isVisible().catch(() => false);
  }

  /**
   * Returns true if the adaptive tier suggestion banner is visible.
   */
  async isTierBannerVisible(): Promise<boolean> {
    return this.tierBanner.isVisible().catch(() => false);
  }

  /**
   * Returns the workout session type displayed in the training card,
   * or "rest" if today is a rest day.
   */
  async getWorkoutType(): Promise<string> {
    if (await this.restDayCard.isVisible().catch(() => false)) {
      return 'rest';
    }
    const header = this.workoutCard;
    const text = await header.textContent();
    return text?.trim() ?? 'unknown';
  }

  /**
   * Navigates to the Log tab (CheckinForm) via bottom navigation.
   */
  async gotoLog(): Promise<void> {
    await this.navLog.click();
    await this.page.waitForLoadState('networkidle');
  }
}
