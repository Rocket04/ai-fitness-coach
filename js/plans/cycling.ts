// js/plans/cycling.ts
// Cycling-focused periodized training plan module

import type { SportPlanModule, SessionPlan, Exercise, ApreProtocolKey } from '../core/types.js';

const ex = (n: string, s: string, r: string, w?: string, protocol?: ApreProtocolKey, currentRM?: number): Exercise => ({
  n, s, r, ...(w && { w }), ...(protocol && { isApre: true, protocol }), ...(currentRM ? { currentRM } : {}),
});

const session = (
  sessionType: SessionPlan['sessionType'],
  name: string,
  description: string,
  defaultParams: Record<string, number>,
  exercises: Exercise[],
): Omit<SessionPlan, 'date' | 'sessionId'> => ({
  sport: 'cycling',
  sessionType, name, description,
  defaultParameters: defaultParams,
  exercises, mode: 'full', isDeload: false, isRestDay: false,
});

function basePhase(w: number): Omit<SessionPlan, 'date' | 'sessionId'>[] {
  const d = 30 + (w - 1) * 5;
  return [
    session('endurance', 'Veloprobeg Zona 2', 'Legkiy veloprobeg ' + d + ' min', { duration: d }, [
      ex('Razminka', '-', '5 min'), ex('Veloprobeg Zona 2', '-', d + ' min', 'Postoyannyy temp, puls 120-140'), ex('Zaminka', '-', '5 min'),
    ]),
    null,
    session('tempo', 'Tempovyy veloprobeg', 'Tempovaya ezda ' + (d - 10) + ' min', { duration: d - 10 }, [
      ex('Razminka', '-', '5 min'), ex('Tempovaya ezda', '-', (d - 10) + ' min', 'Umerennyy temp'), ex('Zaminka', '-', '5 min'),
    ]),
    null,
    session('endurance', 'Dlinnyy veloprobeg', 'Dlinnaya poezdka ' + (d + 10) + ' min', { duration: d + 10 }, [
      ex('Veloprobeg Zona 2', '-', (d + 10) + ' min', 'Aerobnaya baza'), ex('Zaminka', '-', '5 min'),
    ]),
    null, null,
  ].filter((s): s is NonNullable<typeof s> => s !== null);
}

function buildPhase(w: number): Omit<SessionPlan, 'date' | 'sessionId'>[] {
  const d = 35 + (w - 1) * 5;
  return [
    session('intervals', 'Intervaly na velosipede', '3x4 min Z3 s otdyh 3 min', { duration: d }, [
      ex('Razminka', '-', '10 min'), ex('Interval Z3', '3', '4 min', 'Tyazhelo, puls 150-165'), ex('Otdyh', '3', '3 min'), ex('Zaminka', '-', '5 min'),
    ]),
    null,
    session('endurance', 'Veloprobeg Zona 2', 'Legkiy veloprobeg ' + d + ' min', { duration: d }, [
      ex('Veloprobeg Zona 2', '-', d + ' min'), ex('Zaminka', '-', '5 min'),
    ]),
    null,
    session('tempo', 'Tempovyy veloprobeg', 'Temp ' + (d - 5) + ' min', { duration: d - 5 }, [
      ex('Razminka', '-', '5 min'), ex('Tempovaya ezda', '-', (d - 5) + ' min'), ex('Zaminka', '-', '5 min'),
    ]),
    session('endurance', 'Dlinnyy veloprobeg', 'Dlinnaya poezdka ' + (d + 20) + ' min', { duration: d + 20 }, [
      ex('Veloprobeg Zona 2', '-', (d + 20) + ' min'), ex('Zaminka', '-', '5 min'),
    ]),
    null,
  ].filter((s): s is NonNullable<typeof s> => s !== null);
}

function peakPhase(w: number): Omit<SessionPlan, 'date' | 'sessionId'>[] {
  const d = 40 + (w - 9) * 5;
  return [
    session('intervals', 'Intervaly Gonochnyy', '4x3 min Z4 s otdyh 3 min', { duration: d }, [
      ex('Razminka', '-', '10 min'), ex('Interval Z4', '4', '3 min', 'Gonochnyy temp, puls 160-175'), ex('Otdyh', '4', '3 min'), ex('Zaminka', '-', '5 min'),
    ]),
    null,
    session('endurance', 'Legkiy veloprobeg', 'Legkiy ' + d + ' min', { duration: d }, [
      ex('Veloprobeg', '-', d + ' min', 'Aktivnoe vosstanovlenie'), ex('Zaminka', '-', '5 min'),
    ]),
    null,
    session('tempo', 'Tempovyy veloprobeg', 'Temp ' + d + ' min', { duration: d }, [
      ex('Razminka', '-', '5 min'), ex('Tempovaya ezda', '-', d + ' min', 'Tyazhelo'), ex('Zaminka', '-', '5 min'),
    ]),
    session('endurance', 'Dlinnyy veloprobeg', 'Dlinnaya poezdka ' + (d + 30) + ' min', { duration: d + 30 }, [
      ex('Veloprobeg', '-', (d + 30) + ' min'), ex('Zaminka', '-', '5 min'),
    ]),
    null,
  ].filter((s): s is NonNullable<typeof s> => s !== null);
}

function deloadPhase(): Omit<SessionPlan, 'date' | 'sessionId'>[] {
  return [
    session('recovery', 'Legkiy veloprobeg', 'Legkoe vrashchenie 20 min', { duration: 20 }, [
      ex('Legkoe vrashchenie', '-', '20 min', 'Aktivnoe vosstanovlenie'),
    ]),
    null, null, null,
    session('recovery', 'Legkiy veloprobeg', 'Legkoe vrashchenie 20 min', { duration: 20 }, [
      ex('Legkoe vrashchenie', '-', '20 min'),
    ]),
    null, null,
  ].filter((s): s is NonNullable<typeof s> => s !== null);
}

export const CyclingPlanModule: SportPlanModule = {
  sport: 'cycling',
  phases: { base: basePhase, build: buildPhase, peak: peakPhase, deload: deloadPhase },
};
