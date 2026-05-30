# Testing IndexedDB-Dependent Code

## Problem
Vitest/JSDOM test environments do not have IndexedDB available by default. Code that directly imports Dexie or uses `db.table.put/get` will fail with `DatabaseClosedError: IndexedDB API missing`.

## Solution: Mock Dexie for Tests

Create a mock module in `js/tests/__mocks__/dexie-mock.ts`:

```typescript
// js/tests/__mocks__/dexie-mock.ts
import { vi } from 'vitest';

const mockTable = {
  bulkAdd: vi.fn().mockResolvedValue(undefined),
  bulkPut: vi.fn().mockResolvedValue(undefined),
  clear: vi.fn().mockResolvedValue(undefined),
  count: vi.fn().mockResolvedValue(0),
  delete: vi.fn().mockResolvedValue(undefined),
  get: vi.fn().mockResolvedValue(undefined),
  getAll: vi.fn().mockResolvedValue([]),
  put: vi.fn().mockResolvedValue(undefined),
  where: vi.fn().mockReturnThis(),
  first: vi.fn().mockResolvedValue(undefined),
  toArray: vi.fn().mockResolvedValue([]),
};

export const db = {
  achievements: { ...mockTable },
  checkins: { ...mockTable },
  sessions: { ...mockTable },
  settings: { ...mockTable },
  close: vi.fn().mockResolvedValue(undefined),
  open: vi.fn().mockResolvedValue(undefined),
  table: vi.fn().mockReturnValue(mockTable),
};

export const Dexie = {
  Table: vi.fn(),
};

export default Dexie;
```

## In Test Files

```typescript
import { vi, beforeEach } from 'vitest';
import { db } from '../../core/storage.js';

// Mock the db import
vi.mock('../../core/storage.js', () => ({
  db: {
    achievements: {
      where: vi.fn().mockReturnThis(),
      equals: vi.fn().mockReturnThis(),
      first: vi.fn().mockResolvedValue(undefined),
      put: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn().mockResolvedValue(undefined),
    },
    // ... other tables
  },
}));

beforeEach(async () => {
  // Clear mock data between tests
});
```

## Alternative: vitest-environment node

For tests that need actual IndexedDB behavior, use `vitest-environment miniflavor` with a fake-indexeddb polyfill, but this adds complexity. Mocking is usually sufficient for unit tests.

## Common Patterns

### Achievevents Schema Mock
```typescript
db.achievements = {
  where: vi.fn().mockImplementation((field) => ({
    equals: vi.fn().mockReturnThis(),
    first: vi.fn().mockResolvedValue(null), // Not earned yet
  })),
  bulkAdd: vi.fn().mockResolvedValue(undefined),
  put: vi.fn().mockResolvedValue(undefined),
};
```

### Check if Already Earned
```typescript
const exists = await db.achievements
  .where('key')
  .equals(achievementKey)
  .first();

if (exists) return []; // Already earned
```

## Key Insight
Always test with today's date context or pass a `referenceDate` parameter to date-dependent functions to make tests deterministic. The streak functions need this for predictable results.