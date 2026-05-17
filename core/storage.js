// core/storage.js
import Dexie from 'dexie'; // Предполагается, что Dexie v4.x подключён через CDN и доступен как глобальный модуль

/**
 * Класс-обёртка над Dexie для работы с сессиями.
 * Все методы асинхронны и возвращают Promise.
 */
const db = new Dexie('SessionDB');

db.version(1).stores({
  sessions: '++id, date, startTime, tags'
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

/**
 * Сохраняет новую сессию или обновляет существующую.
 * Если в объекте присутствует поле `id` – выполняется обновление,
 * иначе создаётся новая запись.
 * @param {Object} session - Объект сессии.
 * @param {string} session.date - Дата в формате YYYY-MM-DD.
 * @param {string} session.startTime - Время начала HH:mm.
 * @param {string} [session.endTime] - Время окончания HH:mm.
 * @param {number} [session.duration] - Продолжительность в минутах.
 * @param {string} [session.notes] - Текстовая заметка.
 * @param {string[]} [session.tags] - Массив тегов.
 * @returns {Promise<number>} ID сохранённой/обновлённой сессии.
 */
export async function saveSession(session) {
  try {
    const { id, ...data } = session;
    if (id !== undefined && id !== null) {
      await db.sessions.update(id, data);
      return id;
    }
    return await db.sessions.add(data);
  } catch (err) {
    throw new Error(`Ошибка при сохранении сессии: ${err.message}`, { cause: err });
  }
}

/**
 * Возвращает все сессии за указанный месяц.
 * @param {number} year - Год (например, 2024).
 * @param {number} month - Месяц (0‑based, т.е. 0 = январь).
 * @returns {Promise<Array<Object>>} Массив сессий.
 */
export async function getSessionsByMonth(year, month) {
  try {
    const start = new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10); // YYYY-MM-DD
    const end = new Date(Date.UTC(year, month + 1, 0)).toISOString().slice(0, 10); // последний день месяца
    return await db.sessions
      .where('date')
      .between(start, end, true, true)
      .toArray();
  } catch (err) {
    throw new Error(`Ошибка при получении сессий за месяц: ${err.message}`, { cause: err });
  }
}

/**
 * Возвращает сессии в указанном диапазоне дат (включительно).
 * @param {Date} from - Начальная дата.
 * @param {Date} to - Конечная дата.
 * @returns {Promise<Array<Object>>} Массив сессий.
 */
export async function getSessionsByDateRange(from, to) {
  try {
    const start = from.toISOString().slice(0, 10);
    const end = to.toISOString().slice(0, 10);
    return await db.sessions
      .where('date')
      .between(start, end, true, true)
      .toArray();
  } catch (err) {
    throw new Error(`Ошибка при получении сессий за диапазон: ${err.message}`, { cause: err });
  }
}

/**
 * Получает сессию по её ID.
 * @param {number} id - ID сессии.
 * @returns {Promise<Object|null>} Объект сессии или null, если не найдено.
 */
export async function getSessionById(id) {
  try {
    return await db.sessions.get(id) ?? null;
  } catch (err) {
    throw new Error(`Ошибка при получении сессии по ID ${id}: ${err.message}`, { cause: err });
  }
}

/**
 * Удаляет сессию по ID.
 * @param {number} id - ID сессии.
 * @returns {Promise<void>}
 */
export async function deleteSession(id) {
  try {
    await db.sessions.delete(id);
  } catch (err) {
    throw new Error(`Ошибка при удалении сессии ID ${id}: ${err.message}`, { cause: err });
  }
}

/**
 * Удаляет все сессии из базы.
 * @returns {Promise<void>}
 */
export async function clearAllSessions() {
  try {
    await db.sessions.clear();
  } catch (err) {
    throw new Error(`Ошибка при очистке всех сессий: ${err.message}`, { cause: err });
  }
}

/**
 * Возвращает все сессии (в основном для отладки/тестов).
 * @returns {Promise<Array<Object>>}
 */
export async function getAllSessions() {
  try {
    return await db.sessions.toArray();
  } catch (err) {
    throw new Error(`Ошибка при получении всех сессий: ${err.message}`, { cause: err });
  }
}
