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

declare module '@radix-ui/react-dialog' {
  export const Root: React.FC<{ open: boolean; onOpenChange: (open: boolean) => void; children: React.ReactNode }>;
  export const Portal: React.FC<{ children: React.ReactNode }>;
  export const Overlay: React.FC<{ className: string }>;
  export const Content: React.FC<{ className: string; onOpenAutoFocus?: (e: Event) => void; children: React.ReactNode }>;
  export const Title: React.FC<{ className: string; children: React.ReactNode }>;
  export const Close: React.FC<{ className: string; 'aria-label': string; children: React.ReactNode }>;
}

// UI component declarations (relative to js/ folder where app.tsx lives)
declare module './ui/components/Modal.jsx' { const c: any; export default c; }
declare module './ui/components/ErrorBoundary.jsx' { const c: any; export default c; }
declare module './ui/components/Skeleton.jsx' {
  export function SkeletonLine(props: { width?: string; height?: string; borderRadius?: string; className?: string }): any;
  export function SkeletonCard(props: { rows?: number; className?: string }): any;
  const c: any; export default c;
}
declare module './ui/components/EmptyState.jsx' { const c: any; export default c; }
declare module './ui/pages/TodayPage.jsx' { const c: any; export default c; }
declare module './ui/pages/LogPage.jsx' { const c: any; export default c; }
declare module './ui/pages/AnalyticsPage.jsx' { const c: any; export default c; }
declare module './ui/pages/ProfilePage.jsx' { const c: any; export default c; }
declare module './ui/pages/MethodologyPage.jsx' { const c: any; export default c; }
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
}

declare module '@radix-ui/react-collapsible' {
  export const Root: React.FC<{ open: boolean; onOpenChange: (open: boolean) => void; children: React.ReactNode }>;
  export const Trigger: React.FC<{ className: string; children: React.ReactNode }>;
  export const Content: React.FC<{ className: string; children: React.ReactNode }>;
}
