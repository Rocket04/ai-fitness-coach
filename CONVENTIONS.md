# CONVENTIONS.md — Свод правил и ограничений для разработки

## Главная цель

Ты — Senior React-разработчик, помогающий создать offline-first фитнес-приложение. Все решения должны приниматься через призму главной философии продукта: «Открыл утром — увидел, что делать. Никаких выборов».

---

## Технический стек (реальный, npm-проект)

| Инструмент | Версия | Роль |
|---|---|---|
| **React** | 18.2.0 | UI-фреймворк |
| **ReactDOM** | 18.2.0 | Рендеринг |
| **Vite** | 8.x | Бандлер и дев-сервер |
| **TypeScript** | 6.x | Строгая типизация (strict mode) |
| **Zustand** | 5.x | Глобальный стор (единый) |
| **Dexie.js** | 4.x | IndexedDB-обёртка |
| **@base-ui/react** | 1.5 | UI-примитивы (Collapsible, Dialog) |
| **Lucide React** | 1.16 | Иконки |
| **react-i18next** | 17.x | Интернационализация (ru/en) |
| **Vitest** | 4.x | Тест-раннер |
| **@testing-library/react** | 16.x | Компонентные тесты |
| **Workbox** | 7.x | Service Worker / PWA |

**Запрещено добавлять** без явного согласования: jQuery, Bootstrap, Tailwind, любые CSS-фреймворки, Redux, React Context для глобального стейта, внешние API, серверный рендер.

---

## Структура проекта

```
js/
  app.tsx                     — точка входа, рендеринг, навигация
  config/
    constants.js              — все статические данные (зоны, планы, пороги)
    tooltips.js               — конфиг тултипов
    tour-steps.js             — шаги guided tour
  core/
    types.ts                  — все TypeScript-типы
    storage.ts                — CRUD над Dexie (IndexedDB)
    readiness.ts              — calcReadiness, detectRecoveryDebt
    recoveryScore.ts          — calculateRecoveryScore (tiered: full/medium/light)
    planning.ts               — getWorkoutType, buildSessionFromMonth
    loadAdjustments.ts        — applyMultiplier, applyApre, adjustForMode
    sessionLoad.ts            — calculateSessionLoad
    stats.ts                  — getWeeklySummary, getMonthStats, getStreak
    analytics.ts              — getTrendData, getRpeTrend, detectNegativeTrends
    advice.ts                 — getCoachAdvice, getApreExplanation
    helpers.ts                — parseLocalDate, formatISO, addDays
    onboardingStorage.ts      — хранение статуса онбординга (localStorage)
    apre/
      engine.js               — APRE-движок (Mann tables)
    engine.test.js            — Node.js тест-раннер (legacy, не Vitest)
  stores/
    useAppStore.ts            — центральный Zustand-стор (данные + derived + actions)
    useSessionStore.ts        — состояние формы сессии
    useTourStore.ts           — состояние для guided tour
  i18n/
    index.ts                  — i18n конфигурация
    locales/
      ru.json                 — русские переводы
      en.json                 — английские переводы
  hooks/
    useFitnessData.ts         — хук для фитнес-данных
  ui/
    components/               — переиспользуемые кирпичики
      CheckinHistory.jsx      — история чек-инов
      Collapsible.jsx         — сворачиваемая секция (@base-ui)
      CorrelationCard.jsx     — карточка корреляции
      EmptyState.jsx          — пустое состояние
      ErrorBoundary.jsx       — граница ошибок
      ExerciseCard.jsx        — карточка упражнения
      ExerciseConfigModal.jsx — модалка конфигурации упражнений
      GuidedTour.jsx          — пошаговый тур
      HeatmapGrid.jsx         — heatmap-сетка
      HelpIcon.jsx            — иконка помощи с тултипом
      MiniSparkline.jsx       — мини-спарклайн
      Modal.jsx               — модальное окно (@base-ui)
      OnboardingWizard.jsx    — онбординг (Value→Goal→Sports→Gadgets→Recovery)
      ScaleSelector.jsx       — селектор шкалы
      Skeleton.jsx            — скелетон загрузки
      StatBox.jsx             — блок статистики
      TrendIndicator.jsx      — индикатор тренда
    pages/                    — страницы-вкладки и подкомпоненты
      TodayPage.jsx           — главная (Recovery Score + план дня)
      LogPage.jsx             — лог тренировок + чек-ин
      AnalyticsPage.jsx       — тренды и аналитика
      ProfilePage.jsx         — профиль и настройки
      MethodologyPage.jsx     — методология и наука
      CheckinForm.jsx         — форма чек-ина (вложен в LogPage)
      SessionLogger.jsx       — логгер сессии (вложен в LogPage)
      TrendChart.jsx          — компонент графика (вложен в AnalyticsPage)
      WarningsList.jsx        — список предупреждений (вложен в AnalyticsPage)
      WeeklySummary.jsx       — недельная сводка (вложен в AnalyticsPage)
  tests/
    setup.ts                  — глобальный setup (@testing-library/jest-dom)
    components/               — компонентные тесты
    core/                     — юнит-тесты core-модулей
    stores/                   — тесты сторов
css/
  design-tokens.css           — единый источник CSS-переменных
  styles.css                  — базовые стили (импортирует design-tokens.css)
public/
  manifest.json               — PWA манифест
  sw.js                       — Service Worker (Workbox)
index.html                    — App shell (critical CSS inline)
vite.config.ts                — конфигурация Vite + Vitest
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
- **Форм-состояние** чек-ина и сессии хранится в соответствующих сторах (`useAppStore`, `useSessionStore`).
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
- Кнопки: `btn-accent` — основное действие, `btn` — вторичное, `btn-green` — позитивное.
- Анимации: ≤ 150 мс (`--transition-fast`). Длиннее — только с явным обоснованием.
- CSS-классы по **BEM** для компонентов: `.empty-state__icon`, `.card__title`.
- Inline-стили допустимы только для динамических значений (цвет статуса, анимация).

---

## Тесты

**Скрипты:**
```bash
npm test                  # запуск всех тестов (153 теста, 11 файлов)
npm run test:watch        # watch-режим
npm run test:coverage     # покрытие (v8)
```

**Структура:**
- `js/tests/core/` — юнит-тесты чистых функций из `js/core/`
- `js/tests/components/` — компонентные тесты через `@testing-library/react`
- `js/tests/stores/` — тесты сторов
- `js/tests/setup.ts` — глобальный импорт `@testing-library/jest-dom`

**Правила:**
- Новая доменная функция → тест в `js/tests/core/`
- Новый компонент с нетривиальной логикой → тест в `js/tests/components/`
- Не удалять и не ослаблять существующие тесты без явной причины.
- Цель: `tsc --noEmit` + `vite build` + все тесты — зелёные после каждого изменения.

---

## Категорически запрещено

- Хранить большие данные в `localStorage` — только настройки и статус онбординга. Все данные — в IndexedDB (Dexie).
- Делать запросы к внешним API без явного согласования.
- Удалять или радикально менять логику Recovery Score / APRE без явного запроса.
- Писать неадаптивные элементы (фиксированная ширина без `max-width`, отсутствие `box-sizing`).
- Использовать `window.confirm` в новом коде — заменять на `Modal` с подтверждением.
- Добавлять новые npm-зависимости без обоснования (принцип: «одна функция — не повод»).
- Использовать Redux или React Context для глобального стейта — только Zustand.
