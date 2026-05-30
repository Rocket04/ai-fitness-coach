# Security Audit Report — Smart Fitness Coach

**Date:** 2026-05-30  
**Auditor:** Senior Security Engineer  
**Scope:** Full PWA application audit (XSS, injections, data integrity, leaks, CSP, storage security)

---

## Executive Summary

**Overall risk level: LOW.** The application is a local-first PWA with no external server dependencies. No critical vulnerabilities found. The most significant finding is an overly permissive Content Security Policy that could be tightened. Two medium-severity issues were found related to CSP and data backup fragility. Minor hardening opportunities exist in import validation and localStorage usage.

---

## Audit Results

| # | Серьёзность | Категория | Файл:Строка | Проблема | Рекомендация |
|---|------------|-----------|-------------|----------|-------------|
| 1 | **Medium** | CSP — script-src | `index.html:8` | `script-src` содержит `'unsafe-inline'` и `'unsafe-eval'`. Inline-скрипты используются для Service Worker регистрации (`index.html:214-261`). `unsafe-eval` требуется Vite в dev-режиме, но актуально и для production-сборки. | Разделить dev/production CSP. В production заменить `'unsafe-inline'` на nonce (`<script nonce="...">`) и убрать `'unsafe-eval'`. Inline-код SW-регистрации вынести в отдельный файл с хешем. |
| 2 | **Medium** | CSP — style-src | `index.html:8` | `style-src 'self' 'unsafe-inline'` — критический CSS встроен в `<style>` блок (`index.html:12-204`). React-компоненты используют inline-стили (например, `WorkoutMode.jsx:126`, `CheckinForm.jsx:353`). | Для production заменить `'unsafe-inline'` на nonce для `<style>` блоков. Inline-стили React (style={}) не требуют `'unsafe-inline'` в современных браузерах с CSP3. |
| 3 | **Medium** | CSP — connect-src | `index.html:8` | `connect-src 'self'` — корректно, но Service Worker (`sw.js:100-108`) кеширует ответы от внешних CDN (unpkg.com, cdn.jsdelivr.net, fonts.gstatic.com). Если CSP будет расширен, эти домены нужно учесть. | Текущая настройка безопасна для локального приложения. При добавлении внешних API в будущем — добавить их в connect-src явно. |
| 4 | **Low** | CSP — Service Worker | `public/sw.js:100-108` | SW кеширует ресурсы с внешних CDN (unpkg, jsdelivr, fonts.googleapis). Хотя эти CDN сейчас не используются (ни один скрипт не загружается с них), кеширование включено на уровне SW, что создаёт потенциальную поверхность атаки supply-chain. | Удалить CDN-маршруты из SW, если они не используются. Либо добавить subresource integrity (SRI) для любых внешних скриптов. |
| 5 | **Low** | XSS — notes field | `WorkoutMode.jsx:370` | Поле `sessionNote` сохраняется в Session.notes, но **никогда не рендерится в DOM** как HTML. Все рендеры идут через React.createElement, который автоматически экранирует текст. Дополнительно: поле notes в чек-ине (`CheckinForm.jsx:332-338`) тоже экранировано React. | Уязвимости нет. React-экранирование работает корректно. Рекомендация: сохранять существующий подход и не использовать `dangerouslySetInnerHTML`. |
| 6 | **Low** | XSS — coach advice | `advice.ts:9-76` | `getCoachAdvice()` генерирует строки советов с интерполяцией числовых значений (recoveryScore, sleepHours, hrv и др.) через шаблонные строки. Все значения — числа из store. Рендер через `CoachTipsPanel` (`TodayPage.jsx:155-175`) использует React-текстовые узлы. | Уязвимости нет. Типобезопасность гарантирует, что в строки попадают только числа. Мониторинг: если в будущем в советы будут добавляться строковые поля от пользователя — требуется экранирование. |
| 7 | **Low** | XSS — explanation | `advice.ts:119-180` | `getExplanation()` интерполирует `recoveryScore`, `sleepHours`, `restHR`, `planModifications` в строки. `planModifications` приходят из `planning.ts` — чисто вычисляемый derived state, не из пользовательского ввода. Рендер через `TodayPage.jsx:566-573`. | Уязвимости нет. Все значения типобезопасны. |
| 8 | **Low** | XSS — CSV import | `csvParser.ts:131-191` | CSV-парсер извлекает только числовые значения (`parseFloat`, `Math.round`). Строковые поля (date) проходят валидацию через regex `normalizeDate()`. Сырые CSV-данные не сохраняются и не рендерятся. | Уязвимости нет. Числовая экстракция безопасна. |
| 9 | **Low** | XSS — file import flow | `store/index.ts:637-679` | JSON-импорт проходит через Zod-валидацию (`importSchemas.ts:99-135`). Schema `SessionSchema` ожидает `notes: z.string()` — строка не экранируется на уровне валидации, но хранится в IndexedDB и рендерится только через React (экранирование). | Безопасно, т.к. React экранирует текст. При добавлении рендера notes через innerHTML — это станет критической уязвимостью. |
| 10 | **Low** | Data integrity — weak type guards | `importSchemas.ts:6-66` | Zod-схемы используют `.passthrough()` — лишние поля пропускаются без ошибки. `SessionSchema.rpe: z.number()` — если в JSON придет `rpe: "notanumber"`, Zod отклонит запись в целом. `CheckinSchema.notes: z.string().optional()` — строка любой длины. | `.passthrough()` — допустимо для обратной совместимости. Рассмотреть `.strict()` для новых версий формата. Добавить `.max(10000)` на строковые поля notes. |
| 11 | **Low** | Data integrity — legacy fallback | `importSchemas.ts:68-73` | `LegacySchema` использует `z.record(z.any())` — минимальная валидация legacy-формата. Любые данные пройдут. | Legacy-поддержка — временная мера. Добавить версионирование и срок прекращения поддержки legacy. |
| 12 | **Low** | Data integrity — import backup | `store/index.ts:656-661` | При импорте создаётся резервная копия в localStorage (`fitness-backup-before-import-{timestamp}`). Размер хранилища ограничен 5 записями. Сама backup — это дамп IndexedDB в localStorage, который имеет квоту ~5-10MB. | Улучшить: создавать backup в IndexedDB (отдельная таблица), а не в localStorage. Увеличить лимит бэкапов или позволить пользователю скачать backup перед импортом. |
| 13 | **Low** | Data integrity — demo backup | `store/index.ts:739-745`, `780-787` | Аналогичная проблема: backup перед демо-режимом сохраняется в localStorage. При большом объёме данных (много сессий/чекинов) JSON.stringify может превысить квоту localStorage. | Переместить механизм backup в IndexedDB. |
| 14 | **Low** | Data integrity — clearAllData | `data/storage.ts:299-315` | Функция `clearAllData()` не имеет подтверждения — вызывается через Zustand action `confirmResetData()`, который показывает `showResetConfirm`. Бэкап перед сбросом не создаётся. | Добавить автоматический backup в IndexedDB перед clearAllData. |
| 15 | **Low** | Data leak — network requests | `public/sw.js:122,144` | Единственные `fetch()` в приложении — внутри Service Worker для кеширования статики. Никаких внешних API-запросов, аналитики, трекеров. | Уязвимости нет. Локальная архитектура соответствует заявленной приватности. |
| 16 | **Low** | Data leak — third-party scripts | `index.html:1-264` | **Нет сторонних CDN-скриптов.** Все ресурсы — `self`. Единственный скрипт: `js/app.tsx` (module). Иконка — data:URI (SVG). | Уязвимости нет. Модель нулевого доверия к внешним ресурсам соблюдена. |
| 17 | **Low** | Storage — sessionStorage | `store/index.ts:57-80` | `sessionStorage` используется для хранения гостевых сессий (JSON.stringify). Чувствительных данных нет (тренировочные данные). Очищается при закрытии вкладки. | Безопасно для текущего use-case. Документировать, что sessionStorage — временное хранилище без гарантий сохранности. |
| 18 | **Low** | Storage — localStorage | `store/index.ts:658,741,784` | localStorage используется для хранения резервных копий перед импортом/демо. Содержат полный дамп пользовательских данных (тренировки, чек-ины) в незашифрованном виде. | Локальное приложение — шифрование избыточно, но если в будущем добавится синхронизация, backup в localStorage должен быть зашифрован. Отметить в документации. |
| 19 | **Low** | Storage — sensitive flags in localStorage | `store/index.ts:835-836,882-883` | `localStorage.setItem('fitness-tracker-goal', ...)` и `'fitness-tracker-apre-protocol'` — нечувствительные настройки. | Безопасно. |
| 20 | **Low** | Validation — CSV path traversal | `csvParser.ts:131-191` | CSV-парсер не читает файлы с диска — принимает строку `csvContent`. Нет риска path traversal или произвольного чтения. | Безопасно. |
| 21 | **Low** | Validation — JSON.parse in import | `store/index.ts:647` | `JSON.parse(text)` обёрнут в try/catch, ошибка парсинга обрабатывается. Размер файла ограничен 5MB (`store/index.ts:640`). | Безопасно. Рассмотреть streaming-парсинг для файлов >1MB. |
| 22 | **Info** | Storage — no encryption | `data/storage.ts:23-35` | IndexedDB (Dexie) не шифрует данные на диске. Для локального PWA это стандартная практика. Данные доступны через DevTools и прямой доступ к файловой системе. | Документировать: все данные хранятся в открытом виде в IndexedDB. Шифрование на уровне приложения (Web Crypto API) — planned feature. |

---

## Findings by Category

### 1. XSS (Cross-Site Scripting)

**Вердикт: уязвимостей не обнаружено.**

Приложение корректно использует React JSX/`createElement` для всего рендеринга. Все пользовательские данные (notes, exercise names, checkin comments) проходят через автоматическое React-экранирование. Нигде не используется `dangerouslySetInnerHTML`, `innerHTML` или `document.write`.

Потенциально опасные точки входа:
- **CSV-импорт** (`csvParser.ts`): извлекает только числа, строки не сохраняются → **Safe**
- **JSON-импорт** (`importSchemas.ts`, `store/index.ts:637-679`): строковые поля (notes) хранятся в IndexedDB, рендерятся через React → **Safe**
- **CheckinForm.jsx** (textarea notes): React-экранирование → **Safe**
- **WorkoutMode.jsx** (sessionNote textarea): React-экранирование → **Safe**

### 2. Инъекции в IndexedDB

**Вердикт: уязвимостей не обнаружено, но есть резервы усиления валидации.**

- Zod-схемы (`importSchemas.ts`) валидируют типы: `z.number()` для числовых полей, `z.string()` для строковых → некорректные типы отклоняются
- `.passthrough()` позволяет лишние поля — рискованно для целостности, но не для безопасности
- Legacy-формат (`z.record(z.any())`) — минимальная валидация
- CSV-импорт безопасен — только числовые поля

### 3. Целостность данных

**Вердикт: Medium-риск — нет автоматического бэкапа перед сбросом данных.**

- Backup перед импортом: ✅ (localStorage, лимит 5 записей)
- Backup перед демо-режимом: ✅ (localStorage)
- Backup перед сбросом данных (`clearAllData`): ❌ **отсутствует**
- Восстановление после сбоя IndexedDB: ❌ нет механизма автоматического восстановления

### 4. Утечки данных

**Вердикт: утечек не обнаружено. Приватность соответствует заявленной.**

- fetch()/XMLHttpRequest/sendBeacon: только внутри Service Worker для кеширования статики
- Сторонние скрипты: **отсутствуют**
- Аналитика/трекеры: **отсутствуют**
- Service Worker: не отправляет данные на внешние серверы

### 5. Content Security Policy

**Вердикт: Medium-риск — CSP слишком разрешительная, особенно `unsafe-inline` + `unsafe-eval`.**

**Текущая CSP:**
```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval';
style-src 'self' 'unsafe-inline';
img-src 'self' data:;
font-src 'self';
connect-src 'self';
base-uri 'self';
form-action 'self';
```

Проблемы:
1. `'unsafe-eval'` разрешает `eval()`, `new Function()`, `setTimeout(string)` — **необходимо для Vite HMR в dev**, должно быть отключено в production
2. `'unsafe-inline'` для скриптов — inline-код `index.html:214-261` (SW регистрация) и потенциально любые инлайн-скрипты
3. Inline-стили React (style={}) не требуют `'unsafe-inline'` согласно CSP3

### 6. Безопасность хранилищ

**Вердикт: Low — данные не шифрованы, что допустимо для локального PWA.**

- IndexedDB: без шифрования (стандарт для PWA)
- localStorage: настройки + резервные копии (содержат полные дампы)
- sessionStorage: временные гостевые данные
- Чувствительные данные (пароли, токены): отсутствуют

---

## Recommendations (Priority Order)

1. **[High] CSP split**: Разделить dev/production CSP. Убрать `'unsafe-eval'` и `'unsafe-inline'` из production.
2. **[Medium] Auto-backup before reset**: Добавить создание backup в IndexedDB перед `clearAllData()`.
3. **[Low] Backup in IndexedDB**: Перенести механизм резервного копирования из localStorage в IndexedDB.
4. **[Low] Zod strict mode**: Рассмотреть `.strict()` для новых версий формата экспорта.
5. **[Low] String maxLength**: Добавить `.max(10000)` на строковые поля в Zod-схемах (notes).
6. **[Low] CDN routes in SW**: Удалить неиспользуемые CDN-маршруты из Service Worker.
7. **[Info] Documentation**: Опубликовать Security Policy с описанием шифрования и модели угроз.

---

_Report generated by security audit tool. No fixes applied — audit only._
