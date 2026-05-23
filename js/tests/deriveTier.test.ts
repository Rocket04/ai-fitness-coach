// js/tests/deriveTier.test.ts
// TDD: deriveTierFromGadgets — auto tier detection from selected gadgets

import { describe, it, expect } from 'vitest';
import { deriveTierFromGadgets } from '../config/constants.js';

describe('deriveTierFromGadgets', () => {
  it('returns light for manual-only selection', () => {
    expect(deriveTierFromGadgets(['manual'])).toBe('light');
  });

  it('returns light for empty selection', () => {
    expect(deriveTierFromGadgets([])).toBe('light');
  });

  it('returns full when HRV monitor is selected', () => {
    expect(deriveTierFromGadgets(['hrv_monitor'])).toBe('full');
  });

  it('returns full when HRV monitor is selected with other gadgets', () => {
    expect(deriveTierFromGadgets(['smart_watch', 'hrv_monitor'])).toBe('full');
  });

  it('returns medium for smart watch without HRV', () => {
    expect(deriveTierFromGadgets(['smart_watch'])).toBe('medium');
  });

  it('returns medium for heart rate monitor without HRV', () => {
    expect(deriveTierFromGadgets(['heart_rate_monitor'])).toBe('medium');
  });

  it('returns medium for multiple non-HRV gadgets', () => {
    expect(deriveTierFromGadgets(['smart_watch', 'heart_rate_monitor'])).toBe('medium');
  });

  it('manual takes precedence over other gadgets', () => {
    expect(deriveTierFromGadgets(['manual', 'smart_watch'])).toBe('light');
  });
});
