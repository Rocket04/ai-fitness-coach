// js/core/storage.js
// Слой данных над Dexie (IndexedDB) — CRUD для сессий, чек-инов, настроек и достижений.

import Dexie from 'dexie';

/**
 * Dexie‑экземпляр для работы с IndexedDB.
 * @type {Dexie}
 */
const db = new Dexie('FitnessAppDB');

/**
 * Схема базы данных (v2):
 *
 * sessions
 *   key    — строковый PK вида "YYYY-MM-DD_A" / "YYYY-MM-DD_morning"
 *   date   — ISO-дата YYYY-MM-DD (индексировано для фильтрации по диапазону)
 *   type   — 'A' | 'B' | 'C' | 'rest' | 'morning' | 'evening'
 *
 * checkins
 *   date   — строковый PK (YYYY-MM-DD)
 *
 * settings
 *   key    — строковый PK (ключ для key-value хранения)
 *   value  — произвольное значение (строка, число, JSON)
 *
 * achievements
 *   id           — автоинкремент (++id)
 *   achievementKey — ключ достижения
 *   earnedAt     — timestamp
 */
db.version(2).stores({
  sessions: 'key, date, type',
  checkins: 'date',
  settings: 'key',
  achievements: '++id, achievementKey, earnedAt'
});

/* =================================================================
 * ИНИЦИАЛИЗАЦИЯ
 * ================================================================= */

/**
 * Открывает подключение к IndexedDB.
 * @returns {Promise<void>}
 */
export async function init() {
  try {
    await db.open();
  } catch (err) {
    throw new Error(`Не удалось открыть базу данных: ${err.message}`, { cause: err });
  }
}

/* =================================================================
 * СЕССИИ
 * ================================================================= */

/**
 * Сохраняет или обновляет запись тренировки.
 * @param {Object} session — { key, date, type, completed, readiness, rpe,
 *   hipPain, shoulderPain, notes, testResults?, mode, updatedAt }
 * @returns {Promise<string>} key сохранённой сессии.
 */
export async function saveSession(session) {
  try {
    if (session.key === undefined || session.key === null) {
      throw new Error('Для сессии обязательно поле key');
    }
    await db.sessions.put({ ...session });
    return session.key;
  } catch (err) {
    throw new Error(`Ошибка при сохранении сессии: ${err.message}`, { cause: err });
  }
}

/**
 * Удаляет сессию по ключу.
 * @param {string} key — "YYYY-MM-DD_type"
 * @returns {Promise<void>}
 */
export async function deleteSession(key) {
  try {
    await db.sessions.delete(key);
  } catch (err) {
    throw new Error(`Ошибка при удалении сессии ${key}: ${err.message}`, { cause: err });
  }
}

/**
 * Возвращает одну сессию по ключу.
 * Возвращает одну сессию по ключу.
 * @param {string} key — "YYYY-MM-DD_type"
 * @returns {Promise<Object|null>}
 */
export async function getSessionByKey(key) {
  try {
    return (await db.sessions.get(key)) ?? null;
  } catch (err) {
    throw new Error(`Ошибка при получении сессии ${key}: ${err.message}`, { cause: err });
  }
}

/**
 * Возвращает все сессии.
 * @returns {Promise<Array<Object>>}
 */
export async function getAllSessions() {
  try {
    return await db.sessions.toArray();
  } catch (err) {
    throw new Error(`Ошибка при получении всех сессий: ${err.message}`, { cause: err });
  }
}

/**
 * Возвращает сессии в диапазоне дат (включительно).
 * @param {string} fromISO — YYYY-MM-DD
 * @param {string} toISO   — YYYY-MM-DD
 * @returns {Promise<Array<Object>>}
 */
export async function getSessionsInDateRange(fromISO, toISO) {
  try {
    return await db.sessions
      .where('date')
      .between(fromISO, toISO, true, true)
      .toArray();
  } catch (err) {
    throw new Error(`Ошибка при получении сессий за ${fromISO}..${toISO}: ${err.message}`, { cause: err });
  }
}

/**
 * Возвращает все сессии за указанный месяц.
 * @param {string} prefix — "YYYY-MM"
 * @returns {Promise<Array<Object>>}
 */
export async function getSessionsByMonth(prefix) {
  try {
    const [yearStr, monthStr] = prefix.split('-');
    const year = Number(yearStr);
    const month = Number(monthStr) - 1;
    const start = new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10);
    const end = new Date(Date.UTC(year, month + 1, 0)).toISOString().slice(0, 10);
    return await db.sessions
      .where('date')
      .between(start, end, true, true)
      .toArray();
  } catch (err) {
    throw new Error(`Ошибка при получении сессий за месяц: ${err.message}`, { cause: err });
  }
}

/**
 * Возвращает последние `limit` сессий, отсортированные по дате (убывание).
 * @param {number} limit
 * @returns {Promise<Array<Object>>}
 */
export async function getLastSessions(limit) {
  try {
    return await db.sessions
      .orderBy('date')
      .reverse()
      .limit(limit)
      .toArray();
  } catch (err) {
    throw new Error(`Ошибка при получении последних сессий: ${err.message}`, { cause: err });
  }
}

/**
 * Возвращает все сессии указанного типа.
 * @param {string} type — 'A'|'B'|'C'|'rest'|'morning'|'evening'
 * @returns {Promise<Array<Object>>}
 */
export async function getSessionsByType(type) {
  try {
    return await db.sessions
      .where('type')
      .equals(type)
      .toArray();
  } catch (err) {
    throw new Error(`Ошибка при получении сессий по типу ${type}: ${err.message}`, { cause: err });
  }
}

/**
 * Возвращает последние `limit` сессий, содержащих testResults.
 * @param {number} [limit=10]
 * @returns {Promise<Array<Object>>}
 */
export async function getSessionsWithTests(limit = 10) {
  try {
    const results = await db.sessions
      .filter(s => s.testResults != null)
      .toArray();
    results.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    return results.slice(0, limit);
  } catch (err) {
    throw new Error(`Ошибка при получении сессий с тестами: ${err.message}`, { cause: err });
  }
}

/**
 * Возвращает testResults из самой свежей сессии, где они присутствуют.
 * @returns {Promise<Object|null>}
 */
export async function getLatestTestResults() {
  try {
    const sessions = await db.sessions
      .filter(s => s.testResults != null)
      .toArray();
    if (!sessions.length) return null;
    sessions.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    return sessions[0].testResults ?? null;
  } catch (err) {
    throw new Error(`Ошибка при получении последних результатов теста: ${err.message}`, { cause: err });
  }
}

/* =================================================================
 * ЧЕК-ИНЫ
 * ================================================================= */

/**
 * Сохраняет или обновляет ежедневный чек-ин. Поле `date` — первичный ключ.
 * @param {Object} checkin — { date, sleepHours, restHR, hrv, hipPain,
 *   shoulderPain, breathing, weight, notes, qualityOfSleep?,
 *   muscleSoreness?, motivation?, ts, readiness? }
 * @returns {Promise<string>} date сохранённого чек-ина.
 */
export async function saveCheckin(checkin) {
  try {
    if (checkin.date === undefined || checkin.date === null) {
      throw new Error('Для чек-ина обязательно поле date');
    }
    await db.checkins.put({ ...checkin });
    return checkin.date;
  } catch (err) {
    throw new Error(`Ошибка при сохранении чек-ина: ${err.message}`, { cause: err });
  }
}

/**
 * Возвращает чек-ин за конкретную дату.
 * @param {string} date — YYYY-MM-DD
 * @returns {Promise<Object|null>}
 */
export async function getCheckin(date) {
  try {
    return (await db.checkins.get(date)) ?? null;
  } catch (err) {
    throw new Error(`Ошибка при получении чек-ина за ${date}: ${err.message}`, { cause: err });
  }
}

/**
 * Возвращает все чек-ины.
 * @returns {Promise<Array<Object>>}
 */
export async function getAllCheckins() {
  try {
    return await db.checkins.toArray();
  } catch (err) {
    throw new Error(`Ошибка при получении всех чек-инов: ${err.message}`, { cause: err });
  }
}

/**
 * Возвращает чек-ины за последние `days` дней (включая сегодня).
 * @param {number} days
 * @returns {Promise<Array<Object>>}
 */
export async function getCheckinsForLastDays(days) {
  try {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - days + 1);
    const startStr = start.toISOString().slice(0, 10);
    const endStr = today.toISOString().slice(0, 10);
    return await db.checkins
      .where('date')
      .between(startStr, endStr, true, true)
      .toArray();
  } catch (err) {
    throw new Error(`Ошибка при получении чек-инов за ${days} дней: ${err.message}`, { cause: err });
  }
}

/* =================================================================
 * НАСТРОЙКИ (SETTINGS) — key-value хранилище
 * ================================================================= */

/**
 * Сохраняет одну настройку.
 * @param {string} key — например 'startDate', 'trainDays'
 * @param {*} value — строка, число или JSON-сериализуемое значение
 * @returns {Promise<void>}
 */
export async function saveSetting(key, value) {
  try {
    const serialized = typeof value === 'object' ? JSON.stringify(value) : String(value);
    await db.settings.put({ key, value: serialized });
  } catch (err) {
    throw new Error(`Ошибка при сохранении настройки ${key}: ${err.message}`, { cause: err });
  }
}

/**
 * Возвращает значение настройки.
 * @param {string} key
 * @returns {Promise<*>} десериализованное значение или null
 */
export async function getSetting(key) {
  try {
    const record = await db.settings.get(key);
    if (!record) return null;
    // Пытаемся распарсить как JSON, иначе возвращаем строку
    try { return JSON.parse(record.value); } catch { return record.value; }
  } catch (err) {
    throw new Error(`Ошибка при получении настройки ${key}: ${err.message}`, { cause: err });
  }
}

/**
 * Сохраняет группу настроек приложения.
 * @param {{ startDate?: string, trainDays?: number[] }} settings
 * @returns {Promise<void>}
 */
export async function saveSettings(settings) {
  const ops = [];
  if (settings.startDate !== undefined) {
    ops.push(saveSetting('startDate', settings.startDate));
  }
  if (settings.trainDays !== undefined) {
    ops.push(saveSetting('trainDays', settings.trainDays));
  }
  await Promise.all(ops);
}

/**
 * Загружает все настройки приложения.
 * @returns {Promise<{ startDate: string|null, trainDays: number[]|null }>}
 */
export async function getSettings() {
  const [startDate, trainDays] = await Promise.all([
    getSetting('startDate'),
    getSetting('trainDays'),
  ]);
  return { startDate, trainDays };
}

/* =================================================================
 * РУЧНОЙ СТАТУС ГОТОВНОСТИ (per-date)
 * ================================================================= */

/**
 * Сохраняет ручной override статуса готовности для даты.
 * @param {string} date — YYYY-MM-DD
 * @param {'green'|'yellow'|'red'|'unknown'} status
 * @returns {Promise<void>}
 */
export async function saveManualStatus(date, status) {
  await saveSetting(`status_${date}`, status);
}

/**
 * Возвращает ручной статус готовности для даты.
 * @param {string} date — YYYY-MM-DD
 * @returns {Promise<'green'|'yellow'|'red'|'unknown'|null>}
 */
export async function getManualStatus(date) {
  return await getSetting(`status_${date}`);
}

/**
 * Удаляет ручной статус для даты (сбрасывает на 'unknown').
 * @param {string} date
 * @returns {Promise<void>}
 */
export async function removeManualStatus(date) {
  try {
    await db.settings.delete(`status_${date}`);
  } catch (err) {
    throw new Error(`Ошибка при удалении статуса для ${date}: ${err.message}`, { cause: err });
  }
}

/* =================================================================
 * ДОСТИЖЕНИЯ
 * ================================================================= */

/**
 * Сохраняет новое достижение.
 * @param {string} achievementKey
 * @returns {Promise<number>} id созданной записи.
 */
export async function saveAchievement(achievementKey) {
  try {
    if (achievementKey === undefined) {
      throw new Error('Для достижения обязательно поле achievementKey');
    }
    return await db.achievements.add({ achievementKey, earnedAt: Date.now() });
  } catch (err) {
    throw new Error(`Ошибка при сохранении достижения: ${err.message}`, { cause: err });
  }
}

/**
 * Возвращает все достижения.
 * @returns {Promise<Array<Object>>}
 */
export async function getAchievements() {
  try {
    return await db.achievements.toArray();
  } catch (err) {
    throw new Error(`Ошибка при получении достижений: ${err.message}`, { cause: err });
  }
}

/**
 * Проверяет, получено ли достижение с указанным ключом.
 * @param {string} key — achievementKey
 * @returns {Promise<boolean>}
 */
export async function hasAchievement(key) {
  try {
    const count = await db.achievements.where('achievementKey').equals(key).count();
    return count > 0;
  } catch (err) {
    throw new Error(`Ошибка при проверке достижения ${key}: ${err.message}`, { cause: err });
  }
}

/* =================================================================
 * ЭКСПОРТ / ИМПОРТ / СБРОС
 * ================================================================= */

/**
 * Экспортирует все данные приложения в JSON (формат Dexie).
 * Включает версию для обратной совместимости.
 * @returns {Promise<Object>}
 */
export async function exportAllData() {
  const [sessions, checkins, achievements, settings] = await Promise.all([
    db.sessions.toArray(),
    db.checkins.toArray(),
    db.achievements.toArray(),
    db.settings.toArray(),
  ]);
  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    sessions,
    checkins,
    achievements,
    settings,
  };
}

/**
 * Импортирует данные из JSON.
 * Поддерживает как новый Dexie-формат (version 2), так и старый MVP-формат
 * localStorage (объекты checkins/sessions, план, current).
 * @param {Object} data — импортируемые данные
 * @returns {Promise<void>}
 */
export async function importAllData(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Некорректный формат файла');
  }

  // ── Нормализуем сессии ──
  let sessions = [];
  if (Array.isArray(data.sessions)) {
    sessions = data.sessions;
  } else if (data.sessions && typeof data.sessions === 'object') {
    // MVP-формат: объект { "2025-01-06_A": {...} }
    sessions = Object.entries(data.sessions).map(([key, s]) => ({
      key,
      ...s,
    }));
  }

  // ── Нормализуем чек-ины ──
  let checkins = [];
  if (Array.isArray(data.checkins)) {
    checkins = data.checkins;
  } else if (data.checkins && typeof data.checkins === 'object') {
    // MVP-формат: объект { "2025-01-06": {...} }
    checkins = Object.entries(data.checkins).map(([date, c]) => ({
      date,
      ...c,
    }));
  }

  // ── Настройки из MVP-формата (data.plan) ──
  const settingsMap = {};
  if (data.settings && Array.isArray(data.settings)) {
    data.settings.forEach(s => { settingsMap[s.key] = s; });
  }
  if (data.plan) {
    if (data.plan.startDate) {
      settingsMap.startDate = { key: 'startDate', value: data.plan.startDate };
    }
    if (data.plan.trainDays) {
      settingsMap.trainDays = { key: 'trainDays', value: JSON.stringify(data.plan.trainDays) };
    }
  }

  // ── Транзакция: очистка + запись ──
  await db.transaction(
    'rw',
    db.sessions,
    db.checkins,
    db.achievements,
    db.settings,
    async () => {
      // Очищаем всё
      await Promise.all([
        db.sessions.clear(),
        db.checkins.clear(),
        db.achievements.clear(),
        db.settings.clear(),
      ]);

      // Записываем
      const writeOps = [];
      if (sessions.length) writeOps.push(db.sessions.bulkPut(sessions));
      if (checkins.length) writeOps.push(db.checkins.bulkPut(checkins));
      if (Array.isArray(data.achievements) && data.achievements.length) {
        // achievements используют ++id — strips ids для избежания конфликтов
        const cleanAchievements = data.achievements.map(a => ({
          achievementKey: a.achievementKey ?? a.key,
          earnedAt: a.earnedAt ?? Date.now(),
        }));
        writeOps.push(db.achievements.bulkAdd(cleanAchievements));
      }

      const settingsArr = Object.values(settingsMap);
      if (settingsArr.length) {
        writeOps.push(db.settings.bulkPut(settingsArr));
      }

      await Promise.all(writeOps);
    }
  );
}

/**
 * Полностью очищает все данные из IndexedDB.
 * @returns {Promise<void>}
 */
export async function clearAllData() {
  await db.transaction(
    'rw',
    db.sessions,
    db.checkins,
    db.achievements,
    db.settings,
    async () => {
      await Promise.all([
        db.sessions.clear(),
        db.checkins.clear(),
        db.achievements.clear(),
        db.settings.clear(),
      ]);
    }
  );
}

/* =================================================================
 * НИЗКОУРОВНЕВЫЙ ДОСТУП (для экстренных случаев / миграций)
 * ================================================================= */
export { db };
