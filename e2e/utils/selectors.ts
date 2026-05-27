// e2e/utils/selectors.ts
// Reusable data-testid selector constants for Playwright E2E tests.
// NOTE: Many of these data-testid attributes do not yet exist in the UI components.
//       They should be added to the corresponding React components for robust selectors.

export const SELECTORS = {
  // ── Navigation ──
  NAV_TODAY: '[data-testid="nav-today"]',
  NAV_LOG: '[data-testid="nav-log"]',
  NAV_ANALYTICS: '[data-testid="nav-analytics"]',
  NAV_PROFILE: '[data-testid="nav-profile"]',

  // ── TodayPage ──
  RECOVERY_RING: '[data-testid="recovery-ring"]',
  RECOVERY_SCORE_TEXT: '[data-testid="recovery-score-text"]',
  STATUS_PILL: '[data-testid="status-pill"]',
  SPARKLINE_CARD: '[data-testid="sparkline-card"]',
  SPARKLINE_HRV: '[data-testid="sparkline-hrv"]',
  SPARKLINE_SLEEP: '[data-testid="sparkline-sleep"]',
  SPARKLINE_RPE: '[data-testid="sparkline-rpe"]',
  WEEKLY_STRIP: '[data-testid="weekly-strip"]',
  TIER_SUGGESTION_BANNER: '[data-testid="tier-suggestion-banner"]',
  TRAINING_CARD: '[data-testid="training-card"]',
  TRAINING_HEADER: '[data-testid="training-header"]',
  EXERCISE_LIST: '[data-testid="exercise-list"]',
  REST_DAY_CARD: '[data-testid="rest-day-card"]',
  TOMORROW_CARD: '[data-testid="tomorrow-card"]',
  COACH_TIPS_PANEL: '[data-testid="coach-tips-panel"]',
  QUICK_ACTION_MORNING: '[data-testid="quick-action-morning"]',
  QUICK_ACTION_EVENING: '[data-testid="quick-action-evening"]',
  MARK_TRAINING_BTN: '[data-testid="mark-training-btn"]',

  // ── CheckinForm (LogPage) ──
  CHECKIN_FORM: '[data-testid="checkin-form"]',
  CHECKIN_SECTION_SLEEP: '[data-testid="checkin-section-sleep"]',
  CHECKIN_SECTION_BIOMETRICS: '[data-testid="checkin-section-biometrics"]',
  CHECKIN_SECTION_WELLBEING: '[data-testid="checkin-section-wellbeing"]',
  INPUT_WEIGHT: '[data-testid="input-weight"]',
  INPUT_RHR: '[data-testid="input-rhr"]',
  INPUT_HRV: '[data-testid="input-hrv"]',
  INPUT_SLEEP_HOURS: '[data-testid="input-sleep-hours"]',
  SELECT_BREATHING: '[data-testid="select-breathing"]',
  SLIDER_MUSCLE_SORENESS: '[data-testid="slider-muscle-soreness"]',
  SLIDER_ENERGY: '[data-testid="slider-energy"]',
  SLIDER_MOOD: '[data-testid="slider-mood"]',
  SLIDER_SLEEP_QUALITY: '[data-testid="slider-sleep-quality"]',
  SLIDER_STRESS: '[data-testid="slider-stress"]',
  SLIDER_HIP_PAIN: '[data-testid="slider-hip-pain"]',
  SLIDER_SHOULDER_PAIN: '[data-testid="slider-shoulder-pain"]',
  CHECKIN_SUBMIT_BTN: '[data-testid="checkin-submit-btn"]',
  CHECKIN_VALIDATION_ERROR: '[data-testid="checkin-validation-error"]',
  CHECKIN_SUCCESS_MESSAGE: '[data-testid="checkin-success-message"]',

  // ── OnboardingWizard ──
  ONBOARDING_OVERLAY: '[data-testid="onboarding-overlay"]',
  ONBOARDING_MODAL: '[data-testid="onboarding-modal"]',
  ONBOARDING_STEP_INDICATOR: '[data-testid="onboarding-step-indicator"]',
  ONBOARDING_STEP_VALUE: '[data-testid="onboarding-step-value"]',
  ONBOARDING_STEP_GOAL: '[data-testid="onboarding-step-goal"]',
  ONBOARDING_STEP_SPORTS: '[data-testid="onboarding-step-sports"]',
  ONBOARDING_STEP_GADGETS: '[data-testid="onboarding-step-gadgets"]',
  ONBOARDING_STEP_RECOVERY: '[data-testid="onboarding-step-recovery"]',
  GOAL_OPTION: '[data-testid="goal-option"]',
  TRAINING_DAY_CHIP: '[data-testid="training-day-chip"]',
  SPORT_CHIP: '[data-testid="sport-chip"]',
  GADGET_CARD: '[data-testid="gadget-card"]',
  ONBOARDING_NEXT_BTN: '[data-testid="onboarding-next-btn"]',
  ONBOARDING_BACK_BTN: '[data-testid="onboarding-back-btn"]',
  ONBOARDING_FINISH_BTN: '[data-testid="onboarding-finish-btn"]',
  ONBOARDING_CLOSE_BTN: '[data-testid="onboarding-close-btn"]',

  // ── AnalyticsPage ──
  TREND_CHART: '[data-testid="trend-chart"]',
  TREND_TOGGLE_7D: '[data-testid="trend-toggle-7d"]',
  TREND_TOGGLE_30D: '[data-testid="trend-toggle-30d"]',
  WEEKLY_SUMMARY: '[data-testid="weekly-summary"]',
  WARNINGS_LIST: '[data-testid="warnings-list"]',
  OVERTRAINING_BANNER: '[data-testid="overtraining-banner"]',
  WEEKLY_AVERAGES_TABLE: '[data-testid="weekly-averages-table"]',
  EMPTY_STATE_ANALYTICS: '[data-testid="empty-state-analytics"]',

  // ── ProfilePage ──
  PROFILE_STATS_CARD: '[data-testid="profile-stats-card"]',
  TIER_SELECTOR: '[data-testid="tier-selector"]',
  TIER_LIGHT_BTN: '[data-testid="tier-light-btn"]',
  TIER_MEDIUM_BTN: '[data-testid="tier-medium-btn"]',
  TIER_FULL_BTN: '[data-testid="tier-full-btn"]',
  ACHIEVEMENTS_SECTION: '[data-testid="achievements-section"]',
  ACHIEVEMENT_BADGE: '[data-testid="achievement-badge"]',
  EXERCISE_CONFIG_BTN: '[data-testid="exercise-config-btn"]',
  LANGUAGE_SWITCHER: '[data-testid="language-switcher"]',
  LANG_RU_BTN: '[data-testid="lang-ru-btn"]',
  LANG_EN_BTN: '[data-testid="lang-en-btn"]',
  SETTINGS_MODAL: '[data-testid="settings-modal"]',
  REHAB_SECTION: '[data-testid="rehab-section"]',
  INTEGRATION_CARDS: '[data-testid="integration-cards"]',
  DEMO_MODE_BTN: '[data-testid="demo-mode-btn"]',
  EXPORT_DATA_BTN: '[data-testid="export-data-btn"]',
  IMPORT_DATA_BTN: '[data-testid="import-data-btn"]',
  RESET_DATA_BTN: '[data-testid="reset-data-btn"]',

  // ── App-level ──
  TOAST_MESSAGE: '[data-testid="toast-message"]',
  GUEST_BADGE: '[data-testid="guest-badge"]',
  DEMO_BADGE: '[data-testid="demo-badge"]',
  GUEST_MODAL: '[data-testid="guest-modal"]',
  START_TRACKING_BTN: '[data-testid="start-tracking-btn"]',
  SETTINGS_BTN: '[data-testid="settings-btn"]',
} as const;

export type SelectorKey = keyof typeof SELECTORS;
