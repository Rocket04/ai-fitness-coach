// js/plans/stretching.ts
// Stretching & mobility training plan module

import type { SportPlanModule, SessionPlan, Exercise } from '../core/types.js';

const ex = (n: string, s: string, r: string, w?: string): Exercise => ({ n, s, r, ...(w && { w }) });

const session = (
  sessionType: SessionPlan['sessionType'], name: string, description: string,
  defaultParams: Record<string, number>, exercises: Exercise[],
): Omit<SessionPlan, 'date' | 'sessionId'> => ({
  sport: 'stretching', sessionType, name, description,
  defaultParameters: defaultParams, exercises, mode: 'full', isDeload: false, isRestDay: false,
});

function basePhase(w: number): Omit<SessionPlan, 'date' | 'sessionId'>[] {
  const d = 15 + w;
  return [
    session('mobility', 'Raztyazhka Vsyo telo', 'Raztyazhka vsyego tela ' + d + ' min', { duration: d }, [
      ex('Sheya i plechi', '-', '3 min'), ex('Poyasnitsa', '-', '3 min'), ex('Bedra', '-', '4 min'), ex('Nogi', '-', '3 min'),
    ]),
    session('mobility', 'Raztyazhka Niz tela', 'Raztyazhka nog i bedra ' + d + ' min', { duration: d }, [
      ex('Zadnyaya tsep', '-', '3 min'), ex('Kvadritsep', '-', '3 min'), ex('Ikronnye', '-', '2 min'),
    ]),
    session('mobility', 'Raztyazhka Verh tela', 'Raztyazhka plech i ruk ' + d + ' min', { duration: d }, [
      ex('Plevoy sustav', '-', '4 min'), ex('Zapyastya', '-', '2 min'),
    ]),
    session('mobility', 'Raztyazhka TBS', 'Podvizhnost taza ' + d + ' min', { duration: d }, [
      ex('90/90', '2', '3 min / storona'), ex('Skrutki lezha', '2', '3 min / storona'),
    ]),
    session('mobility', 'Raztyazhka Vsyo telo', 'Raztyazhka vsyego tela ' + d + ' min', { duration: d }, [
      ex('Raztyazhka', '-', (d - 6) + ' min'), ex('Rasslablenie', '-', '3 min'),
    ]),
    session('recovery', 'Raztyazhka Aktivnoe vosstanovlenie', 'Myagkaya raztyazhka ' + (d - 5) + ' min', { duration: d - 5 }, [
      ex('Myagkie dvizheniya', '-', (d - 5) + ' min'),
    ]),
    null,
  ].filter((s): s is NonNullable<typeof s> => s !== null);
}

function buildPhase(w: number): Omit<SessionPlan, 'date' | 'sessionId'>[] {
  const d = 18 + w;
  return [
    session('mobility', 'Raztyazhka Glubokaya', 'Glubokaya raztyazhka ' + d + ' min', { duration: d }, [
      ex('Glubokaya raztyazhka nog', '-', '7 min'), ex('Verh tela', '-', '6 min'), ex('Shavasana', '-', '3 min'),
    ]),
    session('mobility', 'Raztyazhka PNF', 'PNF-raztyazhka ' + d + ' min', { duration: d }, [
      ex('Nogi PNF', '-', '6 min'), ex('Ruki PNF', '-', '6 min'),
    ]),
    session('mobility', 'Raztyazhka Potok', 'Podvizhnostnyy potok ' + d + ' min', { duration: d }, [
      ex('Potok TBS', '-', '8 min'), ex('Potok plech', '-', '8 min'), ex('Zaminka', '-', '3 min'),
    ]),
    session('mobility', 'Raztyazhka In-stil', 'Dlitelnaya raztyazhka ' + (d + 5) + ' min', { duration: d + 5 }, [
      ex('Dolgie asany', '4', '5 min / poza'),
    ]),
    session('mobility', 'Raztyazhka Aktivnaya podvizhnost', 'Kontroliruemaya podvizhnost ' + d + ' min', { duration: d }, [
      ex('CARs Plechi', '1', '5 min'), ex('CARs TBS', '1', '5 min'), ex('CARs Pozvonochnik', '1', '5 min'),
    ]),
    session('recovery', 'Raztyazhka Vosstanovlenie', 'Myagkaya raztyazhka ' + (d - 5) + ' min', { duration: d - 5 }, [
      ex('Intuitivnaya raztyazhka', '-', (d - 5) + ' min'),
    ]),
    null,
  ].filter((s): s is NonNullable<typeof s> => s !== null);
}

function peakPhase(w: number): Omit<SessionPlan, 'date' | 'sessionId'>[] {
  const d = 20 + w;
  return [
    session('mobility', 'Raztyazhka Maksimalnaya', 'Maksimalnaya raztyazhka ' + d + ' min', { duration: d }, [
      ex('Razogrev', '-', '5 min'), ex('Maksimalnaya raztyazhka', '-', (d - 10) + ' min'), ex('Dyhanie', '-', '5 min'),
    ]),
    session('mobility', 'Raztyazhka PNF intensiv', 'PNF-raztyazhka ' + d + ' min', { duration: d }, [
      ex('Nogi PNF', '-', (d / 2) + ' min'), ex('Ruki PNF', '-', (d / 2) + ' min'),
    ]),
    session('mobility', 'Raztyazhka Potok podvizhnosti', 'Podvizhnostnyy potok ' + d + ' min', { duration: d }, [
      ex('Potok TBS', '-', '8 min'), ex('Potok plech', '-', '8 min'), ex('Zaminka', '-', '3 min'),
    ]),
    session('mobility', 'Raztyazhka In glubokiy', 'Glubokiy in ' + (d + 5) + ' min', { duration: d + 5 }, [
      ex('Dolgie asany', '4', '5 min / poza'),
    ]),
    session('recovery', 'Raztyazhka Aktivnoe vosstanovlenie', 'Legkaya podvizhnost ' + (d - 10) + ' min', { duration: d - 10 }, [
      ex('Legkie dvizheniya', '-', (d - 10) + ' min'),
    ]),
    session('mobility', 'Raztyazhka Polnaya praktika', 'Polnaya praktika ' + d + ' min', { duration: d }, [
      ex('Razminka', '-', '5 min'), ex('Osnovnaya chast', '-', (d - 10) + ' min'), ex('Zaminka', '-', '5 min'),
    ]),
    null,
  ].filter((s): s is NonNullable<typeof s> => s !== null);
}

function deloadPhase(): Omit<SessionPlan, 'date' | 'sessionId'>[] {
  return [
    session('recovery', 'Raztyazhka Legkaya', 'Legkaya raztyazhka 10 min', { duration: 10 }, [
      ex('Myagkie dvizheniya', '-', '10 min'),
    ]),
    null,
    session('recovery', 'Raztyazhka Legkaya', 'Legkaya raztyazhka 10 min', { duration: 10 }, [
      ex('Myagkie dvizheniya', '-', '10 min'),
    ]),
    null,
    session('recovery', 'Raztyazhka Legkaya', 'Legkaya raztyazhka 10 min', { duration: 10 }, [
      ex('Myagkie dvizheniya', '-', '10 min'),
    ]),
    null, null,
  ].filter((s): s is NonNullable<typeof s> => s !== null);
}

export const StretchingPlanModule: SportPlanModule = {
  sport: 'stretching',
  phases: { base: basePhase, build: buildPhase, peak: peakPhase, deload: deloadPhase },
};
