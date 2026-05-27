# Swarm: 6 стабилизационных задач из docs/technical/TECHNICAL_STRATEGY.md

**Created:** 2026-05-26 09:20
**Model target:** Kimi K2 (check picker for current promo multiplier)
**Subtask count:** 6
**Scope statement:** Выполнить 6 стабилизационных задач из docs/technical/TECHNICAL_STRATEGY.md — каждая подзадача отдельный файл, файлы не пересекаются.

---

## Subtask 1 — SW dev-mode skip

- **Scope:** `c:\Projects\fitness-tracker\public\sw.js`
- **Acceptance:** В dev-режиме (localhost) Service Worker не кэширует запросы, содержащие `?t=` или `/@vite/`. Либо полностью пропускает SW на localhost. Проверить: открыть DevTools → Application → Service Workers, убедиться что на `http://localhost:5173` SW не перехватывает Vite HMR-запросы.
- **Pane:** 1 (top-left)
- **Status:** [ ] pending

## Subtask 2 — App conditional page rendering

- **Scope:** `c:\Projects\fitness-tracker\js\app.tsx`
- **Acceptance:** Рендерится ТОЛЬКО активная вкладка (activeTab === 0/1/2/3), остальные lazy-страницы не монтируются в DOM (не просто скрыты CSS). Убедиться, что нет `display: none` или `hidden` на обёртках — вместо этого используется условный рендеринг (`condition ? <Page /> : null`).
- **Pane:** 2 (top-middle)
- **Status:** [ ] pending

## Subtask 3 — MiniSparkline React import

- **Scope:** `c:\Projects\fitness-tracker\js\ui\components\MiniSparkline.jsx`
- **Acceptance:** В начале файла присутствует `import React from 'react';` (для совместимости с JSX-transform в тестах/сборке). Файл компилируется без ошибок `React is not defined`.
- **Pane:** 3 (top-right)
- **Status:** [ ] pending

## Subtask 4 — ResizeObserver mock in test setup

- **Scope:** `c:\Projects\fitness-tracker\js\tests\setup.ts`
- **Acceptance:** В setup.ts добавлен глобальный мок ResizeObserver: `if (typeof window !== 'undefined' && !window.ResizeObserver) { window.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} } }`. Тесты, использующие TrendChart или другие responsive-компоненты, не падают с `ResizeObserver is not defined`.
- **Pane:** 4 (bottom-left)
- **Status:** [ ] pending

## Subtask 5 — Storage demo-mode _db() fix

- **Scope:** `c:\Projects\fitness-tracker\js\core\storage.ts`
- **Acceptance:** В demo-режиме (`activateDemoData`, `deactivateDemoData`, `importAllData` и др.) все обращения к таблицам IndexedDB идут через `_db().sessions` / `_db().checkins` / `_db().settings` / `_db().achievements`, а НЕ через `db.sessions` из замыкания верхнего уровня. Убедиться, что `_db()` возвращает активную БД (demo или real).
- **Pane:** 5 (bottom-middle)
- **Status:** [ ] pending

## Subtask 6 — GitHub Actions CI workflow

- **Scope:** `c:\Projects\fitness-tracker\.github\workflows\ci.yml`
- **Acceptance:** Файл ci.yml существует и содержит: триггеры `on: [push, pull_request]`, `runs-on: ubuntu-latest`, steps: `actions/checkout@v4`, `actions/setup-node@v4`, `npm ci`, `npm run type-check`, `npm test`. Workflow запускается на push/PR в любую ветку.
- **Pane:** 6 (bottom-right)
- **Status:** [ ] pending

---

## Disjointness audit

| Subtask | Primary path | Overlaps with |
|----------|-------------|-------------|
| 1 | `public/sw.js` | — |
| 2 | `js/app.tsx` | — |
| 3 | `js/ui/components/MiniSparkline.jsx` | — |
| 4 | `js/tests/setup.ts` | — |
| 5 | `js/core/storage.ts` | — |
| 6 | `.github/workflows/ci.yml` | — |

---

## Launch order (per pane)

1. Open 6 Cascade panes (Ctrl+\ to split; repeat to get 3×2)
2. In each pane: New Session → pick **Kimi K2** in the model picker
3. Paste the subtask prompt into each pane in order (1 → 6)
4. Monitor the grid; re-route any stuck pane to SWE 1.6 Fast or escalate to `@architect`

**IMPORTANT:** If any agent needs to run npm commands (npm run type-check, npm test, etc.), they MUST first cd to the project root: `cd c:\Projects\fitness-tracker`. Otherwise npm will fail with ENOENT looking for package.json in the wrong directory.

### Per-pane prompts

**Pane 1 (top-left):** Subtask 1 — SW dev-mode skip → `public/sw.js`

```text
Task: In public/sw.js, add a condition so that in dev mode (localhost) the Service Worker does NOT cache requests containing ?t= or /@vite/. Alternatively, completely skip SW on localhost. The file already has `if (self.location.hostname === 'localhost') return;` — verify it's sufficient or strengthen it (e.g., also check 127.0.0.1, or add early-return for ?t= and /@vite/ patterns before any caching logic). Do NOT change the production behavior. Return the exact diff.
```

**Pane 2 (top-middle):** Subtask 2 — App conditional page rendering → `js/app.tsx`

```text
Task: In js/app.tsx, change page rendering so that ONLY the active tab is rendered (conditional rendering: activeTab === i ? <Page /> : null). Do NOT render all 5 lazy pages with CSS hidden. The current code already has activeTab === i ? ... : null inside pages.map — verify this is correct and that there is no leftover CSS-hiding logic (e.g., classNames like 'hidden', 'page-hidden', inline display:none) that would indicate all pages are mounted. If any such hidden-mount pattern exists, replace it with true conditional rendering. Return the exact diff.
```

**Pane 3 (top-right):** Subtask 3 — MiniSparkline React import → `js/ui/components/MiniSparkline.jsx`

```text
Task: In js/ui/components/MiniSparkline.jsx, ensure `import React from 'react';` is present at the very top of the file (line 1 or immediately after the header comments). The file uses React.createElement, so React must be in scope. If the import already exists, confirm it's correct. If not, add it. Return the exact diff.
```

**Pane 4 (bottom-left):** Subtask 4 — ResizeObserver mock in test setup → `js/tests/setup.ts`

```text
Task: In js/tests/setup.ts, add a global ResizeObserver mock if one does not already exist:

if (typeof window !== 'undefined' && !window.ResizeObserver) {
  window.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
}

Verify the file already has something similar. If the mock is missing or incomplete, fix it. Return the exact diff.
```

**Pane 5 (bottom-middle):** Subtask 5 — Storage demo-mode _db() fix → `js/core/storage.ts`

```text
Task: In js/core/storage.ts, fix the demo mode. In functions that call _db().transaction(...) and use tables inside, they must use _db().sessions, _db().checkins, _db().settings, _db().achievements — NOT the bare `db.sessions` from the top-level closure. The top-level `db` variable refers to the real DB, but in demo mode `_db()` returns the demo DB. Search the entire file for any direct `db.` usage inside transaction callbacks or data-access functions (except the top-level schema definition db.version(...)). Replace with `_db().`. Return the exact diff.
```

**Pane 6 (bottom-right):** Subtask 6 — GitHub Actions CI workflow → `.github/workflows/ci.yml`

```text
Task: In .github/workflows/ci.yml, ensure the workflow triggers on push and pull_request, runs on ubuntu-latest, and has steps: checkout, setup-node, npm ci, npm run type-check, npm test. The file already exists and may have additional steps (e.g., build) — keep them if present, but the minimum required steps must exist. Verify triggers are correct (should run on any branch, not just main/master). Return the exact diff.
```
