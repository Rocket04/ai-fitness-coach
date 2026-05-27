# E2E Testing Guide

## Running Tests Locally

```bash
npm run test:e2e
```

## Debugging with Playwright Inspector

```bash
npm run test:e2e:debug
```

## Adding New Tests

### Page Object Pattern

Use the page object pattern to keep selectors centralized:

```typescript
// e2e/pages/TodayPage.ts
import { Page } from '@playwright/test';

export class TodayPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/');
  }

  getRecoveryRing() {
    return this.page.getByTestId('recovery-ring');
  }
}
```

### Naming Convention

- Test files: `*.spec.ts`
- Page objects: `e2e/pages/*.ts`
- Utilities: `e2e/utils/*.ts`

## Troubleshooting

### Flaky Tests

- Increase timeouts for IndexedDB operations.
- Use `await expect(...).toBeVisible()` instead of fixed delays.

### Port Conflicts

Ensure no other dev server is running on port 3000:

```bash
npx kill-port 3000
```

### IndexedDB Cleanup

Playwright's `storageState` does not clear IndexedDB automatically. Add this to your setup:

```typescript
await page.evaluate(() => {
  indexedDB.databases().then(dbs => {
    dbs.forEach(db => indexedDB.deleteDatabase(db.name));
  });
});
```
