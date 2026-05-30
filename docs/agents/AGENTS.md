# AGENTS.md — Smart Fitness Coach

## Project Identity

Smart Fitness Coach is a local-first adaptive training planner.

Primary goal:

**Answer "Am I ready to train today, and what exactly should I do?"**

Current product strength:

- transparent APRE-based strength autoregulation;
- tiered recovery scoring;
- manual check-in;
- local data ownership;
- basic multi-sport planning.

Do not describe the product as a complete Health OS, wearable platform, or medical system unless those features are actually implemented.

## Tech Stack

Use the versions in `package.json` as source of truth.

Core stack:

- React 18;
- TypeScript;
- Vite;
- Zustand;
- Dexie / IndexedDB;
- Vitest;
- react-i18next;
- lucide-react;
- custom CSS.

## Product Boundaries

### Data privacy

Default rule:

- Data stays local unless the user explicitly opts into an integration, export, or sync.

Allowed with explicit product approval:

- Apple Health / HealthKit;
- Health Connect;
- Garmin;
- Strava;
- CSV import/export;
- optional encrypted sync.

Disallowed:

- selling user data;
- advertising trackers;
- silent health-data upload;
- external calls without user-facing purpose.

## Architecture

```text
Input → IndexedDB → Zustand → derived state → UI recommendation
```

Core files:

- `js/stores/useAppStore.ts`;
- `js/core/recoveryScore.ts`;
- `js/core/readiness.ts`;
- `js/core/planning.ts`;
- `js/core/apre/engine.js`;
- `js/core/exerciseDatabase.ts`;
- `js/core/analytics.ts`;
- `js/core/sessionLoad.ts`.

## Coding Rules

### Core logic

- Keep domain logic pure when possible.
- Add tests for new domain functions.
- Avoid `any` in `js/core/`; use proper types or `unknown` with guards.
- Keep `types.ts` synchronized with store state.

### React

- New components should use JSX.
- Legacy pages may still use `React.createElement`.
- Do not expand legacy style unless required.
- Prefer one Zustand subscription per component.

### Styling

- Use existing CSS tokens.
- Custom CSS is acceptable.
- Accessibility has priority over visual purity.
- Do not forbid light/high-contrast/reduced-motion support if product needs it.

### Storage

- User data belongs in IndexedDB.
- LocalStorage is acceptable only for small UI/settings flags.
- Any integration must track data source and timestamp.

## Feature Honesty Rules

Every feature must be labeled as one of:

- implemented;
- partial;
- planned;
- placeholder;
- removed.

Do not call placeholders "integrations".

Do not call rule-based advice "AI".

Do not claim test suite is green unless `npm test` was run and passed in the current session.

## Testing Rules

Before declaring completion:

```bash
cd c:\Projects\fitness-tracker  # IMPORTANT: always cd to project root first
npm run type-check
npm test
```

If tests fail, report:

- failed files;
- failed test count;
- whether the failure is pre-existing or caused by the change.

## Product Priorities

When uncertain, prioritize:

1. correctness;
2. safety;
3. explanation;
4. data quality;
5. training specificity;
6. privacy;
7. UI polish.

Do not prioritize PDF export, badges, or generic AI chat over the training decision engine.

## Model Selection by Task Type

- **SWE 1.6 Fast/SWE 1.6** — быстрые правки, простой рефакторинг, выполнение рутинных действий. Используется по умолчанию.
- **Kimi K2.6** — написание кода (экономный режим, подходит для большей части рутины).
- **Claude Opus 4.7 Think (Medium/High)/ChatGPT 5.5 (xhigh/high)** — сложная архитектура, глубокий анализ, распутывание запутанной логики. Переключаться при упоминании слов "архитектура", "дизайн", "проблема".

## Documentation Update Rule

Любое изменение в ядре системы (каталоги `js/core/`, `js/plans/`, `js/stores/`, `js/ui/`) должно сопровождаться обновлением соответствующего файла `docs/domains/<домен>/README.md`.

Если изменение затрагивает API, модель данных или архитектурное решение – README домена обязательно обновляется. В остальных случаях – по необходимости.

## Session Logging

В начале каждой сессии, связанной с новой задачей, создавать файл `docs/sessions/YYYY-MM-DD-краткое-описание.md`. В начале файла указать цель сессии, в конце сессии дополнить файл кратким итогом: что сделано, какие решения приняты, что осталось на потом.

Если сессия продолжает предыдущую – дописывать в существующий файл.

## Memory Usage

**Перед началом сессии:**
- Всегда читать Cascade MEMORY (системные записи о проекте, доступных инструментах, статусе)
- Проверять релевантность memory к текущей задаче
- Использовать memory для контекста: tech stack, project boundaries, available skills/workflows

**В конце сессии:**
- Если задача изменила проект (новые файлы, изменённая архитектура, новые правила) — обновить memory через `create_memory` tool
- Сохранять только ключевые решения и паттерны, не временные данные
- Добавлять теги для будущего поиска (например, `project-context`, `rules`, `api-changes`)
