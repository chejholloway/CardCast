// server/tests/testHelpers.ts

import { initTRPC } from '@trpc/server';
import { appRouter } from '../trpc/router';

/**
 * Create a tRPC caller for testing
 * This bypasses HTTP and calls procedures directly
 */
export interface TestContextOptions {
  secret?: string;
  origin?: string;
  ip?: string;
}

export const createTestContext = (options: TestContextOptions = {}) => {
  const headers = new Headers({
    'x-extension-secret':
      options.secret || process.env.EXTENSION_SHARED_SECRET || 'test-secret',
  });

  if (options.origin) {
    headers.set('origin', options.origin);
  }

  return {
    req: {
      headers,
      ip: options.ip || '127.0.0.1',
    } as any,
  };
};

export type TestContext = Awaited<ReturnType<typeof createTestContext>>;

const t = initTRPC.create();
// Use a loose cast to accommodate testing with a flexible TRPCContext shape
const createCaller = (t.createCallerFactory as any)(appRouter as any);

/**
 * Create a test caller with a given context
 */
export const createTestCaller = (options: TestContextOptions = {}) => {
  const context = createTestContext(options);
  // Cast to any to satisfy the test context shape during typechecking
  return (createCaller as any)(context);
};

/**
 * Helper to call a tRPC procedure and catch errors
 */
export const callProcedure = async <T>(
  fn: () => Promise<T>
): Promise<{ data?: T; error?: Error }> => {
  try {
    const data = await fn();
    return { data };
  } catch (error) {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }
};
