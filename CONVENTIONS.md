# CONVENTIONS.md — Свод правил и ограничений для разработки

## Главная цель
Ты — Senior React-разработчик, помогающий создать offline-first фитнес-приложение. Все решения должны приниматься через призму главной философии продукта: «Открыл утром — увидел, что делать. Никаких выборов».

---

## Технический стек (реальный, npm-проект)

| Инструмент | Версия | Роль |
|---|---|---|
| **React** | 18.2.0 | UI-фреймворк |
| **ReactDOM** | 18.2.0 | Рендеринг |
| **Vite** | 6.x | Бандлер и дев-сервер |
| **Zustand** | 5.x | Глобальный стор |
| **Dexie.js** | 4.x | IndexedDB-обёртка |
| **Radix UI** | 1.x | Атомарные UI-примитивы (Collapsible, Dialog) |
| **TypeScript** | 5.x | Типизация `.ts` / `.tsx` |
| **Vitest** | 4.x | Тест-раннер |
| **@testing-library/react** | 16.x | Компонентные тесты |

**Запрещено добавлять** без явного согласования: jQuery, Bootstrap, любые CSS-фреймворки, внешние API, серверный рендер.

---

## Структура проекта

```
js/
  app.tsx                  — точка входа, рендеринг, навигация
  config/
    constants.js           — все статические данные (зоны, планы, пороги)
    achievements.js        — конфиг достижений
  core/
    types.ts               — все TypeScript-типы
    storage.ts             — CRUD над Dexie (IndexedDB)
    readiness.ts           — calcReadiness, detectRecoveryDebt
    recoveryScore.ts       — calculateRecoveryScore (z-score модель)
    planning.ts            — getWorkoutType, buildSessionFromMonth, APRE
    loadAdjustments.ts     — applyMultiplier, applyApre, adjustForMode
    stats.ts               — getWeeklySummary, getMonthStats, getStreak
    analytics.ts           — getTrendData, getRpeTrend, detectNegativeTrends
    advice.ts              — getCoachAdvice, getApreExplanation
    helpers.ts             — parseLocalDate, formatISO, addDays
  stores/
    useAppStore.ts         — центральный Zustand-стор (данные + derived + actions)
    useSettingsStore.ts    — настройки
    useCheckinStore.ts     — форма чек-ина
    useSessionStore.ts     — форма сессии
    useUIStore.ts          — UI-состояние
  ui/
    components/            — переиспользуемые кирпичики (Collapsible, Modal, EmptyState, ...)
    pages/                 — страницы-вкладки (TodayPage, LogPage, AnalyticsPage, ...)
  tests/
    core/                  — юнит-тесты core-модулей
    components/            — компонентные тесты
    setup.ts               — глобальный setup (jest-dom)
css/
  design-tokens.css        — единый источник CSS-переменных
  styles.css               — базовые стили (импортирует design-tokens.css)
index.html
vite.config.ts
```

---

## Стиль кода

- **ES6 модули** (`import` / `export`), `const` / `let`, никакого `var`.
- **Функциональные компоненты** + хуки React (`useState`, `useEffect`, `useMemo`, `useRef`).
- **JSX-синтаксис** в `.jsx` / `.tsx` файлах. `React.createElement` — только в legacy-коде, не расширять.
- Компоненты: `PascalCase` → `TodayPage.jsx`, `EmptyState.jsx`.
- Утилиты и модули: `camelCase` → `storage.ts`, `helpers.ts`.
- Комментарии: на русском, кратко, только для сложной логики.
- Максимум: функция — 40 строк, файл — 300 строк (страницы — исключение).

---

## Правила работы со стором (Zustand)

**Один вызов хука на компонент.** Деструктурируй всё нужное за один раз:

```tsx
// ПРАВИЛЬНО
const { sessions, readiness, handleSaveCheckin } = useAppStore();

// НЕПРАВИЛЬНО — двойная подписка, лишние ре-рендеры
const state = useAppStore();
const dispatch = useAppStore();
```

- **Derived state** (`recoveryScore`, `sessionPlan`, `trendData*`) живёт в `useAppStore` — не пересчитывай в компонентах.
- **Форм-состояние** чек-ина и сессии хранится прямо в `useAppStore`, не в локальном `useState`, чтобы не терять данные при смене вкладки.
- `_recompute()` — внутренний метод стора, вызывается только внутри стора после мутации данных.

---

## Правила типизации

- Все новые типы — в `js/core/types.ts`.
- Запрещены `any` в доменных модулях (`js/core/`). Допустимы временно в `useAppStore.ts` с комментарием `// TODO: типизировать`.
- `unknown` в интерфейсах стора должен быть заменён конкретным типом до мерджа фичи.
- `AppState` в `types.ts` должен оставаться синхронизированным с интерфейсом `AppStore` в `useAppStore.ts`.

---

## Правила CSS и дизайн-системы

- **Единый источник токенов:** `css/design-tokens.css`. Не объявлять одни и те же переменные повторно в `styles.css`.
- **Mobile-first:** `max-width: 500px`, интерактивные элементы ≥ 44×44px.
- Тёмная тема — всегда, без медиа-запросов (продукт изначально тёмный).
- Кнопки: `btn-accent` — основное действие, `btn` — вторичное, `btn-red` — деструктивное.
- Анимации: ≤ 150 мс (`--animation-fast`). Длиннее — только с явным обоснованием.
- CSS-классы по **BEM** для компонентов: `.empty-state__icon`, `.card__title`.
- Inline-стили допустимы только для динамических значений (цвет статуса, анимация).

---

## Тесты

**Скрипты:**
```bash
npm test                  # запуск всех тестов
npm run test:watch        # watch-режим
npm run test:coverage     # покрытие (v8)
```

**Структура:**
- `js/tests/core/` — юнит-тесты чистых функций из `js/core/`
- `js/tests/components/` — компонентные тесты через `@testing-library/react`
- `js/tests/setup.ts` — глобальный импорт `@testing-library/jest-dom`

**Правила:**
- Новая доменная функция → тест в `js/tests/core/`
- Новый компонент с нетривиальной логикой → тест в `js/tests/components/`
- Не удалять и не ослаблять существующие тесты без явной причины.
- Цель: `tsc --noEmit` + `vite build` + все тесты — зелёные после каждого изменения.

**SSL-нота (Windows):** `npm install` может требовать префикс:
```bash
node --use-system-ca $(which npm) install
```
`@testing-library/dom` устанавливается отдельно с `--legacy-peer-deps`.

---

## Категорически запрещено

- Хранить большие данные в `localStorage` — только настройки. Все данные — в IndexedDB (Dexie).
- Делать запросы к внешним API без явного согласования.
- Удалять или радикально менять логику Recovery Score / APRE без явного запроса.
- Писать неадаптивные элементы (фиксированная ширина без `max-width`, отсутствие `box-sizing`).
- Использовать `window.confirm` в новом коде — заменять на `Modal` с подтверждением.
- Добавлять новые npm-зависимости без обоснования (принцип: «одна функция — не повод»).