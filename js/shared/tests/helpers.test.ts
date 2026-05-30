import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getAppDate, getAppDateSync, setVirtualTodayOffset } from '../helpers.js';

describe('getAppDate', () => {
  beforeEach(() => {
    setVirtualTodayOffset(0);
  });

  afterEach(() => {
    setVirtualTodayOffset(0);
  });

  it('returns real today when offset is 0', () => {
    const result = getAppDate();
    const today = new Date();
    expect(result.getFullYear()).toBe(today.getFullYear());
    expect(result.getMonth()).toBe(today.getMonth());
    expect(result.getDate()).toBe(today.getDate());
  });

  it('returns date offset by N days when offset is set', () => {
    setVirtualTodayOffset(3);
    const result = getAppDate();
    const expected = new Date();
    expected.setDate(expected.getDate() + 3);
    expect(result.getFullYear()).toBe(expected.getFullYear());
    expect(result.getMonth()).toBe(expected.getMonth());
    expect(result.getDate()).toBe(expected.getDate());
  });

  it('handles negative offsets (past dates)', () => {
    setVirtualTodayOffset(-7);
    const result = getAppDate();
    const expected = new Date();
    expected.setDate(expected.getDate() - 7);
    expect(result.getFullYear()).toBe(expected.getFullYear());
    expect(result.getMonth()).toBe(expected.getMonth());
    expect(result.getDate()).toBe(expected.getDate());
  });

  it('handles month boundary crossing', () => {
    setVirtualTodayOffset(30);
    const result = getAppDate();
    const expected = new Date();
    expected.setDate(expected.getDate() + 30);
    expect(result.getFullYear()).toBe(expected.getFullYear());
    expect(result.getMonth()).toBe(expected.getMonth());
    expect(result.getDate()).toBe(expected.getDate());
  });
});

describe('getAppDateSync', () => {
  it('uses explicit offset parameter', () => {
    const result = getAppDateSync(5);
    const expected = new Date();
    expected.setDate(expected.getDate() + 5);
    expect(result.getDate()).toBe(expected.getDate());
  });
});
