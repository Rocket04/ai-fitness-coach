// js/tests/deriveTier.test.ts
// TDD: deriveTierFromGadgets — auto tier detection from selected gadgets

import { describe, it, expect } from 'vitest';
import { deriveTierFromGadgets } from '../config/constants.js';

describe('deriveTierFromGadgets', () => {
  it('user with no gadgets gets light checkin tier', () => {
    expect(deriveTierFromGadgets([])).toBe('light');
  });

  it('user with only manual mode gets light checkin tier', () => {
    expect(deriveTierFromGadgets(['manual'])).toBe('light');
  });

  it('user with HRV monitor gets full tier for objective recovery tracking', () => {
    expect(deriveTierFromGadgets(['hrv_monitor'])).toBe('full');
  });

  it('HRV monitor takes precedence over other devices', () => {
    expect(deriveTierFromGadgets(['smart_watch', 'hrv_monitor'])).toBe('full');
  });

  it('user with smart watch gets medium tier for basic metrics', () => {
    expect(deriveTierFromGadgets(['smart_watch'])).toBe('medium');
  });

  it('user with dedicated heart rate monitor also gets medium tier', () => {
    expect(deriveTierFromGadgets(['heart_rate_monitor'])).toBe('medium');
  });

  it('multiple basic devices still yield medium tier', () => {
    expect(deriveTierFromGadgets(['smart_watch', 'heart_rate_monitor'])).toBe('medium');
  });

  it('manual mode overrides all device selections', () => {
    expect(deriveTierFromGadgets(['manual', 'smart_watch'])).toBe('light');
  });
});
