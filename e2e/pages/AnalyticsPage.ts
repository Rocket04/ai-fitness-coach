// e2e/pages/AnalyticsPage.ts
// Page object for the Analytics ("Аналитика") tab.

import type { Page, Locator } from '@playwright/test';

export class AnalyticsPage {
  readonly page: Page;

  // ── Locators ─────────────────────────────────────────────────────────────────

  /** Trend chart card container. NOTE: add data-testid="trend-chart" */
  readonly trendChart: Locator;

  /** 7-day toggle button. NOTE: add data-testid="trend-toggle-7d" */
  readonly toggle7Day: Locator;

  /** 30-day toggle button. NOTE: add data-testid="trend-toggle-30d" */
  readonly toggle30Day: Locator;

  /** Weekly summary card. NOTE: add data-testid="weekly-summary" */
  readonly weeklySummary: Locator;

  /** Warnings list component. NOTE: add data-testid="warnings-list" */
  readonly warningsList: Locator;

  /** Overtraining banner. NOTE: add data-testid="overtraining-banner" */
  readonly overtrainingBanner: Locator;

  /** Weekly averages table. NOTE: add data-testid="weekly-averages-table" */
  readonly weeklyAveragesTable: Locator;

  /** Empty state when insufficient data. NOTE: add data-testid="empty-state-analytics" */
  readonly emptyState: Locator;

  /** Bottom nav "Аналитика" item. */
  readonly navAnalytics: Locator;

  constructor(page: Page) {
    this.page = page;
    this.trendChart = page.locator('.chart-card, [data-testid="trend-chart"]');
    this.toggle7Day = page.locator('button:has-text("7 дней"), [data-testid="trend-toggle-7d"]');
    this.toggle30Day = page.locator('button:has-text("30 дней"), [data-testid="trend-toggle-30d"]');
    this.weeklySummary = page.locator('.card:has-text("Среднее за неделю"), [data-testid="weekly-summary"]');
    this.warningsList = page.locator('.warnings-list, [data-testid="warnings-list"]');
    this.overtrainingBanner = page.locator('.overtraining-banner, [data-testid="overtraining-banner"]');
    this.weeklyAveragesTable = page.locator('.weekly-table, [data-testid="weekly-averages-table"]');
    this.emptyState = page.locator('.empty-state, [data-testid="empty-state-analytics"]');
    this.navAnalytics = page.locator('.bottom-nav__item:has-text("Аналитика"), [data-testid="nav-analytics"]');
  }

  // ── Navigation ───────────────────────────────────────────────────────────────

  async goto(): Promise<void> {
    await this.navAnalytics.click();
    await this.page.waitForLoadState('networkidle');
  }

  // ── Actions ──────────────────────────────────────────────────────────────────

  /** Switches trend view to 7 days. */
  async switchTo7Day(): Promise<void> {
    await this.toggle7Day.click();
  }

  /** Switches trend view to 30 days. */
  async switchTo30Day(): Promise<void> {
    await this.toggle30Day.click();
  }

  // ── Queries ──────────────────────────────────────────────────────────────────

  /**
   * Returns the number of warning items currently visible.
   * If no warnings list is rendered, returns 0.
   */
  async getWarningCount(): Promise<number> {
    const visible = await this.warningsList.isVisible().catch(() => false);
    if (!visible) return 0;

    // WarningsList renders individual warning items
    const items = this.warningsList.locator('.warning-item, .warning-card, > div');
    return items.count();
  }

  /**
   * Returns true if the overtraining banner is visible.
   */
  async hasOvertrainingWarning(): Promise<boolean> {
    return this.overtrainingBanner.isVisible().catch(() => false);
  }

  /**
   * Returns true if the analytics page is showing the empty state
   * (insufficient data for trends).
   */
  async isEmptyState(): Promise<boolean> {
    return this.emptyState.isVisible().catch(() => false);
  }
}
