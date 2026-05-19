// js/core/types.ts
// TypeScript type definitions for the fitness tracker application

export type ReadinessStatus = 'green' | 'yellow' | 'red';
export type ManualStatus = 'green' | 'yellow' | 'red' | 'unknown';
export type WorkoutType = 'A' | 'B' | 'C' | null;
export type SessionType = 'A' | 'B' | 'C' | 'rest' | 'morning' | 'evening' | 'mobility';
export type SessionMode = 'full' | 'yellow' | 'minimum';
export type BreathingStatus = 'good' | 'mild' | 'bad';
export type ToastType = 'success' | 'error';

export interface Checkin {
  date: string;
  sleepHours: number;
  restHR: number;
  hrv: number;
  hipPain: number;
  shoulderPain: number;
  breathing: BreathingStatus;
  weight: number;
  notes: string;
  muscleSoreness: number;
  energy: number;
  mood: number;
  sleepQuality: number;
  stress: number;
  motivation?: number;
  readiness?: ReadinessStatus;
  ts?: number;
}

export interface WeeklySummary {
  completed: number;
  avgRPE: number | null;
  green: number;
  yellow: number;
  red: number;
  dominantStatus: string;
}

export interface MonthStats {
  completed: number;
  green: number;
  yellow: number;
  red: number;
}

export interface TrendPoint {
  date: string;
  recoveryScore: number;
  hrv: number;
  restHR: number;
  sleepHours: number;
}

export interface RpeTrendPoint {
  date: string;
  rpe: number;
  type: string;
}

export interface WeeklyAverage {
  weekStart: string;
  avgRecoveryScore: number;
  avgHrv: number;
  avgRestHR: number;
}

export interface TrendWarning {
  type: string;
  severity: 'high' | 'medium' | 'low';
  metric: string;
  consecutiveDays: number;
  currentValue: number;
  message: string;
  recommendation: string;
  apreAction: string;
}

export interface OvertrainingWarning {
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  recommendation: string;
  apreOverride?: string;
}

export interface TestResults {
  pullUps: number;
  pushUps: number;
  plankSec: number;
}

export interface Exercise {
  n: string; // name
  s: string; // sets
  r: string; // reps
  w?: string; // weight/notes
  isTest?: boolean;
}

export interface Session {
  key: string;
  date: string;
  type: SessionType;
  completed: boolean;
  readiness: ReadinessStatus;
  rpe: number;
  durationMinutes?: number;
  sessionLoad?: number;
  hipPain?: number;
  shoulderPain?: number;
  notes: string;
  testResults?: TestResults;
  mode?: SessionMode;
  updatedAt: number;
}

export interface SessionPlan {
  type: WorkoutType;
  exercises: Exercise[];
  mode: SessionMode;
  monthColor: string;
  isTestDay?: boolean;
}

export interface Settings {
  startDate: string;
  trainDays: number[];
}

export interface AppState {
  // Core data
  sessions: Session[];
  checkins: Checkin[];
  dataLoaded: boolean;
  
  // Settings
  startDate: string | null;
  trainDays: number[];
  
  // Checkin form
  weight: number;
  restHR: number;
  hrv: number;
  sleepHours: number;
  hipPain: number;
  shoulderPain: number;
  breathing: BreathingStatus;
  notes: string;
  muscleSoreness: number;
  energy: number;
  mood: number;
  sleepQuality: number;
  stress: number;
  
  // Session form
  rpe: number;
  sessionNote: string;
  durationMinutes: number;
  testPullUps: number;
  testPushUps: number;
  testPlank: number;
  
  // UI state
  activeTab: number;
  showReadiness: boolean;
  manualOverride: ManualStatus;
  showSettings: boolean;
  editStartDate: string;
  editTrainDays: number[];
  toast: {
    message: string;
    type: ToastType;
    visible: boolean;
  };
  
  // Dates
  todayISO: string;
  todayDate: Date;
  tomorrowDate: Date;
  
  // Derived: readiness
  lastCheckin: Checkin | null;
  autoReadiness: ReadinessStatus;
  readiness: ReadinessStatus;
  recoveryDebt: boolean;
  recoveryScore: number;
  
  // Derived: plan
  weekNumber: number;
  weekLabel: string;
  trainType: WorkoutType;
  tomorrowType: WorkoutType;
  month: any;
  dayIndex: number | null;
  weeklySummary: WeeklySummary;
  sessionPlan: SessionPlan | null;
  tomorrowPlan: SessionPlan | null;
  totalMultiplier: number;
  apreSession: Session | null;
  apreReasons: string[];
  
  // Derived: stats
  testHistory: Array<{ date: string; testResults: TestResults }>;
  monthStats: MonthStats;
  morningDone: boolean;
  eveningDone: boolean;
  trainingDone: boolean;
  streak: number;
  coachAdvice: string[];
  
  // Derived: analytics
  trendData7: TrendPoint[];
  trendData30: TrendPoint[];
  rpeTrend7: RpeTrendPoint[];
  rpeTrend30: RpeTrendPoint[];
  weeklyAverages: WeeklyAverage[];
  trendWarnings: TrendWarning[];
  overtrainingWarning: OvertrainingWarning | null;
}

export interface AppDispatch {
  // Checkin setters
  setWeight: (value: number) => void;
  setRestHR: (value: number) => void;
  setHrv: (value: number) => void;
  setSleepHours: (value: number) => void;
  setHipPain: (value: number) => void;
  setShoulderPain: (value: number) => void;
  setBreathing: (value: BreathingStatus) => void;
  setNotes: (value: string) => void;
  setMuscleSoreness: (value: number) => void;
  setEnergy: (value: number) => void;
  setMood: (value: number) => void;
  setSleepQuality: (value: number) => void;
  setStress: (value: number) => void;
  
  // Session setters
  setRpe: (value: number) => void;
  setSessionNote: (value: string) => void;
  setDurationMinutes: (value: number) => void;
  setTestPullUps: (value: number) => void;
  setTestPushUps: (value: number) => void;
  setTestPlank: (value: number) => void;
  
  // UI setters
  setActiveTab: (value: number) => void;
  setShowReadiness: (value: boolean) => void;
  setShowSettings: (value: boolean) => void;
  setEditStartDate: (value: string) => void;
  setEditTrainDays: (value: number[]) => void;
  
  // Actions
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  openSettings: () => void;
  toggleDay: (day: number) => void;
  handleSaveSettings: () => Promise<void>;
  handleSaveCheckin: () => Promise<void>;
  handleManualOverrideChange: (status: ManualStatus) => Promise<void>;
  handleMarkMorning: () => Promise<void>;
  handleMarkEvening: () => Promise<void>;
  handleToggleTraining: () => Promise<void>;
  handleExportData: () => Promise<void>;
  handleImportData: (file: File) => Promise<void>;
  handleResetAll: () => Promise<void>;
}
