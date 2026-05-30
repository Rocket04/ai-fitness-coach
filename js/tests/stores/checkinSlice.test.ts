import { describe, it, expect } from 'vitest';
import { createCheckinSlice } from '../../domains/checkin/checkinSlice.js';

describe('checkinSlice (stub — moved to js/domains/checkin/tests/)', () => {
  it('re-exports createCheckinSlice correctly', () => {
    expect(typeof createCheckinSlice).toBe('function');
  });
});
