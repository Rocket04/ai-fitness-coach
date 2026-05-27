# E2E Test Suite — Smart Fitness Coach

End-to-end tests powered by [Playwright](https://playwright.dev/). They run against a real dev server in real browsers (Chromium, Firefox, Mobile Safari viewport).

---

## Quick Start

1. **Install dependencies** (already done if `@playwright/test` is in `devDependencies`):
   ```powershell
   npm install -D @playwright/test
   npx playwright install chromium firefox
   ```

2. **Start the dev server**:
   ```powershell
   npm run dev
   ```

3. **Run tests** (in another terminal):
   ```powershell
   npm run test:e2e          # headless, all projects
   npm run test:e2e:ui       # interactive mode
   npm run test:e2e:headed   # see the browsers
   npm run test:e2e:debug    # step-through with inspector
   ```

---

## Architecture

```text
e2e/
  fixtures/      → shared test data & auth helpers
  pages/         → Page Object Models (POMs)
  tests/         → spec files
  utils/         → custom assertions & selector helpers
```

### Page Object Models (`e2e/pages/`)

Each major UI surface has a POM that encapsulates locators and user actions:

| Page | File | Responsibility |
|------|------|---------------|
| Today | `TodayPage.ts` | Recovery ring, status pill, workout/rest cards |
| Check-in | `CheckinPage.ts` | Form fill, tier selector, validation |
| Onboarding | `OnboardingPage.ts` | Wizard step progression, tier auto-detect |
| Profile | `ProfilePage.ts` | Settings, language switcher, exercise config |
| Analytics | `AnalyticsPage.ts` | Charts, toggles, empty states |

**Pattern:**
```ts
import { test, expect } from '@playwright/test';
import { TodayPage } from '../pages/TodayPage';

test('today page shows recovery score', async ({ page }) => {
  const today = new TodayPage(page);
  await today.goto();
  await expect(today.recoveryRing).toBeVisible();
});
```

### Fixtures (`e2e/fixtures/`)

| Fixture | Purpose |
|---------|---------|
| `auth.ts` | Enter guest mode, clear IndexedDB/localStorage |
| `seedData.ts` | Pre-seed check-ins, sessions, and workout logs |

---

## Projects

Defined in `playwright.config.ts`:

| Project | Viewport | Use case |
|---------|----------|----------|
| `chromium` | 1280x720 | Primary desktop smoke tests |
| `firefox` | 1280x720 | Cross-browser coverage |
| `mobile` | 375x812 (iPhone 13) | Responsive / touch flow validation |

Run a single project:
```powershell
npx playwright test --project=chromium
```

---

## Writing New Tests

1. **Create or extend a POM** in `e2e/pages/` if the page under test is new.
2. **Add a spec** in `e2e/tests/<feature>.spec.ts`.
3. **Use fixtures** for setup (clear storage, seed data) rather than inline boilerplate.
4. **Prefer user-facing selectors**: `data-testid` or label text over CSS classes.

Example skeleton:
```ts
import { test, expect } from '@playwright/test';
import { SomePage } from '../pages/SomePage';
import { seedCheckins } from '../fixtures/seedData';

test.describe('Feature', () => {
  test.beforeEach(async ({ page }) => {
    await seedCheckins(page, [{ date: '2026-05-26', sleepHours: 7 }]);
  });

  test('does the thing', async ({ page }) => {
    const p = new SomePage(page);
    await p.goto();
    await p.doThing();
    await expect(p.result).toHaveText('success');
  });
});
```

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `Error: page.goto: net::ERR_CONNECTION_REFUSED` | Make sure `npm run dev` is running on `http://localhost:3000`. |
| Tests fail only in `firefox` | Check for Chromium-only APIs (e.g., `navigator.permissions`). |
| Mobile tests mis-click | Ensure tap targets are ≥ 44×44 px; check `await page.tap()` vs `click()`. |
| Flaky assertions | Increase `expect` timeout or use `await expect(...).toBeVisible({ timeout: 10000 })`. |
| Outdated browser binaries | Run `npx playwright install` again after updating `@playwright/test`. |

---

## CI Notes

- Retries are enabled automatically when `CI=true` (`retries: 1`).
- Screenshots and traces are captured on first retry.
- HTML report is written to `playwright-report/`.
- Artifacts (`test-results/`, `playwright-report/`) are gitignored.
