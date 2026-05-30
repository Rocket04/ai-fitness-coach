// e2e/pages/OnboardingPage.ts
// Page object for the OnboardingWizard overlay.

import type { Page, Locator } from '@playwright/test';

export class OnboardingPage {
  readonly page: Page;

  // ── Locators ─────────────────────────────────────────────────────────────────

  /** Onboarding overlay/modal wrapper. NOTE: add data-testid="onboarding-overlay" */
  readonly overlay: Locator;

  /** Modal content container. NOTE: add data-testid="onboarding-modal" */
  readonly modal: Locator;

  /** Step indicator dots. */
  readonly stepIndicator: Locator;

  /** Value step (welcome screen). */
  readonly valueStep: Locator;

  /** Goal selection step. */
  readonly goalStep: Locator;

  /** Sports selection step. */
  readonly sportsStep: Locator;

  /** Gadgets selection step. */
  readonly gadgetsStep: Locator;

  /** Recovery ring final step. */
  readonly recoveryStep: Locator;

  /** Goal option cards. NOTE: add data-testid="goal-option" */
  readonly goalOptions: Locator;

  /** Training day chips. NOTE: add data-testid="training-day-chip" */
  readonly dayChips: Locator;

  /** Sport chips. NOTE: add data-testid="sport-chip" */
  readonly sportChips: Locator;

  /** Gadget cards. NOTE: add data-testid="gadget-card" */
  readonly gadgetCards: Locator;

  /** Primary "Next" / "Далее" button. NOTE: add data-testid="onboarding-next-btn" */
  readonly nextButton: Locator;

  /** Back arrow button. NOTE: add data-testid="onboarding-back-btn" */
  readonly backButton: Locator;

  /** Finish / complete button on recovery step. NOTE: add data-testid="onboarding-finish-btn" */
  readonly finishButton: Locator;

  /** Close (X) button. NOTE: add data-testid="onboarding-close-btn" */
  readonly closeButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.overlay = page.locator('.onboarding-overlay, [data-testid="onboarding-overlay"]');
    this.modal = page.locator('.onboarding-modal, [data-testid="onboarding-modal"]');
    this.stepIndicator = page.locator('.onboarding-steps, [data-testid="onboarding-step-indicator"]');
    this.valueStep = page.locator('.onboarding-content--value, [data-testid="onboarding-step-value"]');
    this.goalStep = page.locator('.onboarding-content--goal, [data-testid="onboarding-step-goal"]');
    this.sportsStep = page.locator('.onboarding-content--sports, [data-testid="onboarding-step-sports"]');
    this.gadgetsStep = page.locator('.onboarding-content--gadgets, [data-testid="onboarding-step-gadgets"]');
    this.recoveryStep = page.locator('.onboarding-content--recovery, [data-testid="onboarding-step-recovery"]');
    this.goalOptions = page.locator('.onboarding-goal-card, [data-testid="goal-option"]');
    this.dayChips = page.locator('.onboarding-day-chip, [data-testid="training-day-chip"]');
    this.sportChips = page.locator('.onboarding-sport-chip, [data-testid="sport-chip"]');
    this.gadgetCards = page.locator('.onboarding-gadget-card, [data-testid="gadget-card"]');
    this.nextButton = page.locator('.onboarding-btn--primary:has-text("Далее"), button:has-text("Далее"), [data-testid="onboarding-next-btn"]');
    this.backButton = page.locator('button:has-text("←"), [data-testid="onboarding-back-btn"]');
    this.finishButton = page.locator('.onboarding-btn--primary:has-text("Перейти"), button:has-text("Перейти"), [data-testid="onboarding-finish-btn"]');
    this.closeButton = page.locator('.onboarding-close, [data-testid="onboarding-close-btn"]');
  }

  // ── State queries ────────────────────────────────────────────────────────────

  /**
   * Returns the currently visible onboarding step name.
   */
  async getCurrentStep(): Promise<'value' | 'goal' | 'sports' | 'gadgets' | 'recovery' | 'unknown'> {
    if (await this.valueStep.isVisible().catch(() => false)) return 'value';
    if (await this.goalStep.isVisible().catch(() => false)) return 'goal';
    if (await this.sportsStep.isVisible().catch(() => false)) return 'sports';
    if (await this.gadgetsStep.isVisible().catch(() => false)) return 'gadgets';
    if (await this.recoveryStep.isVisible().catch(() => false)) return 'recovery';
    return 'unknown';
  }

  /**
   * Returns true if the Next / Finish button is enabled (not disabled).
   */
  async canAdvance(): Promise<boolean> {
    const btn = await this.resolveAdvanceButton();
    const disabled = await btn.isDisabled().catch(() => true);
    return !disabled;
  }

  /** Resolves the appropriate advance button for the current step. */
  private async resolveAdvanceButton(): Promise<Locator> {
    if (await this.recoveryStep.isVisible().catch(() => false)) {
      return this.finishButton;
    }
    return this.nextButton;
  }

  // ── Actions ──────────────────────────────────────────────────────────────────

  /**
   * Completes the full onboarding flow with the given parameters.
   *
   * @param goal   — 'strength' | 'fitness' | 'fatloss'
   * @param days   — array of day-of-week numbers (1=Mon ... 7=Sun), e.g. [1,3,5]
   * @param sport  — sport key, e.g. 'running', 'strength', 'swimming'
   * @param gadgets — array of gadget keys, e.g. ['hr_monitor', 'smartwatch']
   */
  async completeOnboarding(
    goal: string,
    days: number[],
    sport: string,
    gadgets: string[]
  ): Promise<void> {
    // Step 1: Value (welcome) — click primary button
    await this.valueStep.waitFor({ state: 'visible', timeout: 5000 });
    await this.page.locator('.onboarding-content--value .btn-accent').click();

    // Step 2: Goal
    await this.goalStep.waitFor({ state: 'visible', timeout: 5000 });
    const goalCard = this.goalOptions.filter({ hasText: this.goalLabel(goal) });
    await goalCard.click();

    // Training days
    for (const day of days) {
      const dayLabel = this.dayLabel(day);
      const chip = this.dayChips.filter({ hasText: dayLabel });
      await chip.click();
    }

    await this.nextButton.click();

    // Step 3: Sports
    await this.sportsStep.waitFor({ state: 'visible', timeout: 5000 });
    const sportChip = this.sportChips.filter({ hasText: new RegExp(sport, 'i') });
    await sportChip.click();
    await this.nextButton.click();

    // Step 4: Gadgets
    await this.gadgetsStep.waitFor({ state: 'visible', timeout: 5000 });
    for (const gadget of gadgets) {
      const card = this.gadgetCards.filter({ hasText: new RegExp(gadget, 'i') });
      await card.click();
    }
    await this.nextButton.click();

    // Step 5: Recovery — finish
    await this.recoveryStep.waitFor({ state: 'visible', timeout: 5000 });
    await this.finishButton.click();

    // Wait for overlay to disappear
    await this.overlay.waitFor({ state: 'hidden', timeout: 5000 });
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  private goalLabel(key: string): string {
    const map: Record<string, string> = {
      strength: 'Стать сильнее',
      fitness: 'Набрать форму',
      fatloss: 'Похудеть',
    };
    return map[key] || key;
  }

  private dayLabel(dow: number): string {
    const map: Record<number, string> = {
      1: 'Пн',
      2: 'Вт',
      3: 'Ср',
      4: 'Чт',
      5: 'Пт',
      6: 'Сб',
      7: 'Вс',
    };
    return map[dow] ?? String(dow);
  }
}
