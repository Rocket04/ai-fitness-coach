// js/domains/training/plans/walking.ts
// Walking-focused periodized training plan module

import type { SportPlanModule, SessionPlan, Exercise } from '../../../core/types.js';

const ex = (n: string, s: string, r: string, w?: string): Exercise => ({ n, s, r, ...(w && { w }) });

const session = (
  sessionType: SessionPlan['sessionType'], name: string, description: string,
  defaultParams: Record<string, number>, exercises: Exercise[],
): Omit<SessionPlan, 'date' | 'sessionId'> => ({
  sport: 'walking', sessionType, name, description,
  defaultParameters: defaultParams, exercises, mode: 'full', isDeload: false, isRestDay: false,
});

function basePhase(w: number): Omit<SessionPlan, 'date' | 'sessionId'>[] {
  const d = 30 + (w - 1) * 3;
  return [
    session('endurance', 'Khodba Bodraya', 'Bodraya khodba ' + d + ' min', { duration: d }, [
      ex('Razminka', '-', '3 min'), ex('Bodraya khodba', '-', (d - 6) + ' min'), ex('Zaminka', '-', '3 min'),
    ]),
    null,
    session('recovery', 'Khodba Legkaya', 'Legkaya progulka ' + d + ' min', { duration: d }, [
      ex('Legkaya progulka', '-', d + ' min'),
    ]),
    null,
    session('endurance', 'Khodba Bodraya', 'Bodraya khodba ' + d + ' min', { duration: d }, [
      ex('Razminka', '-', '3 min'), ex('Bodraya khodba', '-', (d - 6) + ' min'), ex('Zaminka', '-', '3 min'),
    ]),
    null, null,
  ].filter((s): s is NonNullable<typeof s> => s !== null);
}

function buildPhase(w: number): Omit<SessionPlan, 'date' | 'sessionId'>[] {
  const d = 40 + (w - 5) * 5;
  return [
    session('endurance', 'Khodba Dlinnaya', 'Dlinnaya progulka ' + (d + 10) + ' min', { duration: d + 10 }, [
      ex('Dlinnaya khodba', '-', (d + 10) + ' min'),
    ]),
    null,
    session('endurance', 'Skandinavskaya khodba', 'Skandinavskaya khodba ' + d + ' min', { duration: d }, [
      ex('Razminka', '-', '5 min'), ex('Skandinavskaya khodba', '-', (d - 10) + ' min'), ex('Zaminka', '-', '5 min'),
    ]),
    null,
    session('intervals', 'Khodba Intervalnaya', 'Intervalnaya khodba ' + d + ' min', { duration: d }, [
      ex('Razminka', '-', '5 min'), ex('Bystraya khodba', '5', '3 min'), ex('Medlennaya khodba', '5', '2 min'), ex('Zaminka', '-', '5 min'),
    ]),
    session('recovery', 'Khodba Legkaya', 'Legkaya progulka ' + (d - 10) + ' min', { duration: d - 10 }, [
      ex('Legkaya progulka', '-', (d - 10) + ' min'),
    ]),
    null,
  ].filter((s): s is NonNullable<typeof s> => s !== null);
}

function peakPhase(w: number): Omit<SessionPlan, 'date' | 'sessionId'>[] {
  const d = 50 + (w - 9) * 5;
  return [
    session('endurance', 'Khodba Pohod', 'Dlinnyy pohod ' + (d + 20) + ' min', { duration: d + 20 }, [
      ex('Pohod', '-', (d + 20) + ' min'),
    ]),
    null,
    session('endurance', 'Skandinavskaya khodba', 'Skandinavskaya khodba ' + d + ' min', { duration: d }, [
      ex('Skandinavskaya khodba', '-', d + ' min'),
    ]),
    null,
    session('intervals', 'Khodba Intervalnaya', 'Intervalnaya khodba ' + d + ' min', { duration: d }, [
      ex('Razminka', '-', '5 min'), ex('Bystraya khodba', '6', '3 min'), ex('Medlennaya khodba', '6', '2 min'), ex('Zaminka', '-', '5 min'),
    ]),
    session('endurance', 'Khodba Dlinnaya', 'Dlinnaya progulka ' + (d + 15) + ' min', { duration: d + 15 }, [
      ex('Dlinnaya khodba', '-', (d + 15) + ' min'),
    ]),
    null,
  ].filter((s): s is NonNullable<typeof s> => s !== null);
}

function deloadPhase(): Omit<SessionPlan, 'date' | 'sessionId'>[] {
  return [
    session('recovery', 'Khodba Legkaya', 'Legkaya progulka 20 min', { duration: 20 }, [
      ex('Legkaya progulka', '-', '20 min'),
    ]),
    null, null, null,
    session('recovery', 'Khodba Legkaya', 'Legkaya progulka 20 min', { duration: 20 }, [
      ex('Legkaya progulka', '-', '20 min'),
    ]),
    null, null,
  ].filter((s): s is NonNullable<typeof s> => s !== null);
}

export const WalkingPlanModule: SportPlanModule = {
  sport: 'walking',
  phases: { base: basePhase, build: buildPhase, peak: peakPhase, deload: deloadPhase },
};
