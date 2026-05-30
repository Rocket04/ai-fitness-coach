# SUBTASK 4 — ExerciseCard per-set checkboxes for non-APRE exercises

**Working directory:** `C:\Projects\fitness-tracker`

**Prerequisite:** Subtask 0 (types.ts changes) must be completed first.

## Task

Modify `js/ui/components/ExerciseCard.jsx` to add per-set completion checkboxes for non-APRE exercises.

## Current behavior (keep unchanged)
- APRE exercises show 4 sets with AMRAP inputs for set3/set4 — do NOT change this
- Non-APRE exercises currently just show name, sets×reps, and optional weight note
- Card uses `React.createElement` syntax internally (do NOT convert to JSX — follow existing style)

## Changes

### 1. Add new prop to the component signature:
```javascript
export default function ExerciseCard({ ex, recoveryScore = 100, onApreResult, onConfigure, isConfigured = true, onSetComplete }) {
```
Add `onSetComplete` as the last parameter.

### 2. Add local state for set completion:
Inside the component (after existing useState declarations), add:
```javascript
const [completedSets, setCompletedSets] = useState([]); // array of set numbers that are checked
```

### 3. For non-APRE exercises (after the existing non-APRE rendering block):

Replace the current simple non-APRE rendering (the block handling `if (!isApre || !sets)`) with:

```javascript
if (!isApre || !sets) {
  // Parse sets from ex.s field
  let numSets = 3; // default
  if (ex.s) {
    const match = ex.s.match(/(\d+)/);
    if (match) numSets = parseInt(match[1], 10);
  }
  const repsLabel = ex.r || '—';
  const weightNote = ex.w || ex.c || '';

  const setsArray = Array.from({ length: numSets }, (_, i) => i + 1);

  return React.createElement('div', { className: 'exercise-row' },
    // Exercise name and info
    React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' } },
      React.createElement('span', { className: 'exercise-name' }, ex.n),
      React.createElement('span', { style: { fontSize: '0.75rem', color: 'var(--text3)' } }, `${ex.s || '3'} × ${repsLabel}`)
    ),
    // Per-set checkboxes
    ...setsArray.map(setNum => {
      const isChecked = completedSets.includes(setNum);
      return React.createElement('label', {
        key: setNum,
        style: {
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '6px 8px', borderRadius: 'var(--radius-sm)',
          background: isChecked ? 'rgba(74, 222, 128, 0.1)' : 'transparent',
          border: `1px solid ${isChecked ? 'var(--green)' : 'var(--border)'}`,
          marginBottom: '4px', cursor: 'pointer',
          transition: 'all var(--transition-fast)',
        },
      },
        React.createElement('input', {
          type: 'checkbox',
          checked: isChecked,
          onChange: () => {
            if (isChecked) {
              setCompletedSets(prev => prev.filter(s => s !== setNum));
            } else {
              setCompletedSets(prev => [...prev, setNum]);
              // Callback to parent store
              if (typeof onSetComplete === 'function') {
                onSetComplete(ex.n, setNum, parseInt(ex.r, 10) || 0);
              }
            }
          },
          style: { accentColor: 'var(--green)' },
        }),
        React.createElement('span', { style: { fontSize: '0.85rem', color: isChecked ? 'var(--green)' : 'var(--text2)' } },
          `Подход ${setNum}: ${repsLabel} повт.${weightNote ? ` • ${weightNote}` : ''}`
        )
      );
    }),
    // Weight/notes
    weightNote && React.createElement('span', {
      style: { display: 'block', fontSize: '0.75rem', color: 'var(--text2)', marginTop: '2px', textAlign: 'right' },
    }, weightNote)
  );
}
```

## Important rules
- Do NOT modify APRE exercise rendering (sets 1-4, AMRAP inputs, onApreResult callback) — leave untouched
- Do NOT convert `React.createElement` to JSX — follow existing file style
- The checkbox `onSetComplete` callback sends: `(exerciseName: string, setNumber: number, completedReps: number)`
- When checkbox is unchecked, fire `onSetComplete(ex.n, setNum, 0)` with reps=0 to indicate incomplete (or just don't call it — the store will handle it on save by only counting checked sets)

## Verification
```powershell
cd C:\Projects\fitness-tracker; npm run type-check
```
Must pass with 0 errors.
