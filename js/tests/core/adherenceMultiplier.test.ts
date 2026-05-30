import { describe, it, expect } from 'vitest';
import { getVolumeMultiplierFromAdherence } from '../../core/planning.js';

describe('getVolumeMultiplierFromAdherence', () => {
  it('returns 1.2 for rate 0.85', () => {
    expect(getVolumeMultiplierFromAdherence(0.85)).toBe(1.2);
  });

  it('returns 1.2 at boundary 0.8', () => {
    expect(getVolumeMultiplierFromAdherence(0.8)).toBe(1.2);
  });

  it('returns 1.0 for rate 0.79', () => {
    expect(getVolumeMultiplierFromAdherence(0.79)).toBe(1.0);
  });

  it('returns 1.0 at boundary 0.6', () => {
    expect(getVolumeMultiplierFromAdherence(0.6)).toBe(1.0);
  });

  it('returns 0.8 for rate 0.59', () => {
    expect(getVolumeMultiplierFromAdherence(0.59)).toBe(0.8);
  });

  it('returns 0.8 for rate 0', () => {
    expect(getVolumeMultiplierFromAdherence(0)).toBe(0.8);
  });

  it('returns 1.2 for rate 1.0', () => {
    expect(getVolumeMultiplierFromAdherence(1.0)).toBe(1.2);
  });
});
