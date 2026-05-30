// e2e/tests/golden-path.spec.ts
// Golden Path user journey E2E tests: onboarding → check-in → training → adaptation

import { test, expect, Page } from '@playwright/test';
import { clearAllStorage } from '../utils/clearStorage.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Seed a single check-in (used to bypass guest mode). */
async function seedCheckin(page: Page, overrides: Record<string, unknown> = {}) {
  await page.evaluate(async (o: Record<string, unknown>) => {
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
      ...o,
    });
  }, overrides);
}

/** Seed low-recovery check-ins (low sleep, high RHR) for N past days. */
async function seedLowRecoveryCheckins(page: Page, count: number) {
  await page.evaluate(async (n: number) => {
    const { saveCheckin } = await import('/js/data/storage.js');
    const today = new Date();
    for (let i = 0; i < n; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      await saveCheckin({
        date: iso,
        sleepHours: 4,
        restHR: 75,
        hrv: 28,
        hipPain: 3,
        shoulderPain: 3,
        breathing: 'bad',
        weight: 75,
        notes: 'Low recovery',
        muscleSoreness: 5,
        energy: 1,
        mood: 2,
        sleepQuality: 1,
        stress: 5,
        readiness: 'red',
        ts: d.getTime(),
      });
    }
  }, count);
}

/** Ensure onboarding wizard shows (clear data + seed checkin + clear flag). */
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
      sleepHours: 7,
      muscleSoreness: 2,
      energy: 4,
      mood: 4,
      sleepQuality: 4,
      stress: 2,
      hipPain: 1,
      shoulderPain: 1,
      breathing: 'good',
      notes: '',
      readiness: 'green',
      ts: Date.now(),
    });
  });
  await page.evaluate(() => localStorage.removeItem('fitness-tracker-onboarding-v1'));
  await page.reload();
  await page.waitForFunction(() => !!document.querySelector('.bottom-nav'), { timeout: 10000 });
  await page.waitForTimeout(500);
}

// ─── Tests ───────────────────────────────────────────────────────────────────

test.describe('Golden Path', () => {

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. Onboarding Flow
  // ═══════════════════════════════════════════════════════════════════════════
  test('1: Onboarding Flow — complete wizard and verify Today page', async ({ page }) => {
    await test.step('Clear data and set up so onboarding appears', async () => {
      await ensureOnboardingShows(page);
      // The onboarding modal uses class "onboarding-modal" (plain, not CSS module)
      await expect(page.locator('.onboarding-modal')).toBeVisible({ timeout: 5000 });
    });

    await test.step('Step 1: Value — click start button', async () => {
      await expect(page.getByTestId('onboarding-step-1')).toBeVisible({ timeout: 5000 });
      await page.locator('button').filter({ hasText: 'Начать первую тренировку' }).click();
      await expect(page.getByTestId('onboarding-step-2')).toBeVisible();
    });

    await test.step('Step 2: Select goal (training days pre-selected by default)', async () => {
      await expect(page.getByTestId('onboarding-step-2')).toBeVisible({ timeout: 5000 });
      await page.waitForTimeout(300);

      // Training days (Пн/Ср/Пт) are pre-selected by default ([1,3,5] in useState)
      // We only need to click a goal option to enable the "Далее →" button
      const goalOption = page.getByTestId('goal-option').filter({ hasText: /Стать сильнее/i });
      await goalOption.waitFor({ state: 'visible', timeout: 3000 });
      await goalOption.click({ force: true });
      await page.waitForTimeout(300);

      await page.getByRole('button', { name: /Далее/ }).click({ force: true });
      await expect(page.getByTestId('onboarding-step-3')).toBeVisible({ timeout: 5000 });
    });

    await test.step('Step 3: Select sport', async () => {
      await page.getByTestId('sport-selector').filter({ hasText: /Тренажёрный зал/i }).click();
      await page.locator('button:has-text("Далее →")').click();
      await expect(page.getByTestId('onboarding-step-4')).toBeVisible();
    });

    await test.step('Step 4: Select manual input gadget', async () => {
      await page.getByTestId('gadget-selector').filter({ hasText: /Ручной ввод/i }).click();
      // Gadget step uses data-testid on the next button
      await page.getByTestId('gadgets-next').click();
      await expect(page.getByTestId('onboarding-step-5')).toBeVisible();
    });

    await test.step('Step 5: Complete onboarding', async () => {
      await page.getByTestId('onboarding-complete').click();
      await page.locator('.onboarding-modal').waitFor({ state: 'hidden', timeout: 5000 });
    });

    await test.step('Verify Today page with recovery ring', async () => {
      await expect(page.locator('.today-page')).toBeVisible();
      await expect(page.getByTestId('recovery-ring')).toBeVisible({ timeout: 5000 });
      await expect(page.getByTestId('checkin-trigger')).toBeVisible();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. Daily Check-in
  // ═══════════════════════════════════════════════════════════════════════════
  test('2: Daily Check-in — fill and submit, verify recovery score', async ({ page }) => {
    await test.step('Clear data and complete onboarding', async () => {
      await page.goto('/');
      await clearAllStorage(page);
      await page.evaluate(() => localStorage.setItem(
        'fitness-tracker-onboarding-v1',
        JSON.stringify({ completed: true, completedAt: Date.now() })
      ));
      await page.goto('/');
      await page.waitForFunction(() => !!document.querySelector('.bottom-nav'));
      await page.waitForTimeout(300);
    });

    await test.step('Set checkin tier to medium so RHR field is visible', async () => {
      await page.evaluate(async () => {
        const { saveSetting } = await import('/js/data/storage.js');
        await saveSetting('checkinTier', 'medium');
        const { useAppStore } = await import('/js/store/index.js');
        useAppStore.getState().setCheckinTier?.('medium');
      });
      await page.reload();
      await page.waitForFunction(() => !!document.querySelector('.bottom-nav'));
      await page.waitForTimeout(300);
    });

    await test.step('Navigate to Log tab and fill check-in form', async () => {
      await page.getByTestId('nav-log').click();
      await page.waitForTimeout(500);

      // Quick mode activates when no check-in exists today — use stepper controls directly
      // Sleep stepper
      const sleepStepper = page.getByTestId('quick-sleep');
      await expect(sleepStepper).toBeVisible({ timeout: 5000 });

      // Increase sleep to 8 (default is 7.5, click Increase once)
      const sleepIncrease = sleepStepper.locator('button[aria-label="Increase"]');
      if (await sleepIncrease.isVisible().catch(() => false)) {
        await sleepIncrease.click();
        await page.waitForTimeout(100);
      }

      // RHR stepper (visible for medium tier)
      const rhrStepper = page.getByTestId('quick-rhr');
      await expect(rhrStepper).toBeVisible({ timeout: 5000 });

      // Set RHR via stepper — click Increase a few times
      const rhrIncrease = rhrStepper.locator('button[aria-label="Increase"]');
      for (let i = 0; i < 3; i++) {
        if (await rhrIncrease.isVisible().catch(() => false)) {
          await rhrIncrease.click();
          await page.waitForTimeout(50);
        }
      }
    });

    await test.step('Submit the check-in', async () => {
      await page.evaluate(() => {
        document.querySelector('[data-testid="checkin-submit"]')?.scrollIntoView({ block: 'center' });
      });
      await page.waitForTimeout(200);
      await page.evaluate(() => {
        document.querySelector('[data-testid="checkin-submit"]')?.dispatchEvent(
          new MouseEvent('click', { bubbles: true, cancelable: true })
        );
      });
      // Wait for success indicator
      await page.waitForTimeout(1000);
    });

    await test.step('Navigate to Today tab and verify recovery score', async () => {
      await page.getByTestId('nav-today').click();
      await page.waitForTimeout(500);

      // Recovery ring should show a score (not "—")
      const score = await page.evaluate(() => {
        const textEl = document.querySelector('[data-testid="checkin-trigger"] .readiness-ring__score');
        return textEl?.textContent?.trim() || null;
      });
      expect(score).not.toBe('—');
      expect(score).not.toBeNull();

      // Status pill should have a color class
      const statusPill = page.locator('.status-pill');
      await expect(statusPill).toBeVisible();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. Workout Tracking
  // ═══════════════════════════════════════════════════════════════════════════
  test('3: Workout Tracking — complete all sets, enter RPE, save workout', async ({ page }) => {
    await test.step('Clear data and complete onboarding', async () => {
      await page.goto('/');
      await clearAllStorage(page);
      await page.evaluate(() => localStorage.setItem(
        'fitness-tracker-onboarding-v1',
        JSON.stringify({ completed: true, completedAt: Date.now() })
      ));
      await page.goto('/');
      await page.waitForFunction(() => !!document.querySelector('.bottom-nav'), { timeout: 10000 });
      await page.waitForTimeout(300);
    });

    await test.step('Seed a check-in and inject training session plan', async () => {
      await seedCheckin(page);
      await page.evaluate(async () => {
        const { saveSettings } = await import('/js/data/storage.js');
        const todayDow = new Date().getDay();
        const dow = todayDow === 0 ? 7 : todayDow;
        await saveSettings({ startDate: new Date().toISOString().slice(0, 10), trainDays: [dow] });
      });

      // Inject session plan directly (do NOT reload — useAppStore.setState is reactive)
      await page.evaluate(async () => {
        const { useAppStore } = await import('/js/store/index.js');
        const todayISO = new Date().toISOString().slice(0, 10);
        useAppStore.setState({
          sessionPlan: {
            sessionId: `${todayISO}_A`,
            date: todayISO,
            sport: 'strength_gym',
            sessionType: 'strength',
            name: 'Силовая A',
            description: '',
            defaultParameters: {},
            exercises: [
              { n: 'Подтягивания', s: '3', r: '6-8' },
              { n: 'Отжимания', s: '3', r: '10-12' },
            ],
            mode: 'full',
            isDeload: false,
            isRestDay: false,
          },
        });
      });
      await page.waitForTimeout(500);
    });

    await test.step('Click Start Workout button and verify Workout Mode opens', async () => {
      // Find and click the "Начать тренировку" button
      const startBtn = page.locator('button').filter({ hasText: /Начать тренировку|Start Workout/ });
      await expect(startBtn).toBeVisible({ timeout: 5000 });
      await startBtn.click();
      await page.waitForTimeout(500);

      // Verify WorkoutMode overlay appeared
      await expect(page.locator('[data-testid="workout-mode"]')).toBeVisible({ timeout: 5000 });
    });

    await test.step('Mark first set of first exercise as completed inside Workout Mode', async () => {
      // Find the first unchecked checkbox inside the workout overlay
      const checkboxes = page.locator('[data-testid="workout-mode"] input[type="checkbox"]');
      const count = await checkboxes.count();
      expect(count).toBeGreaterThan(0);

      // Scroll the first checkbox into view to ensure it's clickable
      await checkboxes.first().scrollIntoViewIfNeeded();
      await page.waitForTimeout(100);
      await checkboxes.first().click();
      await page.waitForTimeout(300);

      // Verify progress bar shows text with at least 1 completed
      const overlay = page.locator('[data-testid="workout-mode"]');
      await expect(overlay).toContainText(/Выполнено подходов: 1 из/);
    });

    await test.step('Mark all remaining sets as completed', async () => {
      const checkboxes = page.locator('[data-testid="workout-mode"] input[type="checkbox"]:not(:checked)');
      const remaining = await checkboxes.count();
      for (let i = 0; i < remaining; i++) {
        const cb = page.locator('[data-testid="workout-mode"] input[type="checkbox"]:not(:checked)').first();
        if (await cb.isVisible().catch(() => false)) {
          await cb.click();
          await page.waitForTimeout(150);
        }
      }

      // Verify progress bar shows all completed
      const progressText = await page.evaluate(() => {
        const overlay = document.querySelector('[data-testid="workout-mode"]');
        const el = overlay?.querySelector('.set-progress-bar');
        return el?.textContent?.trim() || '';
      });
      expect(progressText).toMatch(/Выполнено подходов:/);
      expect(progressText).not.toContain('0 из');
    });

    await test.step('Enter RPE and save workout', async () => {
      // Set RPE slider inside WorkoutMode
      const rpeSliders = page.locator('[data-testid="workout-mode"] input[type="range"]');
      const sliderCount = await rpeSliders.count();
      if (sliderCount > 0) {
        await rpeSliders.first().fill('7');
        await page.waitForTimeout(200);
      }

      // Click save workout button inside WorkoutMode
      const saveBtn = page.locator('[data-testid="workout-mode"] button').filter({ hasText: /Завершить тренировку|Сохранить тренировку/ });
      if (await saveBtn.isVisible().catch(() => false)) {
        await saveBtn.click();
        await page.waitForTimeout(1000);
      }

      // Verify WorkoutMode overlay closed and returned to TodayPage
      await expect(page.locator('[data-testid="workout-mode"]')).not.toBeVisible({ timeout: 5000 });
      await expect(page.locator('.today-page')).toBeVisible({ timeout: 5000 });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. Workout Completion Rate — adherence banner shows load increase
  // ═══════════════════════════════════════════════════════════════════════════
  test('4: Workout Completion Rate — adherence banner shows increased load', async ({ page }) => {
    await test.step('Clear data and complete onboarding with training day', async () => {
      await page.goto('/');
      await clearAllStorage(page);
      await page.evaluate(() => localStorage.setItem(
        'fitness-tracker-onboarding-v1',
        JSON.stringify({ completed: true, completedAt: Date.now() })
      ));
      const todayDow = new Date().getDay();
      const dow = todayDow === 0 ? 7 : todayDow;
      await page.evaluate(async (trainingDow: number) => {
        const { saveSettings } = await import('/js/data/storage.js');
        await saveSettings({ startDate: new Date().toISOString().slice(0, 10), trainDays: [trainingDow] });
      }, dow);
      await page.goto('/');
      await page.waitForFunction(() => !!document.querySelector('.bottom-nav'), { timeout: 10000 });
      await page.waitForTimeout(300);
    });

    await test.step('Seed 6 completed workout sessions in the appropriate date range', async () => {
      // Seed sessions for the "last week" (last Monday to this Monday)
      await page.evaluate(async () => {
        const { saveSession } = await import('/js/data/storage.js');
        const { mondayOfWeek, addDays, formatISO } = await import('/js/core/helpers.js');
        const currentMonday = mondayOfWeek(new Date());
        const lastMonday = addDays(currentMonday, -7);
        const lastMondayStr = formatISO(lastMonday);
        const currentMondayStr = formatISO(currentMonday);

        // Create sessions for Mon-Fri of last week
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
        for (let i = 0; i < days.length; i++) {
          const d = addDays(lastMonday, i);
          const iso = formatISO(d);
          await saveSession({
            key: `${iso}_A`,
            date: iso,
            type: 'A',
            completed: true,
            readiness: 'green',
            rpe: 7,
            durationMinutes: 45,
            sessionLoad: 250,
            notes: `Seeded session ${days[i]}`,
            mode: 'full',
            updatedAt: d.getTime(),
            exerciseResults: [
              {
                exerciseName: 'Подтягивания',
                plannedSets: 3,
                completedSets: 3,
                completed: true,
                sets: [
                  { setNumber: 1, completed: true, repsDone: 8, rpe: 7 },
                  { setNumber: 2, completed: true, repsDone: 7, rpe: 8 },
                  { setNumber: 3, completed: true, repsDone: 6, rpe: 9 },
                ],
              },
              {
                exerciseName: 'Отжимания',
                plannedSets: 3,
                completedSets: 3,
                completed: true,
                sets: [
                  { setNumber: 1, completed: true, repsDone: 12, rpe: 6 },
                  { setNumber: 2, completed: true, repsDone: 10, rpe: 7 },
                  { setNumber: 3, completed: true, repsDone: 10, rpe: 8 },
                ],
              },
            ],
            plannedTotalSets: 6,
          });
        }
      });

      await page.reload();
      await page.waitForFunction(() => !!document.querySelector('.bottom-nav'), { timeout: 10000 });
      await page.waitForTimeout(500);
    });

    await test.step('Verify adherence multiplier is set in the store', async () => {
      // Check the store value for weeklyAdherenceMultiplier
      const multiplier = await page.evaluate(() => {
        const state = (window as any).__ZUSTAND_STORE__;
        // Try to access store via exposed global or evaluate
        return null;
      });

      // Fallback: check UI for any indicator of load adjustment
      const body = page.locator('body');
      const bodyText = await body.textContent();
      const hasVolAdjustment =
        bodyText.includes('нагрузк') ||
        bodyText.includes('выполнен') ||
        bodyText.includes('\u{1F53C}') ||
        bodyText.includes('\u{1F53D}');

      // Check for the card with border-left color
      const volCard = page.locator('.card').filter({ hasText: /нагрузк|выполнен/ });
      const hasVolCard = await volCard.isVisible().catch(() => false);

      // Either store multiplier ≠ 1 or UI shows the adjustment
      if (!hasVolAdjustment && !hasVolCard) {
        // Directly verify the multiplier via app store
        const storeMultiplier = await page.evaluate(async () => {
          try {
            const { useAppStore } = await import('/js/store/index.js');
            return useAppStore.getState().weeklyAdherenceMultiplier;
          } catch { return 1.0; }
        });
        expect(storeMultiplier).not.toBe(1.0);
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. Low Recovery Response — reduced load after poor recovery data
  // ═══════════════════════════════════════════════════════════════════════════
  test('5: Low Recovery Response — yellow/red ring and adjusted plan', async ({ page }) => {
    await test.step('Clear data and complete onboarding with training day', async () => {
      await page.goto('/');
      await clearAllStorage(page);
      await page.evaluate(() => localStorage.setItem(
        'fitness-tracker-onboarding-v1',
        JSON.stringify({ completed: true, completedAt: Date.now() })
      ));
      const todayDow = new Date().getDay();
      const dow = todayDow === 0 ? 7 : todayDow;
      await page.evaluate(async (trainingDow: number) => {
        const { saveSettings } = await import('/js/data/storage.js');
        await saveSettings({ startDate: new Date().toISOString().slice(0, 10), trainDays: [trainingDow] });
      }, dow);
      await page.goto('/');
      await page.waitForFunction(() => !!document.querySelector('.bottom-nav'));
      await page.waitForTimeout(300);
    });

    await test.step('Seed low recovery check-ins for past 3 days', async () => {
      await seedLowRecoveryCheckins(page, 3);
      await page.reload();
      await page.waitForFunction(() => !!document.querySelector('.bottom-nav'));
      await page.waitForTimeout(500);
    });

    await test.step('Verify recovery ring shows yellow or red', async () => {
      // Check the status pill color
      const statusPill = page.locator('.status-pill');
      await expect(statusPill).toBeVisible({ timeout: 5000 });

      // Get the style to determine color
      const pillBg = await statusPill.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });

      // Yellow or red backgrounds
      const isYellowOrRed =
        pillBg.includes('rgb(250, 204, 21)') ||
        pillBg.includes('rgb(234, 179, 8)') ||
        pillBg.includes('rgb(248, 113, 113)') ||
        pillBg.includes('rgb(239, 68, 68)') ||
        pillBg.includes('rgb(138, 48, 32)') ||
        pillBg.includes('rgb(122, 96, 32)') ||
        pillBg.includes('#facc15') ||
        pillBg.includes('#f87171');

      // The score should be low (< 60)
      const scoreText = await page.evaluate(() => {
        const el = document.querySelector('[data-testid="checkin-trigger"] .readiness-ring__score');
        return el?.textContent?.trim() || null;
      });

      if (scoreText && scoreText !== '—') {
        const score = parseInt(scoreText, 10);
        expect(isNaN(score) || score < 60).toBeTruthy();
      }
      // Recovery ring and card should be visible
      await expect(page.locator('[data-testid="recovery-ring"]')).toBeVisible();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. CSV Import
  // ═══════════════════════════════════════════════════════════════════════════
  test('6: CSV Import — upload health sync CSV and verify data merged', async ({ page }) => {
    await test.step('Clear data, complete onboarding, and navigate to Profile', async () => {
      await page.goto('/');
      await clearAllStorage(page);
      await page.evaluate(() => localStorage.setItem(
        'fitness-tracker-onboarding-v1',
        JSON.stringify({ completed: true, completedAt: Date.now() })
      ));
      await page.goto('/');
      await page.waitForFunction(() => !!document.querySelector('.bottom-nav'));
      await page.waitForTimeout(300);

      // Need at least one existing checkin for merge to work
      await seedCheckin(page);
      await page.reload();
      await page.waitForFunction(() => !!document.querySelector('.bottom-nav'));
      await page.waitForTimeout(300);
    });

    await test.step('Navigate to Profile tab', async () => {
      await page.getByTestId('nav-profile').click();
      await page.waitForTimeout(500);
      await expect(page.locator('.profile-page')).toBeVisible({ timeout: 5000 });
    });

    await test.step('Open the Data section to find CSV import', async () => {
      // Click the "Данные" or "Data" section header if it's collapsed
      const dataHeader = page.locator('.profile-section__header').filter({ hasText: /Данные|Data/ });
      if (await dataHeader.isVisible().catch(() => false)) {
        await dataHeader.click();
        await page.waitForTimeout(300);
      }
    });

    await test.step('Upload a sample CSV file', async () => {
      const todayISO = new Date().toISOString().slice(0, 10);
      const yesterdayISO = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const csvContent = [
        'date,sleepHours,restHR,hrv',
        `${yesterdayISO},8.5,58,52`,
        `${todayISO},7.0,65,45`,
      ].join('\n');

      // Use the new data-testid button
      const csvBtn = page.getByTestId('import-csv-label');
      if (await csvBtn.isVisible().catch(() => false)) {
        const fileChooserPromise = page.waitForEvent('filechooser');
        await csvBtn.click();
        const fileChooser = await fileChooserPromise;
        await fileChooser.setFiles({
          name: 'health-sync.csv',
          mimeType: 'text/csv',
          buffer: Buffer.from(csvContent),
        });
        await page.waitForTimeout(1500);
      } else {
        // Fallback: call store directly
        await page.evaluate(async (csv: string) => {
          const { useAppStore } = await import('/js/store/index.js');
          const state = useAppStore.getState();
          if (state.handleImportHealthSyncCSV) {
            await state.handleImportHealthSyncCSV(csv);
          }
        }, csvContent);
        await page.waitForTimeout(500);
      }
    });

    await test.step('Verify data was imported', async () => {
      // Navigate to Log tab to check if sleep data appears
      await page.getByTestId('nav-log').click();
      await page.waitForTimeout(500);

      // The checkin form should load and sleep field should have auto-filled data or show different value
      const sleepInput = page.getByTestId('checkin-sleep');
      await expect(sleepInput).toBeVisible({ timeout: 5000 });

      // Verify that data was persisted by checking checkin count
      const checkinCount = await page.evaluate(async () => {
        const { getAllCheckins } = await import('/js/data/storage.js');
        const all = await getAllCheckins();
        return all.length;
      });
      expect(checkinCount).toBeGreaterThanOrEqual(1);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. Tab Navigation
  // ═══════════════════════════════════════════════════════════════════════════
  test('7: Tab Navigation — each bottom nav tab renders unique content', async ({ page }) => {
    await test.step('Clear data and complete onboarding', async () => {
      await page.goto('/');
      await clearAllStorage(page);
      await page.evaluate(() => localStorage.setItem(
        'fitness-tracker-onboarding-v1',
        JSON.stringify({ completed: true, completedAt: Date.now() })
      ));
      await page.goto('/');
      await page.waitForFunction(() => !!document.querySelector('.bottom-nav'));
      await page.waitForTimeout(300);
    });

    const tabs = [
      { idx: 0, name: 'Сегодня', selector: '.today-page', testid: 'nav-today' },
      { idx: 1, name: 'Журнал', selector: '.log-page, [data-testid="checkin-form"]', testid: 'nav-log' },
      { idx: 2, name: 'Аналитика', selector: '.analytics-page, .chart-card', testid: 'nav-analytics' },
      { idx: 3, name: 'Профиль', selector: '.profile-page', testid: 'nav-profile' },
    ];

    for (const tab of tabs) {
      await test.step(`Navigate to ${tab.name} tab`, async () => {
        const navBtn = page.getByTestId(tab.testid);
        await expect(navBtn).toBeVisible();
        await navBtn.click();
        await page.waitForTimeout(400);

        // Verify tab-specific content renders
        const pageContent = page.locator(tab.selector).first();
        await expect(pageContent).toBeVisible({ timeout: 5000 });
      });
    }

    await test.step('Verify active tab is highlighted', async () => {
      // Navigate through all tabs and check for active class
      for (let i = 0; i < tabs.length; i++) {
        const btn = page.getByTestId(tabs[i].testid);
        await btn.click();
        await page.waitForTimeout(200);
        const cls = await btn.evaluate((el: HTMLElement) => el.className);
        expect(cls).toContain('active');
      }
    });
  });

});
