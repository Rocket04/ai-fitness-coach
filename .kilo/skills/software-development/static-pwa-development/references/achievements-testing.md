# Achievements Testing Patterns

## Achievement Test Function Signature

Achievement `test` functions in the config receive three parameters:
```javascript
test: (sessions, checkins, streak) => boolean
```

Common mistake: writing single-param functions when the signature passes three args:

**WRONG:**
```javascript
test: checkins => checkins.length >= 7  // checkins is actually sessions!
```

**CORRECT:**
```javascript
test: (_, checkins) => checkins.length >= 7,
progress: (_, checkins) => ({ current: checkins.length, target: 7 })
```

For streak achievements, the streak value is the 3rd parameter:
```javascript
test: (_, __, streak) => streak >= 3,
progress: (_, __, streak) => ({ current: streak, target: 3 })
```

## IndexedDB Mocking for Vitest

When testing code that uses Dexie without a real IndexedDB:

```javascript
import { vi } from 'vitest';

vi.mock('../../core/storage.js', () => ({
  db: {
    achievements: {
      where: vi.fn().mockReturnThis(),
      equals: vi.fn().mockReturnThis(),
      toArray: vi.fn().mockResolvedValue([]),
      bulkAdd: vi.fn().mockResolvedValue(undefined),
    },
  },
}));
```

## Test Helper Functions

```typescript
function makeCheckin(date: string, overrides: Partial<Checkin> = {}): Checkin {
  return {
    date,
    sleepHours: 7,
    restHR: 60,
    hrv: 50,
    hipPain: 0,
    shoulderPain: 0,
    breathing: 'good',
    weight: 70,
    readiness: 'green',
    ts: Date.now(),
    ...overrides,
  };
}

function makeSession(date: string, type: 'A' | 'B' | 'C' = 'A', completed = true): Session {
  return {
    key: `${date}_${type}`,
    date,
    type,
    completed,
    readiness: 'green',
    rpe: 7,
    notes: '',
    updatedAt: Date.now(),
  };
}
```