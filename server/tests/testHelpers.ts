// server/tests/testHelpers.ts

import { appRouter, type AppRouter } from '../trpc/router';
import { createTRPCContext } from '../trpc/trpcContext';
import { type AnyProcedure, type inferProcedureInput } from '@trpc/server';

import { createLogger } from '../log';

/**
 * Create a tRPC caller for testing.
 * This bypasses HTTP and calls procedures directly.
 */
export const createTestCaller = async (args: {
  secret?: string;
  origin?: string;
  ip?: string;
}) => {
  const headers = new Headers({
    'x-extension-secret':
      args.secret || process.env.EXTENSION_SHARED_SECRET || 'test-secret',
  });

  if (args.origin) {
    headers.set('origin', args.origin);
  }

  const req = {
    headers,
    ip: args.ip,
    nextUrl: new URL('http://localhost'), // Mock nextUrl
  } as any;

  const ctx = await createTRPCContext(req);
  ctx.log = createLogger(); // Inject logger into context
  return appRouter.createCaller(ctx);
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
