import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

let mockPermission: NotificationPermission = 'default';
let mockNotifications: Array<{ title: string; options?: NotificationOptions }> = [];
let mockStorage: Map<string, string> = new Map();

vi.stubGlobal('localStorage', {
  getItem: (key: string) => mockStorage.get(key) ?? null,
  setItem: (key: string, value: string) => { mockStorage.set(key, value); },
  removeItem: (key: string) => { mockStorage.delete(key); },
  clear: () => { mockStorage.clear(); },
  get length() { return mockStorage.size; },
  key: (idx: number) => Array.from(mockStorage.keys())[idx] ?? null,
});

class MockNotification {
  static permission: NotificationPermission = 'default';

  static requestPermission = vi.fn(async () => {
    return mockPermission;
  });

  constructor(title: string, options?: NotificationOptions) {
    mockNotifications.push({ title, options });
  }

  close() {}
}

vi.stubGlobal('Notification', MockNotification);

beforeEach(() => {
  mockPermission = 'default';
  mockNotifications = [];
  mockStorage = new Map();
  MockNotification.requestPermission.mockClear();
  Object.defineProperty(MockNotification, 'permission', {
    get: () => mockPermission,
    configurable: true,
  });
});

import {
  registerNotificationPermission,
  showDailyReminder,
  showMondaySummary,
  getStoredNotifyTime,
  saveNotifyTime,
  NOTIFY_ENABLED_KEY,
} from '../notifications.js';

describe('registerNotificationPermission', () => {
  it('returns true when permission is granted', async () => {
    mockPermission = 'granted';
    const result = await registerNotificationPermission();
    expect(result).toBe(true);
    expect(MockNotification.requestPermission).toHaveBeenCalled();
  });

  it('returns false when permission is denied', async () => {
    mockPermission = 'denied';
    const result = await registerNotificationPermission();
    expect(result).toBe(false);
  });

  it('returns false when permission is default (dismissed)', async () => {
    mockPermission = 'default';
    const result = await registerNotificationPermission();
    expect(result).toBe(false);
  });
});

describe('showDailyReminder', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does nothing when check-in is already done', () => {
    saveNotifyTime('07:30');
    localStorage.setItem(NOTIFY_ENABLED_KEY, 'true');
    showDailyReminder(true, '07:30');
    vi.runAllTimers();
    expect(mockNotifications).toHaveLength(0);
  });

  it('does nothing when notifications are not enabled in settings', () => {
    localStorage.setItem(NOTIFY_ENABLED_KEY, 'false');
    mockPermission = 'granted';
    showDailyReminder(false, '07:30');
    vi.runAllTimers();
    expect(mockNotifications).toHaveLength(0);
  });

  it('does nothing when Notification permission is not granted', () => {
    localStorage.setItem(NOTIFY_ENABLED_KEY, 'true');
    mockPermission = 'denied';
    showDailyReminder(false, '07:30');
    vi.runAllTimers();
    expect(mockNotifications).toHaveLength(0);
  });

  it('fires notification immediately when target time is already past', () => {
    localStorage.setItem(NOTIFY_ENABLED_KEY, 'true');
    mockPermission = 'granted';
    saveNotifyTime('07:30');
    const now = new Date();
    now.setHours(9, 0, 0, 0);
    vi.setSystemTime(now);
    showDailyReminder(false, '07:30');
    vi.runAllTimers();
    expect(mockNotifications).toHaveLength(1);
    expect(mockNotifications[0].title).toContain('check-in');
  });

  it('schedules notification for future target time', () => {
    localStorage.setItem(NOTIFY_ENABLED_KEY, 'true');
    mockPermission = 'granted';
    saveNotifyTime('09:00');
    const now = new Date();
    now.setHours(7, 0, 0, 0);
    vi.setSystemTime(now);
    showDailyReminder(false, '09:00');
    expect(mockNotifications).toHaveLength(0);
    vi.advanceTimersByTime(2 * 60 * 60 * 1000 + 1000);
    expect(mockNotifications).toHaveLength(1);
    expect(mockNotifications[0].title).toContain('check-in');
  });
});

describe('showMondaySummary', () => {
  it('does nothing when Notification permission is not granted', () => {
    mockPermission = 'denied';
    showMondaySummary();
    expect(mockNotifications).toHaveLength(0);
  });

  it('fires a Monday summary notification when permission is granted', () => {
    mockPermission = 'granted';
    showMondaySummary();
    expect(mockNotifications).toHaveLength(1);
    expect(mockNotifications[0].title).toContain('недели');
  });

  it('includes custom data in notification body if provided', () => {
    mockPermission = 'granted';
    showMondaySummary('+2.5 кг к жиму — итоги недели →');
    expect(mockNotifications).toHaveLength(1);
    expect(mockNotifications[0].options?.body).toContain('+2.5');
  });
});

describe('getStoredNotifyTime / saveNotifyTime', () => {
  it('returns default "07:30" when nothing stored', () => {
    expect(getStoredNotifyTime()).toBe('07:30');
  });

  it('returns saved value after saveNotifyTime', () => {
    saveNotifyTime('08:00');
    expect(getStoredNotifyTime()).toBe('08:00');
  });

  it('persists across reads', () => {
    saveNotifyTime('06:45');
    expect(getStoredNotifyTime()).toBe('06:45');
    expect(getStoredNotifyTime()).toBe('06:45');
  });
});
