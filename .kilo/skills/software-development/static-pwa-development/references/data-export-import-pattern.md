# Data Export/Import Pattern with Validation and Backup

## Export Pattern
```typescript
handleExportData: async () => {
  const { todayISO, showToast: toast, sessions, checkins } = get();
  try {
    const data = await exportAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fitness-export-${todayISO}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast(`Экспортировано: ${sessions.length} тренировок, ${checkins.length} чек-инов`);
  } catch (err) {
    console.error('Export failed:', err);
    toast('Ошибка при экспорте данных', 'error');
  }
},
```

## Import Validation (7 checks)
1. File size check — max 5MB
2. File type validation — must be `.json`
3. Empty file check
4. JSON parse error handling with user-friendly message
5. Data structure validation — must be an object (not array)
6. Version compatibility check — reject export files from future versions (>3)
7. Detailed success message with counts

## Auto-Backup Before Import/Demo
When importing data or activating demo mode with existing data:
1. Check `hasExistingData = sessions.length > 0 || checkins.length > 0`
2. Call `exportAllData()` to get full backup
3. Store in localStorage: `fitness-backup-<reason>-<timestamp>`
4. Keep only last 5 backups, auto-clean older ones
5. Show toast: "Резервная копия создана перед активацией демо"
6. Non-blocking: wrap in try-catch, failure doesn't prevent import

## Import Flow
```
File → size check → type check → read text → JSON.parse → validate structure
  → version check → create backup (if existing data) → importAllData()
  → reload from DB → recompute derived → update store → success toast
```

## Error Messages (Russian)
- "Файл слишком большой (макс. 5 МБ)"
- "Ожидается файл JSON"
- "Файл пуст"
- "Невалидный JSON: проверьте синтаксис файла"
- "Некорректный формат: ожидался объект с данными"
- "Неподдерживаемая версия экспорта: X. Обновите приложение."
- Re-throw errors for caller handling (ProfilePage shows alert)
