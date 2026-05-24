// js/plans/calisthenics.ts
// Calisthenics-focused periodized training plan module

import type { SportPlanModule, SessionPlan, Exercise, ApreProtocolKey } from '../core/types.js';

const ex = (n: string, s: string, r: string, w?: string, protocol?: ApreProtocolKey, rm?: number): Exercise => ({
  n, s, r, ...(w && { w }), ...(protocol && { isApre: true, protocol, currentRM: rm ?? 0 }),
});

const cal = (n: string, s: string, r: string, w?: string, level?: number): Exercise => ({
  n, s, r, ...(w && { w }), isCalisthenics: true, ...(level ? { calisthenicLevel: level } : {}),
});

const session = (
  sessionType: SessionPlan['sessionType'], name: string, description: string,
  defaultParams: Record<string, number>, exercises: Exercise[],
): Omit<SessionPlan, 'date' | 'sessionId'> => ({
  sport: 'calisthenics', sessionType, name, description,
  defaultParameters: defaultParams, exercises, mode: 'full', isDeload: false, isRestDay: false,
});

function basePhase(_w: number): Omit<SessionPlan, 'date' | 'sessionId'>[] {
  return [
    session('strength', 'Calisthenica Tyaga + Kor', 'Podtyagivaniya, Kor', { sets: 3, reps: 8 }, [
      cal('Podtyagivaniya parallelnym khvat', '3', '5-6', 'NE do otzyva', 1),
      cal('Avstraliyskie podtyagivaniya', '3', '8-10', 'Telo pryamoe', 1),
      cal('W-podem lezha', '3', '10', 'Nizhnie trapezyy', 1),
      cal('Podem nog v vis', '3', '6-8', 'Kor', 1),
    ]),
    null,
    session('strength', 'Calisthenica Zhim + Navyki', 'Otzhimaniya, Navyki balansa', { sets: 3, reps: 8 }, [
      cal('Otzhimaniya temp 3-0-1', '3', '6-8', '3 sek vniz', 1),
      cal('Otzhimaniya na brys', '3', '4-6', 'Chastichnaya amplituda', 1),
      cal('Push-up plus', '3', '8', 'perednyaya zubchataya', 1),
      cal('L-sit na polu', '3', '10-15 sek', 'Baza dlya stoek', 1),
    ]),
    null,
    session('strength', 'Calisthenica Niz + Mobilnost', 'Prisedaniya, Vypady, Mobilnost', { sets: 3, reps: 10 }, [
      cal('Prisedaniya na odne noge (assist)', '3', '5-6 / storona', 'Kontrol', 1),
      cal('Vypady nazad', '3', '8 / storona', 'Koleno ne vykhodit', 1),
      cal('Yagodichnyy most odnogiy', '3', '10 / storona', 'Zadnyaya tsep', 1),
      cal('Mobilnost TBS', '-', '10 min'),
    ]),
    session('power', 'Calisthenica Navyki', 'Flag progressiya, Handstand u steny', { sets: 5, reps: 5, level: 2 }, [
      cal('Flag Tokhchok s partnerom', '5', '3-5 sek', 'Uroven 2', 2),
      cal('Handstand u steny', '5', '15-20 sek', 'Pryamoe telo', 2),
      cal('Mostik', '3', '10 sek', 'Podvizhnost plech', 1),
    ]),
    null,
  ].filter((s): s is NonNullable<typeof s> => s !== null);
}

function buildPhase(_w: number): Omit<SessionPlan, 'date' | 'sessionId'>[] {
  return [
    session('strength', 'Calisthenica Tyaga prodvinutaya', 'Podtyagivaniya shirokim khvatom', { sets: 4, reps: 6, level: 2 }, [
      ex('Podtyagivaniya', '4', '6-8', 'Shirokiy khvat', 'APRE_6'),
      cal('Avstraliyskie odno rukoy', '3', '6 / storona', 'Progressiya', 2),
      cal('Tyaga na TRX', '3', '12', 'Sblizhenie lopatok', 2),
      cal('Podem nog Ugolok', '3', '15 sek', 'Kor', 2),
    ]),
    null,
    session('strength', 'Calisthenica Zhim prodvinutyy', 'Brisy polnye', { sets: 4, reps: 6, level: 2 }, [
      cal('Otzhimaniya na brys polnye', '4', '6-8', 'Polnaya amplituda', 2),
      cal('Otzhimaniya s nogami na vysote', '3', '8-10', 'Novyy ugol', 2),
      cal('Pike push-up', '3', '6-8', 'Progressiya k stoyke', 2),
      cal('Planche lean', '3', '10-15 sek', 'Baza planche', 2),
    ]),
    null,
    session('power', 'Calisthenica Niz + Navyki', 'Pistol squats, Front lever', { sets: 4, reps: 5, level: 3 }, [
      cal('Pistol (assist)', '4', '4-5 / storona', 'Kontrol', 3),
      cal('Front lever Tuck', '5', '5-8 sek', 'Gorizontal', 3),
      cal('Dragon flag Neg', '3', '3', 'Kor', 3),
    ]),
    session('power', 'Calisthenica Navyki prodvinutye', 'Muscle-up progressiya', { sets: 5, reps: 3, level: 3 }, [
      cal('Muscle-up Negatives', '5', '3', 'Negativnaya faza', 3),
      cal('Handstand Kick ups', '5', '20 sek', 'Balans', 3),
      cal('Flag Advanced tuck', '5', '3-5 sek', 'Uroven 3', 3),
    ]),
    null,
  ].filter((s): s is NonNullable<typeof s> => s !== null);
}

function peakPhase(_w: number): Omit<SessionPlan, 'date' | 'sessionId'>[] {
  return [
    session('strength', 'Calisthenica Maks tyaga', 'Podtyagivaniya s otyagoshcheniem', { sets: 5, reps: 3, level: 4 }, [
      ex('Podtyagivaniya + otyagoshchenie', '5', '3-5', 'Poyas s vesom', 'APRE_3'),
      cal('Typewriter pull-ups', '3', '3 / storona', 'Plavno', 4),
      cal('Hanging L-sit', '3', '15 sek', 'Kor', 3),
    ]),
    null,
    session('strength', 'Calisthenica Maks zhim', 'Brisy s otyagoshcheniem', { sets: 5, reps: 3, level: 4 }, [
      ex('Brisy + otyagoshchenie', '5', '4-6', 'Poyas s vesom', 'APRE_3'),
      cal('HSPU u steny neg', '5', '3', 'Negativ', 4),
      cal('Archer push-ups', '3', '5 / storona', 'Asimmetriya', 4),
      cal('Planche Advanced tuck', '5', '8 sek', 'Prodvinutyy', 4),
    ]),
    null,
    session('power', 'Calisthenica Pik navykov', 'Front lever, Back lever', { sets: 5, reps: 3, level: 4 }, [
      cal('Front lever Single leg', '5', '5 sek', 'Progressiya', 4),
      cal('Back lever Tuck', '5', '8 sek', 'Zadniy balans', 4),
    ]),
    session('power', 'Calisthenica Shou navykov', 'Muscle-up, Handstand walk', { sets: 5, reps: 2, level: 5 }, [
      cal('Muscle-up', '5', '1-2', 'Polnyy vyhod', 5),
      cal('Handstand walk', '-', '5 m', 'Khodba na rukah', 5),
    ]),
    null,
  ].filter((s): s is NonNullable<typeof s> => s !== null);
}

function deloadPhase(): Omit<SessionPlan, 'date' | 'sessionId'>[] {
  return [
    session('recovery', 'Calisthenica Legkie navyki', 'Legkaya praktika', { sets: 2, reps: 5, level: 1 }, [
      cal('Podtyagivaniya', '2', '5', 'Legko, 50% usiliya', 1),
      cal('Otzhimaniya', '2', '8', 'Legko', 1),
      cal('Mobilnost', '-', '15 min'),
    ]),
    null, null, null,
    session('recovery', 'Calisthenica Legkie navyki', 'Legkaya praktika', { sets: 2, reps: 5, level: 1 }, [
      cal('Avstraliyskie podtyagivaniya', '2', '8', 'Legko', 1),
      cal('Pike push-up', '2', '5', 'Legko', 1),
      cal('Raztyazhka', '-', '15 min'),
    ]),
    null, null,
  ].filter((s): s is NonNullable<typeof s> => s !== null);
}

export const CalisthenicsPlanModule: SportPlanModule = {
  sport: 'calisthenics',
  phases: { base: basePhase, build: buildPhase, peak: peakPhase, deload: deloadPhase },
};
