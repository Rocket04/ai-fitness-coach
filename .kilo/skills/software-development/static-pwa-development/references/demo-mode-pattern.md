# Demo Mode Pattern — Isolated IndexedDB Sandbox

## Architecture

Demo mode uses a completely separate IndexedDB database so synthetic data never touches the user's real data. On activation, the demo DB is populated with 30 days of realistic data. On deactivation, the demo DB is cleared and the app switches back to the real DB.

## Implementation

### 1. Storage Layer (`js/core/storage.ts`)

Module-level demo state (MUST be declared before any functions that use them):
```typescript
let _demoMode = false;
let _demoDb: Dexie | null = null;
```

All CRUD functions use `_db()` wrapper:
```typescript
function _db() { return _demoMode && _demoDb ? _demoDb : db; }
```

### 2. Demo Data Generator (`js/core/demoData.ts`)
Use seeded RNG (mulberry32, seed=42) for reproducibility. Generate 30 days of:
- Checkins: sinusoidal recovery cycle + noise for HRV, sleep, RHR, subjective scores
- Sessions: ~12-13 workouts on Mon/Wed/Fri with types A/B/C, RPE 5-9
- Settings: running sports, smart_watch gadget

### 3. Pitfalls
- **TDZ**: `_demoMode` must be declared BEFORE `_db()` and `getActiveDb()` functions.
- **Schema definition**: Use `db.version(2).stores(...)` NOT `_db().version(2)` for schema.
- **Re-import after mode switch**: Store must reload all data from new DB after activation.
