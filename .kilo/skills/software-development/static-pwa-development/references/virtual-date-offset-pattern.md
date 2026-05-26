# Virtual Date Offset Pattern

## Architecture

The virtual date offset system allows the entire app to operate on a shifted date for testing. Components call `getAppDate()` instead of `new Date()`. The offset flows through `computeDerived()` → `getAppDateSync(offset)`.

## Key Files

### helpers.ts
```typescript
let _virtualTodayOffset = 0;
export function setVirtualTodayOffset(offset: number) { _virtualTodayOffset = offset; }
export function getAppDate(): Date { const d = new Date(); d.setDate(d.getDate() + _virtualTodayOffset); return d; }
export function getAppDateSync(offset: number = 0): Date { const d = new Date(); d.setDate(d.getDate() + offset); return d; }
```

### useAppStore.ts
- State: `virtualTodayOffset: number` (default 0, persisted via saveSetting)
- Action: `setVirtualTodayOffset(v)` → saveSetting + set module-level + recompute derived
- computeDerived accepts `virtualTodayOffset` parameter

## Pitfalls
- TDZ: `let _virtualTodayOffset` must be declared before any function using it
- Store must call `setVirtualTodayOffset(vto)` after `set(...)` in initApp
- Use `setDate()` not manual arithmetic for month/year rollover
