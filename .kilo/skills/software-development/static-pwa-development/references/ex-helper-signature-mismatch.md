# Helper Function Signature Mismatch in Plan Templates

## Pattern
Plan template files (`js/plans/running.ts`, `js/plans/strength.ts`) use a helper function `ex()` to create `Exercise` objects concisely. When call sites pass more arguments than the definition accepts, TS reports TS2554.

## Diagnosis
```
error TS2554: Expected 3-5 arguments, but got 6.
```
This means the `ex()` definition has fewer params than the call sites pass.

## Fix Steps
1. Find the `ex()` definition: `grep -n "const ex = " js/plans/running.ts`
2. Find all call sites: `grep -n "ex(" js/plans/running.ts | head -20`
3. Count the max args in any call site
4. Update the definition to accept all used args

## Example Fix (running.ts)
```ts
// BEFORE: 5 params
const ex = (n: string, s: string, r: string, w?: string, c?: string): Exercise => ({
  n, s, r, ...(w && { w }), ...(c && { c }),
});

// AFTER: 6 params with proper Exercise type mapping
const ex = (n: string, s: string, r: string, w?: string, protocol?: ApreProtocolKey, currentRM?: number): Exercise => ({
  n, s, r, ...(w && { w }), ...(protocol && { isApre: true, protocol }), ...(currentRM ? { currentRM } : {}),
});
```

## Type Compatibility
- The `protocol` param must be typed as `ApreProtocolKey` (imported from `../core/types.js`), not plain `string`
- The return type must match the `Exercise` interface exactly — check for `isApre: boolean`, `protocol: ApreProtocolKey`, `currentRM: number`
- If TS reports "Type 'string' is not assignable to type 'ApreProtocolKey'", the param type is too wide

## strength.ts Already Had 6 Params
The strength.ts `ex()` already accepted 6 params with `apre?: 'APRE_3' | 'APRE_6' | 'APRE_10'` which is compatible with `ApreProtocolKey`. No signature change needed there — only the type annotation needed widening if TS complained.
