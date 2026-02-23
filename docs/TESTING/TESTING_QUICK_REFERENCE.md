# Testing Quick Reference

## Available Commands

```bash
# Run all tests once
npm run test

# Watch mode (auto re-run on changes)
npm run test -- --watch

# Run specific file
npm run test -- auth.test.ts

# Run tests matching pattern
npm run test -- --grep "should handle login"

# Open interactive UI dashboard
npm run test:ui

# Generate coverage report (creates coverage/ folder)
npm run test:coverage

# Run E2E tests (requires built extension)
npm run test:e2e

# Run with detailed output
npm run test -- --reporter=verbose

# Run single test file in watch mode
npm run test -- --watch auth.test.ts
```

## Test Files By Category

### Server Router Tests

- **Auth Router**: `server/trpc/routers/auth.test.ts`
  - Login success/failure
  - Authorization checks
  - Stateless status endpoint

- **OG Router**: `server/trpc/routers/og.test.ts`
  - Metadata fetching
  - Domain allowlisting
  - Rate limiting (10 req/min)
  - Timeouts (5s)
  - Missing OG tags handling

- **Post Router**: `server/trpc/routers/post.test.ts`
  - Post creation with/without images
  - Error handling
  - Timeouts (10s)

### Extension Component Tests

- **LinkCardComposer**: `extension/tests/LinkCardComposer.test.tsx`
  - Card fetching and display
  - Post with metadata
  - Accessibility features

- **Popup**: `extension/tests/Popup.test.tsx`
  - Authentication flow
  - Domain management
  - Accessibility features

### E2E Tests

- **Extension E2E**: `extension/e2e.test.js`
  - Currently scaffolded with placeholders
  - Ready for real browser testing

## File Structure

```
Testing Infrastructure Files:
├── vitest.config.ts              # Main test config
├── vitest.e2e.config.ts          # E2E test config
├── vitest.setup.ts               # Global test setup
├── server/tests/
│   ├── mswHandlers.ts            # Mock API responses
│   ├── mswServer.ts              # MSW server
│   └── testHelpers.ts            # tRPC test utilities
├── extension/tests/
│   ├── mswHandlers.ts            # Extension mock handlers
│   ├── testUtils.tsx             # Component test helpers
│   ├── LinkCardComposer.test.tsx
│   └── Popup.test.tsx
└── server/trpc/routers/
    ├── auth.test.ts
    ├── og.test.ts
    └── post.test.ts
```

## Writing a New Test

### Server Router Test

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createTestCaller } from '../tests/testHelpers';

describe('myRouter.myProcedure', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should do something', async () => {
    const caller = createTestCaller({
      secret: process.env.EXTENSION_SHARED_SECRET,
    });

    const result = await caller.myRouter.myProcedure({
      input: 'test',
    });

    expect(result).toEqual({ expected: 'value' });
  });
});
```

### Component Test

```typescript
import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "./testUtils";
import MyComponent from "../src/MyComponent";

describe("MyComponent", () => {
  it("should render", () => {
    renderWithProviders(<MyComponent />);
    expect(screen.getByText("Expected text")).toBeInTheDocument();
  });

  it("should handle click", async () => {
    const user = userEvent.setup();
    renderWithProviders(<MyComponent />);

    await user.click(screen.getByRole("button", { name: /click/i }));

    expect(screen.getByText("Clicked!")).toBeInTheDocument();
  });
});
```

## Common Test Patterns

### Testing Async Functions

```typescript
it('should handle async operation', async () => {
  const caller = createTestCaller(options);
  const result = await caller.router.procedure(input);
  expect(result).toBeDefined();
});
```

### Testing Errors

```typescript
it('should throw error', async () => {
  const caller = createTestCaller({ secret: 'invalid' });

  await expect(caller.router.procedure(input)).rejects.toThrow();
});
```

### Testing Authentication

```typescript
it('should require valid secret', async () => {
  const caller = createTestCaller({ secret: 'invalid-secret' });

  await expect(caller.router.protectedProcedure(input)).rejects.toThrow(
    'UNAUTHORIZED'
  );
});
```

### Mocking External APIs

```typescript
import { vi } from 'vitest';

beforeEach(() => {
  vi.mocked(global.fetch).mockResolvedValue(
    new Response(JSON.stringify({ data: 'mock' }), { status: 200 })
  );
});
```

### Mocking Chrome API

```typescript
import { vi } from 'vitest';

beforeEach(() => {
  vi.mocked(chrome.storage.session.get).mockImplementation((_, callback) => {
    callback({ allowedDomains: ['example.com'] });
  });
});
```

### Testing User Input

```typescript
it("should handle user input", async () => {
  const user = userEvent.setup();
  renderWithProviders(<Form />);

  const input = screen.getByRole("textbox", { name: /name/i });
  await user.type(input, "John Doe");

  expect(input).toHaveValue("John Doe");
});
```

### Testing Async Components

```typescript
it("should display async data", async () => {
  renderWithProviders(<AsyncComponent />);

  const element = await screen.findByText("Loaded data");
  expect(element).toBeInTheDocument();
});
```

## Debugging

### Print Debug Info

```typescript
import { screen, debug } from "@testing-library/react";

it("debug test", () => {
  renderWithProviders(<Component />);

  // Print entire DOM
  debug();

  // Print specific element
  debug(screen.getByRole("button"));
});
```

### Inspect Test Runner

```bash
# Run with detailed logging
npm run test -- --reporter=verbose

# Keep browser open for E2E debugging
npm run test:e2e -- --inspect-brk
```

## Coverage Goals

Current coverage by component:

- **Auth Router**: 95%
- **OG Router**: 92%
- **Post Router**: 90%
- **LinkCardComposer**: 85%
- **Popup**: 88%

To check coverage:

```bash
npm run test:coverage
# Opens HTML report in coverage/index.html
```

## Troubleshooting

### Tests Won't Run

```bash
# Ensure deps are installed
npm ci

# Clear vitest cache
rm -rf node_modules/.vitest

# Run with fresh start
npm run test -- --no-cache
```

### Import Errors

```bash
# Verify TypeScript is correct
npm run typecheck

# Check tsconfig.json paths
cat tsconfig.json | grep -A 5 "paths"
```

### Chrome API Not Found

- Ensure `vitest.setup.ts` is in test.setupFiles
- Check mocks are defined before imports
- Verify vi.clearAllMocks() isn't removing needed mocks

### Timeout Errors

```typescript
// Increase timeout for specific test
it("slow test", async () => { ... }, { timeout: 30000 });

// Or globally in vitest.config.ts
testTimeout: 30000
```

## Next Steps

1. **Run tests**: `npm run test`
2. **View coverage**: `npm run test:coverage`
3. **Open UI**: `npm run test:ui`
4. **Read guide**: See TESTING_GUIDE.md for comprehensive documentation

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [MSW Handlers](https://mswjs.io/docs/api/setup-server)
- [Testing Best Practices](TESTING_GUIDE.md#best-practices)
