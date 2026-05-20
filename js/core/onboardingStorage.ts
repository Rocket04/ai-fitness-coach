// js/core/onboardingStorage.ts
// Persistence layer for onboarding completion status.
// Separated from Zustand store to survive full app remounts (e.g. i18n language switch).

const STORAGE_KEY = 'fitness-tracker-onboarding-v1';

interface OnboardingState {
  completed: boolean;
  completedAt: number | null;
}

function loadState(): OnboardingState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore corrupted localStorage */
  }
  return { completed: false, completedAt: null };
}

function saveState(state: OnboardingState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore localStorage errors */
  }
}

export function isOnboardingCompleted(): boolean {
  return loadState().completed;
}

export function markOnboardingCompleted() {
  saveState({ completed: true, completedAt: Date.now() });
}

export function resetOnboardingStatus() {
  saveState({ completed: false, completedAt: null });
}
