// global.d.ts
// Type definitions for external dependencies

import React from 'react';

declare module 'dexie' {
  export class Dexie {
    constructor(name: string);
    version(version: number): this;
    stores(stores: { [key: string]: string }): this;
    open(): Promise<void>;
    transaction(mode: string, tables: any[], callback: () => any): Promise<any>;
  }

  export interface Table {
    get(key: any): Promise<any>;
    toArray(): Promise<any[]>;
    put(value: any): Promise<any>;
    delete(key: any): Promise<void>;
    clear(): Promise<void>;
    bulkPut(values: any[]): Promise<any>;
    bulkAdd(values: any[]): Promise<any>;
    where(key: string): any;
    filter(callback: (item: any) => boolean): { toArray(): Promise<any[]> };
  }
}

// Wildcard fallback for any remaining .jsx imports
declare module '*.jsx' { const c: any; export default c; }

declare module './config/constants.js' {
  export const DAYS: string[];
  export const TRAIN_ORDER: string[];
  export const RECOVERY_WEIGHTS: { hrv: number; sleep: number; rhr: number; subjective: number };
  export const SUBJECTIVE_THRESHOLDS: { muscleSorenessHigh: number; energyLow: number; moodLow: number; stressHigh: number; sleepQualityLow: number };
  export const ZONES: any[];
  export const HRV_GUIDE: any[];
  export const MORNING_ROUTINE: any[];
  export const EVENING_ROUTINE: any[];
  export const NUTRITION: any[];
  export const MONTHS: any[];
  export const CHECKIN_TIERS: any;
  export const APRE_PROTOCOLS: any;
  export const SPORT_CATEGORIES: any;
}

declare module '*.json' {
  const value: any;
  export default value;
}
