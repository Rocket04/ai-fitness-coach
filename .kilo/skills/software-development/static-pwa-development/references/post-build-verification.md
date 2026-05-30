# Post-Build CDP Verification Checklist

## Context
After a successful `npx vite build`, verify the app works in the CDP browser before declaring the task complete.

## Quick Verification Steps

### 1. Determine Correct Dev Server Port
```bash
# Vite dev server runs on 5173 by default
# Check actual URLs via CDP:
mcp_chrome_devtools_list_network_requests
```
Look for requests to `http://localhost:5173/` (NOT 3000).

### 2. Hard Reload Required
After navigating to the correct URL:
1. Press `Control+Shift+R` (hard reload)
2. Wait for page to fully load
3. Verify UI elements are present via snapshot

### 3. Verify Key Features
For MethodologyPage:
- [ ] Click "Профиль" (Profile) button
- [ ] Click "📚 Методология" section to expand
- [ ] Click "Открыть методологию" button
- [ ] Verify APRE simulator sliders present (@e16, @e17)
- [ ] Verify Recovery Score simulator sliders present (@e19-@e24)

For TodayPage:
- [ ] Weekly strip shows 7 days with workout types (A/B/Отдых)
- [ ] "Онлайн" status indicator visible

### 4. Lighthouse Audit (Optional)
```
mcp_chrome_devtools_lighthouse_audit with mode: 'navigation', device: 'mobile'
Expected: Accessibility 100, Best Practices 100, SEO 100
```

## Common Pitfalls

| Symptom | Cause | Fix |
|---------|-------|-----|
| Empty page after build | Wrong port (used 3000) | Use 5173 for Vite |
| Old UI after code changes | HMR WebSocket didn't connect | Hard reload (Ctrl+Shift+R) |
| Vite dev server on 3000 | Confusion with other tools | Vite uses 5173 by default |

## Quality Gate Summary
- TypeScript: `npx tsc --noEmit` → 0 errors
- Tests: `npm test -- --run` → 188 passing (note: 142 component test failures are pre-existing act() issue)
- Build: `npx vite build` → clean (~1s)
- Browser: Hard reload → UI renders correctly