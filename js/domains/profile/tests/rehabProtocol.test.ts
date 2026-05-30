import { describe, it, expect } from 'vitest';
import {
  getProtocolsForIssues,
  buildRehabSession,
  getRehabDailySession,
  getRehabPreWorkoutExercises,
} from '../rehabProtocol.js';

describe('getProtocolsForIssues', () => {
  it('returns empty array for empty issues', () => {
    expect(getProtocolsForIssues([])).toHaveLength(0);
  });

  it('returns hip protocol for hips issue', () => {
    const protocols = getProtocolsForIssues(['hips']);
    expect(protocols).toHaveLength(1);
    expect(protocols[0].id).toBe('hip_snapping');
  });

  it('returns shoulder protocol for shoulder issue', () => {
    const protocols = getProtocolsForIssues(['shoulder']);
    expect(protocols).toHaveLength(1);
    expect(protocols[0].id).toBe('shoulder_stability');
  });

  it('returns postural protocol for back and neck', () => {
    const protocols = getProtocolsForIssues(['back']);
    expect(protocols).toHaveLength(1);
    expect(protocols[0].id).toBe('postural_restoration');
  });

  it('deduplicates when multiple issues map to same protocol', () => {
    const protocols = getProtocolsForIssues(['back', 'neck']);
    expect(protocols).toHaveLength(1);
  });

  it('returns multiple protocols for different issue categories', () => {
    const protocols = getProtocolsForIssues(['hips', 'shoulder']);
    expect(protocols).toHaveLength(2);
    const ids = protocols.map(p => p.id);
    expect(ids).toContain('hip_snapping');
    expect(ids).toContain('shoulder_stability');
  });

  it('returns empty for unknown issue', () => {
    const protocols = getProtocolsForIssues(['unknown_issue']);
    expect(protocols).toHaveLength(0);
  });
});

describe('buildRehabSession', () => {
  it('returns null for empty protocols', () => {
    expect(buildRehabSession([], { type: 'daily', durationMinutes: 15, name: 'test' })).toBeNull();
  });

  it('builds a session with hip protocol exercises', () => {
    const protocols = getProtocolsForIssues(['hips']);
    const session = buildRehabSession(protocols, { type: 'daily', durationMinutes: 15, name: 'Hip Rehab' });
    expect(session).not.toBeNull();
    expect(session!.sessionType).toBe('mobility');
    expect(session!.sport).toBe('stretching');
    expect(session!.exercises.length).toBeGreaterThan(0);
    expect(session!.exercises.length).toBe(5);
    expect(session!.name).toBe('Hip Rehab');
  });

  it('builds a session with shoulder protocol exercises', () => {
    const protocols = getProtocolsForIssues(['shoulder']);
    const session = buildRehabSession(protocols, { type: 'daily', durationMinutes: 15, name: 'Shoulder Rehab' });
    expect(session).not.toBeNull();
    expect(session!.exercises.length).toBeGreaterThan(0);
    expect(session!.name).toBe('Shoulder Rehab');
  });

  it('includes technique notes in exercise w field', () => {
    const protocols = getProtocolsForIssues(['hips']);
    const session = buildRehabSession(protocols, { type: 'daily', durationMinutes: 15, name: 'Hip' });
    const withNotes = session!.exercises.filter(e => e.w);
    expect(withNotes.length).toBeGreaterThan(0);
  });
});

describe('getRehabDailySession', () => {
  it('returns null for empty issues', () => {
    expect(getRehabDailySession([])).toBeNull();
  });

  it('returns daily session for hip issues', () => {
    const session = getRehabDailySession(['hips']);
    expect(session).not.toBeNull();
    expect(session!.name).toBe('Ежедневная реабилитация');
  });
});

describe('getRehabPreWorkoutExercises', () => {
  it('returns empty array for empty issues', () => {
    expect(getRehabPreWorkoutExercises([])).toHaveLength(0);
  });

  it('returns hip rotation pre-workout for hips', () => {
    const exercises = getRehabPreWorkoutExercises(['hips']);
    expect(exercises.length).toBeGreaterThan(0);
    const hasHipRotation = exercises.some(e => e.n.toLowerCase().includes('вращения'));
    expect(hasHipRotation).toBe(true);
  });

  it('returns empty for shoulder (no pre-workout exercises)', () => {
    const exercises = getRehabPreWorkoutExercises(['shoulder']);
    expect(exercises).toHaveLength(0);
  });
});
