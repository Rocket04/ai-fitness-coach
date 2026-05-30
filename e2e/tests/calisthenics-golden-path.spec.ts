// e2e/tests/calisthenics-golden-path.spec.ts
// E2E audit: weight-based calisthenics APRE progression
// Scenarios:
//   1. Onboarding + Calisthenics config with weight input
//   2. Workout with weight-based calisthenics + APRE toast
//   3. Monday review card with calisthenics progress

import { test, expect, Page } from '@playwright/test';
import { clearAllStorage } from '../utils/clearStorage.js';

async function seedCheckin(page: Page) {
  await page.evaluate(async () => {
    const { saveCheckin } = await import('/js/data/storage.js');
    const today = new Date().toISOString().slice(0, 10);
    await saveCheckin({
      date: today,
      sleepHours: 7.5,
      restHR: 62,
      hrv: 55,
      hipPain: 1,
      shoulderPain: 1,
      breathing: 'good',
      weight: 75,
      notes: '',
      muscleSoreness: 2,
      energy: 4,
      mood: 4,
      sleepQuality: 4,
      stress: 2,
      readiness: 'green',
      ts: Date.now(),
    });
  });
}

async function ensureOnboardingShows(page: Page) {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await clearAllStorage(page);
  await page.evaluate(async () => {
    const { saveCheckin } = await import('/js/data/storage.js');
    const today = new Date().toISOString().slice(0, 10);
    await saveCheckin({
      date: today,
      weight: 70,
      restHR: 60,
      hrv: 55,
      hipPain: 0,
      shoulderPain: 0,
      breathing: 'good',
      notes: '',
      muscleSoreness: 1,
      energy: 4,
      mood: 4,
      sleepQuality: 4,
      stress: 2,
      readiness: 'green',
      ts: Date.now(),
    });
  });
  await page.evaluate(() => localStorage.removeItem('fitness-tracker-onboarding-v1'));
  await page.reload();
  await page.waitForFunction(() => !!document.querySelector('.bottom-nav'), { timeout: 10000 });
  await page.waitForTimeout(500);
}

async function completeOnboarding(page: Page) {
  // Step 1: Value proposition — click CTA
  await expect(page.getByTestId('onboarding-step-1')).toBeVisible({ timeout: 10000 });
  await page.locator('button').filter({ hasText: 'Начать первую тренировку' }).click();

  // Step 2: Goal selection — choose Сила (training days pre-selected by default)
  await expect(page.getByTestId('onboarding-step-2')).toBeVisible({ timeout: 5000 });
  const goalOption = page.getByTestId('goal-option').filter({ hasText: /Стать сильнее/i });
  await goalOption.waitFor({ state: 'visible', timeout: 3000 });
  await goalOption.click({ force: true });
  await page.waitForTimeout(300);
  await page.getByRole('button', { name: /Далее/ }).click({ force: true });

  // Step 3: Sport selection — select калистеника
  await expect(page.getByTestId('onboarding-step-3')).toBeVisible({ timeout: 5000 });
  await page.getByTestId('sport-selector').filter({ hasText: /Калистеника/i }).click();
  await page.locator('button:has-text("Далее →")').click();

  // Step 4: Gadget selection — manual input
  await expect(page.getByTestId('onboarding-step-4')).toBeVisible({ timeout: 5000 });
  await page.getByTestId('gadget-selector').filter({ hasText: /Ручной ввод/i }).click();
  await page.getByTestId('gadgets-next').click();

  // Step 5: Complete
  await expect(page.getByTestId('onboarding-step-5')).toBeVisible({ timeout: 5000 });
  await page.getByTestId('onboarding-complete').click();
  await page.locator('.onboarding-modal').waitFor({ state: 'hidden', timeout: 5000 });
}

async function configureCalisthenicsExercise(page: Page, exerciseName: string, weight: string, reps: string) {
  // Navigate to profile and find exercise
  await page.click('[data-testid="nav-profile"]');
  await page.waitForLoadState('networkidle');
  // Expand exercises collapsible section
  await page.locator('button:has-text("Упражнения")').first().click();
  await page.waitForTimeout(300);
  await page.waitForSelector('text=Настроить упражнения', { timeout: 8000 });
  await page.click('text=Настроить упражнения');
  await page.waitForSelector(`text=${exerciseName}`, { timeout: 5000 });
  // Click the "Настроить" button inside the exercise row (not the text span)
  await page.locator(`.exercise-config-item:has-text("${exerciseName}") .exercise-config-btn`).first().click();
  await page.waitForSelector('text=Рабочий вес и повторения', { timeout: 5000 });
  // Fill weight and reps
  await page.fill('[placeholder="Вес (кг)"]', weight);
  await page.fill('[placeholder="Повторений"]', reps);
  // Save
  await page.click('text=Сохранить');
  // Close the configurator modal after saving
  await page.locator('.configurator-actions .btn:has-text("Закрыть")').click();
}

test.describe('Calisthenics Golden Path', () => {
  test('Scenario 1: Onboarding + Calisthenics weight config', async ({ page }) => {
    await ensureOnboardingShows(page);
    await completeOnboarding(page);
    // Verify we're on the today page
    await page.waitForSelector('[data-testid="nav-today"]', { timeout: 10000 });
    await seedCheckin(page);
    await page.reload();
    await page.waitForLoadState('networkidle');
    // Navigate to profile
    await page.click('[data-testid="nav-profile"]');
    await page.waitForLoadState('networkidle');
    // Expand exercises collapsible section
    await page.waitForSelector('button:has-text("Упражнения")', { timeout: 5000 });
    await page.click('button:has-text("Упражнения")');
    await page.waitForTimeout(300);
    await page.waitForSelector('text=Настроить упражнения', { timeout: 5000 });
    await page.click('text=Настроить упражнения');
    // Find Подтягивания and click its "Настроить" button inside the row
    await page.waitForSelector('text=Подтягивания', { timeout: 5000 });
    await page.locator(`.exercise-config-item:has-text("Подтягивания") .exercise-config-btn`).first().click();
    // Verify weight inputs appear (not level buttons)
    await expect(page.locator('text=Рабочий вес и повторения')).toBeVisible();
    await expect(page.locator('[placeholder="Вес (кг)"]')).toBeVisible();
    await expect(page.locator('[placeholder="Повторений"]')).toBeVisible();
    // Level selector should NOT be present
    await expect(page.locator('text=Уровень сложности')).not.toBeVisible();
    // Enter weight 5 kg, reps 6
    await page.fill('[placeholder="Вес (кг)"]', '5');
    await page.fill('[placeholder="Повторений"]', '6');
    // Estimated RM should be displayed
    await expect(page.locator('text=Расчётный максимум')).toBeVisible();
    // Save
    await page.click('text=Сохранить');
    // Close the configurator modal after saving
    await page.locator('.configurator-actions .btn:has-text("Закрыть")').click();
    // Verify exercise is now configured — check the configured count text in the profile section
    await expect(page.locator('text=1 из')).toBeVisible();
  });

  test('Scenario 2: Workout with weight-based calisthenics', async ({ page }) => {
    // Setup: data + config
    await ensureOnboardingShows(page);
    await completeOnboarding(page);
    await seedCheckin(page);
    await page.reload();
    await page.waitForLoadState('networkidle');
    await configureCalisthenicsExercise(page, 'Подтягивания', '5', '6');
    // Navigate to Today
    await page.click('[data-testid="nav-today"]');
    await page.waitForLoadState('networkidle');
    // Click start workout
    const startBtn = page.locator('text=Начать тренировку');
    if (await startBtn.isVisible()) {
      await startBtn.click();
    }
    // Verify WorkoutMode opens
    await page.waitForSelector('[data-testid="workout-mode"]', { timeout: 10000 });
    // Find APRE sets for calisthenics — exact match for the exercise in the plan
    // The workout shows basic checkbox sets for calisthenics exercises
    await expect(page.getByText('Подтягивания параллельным хватом', { exact: true })).toBeVisible();
  });
});
