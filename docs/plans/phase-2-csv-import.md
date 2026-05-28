# Phase 2 Implementation Plan: CSV Health Sync Import

**Goal:** Simplify input of biometrics (sleep, HRV, RHR) by importing CSV from Health Sync.
**Approach:** TDD for pure functions (CSV parser, merger). UI + store changes follow.

---

## Task 1: CSV parser module (TDD)

**Files:** `js/core/import/csvParser.ts` (new), `js/tests/core/csvParser.test.ts` (new)

### TDD Cycle:

**RED — Write test first:**
Tests cover:
- Parse valid CSV with columns: date, sleepHours, restHR, hrv
- Handle header variations ("Sleep Duration" vs "sleep", "HRV (ms)" vs "hrv")
- Handle missing/empty values gracefully
- Return empty array for empty content
- Skip malformed rows, process valid ones
- Flexible delimiter (comma)

**GREEN — Minimal implementation:**
- `parseHealthSyncCSV(csvContent: string): ParsedBiometrics[]`
  - Split by lines, detect delimiter
  - Normalize headers (lowercase, strip units like "(ms)", "(hrs)")
  - Map to ParsedBiometrics: `{ date, sleepHours?, restHR?, hrv? }`
  - Skip rows with invalid date format
- `mergeImportedBiometrics(records: ParsedBiometrics[], allCheckins: Checkin[]): { merged: number; skipped: number }`
  - For each record, find matching checkin by date
  - Only fill in fields that are currently 0 or missing
  - Return counts

### Subagent prompt:
```
TASK 1: Create CSV parser module for Health Sync import using strict TDD

Working directory: C:\Projects\fitness-tracker

Follow TDD: write test first, watch it fail, then write minimal implementation.

Read these files first:
- js/core/types.ts — understand Checkin interface fields (sleepHours, restHR, hrv)
- js/tests/core/apre.test.ts — understand existing test patterns and imports

STEP 1: Create js/tests/core/csvParser.test.ts with failing tests for:
- parseHealthSyncCSV:
  - parses valid CSV with standard headers (date, sleepHours, restHR, hrv)
  - parses with flexible headers ("Sleep Duration", "HRV (ms)", "Resting HR")
  - returns empty array for empty string
  - handles missing values (empty cells)
  - skips malformed rows but processes valid ones
  - handles comma delimiter
- mergeImportedBiometrics:
  - fills missing fields in existing checkins
  - skips fields already filled (doesn't overwrite)
  - returns correct merged/skipped counts
  - handles empty arrays

Import from '../core/parser.js' — see patterns in other tests.

STEP 2: Run tests to verify they FAIL

STEP 3: Create js/core/import/csvParser.ts:

Types:
```typescript
export interface ParsedBiometrics {
  date: string; // YYYY-MM-DD
  sleepHours?: number;
  restHR?: number;
  hrv?: number;
}
```

Functions:
- parseHealthSyncCSV(csvContent: string): ParsedBiometrics[]
  - Split by newline, trim
  - First line = headers, normalize to lowercase, strip units/parentheses
  - Detect delimiter (comma)
  - Map each data row to ParsedBiometrics
  - Validate date format (YYYY-MM-DD regex)
  - Parse numbers, default undefined for empty/invalid
  - Skip rows with invalid dates

- mergeImportedBiometrics(records: ParsedBiometrics[], allCheckins: Checkin[]): { merged: number; skipped: number; checkins: Checkin[] }
  - For each record, find checkin with matching date
  - For each field (sleepHours, restHR, hrv): only set if checkin's current value is 0 or field is missing
  - Count merged (fields filled) and skipped (already had values)
  - Return updated checkins array

Import from './types.js'. Export both functions.

STEP 4: Run tests to verify they PASS
STEP 5: Run type-check: cd C:\Projects\fitness-tracker; npm run type-check

IMPORTANT: No comments in code. Use exact function signatures. Pure functions only.
Report: test results, type-check result.
```

---

## Task 2: ProfilePage CSV import UI

**File:** `js/ui/pages/ProfilePage.jsx`

### Changes:
- Add new button "📲 Импорт из Health Sync (CSV)" near existing export/import/reset buttons
- On click: open file picker (.csv only)
- On file select: read file, call parseHealthSyncCSV, then mergeImportedBiometrics
- Save merged checkins via saveCheckin()
- Show toast: "Обновлено X записей, пропущено Y (уже заполнены)"
- Error handling: invalid CSV → show error toast

### Subagent prompt:
```
TASK 2: Add CSV import button to ProfilePage

Working directory: C:\Projects\fitness-tracker

Read js/ui/pages/ProfilePage.jsx first. Find the Data section (around line 421-452) where export/import/reset buttons already exist.

Changes needed:

1. Add import for parseHealthSyncCSV and mergeImportedBiometrics from '../../core/import/csvParser.js'
2. Add import for saveCheckin from '../../core/storage.js'
3. Add import for getAllCheckins from '../../core/storage.js'

4. In the Data section, ADD a new button BEFORE the existing export button:
   Button label: use t('profile.data.importCSV') — we'll add the i18n key
   Actually, hardcode the button text for now or add the i18n key to ru.json and en.json yourself.
   Use: "📲 Импорт Health Sync (CSV)"
   
   On click handler:
   ```javascript
   onClick: async () => {
     const input = document.createElement('input');
     input.type = 'file';
     input.accept = '.csv';
     input.onchange = async (e) => {
       const file = e.target.files?.[0];
       if (!file) return;
       try {
         const text = await file.text();
         const { parseHealthSyncCSV, mergeImportedBiometrics } = await import('../../core/import/csvParser.js');
         const records = parseHealthSyncCSV(text);
         if (records.length === 0) {
           alert('CSV файл пуст или имеет неверный формат');
           return;
         }
         const allCheckins = await (await import('../../core/storage.js')).getAllCheckins();
         const { merged, skipped, checkins: updated } = mergeImportedBiometrics(records, allCheckins);
         // Save each updated checkin
         for (const c of updated) {
           const { saveCheckin } = await import('../../core/storage.js');
           await saveCheckin(c);
         }
         showToast(`Обновлено ${merged} записей, пропущено ${skipped} (уже заполнены)`, 'success');
         // Reload app data
         const { initApp } = useAppStore.getState();
         await initApp();
       } catch (err) {
         console.error('CSV import failed:', err);
         alert(`Ошибка импорта: ${err instanceof Error ? err.message : 'Неверный формат файла'}`);
       }
     };
     input.click();
   },
   ```

5. Add i18n keys to both ru.json and en.json:
   In profile.data section, add:
   - ru: "importCSV": "📲 Импорт Health Sync (CSV)"
   - en: "importCSV": "📲 Import Health Sync (CSV)"

Read both locale files first, then add the keys.

CRITICAL: Follow existing React.createElement style. Do NOT move existing buttons.
Add the new CSV import button at the START of the button group (before export).

After changes:
cd C:\Projects\fitness-tracker; npm run type-check
Report: changes made, type-check result.
```

---

## Task 3: Verify integration

```powershell
cd C:\Projects\fitness-tracker; npm run type-check; npm test
```

All 263+ existing tests + new csvParser tests must pass.
