# Vite HMR WebSocket Failure Through CDP

## Problem
When the browser is connected via Chrome DevTools Protocol (CDP), Vite's HMR WebSocket fails. The browser runs stale JS even though files on disk are updated.

## Symptoms
- Code on disk is correct (grep confirms, tests pass, TS compiles)
- Browser shows old behavior (missing new UI elements)
- Console: `[vite] failed to connect to websocket`

## Root Cause
Vite HMR uses WebSocket. CDP-controlled browsers often can't establish WS connections to the dev server.

## Workaround
Instruct user to **Ctrl+Shift+R** (hard reload) in the browser. This fetches fresh JS.

## Debugging Checklist
1. `npx tsc --noEmit` → clean
2. `npm test` → green
3. `grep -n "feature" file.js` → present
4. Check console for WS failure
5. If all pass → hard reload, then re-verify via CDP

## Production Build Also Affected by Stale SW

Even when serving the production build (`npx serve -s dist/`), the browser may show stale content if a service worker from the dev server was previously registered on the same origin+port. The SW intercepts all fetches and serves cached dev assets.

**Fix**: Before testing production builds, unregister all SWs:
```js
// In browser console or via CDP evaluate:
navigator.serviceWorker.getRegistrations().then(regs => Promise.all(regs.map(r => r.unregister())))
```
Then hard reload (Ctrl+Shift+R).

**Reliable production test workflow**:
1. Kill any existing server on the port: `powershell -Command "Stop-Process -Id <PID> -Force"`
2. Clear Vite cache: `rm -rf dist node_modules/.vite && npx vite build`
3. Serve production: `cd dist && npx serve -l 5173 -s`
4. In CDP browser: navigate to URL, unregister SW, hard reload
5. Verify app renders (check `document.getElementById('root').innerHTML`)
6. Run Lighthouse: `mcp_chrome_devtools_lighthouse_audit` with `mode: 'navigation'`

## Post-Build Verification Workflow

After a successful build, verify the app works before declaring done:

```bash
# 1. Build
npx vite build  # Should complete in ~1s

# 2. Start dev server (Vite uses port 5173 by default)
npx vite  # Development server on http://localhost:5173

# 3. CDP browser verification
# - Navigate to http://localhost:5173 (NOT port 3000)
# - Hard reload: Ctrl+Shift+R
# - Take snapshot, verify UI elements present
```

**Port check**: Vite dev server runs on **5173** by default, not 3000. Verify with:
```
mcp_chrome_devtools_list_network_requests  # Shows actual server URLs
```

## Key Rule
Code on disk is source of truth. Browser cache is the liar. Do NOT assume code is broken.
When switching between dev and production on the same port, always unregister SW first.