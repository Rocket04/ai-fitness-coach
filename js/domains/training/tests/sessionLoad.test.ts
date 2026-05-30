// js/tests/core/sessionLoad.test.ts
// TDD: sessionLoad public interface — Foster TRIMP calculation

import { describe, it, expect } from 'vitest';
import { calculateSessionLoad } from '../session/sessionLoad.js';

describe('calculateSessionLoad', () => {
  it('returns rpe × duration for normal inputs', () => {
    expect(calculateSessionLoad(8, 45)).toBe(360);
    expect(calculateSessionLoad(10, 30)).toBe(300);
  });

  it('uses default duration of 45 minutes when omitted', () => {
    expect(calculateSessionLoad(5)).toBe(225);
    expect(calculateSessionLoad(10)).toBe(450);
  });

  it('returns 0 when rpe is 0', () => {
    expect(calculateSessionLoad(0, 60)).toBe(0);
    expect(calculateSessionLoad(0, 90)).toBe(0);
  });

  it('handles falsy rpe by defaulting to 0', () => {
    expect(calculateSessionLoad(null as any, 60)).toBe(0);
    expect(calculateSessionLoad(undefined as any, 60)).toBe(0);
  });

  it('caps negative duration at 0', () => {
    expect(calculateSessionLoad(8, -10)).toBe(0);
  });

  it('falls back to default duration when duration is falsy', () => {
    expect(calculateSessionLoad(8, null as any)).toBe(360);
    expect(calculateSessionLoad(8, undefined as any)).toBe(360);
  });
});
