# 🏋️ Smart Fitness Coach — Интеллектуальный тренировочный дневник с авторегуляцией

Персональный умный коуч тренировок с научной авторегуляцией нагрузки.
**Полностью бесплатно, без подписки, все данные на устройстве.**

[![PWA Ready](https://img.shields.io/badge/PWA-ready-brightgreen)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)]()
[![Tests](https://img.shields.io/badge/tests-240%2B%20passed%20(26%20files)-brightgreen)]()
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
  - `js/plans/` — running.ts, strength.ts, cycling.ts, swimming.ts, calisthenics.ts, yoga.ts, stretching.ts, walking.ts
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

---

## ⚠️ Честные ограничения

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
npm test             # 225+ тестов (24 файлов)
npm run build        # Production сборка
```

---

## 🛠️ Технологии

| Инструмент | Роль |
|---|---|
| **React 18** | UI-фреймворк |
| **Vite 8** | Бандлер и dev-сервер |
| **TypeScript 6** | Строгая типизация |
| **Zustand 5** | Глобальный стейт (единый стор) |
| **Dexie.js 4** | IndexedDB-обёртка |
| **@base-ui/react 1.5** | UI-примитивы (Collapsible, Dialog) |
| **Lucide React** | Иконки |
| **react-i18next** | Интернационализация (ru/en) |
| **Workbox 7** | Service Worker / PWA |
| **Vitest 4** | Тест-раннер + @testing-library/react |

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
├── js/
│   ├── app.tsx                 # Точка входа, навигация, layout
│   │
│   ├── config/
│   │   ├── constants.js        # Константы (зоны, планы, пороги)
│   │   ├── tooltips.js         # Конфиг тултипов
│   │   └── tour-steps.js       # Шаги guided tour
│   │
│   ├── core/
│   │   ├── types.ts            # Все TypeScript-типы
│   │   ├── storage.ts          # CRUD над Dexie (IndexedDB)
│   │   ├── readiness.ts        # calcReadiness, detectRecoveryDebt
│   │   ├── recoveryScore.ts    # calculateRecoveryScore (tiered)
│   │   ├── planning.ts         # getWorkoutType, buildSessionFromMonth
│   │   ├── loadAdjustments.ts  # applyMultiplier, applyApre
│   │   ├── sessionLoad.ts      # calculateSessionLoad
│   │   ├── stats.ts            # getWeeklySummary, getMonthStats, getStreak
│   │   ├── analytics.ts        # getTrendData, detectNegativeTrends
│   │   ├── advice.ts           # getCoachAdvice, getApreExplanation
│   │   ├── helpers.ts          # Утилиты дат
│   │   ├── onboardingStorage.ts # Хранение статуса онбординга
│   │   ├── apre/
│   │   │   └── engine.js       # APRE-движок (Mann tables)
│   │   └── engine.test.js      # Node.js тест-раннер (legacy)
│   │
│   ├── stores/
│   │   ├── useAppStore.ts      # Центральный стор
│   │   ├── useSessionStore.ts  # Состояние формы сессии
│   │   └── useTourStore.ts     # Состояние для guided tour
│   │
│   ├── i18n/
│   │   ├── index.ts            # i18n конфигурация
│   │   └── locales/
│   │       ├── ru.json         # Русские переводы (24 KB)
│   │       └── en.json         # Английские переводы (16 KB)
│   │
│   ├── hooks/
│   │   └── useFitnessData.ts   # Хук для фитнес-данных
│   │
│   ├── ui/
│   │   ├── components/         # Переиспользуемые компоненты
│   │   │   ├── CheckinHistory.jsx
│   │   │   ├── Collapsible.jsx
│   │   │   ├── CorrelationCard.jsx
│   │   │   ├── EmptyState.jsx
│   │   │   ├── ErrorBoundary.jsx
│   │   │   ├── ExerciseCard.jsx
│   │   │   ├── ExerciseConfigModal.jsx
│   │   │   ├── GuidedTour.jsx
│   │   │   ├── HeatmapGrid.jsx
│   │   │   ├── HelpIcon.jsx
│   │   │   ├── MiniSparkline.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── OnboardingWizard.jsx
│   │   │   ├── ScaleSelector.jsx
│   │   │   ├── Skeleton.jsx
│   │   │   ├── StatBox.jsx
│   │   │   └── TrendIndicator.jsx
│   │   │
│   │   └── pages/              # Страницы-вкладки
│   │       ├── TodayPage.jsx       # Главная (Recovery Score + план)
│   │       ├── LogPage.jsx         # Чек-ин + лог тренировок
│   │       ├── AnalyticsPage.jsx   # Тренды и аналитика
│   │       ├── ProfilePage.jsx     # Профиль и настройки
│   │       ├── MethodologyPage.jsx # Методология и наука
│   │       ├── CheckinForm.jsx     # Форма чек-ина (вложена в LogPage)
│   │       ├── SessionLogger.jsx   # Логгер сессии (вложен в LogPage)
│   │       ├── TrendChart.jsx      # Компонент графика (вложен в AnalyticsPage)
│   │       ├── WarningsList.jsx    # Список предупреждений (вложен в AnalyticsPage)
│   │       └── WeeklySummary.jsx   # Недельная сводка (вложен в AnalyticsPage)
│   │
│   └── tests/
│       ├── setup.ts            # Глобальный setup (@testing-library/jest-dom)
│       ├── components/
│       │   ├── EmptyState.test.tsx
│       │   ├── ScaleSelector.test.tsx
│       │   ├── Skeleton.test.tsx
│       │   └── StatBox.test.tsx
│       └── core/
│           ├── apre.test.ts
│           ├── correlations.test.ts
│           ├── planning.test.ts
│           ├── readiness.test.ts
│           ├── stats.test.ts
│           └── validation.test.ts
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
