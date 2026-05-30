# WCAG 2.5.3 Label in Name — aria-label Must Contain Visible Text

## Rule
The accessible name (from `aria-label` or `aria-labelledby`) must contain all visible text that labels the element.

## Common Failure
Block-level children (`<div>`) inside buttons create newlines in visible text that don't match space-separated aria-label.

## Why aria-labelledby Doesn't Fix This
`aria-labelledby` concatenates with spaces; block-level children render with newlines → axe-core mismatch.

## Fix Pattern
1. Use inline `<span>` (not `<div>`) for text inside buttons
2. Add `' '` text node between inline spans
3. Match aria-label exactly to concatenated visible text
4. Hide decorative icons with `aria-hidden="true"`

## Related
- axe-core rule: `label-content-name-mismatch`
- WCAG 2.1 Level A