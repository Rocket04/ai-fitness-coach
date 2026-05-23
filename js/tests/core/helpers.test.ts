// js/tests/core/helpers.test.ts
// TDD: getAppDate() — virtual date offset helper

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('getAppDate / getAppDateSync / setVirtualTodayOffset', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    // Reset module-level offset after each test
    vi.resetModules();
  });

  it('should export getAppDate, getAppDateSync, setVirtualTodayOffset', async () => {
    const mod = await import('../../core/helpers.js');
    expect(mod.getAppDate).toBeDefined();
    expect(mod.getAppDateSync).toBeDefined();
    expect(mod.setVirtualTodayOffset).toBeDefined();
    expect(typeof mod.getAppDate).toBe('function');
    expect(typeof mod.getAppDateSync).toBe('function');
    expect(typeof mod.setVirtualTodayOffset).toBe('function');
  });

  it('should return real today when offset is 0', async () => {
    const { setVirtualTodayOffset, getAppDate } = await import('../../core/helpers.js');
    setVirtualTodayOffset(0);
    const result = getAppDate();
    const today = new Date();
    expect(result.getFullYear()).toBe(today.getFullYear());
    expect(result.getMonth()).toBe(today.getMonth());
    expect(result.getDate()).toBe(today.getDate());
  });

  it('should return date offset by N days when offset is set', async () => {
    const { setVirtualTodayOffset, getAppDate } = await import('../../core/helpers.js');
    setVirtualTodayOffset(3);
    const result = getAppDate();
    const expected = new Date();
    expected.setDate(expected.getDate() + 3);
    expect(result.getFullYear()).toBe(expected.getFullYear());
    expect(result.getMonth()).toBe(expected.getMonth());
    expect(result.getDate()).toBe(expected.getDate());
  });

  it('should handle negative offsets (past dates)', async () => {
    const { setVirtualTodayOffset, getAppDate } = await import('../../core/helpers.js');
    setVirtualTodayOffset(-7);
    const result = getAppDate();
    const expected = new Date();
    expected.setDate(expected.getDate() - 7);
    expect(result.getFullYear()).toBe(expected.getFullYear());
    expect(result.getMonth()).toBe(expected.getMonth());
    expect(result.getDate()).toBe(expected.getDate());
  });

  it('getAppDateSync should use explicit offset parameter', async () => {
    const { getAppDateSync } = await import('../../core/helpers.js');
    const result = getAppDateSync(5);
    const expected = new Date();
    expected.setDate(expected.getDate() + 5);
    expect(result.getDate()).toBe(expected.getDate());
  });

  it('should handle month boundary crossing', async () => {
    const { setVirtualTodayOffset, getAppDate } = await import('../../core/helpers.js');
    // Set offset to 30 days to cross month boundary
    setVirtualTodayOffset(30);
    const result = getAppDate();
    const expected = new Date();
    expected.setDate(expected.getDate() + 30);
    expect(result.getFullYear()).toBe(expected.getFullYear());
    expect(result.getMonth()).toBe(expected.getMonth());
    expect(result.getDate()).toBe(expected.getDate());
  });
});
