# PROJECT_CONTEXT.md — Smart Fitness Coach / Умный Коуч Тренировок

## 🧬 1. ДНК Продута: Кто мы и зачем?

Мы создаём **самостоятельный инструмент интерпретации и планирования тренировок** для осознанных атлетов. У нас нет собственного датчика — мы работаем с данными, которые пользователь вводит сам. Приложение, которое я открываю утром, и оно **думает за меня**: анализирует моё состояние, адаптирует план и даёт чёткий ответ: «Что мне делать сегодня?». Никакой воды, только наука и персонализация.

- **Для кого:** Атлет-любитель с высокими требованиями к себе, который хочет тренироваться по науке и получать конкретный план, а не общие рекомендации.
- **Главная «боль», которую мы лечим:** Паралич выбора и риск перетренированности. Пользователь больше не гадает, «готов ли я сегодня?». Smart Coach анализирует его данные и выдаёт готовый план.
- **Ключевое преимущество:** Прозрачная, научно обоснованная авторегуляция (APRE), а не «чёрный ящик» с общими советами.

## 🎯 2. Наши реальные отличия

- **Конкретный план тренировок:** Не общий «Strain Score», а готовый список упражнений, подходов и весов на сегодня.
- **APRE-авторегуляция:** Нагрузка меняется динамически на основе RPE прошлой тренировки, с прозрачной научной базой (Mann tables).
- **Три уровня чек-ина:** Light (субъективный), Medium (RHR + сон + субъективный), Full (HRV + RHR + сон + субъективный).
- **Мульти-спорт:** Выбор видов спорта в онбординге.
- **Полная локальность данных:** Всё хранится на устройстве в IndexedDB, никаких серверов и подписок.
- **Прозрачность:** Открытый код и открытая методология — пользователь видит, почему план изменился.
- **Геймификация:** 19 достижений, heatmap, streak-счётчик.

## ⚠️ Честные ограничения

- Данные вводятся вручную; автоматический сбор через Apple Health / Google Fit — в планах (Фаза 5).
- Алгоритм Recovery Score не прошёл клиническую валидацию, основан на научной гипотезе, тестируется.
- Приложение не является медицинским прибором.
- Модульные планы для 8 видов спорта подключены к planning.ts через SPORT_MODULES registry.
- Профиль пользователя (уровень, цели, инвентарь, реабилитация) — реализован и интегрирован в планирование.

---

## 📊 3. Обоснование рыночной актуальности (Май 2026)

- Рынок умных фитнес-коучей: **$20.25 млрд** с ростом до **$54.95 млрд** к 2030 году (CAGR 28.9%, источник: The Business Research Company, Feb 2026).
- Главный тренд — **умная персонализация тренировок** и управление восстановлением.
- Наша ниша — **«умная» авторегуляция нагрузки на основе субъективных и объективных данных**. Эта ниша занята дорогими премиум-продуктами (Whoop, Juggernaut Smart, MATS), но не имеет опенсорс-аналогов.

## 🏗️ 4. Архитектура приложения (Четыре слоя + реализация)

1. **Реактивный слой (Фаза 1 — завершена):** Статический план с чёткой прогрессией.
2. **Аналитический слой (Фаза 2 — 100%):** Три уровня чек-ина, Recovery Score, APRE, геймификация, мульти-спорт.
3. **Предиктивный слой (Фаза 3 — 100%):** Тренды, предупреждения, виртуальная дата, Demo Mode.
4. **Персонализационный слой (Фаза 4 — 100%):** Профиль пользователя, реабилитация, адаптация под инвентарь.

### Технические слои (реализация)

```
┌─────────────────────────────────────────┐
│  UI (React 18 + TSX + JSX)              │
│  js/ui/pages/   js/ui/components/       │
├─────────────────────────────────────────┤
│  Zustand Store (useAppStore.ts)         │
│  js/stores/ — Данные + Actions          │
├─────────────────────────────────────────┤
│  Domain Logic (js/domains/)             │
│  training · checkin · analytics ·       │
│  profile · achievements · import ·      │
│  demo · onboarding                      │
├─────────────────────────────────────────┤
│  Shared Layer (js/shared/)              │
│  types · helpers · config · hooks ·     │
│  i18n · ui primitives                   │
├─────────────────────────────────────────┤
│  Storage (Dexie / IndexedDB)            │
│  js/core/storage.ts                     │
└─────────────────────────────────────────┘
```

**Точка входа:** `js/app.tsx` — React.createRoot, BottomNav, lazy-загрузка страниц, Settings Modal, Toast, OnboardingWizard.

**Стор:** `js/stores/useAppStore.ts` — единый центральный Zustand-стор. `computeDerived()` пересчитывает все производные значения после каждого изменения данных. Включает профиль пользователя (уровень, цели, инвентарь, реабилитация).

**Планы тренировок:** `js/domains/training/plans/` — 8 модулей видов спорта, каждый экспортирует `{SportKey}PlanModule` с 4 фазами (base/build/peak/deload). Регистрируются в `SPORT_MODULES` в `js/domains/training/planning/planning.ts`.

**База упражнений:** `js/domains/profile/exerciseDatabase.ts` — библиотека упражнений с метаданными реабилитации (avoidIf/rehabFor) и оборудования. Фильтрация упражнений по профилю пользователя.

## 🧠 5. Научная база (Прозрачность вместо «чёрного ящика»)

### Recovery Score — Три уровня

| Уровень | Веса | Когда используется |
|---------|------|-------------------|
| **Full (Полный)** | HRV 40% + Sleep 30% + RHR 10% + Subjective 20% | Есть HRV-монитор |
| **Medium (Средний)** | RHR 30% + Sleep 30% + Subjective 40% | Есть смартчасы/пульсометр без HRV |
| **Light (Лёгкий)** | Subjective 100% | Только ручной ввод |

Уровень выбирается автоматически на основе выбранных устройств в онбординге, либо может быть изменён вручную.

### APRE (Autoregulatory Progressive Resistance Exercise)

Реализован в `js/domains/training/apre/engine.js`. Динамическое изменение весов/повторов на основе RPE прошлой тренировки по таблицам Mann.

### Readiness (Статус готовности)

Три независимых баланса — по аналогии с Oura Readiness и Firstbeat. Итоговый статус определяется **по худшему из них**.

| HRV Баланс | Баланс восстановления | Субъективный баланс | Итоговый статус |
|---|---|---|---|
| 🟢 | 🟢 | 🟢 | **Зелёный**: Полная готовность |
| 🟢 | 🟡 | 🟢 | **Жёлтый**: Нагрузка с осторожностью |
| 🟢 | 🟢 | 🔴 | **Красный**: Снижение нагрузки |
| Любой 🔴 | Любой | Любой | **Красный**: Активное восстановление |

---

## 🗃️ 6. Модель данных (ключевые сущности)

Все данные хранятся локально в IndexedDB (Dexie.js) и не покидают устройство пользователя без экспорта.

### Check-in (ежедневный)
```json
{
  "date": "2026-05-18",
  "sleepHours": 7.5,
  "restHR": 62,
  "hrv": 55,
  "weight": 78.5,
  "hipPain": 1,
  "shoulderPain": 0,
  "breathing": "ok",
  "sleepQuality": 4,
  "muscleSoreness": 2,
  "mood": 4,
  "stress": 3,
  "motivation": 5,
  "checkinTier": "full",
  "selectedSports": ["Running", "Cycling"]
}
```

### Session (тренировка)
```json
{
  "key": "2026-05-18_A",
  "date": "2026-05-18",
  "type": "A",
  "completed": true,
  "readiness": "green",
  "rpe": 7,
  "exercises": [{ "name": "Подтягивания", "sets": "3", "reps": "8" }]
}
```

### Settings
```json
{
  "startDate": "2026-05-01",
  "trainDays": [1, 3, 5],
  "selectedSports": ["Running"],
  "selectedGadgets": ["manual"],
  "checkinTier": "light"
}
```

---

## 🗺️ 7. Дорожная карта

| Фаза | Статус | Критерии готовности |
|------|--------|-------------------|
| Фаза 1 — Фундамент | ✅ 100% | Архитектура, хранилище, стор, виртуальная дата |
| Фаза 2 — Персонализация | ✅ 100% | Модульные планы (8 спортов), онбординг (5 шагов), tiered check-in, геймификация, мульти-спорт |
| Фаза 3 — Адаптивность | ✅ 100% | Виртуальная дата, 30-дневная лента, Demo Mode, AI-советы |
| Фаза 4 — Профиль и реабилитация | ✅ 100% | UserProfileEditor, exerciseDatabase, фильтрация по инвентарю/реабилитации |
| Фаза 5 — Экосистема | ⏳ 20% | LiveWorkoutMode (планируется), гранулярное логирование (планируется), Apple Health / Google Fit, PDF-отчёты |
| Архитектурная миграция | ✅ 100% | Перенос логики в `js/domains/` (8 модулей), выделение `js/shared/`, re-export мосты через `js/core/` |

---

## 💡 8. Парковка идей

- **i18n English** — переводы готовы (en.json), переключатель языка активирован в ProfilePage
- **Интеграция с Apple Health / Google Fit** — улучшает качество данных (Фаза 5)
- **Экспорт отчётов в PDF** — полезно для тренера или врача (Фаза 5)
- **Адаптивный Recovery Score** — detectOptimalTier() реализован, автодетекция по паттернам чек-инов
- **LiveWorkoutMode** — режим живой тренировки с таймером и по-сетовым вводом (Фаза 5)
- **Гранулярное логирование** — повторения по подходам, RPE, рабочий вес (Фаза 5)
- ~~Сравнение с друзьями~~ — удалено, противоречит философии приватности

---

## 💰 9. Устойчивость и монетизация

Модель: **Open Core** — базовая функциональность всегда бесплатна и открыта.

Главный принцип: данные пользователя никогда не продаются и не используются для рекламы.

---

## ⚙️ 10. Технический стек и правила

| Инструмент | Версия | Роль |
|---|---|---|
| **React** | 18.2.0 | UI-фреймворк |
| **Vite** | 8.x | Бандлер и дев-сервер |
| **TypeScript** | 6.x | Строгая типизация |
| **Zustand** | 5.x | Глобальный стор (единый) |
| **Dexie.js** | 4.x | IndexedDB-обёртка |
| **@base-ui/react** | 1.5 | UI-примитивы (Collapsible, Dialog) |
| **Lucide React** | 1.16 | Иконки |
| **react-i18next** | 17.x | i18n (ru/en) |
| **Workbox** | 7.x | Service Worker / PWA |
| **Vitest** | 4.x | Тест-раннер |

**Никаких:** jQuery, Bootstrap, Tailwind, Redux, React Context для глобального стейта, внешних API.

---

## 🧪 11. Тесты (текущее состояние)

**724+ тестов, 61 файл, 0 failures.**

| Файл | Тесты | Покрывает |
|------|:-----:|-----------|
| `js/tests/core/apre.test.ts` | ~56 | APRE-движок (Mann tables) |
| `js/tests/core/correlations.test.ts` | ~7 | Корреляции |
| `js/tests/core/planning.test.ts` | ~16 | Планирование тренировок |
| `js/tests/core/readiness.test.ts` | ~17 | Readiness, detectRecoveryDebt |
| `js/tests/core/stats.test.ts` | ~12 | Статистика, streak |
| `js/tests/core/validation.test.ts` | ~6 | Валидация чек-ина |
| `js/tests/components/EmptyState.test.tsx` | ~8 | Компонент EmptyState |
| `js/tests/components/StatBox.test.tsx` | ~8 | Компонент StatBox |
| `js/tests/components/ScaleSelector.test.tsx` | ~7 | Компонент ScaleSelector |
| `js/tests/components/Skeleton.test.tsx` | ~7 | Компонент Skeleton |
| `js/tests/stores/useAppStore.test.ts` | ~9 | Центральный стор |
| `js/tests/ui/TodayPage.weekly.test.tsx` | ~3 | 30-дневная лента дат |
| `js/tests/core/demoData.test.ts` | ~8 | Демо-данные |
| `js/tests/core/helpers.test.ts` | ~6 | Утилиты дат |
| `js/tests/core/useAppStore.offset.test.ts` | ~4 | Виртуальная дата |
| `js/tests/core/storage.demo.test.ts` | ~2 | Хранилище демо |
| `js/tests/core/deriveTier.test.ts` | ~8 | Определение уровня |
| `js/tests/core/recoveryScore.test.ts` | ~11 | Recovery Score |
| `js/tests/ui/OnboardingWizard.test.tsx` | ~6 | Онбординг |
| `js/tests/ui/CheckinForm.test.tsx` | ~4 | Форма чек-ина |
| `js/tests/core/storage.test.ts` | ~25 | Хранилище Dexie |
| `js/tests/core/completionRate.test.ts` | ~6 | Completion rate |
| `js/tests/core/adherenceMultiplier.test.ts` | ~7 | Adherence multiplier |
| `js/domains/achievements/tests/achievements.test.ts` | ~8 | Достижения |
| `js/domains/analytics/tests/streak.test.ts` | ~12 | Streak-трекинг |
| `js/domains/training/tests/planning.test.ts` | ~11 | Планирование (domain) |
| `js/domains/training/tests/sessionLoad.test.ts` | ~6 | Нагрузка сессии |
| `js/domains/checkin/tests/validation.test.ts` | ~9 | Валидация (domain) |
| `js/domains/profile/tests/exerciseDatabase.test.ts` | ~4 | База упражнений |
| `js/domains/profile/tests/rehabProtocol.test.ts` | ~4 | Реабилитация |
| `js/domains/training/tests/loadAdjustments.test.ts` | ~6 | Adjustments |
| `js/domains/import/tests/csvParser.test.ts` | ~4 | CSV парсер |
| ... | ... | ... |

**Инвариант:** `tsc --noEmit` + `vite build` + `npm test` — всегда зелёные.
