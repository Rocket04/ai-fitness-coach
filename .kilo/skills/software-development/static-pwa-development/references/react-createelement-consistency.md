# React.createElement Consistency — Pitfalls & Patterns

## `.map()` Inside `React.createElement` — DO NOT DO THIS

**Symptom:** Component renders blank/no children. No console error. Clicks don't update UI.

**Cause:** `.map()`, ternary expressions (`? :`), and arrow function callbacks inside
`React.createElement()` arguments are JSX syntax sugar — they compile to `React.createElement`
calls ONLY when processed by a Babel/Vite JSX transform. When you write raw
`React.createElement()` calls, these expressions execute as plain JavaScript which may
return unexpected results or fail silently.

**Real-world example from OnboardingWizard.jsx:**
```javascript
// WRONG — .map() inside createElement call
React.createElement('div', { className: 'flex gap-sm flex-wrap' },
  { key: 'light', label: 'Лёгкий', desc: '...' },
  { key: 'medium', label: 'Средний', desc: '...' },
  { key: 'full', label: 'Полный', desc: '...' },
).map(({ key, label, desc }) =>
  React.createElement('button', { key, onClick: () => setCheckinTier(key) }, label)
)
// Result: The array literal before .map() is ignored by createElement (extra args).
// .map() is called on... nothing useful. Buttons never render.
```

**Fix options:**

1. **Write out elements explicitly** (best for small fixed counts):
```javascript
React.createElement('div', { className: 'flex gap-sm flex-wrap' },
  React.createElement('button', { onClick: () => setCheckinTier('light') }, 'Лёгкий'),
  React.createElement('button', { onClick: () => setCheckinTier('medium') }, 'Средний'),
  React.createElement('button', { onClick: () => setCheckinTier('full') }, 'Полный')
)
```

2. **Create array first, then spread:**
```javascript
const tiers = [
  { key: 'light', label: 'Лёгкий' },
  { key: 'medium', label: 'Средний' },
  { key: 'full', label: 'Полный' },
];
const buttons = tiers.map(t =>
  React.createElement('button', { key: t.key, onClick: () => setCheckinTier(t.key) }, t.label)
);
React.createElement('div', { className: 'flex gap-sm flex-wrap' }, ...buttons)
```

## Component Test Mocking — Avoid `vi.resetModules()` with Store Mocks

**Symptom:** `TypeError: Cannot read properties of null (reading 'useState')` after
calling `vi.resetModules()` in a `beforeEach` block.

**Cause:** `vi.resetModules()` clears ALL module registrations including React itself.
When React is re-imported, its internal hook state is reset. Components that call
`useState` during module initialization fail.

**Fix:** Use a module-level variable with a getter for dynamic mock values:

```javascript
// At module top level
let currentTier = 'full';
export function __setTier(t) { currentTier = t; }

// Mock uses getter — no re-import needed
vi.mock('../../stores/useAppStore.js', () => ({
  useAppStore: () => ({
    // ... other fields ...
    get checkinTier() { return currentTier; },
  }),
}));

// In tests — just change the variable and re-render
beforeEach(() => {
  __setTier('full');
  // DON'T call vi.resetModules()
});

it('works for medium tier', () => {
  __setTier('medium');
  render(React.createElement(Component));
  // assertions...
});
```