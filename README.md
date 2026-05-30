# 🏋️ Smart Fitness Coach — Интеллектуальный тренировочный дневник с авторегуляцией

Персональный умный коуч тренировок с научной авторегуляцией нагрузки.
**Полностью бесплатно, без подписки, все данные на устройстве.**

[![PWA Ready](https://img.shields.io/badge/PWA-ready-brightgreen)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)]()
[![Tests](https://img.shields.io/badge/tests-724%2B%20passed%20(61%20files)-brightgreen)]()
[![E2E Tests](https://img.shields.io/badge/E2E-51%20specs%20(Playwright)-brightgreen)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)]()
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)]()

---

## 💡 Что это?

Приложение, которое **думает за тебя**. Каждое утро ты открываешь его и видишь:

- **Готов ли ты сегодня тренироваться** (Recovery Score 0–100)
- **Что именно делать** — конкретные упражнения, подходы, повторения
- **Почему** — прозрачная научная база под каждым решением

Адаптирует план в реальном времени на основе сна, HRV, пульса, боли, настроения.

**Три уровня чек-ина** (Full / Medium / Light) — приложение адаптируется под твои устройства или работает полностью на субъективных данных.

**Восемь видов спорта** — Running, Strength, Cycling, Swimming, Calisthenics, Yoga, Stretching, Walking — каждый с 12-недельной периодизацией.

---

## 🎯 Как это работает?

Каждое утро ты проходишь короткий чек-ин. В зависимости от выбранного уровня:

- **Light** — только субъективные метрики (настроение, боль, энергия, сон)
- **Medium** — RHR + сон + субъективные
- **Full** — HRV + RHR + сон + субъективные

Приложение превращает метрики в **Recovery Score** и конкретный план тренировок на день.

---

## 🧠 Научная база

- **APRE** (Autoregulatory Progressive Resistance Exercise) — нагрузка меняется на основе RPE по таблицам Mann
- **Recovery Score** — тиерированная система: Full (HRV 40% + Sleep 30% + RHR 10% + Subjective 20%), Medium, Light (100% субъективный)
- **Мульти-спорт планы** — 8 видов спорта с 12-недельной периодизацией (base → build → peak → deload)
  - `js/domains/training/plans/` — running.ts, strength.ts, cycling.ts, swimming.ts, calisthenics.ts, yoga.ts, stretching.ts, walking.ts
  - Комбинация видов спорта через `combineSportPlans()` с автоматическим разрешением конфликтов
- **Профиль пользователя** — уровень (beginner/intermediate/advanced), цели (hypertrophy/strength/endurance/rehabilitation), инвентарь
- **Реабилитационный фильтр** — автоматическое исключение противопоказанных упражнений, замена на реабилитационные
- **19 достижений** и система streak-трекинга

---

## 📱 Что внутри

- ✅ **Модульные планы тренировок** (беговые + силовые шаблоны)
- ✅ **Три уровня чек-ина** (Light / Medium / Full) с автодетекцией по устройствам
- ✅ **Recovery Score** с цветовой индикацией (🟢🟡🔴)
- ✅ **Онбординг** — выбор видов спорта, устройств, целей
- ✅ **APRE-авторегуляция** нагрузки
- ✅ **Тренды и аналитика** — графики Recovery, HRV, RPE
- ✅ **Achievements** — 19 достижений, heatmap, streak-счётчик
- ✅ **i18n** — русский/английский (react-i18next)
- ✅ **PWA** — работает офлайн, Workbox
- ✅ **Полная приватность** — все данные локально в IndexedDB (Dexie.js)
- ✅ **TypeScript strict** — полная типизация
- ✅ **Exercise set completion tracking** — non-APRE per-set checkboxes
- ✅ **Weekly completion rate** — adherence-based volume multiplier auto-adjusts next week's load
- ✅ **CSV biometrics import** — Health Sync CSV parser
- ✅ **Rehab-aware stretching** — auto-filters contraindicated exercises
- ✅ **Domain-based architecture** — 8 domain modules (training, recovery → checkin, analytics, profile, achievements, import, demo, onboarding)
- ✅ **Modular Zustand store** — 5 slices + orchestrator pattern
- ✅ **Type-safe codebase** — all `any` types removed from domain logic

---

## 📊 What's New (2026-05-30)

### Architecture Migration Complete
- **Domain-based architecture**: Moved all logic to `js/domains/` (8 modules: training, checkin, analytics, profile, achievements, import, demo, onboarding)
- **Shared layer**: `js/shared/` — types, helpers, config, hooks, i18n, UI primitives
- **Re-export stubs**: `js/core/` and `js/plans/` now serve as backward-compatible re-export bridges — migration path without breaking imports
- **Cleaned up stale directories**: removed `js/plans/` stubs (real files in `js/domains/training/plans/`)

### Code Quality Improvements
- **Removed all `any` types** from domain logic (types.ts, storage.ts, planning.ts, loadAdjustments.ts, stats.ts)
- **Cleaned up 50+ stale files**: removed stale scripts, generated docs, coverage artifacts, old session/plan files
- **Enhanced test coverage**: +51 new unit tests (storage.ts: 25 tests, useAppStore.ts: 26 tests)
- **Current test count**: 724+ tests passing (61 files)

### Security & Config
- **Resolved exposed GitHub PAT** in training plans commit (amended before push)
- **Updated `.gitignore`** to exclude `.kilo/kilo.json` and `.windsurf/`

---

## 🎯 Coverage Gaps (Help Wanted)

| File | Current | Target | Priority |
|------|---------|--------|----------|
| `js/domains/import/importSchemas.ts` | 22% | 80% | high |
| `js/stores/useAppStore.ts` | 24% | 80% | high |
| `js/domains/training/planning/planning.ts` | 54% | 80% | medium |
| `js/domains/analytics/analytics.ts` | 0% | 80% | medium |
| `js/core/advice.ts` | 0% | 80% | medium |

Run `npm test -- --coverage` to see current coverage.

- Данные вводятся вручную; автоматический сбор через Apple Health / Google Fit — в планах
- Алгоритм Recovery Score не прошёл клиническую валидацию, основан на научной гипотезе, тестируется
- Приложение не является медицинским прибором
- Модульные планы (Strength/Running) созданы и подключены к planning.ts |

---

## 🚀 Быстрый старт

```bash
# 1. Склонировать
git clone https://github.com/rocket04/ai-fitness-coach.git
cd ai-fitness-coach

# 2. Установить зависимости
npm install

# 3. Запустить dev-сервер
npm run dev
```

Открой `http://localhost:3000` (или порт, который покажет Vite).

**На телефоне:** открой тот же адрес в Safari/Chrome → «Поделиться» → «На экран Домой».

### Проверка работоспособности

```bash
npm run type-check   # TypeScript проверка
npm run lint         # ESLint
npm test             # 724+ unit-тестов (Vitest)
npm run test:e2e     # 51 E2E-спеков (Playwright, Chromium + Firefox + Mobile)
npm run build        # Production сборка
```

---

## 🛠️ Технологии

| Инструмент | Роль |
|---|---|
| **React 18** | UI-фреймворк |
| **Vite 8** | Бандлер и dev-сервер |
| **TypeScript 6.0** | Строгая типизация |
| **Zustand 5** | Глобальный стейт (единый стор) |
| **Dexie.js 4** | IndexedDB-обёртка |
| **@base-ui/react 1.5** | UI-примитивы (Collapsible, Dialog) |
| **Lucide React** | Иконки |
| **react-i18next** | Интернационализация (ru/en) |
| **Workbox 7** | Service Worker / PWA |
| **Vitest 4** | Unit-тесты + @testing-library/react |
| **Playwright** | E2E-тесты (Chromium, Firefox, Mobile) |

**Никаких:** jQuery, Bootstrap, Tailwind, CSS-фреймворков, Redux, React Context для глобального стейта.

---

## 📂 Структура проекта

```
├── index.html                  # App shell (critical CSS inline)
├── manifest.json               # PWA метаданные
│
├── css/
│   ├── design-tokens.css       # CSS-переменные (единый источник)
│   └── styles.css              # Все стили (70 KB)
│
├── public/
│   ├── manifest.json           # PWA манифест
│   └── sw.js                   # Service Worker (Workbox)
│
├── e2e/
│   ├── tests/                  # E2E-спеки (Playwright)
│   ├── pages/                  # Page Object Models
│   ├── fixtures/               # Тестовые данные и auth-хелперы
│   └── utils/                  # Кастомные ассерты и селекторы
│
├── js/
│   ├── app.tsx                 # Точка входа, навигация, layout
│   │
│   ├── config/
│   │   ├── constants.js        # Константы (зоны, планы, пороги)
│   │   ├── tooltips.js         # Конфиг тултипов
│   │   └── tour-steps.js       # Шаги guided tour
│   │
│   ├── domains/                # 8 модулей предметной области
│   │   ├── training/           # Планирование, APRE, нагрузка
│   │   │   ├── apre/engine.js
│   │   │   ├── planning/       # planning.ts, loadAdjustments, completionRate
│   │   │   ├── plans/          # 8 sport plan modules
│   │   │   └── session/        # sessionLoad.ts
│   │   ├── checkin/            # checkinSlice.ts, validation.ts
│   │   ├── analytics/          # analytics.ts, stats.ts, streak.ts, correlations.ts
│   │   ├── profile/            # exerciseDatabase.ts, rehabProtocol.ts
│   │   ├── achievements/       # achievements.ts
│   │   ├── import/             # csvParser.ts, importSchemas.ts
│   │   ├── demo/               # demoData.ts, demoSlice.ts
│   │   └── onboarding/         # onboardingStorage.ts, useTourStore.ts
│   │
│   ├── shared/                 # Общий слой
│   │   ├── types.ts            # Все TypeScript-типы
│   │   ├── helpers.ts          # Утилиты дат
│   │   ├── config/             # Константы (конфиги)
│   │   ├── hooks/              # Переиспользуемые хуки
│   │   ├── i18n/               # Локализация (index.ts, locales/)
│   │   └── ui/                 # UI-примитивы (Modal, Collapsible, etc.)
│   │
│   ├── stores/
│   │   ├── slices/             # Zustand store slices (checkin, session, ui, data, demo)
│   │   ├── useAppStore.ts      # Центральный стор
│   │   └── useTourStore.ts     # Состояние для guided tour
│   │
│   ├── core/                   # Re-export мосты (обратная совместимость)
│   │   └── storage.ts          # CRUD над Dexie (IndexedDB) — реальная логика
│   │
│   ├── ui/
│   │   ├── components/         # Переиспользуемые компоненты
│   │   │   ├── CheckinHistory.jsx
│   │   │   ├── HeatmapGrid.jsx
│   │   │   ├── OnboardingWizard.jsx
│   │   │   └── ...
│   │   │
│   │   └── pages/              # Страницы-вкладки
│   │       ├── TodayPage.jsx       # Главная (Recovery Score + план)
│   │       ├── LogPage.jsx         # Чек-ин + лог тренировок
│   │       ├── AnalyticsPage.jsx   # Тренды и аналитика
│   │       ├── ProfilePage.jsx     # Профиль и настройки
│   │       ├── MethodologyPage.jsx # Методология и наука
│   │       ├── CheckinForm.jsx     # Форма чек-ина
│   │       ├── SessionLogger.jsx   # Логгер сессии
│   │       ├── TrendChart.jsx      # Компонент графика
│   │       ├── WarningsList.jsx    # Список предупреждений
│   │       └── WeeklySummary.jsx   # Недельная сводка
│   │
│   └── tests/
│       ├── setup.ts            # Глобальный setup (@testing-library/jest-dom)
│       ├── components/         # Тесты компонентов
│       ├── core/               # Тесты core (читают через re-export мосты)
│       ├── stores/             # Тесты стора
│       └── ui/                 # Тесты страниц
```

---

## 📈 Roadmap

| Фаза | Статус | Описание |
|------|--------|----------|
| Фаза 1 — Фундамент | ✅ 100% | Архитектура, хранилище, стор, APRE, Recovery Score |
| Фаза 2 — Персонализация | ✅ 100% | Модульные планы, онбординг (5 шагов), tiered check-in, геймификация, мульти-спорт |
| Фаза 3 — Адаптивность | ✅ 100% | Виртуальная дата, 30-дневный лента дат с навигацией, Demo Mode, AI-советы |
| Фаза 4 — Экосистема | ⏳ 0% | Apple Health / Google Fit, PDF-отчёты |

Детальная дорожная карта в `docs/rnd-report.md`.

---

## 🤝 Контрибьютинг

Мы рады любым pull request'ам!
Главное правило: **данные пользователя никогда не покидают устройство.**

---

## 📄 Лицензия

MIT — делай что хочешь, только сохрани ссылку на оригинал.

---

**Сделано с 💪 и наукой. Никакой магии, только прозрачные алгоритмы.**
