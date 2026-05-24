# Smart Fitness Coach — Complete Project Status

## Quality Gates ✅
- TypeScript: 0 errors (`npx tsc --noEmit`)
- Tests: 240+ passing (26 files, 0 failures)
- Build: Clean compilation

## Complete Feature Set

### Phase 1: Foundation ✅
- React 18 + TypeScript strict + Vite 8
- Zustand single store with derived state computation
- Dexie.js IndexedDB persistence (sessions, checkins, settings, achievements)
- Offline-first PWA with Workbox service worker
- Dark theme with CSS custom properties
- 153 original unit tests

### Phase 2: Personalization ✅
- Tiered Recovery Score (Full/Medium/Light weights based on gadget availability)
- APRE autoregulation engine (Mann tables, 56 tests)
- HRV zones guide with color-coded recommendations
- 12-week modular training plans (8 sport templates: running, strength_gym, cycling, swimming, calisthenics, yoga, stretching, walking)
- Multi-sport selection in onboarding with combineSportPlans() engine
- Gadget selection with auto-tier-derivation
- Guided 5-step onboarding wizard
- i18n (Russian/English translations)
- Guided spotlight tour (8 steps with animated tooltips + pulse highlights)
- UserProfile with level, goals, equipment, rehab configuration

### Phase 3: Adaptivity ✅
- Virtual date offset system (getAppDate/getAppTodaySync helpers)
- `virtualTodayOffset` persisted in Zustand + IndexedDB
- All date-sensitive logic uses virtual date (planning, recovery score, stats)
- 30-day scrollable strip in TodayPage with week navigation arrows
- Negative offset support (past date navigation)
- Period-over-period analytics comparison (getPeriodComparison)
- Chart SVG hover tooltips in TrendChart

### Phase 4: Advanced Profile & Rehab 🆕
- **UserProfileEditor** — Level (beginner/intermediate/advanced), goals (hypertrophy/strength/endurance/rehabilitation), equipment selection
- **Rehab exercise filtering** — exerciseLibrary with avoidIf/rehabFor metadata, automatic exercise substitution
- **Equipment-aware planning** — Exercises filtered by available equipment (barbell→dumbbells→resistance bands substitution)
- **Level-based sets** — beginner: 2-3, intermediate: 3-4, advanced: 4-5
- **Goal-based reps** — hypertrophy: 8-12, strength: 3-6, endurance: 15-20, rehabilitation: 10-15
- **Profile adaptation** — getAdaptedSessionForDate() combines readiness + rehab + profile filtering

### Architecture: New Modules 🆕
- `js/core/exerciseDatabase.ts` — Exercise library with rehab/equipment metadata
- `js/core/warmup.ts` — Warmup routine generator (planned)
- `js/ui/components/UserProfileEditor.jsx` — Profile configuration form
- `js/ui/components/LiveWorkoutMode.jsx` — Live workout timer + per-set logging (planned)

### Demo Mode ✅
- Deterministic synthetic data generator (seeded PRNG, 30 days)
- Realistic athlete recovery patterns (sinusoidal + noise)
- Separate IndexedDB `SmartFitnessCoachDemo` for complete isolation
- activateDemoMode/deactivateDemoMode store actions with backup/restore
- Developer panel in ProfilePage (±7, ±1, Today, demo toggle)
- Demo badge in app header (animated pulse)

## Bug Fixes (Recent Sessions)
1. Fixed 44 TypeScript compilation errors across 12 files
2. TodayPage `trainType` → derived from `sessionPlan?.sessionType`
3. `weekNumber` → `totalWeek` property rename
4. Store imports cleaned up (removed 6 unused imports)
5. `manifest.json` path fixed
6. Vite HMR WebSocket CDP limitation documented

## Test Coverage (240+ tests, 26 files)
- Original: 153 tests (11 files)
- New: 87+ tests (8 new files)
  - demoData.test.ts: 8 tests
  - helpers.test.ts: 6 tests
  - useAppStore.offset.test.ts: 4 tests
  - TodayPage.weekly.test.tsx: 2 tests
  - storage.demo.test.ts: 2 tests
  - deriveTier.test.ts: 8 tests
  - recoveryScore.test.ts: 11 tests
  - OnboardingWizard.test.tsx: 6 tests
  - CheckinForm.test.tsx: 4 tests
  - planning.test.ts: 16 tests (updated with new filters)

## File Structure (Key Files)
- `js/app.tsx` — Entry point, layout, demo badge
- `js/stores/useAppStore.ts` — Central store with virtual offset + demo mode + weeklyTemplate + profile
- `js/config/constants.js` — Training plans, zones, sport categories, gadgets, tour steps
- `js/core/helpers.ts` — Date utilities (getAppDate, parseLocalDate, formatISO)
- `js/core/demoData.ts` — Deterministic synthetic data generator
- `js/core/storage.ts` — Dexie CRUD with demo mode + profile persistence
- `js/core/planning.ts` — Workout planning with periodization + profile adaptation
- `js/core/recoveryScore.ts` — Tiered recovery score calculation
- `js/core/exerciseDatabase.ts` — Exercise library with rehab/equipment metadata 🆕
- `js/core/apre/engine.js` — APRE autoregulation engine
- `js/plans/running.ts` — Running plan module
- `js/plans/strength.ts` — Strength plan module (sport: 'strength_gym')
- `js/plans/cycling.ts` — Cycling plan module 🆕
- `js/plans/swimming.ts` — Swimming plan module 🆕
- `js/plans/calisthenics.ts` — Calisthenics plan module 🆕
- `js/plans/yoga.ts` — Yoga plan module 🆕
- `js/plans/stretching.ts` — Stretching plan module 🆕
- `js/plans/walking.ts` — Walking plan module 🆕
- `js/ui/pages/TodayPage.jsx` — Dashboard with weekly strip + rehab notification
- `js/ui/pages/ProfilePage.jsx` — Settings with developer panel + integrations + rehab config
- `js/ui/components/UserProfileEditor.jsx` — Profile configuration form 🆕
- `js/ui/components/OnboardingWizard.jsx` — 5-step onboarding

---

## Development Workflow

### Build & Test
```bash
npm run build          # Vite production build
npx tsc --noEmit      # TypeScript type checking
npm test               # Vitest test suite (240+ tests)
npx vitest run --reporter=verbose  # Detailed test output
```

### Key Patterns
- `define config → add types → update store → update UI → write tests → run test suite → verify via Chrome DevTools MCP`
- All user data stored locally in IndexedDB only (no external APIs)
- Recovery Score drives workout readiness decisions (green/yellow/red)
- APRE protocol supports 3, 6, or 10 rep schemes with automatic load adjustment
- 12-week periodization program across 8 sport templates

### Known Issues
- Vite HMR WebSocket doesn't connect through CDP browser → manual hard reload (Ctrl+Shift+R) needed
- TodayPage uses React.createElement (legacy code, not JSX) — exception in CONVENTIONS.md
