# TrendChart Multi-Metric + Legend Pattern

## Architecture

### Props Interface
Accepts either single-metric (backward compatible) or multi-metric mode:
- Single: `{ data, yKey, color, label, unit }`
- Multi: `{ data, metrics: [{ yKey, color, label, unit }] }`

### Legend Toggle
- `role="switch"` + `aria-checked` on each legend item
- Hidden metrics: opacity 0.5, line-through text
- Cannot hide last visible metric
- State: `Set<string>` of hidden yKeys

### Responsive Sizing
- `ResizeObserver` on container div
- Chart width = max(containerWidth, 260)

### Animations
- `drawLine`: stroke-dasharray 1000→0 over 0.8s
- `fadeDot`: opacity 0→1 with staggered delays (0.4 + i*0.05s)
- `tooltipIn`: translate + opacity entrance

### Enhanced Tooltip
- Date header (formatted: "25 мая")
- Per-metric: label (colored) + value + delta from previous point
- Delta color: green/red/gray
- Vertical hover line at hit area

### Key Notes
- `.tsx` extension required (TypeScript interfaces)
- SVG `role="img"` with `aria-label`
- Hidden scrollbar CSS
- Stats summary only in single-mode
- Backward compatible with single-metric API
