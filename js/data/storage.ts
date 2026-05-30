// js/data/storage.ts
// Слой данных над Dexie (IndexedDB) — CRUD для сессий, чек-инов, настроек и достижений.

import Dexie from 'dexie';
import type { Session, Checkin, TestResults, Settings, ManualStatus } from '../shared/types.js';
import { validateImportData, detectImportFormat } from '../core/importSchemas.js';

interface ImportedAchievement {
  achievementKey?: string;
  key?: string;
  earnedAt?: number;
  [key: string]: unknown;
}

interface ImportedData {
  sessions?: Session[];
  checkins?: Checkin[];
  achievements?: ImportedAchievement[];
  settings?: { key: string; value: string }[] | Record<string, unknown>;
  [key: string]: unknown;
}

export interface BackupRecord {
  id?: number;
  createdAt: number;
  label: string;
  data: string;
}

const db = new Dexie('FitnessAppDB') as Dexie & {
  sessions: Dexie.Table<Session, string>;
  checkins: Dexie.Table<Checkin, string>;
  settings: Dexie.Table<{ key: string; value: string }, string>;
  achievements: Dexie.Table<{ id?: number; achievementKey: string; earnedAt: number }, number>;
  backups: Dexie.Table<BackupRecord, number>;
};

db.version(2).stores({
  sessions: 'key, date, type',
  checkins: 'date',
  settings: 'key',
  achievements: '++id, achievementKey, earnedAt',
});

db.version(3).stores({
  sessions: 'key, date, type',
  checkins: 'date',
  settings: 'key',
  achievements: '++id, achievementKey, earnedAt',
  backups: '++id, createdAt',
});

export async function init() {
  try {
    await _db().open();
  } catch (err) {
    throw new Error(`Не удалось открыть базу данных: ${(err as Error).message}`);
  }
}

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

export async function deleteSession(key: string): Promise<void> {
  try {
    await _db().sessions.delete(key);
  } catch (err) {
    throw new Error(`Ошибка при удалении сессии ${key}: ${(err as Error).message}`);
  }
}

export async function getAllSessions() {
  try {
    return await _db().sessions.toArray();
  } catch (err) {
    throw new Error(`Ошибка при получении всех сессий: ${(err as Error).message}`);
  }
}

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

export async function getCheckin(date: string): Promise<Checkin | null> {
  try {
    return (await _db().checkins.get(date)) ?? null;
  } catch (err) {
    throw new Error(`Ошибка при получении чек-ина за ${date}: ${(err as Error).message}`);
  }
}

export async function getAllCheckins(): Promise<Checkin[]> {
  try {
    return await _db().checkins.toArray();
  } catch (err) {
    throw new Error(`Ошибка при получении всех чек-инов: ${(err as Error).message}`);
  }
}

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

export async function saveSetting(key: string, value: unknown): Promise<void> {
  try {
    const serialized = JSON.stringify(value);
    await _db().settings.put({ key, value: serialized });
  } catch (err) {
    throw new Error(`Ошибка при сохранении настройки ${key}: ${(err as Error).message}`);
  }
}

export async function getSetting(key: string): Promise<unknown> {
  try {
    const record = await _db().settings.get(key);
    if (!record) return null;
    try { return JSON.parse(record.value); } catch { return record.value; }
  } catch (err) {
    throw new Error(`Ошибка при получении настройки ${key}: ${(err as Error).message}`);
  }
}

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

export async function saveManualStatus(date: string, status: ManualStatus): Promise<void> {
  await saveSetting(`status_${date}`, status);
}

export async function getManualStatus(date: string): Promise<ManualStatus | null> {
  return (await getSetting(`status_${date}`)) as ManualStatus | null;
}

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

export async function importAllData(data: unknown): Promise<void> {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Некорректный формат файла: ожидался объект');
  }

  const validationResult = validateImportData(data);
  if (!validationResult.success) {
    console.error('Import validation errors:', validationResult.errors);
    
    const firstError = validationResult.errors[0];
    const errorCount = validationResult.errors.length;
    const message = errorCount > 1
      ? `${firstError} (и ещё ${errorCount - 1} ошибок)`
      : firstError;
    throw new Error(message);
  }

  const validatedData = validationResult.data as ImportedData;
  const format = detectImportFormat(data);

  if (format === 'legacy') {
    console.warn('Importing legacy format - minimal validation applied');
  }

  const sessions = validatedData.sessions ?? [];
  const checkins = validatedData.checkins ?? [];

  const settingsMap: Record<string, { key: string; value: string }> = {};
  
  if (format === 'dexie-v2' && Array.isArray(validatedData.settings)) {
    validatedData.settings.forEach((s: { key: string; value: string }) => {
      settingsMap[s.key] = { key: s.key, value: s.value };
    });
  } else if (validatedData.settings && typeof validatedData.settings === 'object' && !Array.isArray(validatedData.settings)) {
    const legacySettings = validatedData.settings as Record<string, unknown>;
    settingsMap.startDate = { key: 'startDate', value: String(legacySettings.startDate ?? '') };
    settingsMap.trainDays = { key: 'trainDays', value: JSON.stringify(legacySettings.trainDays ?? []) };
  }

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

      const writeOps = [];
      if (sessions.length) writeOps.push(_db().sessions.bulkPut(sessions));
      if (checkins.length) writeOps.push(_db().checkins.bulkPut(checkins));
      if (Array.isArray(validatedData.achievements) && validatedData.achievements.length) {
  const cleanAchievements = (validatedData.achievements ?? []).map((a: ImportedAchievement) => ({
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

export async function clearAllData(): Promise<void> {
  const backupLabel = `auto-backup-${new Date().toISOString().slice(0, 19).replace('T', '-')}`;
  try {
    const snapshot = await exportAllData();
    await db.backups.put({
      createdAt: Date.now(),
      label: backupLabel,
      data: JSON.stringify(snapshot),
    });
  } catch (backupErr) {
    console.warn('Failed to create auto-backup before clear:', backupErr);
  }

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

  await trimBackups();
}

const BACKUP_RETENTION = 10;

export async function getBackups(): Promise<BackupRecord[]> {
  try {
    return await db.backups
      .orderBy('createdAt')
      .reverse()
      .toArray();
  } catch (err) {
    console.warn('Failed to list backups:', err);
    return [];
  }
}

export async function removeBackup(id: number): Promise<void> {
  try {
    await db.backups.delete(id);
  } catch (err) {
    console.warn('Failed to remove backup:', err);
  }
}

export async function trimBackups(): Promise<void> {
  try {
    const all = await db.backups.orderBy('createdAt').toArray();
    if (all.length > BACKUP_RETENTION) {
      const toRemove = all.slice(0, all.length - BACKUP_RETENTION);
      await db.backups.bulkDelete(toRemove.map(r => r.id!));
    }
  } catch (err) {
    console.warn('Failed to trim backups:', err);
  }
}

export async function restoreFromBackup(backupId: number): Promise<void> {
  const record = await db.backups.get(backupId);
  if (!record) throw new Error('Резервная копия не найдена');

  let data: unknown;
  try {
    data = JSON.parse(record.data);
  } catch {
    throw new Error('Повреждённые данные в резервной копии');
  }

  await importAllData(data);
  await removeBackup(backupId);
}

let _demoMode = false;
let _demoDb: Dexie & {
  sessions: Dexie.Table<Session, string>;
  checkins: Dexie.Table<Checkin, string>;
  settings: Dexie.Table<{ key: string; value: string }, string>;
  achievements: Dexie.Table<{ id?: number; achievementKey: string; earnedAt: number }, number>;
  waitlist: Dexie.Table<{ id?: number; email: string; provider: string; createdAt: number }, number>;
  backups: Dexie.Table<BackupRecord, number>;
} | null = null;

function getActiveDb(): typeof db {
  if (_demoMode && _demoDb) return _demoDb as unknown as typeof db;
  return db;
}

export function isDemoMode(): boolean {
  return _demoMode;
}

export function getActiveDatabase() {
  return _demoMode && _demoDb ? _demoDb : db;
}

export async function activateDemoData(demoData: { sessions: Session[]; checkins: Checkin[]; settings: Partial<Settings> }) {
  _demoDb = new Dexie('SmartFitnessCoachDemo') as any;
  _demoDb!.version(3).stores({
    sessions: 'key, date, type',
    checkins: 'date',
    settings: 'key',
    achievements: '++id, achievementKey, earnedAt',
    backups: '++id, createdAt',
  });
  await _demoDb!.open();

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

export function loadDemoModeState(): boolean {
  return localStorage.getItem('fitness-tracker-demo-mode') === '1';
}

export async function saveWaitlistEntry(email: string, provider: string) {
  try { await (getActiveDb() as any).waitlist?.put({ email, provider, createdAt: Date.now() }); } catch(e) { console.warn('Waitlist not available:', e); }
}
export async function getWaitlistEntries() {
  try { return await (getActiveDb() as any).waitlist?.toArray() ?? []; } catch(e) { return []; }
}

function _db() { return getActiveDb(); }
export { db };
