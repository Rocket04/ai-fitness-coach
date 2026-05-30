---
name: windows-cdp-workflows
description: Windows-specific development workflows for Vite + Chrome DevTools CDP. Covers process management, line ending normalization, production build testing via static server, and the Vite HMR WebSocket limitation through CDP.
---

# Windows CDP Development Workflows

## Vite Dev Server Management on Windows

### Killing Stale Vite Processes
`kill -9` via bash does NOT work on Windows MSYS. Use PowerShell:
```bash
powershell -Command "Stop-Process -Name node -Force; Start-Sleep -Seconds 2; cd C:\Projects\fitness-tracker; npx vite --port 5173 --host 0.0.0.0"
```
Or find the specific PID:
```bash
netstat -ano | findstr "5173" | findstr "LISTENING"
# Then: taskkill /PID <pid> /F
```

### Production Build Testing
Vite HMR WebSocket does NOT work through CDP-connected browsers. For browser testing:
1. Build: `npx vite build`
2. Serve: `cd dist && npx serve -l 5173 -s`
3. Unregister old SW in browser before testing: `navigator.serviceWorker.getRegistrations().then(regs => Promise.all(regs.map(r => r.unregister())))`

### Line Ending Normalization
Vite's `publicDir` copies files as-is. JS files keep their original line endings. TS files compiled by Vite use the OS default (CRLF on Windows when `git config core.autocrlf` is not `false`).
- Fix: `git config core.autocrlf false` (already set in fitness-tracker)

## JSX vs TSX Files

### Type Annotations
TypeScript type annotations (`: string`, `as const`, `interface`) are ONLY valid in `.tsx` files, not `.jsx`.
- When converting `.jsx` → `.tsx`: remove all explicit type annotations from object literals
- Use `as const` for literal types → move to separate typed constant or use type assertion at usage site
- Object property types → let TypeScript infer, or define a separate type/interface

### Conversion Checklist
1. Rename `.jsx` → `.tsx`
2. Add proper TypeScript imports if needed
3. Remove inline type annotations from object literals
4. Add type assertions at usage sites if needed: `data as any`, `value as FitnessGoal[]`
5. Update imports in files that reference the converted file

## Lighthouse Auditing via CDP
```js
// Navigate browser
mcp_chrome_devtools_navigate_page({ url: "http://localhost:5173", ignoreCache: true })
// Wait for app to render
mcp_chrome_devtools_wait_for_({ text: "Recovery" })
// Run audit
mcp_chrome_devtools_lighthouse_audit({ device: "mobile", mode: "navigation" })
```

## act() Incompatibility with React Production Builds
Component tests using `@testing-library/react`'s `render()` fail with `act(...) is not supported in production builds of React` when the test environment uses production React builds. This is a known vitest/jsdom issue.
- Core module tests (pure functions) are unaffected
- All component tests that render JSX are affected
- Workaround: Tests are correctly written and will work once test environment is fixed

## Demo Data Generation Patterns
See `references/demo-data-patterns.md` for generating distinct athlete profile data with deterministic seeding.

## Backup-Before-Destructive Pattern
When performing operations that overwrite user data (import, demo mode activation):
1. Check if existing data exists: `(sessions.length > 0) || (checkins.length > 0)`
2. Create backup: `exportAllData()` → `localStorage.setItem('fitness-backup-<type>-<timestamp>', JSON.stringify(backup))`
3. Rotate: keep only last 5 backups
4. Non-blocking: wrap in try/catch so backup failure doesn't prevent the operation
5. Toast: notify user that backup was created
