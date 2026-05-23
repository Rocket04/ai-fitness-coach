# i18n Setup Guide

This document describes the internationalization (i18n) implementation for Smart Fitness Coach.

## Overview

The app uses **react-i18next** for internationalization with support for:
- Russian (ru) — default
- English (en) — translations complete, UI switcher pending

## Installation

Dependencies are already installed:

```bash
npm install  # react-i18next, i18next, i18next-browser-languagedetector
```

## File Structure

```
js/
├── i18n/
│   ├── index.ts          # i18n configuration
│   └── locales/
│       ├── ru.json       # Russian translations (24 KB)
│       └── en.json       # English translations (16 KB)
```

## Usage

### In Components

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();

  return (
    <h1>{t('today.title')}</h1>
    <p>{t('today.recoveryScore')}</p>
  );
}
```

### With Interpolation

```tsx
// Translation key: "exerciseCount": "{{count}} упражнений"
t('today.exerciseCount', { count: 5 })
// Result: "5 упражнений" (ru) or "5 exercises" (en)
```

### Changing Language

```tsx
import { changeLanguage } from './i18n/index.js';

// Switch to English
changeLanguage('en');

// Switch to Russian
changeLanguage('ru');
```

## Translation Keys Structure

```json
{
  "app": {
    "title": "App Name",
    "save": "Save"
  },
  "nav": {
    "today": "Today",
    "log": "Log",
    "analytics": "Analytics",
    "profile": "Profile"
  },
  "today": {
    "title": "Today",
    "recoveryScore": "Recovery Score"
  },
  "checkin": {
    "sleep": "Sleep",
    "hrv": "HRV"
  },
  "exercise": {
    "apre": "APRE",
    "set": "Set"
  }
}
```

## Language Detection

The app detects language in this order:
1. `localStorage` (saved preference)
2. Browser language (`navigator.language`)
3. HTML tag (`<html lang="ru">`)
4. Fallback: Russian

## Current Status

- **Russian (ru):** ✅ Complete — all UI strings translated
- **English (en):** ✅ Complete — all UI strings translated
- **Language switcher in UI:** ⏳ Not yet activated (translations are ready)

## Adding New Languages

1. Create translation file: `js/i18n/locales/[lang].json`
2. Import in `js/i18n/index.ts`:
   ```ts
   import fr from './locales/fr.json';
   ```
3. Add to resources:
   ```ts
   const resources = {
     ru: { translation: ru },
     en: { translation: en },
     fr: { translation: fr },  // new
   };
   ```
4. Update `supportedLngs`:
   ```ts
   supportedLngs: ['ru', 'en', 'fr'],
   ```

## Migration Guide

To migrate existing hardcoded strings:

1. Find hardcoded Russian string in component
2. Add translation key to `ru.json` and `en.json`
3. Replace string with `t('key')`
4. Add `useTranslation()` hook to component

Example:
```tsx
// Before:
<h1>Сегодня</h1>

// After:
const { t } = useTranslation();
<h1>{t('today.title')}</h1>
```

## Notes

- All user-facing strings should be translated
- Keep translation keys organized by feature/page
- Use nested keys for better organization (e.g., `today.title`)
- Interpolation values should match between languages
- The `index.ts` config is the single source of truth for i18n setup
