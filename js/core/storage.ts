// js/core/storage.js
// Слой данных над Dexie (IndexedDB) — CRUD для сессий, чек-инов, настроек и достижений.

import Dexie from 'dexie';
import type { Session, Checkin, TestResults, Settings, ManualStatus } from './types.js';
import { validateImportData, detectImportFormat } from './importSchemas.js';

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
    await _db().open();
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
    await _db().sessions.put({ ...session });
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
    await _db().sessions.delete(key);
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
    return await _db().sessions.toArray();
  } catch (err) {
    throw new Error(`Ошибка при получении всех сессий: ${(err as Error).message}`);
  }
}

/**
 * Возвращает testResults из самой свежей сессии, где они присутствуют.
 */
export async function getLatestTestResults(): Promise<TestResults | null> {
  try {
    const sessions = await _db().sessions
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
    await _db().checkins.put({ ...checkin });
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
    return (await _db().checkins.get(date)) ?? null;
  } catch (err) {
    throw new Error(`Ошибка при получении чек-ина за ${date}: ${(err as Error).message}`);
  }
}

/**
 * Возвращает все чек-ины.
 */
export async function getAllCheckins(): Promise<Checkin[]> {
  try {
    return await _db().checkins.toArray();
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
    return await _db().checkins
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
    await _db().settings.put({ key, value: serialized });
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
    const record = await _db().settings.get(key);
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
export async function saveSettings(settings: Partial<Settings> & { checkinTier?: string; selectedGadgets?: string[]; selectedSports?: string[]; rehabIssues?: string[]; rehabExercises?: string[]; level?: string; goals?: string[]; equipment?: string }): Promise<void> {
  const ops = [];
  if (settings.startDate !== undefined) {
    ops.push(saveSetting('startDate', settings.startDate));
  }
  if (settings.trainDays !== undefined) {
    ops.push(saveSetting('trainDays', settings.trainDays));
  }
  if (settings.checkinTier !== undefined) {
    ops.push(saveSetting('checkinTier', settings.checkinTier));
  }
  if (settings.selectedGadgets !== undefined) {
    ops.push(saveSetting('selectedGadgets', settings.selectedGadgets));
  }
  if (settings.selectedSports !== undefined) {
    ops.push(saveSetting('selectedSports', settings.selectedSports));
  }
  if (settings.rehabIssues !== undefined) {
    ops.push(saveSetting('rehabIssues', settings.rehabIssues));
  }
  if (settings.rehabExercises !== undefined) {
    ops.push(saveSetting('rehabExercises', settings.rehabExercises));
  }
  if (settings.level !== undefined) {
    ops.push(saveSetting('level', settings.level));
  }
  if (settings.goals !== undefined) {
    ops.push(saveSetting('goals', settings.goals));
  }
  if (settings.equipment !== undefined) {
    ops.push(saveSetting('equipment', settings.equipment));
  }
  await Promise.all(ops);
}

/**
 * Загружает все настройки приложения.
 * @returns {Promise<{ startDate: string|null, trainDays: number[]|null, checkinTier: string|null, selectedGadgets: string[]|null, selectedSports: string[]|null }>}
 */
export async function getSettings() {
  const [startDate, trainDays, checkinTier, selectedGadgets, selectedSports, rehabIssues, rehabExercises, level, goals, equipment] = await Promise.all([
    getSetting('startDate'),
    getSetting('trainDays'),
    getSetting('checkinTier'),
    getSetting('selectedGadgets'),
    getSetting('selectedSports'),
    getSetting('rehabIssues'),
    getSetting('rehabExercises'),
    getSetting('level'),
    getSetting('goals'),
    getSetting('equipment'),
  ]);
  return { startDate, trainDays, checkinTier, selectedGadgets, selectedSports, rehabIssues, rehabExercises, level, goals, equipment };
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
    _db().sessions.toArray(),
    _db().checkins.toArray(),
    _db().achievements.toArray(),
    _db().settings.toArray(),
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

  // ── Zod валидация ──
  const validationResult = validateImportData(data);
  if (!validationResult.success) {
    // Log all errors to console
    console.error('Import validation errors:', validationResult.errors);
    
    // Throw error with first error + count for UI
    const firstError = validationResult.errors[0];
    const errorCount = validationResult.errors.length;
    const message = errorCount > 1
      ? `${firstError} (и ещё ${errorCount - 1} ошибок)`
      : firstError;
    throw new Error(message);
  }

  // Use validated data
  const validatedData = validationResult.data as any;
  const format = detectImportFormat(data);

  // Handle legacy format (minimal validation, basic structure only)
  if (format === 'legacy') {
    console.warn('Importing legacy format - minimal validation applied');
    // Legacy format handling would go here if needed
    // For now, we'll treat it as passthrough since the schema is very permissive
  }

  const sessions = validatedData.sessions ?? [];
  const checkins = validatedData.checkins ?? [];

  // ── Настройки из data.settings (Dexie v2 format) ──
  const settingsMap: Record<string, { key: string; value: string }> = {};
  
  if (format === 'dexie-v2' && Array.isArray(validatedData.settings)) {
    // Dexie v2: settings is an array of {key, value} objects
    validatedData.settings.forEach((s: { key: string; value: string }) => {
      settingsMap[s.key] = { key: s.key, value: s.value };
    });
  } else if (validatedData.settings && typeof validatedData.settings === 'object' && !Array.isArray(validatedData.settings)) {
    // Legacy format: settings is a plain object
    settingsMap.startDate = { key: 'startDate', value: validatedData.settings.startDate };
    settingsMap.trainDays = { key: 'trainDays', value: JSON.stringify(validatedData.settings.trainDays) };
  }

  // ── Транзакция: очистка + запись ──
  await _db().transaction(
    'rw',
    _db().sessions,
    _db().checkins,
    _db().achievements,
    _db().settings,
    async () => {
      // Очищаем всё
      await Promise.all([
        _db().sessions.clear(),
        _db().checkins.clear(),
        _db().achievements.clear(),
        _db().settings.clear(),
      ]);

      // Записываем
      const writeOps = [];
      if (sessions.length) writeOps.push(_db().sessions.bulkPut(sessions));
      if (checkins.length) writeOps.push(_db().checkins.bulkPut(checkins));
      if (Array.isArray(validatedData.achievements) && validatedData.achievements.length) {
        // achievements используют ++id — strips ids для избежания конфликтов
        const cleanAchievements = validatedData.achievements.map((a: any) => ({
          achievementKey: a.achievementKey ?? a.key,
          earnedAt: a.earnedAt ?? Date.now(),
        }));
        writeOps.push(_db().achievements.bulkAdd(cleanAchievements));
      }

      const settingsArr = Object.values(settingsMap);
      if (settingsArr.length) {
        writeOps.push(_db().settings.bulkPut(settingsArr));
      }

      await Promise.all(writeOps);
    }
  );
}

/**
 * Полностью очищает все данные из IndexedDB.
 */
export async function clearAllData(): Promise<void> {
  await _db().transaction(
    'rw',
    _db().sessions,
    _db().checkins,
    _db().achievements,
    _db().settings,
    async () => {
      await Promise.all([
        _db().sessions.clear(),
        _db().checkins.clear(),
        _db().achievements.clear(),
        _db().settings.clear(),
      ]);
    }
  );
}

/* =================================================================
 * НИЗКОУРОВНЕВЫЙ ДОСТУП (для экстренных случаев / миграций)
 * ================================================================= */
/* =================================================================
 * DEMO MODE — separate IndexedDB instance
 * ================================================================= */

let _demoMode = false;
let _demoDb: Dexie & {
  sessions: Dexie.Table<Session, string>;
  checkins: Dexie.Table<Checkin, string>;
  settings: Dexie.Table<{ key: string; value: string }, string>;
  achievements: Dexie.Table<{ id?: number; achievementKey: string; earnedAt: number }, number>;
  waitlist: Dexie.Table<{ id?: number; email: string; provider: string; createdAt: number }, number>;
} | null = null;

function getActiveDb() {
  if (_demoMode && _demoDb) return _demoDb;
  return db;
}

/** Check if demo mode is currently active. */
export function isDemoMode(): boolean {
  return _demoMode;
}

/** Get the active database instance (real or demo). */
export function getActiveDatabase() {
  return _demoMode && _demoDb ? _demoDb : db;
}

/**
 * Activate demo mode: create a separate IndexedDB, populate with synthetic data,
 * and switch all subsequent operations to use it.
 */
export async function activateDemoData(demoData: { sessions: Session[]; checkins: Checkin[]; settings: Partial<Settings> }) {
  // Create separate demo database
  _demoDb = new Dexie('SmartFitnessCoachDemo') as any;
  _demoDb!.version(2).stores({
    sessions: 'key, date, type',
    checkins: 'date',
    settings: 'key',
    achievements: '++id, achievementKey, earnedAt',
  });
  await _demoDb!.open();

  // Populate with demo data
  await _demoDb!.transaction('rw', _demoDb!.sessions, _demoDb!.checkins, _demoDb!.settings, async () => {
    if (demoData.sessions.length) await _demoDb!.sessions.bulkPut(demoData.sessions);
    if (demoData.checkins.length) await _demoDb!.checkins.bulkPut(demoData.checkins);
    const settingsArr: Array<{ key: string; value: string }> = [];
    if (demoData.settings.startDate) settingsArr.push({ key: 'startDate', value: JSON.stringify(demoData.settings.startDate) });
    if (demoData.settings.trainDays) settingsArr.push({ key: 'trainDays', value: JSON.stringify(demoData.settings.trainDays) });
    if (settingsArr.length) await _demoDb!.settings.bulkPut(settingsArr);
  });

  _demoMode = true;
  localStorage.setItem('fitness-tracker-demo-mode', '1');
}

/** Deactivate demo mode: clear demo DB, switch back to real DB. */
export async function deactivateDemoData() {
  if (_demoDb) {
    await _demoDb.transaction('rw', _demoDb.sessions, _demoDb.checkins, _demoDb.settings, _demoDb.achievements, async () => {
      await Promise.all([_demoDb!.sessions.clear(), _demoDb!.checkins.clear(), _demoDb!.settings.clear(), _demoDb!.achievements.clear()]);
    });
    _demoDb.close();
    _demoDb = null;
  }
  _demoMode = false;
  localStorage.removeItem('fitness-tracker-demo-mode');
}

/** Check localStorage for persisted demo mode on module load. */
export function loadDemoModeState(): boolean {
  return localStorage.getItem('fitness-tracker-demo-mode') === '1';
}

// ── Waitlist ──
export async function saveWaitlistEntry(email: string, provider: string) {
  try { await (getActiveDb() as any).waitlist?.put({ email, provider, createdAt: Date.now() }); } catch(e) { console.warn('Waitlist not available:', e); }
}
export async function getWaitlistEntries() {
  try { return await (getActiveDb() as any).waitlist?.toArray() ?? []; } catch(e) { return []; }
}

// Internal: get active DB (demo or real)
function _db() { return getActiveDb(); }
export { db };
