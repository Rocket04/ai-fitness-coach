import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  init,
  saveSession,
  deleteSession,
  getAllSessions,
  getLatestTestResults,
  saveCheckin,
  getCheckin,
  getAllCheckins,
  saveSetting,
  getSetting,
  saveSettings,
  getSettings,
  saveManualStatus,
  getManualStatus,
  exportAllData,
  importAllData,
  clearAllData,
  activateDemoData,
  deactivateDemoData,
  isDemoMode,
  loadDemoModeState,
  getBackups,
} from '../../data/storage.js';
import type { Session, Checkin } from '../../core/types.js';

// ── Mock Dexie at module level ──
const mockSessionsTable: Record<string, any> = {};
const mockCheckinsTable: Record<string, any> = {};
const mockSettingsTable: Record<string, any> = {};
const mockAchievementsTable: any[] = [];
const mockBackupsTable: any[] = [];
let nextAchievementId = 1;
let nextBackupId = 1;

function makeMockSessions() {
  return {
    put: vi.fn(async (item: any) => { mockSessionsTable[item.key] = item; return item.key; }),
    get: vi.fn(async (key: string) => mockSessionsTable[key] ?? null),
    toArray: vi.fn(async () => Object.values(mockSessionsTable)),
    delete: vi.fn(async (key: string) => { delete mockSessionsTable[key]; }),
    clear: vi.fn(async () => { Object.keys(mockSessionsTable).forEach(k => delete mockSessionsTable[k]); }),
    bulkPut: vi.fn(async (items: any[]) => { items.forEach(i => { mockSessionsTable[i.key] = i; }); }),
    where: () => ({ between: () => ({ toArray: async () => [] }) }),
    // filter + toArray for getLatestTestResults
    filter: vi.fn((pred: any) => ({
      toArray: async () => Object.values(mockSessionsTable).filter(pred),
    })),
  };
}

function makeMockCheckins() {
  return {
    put: vi.fn(async (item: any) => { mockCheckinsTable[item.date] = item; return item.date; }),
    get: vi.fn(async (date: string) => mockCheckinsTable[date] ?? null),
    toArray: vi.fn(async () => Object.values(mockCheckinsTable)),
    delete: vi.fn(async (date: string) => { delete mockCheckinsTable[date]; }),
    clear: vi.fn(async () => { Object.keys(mockCheckinsTable).forEach(k => delete mockCheckinsTable[k]); }),
    bulkPut: vi.fn(async (items: any[]) => { items.forEach(i => { mockCheckinsTable[i.date] = i; }); }),
    where: () => ({ between: () => ({ toArray: async () => [] }) }),
  };
}

function makeMockSettings() {
  return {
    put: vi.fn(async (item: any) => { mockSettingsTable[item.key] = item; return item.key; }),
    get: vi.fn(async (key: string) => mockSettingsTable[key] ?? null),
    toArray: vi.fn(async () => Object.values(mockSettingsTable)),
    clear: vi.fn(async () => { Object.keys(mockSettingsTable).forEach(k => delete mockSettingsTable[k]); }),
    bulkPut: vi.fn(async (items: any[]) => { items.forEach(i => { mockSettingsTable[i.key] = i; }); }),
  };
}

function makeMockAchievements() {
  return {
    clear: vi.fn(async () => { mockAchievementsTable.length = 0; }),
    bulkAdd: vi.fn(async (items: any[]) => { items.forEach(i => { mockAchievementsTable.push({ ...i, id: nextAchievementId++ }); }); }),
    toArray: vi.fn(async () => [...mockAchievementsTable]),
  };
}

function makeMockBackups() {
  return {
    put: vi.fn(async (item: any) => { const id = nextBackupId++; mockBackupsTable.push({ ...item, id }); return id; }),
    get: vi.fn(async (id: number) => mockBackupsTable.find(b => b.id === id) ?? null),
    delete: vi.fn(async (id: number) => { const idx = mockBackupsTable.findIndex(b => b.id === id); if (idx >= 0) mockBackupsTable.splice(idx, 1); }),
    toArray: vi.fn(async () => [...mockBackupsTable]),
    orderBy: vi.fn(() => ({
      reverse: () => ({ toArray: async () => [...mockBackupsTable].reverse() }),
      toArray: async () => [...mockBackupsTable].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)),
    })),
    bulkDelete: vi.fn(async (ids: number[]) => { ids.forEach(id => { const idx = mockBackupsTable.findIndex(b => b.id === id); if (idx >= 0) mockBackupsTable.splice(idx, 1); }); }),
  };
}

vi.mock('dexie', () => {
  return {
    default: class MockDexie {
      sessions = makeMockSessions();
      checkins = makeMockCheckins();
      settings = makeMockSettings();
      achievements = makeMockAchievements();
      backups = makeMockBackups();
      transaction = vi.fn(async (_mode: string, ...args: any[]) => {
        const callback = args[args.length - 1];
        if (typeof callback === 'function') await callback();
      });
      version = vi.fn(() => ({ stores: vi.fn() }));
      open = vi.fn(async () => {});
      close = vi.fn(() => {});
    },
  };
});

// ── Mock localStorage ──
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};
vi.stubGlobal('localStorage', localStorageMock);

describe('storage', () => {
  beforeEach(() => {
    // Clear mock tables
    Object.keys(mockSessionsTable).forEach(k => delete mockSessionsTable[k]);
    Object.keys(mockCheckinsTable).forEach(k => delete mockCheckinsTable[k]);
    Object.keys(mockSettingsTable).forEach(k => delete mockSettingsTable[k]);
    mockAchievementsTable.length = 0;
    mockBackupsTable.length = 0;
    nextAchievementId = 1;
    nextBackupId = 1;
    localStorageMock.getItem.mockReset();
    localStorageMock.setItem.mockReset();
    localStorageMock.removeItem.mockReset();
  });

  afterEach(async () => {
    await clearAllData();
  });

  describe('init', () => {
    it('opens the database without throwing', async () => {
      await expect(init()).resolves.toBeUndefined();
    });
  });

  describe('sessions', () => {
    const makeSession = (overrides: Partial<Session> = {}): Session => ({
      key: '2026-05-29_A',
      date: '2026-05-29',
      type: 'A',
      completed: true,
      readiness: 'green',
      rpe: 7,
      notes: '',
      updatedAt: Date.now(),
      ...overrides,
    });

    it('saveSession saves a session and returns its key', async () => {
      const s = makeSession();
      const key = await saveSession(s);
      expect(key).toBe('2026-05-29_A');
    });

    it('saveSession throws when key is missing', async () => {
      const s = makeSession({ key: undefined as unknown as string });
      await expect(saveSession(s)).rejects.toThrow();
    });

    it('deleteSession removes a session', async () => {
      const s = makeSession();
      await saveSession(s);
      await deleteSession(s.key!);
      const all = await getAllSessions();
      expect(all.length).toBe(0);
    });

    it('getAllSessions returns all saved sessions', async () => {
      await saveSession(makeSession({ key: 'd1_A', date: 'd1' }));
      await saveSession(makeSession({ key: 'd2_A', date: 'd2' }));
      const all = await getAllSessions();
      expect(all.length).toBe(2);
    });

    it('getLatestTestResults returns null when no sessions have testResults', async () => {
      await saveSession(makeSession());
      const result = await getLatestTestResults();
      expect(result).toBeNull();
    });
  });

  describe('checkins', () => {
    const makeCheckin = (overrides: Partial<Checkin> = {}): Checkin => ({
      date: '2026-05-29',
      sleepHours: 7,
      restHR: 60,
      hrv: 80,
      hipPain: 0,
      shoulderPain: 0,
      breathing: 'good',
      weight: 70,
      muscleSoreness: 1,
      energy: 3,
      mood: 3,
      sleepQuality: 3,
      stress: 1,
      ...overrides,
    });

    it('saveCheckin saves a checkin and returns its date', async () => {
      const c = makeCheckin();
      const key = await saveCheckin(c);
      expect(key).toBe('2026-05-29');
    });

    it('saveCheckin throws when date is missing', async () => {
      const c = makeCheckin({ date: undefined as unknown as string });
      await expect(saveCheckin(c)).rejects.toThrow();
    });

    it('getCheckin returns null for missing date', async () => {
      const result = await getCheckin('2099-01-01');
      expect(result).toBeNull();
    });

    it('getCheckin returns the saved checkin', async () => {
      const c = makeCheckin();
      await saveCheckin(c);
      const result = await getCheckin('2026-05-29');
      expect(result!.date).toBe('2026-05-29');
    });

    it('getAllCheckins returns all checkins', async () => {
      await saveCheckin(makeCheckin({ date: '2026-05-01' }));
      await saveCheckin(makeCheckin({ date: '2026-05-02' }));
      const all = await getAllCheckins();
      expect(all.length).toBe(2);
    });
  });

  describe('settings', () => {
    it('saveSetting and getSetting round-trip a string', async () => {
      await saveSetting('testKey', 'hello');
      const val = await getSetting('testKey');
      expect(val).toBe('hello');
    });

    it('getSetting returns null for missing key', async () => {
      const val = await getSetting('missing');
      expect(val).toBeNull();
    });

    it('saveSetting serializes and deserializes objects', async () => {
      await saveSetting('obj', { a: 1, b: 'two' });
      const val = await getSetting('obj');
      expect(val).toEqual({ a: 1, b: 'two' });
    });

    it('saveSettings saves multiple settings at once', async () => {
      await saveSettings({ startDate: '2026-01-01', trainDays: [1, 3, 5] });
      const { startDate, trainDays } = await getSettings();
      expect(startDate).toBe('2026-01-01');
      expect(trainDays).toEqual([1, 3, 5]);
    });
  });

  describe('manual status', () => {
    it('saveManualStatus and getManualStatus round-trip', async () => {
      await saveManualStatus('2026-05-29', 'green');
      const status = await getManualStatus('2026-05-29');
      expect(status).toBe('green');
    });

    it('getManualStatus returns null when not set', async () => {
      const status = await getManualStatus('2099-01-01');
      expect(status).toBeNull();
    });
  });

  describe('exportAllData / importAllData', () => {
    it('exportAllData returns an object with version 2', async () => {
      const data = await exportAllData();
      expect((data as any).version).toBe(2);
    });

    it('importAllData throws on invalid data (non-object)', async () => {
      await expect(importAllData('not an object' as any)).rejects.toThrow();
    });

    it('importAllData throws on invalid data (array)', async () => {
      await expect(importAllData([1, 2, 3] as any)).rejects.toThrow();
    });
  });

  describe('clearAllData', () => {
    it('removes all sessions and checkins', async () => {
      await saveSession({
        key: '2026-05-29_A',
        date: '2026-05-29',
        type: 'A',
        completed: true,
        readiness: 'green',
        rpe: 7,
        notes: '',
        updatedAt: Date.now(),
      });
      await saveCheckin({
        date: '2026-05-29',
        sleepHours: 7,
        restHR: 60,
        hrv: 80,
        hipPain: 0,
        shoulderPain: 0,
        breathing: 'good',
        weight: 70,
        muscleSoreness: 1,
        energy: 3,
        mood: 3,
        sleepQuality: 3,
        stress: 1,
      });

      await clearAllData();

      const sessions = await getAllSessions();
      const checkins = await getAllCheckins();
      expect(sessions.length).toBe(0);
      expect(checkins.length).toBe(0);
    });

    it('creates auto-backup before clearing data', async () => {
      await saveSession({
        key: '2026-05-30_A',
        date: '2026-05-30',
        type: 'A',
        completed: true,
        readiness: 'green',
        rpe: 7,
        notes: '',
        updatedAt: Date.now(),
      });

      await clearAllData();
      const backups = await getBackups();
      expect(backups.length).toBeGreaterThanOrEqual(1);
      expect(backups[0].label).toContain('auto-backup-');
      const parsed = JSON.parse(backups[0].data);
      expect(parsed.sessions).toBeDefined();
      expect(parsed.version).toBe(2);
    });
  });

  describe('demo mode', () => {
    afterEach(async () => {
      await deactivateDemoData();
    });

    it('isDemoMode returns false before activation', () => {
      expect(isDemoMode()).toBe(false);
    });

    it('activateDemoData switches to demo mode', async () => {
      await activateDemoData({
        sessions: [{
          key: '2026-05-29_A',
          date: '2026-05-29',
          type: 'A',
          completed: true,
          readiness: 'green',
          rpe: 7,
          notes: '',
          updatedAt: Date.now(),
        }],
        checkins: [],
        settings: { startDate: '2026-01-01', trainDays: [1, 3, 5] },
      });
      expect(isDemoMode()).toBe(true);
    });

    it('deactivateDemoData switches back to real DB', async () => {
      await activateDemoData({ sessions: [], checkins: [], settings: {} });
      await deactivateDemoData();
      expect(isDemoMode()).toBe(false);
    });

    it('loadDemoModeState reads from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('1');
      expect(loadDemoModeState()).toBe(true);
      localStorageMock.getItem.mockReturnValue(null);
      expect(loadDemoModeState()).toBe(false);
    });
  });
});
