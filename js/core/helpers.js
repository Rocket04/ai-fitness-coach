// js/core/helpers.js
// Чистые утилиты для работы с датами и форматированием

/**
 * Парсит ISO-строку "YYYY-MM-DD" в Date с полднём (12:00).
 * @param {string|null} str
 * @returns {Date|null}
 */
export function parseLocalDate(str) {
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

/**
 * Форматирует Date в ISO-строку "YYYY-MM-DD".
 * @param {Date} date
 * @returns {string}
 */
export function formatISO(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * Прибавляет дни к дате (возвращает новый экземпляр).
 * @param {Date} date
 * @param {number} days
 * @returns {Date}
 */
export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Возвращает понедельник недели, в которую входит date.
 * @param {Date} date
 * @returns {Date}
 */
export function mondayOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff, 12, 0, 0, 0);
}

/**
 * Разница в неделях между start (включительно) и target.
 * Нумерация с 1 (первая неделя = 1).
 * @param {Date} start
 * @param {Date} target
 * @returns {number}
 */
export function weekDiff(start, target) {
  return Math.floor((mondayOfWeek(target) - mondayOfWeek(start)) / (7 * 24 * 60 * 60 * 1000)) + 1;
}

/**
 * Локализованная метка даты для отображения (например "пн, 6 янв.").
 * @param {Date} date
 * @returns {string}
 */
export function dateLabel(date) {
  return date.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' });
}

/**
 * Ограничивает число в диапазоне [min, max].
 * @param {number} n
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

/**
 * Безопасный JSON.parse с fallback-значением.
 * @param {*} raw
 * @param {*} fallback
 * @returns {*}
 */
export function safeJSONParse(raw, fallback) {
  try { return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
}
