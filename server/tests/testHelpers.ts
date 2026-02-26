import { initTRPC } from '@trpc/server';
import { appRouter, type AppRouter } from '../trpc/router';
import { createTRPCContext } from '../trpc/trpcContext';
import { type AnyProcedure, type inferProcedureInput } from '@trpc/server';

import { createLogger } from '../log';

/**
 * Create a tRPC caller for testing.
 * This bypasses HTTP and calls procedures directly.
 */
export const createTestCaller = async (
  headers: Record<string, string | undefined> & { secret?: string }
) => {
  const testHeaders = new Headers();
  for (const [key, value] of Object.entries(headers)) {
    if (value) {
      testHeaders.set(key, value);
    }
  }

  if (!testHeaders.has('x-extension-secret')) {
    testHeaders.set('x-extension-secret', 'test-secret-key-0000');
  }

  // Do not auto-populate Bluesky session for tests. Tests that require a session
  // should provide 'x-bsky-session' explicitly to simulate real behavior.

  // Create a mock request that matches NextRequest interface
  const req = {
    headers: testHeaders,
    nextUrl: new URL('http://localhost'),
  } as any;

  // Create context using the same function as the real app
  const ctx = await createTRPCContext(req);
  ctx.log = createLogger();

  // Create tRPC instance and caller factory (like the original working version)
  const t = initTRPC.create();
  const createCaller = (t.createCallerFactory as any)(appRouter as any);

  return createCaller(ctx);
};

/**
 * Helper to call a tRPC procedure and catch errors, returning a typed result.
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

/**
 * Type helper for inferring the input of a tRPC procedure.
 * @example type OgFetchInput = ProcedureInput<typeof appRouter.og.fetch>;
 */
export type ProcedureInput<T extends AnyProcedure> = inferProcedureInput<T>;
