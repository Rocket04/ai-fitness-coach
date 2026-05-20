// js/core/storage.js
// Слой данных над Dexie (IndexedDB) — CRUD для сессий, чек-инов, настроек и достижений.

import Dexie from 'dexie';
import type { Session, Checkin, TestResults, Settings, ManualStatus } from './types.js';

/**
 * Dexie‑экземпляр для работы с IndexedDB.
 * @type {Dexie}
 */
const db = new Dexie('FitnessAppDB') as Dexie & {
  sessions: Dexie.Table<Session, string>;
  checkins: Dexie.Table<Checkin, string>;
  settings: Dexie.Table<{ key: string; value: string }, string>;
  achievements: Dexie.Table<{ id?: number; achievementKey: string; earnedAt: number }, number>;
};

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
    throw new Error(`Не удалось открыть базу данных: ${(err as Error).message}`);
  }
}

/* =================================================================
 * СЕССИИ
 * ================================================================= */

/**
 * Сохраняет или обновляет запись тренировки.
 */
export async function saveSession(session: Session): Promise<string> {
  try {
    if (session.key === undefined || session.key === null) {
      throw new Error('Для сессии обязательно поле key');
    }
    await db.sessions.put({ ...session });
    return session.key;
  } catch (err) {
    throw new Error(`Ошибка при сохранении сессии: ${(err as Error).message}`);
  }
}

/**
 * Удаляет сессию по ключу.
 * @param {string} key — "YYYY-MM-DD_type"
 * @returns {Promise<void>}
 */
export async function deleteSession(key: string): Promise<void> {
  try {
    await db.sessions.delete(key);
  } catch (err) {
    throw new Error(`Ошибка при удалении сессии ${key}: ${(err as Error).message}`);
  }
}

/**
 * Возвращает одну сессию по ключу.
 */
/**
 * Возвращает все сессии.
 * @returns {Promise<Array<Object>>}
 */
export async function getAllSessions() {
  try {
    return await db.sessions.toArray();
  } catch (err) {
    throw new Error(`Ошибка при получении всех сессий: ${(err as Error).message}`);
  }
}

/**
 * Возвращает testResults из самой свежей сессии, где они присутствуют.
 */
export async function getLatestTestResults(): Promise<TestResults | null> {
  try {
    const sessions = await db.sessions
      .filter(s => s.testResults != null)
      .toArray();
    if (!sessions.length) return null;
    sessions.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    return sessions[0].testResults ?? null;
  } catch (err) {
    throw new Error(`Ошибка при получении последних результатов теста: ${(err as Error).message}`);
  }
}

/* =================================================================
 * ЧЕК-ИНЫ
 * ================================================================= */

/**
 * Сохраняет или обновляет ежедневный чек-ин. Поле `date` — первичный ключ.
 */
export async function saveCheckin(checkin: Checkin): Promise<string> {
  try {
    if (checkin.date === undefined || checkin.date === null) {
      throw new Error('Для чек-ина обязательно поле date');
    }
    await db.checkins.put({ ...checkin });
    return checkin.date;
  } catch (err) {
    throw new Error(`Ошибка при сохранении чек-ина: ${(err as Error).message}`);
  }
}

/**
 * Возвращает чек-ин за конкретную дату.
 * @param {string} date — YYYY-MM-DD
 * @returns {Promise<Object|null>}
 */
export async function getCheckin(date: string): Promise<Checkin | null> {
  try {
    return (await db.checkins.get(date)) ?? null;
  } catch (err) {
    throw new Error(`Ошибка при получении чек-ина за ${date}: ${(err as Error).message}`);
  }
}

/**
 * Возвращает все чек-ины.
 */
export async function getAllCheckins(): Promise<Checkin[]> {
  try {
    return await db.checkins.toArray();
  } catch (err) {
    throw new Error(`Ошибка при получении всех чек-инов: ${(err as Error).message}`);
  }
}

/**
 * Возвращает чек-ины за последние `days` дней (включая сегодня).
 */
export async function getCheckinsForLastDays(days: number): Promise<Checkin[]> {
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
    throw new Error(`Ошибка при получении чек-инов за ${days} дней: ${(err as Error).message}`);
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
export async function saveSetting(key: string, value: unknown): Promise<void> {
  try {
    const serialized = JSON.stringify(value);
    await db.settings.put({ key, value: serialized });
  } catch (err) {
    throw new Error(`Ошибка при сохранении настройки ${key}: ${(err as Error).message}`);
  }
}

/**
 * Возвращает значение настройки.
 * @param {string} key
 * @returns {Promise<*>} десериализованное значение или null
 */
export async function getSetting(key: string): Promise<unknown> {
  try {
    const record = await db.settings.get(key);
    if (!record) return null;
    // Пытаемся распарсить как JSON, иначе возвращаем строку
    try { return JSON.parse(record.value); } catch { return record.value; }
  } catch (err) {
    throw new Error(`Ошибка при получении настройки ${key}: ${(err as Error).message}`);
  }
}

/**
 * Сохраняет группу настроек приложения.
 */
export async function saveSettings(settings: Partial<Settings>): Promise<void> {
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
 */
export async function saveManualStatus(date: string, status: ManualStatus): Promise<void> {
  await saveSetting(`status_${date}`, status);
}

/**
 * Возвращает ручной статус готовности для даты.
 * @param {string} date — YYYY-MM-DD
 * @returns {Promise<'green'|'yellow'|'red'|'unknown'|null>}
 */
export async function getManualStatus(date: string): Promise<ManualStatus | null> {
  return (await getSetting(`status_${date}`)) as ManualStatus | null;
}

/* =================================================================
 * ЭКСПОРТ / ИМПОРТ / СБРОС
 * ================================================================= */

/**
 * Экспортирует все данные приложения в JSON (формат Dexie).
 * Включает версию для обратной совместимости.
 */
export async function exportAllData(): Promise<any> {
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
export async function importAllData(data: any): Promise<void> {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Некорректный формат файла: ожидался объект');
  }

  // ── Валидация sessions ──
  if (data.sessions !== undefined && !Array.isArray(data.sessions)) {
    throw new Error('Некорректный формат файла: sessions должен быть массивом');
  }

  // ── Валидация checkins ──
  if (data.checkins !== undefined && !Array.isArray(data.checkins)) {
    throw new Error('Некорректный формат файла: checkins должен быть массивом');
  }

  // ── Валидация settings ──
  if (data.settings !== undefined) {
    if (!data.settings || typeof data.settings !== 'object' || Array.isArray(data.settings)) {
      throw new Error('Некорректный формат файла: settings должен быть объектом');
    }
    if (typeof data.settings.startDate !== 'string') {
      throw new Error('Некорректный формат файла: settings.startDate должен быть строкой');
    }
    if (!Array.isArray(data.settings.trainDays) || !data.settings.trainDays.every((d: unknown) => typeof d === 'number')) {
      throw new Error('Некорректный формат файла: settings.trainDays должен быть массивом чисел');
    }
  }

  const sessions = data.sessions ?? [];
  const checkins = data.checkins ?? [];

  // ── Настройки из data.settings ──
  const settingsMap: Record<string, { key: string; value: string }> = {};
  if (data.settings) {
    settingsMap.startDate = { key: 'startDate', value: data.settings.startDate };
    settingsMap.trainDays = { key: 'trainDays', value: JSON.stringify(data.settings.trainDays) };
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
        const cleanAchievements = data.achievements.map((a: any) => ({
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
 */
export async function clearAllData(): Promise<void> {
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
