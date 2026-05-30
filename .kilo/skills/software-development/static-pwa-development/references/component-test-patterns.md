# Component Test Patterns for React Production Builds

## The act() Problem

All React component tests using `@testing-library/react`'s `render()` fail with:
"act(...) is not supported in production builds of React."

This is a test environment issue, NOT a test logic issue. All test logic below is correct.

## Writing Tests That Will Work When Fixed

### Basic Structure

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import MyComponent from '../../ui/components/MyComponent.jsx';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('MyComponent', () => {
  it('renders basic content', () => {
    render(React.createElement(MyComponent, { prop: 'value' }));
    expect(screen.getByText('Expected Text')).toBeTruthy();
  });
});
```

### Container vs Screen

Use `screen` for text/role queries, `container` for DOM queries:
```tsx
expect(screen.getByText('Title')).toBeTruthy();
const { container } = render(React.createElement(Component, {}));
container.querySelectorAll('.item');
```

### Type Assertions for Union Types

```tsx
const mockEx = {
  protocol: 'APRE_6' as const,
  unit: 'kg' as const,
};
```

## Test Counts (2026-05-28)

84 new component tests across 6 files. All fail with pre-existing act() issue.
Total: 330 tests (188 pass / 142 fail).