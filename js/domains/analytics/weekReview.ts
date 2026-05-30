import type { Session, TrendPoint } from '../../shared/types.js';
import { addDays, formatISO } from '../../shared/helpers.js';

export interface BestLiftDelta {
  exerciseName: string;
  currentWeight: number;
  previousWeight: number;
  unit: string;
}

export function getBestLiftDelta(sessions: Session[]): BestLiftDelta | null {
  const apreSessions = sessions
    .filter(s => s.completed && s.apreResults && s.apreResults.length > 0)
    .sort((a, b) => b.date.localeCompare(a.date));

  if (apreSessions.length < 2) return null;

  const latestDate = apreSessions[0].date;
  const latest = new Date(latestDate);
  const weekAgo = addDays(latest, -6);
  const twoWeeksAgo = addDays(latest, -13);

  const thisWeekSessions = apreSessions.filter(s => s.date >= formatISO(weekAgo) && s.date <= latestDate);
  const lastWeekSessions = apreSessions.filter(s => s.date >= formatISO(twoWeeksAgo) && s.date < formatISO(weekAgo));

  if (thisWeekSessions.length === 0 || lastWeekSessions.length === 0) return null;

  let best: BestLiftDelta | null = null;
  let bestDelta = -Infinity;

  for (const twSession of thisWeekSessions) {
    for (const apre of twSession.apreResults!) {
      const lastWeekMatch = lastWeekSessions
        .flatMap(s => s.apreResults!)
        .find(a => a.exerciseName === apre.exerciseName);

      if (!lastWeekMatch) continue;

      const delta = apre.nextRM - lastWeekMatch.nextRM;
      if (delta > bestDelta) {
        bestDelta = delta;
        best = {
          exerciseName: apre.exerciseName,
          currentWeight: apre.nextRM,
          previousWeight: lastWeekMatch.nextRM,
          unit: apre.unit,
        };
      }
    }
  }

  return best;
}

export function getPreviousWeekAvgScore(trendData30: TrendPoint[]): { currentAvg: number; previousAvg: number } | null {
  if (trendData30.length < 14) return null;

  const sorted = [...trendData30].sort((a, b) => a.date.localeCompare(b.date));
  const last14 = sorted.slice(-14);

  const previousWeek = last14.slice(0, 7);
  const currentWeek = last14.slice(-7);

  const avg = (points: TrendPoint[]): number =>
    Math.round(points.reduce((sum, p) => sum + p.recoveryScore, 0) / points.length);

  return {
    currentAvg: avg(currentWeek),
    previousAvg: avg(previousWeek),
  };
}
