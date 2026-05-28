# SUBTASK 5 — TodayPage wire-up + fatigue/pain UI

**Working directory:** `C:\Projects\fitness-tracker`

**Prerequisites:** Subtask 0 (types.ts), Subtask 3 (store), Subtask 4 (ExerciseCard) must be completed first.

## Task

Modify `js/ui/pages/TodayPage.jsx` to:
1. Wire `onSetComplete` prop on ExerciseCard to the store's `updateSetResult` action
2. Add post-session fatigue and pain input fields
3. Add `updateSetResult`, `setPostSessionFatigue`, `setPostSessionPain` to `AppDispatch` interface in types.ts

## Changes

### 1. Modify `js/core/types.ts` — Add to `AppDispatch` interface:

If Subtask 0 already added these, skip. If not, add:
```typescript
updateSetResult: (result: SetResult) => void;
setPostSessionFatigue: (v: number) => void;
setPostSessionPain: (v: number) => void;
```

### 2. Modify `js/ui/pages/TodayPage.jsx`:

#### a) Destructure new actions from store:

In the main component body, after existing store destructuring, add:
```javascript
const updateSetResult = useAppStore(s => s.updateSetResult);
const postSessionFatigue = useAppStore(s => s.postSessionFatigue);
const postSessionPain = useAppStore(s => s.postSessionPain);
const setPostSessionFatigue = useAppStore(s => s.setPostSessionFatigue);
const setPostSessionPain = useAppStore(s => s.setPostSessionPain);
```

#### b) Pass `onSetComplete` to ExerciseCard:

Find the `React.createElement(ExerciseCard, { ... })` call (around line 621). Add the prop:
```javascript
onSetComplete: (exName, setNum, reps) => {
  updateSetResult({ exerciseName: exName, setNumber: setNum, completed: reps > 0, repsDone: reps });
},
```

#### c) Add fatigue/pain inputs after the exercise list:

After the exercise list rendering block (after the ExerciseConfigModal), add a collapsible section:

```javascript
// Post-session feedback
React.createElement(Collapsible, {
  title: 'Самочувствие после тренировки',
  icon: React.createElement(PersonStanding, { size: 16 }),
  defaultOpen: false,
},
  React.createElement('div', { style: { padding: 'var(--spacing-sm) 0' } },
    React.createElement('label', { style: { display: 'block', marginBottom: 'var(--spacing-sm)' },
      React.createElement('span', { style: { fontSize: '0.85rem', color: 'var(--text2)', display: 'block', marginBottom: '4px' } },
        'Усталость (1-10)'
      ),
      React.createElement('input', {
        type: 'range', min: 1, max: 10,
        value: postSessionFatigue || 1,
        onChange: e => setPostSessionFatigue(Number(e.target.value)),
        style: { width: '100%' },
      }),
      React.createElement('span', { style: { fontSize: '0.75rem', color: 'var(--text3)' } },
        postSessionFatigue ? `${postSessionFatigue}/10` : '—'
      )
    ),
    React.createElement('label', { style: { display: 'block' },
      React.createElement('span', { style: { fontSize: '0.85rem', color: 'var(--text2)', display: 'block', marginBottom: '4px' } },
        'Боль (0-10)'
      ),
      React.createElement('input', {
        type: 'range', min: 0, max: 10,
        value: postSessionPain || 0,
        onChange: e => setPostSessionPain(Number(e.target.value)),
        style: { width: '100%' },
      }),
      React.createElement('span', { style: { fontSize: '0.75rem', color: 'var(--text3)' } },
        postSessionPain !== undefined ? `${postSessionPain}/10` : '—'
      )
    )
  )
),
```

## Important rules
- Follow existing `React.createElement` style — do NOT convert to JSX
- `PersonStanding` is already imported from lucide-react (check imports)
- `Collapsible` is already imported
- Do NOT modify any other files except TodayPage.jsx and types.ts (AppDispatch only)

## Verification
```powershell
cd C:\Projects\fitness-tracker; npm run type-check
```
Must pass with 0 errors.
