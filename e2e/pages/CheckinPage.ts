// e2e/pages/CheckinPage.ts
// Page object for the CheckinForm (reachable via Log / "Журнал" tab).

import type { Page, Locator } from '@playwright/test';

export class CheckinPage {
  readonly page: Page;

  // ── Locators ─────────────────────────────────────────────────────────────────

  /** Collapsible check-in form wrapper. NOTE: add data-testid="checkin-form" */
  readonly form: Locator;

  /** Weight number input. NOTE: add data-testid="input-weight" */
  readonly weightInput: Locator;

  /** Resting HR number input. NOTE: add data-testid="input-rhr" */
  readonly rhrInput: Locator;

  /** HRV number input. NOTE: add data-testid="input-hrv" */
  readonly hrvInput: Locator;

  /** Sleep hours number input. NOTE: add data-testid="input-sleep-hours" */
  readonly sleepInput: Locator;

  /** Muscle soreness scale selector. NOTE: add data-testid="slider-muscle-soreness" */
  readonly sorenessSlider: Locator;

  /** Energy scale selector. NOTE: add data-testid="slider-energy" */
  readonly energySlider: Locator;

  /** Mood scale selector. NOTE: add data-testid="slider-mood" */
  readonly moodSlider: Locator;

  /** Sleep quality scale selector. NOTE: add data-testid="slider-sleep-quality" */
  readonly sleepQualitySlider: Locator;

  /** Stress scale selector. NOTE: add data-testid="slider-stress" */
  readonly stressSlider: Locator;

  /** Hip pain scale selector. NOTE: add data-testid="slider-hip-pain" */
  readonly hipPainSlider: Locator;

  /** Shoulder pain scale selector. NOTE: add data-testid="slider-shoulder-pain" */
  readonly shoulderPainSlider: Locator;

  /** Breathing select dropdown. NOTE: add data-testid="select-breathing" */
  readonly breathingSelect: Locator;

  /** Submit button. NOTE: add data-testid="checkin-submit-btn" */
  readonly submitButton: Locator;

  /** Tier selector buttons (light / medium / full). NOTE: add data-testid="tier-selector" */
  readonly tierSelector: Locator;

  /** Validation error message. NOTE: add data-testid="checkin-validation-error" */
  readonly validationError: Locator;

  /** Success message after save. NOTE: add data-testid="checkin-success-message" */
  readonly successMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.form = page.locator('.checkin-form, [data-testid="checkin-form"]');
    // Use label-based selectors so they work across all checkin tiers
    this.weightInput = page.locator('.checkin-row', { hasText: /Вес/i }).locator('input[type="number"]');
    this.rhrInput = page.locator('.checkin-row', { hasText: /ЧСС покоя/i }).locator('input[type="number"]');
    this.hrvInput = page.locator('.checkin-row', { hasText: /HRV/i }).locator('input[type="number"]');
    this.sleepInput = page.locator('.checkin-row', { hasText: /Длительность/i }).locator('input[type="number"]');

    // Scale selectors use the ScaleSelector component (radio-like buttons 1-5)
    this.sorenessSlider = page.locator('.checkin-row--scale:has-text("Болезненность"), [data-testid="slider-muscle-soreness"]');
    this.energySlider = page.locator('.checkin-row--scale:has-text("Энергия"), [data-testid="slider-energy"]');
    this.moodSlider = page.locator('.checkin-row--scale:has-text("Настроение"), [data-testid="slider-mood"]');
    this.sleepQualitySlider = page.locator('.checkin-row--scale:has-text("Качество"), [data-testid="slider-sleep-quality"]');
    this.stressSlider = page.locator('.checkin-row--scale:has-text("Стресс"), [data-testid="slider-stress"]');
    this.hipPainSlider = page.locator('.checkin-row--scale:has-text("бедре"), [data-testid="slider-hip-pain"]');
    this.shoulderPainSlider = page.locator('.checkin-row--scale:has-text("плече"), [data-testid="slider-shoulder-pain"]');

    this.breathingSelect = page.locator('.checkin-select, [data-testid="select-breathing"]');
    this.submitButton = page.locator('button:has-text("Сохранить чек-ин"), [data-testid="checkin-submit-btn"]');
    this.tierSelector = page.locator('.profile-section:has-text("Уровень чек-ина"), [data-testid="tier-selector"]');
    this.validationError = page.locator('.validation-error, [data-testid="checkin-validation-error"]');
    this.successMessage = page.locator('.validation-success, [data-testid="checkin-success-message"]');
  }

  // ── Navigation ───────────────────────────────────────────────────────────────

  async goto(): Promise<void> {
    const navLog = this.page.locator('.bottom-nav__item:has-text("Журнал"), [data-testid="nav-log"]');
    await navLog.click();
    await this.page.waitForLoadState('networkidle');
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  /**
   * Sets a ScaleSelector value (1-5) by clicking the nth button.
   * ScaleSelector renders a row of clickable elements.
   */
  private async setScaleValue(sliderLocator: Locator, value: number): Promise<void> {
    // ScaleSelector typically renders buttons or clickable spans inside .checkin-row__scale
    const buttons = sliderLocator.locator('.checkin-row__scale > *');
    const count = await buttons.count();
    if (count === 0) {
      // Fallback: click directly if it's a single input
      return;
    }
    const index = Math.max(0, Math.min(value - 1, count - 1));
    await buttons.nth(index).click();
  }

  // ── Submission helpers ───────────────────────────────────────────────────────

  /**
   * Submits a full-tier check-in (all biometric fields).
   */
  async submitFullTier(
    weight: number,
    rhr: number,
    hrv: number,
    sleep: number,
    soreness: number
  ): Promise<void> {
    await this.weightInput.fill(String(weight));
    await this.rhrInput.fill(String(rhr));
    await this.hrvInput.fill(String(hrv));
    await this.sleepInput.fill(String(sleep));
    await this.setScaleValue(this.sorenessSlider, soreness);
    await this.submitButton.click();
    await this.successMessage.waitFor({ state: 'visible', timeout: 5000 });
  }

  /**
   * Submits a medium-tier check-in (weight, RHR, soreness).
   * HRV field is hidden in medium tier; this helper fills only visible fields.
   */
  async submitMediumTier(weight: number, rhr: number, soreness: number): Promise<void> {
    await this.weightInput.fill(String(weight));
    await this.rhrInput.fill(String(rhr));
    await this.setScaleValue(this.sorenessSlider, soreness);
    await this.submitButton.click();
    await this.successMessage.waitFor({ state: 'visible', timeout: 5000 });
  }

  /**
   * Submits a light-tier check-in (weight, soreness only).
   * Only subjective fields are filled.
   */
  async submitLightTier(weight: number, soreness: number): Promise<void> {
    await this.weightInput.fill(String(weight));
    await this.setScaleValue(this.sorenessSlider, soreness);
    await this.submitButton.click();
    await this.successMessage.waitFor({ state: 'visible', timeout: 5000 });
  }

  /**
   * Returns the validation error text, or null if none is shown.
   */
  async getValidationErrors(): Promise<string | null> {
    const visible = await this.validationError.isVisible().catch(() => false);
    if (!visible) return null;
    return this.validationError.textContent();
  }
}
