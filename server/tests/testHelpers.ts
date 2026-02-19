// server/tests/testHelpers.ts

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

// Compatibility shim for TRPC versions
let createCaller: (ctx: any) => any;
try {
  // @ts-ignore - dynamic check for compatibility with different TRPC versions
  const mod = require('@trpc/server');
  // If a factory exists in this version, use it
  if (typeof mod?.createCallerFactory === 'function') {
    createCaller = mod.createCallerFactory(appRouter);
  } else if (typeof mod?.createCaller === 'function') {
    // Some versions expose a createCaller helper instead
    createCaller = mod.createCaller(appRouter);
  } else {
    throw new Error('No compatible caller factory found');
  }
} catch {
  // Fallback: provide a dummy caller that will throw if used
  createCaller = (_ctx: any) => {
    return () => {
      throw new Error(
        'TRPC test caller is not available in this environment. Update TRPC version or testHelpers.ts.'
      );
    };
  };
}

/**
 * Create a test caller with a given context
 */
export const createTestCaller = (options: TestContextOptions = {}) => {
  const context = createTestContext(options);
  return createCaller(context);
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
