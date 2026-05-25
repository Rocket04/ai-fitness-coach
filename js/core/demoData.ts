// js/core/demoData.ts
// Deterministic synthetic data generator for Demo Mode
// Creates 30 days of realistic athlete data with seeded randomness
// Now uses the new periodized training system

import type { Session, Checkin } from './types.js';
import { getCurrentPhaseAndWeek, getActiveModules, buildWeeklyPlan } from './planning.js';

/** Seeded pseudo-random number generator (mulberry32) */
function createRNG(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Clamp a number between min and max */
function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.round(v)));
}

/** Generate 30 days of realistic synthetic fitness data */
export function generateDemoData() {
  const rng = createRNG(42);
  
  // Use the new periodization system
  const selectedSports = ['running', 'strength'];
  const weeklyTemplate = {
    days: ['running', 'strength', null, 'running', 'strength', null, 'running'] as (string | null)[],
    sportOrder: selectedSports,
  };
  
  // Start 30 days ago
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 29);
  startDate.setHours(12, 0, 0, 0);
  const startDateStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
  
  const checkins: Checkin[] = [];
  const sessions: Session[] = [];
  
  // Get active modules
  const modules = getActiveModules(selectedSports);
  
  for (let i = 0; i < 30; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + i);
    const date = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
    
    // Simulate recovery patterns: good early, dip mid-month, recovery at end
    const cycle = Math.sin((i / 30) * Math.PI * 2 - Math.PI / 2); // -1 to 1
    const noise = (rng() - 0.5) * 2;
    const recovery = cycle * 0.6 + noise * 0.4; // -1 to 1
    
    // Sleep: 6-9 hours, worse when recovery is low
    const sleepHours = clamp(7.5 + recovery * 1.2 + (rng() - 0.5) * 1.5, 5.5, 9.5);
    
    // HRV: 40-75ms, higher when recovery is good
    const hrv = clamp(55 + recovery * 12 + (rng() - 0.5) * 10, 38, 78);
    
    // RHR: 55-70, lower when recovery is good
    const restHR = clamp(62 - recovery * 5 + (rng() - 0.5) * 6, 52, 72);
    
    // Subjective: correlated with recovery
    const subjBase = 3 + recovery * 1.2;
    const muscleSoreness = clamp(subjBase + 0.8 + rng(), 1, 5);
    const energy = clamp(subjBase + rng() * 0.8, 1, 5);
    const mood = clamp(subjBase + 0.3 + rng() * 0.7, 1, 5);
    const sleepQuality = clamp(sleepHours / 9 * 4 + rng() * 0.8, 1, 5);
    const stress = clamp(3 - recovery * 0.8 + rng() * 0.8, 1, 5);
    
    const checkin: Checkin = {
      date,
      sleepHours: Math.round(sleepHours * 10) / 10,
      restHR: Math.round(restHR),
      hrv: Math.round(hrv),
      hipPain: 0,
      shoulderPain: 0,
      breathing: 'good',
      weight: clamp(78 + rng() * 2 - 1, 76.5, 79.5),
      notes: '',
      muscleSoreness,
      energy,
      mood,
      sleepQuality,
      stress,
      readiness: recovery > 0.3 ? 'green' : recovery > -0.3 ? 'yellow' : 'red',
      ts: Date.now() - (29 - i) * 86400000,
    };
    checkins.push(checkin);
    
    // Generate session using the new planning system
    const { phase, weekInPhase } = getCurrentPhaseAndWeek(startDateStr, i - 29);
    const weekSessions = buildWeeklyPlan(modules, phase, weekInPhase, weeklyTemplate);
    
    const dayOfWeek = currentDate.getDay(); // 0=Sun, 1=Mon, etc.
    const dayIndex = (dayOfWeek + 6) % 7; // Convert to 0=Mon, 6=Sun
    
    const sessionPlan = weekSessions[dayIndex];
    
    if (sessionPlan) {
      const rpe = clamp(6.5 + (1 - recovery) * 1.5 + rng(), 5, 9);
      
      const session: Session = {
        key: `${date}_${sessionPlan.sport}_${sessionPlan.sessionType}`,
        date,
        type: sessionPlan.sport as Session['type'],
        completed: true,
        readiness: recovery > 0.3 ? 'green' : recovery > -0.3 ? 'yellow' : 'red',
        rpe: Math.round(rpe * 10) / 10,
        durationMinutes: sessionPlan.defaultParameters?.duration || 45,
        notes: '',
        mode: sessionPlan.mode,
        updatedAt: Date.now() - (29 - i) * 86400000,
      };
      sessions.push(session);
    }
  }
  
  const settings = {
    startDate: startDateStr,
    trainDays: [1, 3, 5], // Keep for backward compatibility
    checkinTier: 'medium' as const,
    selectedSports,
    selectedGadgets: ['smart_watch'],
  };
  
  return { sessions, checkins, settings };
}

export type DemoProfile = 'marathoner' | 'yogi' | 'crossfitter' | 'rehab';

export interface DemoProfileConfig {
  name: string;
  icon: string;
  description: string;
  selectedSports: string[];
  weeklyTemplate: { days: (string | null)[]; sportOrder: string[] };
  settings: Partial<import('./types.js').Settings> & {
    checkinTier?: 'full' | 'medium' | 'light';
    selectedGadgets?: string[];
    selectedSports?: string[];
    level?: 'beginner' | 'intermediate' | 'advanced';
    goals?: string[];
  };
  // Data generation parameters
  baseHrv: number;
  hrvVariation: number;
  baseRhr: number;
  rhrVariation: number;
  baseSleep: number;
  sleepVariation: number;
  stressLevel: number; // 1-5, higher = more stressed
  sorenessLevel: number; // 1-5, higher = more sore
  consistency: number; // 0-1, how regular the athlete is
  recoveryCycle: number; // days for full recovery cycle
}

export const DEMO_PROFILES: Record<DemoProfile, DemoProfileConfig> = {
  marathoner: {
    name: 'Марафонец',
    icon: '🏃',
    description: 'Выносливость, высокая ЧСС, стабильный HRV',
    selectedSports: ['running'],
    weeklyTemplate: {
      days: ['running', 'running', null, 'running', null, 'running', null],
      sportOrder: ['running'],
    },
    settings: {
      startDate: '',
      trainDays: [1, 2, 4, 6],
      checkinTier: 'full',
      selectedGadgets: ['smart_watch', 'hr_monitor'],
      selectedSports: ['running'],
      level: 'advanced',
      goals: ['endurance'],
      equipment: '',
    },
    baseHrv: 62,
    hrvVariation: 15,
    baseRhr: 52,
    rhrVariation: 8,
    baseSleep: 8,
    sleepVariation: 1,
    stressLevel: 2,
    sorenessLevel: 2,
    consistency: 0.95,
    recoveryCycle: 28,
  },
  yogi: {
    name: 'Йог',
    icon: '🧘',
    description: 'Низкая ЧСС, высокий HRV, низкий стресс',
    selectedSports: ['yoga', 'stretching'],
    weeklyTemplate: {
      days: ['yoga', 'stretching', 'yoga', null, 'yoga', 'stretching', null],
      sportOrder: ['yoga', 'stretching'],
    },
    settings: {
      startDate: '',
      trainDays: [1, 2, 3, 5, 6],
      checkinTier: 'medium',
      selectedGadgets: ['smart_watch'],
      selectedSports: ['yoga', 'stretching'],
      level: 'intermediate',
      goals: ['endurance'],
      equipment: '',
    },
    baseHrv: 72,
    hrvVariation: 12,
    baseRhr: 58,
    rhrVariation: 6,
    baseSleep: 8.5,
    sleepVariation: 0.8,
    stressLevel: 1,
    sorenessLevel: 1,
    consistency: 0.85,
    recoveryCycle: 21,
  },
  crossfitter: {
    name: 'Кроссфиттер',
    icon: '🏋️',
    description: 'Высокая вариативность, сила + нон-стоп',
    selectedSports: ['strength_gym', 'running'],
    weeklyTemplate: {
      days: ['strength_gym', 'running', 'strength_gym', 'running', 'strength_gym', null, null],
      sportOrder: ['strength_gym', 'running'],
    },
    settings: {
      startDate: '',
      trainDays: [1, 2, 3, 4, 5],
      checkinTier: 'full',
      selectedGadgets: ['smart_watch', 'hr_monitor'],
      selectedSports: ['strength_gym', 'running'],
      level: 'advanced',
      goals: ['strength', 'hypertrophy'],
      equipment: '',
    },
    baseHrv: 52,
    hrvVariation: 18,
    baseRhr: 65,
    rhrVariation: 10,
    baseSleep: 7,
    sleepVariation: 1.5,
    stressLevel: 3,
    sorenessLevel: 3,
    consistency: 0.8,
    recoveryCycle: 35,
  },
  rehab: {
    name: 'Рехаб',
    icon: '🩹',
    description: 'Восстановление после травмы, ограниченная активность',
    selectedSports: ['yoga', 'walking'],
    weeklyTemplate: {
      days: ['yoga', null, 'walking', 'yoga', null, 'walking', null],
      sportOrder: ['yoga', 'walking'],
    },
    settings: {
      startDate: '',
      trainDays: [1, 3, 5],
      checkinTier: 'full',
      selectedGadgets: ['smart_watch'],
      selectedSports: ['yoga', 'walking'],
      level: 'beginner',
      goals: ['rehabilitation'],
      equipment: '',
    },
    baseHrv: 48,
    hrvVariation: 20,
    baseRhr: 68,
    rhrVariation: 12,
    baseSleep: 6.5,
    sleepVariation: 2,
    stressLevel: 4,
    sorenessLevel: 4,
    consistency: 0.7,
    recoveryCycle: 42,
  },
};

/** Generate demo data for a specific athlete profile */
export function generateDemoDataForProfile(profile: DemoProfile) {
  const config = DEMO_PROFILES[profile];
  const rng = createRNG(hashCode(profile)); // Deterministic seed from profile name
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 29);
  startDate.setHours(12, 0, 0, 0);
  const startDateStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;

  const checkins: Checkin[] = [];
  const sessions: Session[] = [];

  const selectedSports = config.selectedSports;
  const weeklyTemplate = config.weeklyTemplate;

  const modules = getActiveModules(selectedSports);

  for (let i = 0; i < 30; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + i);
    const date = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;

    // Simulation: recovery pattern based on profile
    const cycle = Math.sin((i / config.recoveryCycle) * Math.PI * 2 - Math.PI / 2);
    const noise = (rng() - 0.5) * 2;
    const recovery = cycle * 0.6 + noise * 0.4;

    // Missing data based on consistency
    const hasData = rng() < config.consistency;

    if (hasData) {
      const sleepHours = clamp(config.baseSleep + recovery * config.sleepVariation + (rng() - 0.5) * 1.5, 5, 10);
      const hrv = clamp(config.baseHrv + recovery * config.hrvVariation + (rng() - 0.5) * config.hrvVariation * 0.5, 30, 90);
      const restHR = clamp(config.baseRhr - recovery * config.rhrVariation + (rng() - 0.5) * config.rhrVariation * 0.5, 45, 80);

      const subjBase = 2.5 + recovery * 1.5 + (config.stressLevel - 3) * -0.3;
      const muscleSoreness = clamp(subjBase + config.sorenessLevel * 0.3 + rng(), 1, 5);
      const energy = clamp(subjBase + rng() * 0.8, 1, 5);
      const mood = clamp(subjBase + 0.3 + rng() * 0.7, 1, 5);
      const sleepQuality = clamp(sleepHours / 9 * 4 + rng() * 0.8, 1, 5);
      const stress = clamp(config.stressLevel - recovery * 0.8 + rng() * 0.8, 1, 5);

      checkins.push({
        date,
        sleepHours: Math.round(sleepHours * 10) / 10,
        restHR: Math.round(restHR),
        hrv: Math.round(hrv),
        hipPain: profile === 'rehab' ? clamp(3 + rng() * 2, 1, 5) : 0,
        shoulderPain: 0,
        breathing: recovery > 0 ? 'good' : recovery > -0.3 ? 'mild' : 'bad',
        weight: clamp(75 + rng() * 10 - 5 + (profile === 'crossfitter' ? 8 : profile === 'yogi' ? -5 : 0), 60, 95),
        notes: '',
        muscleSoreness,
        energy,
        mood,
        sleepQuality,
        stress,
        readiness: recovery > 0.3 ? 'green' : recovery > -0.3 ? 'yellow' : 'red',
        ts: Date.now() - (29 - i) * 86400000,
      });
    } else {
      // Partial data — checkin only, no session
      checkins.push({
        date,
        sleepHours: clamp(config.baseSleep + (rng() - 0.5) * 2, 5, 10),
        restHR: 0,
        hrv: 0,
        hipPain: 0,
        shoulderPain: 0,
        breathing: 'good',
        weight: 0,
        notes: '',
        muscleSoreness: 0,
        energy: 0,
        mood: 0,
        sleepQuality: 0,
        stress: 0,
        readiness: 'green',
        ts: Date.now() - (29 - i) * 86400000,
      });
    }

    const { phase, weekInPhase } = getCurrentPhaseAndWeek(startDateStr, i - 29);
    const weekSessions = buildWeeklyPlan(modules, phase, weekInPhase, weeklyTemplate);

    const dayOfWeek = currentDate.getDay();
    const dayIndex = (dayOfWeek + 6) % 7;
    const sessionPlan = weekSessions[dayIndex];

    if (sessionPlan && hasData) {
      const rpe = clamp(6 + (1 - recovery) * 2 + (config.sorenessLevel - 2) * 0.3 + rng() * 1.5, 4, 9);
      sessions.push({
        key: `${date}_${sessionPlan.sport}_${sessionPlan.sessionType}`,
        date,
        type: sessionPlan.sport as Session['type'],
        completed: true,
        readiness: recovery > 0.3 ? 'green' : recovery > -0.3 ? 'yellow' : 'red',
        rpe: Math.round(rpe * 10) / 10,
        durationMinutes: sessionPlan.defaultParameters?.duration || 45,
        notes: '',
        mode: sessionPlan.mode,
        updatedAt: Date.now() - (29 - i) * 86400000,
      });
    }
  }

  return { sessions, checkins, settings: { ...config.settings, startDate: startDateStr } };
}

/** Simple string hash for deterministic seeding */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}
