// core/storage.js
import Dexie from 'dexie';

/**
 * Dexie‑экземпляр для работы с IndexedDB.
 * @type {Dexie}
 */
const db = new Dexie('FitnessAppDB');

/**
 * Схема базы данных.
 * - sessions: key – строковый первичный ключ вида "YYYY-MM-DD_A".
 * - checkins: date – строковый первичный ключ (ISO‑дата).
 * - achievements: id – автоинкрементный числовой PK.
 */
db.version(1).stores({
  sessions: 'key, date, type, completed, readiness, rpe, hipPain, shoulderPain, notes, testResults, mode, updatedAt',
  checkins: 'date',
  achievements: '++id, achievementKey, earnedAt'
});

/**
 * Инициализирует подключение к IndexedDB.
 * @returns {Promise<void>}
 */
export async function init() {
  try {
    await db.open();
  } catch (err) {
    throw new Error(`Не удалось открыть базу данных: ${err.message}`, { cause: err });
  }
}

/* ==================== SESSIONS ==================== */

/**
 * Сохраняет или обновляет запись тренировки.
 * Если передано поле `key` – выполняется обновление, иначе создаётся новая запись.
 * @param {Object} session
 * @param {string} session.key          – первичный ключ (строка).
 * @param {string} session.date         – ISO‑дата (YYYY-MM-DD).
 * @param {('A'|'B'|'C'|'rest'|'morning'|'evening')} session.type
 * @param {boolean} session.completed
 * @param {('green'|'yellow'|'red')} session.readiness
 * @param {number} session.rpe
 * @param {number} session.hipPain
 * @param {number} session.shoulderPain
 * @param {string} session.notes
 * @param {Object} [session.testResults] – { pullUps, pushUps, plankSec }
 * @param {('full'|'yellow'|'minimum')} session.mode
 * @param {number} session.updatedAt    – timestamp.
 * @returns {Promise<string>} key сохранённой/обновлённой сессии.
 */
export async function saveSession(session) {
  try {
    const { key, ...data } = session;
    if (key === undefined || key === null) {
      throw new Error('Для сессии обязательно поле key');
    }
    await db.sessions.put({ key, ...data });
    return key;
  } catch (err) {
    throw new Error(`Ошибка при сохранении сессии: ${err.message}`, { cause: err });
  }
}

/**
 * Возвращает все сессии за указанный месяц.
 * @param {string} prefix – строка вида "YYYY-MM".
 * @returns {Promise<Array<Object>>}
 */
export async function getSessionsByMonth(prefix) {
  try {
    const [yearStr, monthStr] = prefix.split('-');
    const year = Number(yearStr);
    const month = Number(monthStr) - 1; // Dexie месяцы 0‑based
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
 * Возвращает последние `limit` сессий, отсортированные по дате (по убыванию).
 * @param {number} limit – количество записей.
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
 * @param {('A'|'B'|'C'|'rest'|'morning'|'evening')} type
 * @returns {Promise<Array<Object>>}
 */
export async function getSessionsByType(type) {
  try {
    return await db.sessions.where('type').equals(type).toArray();
  } catch (err) {
    throw new Error(`Ошибка при получении сессий по типу ${type}: ${err.message}`, { cause: err });
  }
}

/**
 * Возвращает результаты теста из самой последней сессии, где они присутствуют.
 * @returns {Promise<Object|null>} Объект testResults или null.
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

/* ==================== CHECKINS ==================== */

/**
 * Сохраняет или обновляет ежедневный чек‑ин.
 * Поле `date` является первичным ключом.
 * @param {Object} checkin
 * @param {string} checkin.date          – ISO‑дата (YYYY-MM-DD).
 * @param {number} checkin.sleepHours
 * @param {number} checkin.restHR
 * @param {number} checkin.hrv
 * @param {number} checkin.hipPain
 * @param {number} checkin.shoulderPain
 * @param {number} checkin.breathing
 * @param {number} checkin.weight
 * @param {string} checkin.notes
 * @param {number} checkin.qualityOfSleep
 * @param {number} checkin.muscleSoreness
 * @param {number} checkin.motivation
 * @param {number} checkin.ts            – timestamp.
 * @returns {Promise<string>} date сохранённого/обновлённого чек‑ина.
 */
export async function saveCheckin(checkin) {
  try {
    const { date, ...data } = checkin;
    if (date === undefined || date === null) {
      throw new Error('Для чек‑ина обязательно поле date');
    }
    await db.checkins.put({ date, ...data }); // put = insert or update
    return date;
  } catch (err) {
    throw new Error(`Ошибка при сохранении чек‑ина: ${err.message}`, { cause: err });
  }
}

/**
 * Возвращает чек‑ин за конкретную дату.
 * @param {string} date – ISO‑дата (YYYY-MM-DD).
 * @returns {Promise<Object|null>}
 */
export async function getCheckin(date) {
  try {
    return await db.checkins.get(date) ?? null;
  } catch (err) {
    throw new Error(`Ошибка при получении чек‑ина за дату ${date}: ${err.message}`, { cause: err });
  }
}

/**
 * Возвращает чек‑ины за последние `days` дней (включая сегодня).
 * @param {number} days – количество дней.
 * @returns {Promise<Array<Object>>}
 */
export async function getCheckinsForLastDays(days) {
  try {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - days + 1); // включительно
    const startStr = start.toISOString().slice(0, 10);
    const endStr = today.toISOString().slice(0, 10);
    return await db.checkins
      .where('date')
      .between(startStr, endStr, true, true)
      .toArray();
  } catch (err) {
    throw new Error(`Ошибка при получении чек‑инов за последние ${days} дней: ${err.message}`, { cause: err });
  }
}

/* ==================== ACHIEVEMENTS ==================== */

/**
 * Сохраняет новое достижение.
 * @param {string} achievementKey – уникальный ключ достижения.
 * @returns {Promise<number>} id созданного достижения.
 */
export async function saveAchievement(achievementKey) {
  try {
    if (achievementKey === undefined) {
      throw new Error('Для достижения обязательно поле achievementKey');
    }
    return await db.achievements.add({
      achievementKey,
      earnedAt: Date.now()
    });
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
    throw new Error(`Ошибка при получении списка достижений: ${err.message}`, { cause: err });
  }
}

/**
 * Проверяет, получено ли достижение с указанным ключом.
 * @param {string} key – achievementKey.
 * @returns {Promise<boolean>}
 */
export async function hasAchievement(key) {
  try {
    const count = await db.achievements.where('achievementKey').equals(key).count();
    return count > 0;
  } catch (err) {
    throw new Error(`Ошибка при проверке наличия достижения ${key}: ${err.message}`, { cause: err });
  }
}

/**
 * Экспортирует все данные приложения в JSON.
 * @returns {Promise<Object>}
 */
export async function exportAllData() {
  const [sessions, checkins, achievements] = await Promise.all([
    db.sessions.toArray(),
    db.checkins.toArray(),
    db.achievements.toArray(),
  ]);
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    sessions,
    checkins,
    achievements,
  };
}

/**
 * Импортирует данные из JSON-файла.
 * @param {Object} data
 * @returns {Promise<void>}
 */
export async function importAllData(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Некорректный формат файла');
  }
  await db.transaction('rw', db.sessions, db.checkins, db.achievements, async () => {
    await db.sessions.clear();
    await db.checkins.clear();
    await db.achievements.clear();
    if (Array.isArray(data.sessions)) await db.sessions.bulkPut(data.sessions);
    if (Array.isArray(data.checkins)) await db.checkins.bulkPut(data.checkins);
    if (Array.isArray(data.achievements)) await db.achievements.bulkAdd(data.achievements);
  });
}

/**
 * Удаляет все данные из IndexedDB.
 * @returns {Promise<void>}
 */
export async function clearAllData() {
  await db.transaction('rw', db.sessions, db.checkins, db.achievements, async () => {
    await db.sessions.clear();
    await db.checkins.clear();
    await db.achievements.clear();
  });
}

export { db };
