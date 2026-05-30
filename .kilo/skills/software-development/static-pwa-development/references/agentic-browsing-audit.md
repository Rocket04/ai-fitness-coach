# Agentic Browsing Audit Pattern

## Context
Lighthouse "Agentic Browsing" category (67 → 100 points) validates the site works well for AI agents and large language models.

## Common Failures and Fixes

### 1. llms.txt Required
**Error**: "File is missing a required H1 header" or "File does not appear to contain any links"

**Fix**:
- Create `/public/llms.txt` (must be in Vite's `public/` folder)
- First line must be H1: `# Title`
- Include markdown links: `[Page Name](/page)` or `[External](https://...)`
- Must be served at root: `http://localhost:5173/llms.txt`

### 2. CSP via Meta Tag
**Error**: "The Content Security Policy directive 'frame-ancestors' is ignored when delivered via a <meta> element"

**Fix**:
- Remove `frame-ancestors` from meta CSP (only works via HTTP header)
- Valid meta CSP should NOT include: `frame-ancestors 'none'`
- Place in `<head>`: `<meta http-equiv="Content-Security-Policy" content="default-src 'self'; ...">`

### 3. Security Headers (informative only)
**HSTS**: "No HSTS header found"
- Not an error for localhost development
- Configure in production server (nginx/Apache)

**CSP XSS**: "`'unsafe-inline'` allows the execution of unsafe in-page scripts"
- For React/Vite with inline scripts, `unsafe-inline` is necessary
- Consider nonces/hashes for production hardening

## Audit Checklist
1. ✅ Accessibility: 100
2. ✅ Best Practices: 100 (check console errors)
3. ✅ SEO: 100
4. ✅ Agentic Browsing: 100 (llms.txt + CSP)

## Verification
After fixes:
```
mcp_chrome_devtools_lighthouse_audit
# Check "Agentic Browsing" score
```

## File Placement for Vite
```
project/
├── public/
│   └── llms.txt    # Served at /llms.txt
├── index.html      # CSP meta tag goes here
└── dist/           # llms.txt auto-copied on build
```