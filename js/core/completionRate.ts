import type { Session, SessionPlan } from './types.js';

export function calculateSessionCompletionRate(session: Session, plan: SessionPlan): number {
  if (!session.exerciseResults || session.exerciseResults.length === 0) return 0;
  const completed = session.exerciseResults.reduce((sum, er) => sum + (er.completedSets || 0), 0);
  let planned = 0;
  for (const ex of plan.exercises) {
    const match = ex.s?.match(/(\d+)/);
    planned += match ? parseInt(match[1], 10) : 3;
  }
  if (planned === 0) return 0;
  return Math.min(1.0, Math.max(0, completed / planned));
}

export function calculateWeeklyCompletionRate(sessions: Session[], plans: SessionPlan[], weekStartISO: string): number {
  if (sessions.length === 0) return 0;
  const weekEndDate = new Date(weekStartISO + 'T00:00:00');
  weekEndDate.setDate(weekEndDate.getDate() + 7);
  const weekEndISO = weekEndDate.toISOString().slice(0, 10);
  const inWeek = sessions.filter(s => s.date >= weekStartISO && s.date < weekEndISO);
  if (inWeek.length === 0) return 0;
  const rates = inWeek.map(s => {
    const plan = plans.find(p => p.sessionId === s.key) || plans.find(p => p.date === s.date);
    if (!plan) return 0;
    return calculateSessionCompletionRate(s, plan);
  }).filter(r => r > 0);
  return rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : 0;
}
