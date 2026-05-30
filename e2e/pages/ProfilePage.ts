// e2e/pages/ProfilePage.ts
// Page object for the Profile ("Профиль") tab.

import type { Page, Locator } from '@playwright/test';

export class ProfilePage {
  readonly page: Page;

  // ── Locators ─────────────────────────────────────────────────────────────────

  /** Check-in tier selector section. NOTE: add data-testid="tier-selector" */
  readonly tierSelector: Locator;

  /** Light tier button. NOTE: add data-testid="tier-light-btn" */
  readonly tierLightBtn: Locator;

  /** Medium tier button. NOTE: add data-testid="tier-medium-btn" */
  readonly tierMediumBtn: Locator;

  /** Full tier button. NOTE: add data-testid="tier-full-btn" */
  readonly tierFullBtn: Locator;

  /** Achievements section wrapper. NOTE: add data-testid="achievements-section" */
  readonly achievementsSection: Locator;

  /** Individual achievement badges. NOTE: add data-testid="achievement-badge" */
  readonly achievementBadges: Locator;

  /** Exercise config open button. NOTE: add data-testid="exercise-config-btn" */
  readonly exerciseConfigBtn: Locator;

  /** Language switcher wrapper. NOTE: add data-testid="language-switcher" */
  readonly languageSwitcher: Locator;

  /** Russian language button. NOTE: add data-testid="lang-ru-btn" */
  readonly langRuBtn: Locator;

  /** English language button. NOTE: add data-testid="lang-en-btn" */
  readonly langEnBtn: Locator;

  /** Settings modal. NOTE: add data-testid="settings-modal" */
  readonly settingsModal: Locator;

  /** Bottom nav "Профиль" item. */
  readonly navProfile: Locator;

  constructor(page: Page) {
    this.page = page;
    this.tierSelector = page.locator('.profile-section:has-text("Уровень чек-ина"), [data-testid="tier-selector"]');
    this.tierLightBtn = page.locator('button:has-text("Лёгкий"), [data-testid="tier-light-btn"]');
    this.tierMediumBtn = page.locator('button:has-text("Средний"), [data-testid="tier-medium-btn"]');
    this.tierFullBtn = page.locator('button:has-text("Полный"), [data-testid="tier-full-btn"]');
    this.achievementsSection = page.locator('.profile-section:has-text("Достижения"), [data-testid="achievements-section"]');
    this.achievementBadges = page.locator('span[title], [data-testid="achievement-badge"]');
    this.exerciseConfigBtn = page.locator('button:has-text("Конфигуратор"), [data-testid="exercise-config-btn"]');
    this.languageSwitcher = page.locator('.profile-section:has-text("Язык"), [data-testid="language-switcher"]');
    this.langRuBtn = page.locator('button:has-text("Русский"), [data-testid="lang-ru-btn"]');
    this.langEnBtn = page.locator('button:has-text("English"), [data-testid="lang-en-btn"]');
    this.settingsModal = page.locator('.modal:has-text("Настройки"), [data-testid="settings-modal"]');
    this.navProfile = page.locator('.bottom-nav__item:has-text("Профиль"), [data-testid="nav-profile"]');
  }

  // ── Navigation ───────────────────────────────────────────────────────────────

  async goto(): Promise<void> {
    await this.navProfile.click();
    await this.page.waitForLoadState('networkidle');
  }

  // ── Actions ──────────────────────────────────────────────────────────────────

  /**
   * Selects the given check-in tier on the profile page.
   * @param tier — 'light' | 'medium' | 'full'
   */
  async selectTier(tier: 'light' | 'medium' | 'full'): Promise<void> {
    const btn =
      tier === 'light'
        ? this.tierLightBtn
        : tier === 'medium'
          ? this.tierMediumBtn
          : this.tierFullBtn;

    await btn.click();

    // Wait for the button to receive the active/accent style
    await this.page.waitForTimeout(200);
  }

  /**
   * Opens the exercise configuration modal.
   */
  async openExerciseConfig(): Promise<void> {
    await this.exerciseConfigBtn.click();
    await this.page.locator('.exercise-configurator, .modal:has-text("Силовые")').waitFor({
      state: 'visible',
      timeout: 5000,
    });
  }

  // ── Queries ─────────────────────────────────────────────────────────────────

  /**
   * Returns the number of unlocked achievement badges visible.
   */
  async getUnlockedAchievements(): Promise<number> {
    const visible = await this.achievementsSection.isVisible().catch(() => false);
    if (!visible) return 0;

    // Badges are inline-flex spans inside the achievements section
    const badges = this.achievementsSection.locator('span[title], [data-testid="achievement-badge"]');
    return badges.count();
  }

  /**
   * Returns true if the given language button has the active accent style.
   */
  async isLanguageActive(lang: 'ru' | 'en'): Promise<boolean> {
    const btn = lang === 'ru' ? this.langRuBtn : this.langEnBtn;
    const classAttr = await btn.getAttribute('class');
    return classAttr?.includes('btn-accent') ?? false;
  }
}
