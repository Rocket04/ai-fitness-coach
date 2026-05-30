import { describe, it, expect } from 'vitest';
import { validate } from '../../domains/checkin/validation.js';

describe('validation (stub — moved to js/domains/checkin/tests/)', () => {
  it('re-exports validate correctly', () => {
    expect(typeof validate).toBe('function');
  });
});
