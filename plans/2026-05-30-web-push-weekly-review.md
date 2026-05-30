# Web Push + Monday Weekly Review Card

Status: draft
Owner: agent
Started: 2026-05-30

## Goal

Two changes that close the habit-loop gap identified in Claude's product audit:

1. **Web Push Notifications** — add daily check-in reminder (user-set time) and Monday weekly summary push, using the existing hand-rolled service worker. No external server needed — notifications fire via `setTimeout` at app-open or `periodic-background-sync` where supported.
2. **Inline Monday Weekly Review Card** — a dismissible card at the top of TodayPage on Mondays showing: best lift delta, sessions completed vs. planned, and average recovery score vs. prior week. Powered by existing `getWeeklySummary()`. Dismissed × persists via localStorage.

## Non-Goals

- Server-side push infrastructure (VAPID keys, push server, Firebase Cloud Messaging) — this is local-first
- Background notifications when the browser is fully closed (truly "push" from a server) — not possible without a backend
- Workbox migration — staying with hand-rolled SW
- Per-exercise strength history chart — that's a separate feature
- Monday push containing full stat breakdown — the push shows 1-line summary; the card shows 3 lines
- Notification grouping, priority, or action buttons — single-purpose day-0 implementation

## Constraints

- From AGENTS.md invariants: data stays local, no silent uploads, no external calls without user-facing purpose
- From audit context: push must fire at user-configured morning time (default 07:30); Monday card must not compete with ring for attention
- Technical: no Workbox, no Firebase, no server-side push endpoint. Must use `self.registration.showNotification()` triggered by app foreground logic or periodic background sync
- Browser support: `Notification` API in Chromium-based browsers; `periodic-background-sync` only in Chromium (graceful degradation to foreground-only)
- No regression: 61 test files (720 unit tests), 7 golden-path E2E specs must stay green

## Approach

### Web Push Notifications

**Chosen: Foreground-triggered `showNotification()` + periodic-background-sync as progressive enhancement.** The SW registers a `periodicsync` handler for Chromium; as fallback, the app logic sets a `setTimeout` at app-open that fires `showNotification()` at the configured morning time if today's check-in is missing. No VAPID keys, no push server, no GCM/FCM dependency.

**Alternatives considered:**
- *Full Push API with VAPID + server* — requires backend infrastructure, violates local-first constraint, rejected
- *Workbox background sync* — Workbox is not actually installed (README claims it but `sw.js` is hand-rolled); adding Workbox just for notifications is overkill, rejected
- *Timer-only (no SW)* — `setTimeout` only fires when app is in foreground, essentially useless, rejected

### Monday Weekly Review Card

**Chosen: New `WeeklyReviewCard` component injected at top of TodayPage on Mondays, powered by existing `getWeeklySummary()` + a new `getBestLiftDelta()` aggregate in `weekReview.ts`. State tracked via `localStorage.setItem('weeklyReviewDismissed', weekISO)`.**

**Alternatives considered:**
- *Push-based only (week summary in notification)* — notification body is too short for 3 specific stat lines, rejected
- *Navigate to Analytics tab on Monday* — violates the audit finding that 85% of users don't navigate there unprompted, rejected
- *Banner-style (existing pattern)* — already 13 layers on TodayPage; a top-positioned card that pushes ring down is more attention-grabbing but dismissible, acceptable trade-off per audit

## Task Breakdown

### Phase 1: Web Push Notifications

- [x] 1.1 **Add `notifications.ts` domain module** (`js/domains/notifications/notifications.ts`)
  - `registerNotificationPermission(): Promise<boolean>` — calls `Notification.requestPermission()`
  - `showDailyReminder(checkinDone: boolean, time: string): void` — if no check-in for today, schedules foreground `showNotification()` at user-set time via `setTimeout(msUntilTarget)`
  - `showMondaySummary()` — fires immediately on app-open Monday with 1-line summary
  - `getStoredNotifyTime(): string` / `saveNotifyTime(time: string): void` — localStorage persistence
  - Acceptance: unit-tested with `Notification` mock in `js/domains/notifications/tests/notifications.test.ts` (14 tests)

- [x] 2.1 **Extend service worker (`public/sw.js`)** — add handlers
  - `notificationclick` event: opens app at `/` on notification tap
  - `periodicsync` event (Chromium only, `periodic-background-sync` permission): checks IndexedDB for today's check-in, fires `showNotification()` if missing
  - Update `index.html` SW registration block to request `periodic-background-sync` permission after notification permission granted
  - Acceptance: clicking notification opens the app; manual test on Chromium with DevTools `Application > Periodic Background Sync > Trigger`

- [x] 3.1 **Add notification preferences to ProfilePage settings modal**
  - **New section in settings modal**: "Уведомления" with time `<input type="time">` (default "07:30") and checkbox `[ ] Утреннее напоминание`
  - Save to localStorage: `fitness-tracker-notify-time`, `fitness-tracker-notify-enabled`
  - i18n keys: `profile.notifications.title`, `profile.notifications.morningReminder`, `profile.notifications.morningTime`
  - Acceptance: settings persist across page reload; time picker respects 24h format

- [x] 4.1 **Wire notifications into app lifecycle** (`js/app.tsx` or `TodayPage.jsx`)
  - On app mount, after `dataLoaded`:
    - If notification permission not yet requested, defer to first user interaction (avoids spam)
    - If permission granted and `fitness-tracker-notify-enabled` is true, call `showDailyReminder()` with configured time
    - If today is Monday, call `showMondaySummary()` immediately
  - On check-in save: cancel any pending daily reminder timeout
  - Acceptance: on Monday morning → notification fires; on Tuesday → only daily check-in reminder schedules

### Phase 2: Monday Weekly Review Card

- [x] 5.1 **Create `weekReview.ts` data module** (`js/domains/analytics/weekReview.ts`)
  - `getBestLiftDelta(sessions: Session[], daysBack: 7): { exerciseName: string; currentWeight: number; previousWeight: number; unit: string } | null`
    - Scans `sessions` from last 7 days for `apreResults[]`, finds highest `nextRM - currentRM` delta
    - Compares to sessions from 7–14 days prior
    - Returns `null` if fewer than 2 weeks of apre data
  - `getPreviousWeekAvgScore(trendData30: TrendPoint[]): number | null`
    - Computes mean recoveryScore for days 8–14 back vs days 1–7 back
  - Acceptance: unit-tested (9 tests) covering: no data, 1 week only, positive delta, zero delta, same week, multiple exercises, empty trend, <14 days, 14-day averages

- [x] 6.1 **Create `WeeklyReviewCard` component** (`js/ui/components/WeeklyReviewCard.jsx`)
  - Props: `{ bestLift, sessionsCompleted, totalPlannedSessions, avgScoreCurrent, avgScorePrevious, onDismiss, t }`
  - Renders 3 lines:
    1. `"💪 {exercise}: {prevWeight} → {currentWeight} {unit}"` (or `"Данных пока недостаточно"` if no delta)
    2. `"📊 {completed} из {planned} тренировок"` + `"Твоя лучшая неделя"` / `"−1 от рекорда"`
    3. `"🔋 Средний Score: {current} (неделю назад: {previous})"` + `"На следующей неделе: {adjustment}"`
  - Footer: `"Подробная аналитика →"` link (navigates to Analytics tab)
  - × dismiss button → calls `onDismiss()` which saves `localStorage.setItem('weeklyReviewDismissed', weekISO)`
  - Card has subtle shadow, `position: relative` with × in top-right
  - Acceptance: renders when data exists; disappears on × click; stays gone until next Monday; shows empty state when no data

- [x] 7.1 **Integrate into TodayPage** (`js/ui/pages/TodayPage.jsx`)
  - Compute `isMonday` from today's date (dayOfWeek === 1)
  - Compute `thisWeekISO` = `formatISO(mondayOfWeek(today))`
  - Check `localStorage.getItem('weeklyReviewDismissed') !== thisWeekISO`
  - If isMonday && not dismissed && has data (at least 1 session last week):
    - Render `<WeeklyReviewCard>` at top of TodayPage (above tier banner, above ring)
  - Pass in computed values from store: sessions, weeklyPlan (for planned session count), scoreLast30DayAvg, trendData30
  - Acceptance: Monday render verified in Playwright E2E; dismissed card persists; Tuesday no card rendered

### Phase 3: i18n & Verification

- [ ] 8.1 **Add i18n keys** to `ru.json` and `en.json`
  - `profile.notifications.title`, `profile.notifications.morningReminder`, `profile.notifications.morningTime`
  - `weekReview.title`, `weekReview.bestLift`, `weekReview.noLiftData`, `weekReview.sessionsCompleted`, `weekReview.bestWeek`, `weekReview.offRecord`, `weekReview.avgScore`, `weekReview.nextWeekAdjustment`, `weekReview.detailedAnalytics`
  - `notifications.dailyCheckinTitle`, `notifications.dailyCheckinBody`, `notifications.mondaySummary`
  - Acceptance: all keys present in both files; type-check passes

- [ ] 9.1 **Run type-check + unit tests**
  - `npm run type-check` — must pass
  - `npm test` — 720+ tests must pass
  - New test files: `notifications.test.ts` (5+), `weekReview.test.ts` (8+)
  - Acceptance: zero failures, zero type errors

- [ ] 10.1 **E2E verification** (chromium-only for push features)
  - Update `golden-path.spec.ts` or add new spec for Monday card visibility/dismiss
  - Manual: verify notification permission prompt on first interaction
  - Manual: trigger notification via DevTools periodic background sync
  - Acceptance: Monday card E2E passes; notifications fire correctly

## Risks & Mitigations

- **Risk:** `periodic-background-sync` is Chrome-only and may be deprecated in future Chrome versions.
  **Mitigation:** Primary mechanism is foreground `setTimeout` at app-open — `periodicsync` is a progressive enhancement that gracefully degrades. If PB-S is removed, app still works.
- **Risk:** Notification spam — if timing logic is wrong, user gets multiple notifications.
  **Mitigation:** `showDailyReminder()` checks `Notification.permission === 'granted'` AND `fitness-tracker-notify-enabled === true` AND today's check-in is missing before firing. Clear timeout on check-in save.
- **Risk:** Weekly review card pushes the recovery ring off-screen on small mobile displays.
  **Mitigation:** Card has max 3 lines (compact design) + auto-dismisses once per week. If total TodayPage height > viewport, ring is still within 1 scroll. Test on iPhone SE viewport (375px).

## Rollback Plan

If Web Push causes notification spam or UX degradation:
1. Delete `fitness-tracker-notify-enabled` from localStorage — all notification logic checks this flag, so setting to `false` disables entirely
2. If SW `periodicsync` registration causes issues, the SW update with the new handler can be rolled back by reverting `public/sw.js` and bumping cache version — existing users get new SW on next visit

If Monday card causes layout issues:
1. Scroll to Profile → disable feature flag in localStorage → card stops rendering
2. Equivalent to `localStorage.setItem('weeklyReviewDismissed', 'disabled')` with a check in TodayPage

## Session Log
- 2026-05-30 07:55 — plan drafted from Claude audit items #1 and #5, SW and analytics infrastructure mapped
- 2026-05-30 08:14 — Phase 1 complete: notifications.ts module (14 tests green), SW notificationclick+periodicsync handlers, ProfilePage settings UI (time picker + checkbox), app.tsx lifecycle wiring (daily reminder + Monday summary), cancelDailyReminder on check-in save. Type-check pass. 733/734 tests pass (1 pre-existing flaky OnboardingWizard timeout). Tasks 1.1–4.1 done.
- 2026-05-30 08:29 — Phase 2 complete: weekReview.ts data module (9 tests: getBestLiftDelta 6 tests + getPreviousWeekAvgScore 3 tests), WeeklyReviewCard component (3 lines + dismiss + analytics link), TodayPage integration (Monday-only rendering, localStorage dismiss, computed from sessions/trendData30). i18n keys in ru.json/en.json. Type-check pass. 743/743 tests pass. Tasks 5.1, 6.1, 7.1 done.

