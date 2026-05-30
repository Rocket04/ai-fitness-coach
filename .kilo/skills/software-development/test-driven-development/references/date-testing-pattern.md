# Testing Date-Dependent Code

## Problem
Functions that calculate streaks, schedules, or time-based logic use `new Date()` internally. Tests become non-deterministic because "today" changes every day.

## Solution: Reference Date Parameter

Always accept an optional `referenceDate` parameter in functions that work with dates:

```typescript
// Before: Non-deterministic
export function getStreak(checkins: Checkin[]): number {
  const today = new Date(); // Always today!
  // ...
}

// After: Testable
export function getStreak(checkins: Checkin[], referenceDate?: Date): number {
  const today = referenceDate || new Date(); // Configurable for tests
  // ...
}
```

## Test Pattern

```typescript
import { describe, it, expect } from 'vitest';
import { getStreak } from '../../core/streak.js';

const TEST_DATE = new Date('2025-01-10T12:00:00');

describe('getStreak', () => {
  it('counts consecutive days correctly', () => {
    const checkins = [
      { date: '2025-01-10' },
      { date: '2025-01-09' },
      { date: '2025-01-08' },
    ];
    
    // Pass TEST_DATE to make the test deterministic
    expect(getStreak(checkins, TEST_DATE)).toBe(3);
  });
});
```

## Key Insights

1. **Use `formatISO` consistently** - Ensures date strings match between test data and function output
2. **Build `Set` for O(1) lookups** - `dates.has(dateStr)` instead of `dates.includes(dateStr)`
3. **Walk backwards from reference date** - Start at i=0 and increment to count consecutive days
4. **Don't forget default parameter** - `referenceDate || new Date()` maintains backward compatibility

## TDD Workflow for Date Functions

1. Write test with specific reference date (e.g., `2025-01-10`)
2. Watch it fail (function doesn't exist or uses wrong date)
3. Implement with reference date parameter
4. Test passes
5. Add edge cases (gaps in dates, empty arrays, boundary conditions)