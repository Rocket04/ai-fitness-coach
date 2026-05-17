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
    if (key !== undefined && key !== null) {
      await db.sessions.update(key, data);
      return key;
    }
    return await db.sessions.add(data);
  } catch (err) {
    throw new Error(`Ошибка при сохранении сессии: ${err.message}`, { cause: err });
  }
}

/**
 * Возвращает все сессии за указанный месяц.
 * @param {number} year  – год (например, 2026).
 * @param {number} month – месяц (0‑based, 0 = январь).
 * @returns {Promise<Array<Object>>}
 */
export async function getSessionsByMonth(year, month) {
  try {
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
      .filter((s) => s.testResults !== undefined && s.testResults !== null)
      .sortBy('date')
      .reverse()
      .limit(1)
      .toArray();
    return sessions.length > 0 ? sessions[0].testResults ?? null : null;
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
 * @param {Object} achievement
 * @param {string} achievement.achievementKey – уникальный ключ достижения.
 * @param {number} achievement.earnedAt       – timestamp момента получения.
 * @returns {Promise<number>} id созданного достижения.
 */
export async function saveAchievement(achievement) {
  try {
    const { achievementKey, earnedAt } = achievement;
    if (achievementKey === undefined || earnedAt === undefined) {
      throw new Error('Для достижения обязательны поля achievementKey и earnedAt');
    }
    return await db.achievements.add({ achievementKey, earnedAt });
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

/* Экспортируем также сам объект db для возможного прямого доступа */
export { db, init };
