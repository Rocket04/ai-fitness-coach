# Demo Data Generation Pattern

## Generator Design (`js/core/demoData.ts`)

### Seeded RNG
Use mulberry32 for deterministic, reproducible output:
```typescript
function createRNG(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```

### Recovery Pattern
Sinusoidal cycle + noise simulates realistic athlete recovery:
```typescript
const cycle = Math.sin((i / 30) * Math.PI * 2 - Math.PI / 2); // -1 to 1
const noise = (rng() - 0.5) * 2;
const recovery = cycle * 0.6 + noise * 0.4;
```

### Data Shapes
- **Checkins (30 days)**: sleepHours (5.5-9.5), HRV (38-78), restHR (52-72), subjective (1-5), weight (76.5-79.5)
- **Sessions (~12-13)**: Mon/Wed/Fri only, types A/B/C cycling, RPE 5-9, completed=true, readiness based on recovery
- **Settings**: startDate = day 0, trainDays = [1,3,5], checkinTier = 'medium'

### Integration Placeholder Pattern
Cards in ProfilePage with icon + name + disabled button:
- On click → Modal with "Интеграция в разработке" + email input
- Store emails to `waitlist` Dexie table (no API calls)
- CSS: `.integration-cards`, `.integration-card` with flex layout
