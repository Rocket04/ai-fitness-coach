# Interactive Simulator Pattern

Range sliders + real engine functions + color-coded results + contextual tips.

## APRE Simulator
- Sliders for RPE (1-10, step 0.5) and duration (10-120 min, step 5)
- Live calculation using `applyApre()` and `calcNextWeekRM()` from engine
- Color-coded results (green/yellow/red based on values)
- Shows user's actual last RPE data as live example
- Formula display: `Session Load = RPE × duration`

## Recovery Score Simulator
- Sliders for HRV, sleep, restHR, energy, mood, soreness
- Live score using `calculateRecoveryScore()` with real checkins baseline
- Large color-coded score display (Зелёный/Жёлтый/Красный)
- Shows current user score for comparison
- Contextual tips based on score level (e.g., "Попробуй увеличить сон до 8+ часов")

## Reusable Sub-components
- `SimSlider`: labeled range input with color-coded value display, `aria-label`
- `SimResult`: compact metric card (label, value, unit, subtitle)
- Both accept `onChange` callbacks for real-time updates

## Integration Pattern
- Use React state for slider values (`useState`)
- Compute derived values in render (no need for `useMemo` unless expensive)
- Import actual engine functions (don't duplicate logic)
- Use `useCallback` for toggle handlers
- Color-code based on thresholds (green/yellow/red)
- Show contextual tips with conditional rendering
