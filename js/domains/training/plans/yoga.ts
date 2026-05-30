// js/domains/training/plans/yoga.ts
// Yoga & mindfulness training plan module

import type { SportPlanModule, SessionPlan, Exercise } from '../../../core/types.js';

const ex = (n: string, s: string, r: string, w?: string): Exercise => ({ n, s, r, ...(w && { w }) });

const session = (
  sessionType: SessionPlan['sessionType'], name: string, description: string,
  defaultParams: Record<string, number>, exercises: Exercise[],
): Omit<SessionPlan, 'date' | 'sessionId'> => ({
  sport: 'yoga', sessionType, name, description,
  defaultParameters: defaultParams, exercises, mode: 'full', isDeload: false, isRestDay: false,
});

function basePhase(w: number): Omit<SessionPlan, 'date' | 'sessionId'>[] {
  const d = 30 + (w - 1) * 5;
  return [
    session('recovery', 'Yoga Hatha potok', 'Hatha-yoga ' + d + ' min', { duration: d }, [
      ex('Nastroika na praktiku', '-', '3 min'), ex('Surya Namaskar A', '3', 'tsykl'),
      ex('Surya Namaskar B', '2', 'tsykl'), ex('Stoyachie asany', '-', '10 min'),
      ex('Sidyachie asany', '-', '5 min'), ex('Shavasana', '-', '5 min'),
    ]),
    null,
    session('recovery', 'Yoga Dyhanie + Potok', 'Pranyama + myagkiy potok ' + d + ' min', { duration: d }, [
      ex('Nadi Shodhana', '-', '5 min'), ex('Myagkiy potok', '-', (d - 15) + ' min'), ex('Yoga nydra', '-', '5 min'),
    ]),
    null,
    session('recovery', 'Yoga Hatha potok', 'Hatha-yoga ' + d + ' min, fokus na balans', { duration: d }, [
      ex('Razminka', '-', '5 min'), ex('Stoyachie asany', '-', '10 min'),
      ex('Progi', '-', '5 min'), ex('Skrutki', '-', '5 min'), ex('Shavasana', '-', '5 min'),
    ]),
    null, null, null,
  ].filter((s): s is NonNullable<typeof s> => s !== null);
}

function buildPhase(w: number): Omit<SessionPlan, 'date' | 'sessionId'>[] {
  const d = 45 + (w - 5) * 5;
  return [
    session('endurance', 'Yoga Vinyasa potok', 'Vinyasa-flow ' + d + ' min', { duration: d }, [
      ex('Nastroika', '-', '3 min'), ex('Razogrev', '-', '10 min'),
      ex('Vinyasa potok', '-', (d - 20) + ' min'), ex('Shavasana', '-', '5 min'),
    ]),
    null,
    session('recovery', 'Yoga Dyhanie + Meditsiya', 'Pranyama + meditsiya ' + (d - 10) + ' min', { duration: d - 10 }, [
      ex('Nadi Shodhana', '-', '10 min'), ex('Meditsiya', '-', '15 min'),
    ]),
    null,
    session('endurance', 'Yoga Silovaya vinyasa', 'Silovaya vinyasa ' + d + ' min', { duration: d }, [
      ex('Razogrev', '-', '10 min'), ex('Silovoy potok', '-', (d - 20) + ' min'), ex('Shavasana', '-', '5 min'),
    ]),
    session('recovery', 'Yoga Yin-yoga', 'Yin-yoga ' + (d - 10) + ' min', { duration: d - 10 }, [
      ex('Bananas', '2', '4 min / storona'), ex('Babochka in', '-', '6 min'), ex('Skrutki lezha', '2', '4 min / storona'),
    ]),
    null,
  ].filter((s): s is NonNullable<typeof s> => s !== null);
}

function peakPhase(w: number): Omit<SessionPlan, 'date' | 'sessionId'>[] {
  const d = 50 + (w - 9) * 5;
  return [
    session('power', 'Yoga Sila + Vynoslivost', 'Silovaya yoga ' + d + ' min', { duration: d }, [
      ex('Razogrev', '-', '10 min'), ex('Silovoy potok', '-', (d - 25) + ' min'), ex('Shavasana', '-', '5 min'),
    ]),
    null,
    session('recovery', 'Yoga Pikovyy potok', 'Prodvinutyy potok ' + d + ' min', { duration: d }, [
      ex('Razogrev', '-', '10 min'), ex('Polnyy potok', '-', (d - 20) + ' min'), ex('Shavasana', '-', '5 min'),
    ]),
    session('endurance', 'Yoga Dlinnaya praktika', 'Polnaya praktika ' + (d + 10) + ' min', { duration: d + 10 }, [
      ex('Polnyy potok', '-', (d - 20) + ' min'), ex('Shavasana', '-', '10 min'),
    ]),
    null,
  ].filter((s): s is NonNullable<typeof s> => s !== null);
}

function deloadPhase(): Omit<SessionPlan, 'date' | 'sessionId'>[] {
  return [
    null, null,
    session('recovery', 'Yoga Vosstanovitelnaya', 'Vosstanovitelnaya yoga 30 min', { duration: 30 }, [
      ex('Myagkaya raztyazhka', '-', '10 min'), ex('Yoga nydra', '-', '10 min'),
    ]),
    null, null,
    session('recovery', 'Yoga Myagkoe dyhanie', 'Pranyama + meditsiya 20 min', { duration: 20 }, [
      ex('Nadi Shodhana', '-', '5 min'), ex('Meditsiya', '-', '10 min'),
    ]),
    null,
  ].filter((s): s is NonNullable<typeof s> => s !== null);
}

export const YogaPlanModule: SportPlanModule = {
  sport: 'yoga',
  phases: { base: basePhase, build: buildPhase, peak: peakPhase, deload: deloadPhase },
};
