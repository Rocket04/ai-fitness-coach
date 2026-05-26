# Testing Anti-Patterns

## What They Are
Anti-patterns are common testing approaches that seem helpful but actually hurt code quality, maintainability, or test effectiveness.

## Common Anti-Patterns

### 1. Testing Mock Behavior Instead of Real Behavior
**Problem:** Tests verify mock interactions rather than actual system behavior.
```typescript
// BAD
it('calls the service', async () => {
  const mockService = { save: vi.fn() };
  await handler(mockService);
  expect(mockService.save).toHaveBeenCalled();
});

// GOOD
it('persists the data', async () => {
  const result = await handler(realService);
  expect(result.id).toBeDefined(); // Actual behavior
});
```

### 2. Testing Implementation Details
**Problem:** Tests break when you refactor but behavior stays the same.
```typescript
// BAD - tests internal method calls
expect(obj.internalHelper).toHaveBeenCalled();
expect(obj.state.privateVar).toEqual({ ... });

// GOOD - tests public behavior
expect(screen.getByText('Saved!')).toBeInTheDocument();
```

### 3. Happy Path Only
**Problem:** Edge cases and error handling aren't tested.
- Always test: empty inputs, null values, invalid states
- Always test: error paths and boundary conditions
- Write tests for the "sad paths" first

### 4. Brittle Tests
**Problem:** Tests break on refactoring even when behavior is correct.
```typescript
// BAD - brittle selector
expect(container.querySelector('.user-profile > div:nth-child(2) > span')).toHaveTextContent('John');

// GOOD - resilient selector
expect(screen.getByRole('heading', { name: /john/i })).toBeInTheDocument();
```

### 5. Testing Too Much in One Test
**Problem:** Tests do multiple things, failure points become unclear.
```typescript
// BAD - "and" in the name
it('saves user and sends email and updates cache', () => { ... });

// GOOD - one thing per test
it('saves user to database');
it('sends notification email');
it('updates cache');
```

### 6. Async Testing Without Proper Waiting
**Problem:** Tests pass/fail unpredictably due to timing.
```typescript
// BAD - no waiting
fireEvent.click(button);
expect(result).toBe('done'); // Might not be updated yet

// GOOD - wait for state
fireEvent.click(button);
await waitFor(() => expect(result).toBe('done'));
```

## How to Avoid Them

1. **Test the "what", not the "how"** - Focus on outcomes, not implementation
2. **Use real dependencies when possible** - Only mock external services, not your own code
3. **Keep tests focused** - One behavior per test
4. **Use accessible queries** - `getByRole`, `getByLabelText` over `querySelector`
5. **Wait properly for async** - Use `waitFor`, `findBy`, or proper async/await

## Red Flag Signals

If your test:
- Has `any` type or `@ts-ignore`
- Uses implementation-specific selectors like `.nth-child`
- Has more setup than actual test logic
- Tests multiple behaviors
- Passes without the code existing (testing mocks, not reality)

**STOP** - You're testing the wrong thing.