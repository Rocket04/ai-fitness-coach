import { exerciseLibrary } from './exerciseDatabase.js';
import type { SessionPlan, Exercise } from './types.js';

export interface RehabProtocolExercise {
  exerciseId: string;
  sets: string;
  reps: string;
  perSide: boolean;
  frequency: string;
  notes?: string;
}

export interface RehabProtocol {
  id: string;
  name: string;
  description: string;
  exercises: RehabProtocolExercise[];
}

export interface RehabSessionConfig {
  type: 'daily' | 'pre-workout' | 'weekly';
  durationMinutes: number;
  name: string;
}

const HIP_SNAPPING_PROTOCOL: RehabProtocol = {
  id: 'hip_snapping',
  name: 'Реабилитация ТБ Сустава (Coxa Saltans)',
  description: 'Протокол для двустороннего синдрома щелкающего бедра.',
  exercises: [
    { exerciseId: 'iliopsoas_stretch', sets: '3', reps: '30 sec', perSide: true, frequency: 'daily' },
    { exerciseId: 'it_band_stretch', sets: '3', reps: '20 sec', perSide: true, frequency: 'daily' },
    { exerciseId: 'side_lying_hip_abduction', sets: '3', reps: '12-15', perSide: true, frequency: '4x/week' },
    { exerciseId: 'glute_bridge_isometric', sets: '3', reps: '15', perSide: false, frequency: '4x/week' },
    { exerciseId: 'hip_rotations_standing', sets: '2', reps: '10', perSide: true, frequency: 'pre-workout' },
  ],
};

const SHOULDER_STABILITY_PROTOCOL: RehabProtocol = {
  id: 'shoulder_stability',
  name: 'Реабилитация плечевого сустава (JHS)',
  description: 'Протокол для гипермобильности плечевого сустава.',
  exercises: [
    { exerciseId: 'scapular_pull_up', sets: '3', reps: '8-10', perSide: false, frequency: '3x/week' },
    { exerciseId: 'ring_row_neutral', sets: '3', reps: '10-12', perSide: false, frequency: '3x/week' },
    { exerciseId: 'serratus_anterior_plank', sets: '3', reps: '12', perSide: false, frequency: 'daily' },
    { exerciseId: 'chest_stretch_doorway', sets: '3', reps: '20 sec', perSide: false, frequency: 'daily' },
  ],
};

const POSTURAL_PROTOCOL: RehabProtocol = {
  id: 'postural_restoration',
  name: 'Постуральная реставрация',
  description: 'Протокол для коррекции переднего наклона таза, округления плеч и синдрома "компьютерной шеи".',
  exercises: [
    { exerciseId: 'hip_flexor_kneeling_stretch', sets: '2', reps: '30 sec', perSide: true, frequency: 'daily' },
    { exerciseId: 'chest_stretch_doorway', sets: '3', reps: '20 sec', perSide: false, frequency: 'daily' },
    { exerciseId: 'chin_tuck', sets: '3', reps: '10', perSide: false, frequency: 'daily' },
    { exerciseId: 'thoracic_extension_foam', sets: '2', reps: '10', perSide: false, frequency: 'daily' },
    { exerciseId: 'serratus_anterior_plank', sets: '3', reps: '12', perSide: false, frequency: 'daily' },
  ],
};

const REHAB_PROTOCOLS: Record<string, RehabProtocol> = {
  'hip_snapping': HIP_SNAPPING_PROTOCOL,
  'shoulder_stability': SHOULDER_STABILITY_PROTOCOL,
  'postural_restoration': POSTURAL_PROTOCOL,
};

const ISSUE_TO_PROTOCOL: Record<string, string> = {
  'hips': 'hip_snapping',
  'shoulder': 'shoulder_stability',
  'back': 'postural_restoration',
  'neck': 'postural_restoration',
};

export function getProtocolsForIssues(rehabIssues: string[]): RehabProtocol[] {
  if (!rehabIssues || rehabIssues.length === 0) return [];
  const seen = new Set<string>();
  const result: RehabProtocol[] = [];
  for (const issue of rehabIssues) {
    const protocolId = ISSUE_TO_PROTOCOL[issue];
    if (protocolId && !seen.has(protocolId)) {
      seen.add(protocolId);
      const protocol = REHAB_PROTOCOLS[protocolId];
      if (protocol) result.push(protocol);
    }
  }
  return result;
}

export function buildRehabSession(
  protocols: RehabProtocol[],
  config: RehabSessionConfig
): SessionPlan | null {
  if (!protocols || protocols.length === 0) return null;

  const exercises: Exercise[] = [];

  for (const protocol of protocols) {
    for (const pe of protocol.exercises) {
      const includeExercise =
        config.type === 'daily' ||
        pe.frequency === config.type ||
        (config.type === 'weekly' && (pe.frequency === '4x/week' || pe.frequency === 'weekly'));

      if (!includeExercise) continue;

      const lib = exerciseLibrary[pe.exerciseId];
      if (!lib) continue;

      const label = pe.perSide
        ? `${lib.name} (на каждую сторону)`
        : lib.name;

      const notesParts: string[] = [];
      if (lib.techniqueNotes) {
        notesParts.push(lib.techniqueNotes);
      }
      if (pe.notes) {
        notesParts.push(pe.notes);
      }

      exercises.push({
        n: label,
        s: pe.sets,
        r: pe.reps,
        w: notesParts.length > 0 ? notesParts.join('. ') : undefined,
      });
    }
  }

  if (exercises.length === 0) return null;

  return {
    sessionId: '',
    date: '',
    sport: 'stretching',
    sessionType: 'mobility',
    name: config.name,
    description: protocols.map(p => p.description).join('; '),
    defaultParameters: { duration: config.durationMinutes },
    exercises,
    mode: 'full',
    isDeload: false,
    isRestDay: false,
  };
}

export function getRehabDailySession(rehabIssues: string[]): SessionPlan | null {
  const protocols = getProtocolsForIssues(rehabIssues);
  return buildRehabSession(protocols, {
    type: 'daily',
    durationMinutes: 15,
    name: 'Ежедневная реабилитация',
  });
}

export function getRehabPreWorkoutExercises(rehabIssues: string[]): Exercise[] {
  const protocols = getProtocolsForIssues(rehabIssues);
  const exercises: Exercise[] = [];
  for (const protocol of protocols) {
    for (const pe of protocol.exercises) {
      if (pe.frequency !== 'pre-workout') continue;
      const lib = exerciseLibrary[pe.exerciseId];
      if (!lib) continue;
      exercises.push({
        n: pe.perSide ? `${lib.name} (на каждую сторону)` : lib.name,
        s: pe.sets,
        r: pe.reps,
        w: lib.techniqueNotes || undefined,
      });
    }
  }
  return exercises;
}