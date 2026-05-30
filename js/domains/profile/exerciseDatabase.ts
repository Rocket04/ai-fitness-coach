import type { Exercise } from '../../core/types.js';

export interface ExerciseInfo {
  id: string;
  name: string;
  targetMuscles: string[];
  equipment: string[];
  avoidIf: string[];
  rehabFor: string[];
  techniqueNotes?: string;
  defaultSets?: string;
  defaultReps?: string;
  perSide?: boolean;
  frequency?: string;
  substituteWith?: string[];
}

export const exerciseLibrary: Record<string, ExerciseInfo> = {  'squat': {
    id: 'squat',
    name: 'Приседания со штангой',
    targetMuscles: ['quads', 'glutes', 'core'],
    equipment: ['barbell'],
    avoidIf: ['knees', 'back'],
    rehabFor: ['hips'],
  },
  'deadlift': {
    id: 'deadlift',
    name: 'Становая тяга',
    targetMuscles: ['hamstrings', 'glutes', 'back', 'core'],
    equipment: ['barbell'],
    avoidIf: ['back', 'knees'],
    rehabFor: [],
  },
  'bench_press': {
    id: 'bench_press',
    name: 'Жим лежа',
    targetMuscles: ['chest', 'triceps', 'shoulders'],
    equipment: ['barbell', 'bench'],
    avoidIf: ['shoulder'],
    rehabFor: [],
  },
  'overhead_press': {
    id: 'overhead_press',
    name: 'Жим стоя',
    targetMuscles: ['shoulders', 'triceps', 'core'],
    equipment: ['barbell'],
    avoidIf: ['shoulder', 'neck'],
rehabFor: [],
  },
  'barbell_row': {
    id: 'barbell_row',
    name: 'Тяга в наклоне',
    targetMuscles: ['back', 'biceps', 'rear_delts'],
    equipment: ['barbell'],
    avoidIf: ['back'],
    rehabFor: [],
  },
  'push_up': {
    id: 'push_up',
    name: 'Отжимания',
    targetMuscles: ['chest', 'triceps', 'shoulders'],
    equipment: [],
    avoidIf: ['shoulder', 'wrist'],
    rehabFor: [],
  },
  'dip': {
    id: 'dip',
    name: 'Отжимания на брусьях',
    targetMuscles: ['chest', 'triceps', 'shoulders'],
    equipment: ['dip_bars'],
    avoidIf: ['shoulder', 'elbow'],
    rehabFor: [],
  },
  'lunge': {
    id: 'lunge',
    name: 'Выпады',
    targetMuscles: ['quads', 'glutes', 'hamstrings'],
    equipment: [],
    avoidIf: ['knees'],
    rehabFor: ['hips'],
  },
  'leg_press': {
    id: 'leg_press',
    name: 'Жим ногами',
    targetMuscles: ['quads', 'glutes', 'hamstrings'],
    equipment: ['leg_press_machine'],
    avoidIf: ['knees'],
    rehabFor: [],
  },
  'romanian_deadlift': {
    id: 'romanian_deadlift',
    name: 'Румынская тяга',
    targetMuscles: ['hamstrings', 'glutes', 'back'],
    equipment: ['barbell'],
    avoidIf: ['back'],
    rehabFor: ['hips'],
  },
  'hip_thrust': {
    id: 'hip_thrust',
    name: 'Ягодичный мост',
    targetMuscles: ['glutes', 'hamstrings'],
    equipment: [],
    avoidIf: [],
    rehabFor: ['hips', 'knees'],
    techniqueNotes: 'Лежа на спине, стопы на полу на ширине плеч. Подъем таза за счет давления в пятки и мощного сокращения ягодиц.',
    defaultSets: '3',
    defaultReps: '15',
  },
  'iliopsoas_stretch': {
    id: 'iliopsoas_stretch',
    name: 'Растяжка подвздошно-поясничной мышцы',
    targetMuscles: ['hip_flexors', 'quads'],
    equipment: [],
    avoidIf: [],
    rehabFor: ['hips'],
    techniqueNotes: 'Выпад на одном колене. Таз приведен в состояние заднего наклона (копчик подкручен внутрь), ягодица сзади стоящей ноги напряжена. Плавный сдвиг таза вперед без прогиба в пояснице.',
    defaultSets: '3',
    defaultReps: '30 sec',
    perSide: true,
    frequency: 'daily',
  },
  'glute_bridge_isometric': {
    id: 'glute_bridge_isometric',
    name: 'Ягодичный мост с изометрическим удержанием',
    targetMuscles: ['glutes', 'hamstrings', 'core'],
    equipment: [],
    avoidIf: [],
    rehabFor: ['hips'],
    techniqueNotes: 'Лежа на спине, стопы на полу на ширине плеч. Подъем таза за счет давления в пятки. Изометрическое удержание в верхней точке 3 секунды.',
    defaultSets: '3',
    defaultReps: '15',
    frequency: '4x/week',
  },
  'it_band_stretch': {
    id: 'it_band_stretch',
    name: 'Растяжка IT-тракта у стены',
    targetMuscles: ['it_band', 'tensor_fasciae_latae'],
    equipment: [],
    avoidIf: [],
    rehabFor: ['hips'],
    techniqueNotes: 'Стоя боком к стене, скрестить ноги (целевая нога сзади, ближе к стене). Наклонять таз в сторону стены до ощущения натяжения по боковой поверхности бедра.',
    defaultSets: '3',
    defaultReps: '20 sec',
    perSide: true,
    frequency: 'daily',
  },
  'side_lying_hip_abduction': {
    id: 'side_lying_hip_abduction',
    name: 'Отведение бедра лежа на боку',
    targetMuscles: ['glute_medius', 'glute_minimus'],
    equipment: [],
    avoidIf: [],
    rehabFor: ['hips'],
    techniqueNotes: 'Лежа на боку, тело вытянуто в линию. Медленный подъем верхней ноги на 30 см, удерживая стопу слегка развернутой пяткой вверх (внутренняя ротация бедра).',
    defaultSets: '3',
    defaultReps: '12-15',
    frequency: '4x/week',
  },
  'hip_rotations_standing': {
    id: 'hip_rotations_standing',
    name: 'Контролируемые вращения в тазобедренном суставе',
    targetMuscles: ['deep_hip_rotators', 'hip_capsule'],
    equipment: [],
    avoidIf: [],
    rehabFor: ['hips'],
    techniqueNotes: 'Стоя на одной ноге с опорой рукой на стабильный предмет. Медленные круговые движения свободной ногой в максимальной безболезненной амплитуде.',
    defaultSets: '2',
    defaultReps: '10',
    perSide: true,
    frequency: 'pre-workout',
  },
  'pull_up': {
    id: 'pull_up',
    name: 'Подтягивания',
    targetMuscles: ['back', 'biceps', 'core'],
    equipment: ['pull_up_bar'],
    avoidIf: ['shoulder', 'elbow'],
    rehabFor: [],
    techniqueNotes: 'КАТЕГОРИЧЕСКИ ЗАПРЕЩЕН пассивный вис (Dead Hang) при гипермобильности. Движение начинается и заканчивается в фазе активного виса. Максимально сильное сжатие перекладины активирует мышцы предплечья. При признаках нестабильности — переходить на австралийские подтягивания.',
    substituteWith: ['pull_up_modified', 'australian_pull_up'],
  },
  'pull_up_modified': {
    id: 'pull_up_modified',
    name: 'Подтягивания модифицированные (активный вис)',
    targetMuscles: ['back', 'biceps', 'core', 'forearms'],
    equipment: ['pull_up_bar', 'rings'],
    avoidIf: [],
    rehabFor: ['shoulder'],
    techniqueNotes: 'Только активный вис (лопатки опущены и приведены). Максимальный хват. При признаках нестабильности в плече — переходить на кольца или австралийские подтягивания.',
    defaultSets: '3',
    defaultReps: '5-8',
    frequency: '3x/week',
  },
  'australian_pull_up': {
    id: 'australian_pull_up',
    name: 'Австралийские подтягивания на кольцах',
    targetMuscles: ['back', 'biceps', 'rear_delts', 'core'],
    equipment: ['rings'],
    avoidIf: [],
    rehabFor: ['shoulder'],
    techniqueNotes: 'Кольца на уровне пояса. Хват нейтральный (ладони друг к другу). Тело в прямой линии, лопатки приведены. Медленный подконтрольный подъем, локти близко к корпусу.',
    defaultSets: '3',
    defaultReps: '10-12',
    frequency: '3x/week',
  },
  'plank': {
    id: 'plank',
    name: 'Планка',
    targetMuscles: ['core', 'shoulders'],
    equipment: [],
    avoidIf: [],
    rehabFor: ['back'],
  },
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
  'cat_cow': {
    id: 'cat_cow',
    name: 'Кошка-корова',
    targetMuscles: ['spine', 'core'],
    equipment: [],
    avoidIf: [],
    rehabFor: ['back', 'neck'],
  },
  'child_pose': {
    id: 'child_pose',
    name: 'Детская поза',
    targetMuscles: ['back', 'hips', 'shoulders'],
    equipment: [],
    avoidIf: [],
    rehabFor: ['back', 'hips', 'shoulder'],
  },
  'pigeon_pose': {
    id: 'pigeon_pose',
    name: 'Поза голубя',
    targetMuscles: ['hips', 'glutes'],
    equipment: [],
    avoidIf: [],
    rehabFor: ['hips', 'knees'],
  },
  'cow_face_pose': {
    id: 'cow_face_pose',
    name: 'Поза коровье лицо',
    targetMuscles: ['shoulders', 'hips'],
    equipment: [],
    avoidIf: ['shoulder'],
    rehabFor: ['shoulder'],
  },
  'thread_the_needle': {
    id: 'thread_the_needle',
    name: 'Пролезание иглы',
    targetMuscles: ['shoulders', 'upper_back'],
    equipment: [],
    avoidIf: [],
    rehabFor: ['shoulder', 'neck'],
  },
  'wrist_stretch': {
    id: 'wrist_stretch',
    name: 'Растяжка запястья',
    targetMuscles: ['wrists', 'forearms'],
    equipment: [],
    avoidIf: [],
    rehabFor: ['wrist', 'elbow'],
  },
  'neck_stretch': {
    id: 'neck_stretch',
    name: 'Растяжка шеи',
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
    name: 'Внешняя ротация плеча',
    targetMuscles: ['rotator_cuff', 'rear_delts'],
    equipment: ['resistance_band', 'dumbbell'],
    avoidIf: [],
    rehabFor: ['shoulder'],
  },
  'scapular_pull_up': {
    id: 'scapular_pull_up',
    name: 'Лопаточные подтягивания (Scapular Pull-Ups)',
    targetMuscles: ['traps', 'rhomboids', 'serratus_anterior'],
    equipment: ['pull_up_bar'],
    avoidIf: [],
    rehabFor: ['shoulder'],
    techniqueNotes: 'Из активного виса, без сгибания рук в локтях, изолированно опустить и свести лопатки, приподнимая тело вверх. Удержание в верхней точке 2 секунды.',
    defaultSets: '3',
    defaultReps: '8-10',
    frequency: '3x/week',
  },
  'ring_row_neutral': {
    id: 'ring_row_neutral',
    name: 'Тяга на кольцах с нейтральным хватом',
    targetMuscles: ['lats', 'rhomboids', 'rear_delts'],
    equipment: ['rings'],
    avoidIf: [],
    rehabFor: ['shoulder'],
    techniqueNotes: 'Кольца на уровне пояса. Тело удерживается строго по одной линии, лопатки приведены, локти проходят близко к ребрам. Медленный подконтрольный возврат в исходное положение.',
    defaultSets: '3',
    defaultReps: '10-12',
    frequency: '3x/week',
  },
  'serratus_anterior_plank': {
    id: 'serratus_anterior_plank',
    name: 'Пронация и супинация на предплечьях в упоре лежа',
    targetMuscles: ['serratus_anterior', 'rotator_cuff', 'core'],
    equipment: [],
    avoidIf: ['shoulder'],
    rehabFor: ['shoulder'],
    techniqueNotes: 'Исходное положение — планка на предплечьях. Выталкивать грудной отдел позвоночника вверх, отдаляя лопатки от позвоночника, затем плавно опускаться обратно.',
    defaultSets: '3',
    defaultReps: '12',
    frequency: 'daily',
  },
  'chest_stretch_doorway': {
    id: 'chest_stretch_doorway',
    name: 'Растяжка грудных мышц в дверном проеме',
    targetMuscles: ['pectoralis_major', 'pectoralis_minor'],
    equipment: [],
    avoidIf: [],
    rehabFor: ['shoulder'],
    techniqueNotes: 'Предплечья опираются на косяки дверного проема под углом 90. Плавный шаг вперед до ощущения растяжения в грудных мышцах без форсирования боли.',
    defaultSets: '3',
    defaultReps: '20 sec',
    frequency: 'daily',
  },
  'chin_tuck': {
    id: 'chin_tuck',
    name: 'Подбородочные подтягивания (Chin Tucks)',
    targetMuscles: ['deep_neck_flexors', 'upper_traps'],
    equipment: [],
    avoidIf: [],
    rehabFor: ['neck'],
    techniqueNotes: 'Стоя или сидя с ровной спиной. Вытянуть шею вверх, затем втянуть подбородок назад (не вниз), создавая "двойной подбородок". Удержать 3-5 секунд.',
    defaultSets: '3',
    defaultReps: '10',
    frequency: 'daily',
  },
  'thoracic_extension_foam': {
    id: 'thoracic_extension_foam',
    name: 'Торакальная экстензия на роллере',
    targetMuscles: ['thoracic_spine', 'upper_back'],
    equipment: ['foam_roller'],
    avoidIf: ['back'],
    rehabFor: ['back', 'neck'],
    techniqueNotes: 'Лежа на роллере под верхним отделом спины, руки за головой. Плавно разгибаться через ролик на 5-10 секунд, затем расслабляться.',
    defaultSets: '2',
    defaultReps: '10',
    frequency: 'daily',
  },
  'hip_flexor_kneeling_stretch': {
    id: 'hip_flexor_kneeling_stretch',
    name: 'Растяжка сгибателей бедра стоя на колене',
    targetMuscles: ['hip_flexors', 'psoas', 'rectus_femoris'],
    equipment: [],
    avoidIf: [],
    rehabFor: ['hips', 'back'],
    techniqueNotes: 'Стоя на одном колене, другая нога вперед под 90. Напрячь ягодицу задней ноги, подкручивая таз в задний наклон. Плавно податься вперед.',
    defaultSets: '2',
    defaultReps: '30 sec',
    perSide: true,
    frequency: 'daily',
  },
  'running_easy': {
    id: 'running_easy',
    name: 'Легкий бег',
    targetMuscles: ['quads', 'hamstrings', 'calves', 'core'],
    equipment: [],
    avoidIf: ['knees', 'hips', 'back'],
    rehabFor: [],
  },
  'running_tempo': {
    id: 'running_tempo',
    name: 'Темповый бег',
    targetMuscles: ['quads', 'hamstrings', 'calves', 'core'],
    equipment: [],
    avoidIf: ['knees', 'hips', 'back'],
    rehabFor: [],
  },
  'cycling_easy': {
    id: 'cycling_easy',
    name: 'Легкая езда на велосипеде',
    targetMuscles: ['quads', 'hamstrings', 'calves'],
    equipment: ['bike'],
    avoidIf: ['knees'],
    rehabFor: ['knees', 'hips'],
  },
  'swimming_easy': {
    id: 'swimming_easy',
    name: 'Легкое плавание',
    targetMuscles: ['full_body'],
    equipment: ['pool'],
    avoidIf: ['shoulder'],
    rehabFor: ['back', 'knees', 'hips'],
  },
  'walking': {
    id: 'walking',
    name: 'Ходьба',
    targetMuscles: ['quads', 'hamstrings', 'calves'],
    equipment: [],
    avoidIf: [],
    rehabFor: ['knees', 'hips', 'back'],
  },
  'nordic_walking': {
    id: 'nordic_walking',
    name: 'Скандинавская ходьба',
    targetMuscles: ['full_body'],
    equipment: ['poles'],
    avoidIf: ['shoulder', 'wrist'],
    rehabFor: ['back', 'knees'],
  },
};

export function getSafeExercises(rehabIssues: string[]): ExerciseInfo[] {
  if (!rehabIssues || rehabIssues.length === 0) {
    return Object.values(exerciseLibrary);
  }
  return Object.values(exerciseLibrary).filter(ex => {
    return !ex.avoidIf.some(issue => rehabIssues.includes(issue));
  });
}

export function getRehabExercises(rehabIssues: string[]): ExerciseInfo[] {
  if (!rehabIssues || rehabIssues.length === 0) {
    return [];
  }
  return Object.values(exerciseLibrary).filter(ex => {
    return ex.rehabFor.some(issue => rehabIssues.includes(issue));
  });
}

export function filterExercisesForRehab(
  exercises: { n: string; s: string; r: string; w?: string }[],
  rehabIssues: string[],
  rehabExercises: string[]
): { exercises: { n: string; s: string; r: string; w?: string }[]; wasAdapted: boolean } {
  if (!rehabIssues || rehabIssues.length === 0) {
    return { exercises, wasAdapted: false };
  }

  const safeList = getSafeExercises(rehabIssues);
  const safeNames = new Set(safeList.map(e => e.name.toLowerCase()));
  const rehabList = getRehabExercises(rehabIssues);

  const result: { n: string; s: string; r: string; w?: string }[] = [];
  let wasAdapted = false;
  let replacedCount = 0;

  for (const ex of exercises) {
    const exNameLower = ex.n.toLowerCase();

    const libEntry = Object.values(exerciseLibrary).find(
      lib => lib.name.toLowerCase() === exNameLower
    );

    if (libEntry && libEntry.substituteWith && libEntry.substituteWith.length > 0 &&
        libEntry.avoidIf.some(i => rehabIssues.includes(i))) {
      wasAdapted = true;
      replacedCount++;
      for (const subId of libEntry.substituteWith) {
        const subLib = exerciseLibrary[subId];
        if (subLib && (!rehabExercises.length || rehabExercises.includes(subId))) {
          const subSets = subLib.defaultSets || '3';
          const subReps = subLib.defaultReps || '8-10';
          const subW = subLib.techniqueNotes ? `(modifitsirovano: ${ex.n})` : '';
          result.push({ n: subLib.name, s: subSets, r: subReps, w: subW });
        }
      }
      continue;
    }

    const isSafe = safeNames.has(exNameLower) || !Object.values(exerciseLibrary).some(
      lib => lib.name.toLowerCase() === exNameLower && lib.avoidIf.some(i => rehabIssues.includes(i))
    );

    if (isSafe) {
      result.push(ex);
    } else {
      wasAdapted = true;
      replacedCount++;
      const availableRehab = rehabList.filter(r =>
        !result.some(existing => existing.n === r.name) &&
        (!rehabExercises.length || rehabExercises.includes(r.id))
      );
      for (let i = 0; i < Math.min(2, availableRehab.length); i++) {
        const sets = availableRehab[i].defaultSets || '3';
        const reps = availableRehab[i].defaultReps || '8-10';
        result.push({ n: availableRehab[i].name, s: sets, r: reps });
      }
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
