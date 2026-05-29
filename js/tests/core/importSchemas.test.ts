// js/tests/core/importSchemas.test.ts
import { describe, it, expect } from 'vitest';
import {
  detectImportFormat,
  validateImportData,
  DexieV2Schema,
  LegacySchema,
} from '../../core/importSchemas';

describe('importSchemas', () => {
  describe('detectImportFormat', () => {
    it('detects dexie-v2 format', () => {
      const data = { version: 2, exportedAt: '2024-01-01', sessions: [] };
      expect(detectImportFormat(data)).toBe('dexie-v2');
    });

    it('detects legacy format by checkins object', () => {
      const data = { checkins: { '2024-01-01': {} }, sessions: {} };
      expect(detectImportFormat(data)).toBe('legacy');
    });

    it('returns unknown for null', () => {
      expect(detectImportFormat(null)).toBe('unknown');
    });

    it('returns unknown for non-object', () => {
      expect(detectImportFormat('string')).toBe('unknown');
      expect(detectImportFormat(123)).toBe('unknown');
    });

    it('returns unknown for object without version or checkins', () => {
      expect(detectImportFormat({ foo: 'bar' })).toBe('unknown');
    });

    it('returns unknown for dexie-v2 missing exportedAt', () => {
      const data = { version: 2, sessions: [] };
      expect(detectImportFormat(data)).toBe('unknown');
    });

    it('returns unknown for legacy with checkins as array', () => {
      const data = { checkins: [], sessions: {} };
      expect(detectImportFormat(data)).toBe('unknown');
    });
  });

  describe('validateImportData', () => {
    it('returns success for valid dexie-v2 data', () => {
      const data = {
        version: 2,
        exportedAt: '2024-01-01T00:00:00Z',
        sessions: [
          {
            key: '2024-01-01-A',
            date: '2024-01-01',
            type: 'A',
            completed: true,
            readiness: 'green',
            rpe: 7,
            notes: '',
            updatedAt: Date.now(),
          },
        ],
        checkins: [],
        achievements: [],
        settings: [],
      };

      const result = validateImportData(data);
      expect(result.success).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.data).toBeDefined();
    });

    it('returns errors for invalid dexie-v2 data (bad type enum)', () => {
      const data = {
        version: 2,
        exportedAt: '2024-01-01',
        sessions: [{ type: 'invalid-type', date: '2024-01-01' }],
      };

      const result = validateImportData(data);
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('returns errors for missing required fields', () => {
      const data = {
        version: 2,
        exportedAt: '2024-01-01',
        sessions: [{ notes: '' }], // missing key, date, type, etc.
      };

      const result = validateImportData(data);
      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.includes('key'))).toBe(true);
    });

    it('returns success for valid legacy format', () => {
      const data = {
        checkins: {
          '2024-01-01': {
            sleepHours: 8,
            restHR: 60,
            hrv: 70,
            hipPain: 0,
            shoulderPain: 0,
            breathing: 'good',
            weight: 70,
            muscleSoreness: 1,
            energy: 4,
            mood: 4,
            sleepQuality: 4,
            stress: 2,
          },
        },
        sessions: {
          '2024-01-01-A': { completed: true, rpe: 7 },
        },
      };

      const result = validateImportData(data);
      expect(result.success).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('returns failure for unknown format', () => {
      const data = { random: 'data' };
      const result = validateImportData(data);
      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('Некорректный формат');
    });

    it('returns failure for null input', () => {
      const result = validateImportData(null);
      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('Некорректный формат');
    });

    it('validates checkin schema with missing optional fields', () => {
      const data = {
        version: 2,
        exportedAt: '2024-01-01',
        checkins: [
          {
            date: '2024-01-01',
            sleepHours: 7,
            restHR: 65,
            hrv: 80,
            hipPain: 0,
            shoulderPain: 0,
            breathing: 'good',
            weight: 70,
            muscleSoreness: 2,
            energy: 3,
            mood: 4,
            sleepQuality: 4,
            stress: 3,
            // missing optional: motivation
          },
        ],
      };

      const result = validateImportData(data);
      expect(result.success).toBe(true);
    });

    it('rejects checkin with invalid enum value', () => {
      const data = {
        version: 2,
        exportedAt: '2024-01-01',
        checkins: [
          {
            date: '2024-01-01',
            sleepHours: 7,
            restHR: 65,
            hrv: 80,
            hipPain: 0,
            shoulderPain: 0,
            breathing: 'invalid', // not in enum
            weight: 70,
            muscleSoreness: 2,
            energy: 3,
            mood: 4,
            sleepQuality: 4,
            stress: 3,
          },
        ],
      };

      const result = validateImportData(data);
      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.includes('breathing'))).toBe(true);
    });

    it('validates settings array in dexie-v2', () => {
      const data = {
        version: 2,
        exportedAt: '2024-01-01',
        settings: [
          { key: 'dateOffset', value: '0' },
          { key: 'language', value: 'ru' },
        ],
      };

      const result = validateImportData(data);
      expect(result.success).toBe(true);
    });

    it('validates achievements array in dexie-v2', () => {
      const data = {
        version: 2,
        exportedAt: '2024-01-01',
        achievements: [
          { achievementKey: 'first_checkin', earnedAt: Date.now() },
        ],
      };

      const result = validateImportData(data);
      expect(result.success).toBe(true);
    });
  });

  describe('schema exports', () => {
    it('DexieV2Schema accepts extra fields due to passthrough', () => {
      const data = {
        version: 2,
        exportedAt: '2024-01-01',
        extraField: 'should be allowed',
        sessions: [],
      };

      const result = DexieV2Schema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('LegacySchema accepts any checkins/sessions structure', () => {
      const data = {
        checkins: { '2024-01-01': { anything: true } },
        sessions: { 'key': { rpe: 7 } },
        plan: { months: [] },
        current: { week: 1 },
      };

      const result = LegacySchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });
});
