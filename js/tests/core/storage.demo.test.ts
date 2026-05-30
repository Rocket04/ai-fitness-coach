import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('dexie', () => {
  return {
    default: class FakeDexie {
      version() { return this; }
      stores() { return this; }
      async open() { return this; }
      close() {}
      async transaction(...args: unknown[]) {
        const callback = args[args.length - 1];
        if (typeof callback === 'function') await callback();
      }
      sessions = { async bulkPut() {}, async clear() {} };
      checkins = { async bulkPut() {}, async clear() {} };
      settings = { async bulkPut() {}, async clear() {} };
      achievements = { async clear() {} };
    }
  };
});

import { isDemoMode, activateDemoData, deactivateDemoData, loadDemoModeState } from '../../data/storage.js';

const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};

describe('demo mode', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', localStorageMock);
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.removeItem.mockClear();
  });

  afterEach(async () => {
    await deactivateDemoData();
  });

  it('is inactive by default', () => {
    expect(isDemoMode()).toBe(false);
  });

  it('activates after calling activateDemoData', async () => {
    await activateDemoData({ sessions: [], checkins: [], settings: {} });
    expect(isDemoMode()).toBe(true);
  });

  it('deactivates after calling deactivateDemoData', async () => {
    await activateDemoData({ sessions: [], checkins: [], settings: {} });
    expect(isDemoMode()).toBe(true);
    await deactivateDemoData();
    expect(isDemoMode()).toBe(false);
  });

  it('reads demo state from localStorage', () => {
    localStorageMock.getItem.mockReturnValue(null);
    expect(loadDemoModeState()).toBe(false);
    localStorageMock.getItem.mockReturnValue('1');
    expect(loadDemoModeState()).toBe(true);
  });
});
