// js/domains/training/plans/swimming.ts
// Swimming-focused periodized training plan module

import type { SportPlanModule, SessionPlan, Exercise } from '../../../core/types.js';

const ex = (n: string, s: string, r: string, w?: string): Exercise => ({ n, s, r, ...(w && { w }) });

const session = (
  sessionType: SessionPlan['sessionType'], name: string, description: string,
  defaultParams: Record<string, number>, exercises: Exercise[],
): Omit<SessionPlan, 'date' | 'sessionId'> => ({
  sport: 'swimming', sessionType, name, description,
  defaultParameters: defaultParams, exercises, mode: 'full', isDeload: false, isRestDay: false,
});

function basePhase(w: number): Omit<SessionPlan, 'date' | 'sessionId'>[] {
  const dist = 400 + (w - 1) * 100;
  const dur = 20 + (w - 1) * 5;
  return [
    session('endurance', 'Plavanie Tekhnika', 'Tekhnika plavaniya, ' + dist + 'm', { distance: dist, duration: dur }, [
      ex('Razminka Volnyy stil', '-', '100 m'), ex('Tekhnika Krol', '4', '50 m', 'Dykhanie na 3-y grebok'),
      ex('Tekhnika Na spine', '2', '50 m'), ex('Zaminka Brass', '-', '50 m'),
    ]),
    null, null,
    session('endurance', 'Plavanie Vynoslivost', 'Nepreryvnoe plavanie ' + dist + 'm', { distance: dist, duration: dur }, [
      ex('Razminka', '-', '50 m'), ex('Krol nepreryvno', '-', (dist - 100) + ' m'), ex('Zaminka Na spine', '-', '50 m'),
    ]),
    null, null, null,
  ].filter((s): s is NonNullable<typeof s> => s !== null);
}

function buildPhase(w: number): Omit<SessionPlan, 'date' | 'sessionId'>[] {
  const dist = 600 + (w - 5) * 150;
  const dur = 30 + (w - 5) * 5;
  return [
    session('intervals', 'Plavanie Intervaly', '6x50m s otdyh 30 sek', { distance: dist / 2, duration: dur }, [
      ex('Razminka Volnyy stil', '-', '100 m'), ex('Interval Krol', '6', '50 m', 'Bystro, 85% usiliya'),
      ex('Otdyh', '6', '30 sek'), ex('Zaminka', '-', '50 m'),
    ]),
    null,
    session('endurance', 'Plavanie Vynoslivost', 'Nepreryvnoe plavanie ' + dist + 'm', { distance: dist, duration: dur }, [
      ex('Krol nepreryvno', '-', (dist - 100) + ' m'), ex('Na spine', '-', '50 m'),
    ]),
    null,
    session('endurance', 'Plavanie Tekhnika + Skorost', 'Tekhnika + sprint 4x25m', { distance: dist / 2, duration: dur }, [
      ex('Razminka', '-', '100 m'), ex('Tekhnika Krol', '4', '50 m'), ex('Sprint', '4', '25 m'), ex('Zaminka', '-', '50 m'),
    ]),
    null, null,
  ].filter((s): s is NonNullable<typeof s> => s !== null);
}

function peakPhase(w: number): Omit<SessionPlan, 'date' | 'sessionId'>[] {
  const dist = 800 + (w - 9) * 100;
  const dur = 35 + (w - 9) * 5;
  return [
    session('intervals', 'Plavanie Gonochnyy temp', '4x100m s otdyh 20 sek', { distance: dist, duration: dur }, [
      ex('Razminka', '-', '100 m'), ex('Gonochnyy temp', '4', '100 m', '90% usiliya'), ex('Otdyh', '4', '20 sek'), ex('Zaminka', '-', '100 m'),
    ]),
    null,
    session('endurance', 'Plavanie Dlinnoe', 'Nepreryvnoe plavanie ' + dist + 'm', { distance: dist, duration: dur }, [
      ex('Krol nepreryvno', '-', dist + ' m'),
    ]),
    null,
    session('intervals', 'Plavanie Skorost', '8x25m sprint s otdyh 30 sek', { distance: 400, duration: 25 }, [
      ex('Razminka', '-', '100 m'), ex('Sprint', '8', '25 m'), ex('Otdyh', '8', '30 sek'), ex('Zaminka', '-', '50 m'),
    ]),
    session('recovery', 'Plavanie Vosstanovlenie', 'Legkoe plavanie 20 min', { distance: 300, duration: 20 }, [
      ex('Legkoe plavanie', '-', '300 m'),
    ]),
    null,
  ].filter((s): s is NonNullable<typeof s> => s !== null);
}

function deloadPhase(): Omit<SessionPlan, 'date' | 'sessionId'>[] {
  return [
    null, null,
    session('recovery', 'Plavanie Vosstanovlenie', 'Legkoe plavanie 15 min', { distance: 200, duration: 15 }, [
      ex('Legkoe plavanie', '-', '200 m'),
    ]),
    null, null, null, null,
  ].filter((s): s is NonNullable<typeof s> => s !== null);
}

export const SwimmingPlanModule: SportPlanModule = {
  sport: 'swimming',
  phases: { base: basePhase, build: buildPhase, peak: peakPhase, deload: deloadPhase },
};
