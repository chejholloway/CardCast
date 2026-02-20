import '@testing-library/jest-dom';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';

// Setup MSW (Mock Service Worker)
import { server } from './server/tests/mswServer';

// Start MSW server for all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' });
  // Mock Next.js environment
  process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000';
  // Use a stable test secret that matches the defaults in env.js/env.ts/tests
  process.env.EXTENSION_SHARED_SECRET = 'test-secret-key-0000';
  process.env.BLUESKY_SERVICE_URL = 'https://bsky.social';
});

// Reset handlers and clear caches after each test
afterEach(() => {
  server.resetHandlers();
  vi.clearAllMocks();
});

// Clean up after all tests
afterAll(() => {
  server.close();
});

// Mock chrome API for extension tests
if (typeof globalThis !== 'undefined') {
  Object.defineProperty(globalThis, 'chrome', {
    value: {
      runtime: {
        sendMessage: vi.fn(),
        onMessage: {
          addListener: vi.fn(),
        },
      },
      storage: {
        session: {
          get: vi.fn(),
          set: vi.fn(),
          remove: vi.fn(),
        },
      },
    },
    writable: true,
    configurable: true,
  });
}

// Mock MutationObserver for component tests
if (typeof globalThis !== 'undefined' && !globalThis.MutationObserver) {
  globalThis.MutationObserver = vi.fn(() => ({
    observe: vi.fn(),
    disconnect: vi.fn(),
    takeRecords: vi.fn(),
  })) as any;
}
