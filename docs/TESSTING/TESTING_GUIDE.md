# Testing Infrastructure Guide

This document describes the testing setup for CardCast, including how to run tests, write new tests, and debug failures.

## Quick Start

### Running Tests

```bash
# Run all unit and integration tests
npm run test

# Watch mode (re-run on file changes)
npm run test -- --watch

# Run tests with UI dashboard
npm run test:ui

# Generate coverage report
npm run test:coverage

# Run E2E tests (requires built extension)
npm run test:e2e
```

## Architecture

### Test Stack

- **Framework**: [Vitest](https://vitest.dev/) - Fast unit test runner
- **React Testing**: [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) - Component testing
- **Mocking**: [MSW (Mock Service Worker)](https://mswjs.io/) - API mocking
- **E2E**: [Puppeteer](https://pptr.dev/) - Browser automation

### File Structure

```
project/
├── vitest.config.ts          # Main Vitest configuration
├── vitest.e2e.config.ts      # Separate E2E config
├── vitest.setup.ts           # Global setup (MSW, mocks)
├── server/
│   └── tests/
│       ├── mswHandlers.ts    # Mock API handlers
│       ├── mswServer.ts      # MSW server instance
│       └── testHelpers.ts    # tRPC test utilities
├── server/trpc/routers/
│   ├── auth.test.ts          # Auth router tests
│   ├── og.test.ts            # OG router tests
│   └── post.test.ts          # Post router tests
└── extension/
    ├── e2e.test.js           # E2E test suite
    └── tests/
        ├── mswHandlers.ts    # Extension mock handlers
        ├── testUtils.tsx     # React component test helpers
        ├── LinkCardComposer.test.tsx
        └── Popup.test.tsx
```

## Server Testing

### Overview

Server tests are unit and integration tests for tRPC routers. They use:

- **tRPC caller factory** - Direct procedure calls without HTTP
- **MSW** - Mocking external API calls (Bluesky, image fetch)
- **Custom context** - Simulating request context with headers/IP

### Writing Router Tests

#### 1. Setup: Mock Dependencies

```typescript
import { vi } from 'vitest';

// Mock external APIs
vi.mock('@atproto/api', () => ({
  Agent: vi.fn(),
}));

global.fetch = vi.fn();
```

#### 2. Test Structure

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createTestCaller } from '../tests/testHelpers';

describe('myRouter.myProcedure', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should do something', async () => {
    // Arrange
    const caller = createTestCaller({
      secret: process.env.EXTENSION_SHARED_SECRET,
    });

    // Act
    const result = await caller.myRouter.myProcedure({ input: 'test' });

    // Assert
    expect(result).toEqual({ expected: 'value' });
  });

  it('should handle errors', async () => {
    const caller = createTestCaller({ secret: 'invalid-secret' });

    await expect(
      caller.myRouter.myProcedure({ input: 'test' })
    ).rejects.toThrow();
  });
});
```

#### 3. Test Helpers

**`createTestCaller(options)`** - Creates a tRPC caller with test context

```typescript
const caller = createTestCaller({
  secret: process.env.EXTENSION_SHARED_SECRET, // Auth secret
  origin: 'http://localhost:3000', // Optional CORS origin
  ip: '192.168.1.1', // Optional IP for rate limiting
});

// Call procedures directly
const result = await caller.auth.login({
  identifier: 'user',
  appPassword: 'pwd',
});
```

**`createTestContext(options)`** - Create raw test context (advanced)

```typescript
const ctx = createTestContext({ secret: 'test-secret' });
// ctx.req has headers, ip, etc.
```

### Test Coverage

#### Auth Router

- ✅ Successful login with valid credentials
- ✅ UNAUTHORIZED error for invalid credentials
- ✅ INTERNAL_SERVER_ERROR when session not established
- ✅ Status endpoint returns stateless response
- ✅ Authorization check on all procedures

#### OG Router

- ✅ Successful metadata fetch for allowed domains
- ✅ BAD_REQUEST for blocked domains
- ✅ NOT_FOUND for 403 responses
- ✅ INTERNAL_SERVER_ERROR for 5xx responses
- ✅ NOT_FOUND for missing OG tags
- ✅ Timeout after 5 seconds
- ✅ Rate limiting (10 requests/min per IP)

#### Post Router

- ✅ Successful post creation with image upload
- ✅ Fallback to no-image post if upload fails
- ✅ INTERNAL_SERVER_ERROR if post creation fails
- ✅ Authorization check
- ✅ Input validation
- ✅ Timeout on slow operations (10s)

## Extension Testing

### Overview

Extension tests use React Testing Library to test UI components. They include:

- **Component rendering** - Verify UI appears correctly
- **User interactions** - Click buttons, type in inputs
- **Accessibility** - ARIA labels, roles, semantic HTML
- **Chrome API mocking** - chrome.storage, chrome.runtime

### Writing Component Tests

#### 1. Setup: Use `renderWithProviders`

```typescript
import { renderWithProviders, screen, userEvent } from "@/tests/testUtils";

it("should render component", () => {
  renderWithProviders(<MyComponent />);
  expect(screen.getByText("Expected text")).toBeInTheDocument();
});
```

#### 2. Test User Interactions

```typescript
it("should handle clicks", async () => {
  const user = userEvent.setup();
  renderWithProviders(<MyComponent />);

  const button = screen.getByRole("button", { name: /click me/i });
  await user.click(button);

  expect(screen.getByText("Clicked!")).toBeInTheDocument();
});
```

#### 3. Mock Chrome API

```typescript
import { vi } from 'vitest';

// In test setup or beforeEach
vi.mocked(chrome.storage.session.get).mockImplementation((_, callback) => {
  callback({ allowedDomains: ['example.com'] });
});

vi.mocked(chrome.runtime.sendMessage).mockResolvedValue({ ok: true });
```

### Component Test Examples

#### LinkCardComposer Tests

```typescript
describe("LinkCardComposer", () => {
  it("should display fetched card metadata", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LinkCardComposer url="https://thehill.com/article" />);

    // Fetch metadata
    const fetchButton = screen.getByRole("button", { name: /fetch link metadata/i });
    await user.click(fetchButton);

    // Wait for card to display
    await screen.findByText("Test Article");
    expect(screen.getByText("Test description")).toBeInTheDocument();
  });

  it("should post with card", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LinkCardComposer url="https://thehill.com/article" />);

    // Fetch and post
    await user.click(screen.getByRole("button", { name: /fetch/i }));
    await user.click(screen.getByRole("button", { name: /post with card/i }));

    // Verify chrome message was sent
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: "CREATE_POST" }),
      expect.any(Function)
    );
  });
});
```

#### Popup Tests

```typescript
describe("Popup", () => {
  it("should manage domains", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Popup />);

    // Add domain
    const input = screen.getByLabelText("Add domain");
    await user.type(input, "newsite.com");
    await user.click(screen.getByRole("button", { name: /add/i }));

    // Verify storage was called
    expect(chrome.storage.session.set).toHaveBeenCalledWith(
      expect.objectContaining({
        allowedDomains: expect.arrayContaining(["newsite.com"])
      })
    );
  });
});
```

## MSW (Mock Service Worker)

### How MSW Works

MSW intercepts HTTP requests and returns mock responses. For tRPC, we mock the `/api/trpc/*` endpoints.

### Viewing/Modifying Handlers

**Server handlers** (`server/tests/mswHandlers.ts`):

```typescript
export const handlers = [
  http.post('http://localhost:3000/api/trpc/og.fetch', async ({ request }) => {
    return HttpResponse.json({
      result: { data: { title: '...', description: '...', imageUrl: '...' } },
    });
  }),
  // ... more handlers
];
```

**Extension handlers** (`extension/tests/mswHandlers.ts`):

```typescript
export const handlers = [
  // Same structure as server handlers
  // Duplicated for independence between test suites
];
```

### Adding New Handlers

When adding a new tRPC procedure:

1. Add handler to both `server/tests/mswHandlers.ts` and `extension/tests/mswHandlers.ts`:

```typescript
http.post('http://localhost:3000/api/trpc/newRouter.newProcedure', async () => {
  return HttpResponse.json({
    result: {
      data: {
        /* mock response */
      },
    },
  });
});
```

2. Use in tests:

```typescript
// Default mock behavior
const result = await trpc.newRouter.newProcedure.useQuery();

// Override for specific test
server.use(
  http.post('http://localhost:3000/api/trpc/newRouter.newProcedure', () => {
    return HttpResponse.json({ error: { message: 'Mocked error' } });
  })
);
```

## Debugging Tests

### Running Single Test

```bash
# Run specific file
npm run test -- auth.test.ts

# Run specific test
npm run test -- --grep "should do something"

# Watch mode
npm run test -- --watch auth.test.ts
```

### Debug Output

```bash
# Show more verbose output
npm run test -- --reporter=verbose

# Debug test execution
DEBUG=* npm run test
```

### Using Vitest UI

```bash
npm run test:ui
```

Opens a browser dashboard at `http://localhost:51204/__vitest__/` with:

- Test explorer
- Live results
- Code coverage
- Debug information

### Common Issues

#### "chrome is not defined"

- Ensure `vitest.setup.ts` is loaded
- Check `test.setupFiles` in `vitest.config.ts`

#### "fetch is not defined"

- Add `global.fetch = vi.fn()` in test file
- Or mock in setup file for all tests

#### "Component not rendering"

- Ensure using `renderWithProviders` instead of `render`
- Check that QueryClient and tRPC providers are included

#### Tests timing out

- Increase timeout: `it("test", async () => {...}, { timeout: 15000 })`
- Check for infinite loops in async code
- Verify mocks are being called

## Coverage Reports

### Generate Coverage

```bash
npm run test:coverage
```

### View HTML Report

```bash
open coverage/index.html
```

### Coverage Thresholds

Coverage is configured in `vitest.config.ts`:

- **Line coverage**: Tracks executed lines
- **Branch coverage**: Tracks all decision paths
- **Function coverage**: Tracks called functions
- **Statement coverage**: Tracks executed statements

Current targets: ~80% on core business logic

## E2E Testing

### Overview

E2E tests simulate real user scenarios using Puppeteer. These tests are separate because they:

- Require the extension to be built
- Run in a real browser (slower)
- Can be flaky due to timing
- Need special configuration

### Running E2E Tests

```bash
# Build extension first
npm run build:ext

# Run E2E tests
npm run test:e2e
```

### Configuring E2E Tests

The separate config (`vitest.e2e.config.ts`):

- 30-second timeout (vs 10s for unit tests)
- Only includes `**/*.e2e.test.js` files
- Uses default environment (not jsdom)

### E2E Test Examples

See `extension/e2e.test.js` for placeholders. Real tests would:

1. Launch browser with extension:

```javascript
const browser = await puppeteer.launch({
  headless: false,
  args: ['--load-extension=extension/dist'],
});
```

2. Navigate to Bluesky:

```javascript
const page = await browser.newPage();
await page.goto('https://bsky.app');
```

3. Interact with extension:

```javascript
await page.type('textarea[placeholder*="What"]', 'https://thehill.com/article');
await page.waitForSelector('.bsext-card');
```

4. Verify results:

```javascript
expect(await page.$('.bsext-card')).not.toBeNull();
```

## CI/CD Integration

### GitHub Actions

To run tests in CI, create `.github/workflows/test.yml`:

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run test
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
        with:
          flags: unittests
```

## Best Practices

### Writing Tests

1. **Use descriptive names**: `it("should handle rate limit", ...)`
2. **Follow AAA pattern**: Arrange, Act, Assert
3. **Test behavior, not implementation**: Focus on what, not how
4. **Isolate each test**: No dependencies between tests
5. **Mock external calls**: Always mock APIs, databases, etc.

### Organization

1. **Co-locate tests**: Place `*.test.ts` next to source files
2. **Group related tests**: Use `describe()` blocks
3. **Share setup**: Use `beforeEach()` for common setup
4. **Clear mock cleanup**: Always use `vi.clearAllMocks()` in `beforeEach()`

### Performance

1. **Minimize setup time**: Only mock what's needed
2. **Use `describe.skip()` for WIP tests**: Don't leave `.skip` in commits
3. **Parallel test execution**: Vitest runs tests in parallel by default
4. **Watch mode**: Use during development, not CI

## Troubleshooting

### Test Suite Fails Randomly

- Check for timing issues (use `waitFor` instead of setTimeout)
- Verify MSW is properly resetting between tests
- Look for file system race conditions

### High Memory Usage

- Reduce test parallelization: `npm run test -- --run --reporter=verbose`
- Increase heap: `NODE_OPTIONS=--max-old-space-size=4096 npm run test`

### Slow Tests

- Use `npm run test:ui` to identify slow tests
- Consider splitting into separate files
- Reduce MSW listener log verbosity

## Resources

- [Vitest Docs](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/)
- [MSW Docs](https://mswjs.io/)
- [tRPC Testing](https://trpc.io/docs/server/testing)
