AGENTS.md — Smart Fitness Coach
This file provides AI coding agents with the essential context to work effectively on this project. Inspired by analysis of 2,500+ repositories and proven to reduce runtime by 28% and tokens by 16% in controlled studies.

🎯 Project Identity
Smart Fitness Coach — An open-source personal training coach (Whoop/Athlytic alternative). Zero subscription, zero cloud, full privacy.

Primary goal: Answer "Am I ready to train today and what exactly should I do?" with transparent, science-based autoregulation.

Core value: APRE-based load adjustment + tiered recovery scoring + user profile adaptation, not a "black box."

Target user: Amateur athletes who want evidence-based training without paying $30/month. Supports 8 sports, rehabilitation filtering, and equipment-aware planning.

🛠️ Tech Stack (Exact Versions)
```
React 18.2.0 + TypeScript 5.x (strict) + Vite 8 + Zustand 5 + Dexie.js 4
Vitest 4 + @testing-library/react 16 + Workbox 7 + react-i18next 17
UI Primitives: @base-ui/react 1.5 (Collapsible, Dialog only)
Icons: Lucide React 1.16 (named imports, no Icon suffix)
Styling: Custom CSS only (design-tokens.css + styles.css) — NO Tailwind, NO Bootstrap
Storage: IndexedDB via Dexie.js (checkins, sessions, settings, achievements)
State: Single Zustand store (useAppStore.ts) with computed derived state
i18n: Russian (default) + English via react-i18next (locales: ru.json, en.json)
```

📁 Key Directories
```
js/core/          — Domain logic (readiness, recoveryScore, planning, exerciseDatabase)
js/plans/         — 8 sport plan modules (running, strength_gym, cycling, swimming, calisthenics, yoga, stretching, walking)
js/stores/        — Zustand store (useAppStore.ts)
js/ui/pages/      — TodayPage.jsx, ProfilePage.jsx, CheckinForm.jsx, AnalyticsPage.jsx
js/ui/components/ — OnboardingWizard, UserProfileEditor, GuidedTour, Modal, etc.
js/config/        — constants.js, tour-steps.js
docs/             — ANALYSIS_REPORT.md, audit-report.md, I18N_SETUP.md
memory-bank/      — progress.md, master-plan.md, systemPatterns.md
```

🚫 Absolute Prohibitions
No jQuery, Bootstrap, Tailwind, or any CSS framework

No external API calls (weather, GPS, social — all data stays local)

No server-side rendering (pure client-side SPA)

No cloud storage (no user data leaves the device)

No Redux or React Context for global state (Zustand only)

No any type in core/ modules (use unknown + type guards)

No React.createElement in NEW code (JSX only) — except TodayPage.jsx (legacy)

🏗️ Architecture (One Flow)
text
Check-in → Dexie (IndexedDB) → computeDerived() → UI (React)
text
js/
├── app.tsx                         # Entry: React root, lazy pages, BottomNav, OnboardingWizard
├── stores/useAppStore.ts           # Single Zustand store + computeDerived()
├── core/                           # Pure functions (NO side effects except storage)
│   ├── readiness.ts                # calcReadiness, detectRecoveryDebt
│   ├── recoveryScore.ts            # Tiered recovery (full/medium/light weights)
│   ├── planning.ts                 # buildWeeklyPlan, getSessionForDate
│   ├── stats.ts                    # getWeeklySummary, getStreak
│   ├── analytics.ts                # getTrendData, detectNegativeTrends
│   ├── advice.ts                   # getCoachAdvice
│   ├── apre/engine.js              # APRE Mann tables (56 tests)
│   └── helpers.ts                  # getAppDate, parseLocalDate, formatISO
├── plans/                          # Modular sport plans (running.ts, strength.ts)
├── ui/pages/                       # 5 tab pages + sub-components
├── ui/components/                  # Reusable components (CheckinHistory, HeatmapGrid, etc.)
├── i18n/                           # Locale files (ru.json, en.json)
├── tests/                          # Vitest tests (24 files, 225+ tests)
└── ...
📁 File Naming & Structure
Type	Pattern	Example
React components	PascalCase.jsx	TodayPage.jsx, ExerciseCard.jsx
Core utilities	camelCase.ts	recoveryScore.ts, helpers.ts
Tests	*.test.ts or .test.tsx	planning.test.ts, TodayPage.test.tsx
Types	types.ts (single file)	js/core/types.ts
CSS	kebab-case.css	design-tokens.css
🧪 Testing (Mandatory)
bash
npm test                 # Run all tests (225+ tests, 24 files)
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report (v8)
Rules:

Every core function must have a unit test in js/tests/core/

Every component with non-trivial logic must have a test in js/tests/components/

Before committing: tsc --noEmit + npm test must be green

Do not delete or weaken existing tests without justification

💅 Code Conventions
Styling
All styles from css/design-tokens.css (CSS custom properties)

BEM class naming: .component__element--modifier

Inline styles ONLY for dynamic values (animation, color based on state)

Dark theme only (no light theme, no media queries)

css
/* design-tokens.css provides: */
--spacing-sm, --spacing-md, --spacing-lg
--green, --yellow, --red, --blue, --orange
--font-size-caption, --font-size-body, --font-size-title
--transition-fast (150ms)
React Components
Prefer JSX syntax (some legacy code uses React.createElement — avoid expanding)

Destructure store state once per component:

jsx
// ✅ DO
const { sessions, readiness, handleSaveCheckin } = useAppStore();

// ❌ DON'T — double subscription
const state = useAppStore();
const dispatch = useAppStore();
Lazy load pages: const LogPage = lazy(() => import('./ui/pages/LogPage.jsx'));

Max function: 40 lines; Max file: 300 lines (pages are exceptions)

TypeScript
Strict mode enabled — strict: true in tsconfig

All new types in js/core/types.ts

No any in js/core/ (use unknown + type guards when needed)

Keep AppState in types.ts synchronized with useAppStore.ts

Imports Order
js
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sun, Moon, Check } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore.js';
import { detectOptimalTier } from '../../core/recoveryScore.js';
import ExerciseCard from '../components/ExerciseCard.jsx';
import '../../css/styles.css';  // only in app.tsx
🔄 Essential Workflows
Adding a New Core Function
Write pure function in js/core/[module].ts

Add tests in js/tests/core/[module].test.ts

Export via js/core/index.ts if shared

Update computeDerived() in useAppStore.ts if state-dependent

Adding a New UI Component
Create js/ui/components/[ComponentName].jsx

Add CSS classes to css/styles.css (use BEM)

Write component test in js/tests/components/

Import with import ComponentName from '../components/ComponentName.jsx'

Modifying Store State
ts
// In useAppStore.ts, after data mutation:
void (async () => {
  await storage.saveSessions(newSessions);
  set({ sessions: newSessions });
  get()._recompute();  // Recalculates all derived state
})();
Working with Virtual Dates
Use getAppDate() from js/core/helpers.ts instead of new Date()

Virtual offset is stored in Zustand + IndexedDB, persists across sessions

Used for date strip navigation, planning, recovery score, and stats

Working with Plans (Modular)
Sport plans are in js/plans/running.ts and js/plans/strength.ts

Planning engine (planning.ts) selects plan based on selectedSports

To add a new sport: create plan module, add to getPlanForSport()

🔒 Boundaries & Constraints
DO	DON'T
Store everything in IndexedDB via Dexie	Store large data in localStorage
Use Zustand for global state	Use Redux or React Context for global state
Write pure functions in js/core/	Write side effects inside core/
Use design tokens from design-tokens.css	Hardcode colors or spacing
Keep all data local	Make external API calls
Write tests for new features	Skip tests for "small" changes
🚧 Current Blockers (May 2026)
TypeScript syntax error in js/ui/pages/TodayPage.jsx (lines 631, 668) — requires fix before verification

2 failing tests in correlations.test.ts — pre-existing, non-blocking

Recovery Score dash appears occasionally — needs debugging

📋 Phase Status
Phase	Status	Description
Phase 1 — Foundation	✅ 100%	Architecture, storage, store, APRE, Recovery Score
Phase 2 — Personalization	✅ 100%	Tiered check-in, modular plans, onboarding wizard, gamification
Phase 3 — Adaptivity	✅ 100%	Virtual date, 30-day date strip, demo mode, AI suggestions
Phase 4 — Ecosystem	⏳ 0%	Apple Health / Google Fit, PDF reports
📚 When Unsure, Read These
memory-bank/progress.md — Latest feature additions and bug fixes

memory-bank/master-plan.md — Complete roadmap and task status

js/core/types.ts — All TypeScript interfaces

js/stores/useAppStore.ts — State shape and actions

.github/agents/ — Specialized agent instructions (if exists)