// js/core/importSchemas.ts
// Zod validation schemas for data import

import { z } from 'zod';

// Base type schemas (loose validation with passthrough)

const SessionSchema = z.object({
  key: z.string(),
  date: z.string(),
  type: z.enum(['A', 'B', 'C', 'rest', 'morning', 'evening', 'mobility']),
  completed: z.boolean(),
  readiness: z.enum(['green', 'yellow', 'red']),
  rpe: z.number(),
  durationMinutes: z.number().optional(),
  sessionLoad: z.number().optional(),
  hipPain: z.number().optional(),
  shoulderPain: z.number().optional(),
  notes: z.string(),
  testResults: z.object({
    pullUps: z.number(),
    pushUps: z.number(),
    plankSec: z.number(),
  }).optional(),
  mode: z.enum(['full', 'yellow', 'minimum', 'deload']).optional(),
  updatedAt: z.number(),
  apreResults: z.array(z.any()).optional(),
}).passthrough();

const CheckinSchema = z.object({
  date: z.string(),
  sleepHours: z.number(),
  restHR: z.number(),
  hrv: z.number(),
  hipPain: z.number(),
  shoulderPain: z.number(),
  breathing: z.enum(['good', 'mild', 'bad']),
  weight: z.number(),
  notes: z.string().optional(),
  muscleSoreness: z.number(),
  energy: z.number(),
  mood: z.number(),
  sleepQuality: z.number(),
  stress: z.number(),
  motivation: z.number().optional(),
  readiness: z.enum(['green', 'yellow', 'red']).optional(),
  ts: z.number().optional(),
}).passthrough();

// Dexie stores settings as key-value pairs
const SettingRecordSchema = z.object({
  key: z.string(),
  value: z.string(),
}).passthrough();

const AchievementSchema = z.object({
  id: z.number().optional(),
  achievementKey: z.string(),
  earnedAt: z.number(),
}).passthrough();

// Dexie v2 format (current export format)
export const DexieV2Schema = z.object({
  version: z.literal(2),
  exportedAt: z.string(),
  sessions: z.array(SessionSchema).optional(),
  checkins: z.array(CheckinSchema).optional(),
  achievements: z.array(AchievementSchema).optional(),
  settings: z.array(SettingRecordSchema).optional(),
}).passthrough();

// Legacy localStorage format (old MVP format)
// Very permissive - just check basic structure
export const LegacySchema = z.object({
  checkins: z.record(z.any()).optional(),
  sessions: z.record(z.any()).optional(),
  plan: z.any().optional(),
  current: z.any().optional(),
}).passthrough();

// Format detection
export function detectImportFormat(data: unknown): 'dexie-v2' | 'legacy' | 'unknown' {
  if (typeof data !== 'object' || data === null) {
    return 'unknown';
  }
  
  const obj = data as Record<string, unknown>;
  
  // Check for Dexie v2 format
  if (obj.version === 2 && typeof obj.exportedAt === 'string') {
    return 'dexie-v2';
  }
  
  // Check for legacy format (has checkins/sessions as objects, not arrays)
  if (obj.checkins && typeof obj.checkins === 'object' && !Array.isArray(obj.checkins)) {
    return 'legacy';
  }
  
  return 'unknown';
}

// Validation result type
export interface ValidationResult {
  success: boolean;
  errors: string[];
  data?: unknown;
}

// Validate data against appropriate schema
export function validateImportData(data: unknown): ValidationResult {
  const format = detectImportFormat(data);
  
  if (format === 'unknown') {
    return {
      success: false,
      errors: ['Некорректный формат файла: не удалось определить формат (ни Dexie v2, ни legacy)'],
    };
  }
  
  let schema;
  if (format === 'dexie-v2') {
    schema = DexieV2Schema;
  } else {
    schema = LegacySchema;
  }
  
  const result = schema.safeParse(data);
  
  if (!result.success) {
    const errors = result.error.errors.map(err => {
      const path = err.path.join('.');
      return path ? `${path}: ${err.message}` : err.message;
    });
    
    return {
      success: false,
      errors,
    };
  }
  
  return {
    success: true,
    errors: [],
    data: result.data,
  };
}
