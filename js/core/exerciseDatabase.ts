// js/core/exerciseDatabase.ts
// Exercise library with rehabilitation metadata
// Each exercise has: id, name, targetMuscles, equipment, avoidIf (contraindicated for rehabIssues), rehabFor (helps with rehabIssues)

import type { Exercise } from './types.js';

export interface ExerciseInfo {
  id: string;
  name: string;
  targetMuscles: string[];
  equipment: string[];
  avoidIf: string[]; // rehabIssues that contraindicate this exercise
  rehabFor: string[]; // rehabIssues this exercise helps with
}

export const exerciseLibrary: Record<string, ExerciseInfo> = {  // === STRENGTH EXERCISES ===
  'squat': {
    id: 'squat',
    name: 'Prisedaniya so shtangoy',
    targetMuscles: ['quads', 'glutes', 'core'],
    equipment: ['barbell'],
    avoidIf: ['knees', 'back'],
    rehabFor: ['hips'],
  },
  'deadlift': {
    id: 'deadlift',
    name: 'Stanovaya tyaga',
    targetMuscles: ['hamstrings', 'glutes', 'back', 'core'],
    equipment: ['barbell'],
    avoidIf: ['back', 'knees'],
    rehabFor: [],
  },
  'bench_press': {
    id: 'bench_press',
    name: 'Zhim lezha',
    targetMuscles: ['chest', 'triceps', 'shoulders'],
    equipment: ['barbell', 'bench'],
    avoidIf: ['shoulder'],
    rehabFor: [],
  },
  'overhead_press': {
    id: 'overhead_press',
    name: 'Zhim stoya',
    targetMuscles: ['shoulders', 'triceps', 'core'],
    equipment: ['barbell'],
    avoidIf: ['shoulder', 'neck'],
    rehabFor: [],
  },
  'barbell_row': {
    id: 'barbell_row',
    name: 'Tyaga v naklone',
    targetMuscles: ['back', 'biceps', 'rear_delts'],
    equipment: ['barbell'],
    avoidIf: ['back'],
    rehabFor: [],
  },
  'pull_up': {
    id: 'pull_up',
    name: 'Podtyagivaniya',
    targetMuscles: ['back', 'biceps', 'core'],
    equipment: ['pull_up_bar'],
    avoidIf: ['shoulder', 'elbow'],
    rehabFor: [],
  },
  'push_up': {
    id: 'push_up',
    name: 'Otzhimaniya',
    targetMuscles: ['chest', 'triceps', 'shoulders'],
    equipment: [],
    avoidIf: ['shoulder', 'wrist'],
    rehabFor: [],
  },
  'dip': {
    id: 'dip',
    name: 'Otzhimaniya na brys',
    targetMuscles: ['chest', 'triceps', 'shoulders'],
    equipment: ['dip_bars'],
    avoidIf: ['shoulder', 'elbow'],
    rehabFor: [],
  },
  'lunge': {
    id: 'lunge',
    name: 'Vypady',
    targetMuscles: ['quads', 'glutes', 'hamstrings'],
    equipment: [],
    avoidIf: ['knees'],
    rehabFor: ['hips'],
  },
  'leg_press': {
    id: 'leg_press',
    name: 'Zhim nogami',
    targetMuscles: ['quads', 'glutes', 'hamstrings'],
    equipment: ['leg_press_machine'],
    avoidIf: ['knees'],
    rehabFor: [],
  },
  'romanian_deadlift': {
    id: 'romanian_deadlift',
    name: 'Rumynskaya tyaga',
    targetMuscles: ['hamstrings', 'glutes', 'back'],
    equipment: ['barbell'],
    avoidIf: ['back'],
    rehabFor: ['hips'],
  },
  'hip_thrust': {
    id: 'hip_thrust',
    name: 'Yagodichnyy most',
    targetMuscles: ['glutes', 'hamstrings'],
    equipment: [],
    avoidIf: [],
    rehabFor: ['hips', 'knees'],
  },
  'plank': {
    id: 'plank',
    name: 'Planka',
    targetMuscles: ['core', 'shoulders'],
    equipment: [],
    avoidIf: [],
    rehabFor: ['back'],
  },
  // === CALISTHENICS ===
  'muscle_up': {
    id: 'muscle_up',
    name: 'Muscle-up',
    targetMuscles: ['back', 'chest', 'triceps', 'core'],
    equipment: ['rings', 'pull_up_bar'],
    avoidIf: ['shoulder', 'elbow', 'wrist'],
    rehabFor: [],
  },
  'handstand': {
    id: 'handstand',
    name: 'Handstand',
    targetMuscles: ['shoulders', 'core', 'wrists'],
    equipment: [],
    avoidIf: ['shoulder', 'wrist', 'neck'],
    rehabFor: [],
  },
  'pistol_squat': {
    id: 'pistol_squat',
    name: 'Pistol squat',
    targetMuscles: ['quads', 'glutes', 'core'],
    equipment: [],
    avoidIf: ['knees'],
    rehabFor: ['hips'],
  },
  'dragon_flag': {
    id: 'dragon_flag',
    name: 'Dragon flag',
    targetMuscles: ['core', 'hip_flexors'],
    equipment: [],
    avoidIf: ['back'],
    rehabFor: [],
  },
  // === YOGA / MOBILITY ===
  'cat_cow': {
    id: 'cat_cow',
    name: 'Koska-korova',
    targetMuscles: ['spine', 'core'],
    equipment: [],
    avoidIf: [],
    rehabFor: ['back', 'neck'],
  },
  'child_pose': {
    id: 'child_pose',
    name: 'Detskaya poza',
    targetMuscles: ['back', 'hips', 'shoulders'],
    equipment: [],
    avoidIf: [],
    rehabFor: ['back', 'hips', 'shoulder'],
  },
  'pigeon_pose': {
    id: 'pigeon_pose',
    name: 'Poza golubya',
    targetMuscles: ['hips', 'glutes'],
    equipment: [],
    avoidIf: [],
    rehabFor: ['hips', 'knees'],
  },
  'cow_face_pose': {
    id: 'cow_face_pose',
    name: 'Poza korovya litso',
    targetMuscles: ['shoulders', 'hips'],
    equipment: [],
    avoidIf: ['shoulder'],
    rehabFor: ['shoulder'],
  },
  'thread_the_needle': {
    id: 'thread_the_needle',
    name: 'Protezhanie igly',
    targetMuscles: ['shoulders', 'upper_back'],
    equipment: [],
    avoidIf: [],
    rehabFor: ['shoulder', 'neck'],
  },
  'wrist_stretch': {
    id: 'wrist_stretch',
    name: 'Raztyazhka zapasty',
    targetMuscles: ['wrists', 'forearms'],
    equipment: [],
    avoidIf: [],
    rehabFor: ['wrist', 'elbow'],
  },
  'neck_stretch': {
    id: 'neck_stretch',
    name: 'Raztyazhka shei',
    targetMuscles: ['neck'],
    equipment: [],
    avoidIf: [],
    rehabFor: ['neck'],
  },
  'clamshell': {
    id: 'clamshell',
    name: 'Clamshell',
    targetMuscles: ['glutes', 'hips'],
    equipment: ['resistance_band'],
    avoidIf: [],
    rehabFor: ['hips', 'knees'],
  },
  'dead_bug': {
    id: 'dead_bug',
    name: 'Dead bug',
    targetMuscles: ['core', 'hip_flexors'],
    equipment: [],
    avoidIf: [],
    rehabFor: ['back'],
  },
  'bird_dog': {
    id: 'bird_dog',
    name: 'Bird dog',
    targetMuscles: ['core', 'back', 'glutes'],
    equipment: [],
    avoidIf: [],
    rehabFor: ['back'],
  },
  'wall_slide': {
    id: 'wall_slide',
    name: 'Wall slide',
    targetMuscles: ['shoulders', 'upper_back'],
    equipment: [],
    avoidIf: [],
    rehabFor: ['shoulder'],
  },
  'face_pull': {
    id: 'face_pull',
    name: 'Face pull',
    targetMuscles: ['rear_delts', 'upper_back', 'rotator_cuff'],
    equipment: ['cable', 'resistance_band'],
    avoidIf: [],
    rehabFor: ['shoulder'],
  },
  'external_rotation': {
    id: 'external_rotation',
    name: 'Vneshnyaya rotatsiya plecha',
    targetMuscles: ['rotator_cuff', 'rear_delts'],
    equipment: ['resistance_band', 'dumbbell'],
    avoidIf: [],
    rehabFor: ['shoulder'],
  },
  // === CARDIO ===
  'running_easy': {
    id: 'running_easy',
    name: 'Legkiy beg',
    targetMuscles: ['quads', 'hamstrings', 'calves', 'core'],
    equipment: [],
    avoidIf: ['knees', 'hips', 'back'],
    rehabFor: [],
  },
  'running_tempo': {
    id: 'running_tempo',
    name: 'Tempovyy beg',
    targetMuscles: ['quads', 'hamstrings', 'calves', 'core'],
    equipment: [],
    avoidIf: ['knees', 'hips', 'back'],
    rehabFor: [],
  },
  'cycling_easy': {
    id: 'cycling_easy',
    name: 'Legkaya ezda na velosipede',
    targetMuscles: ['quads', 'hamstrings', 'calves'],
    equipment: ['bike'],
    avoidIf: ['knees'],
    rehabFor: ['knees', 'hips'],
  },
  'swimming_easy': {
    id: 'swimming_easy',
    name: 'Legkoe plavanie',
    targetMuscles: ['full_body'],
    equipment: ['pool'],
    avoidIf: ['shoulder'],
    rehabFor: ['back', 'knees', 'hips'],
  },
  'walking': {
    id: 'walking',
    name: 'Khodba',
    targetMuscles: ['quads', 'hamstrings', 'calves'],
    equipment: [],
    avoidIf: [],
    rehabFor: ['knees', 'hips', 'back'],
  },
  'nordic_walking': {
    id: 'nordic_walking',
    name: 'Skandinavskaya khodba',
    targetMuscles: ['full_body'],
    equipment: ['poles'],
    avoidIf: ['shoulder', 'wrist'],
    rehabFor: ['back', 'knees'],
  },
};

// Helper: get exercises that are safe for a given set of rehab issues
export function getSafeExercises(rehabIssues: string[]): ExerciseInfo[] {
  if (!rehabIssues || rehabIssues.length === 0) {
    return Object.values(exerciseLibrary);
  }
  return Object.values(exerciseLibrary).filter(ex => {
    // Exclude if any of the user's rehabIssues is in the exercise's avoidIf
    return !ex.avoidIf.some(issue => rehabIssues.includes(issue));
  });
}

// Helper: get rehab exercises for specific issues
export function getRehabExercises(rehabIssues: string[]): ExerciseInfo[] {
  if (!rehabIssues || rehabIssues.length === 0) {
    return [];
  }
  return Object.values(exerciseLibrary).filter(ex => {
    return ex.rehabFor.some(issue => rehabIssues.includes(issue));
  });
}

// Helper: filter exercise list by replacing contraindicated exercises with rehab alternatives
export function filterExercisesForRehab(
  exercises: { n: string; s: string; r: string }[],
  rehabIssues: string[],
  rehabExercises: string[]
): { exercises: { n: string; s: string; r: string }[]; wasAdapted: boolean } {
  if (!rehabIssues || rehabIssues.length === 0) {
    return { exercises, wasAdapted: false };
  }

  const safeList = getSafeExercises(rehabIssues);
  const safeNames = new Set(safeList.map(e => e.name.toLowerCase()));
  const rehabList = getRehabExercises(rehabIssues);

  const result: { n: string; s: string; r: string }[] = [];
  let wasAdapted = false;
  let replacedCount = 0;

  for (const ex of exercises) {
    const exNameLower = ex.n.toLowerCase();
    const isSafe = safeNames.has(exNameLower) || !Object.values(exerciseLibrary).some(
      lib => lib.name.toLowerCase() === exNameLower && lib.avoidIf.some(i => rehabIssues.includes(i))
    );

    if (isSafe) {
      result.push(ex);
    } else {
      wasAdapted = true;
      replacedCount++;
      // Add up to 2 rehab exercises per replaced exercise
      const availableRehab = rehabList.filter(r =>
        !result.some(existing => existing.n === r.name) &&
        (!rehabExercises.length || rehabExercises.includes(r.id))
      );
      for (let i = 0; i < Math.min(2, availableRehab.length); i++) {
        result.push({ n: availableRehab[i].name, s: '3', r: '8-10' });
      }
      // If no specific rehab exercises found, add generic mobility
      if (availableRehab.length === 0) {
        result.push({ n: 'Raztyazhka / Mobilnost', s: '-', r: '10 min' });
      }
    }
  }

  return { exercises: result, wasAdapted };
}

const FALLBACK_STRETCHING: Exercise[] = [
  { n: 'Mobilnost (bezopasnaya)', s: '2', r: '5 min', w: 'bez nagruzki na problemnye zony' },
  { n: 'Dykhatelnaya gimnastika', s: '3', r: '10 vdokhov', w: 'rasslablenie' },
];

export function filterStretchingForRehab(exercises: Exercise[], rehabIssues: string[]): Exercise[] {
  if (!rehabIssues || rehabIssues.length === 0) return exercises;
  const filtered = exercises.filter(ex => {
    const exId = (ex as any).id as string | undefined;
    if (!exId) return true;
    const info = exerciseLibrary[exId];
    if (!info) return true;
    return !info.avoidIf.some(item => rehabIssues.includes(item));
  });
  return filtered.length > 0 ? filtered : FALLBACK_STRETCHING;
}
