import type {
  Session,
  Checkin,
  FitnessLevel,
  FitnessGoal,
  Equipment,
} from '../../core/types.js';
import type { CheckinTier } from '../../domains/recovery/recoveryScore.js';

export interface DataSlice {
  sessions: Session[];
  checkins: Checkin[];
  dataLoaded: boolean;
  startDate: string | null;
  trainDays: number[];
  checkinTier: CheckinTier;
  selectedGadgets: string[];
  selectedSports: string[];
  virtualTodayOffset: number;
  rehabIssues: string[];
  rehabExercises: string[];
  profileLevel: FitnessLevel;
  profileGoals: FitnessGoal[];
  profileEquipment: Equipment;
}

export function createDataSlice(): DataSlice {
  return {
    sessions: [],
    checkins: [],
    dataLoaded: false,
    startDate: null,
    trainDays: [1, 2, 3, 4, 5, 6],
    checkinTier: 'medium' as CheckinTier,
    selectedGadgets: [],
    selectedSports: ['calisthenics', 'walking', 'stretching'],
    virtualTodayOffset: 0,
    rehabIssues: ['hips', 'shoulder', 'back'],
    rehabExercises: [],
    profileLevel: 'beginner' as FitnessLevel,
    profileGoals: ['rehabilitation'] as FitnessGoal[],
    profileEquipment: { pullup_bar: true, dumbbells_max_kg: 4 } as Equipment,
  };
}
