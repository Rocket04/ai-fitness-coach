// js/plans/calisthenics.ts
// Calisthenics-focused periodized training plan module
// Re-engineered for posture improvement, scapular control, and shoulder/hip stabilization

import type { SportPlanModule, SessionPlan, Exercise } from '../core/types.js';

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
    session('strength', 'Kalistenika: Tyaga i Osanka', 'Pre-aktivatsiya lopatok i ukreplenie verha spiny dlya osanki', { sets: 3, reps: 8 }, [
      cal('Podtyagivaniya parallelnym khvatom', '3', '3-5', 'Pered podtyagivaniem tyanut lopatki vniz, bez dead-hang', 1),
      cal('Lopatochnye podtyagivaniya (Scapular pull-ups)', '3', '8-10', 'Aktivnyy kontrol plechevyh sustavov', 1),
      cal('Avstraliyskie podtyagivaniya', '3', '8-10', 'Grudyu k perekladine, kontrolirovat opuskie', 1),
      cal('W-podem lezha na zhivote', '3', '10-12', 'Bez vesa / ganteli 1.5kg, dlya nizhney trapezii', 1),
      cal('Mertvyy zhuk (Dead bug)', '3', '10-12', 'Kontrolirovat poyasnitsu na polu', 1),
    ]),
    null,
    session('strength', 'Kalistenika: Zhim i Zubchataya', 'Stabilizatsiya plechevogo poyasa i rabota nad peredney zubchatoy', { sets: 3, reps: 8 }, [
      cal('Otzhimaniya temp 3-0-1', '3', '6-8', '3 sek opuskie, pod-em na 1 sek', 1),
      cal('Push-up plus (otzhimaniya s protrakciey)', '3', '10', 'Vverhu silno push ot pola, okruglyaya lopatki', 1),
      cal('Vneshnyaya rotatsiya plecha s gantelyami 1.5kg', '3', '10-12', 'Dlya stabilizatsii rotatornoy cuff', 1),
      cal('Planka na predplechyah', '3', '30-40 sek', 'Zazhat yagoditsy, ne progibat poyasnitsu', 1),
    ]),
    null,
    session('strength', 'Kalistenika: Niz i Glubokiy Kor', 'Stabilizatsiya taza i bedra, ukreplenie gluteus medius', { sets: 3, reps: 10 }, [
      cal('Yagodichnyy most na odnoy noge', '3', '10 / storona', 'Dlya korrektsii disbalansa psoasa i yagodits', 1),
      cal('Raskladushka (Clamshells)', '3', '12-15 / storona', 'Stabilizatsiya taza, ukreplenie gluteus medius', 1),
      cal('Vypady nazad', '3', '8-10 / storona', 'Kontrol kolena, bolee myagkaya nagruzka na TBS', 1),
      cal('Soba-ohotnik (Bird dog)', '3', '10 / storona', 'Kontrol ravnovesiya', 1),
    ]),
    session('power', 'Kalistenika: Legkaya Mobilnost', 'Vosstanovlenie, mobilnost plech i taza', { sets: 3, reps: 5 }, [
      cal('Wall slides (slides u steny)', '3', '8-10', 'Thoracic mobilnost i trapeziya', 1),
      cal('Koska-korova (Cat-cow)', '3', '10', 'Mobilizatsiya pozvonochnika', 1),
      cal('Mobilnost TBS 90/90', '2', '5-6 / storona', 'Razblokirovka clicking hip', 1),
    ]),
    null,
  ].filter((s): s is NonNullable<typeof s> => s !== null);
}

function buildPhase(_w: number): Omit<SessionPlan, 'date' | 'sessionId'>[] {
  return [
    session('strength', 'Kalistenika: Tyaga (Uvelichenie)', 'Uvelichenie ob-ema tyagi i postury', { sets: 4, reps: 6 }, [
      cal('Podtyagivaniya parallelnym khvatom', '4', '4-6', 'Tense shoulders, bez dead-hang', 2),
      cal('Lopatochnye podtyagivaniya (zaderzhka 2s)', '3', '8', 'Uderzhat vverhu', 2),
      cal('Avstraliyskie podtyagivaniya (nizkiy ugol)', '3', '10', 'Sblizhenie lopatok', 2),
      cal('W-podem lezha na zhivote (ganteli 1.5kg)', '3', '10', 'Nizhnyaya trapeziya', 2),
      cal('Mertvyy zhuk (s povorotom)', '3', '12', 'Kontrol kora', 2),
    ]),
    null,
    session('strength', 'Kalistenika: Zhim (Kontrol)', 'Uvelichenie sily zhima i plechevogo kontrolya', { sets: 4, reps: 6 }, [
      cal('Otzhimaniya ot pola', '4', '10-12', 'Plavno, bez sryvov', 2),
      cal('Push-up plus (ot pola)', '3', '12', 'Maksimalnoe vytyagivanie vverh', 2),
      cal('Face pulls s rezinoy / gantelyami', '3', '12', 'Zadnyaya delta, lopatki', 2),
      cal('Wall slides', '3', '10-12', 'Podvizhnost plech i grudi', 2),
    ]),
    null,
    session('power', 'Kalistenika: Niz (Stabilizatsiya)', 'Razvitie sily i balansa beder', { sets: 4, reps: 5 }, [
      cal('Rumynskaya tyaga s gantelyami 4kg', '3', '12', 'Kontrol bedra, spina pryamaya', 2),
      cal('Yagodichnyy most (zaderzhka 2s)', '3', '12', 'Zazhat yagoditsy vverhu', 2),
      cal('Clamshells (s rezinoy)', '3', '15', 'Gluteus medius', 2),
      cal('Bird dog s uderzhaniem 3s', '3', '10', 'Stabilnost pozvonochnika', 2),
    ]),
    session('power', 'Kalistenika: Navyki i Kor', 'Mertvyy zhuk i planki dlya kora', { sets: 3, reps: 5 }, [
      cal('Podem kolen k grudi v vise', '3', '8-10', 'Medlenno, bez raskachki', 2),
      cal('Planka s kasaniem plecha', '3', '8-10 / storona', 'Ne rascachivat taz', 2),
    ]),
    null,
  ].filter((s): s is NonNullable<typeof s> => s !== null);
}

function peakPhase(_w: number): Omit<SessionPlan, 'date' | 'sessionId'>[] {
  return [
    session('strength', 'Kalistenika: Tyaga (Maks)', 'Maksimalnaya rabota na podtyagivaniyakh', { sets: 5, reps: 3 }, [
      cal('Podtyagivaniya parallelnym khvatom', '4', '6', 'Kontrolirovat negativnuyu fazu', 3),
      cal('Lopatochnye podtyagivaniya v vise', '3', '10', 'Maksimalnaya amplituda lopatok', 3),
      cal('Avstraliyskie podtyagivaniya (ugol 30 gr)', '3', '10-12', 'Maksimalnoe svedenie lopatok', 3),
      cal('W-podem lezha na zhivote (ganteli 1.5kg)', '3', '12', 'Osanka i plechi', 3),
    ]),
    null,
    session('strength', 'Kalistenika: Zhim (Maks)', 'Ukreplenie rotatornoy cuff i sily zhima', { sets: 5, reps: 3 }, [
      cal('Otzhimaniya ot pola (temp 3-1-1)', '4', '12', '1 sek uderzhat vniz', 3),
      cal('Push-up plus (medlenno)', '3', '12', 'Kontrol zubchatoy', 3),
      cal('Wall slides (kontseptualno)', '3', '12', ' thoracic podvizhnost', 3),
      cal('Pike push-ups ot stola / stula', '3', '6-8', 'Umerennaya vertikalnaya stabilizatsiya', 3),
    ]),
    null,
    session('power', 'Kalistenika: Niz (Maks)', 'Maksimalnyy balans nog i beder', { sets: 5, reps: 3 }, [
      cal('Rumynskaya tyaga na odnoy noge s gantelyami', '3', '8 / storona', 'Ukreplenie stop i stabilizatorov bedra', 3),
      cal('Clamshells (s poyasom intensiv)', '3', '15-20 / storona', 'Gluteus medius v ogne', 3),
      cal('Prisedaniya (gantel 4kg u grudi)', '3', '12', 'Temp medlennyy, kontrol klikaniya bedra', 3),
      cal('Bird dog (zaderzhka 5s)', '3', '8 / storona', 'Kor v napryazhenii', 3),
    ]),
    session('power', 'Kalistenika: Kor i Prehab', 'Kompleks dlya zashchity plech i poyasnitsy', { sets: 3, reps: 2 }, [
      cal('Planka s vytyagivaniem ruki vpered', '3', '8 / storona', 'Kor', 3),
      cal('Vneshnyaya rotatsiya plecha s gantelyami 4kg', '3', '10', 'Rotator cuff uvelichenie', 3),
    ]),
    null,
  ].filter((s): s is NonNullable<typeof s> => s !== null);
}

function deloadPhase(): Omit<SessionPlan, 'date' | 'sessionId'>[] {
  return [
    session('recovery', 'Kalistenika: Decompression', 'Zashchita plech, datskaya poza, box breathing', { sets: 2, reps: 5 }, [
      cal('Lopatochnye podtyagivaniya (legko)', '2', '8', 'Myagkaya aktivatsiya', 1),
      cal('Koska-korova (Cat-cow)', '3', '10', 'Myagkaya mobilizatsiya', 1),
      cal('Detskaya poza (Child pose) s dyhaniem', '3', '1 min', 'Vosstanovlenie plech i beder', 1),
      cal('Mertvyy zhuk (medlenno)', '2', '8', 'Zashchita poyasnitsy', 1),
      cal('Kvadratnoe dyhanie (Box breathing)', '1', '5 min', 'Asthma recovery & RHR snyzhnie', 1),
    ]),
    null, null, null,
    session('recovery', 'Kalistenika: Decompression', 'Zashchita plech, datskaya poza, box breathing', { sets: 2, reps: 5 }, [
      cal('Wall slides (myagko)', '2', '8', 'Thoracic podvizhnost', 1),
      cal('Mobilnost TBS 90/90', '2', '5 / storona', 'Razblokirovka bedra', 1),
      cal('Shavasana (Rasslablenie)', '1', '10 min', 'Snyzhnie stressa', 1),
    ]),
    null, null,
  ].filter((s): s is NonNullable<typeof s> => s !== null);
}

export const CalisthenicsPlanModule: SportPlanModule = {
  sport: 'calisthenics',
  phases: { base: basePhase, build: buildPhase, peak: peakPhase, deload: deloadPhase },
};
