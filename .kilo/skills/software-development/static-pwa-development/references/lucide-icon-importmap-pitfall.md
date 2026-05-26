# Vite Importmap Lucide Icon Pitfall

## Problem
When using Vite with importmap (CDN-delivered modules, no build step), importing additional Lucide React icons beyond the initially-used set can result in icons rendering as zero-width/invisible SVG elements.

## Symptoms
- Icons render as `<svg>` with `aria-hidden="true"` but zero visible size
- The accessibility tree shows only the text sibling, not the SVG
- Occurs even when TypeScript compiles cleanly

## Root Cause
Vite's dev server with importmap serves modules from CDN. Additional Lucide icons may not be tree-shaken or bundled correctly, resulting in empty SVG renders.

## Fix: Use Emoji Icons Instead

Replace Lucide SVG icons with emoji characters in importmap projects:

```jsx
// ❌ DO NOT: Import additional Lucide icons in importmap projects
import { HeartPulse, BookOpen, Activity } from 'lucide-react';

// ✅ DO: Use emoji prefixes consistent with existing style
'🩹 Rehab'
'📚 Methodology'
'🎯 Check-in Level'
```

## When This Applies
- Vite projects using importmap to load React from CDN
- No build step (native ES modules)
- Projects that already use emoji-style icons

## Verification
1. `querySelectorAll('svg')` should not show empty SVGs for icon-only elements
2. Section headers in accessibility tree should include the emoji text
3. Visual inspection shows icons rendered inline with text

---

## Related: React.useEffect() Crash in JSX Files

### Problem
In `.jsx` files, calling `React.useEffect()` instead of the destructured `useEffect()` causes a runtime crash:
```
TypeError: Cannot read properties of null (reading 'useCallback')
```

### Root Cause
When React is imported as a namespace, calling `React.useEffect()` can fail if the React context is null in certain Vite/importmap configurations. Always destructure hooks at import time.

### Fix
```jsx
// ❌ DO NOT: Call hooks via React namespace in .jsx files
React.useEffect(() => { ... }, []);

// ✅ DO: Destructure at import, call directly
import React, { useEffect, useState } from 'react';
useEffect(() => { ... }, []);
```

### Diagnosis
- Error: "Cannot read properties of null (reading 'useCallback')" or "reading 'useEffect'"
- Occurs immediately on page load
- `npx tsc --noEmit` passes (type-checking doesn't catch this)
- App shows ErrorBoundary fallback screen

### Verification
1. Page loads without console errors
2. No "Invalid hook call" warnings in console
3. Component renders normally
