// js/core/helpers.ts
// Чистые утилиты для работы с датами и форматированием

/**
 * Парсит ISO-строку "YYYY-MM-DD" в Date с полднём (12:00).
 */
export function parseLocalDate(str: string | null): Date | null {
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

/**
 * Форматирует Date в ISO-строку "YYYY-MM-DD".
 */
export function formatISO(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * Прибавляет дни к дате (возвращает новый экземпляр).
 */
export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Возвращает понедельник недели, в которую входит date.
 */
export function mondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff, 12, 0, 0, 0);
}

/**
 * Разница в неделях между start (включительно) и target.
 * Нумерация с 1 (первая неделя = 1).
 */
export function weekDiff(start: Date, target: Date): number {
  return Math.floor((mondayOfWeek(target).getTime() - mondayOfWeek(start).getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
}

/**
 * Локализованная метка даты для отображения (например "пн, 6 янв.").
 */
export function dateLabel(date: Date): string {
  return date.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' });
}

/**
 * Ограничивает число в диапазоне [min, max].
 */
export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/**
 * Безопасный JSON.parse с fallback-значением.
 */
export function safeJSONParse<T>(raw: string | null | undefined, fallback: T): T {
  try { return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
}


/**
 * Module-level offset — set by the store on init and on change.
 * All date-sensitive logic reads this via getAppDate().
 */
let _virtualTodayOffset = 0;

/** Set the virtual date offset (called by the store). */
export function setVirtualTodayOffset(offset: number): void {
  _virtualTodayOffset = offset;
}

/** Get the current virtual date offset. */
export function getVirtualTodayOffset(): number {
  return _virtualTodayOffset;
}

/**
 * Returns the "application date" — real today offset by virtualTodayOffset days.
 * All date-sensitive logic should use this instead of new Date().
 */
export function getAppDate(): Date {
  const d = new Date();
  d.setDate(d.getDate() + _virtualTodayOffset);
  return d;
}

/**
 * Synchronous version that uses an explicit offset parameter.
 * Use this when the offset is already known (e.g. from store state in computeDerived).
 */
export function getAppDateSync(offset: number = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d;
}
