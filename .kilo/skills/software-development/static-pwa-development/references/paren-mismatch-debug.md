# Debugging Unclosed Parenthesis in Large React.createElement Files

## Symptom
TSC reports TS1128 ("Declaration or statement expected") or TS1005 ("')' expected") at the end of a large `.jsx` that visually looks correctly structured. The `);` and `}` at EOF appear correct.

## Root Cause
In files using `React.createElement` calls (no JSX), ternary expressions or deeply nested calls can have a missing `)`. A single unmatched `(` among hundreds causes the parser to never recover. The error location reported by TSC is misleading -- it points to the EOF, not the actual unclosed paren.

## Diagnostic Technique

### Step 1: Raw paren count
```
with open(path, 'rb') as f:
    data = f.read()
opens = data.count(b'(')
closes = data.count(b')')
diff = opens - closes  # +1 = extra (, -1 = extra )
```
If diff != 0, you know there's a count mismatch. If diff == 0 but TSC still errors, the parens are mismatched (wrong nesting order).

### Step 2: String-aware depth tracking
A raw count includes parens inside string literals. Use a simple state machine that skips characters inside `'...'`, `"..."`, and backtick template literals:

```
depth = 0
in_string = None  # None, "'", '"', '`'
escape_next = False

for i, line in enumerate(lines):
    for j, ch in enumerate(line):
        if escape_next:
            escape_next = False
            continue
        if ch == '\\' and in_string:
            escape_next = True
            continue
        if in_string:
            if ch == in_string:
                in_string = None
            continue
        if ch in ("'", '"', '`'):
            in_string = ch
            continue
        if ch == '(':
            depth += 1
        elif ch == ')':
            depth -= 1
        if depth < 0:
            print("Extra ) at line", i+1)
            break
    if depth < 0:
        break

# depth > 0 means unclosed ( somewhere
# depth == 0 means balanced
```

### Step 3: Locate the missing close
Print depth changes line by line, focusing on the area with complex nesting:

```
for i, line in enumerate(lines):
    line_depth_start = depth
    # ... (process chars, update depth)
    diff = depth - line_depth_start
    if abs(diff) > 0:
        print("L{} depth {} -> {}: {}".format(i+1, line_depth_start, depth, line.strip()[:80]))
```

Look for a `React.createElement(` or ternary branch that opens (depth increases) but whose closing `)` never appears. In one real case, `isRestDay ? A : B` had branch A correctly closed but branch B's `React.createElement('div',` was never closed before the next sibling element started.

### Step 4: Verify
After adding the missing `)`:
```
npx tsc --noEmit 2>&1 | grep <filename>
```
No output = no errors for that file.

## Common Patterns Where This Occurs
- Ternary `condition ? createElement(...) : createElement(...)` inside a larger tree -- one branch gets a `)` during an edit but the other doesn't.
- Adding children to an existing `React.createElement` call without moving the closing `)` to accommodate them.
- `showX && React.createElement(...)` conditionals added inside existing nesting without adjusting the parent's closing structure.
