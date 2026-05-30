# Plan — User Customization (Beg-Int Rehab-Aware Calisthenics & Posture Optimization)

For the Smart Fitness Coach, we are implementing a personal customization tier for the user (20 y.o. developer with "gamer posture", clicking/shortened right hip, hypermobile left shoulder, and asthma). This will make the app extremely profitable and practical for daily use, cutting choice paralysis and preventing injury.

---

## 1. Objectives

1. **Custom Weekly Template**: Set defaults to a Calisthenics + Walking + Stretching split (6 days active, 1 day rest) instead of Running/Strength.
2. **Postural & Scapular Calisthenics Module**: Rewrite `calisthenics.ts` to feature beginner-intermediate rehab-safe exercises (scapular pull-ups, parallel grips, push-up plus, lower traps, core/dead-bugs).
3. **Optimized Quick Check-In**: Change default onboarding settings and profile defaults to match the user's exact parameters (level: beginner, goal: rehabilitation, equipment: pull-up bar + light dumbbells, rehab issues: hips, shoulder, back).
4. **TodayPage UX Enhancement**: Fix the UI so that today's plan, modifications, and safety instructions ("What NOT to do") are prominently featured, reducing cognitive load.

---

## 2. Proposed Changes

### A. Calisthenics Sport Module (`js/plans/calisthenics.ts`)
*   **Base Phase**:
    *   **Day 1 (Pull + Posture)**: Parallel-Grip Active Pull-ups (with advice to tense shoulders, no dead-hangs), Scapular Pull-ups (3x8), W-Raises (with 1.5kg dumbbells for lower trap reinforcement), Dead-Bug (3x10).
    *   **Day 3 (Push + Serratus)**: Push-up Plus (3x8, scapular protraction for gamer posture), Knee Push-ups or incline push-ups (3x10, temp 3-0-1), External Rotations (with resistance band/dumbbell, 3x10), L-sit Prep (supported or on parallel bars).
    *   **Day 5 (Legs + Core)**: Glute Bridge (unilateral to fix shortened iliopsoas/glute imbalance), Clamshells (3x12, gluteus medius stabilization), Backward lunges (light/assisted to protect hip labrum), Bird-dog (3x10).
*   **Build/Peak Phases**: Gradual rep/set increases but maintaining parallel grips, scapular pre-activation, and posture integrity.
*   **Deload Phase**: 10-15 min mobility, box breathing (for asthma/RHR recovery), and passive iliopsoas release.

### B. App Store Defaults & Onboarding (`js/stores/useAppStore.ts`)
*   Change the default `weeklyTemplate` and onboarding template to:
    *   `days`: `['calisthenics', 'walking', 'stretching', 'calisthenics', 'walking', 'stretching', null]`
    *   `sportOrder`: `['calisthenics', 'walking', 'stretching']`
*   Set initial profile states:
    *   `profileLevel`: `'beginner'`
    *   `profileGoals`: `['rehabilitation', 'strength']`
    *   `profileEquipment`: `{ pullup_bar: true, dumbbells_max_kg: 4 }`
    *   `rehabIssues`: `['hips', 'shoulder', 'back']`
    *   `checkinTier`: `'medium'` (chaotic sleep makes medium RHR + Sleep + Subjective check-in optimal).

### C. TodayPage UI Focus (`ui/pages/TodayPage.jsx`)
*   Ensure TodayPage clearly renders:
    *   A warning card if recovery score is low or if active rehab issues exist.
    *   The dynamic "Do Not Do" list based on `avoidIf` in their profile.
    *   Gamer posture check-in nudges.

---

## 3. Verification & Safety

*   **Type-checking**: Run `npm run type-check` to ensure TypeScript compilation passes.
*   **Unit Tests**: Run `npm test` to verify no regressions in the planning or store state logic.
*   **Rollback Plan**:
    *   Backup original `calisthenics.ts` and `useAppStore.ts` before editing.
    *   If any issues occur, revert to the backup files.
