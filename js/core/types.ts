// js/core/types.ts
// TypeScript type definitions for the fitness tracker application

export type ReadinessStatus = 'green' | 'yellow' | 'red';
export type ManualStatus = 'green' | 'yellow' | 'red' | 'unknown';
export type WorkoutType = 'A' | 'B' | 'C' | null;
export type SessionType = 'A' | 'B' | 'C' | 'rest' | 'morning' | 'evening' | 'mobility';
export type SessionMode = 'full' | 'yellow' | 'minimum' | 'deload';
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
  notes?: string;
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

export type ApreProtocolKey = 'APRE_3' | 'APRE_6' | 'APRE_10';
export type ApreUnit = 'kg' | 'lbs';

/** Результат одного AMRAP-сета (set3 или set4) */
export interface ApreSetResult {
  reps: number;
  weight: number;
}

/** Итог APRE-упражнения, сохраняемый в Session */
export interface ApreExerciseResult {
  exerciseName: string;
  protocol: ApreProtocolKey;
  /** Расчётный RM для следующей недели (на основе set4 AMRAP) */
  nextRM: number;
  unit: ApreUnit;
  isCalisthenics: boolean;
  lastSet3Reps: number;
  lastSet4Reps: number;
  /** Уровень прогрессии при калистенике (1-5) */
  calisthenicLevel?: number;
}

/** Результат выполнения одного подхода упражнения */
export interface SetResult {
  setNumber: number;
  completed: boolean;
  repsDone: number;
  /** Exercise name this set belongs to */
  exerciseName?: string;
  /** RPE (Rate of Perceived Exertion) for this set, 1–10 scale */
  rpe?: number;
}

/** Результат выполнения упражнения (для не-APRE упражнений) */
export interface ExerciseResult {
  exerciseName: string;
  plannedSets: number;
  completedSets: number;
  repsPerSet: number[];
  /** Per-set RPE values (1–10), aligned with repsPerSet by index */
  rpePerSet: number[];
  completed: boolean;
}

export interface Exercise {
  n: string; // name
  s: string; // sets
  r: string; // reps
  w?: string; // weight/notes
  isTest?: boolean;
  // APRE extension (optional — только у помеченных силовых)
  isApre?: boolean;
  protocol?: ApreProtocolKey;
  /** Текущий тренировочный максимум (кг или lbs) */
  currentRM?: number;
  unit?: ApreUnit;
  isCalisthenics?: boolean;
  /** Уровень прогрессии при калистенике (1-5) */
  calisthenicLevel?: number;
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
  /** Результаты APRE-упражнений текущей тренировки */
  apreResults?: ApreExerciseResult[];
  /** Results of non-APRE exercises (set completion tracking) */
  exerciseResults?: ExerciseResult[];
  /** User-reported fatigue after training (1-10 scale, optional) */
  postSessionFatigue?: number;
  /** User-reported pain after training (0-10 scale, optional) */
  postSessionPain?: number;
  /** Total planned sets for this session (computed at plan generation, used for completion rate) */
  plannedTotalSets?: number;
}

export type PhaseType = 'base' | 'build' | 'peak' | 'deload';

export interface SessionPlan {
  sessionId: string;
  date: string;
  sport: 'running' | 'strength' | 'cycling' | 'mobility' | 'swimming' | 'calisthenics' | 'strength_gym' | 'yoga' | 'stretching' | 'walking' | 'rest';
  sessionType: 'endurance' | 'tempo' | 'intervals' | 'hypertrophy' | 'strength' | 'power' | 'recovery' | 'mobility';
  name: string;
  description: string;
  defaultParameters: Record<string, number>;
  exercises: Exercise[];
  mode: SessionMode;
  isDeload: boolean;
  isRestDay: boolean;
  apreRule?: {
    type: 'scalar' | 'reps' | 'load';
    scaleBy: string;
    modifiers: { green: number; yellow: number; red: number };
  };
  alternativeForCrossTraining?: string;
}

export interface SportPlanModule {
  sport: string;
  phases: {
    base: (weekInPhase: number) => Omit<SessionPlan, 'date' | 'sessionId'>[];
    build: (weekInPhase: number) => Omit<SessionPlan, 'date' | 'sessionId'>[];
    peak: (weekInPhase: number) => Omit<SessionPlan, 'date' | 'sessionId'>[];
    deload: (weekInPhase: number) => Omit<SessionPlan, 'date' | 'sessionId'>[];
  };
}

export interface WeeklyTemplate {
  days: (string | null)[];
  sportOrder: string[];
}

export interface Settings {
  startDate: string;
  trainDays: number[];
  rehabIssues?: string[];
  rehabExercises?: string[];
  level?: string;
  goals?: string[];
  equipment?: string; // JSON serialized Equipment
}

export type RehabIssue = 'hips' | 'shoulder' | 'back' | 'knees' | 'neck' | 'elbow' | 'wrist';

export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';
export type FitnessGoal = 'hypertrophy' | 'strength' | 'endurance' | 'rehabilitation';

export interface Equipment {
  dumbbells_max_kg?: number;
  pullup_bar?: boolean;
  dip_bars?: boolean;
  resistance_bands?: boolean;
  barbell?: boolean;
  kettlebell?: boolean;
}

export interface UserProfile {
  selectedSports: string[];
  trainDays: number[];
  checkinTier: 'full' | 'medium' | 'light';
  selectedGadgets: string[];
  rehabIssues: RehabIssue[];
  rehabExercises: string[];
  level: FitnessLevel;
  goals: FitnessGoal[];
  equipment: Equipment;
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
  month: unknown;
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
  updateSetResult: (result: SetResult) => void;
  setPostSessionFatigue: (v: number) => void;
  setPostSessionPain: (v: number) => void;
}
