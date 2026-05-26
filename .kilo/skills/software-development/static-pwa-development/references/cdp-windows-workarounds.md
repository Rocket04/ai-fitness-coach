# Stale Vite Dev Server + SW Intercepts on Windows

## Problem: Vite Dev Server Survives `kill -9` on Windows/Git Bash

**Symptom**: After `kill -9 <PID>`, the Vite dev server (port 5173) is still serving.

**Root cause**: MSYS/Git Bash `kill` doesn't properly terminate Node.js on Windows.

**Fix**:
```bash
# Find PID
netstat -ano | findstr "5173" | findstr "LISTENING"

# Kill via PowerShell
powershell -Command "Stop-Process -Id <PID> -Force"

# Verify port is free
netstat -ano | findstr "5173" | findstr "LISTENING"
```

## Problem: Stale SW Intercepts Production Builds

**Symptom**: Production build serves old Vite dev content via cached service worker.

**Fix**: In browser console before testing:
```javascript
navigator.serviceWorker.getRegistrations()
  .then(regs => Promise.all(regs.map(r => r.unregister())))
```
Then hard reload (Ctrl+Shift+R).

**Prevention**: Test production on a different port (e.g., 5174).

## Lighthouse Audit via CDP

Reliable audit requires production build (Vite HMR WS fails through CDP):

1. `rm -rf dist node_modules/.vite && npx vite build`
2. Kill existing server on port
3. `cd dist && npx serve -l 5173 -s`
4. Browser: unregister SW → hard reload → navigate
5. Run `mcp_chrome_devtools_lighthouse_audit` (mode: navigation, device: mobile)

Acceptable failures: `llms.txt` (non-UI). Target: 100/100/100.
