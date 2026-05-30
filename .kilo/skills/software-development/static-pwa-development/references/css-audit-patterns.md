# CSS Audit Patterns for Static PWAs

## Finding Duplicate Selectors

### Command-line approach
```bash
# Find all class selectors with their line numbers
grep -nE '\.([a-z-]+)\s*\{' css/styles.css

# Find duplicates (same selector appearing multiple times)
grep -oE '\.([a-z-]+)\s*\{' css/styles.css | sort | uniq -c | sort -rn

# Check specific duplicate
grep -n '.exercise-name {' css/styles.css
```

## Python Analysis Script

```python
import re, os

# Extract all CSS class definitions
with open('css/styles.css', 'r') as f:
    css = f.read()
css_classes = set(re.findall(r'\.([a-zA-Z][a-zA-Z0-9_-]*)', css))

# Extract all JS/JSX files
for root, dirs, files in os.walk('js'):
    for f in files:
        if f.endswith(('.js', '.jsx', '.ts', '.tsx')):
            path = os.path.join(root, f)
            with open(path, 'r', encoding='utf-8', errors='ignore') as file:
                content = file.read()
                # Find className="..." patterns
                simple = re.findall(r'''className=["']([^"']*)["']''', content)
                for s in simple:
                    for c in s.split():
                        used_in_code.add(c)

# Compare
unused = css_classes - used_in_code
```

## Common Duplicate Patterns

### Group Selector Conflicts
```css
/* BEFORE: .modal-close in group */
button,
.btn,
.tab,
.pill,
.chip,
.modal-close {
  -webkit-tap-highlight-color: transparent;
}

/* AFTER: Remove from group if standalone definition exists */
button,
.btn,
.tab,
.pill,
.chip {
  -webkit-tap-highlight-color: transparent;
}
```

### Orphaned Definition
```css
/* Delete if duplicate with better definition later */
.exercise-name {
  font-weight: 600;
  font-size: var(--font-size-h3);
}

/* Keep this one */
.exercise-name {
  font-weight: 500;
  font-size: 0.95rem;
  color: var(--text);
}
```

## Verification Checklist

- [ ] Run `npm test` - all tests must pass
- [ ] Verify CSS file size reduced
- [ ] Check no visual regression (compare before/after screenshots if possible)
- [ ] Document changes in `docs/css-cleanup-report.md`