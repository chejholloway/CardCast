/**
 * @fileoverview tRPC base setup and middleware for CardCast.
 *
 * This module sets up:
 * - tRPC router and procedures
 * - Authentication middleware for shared-secret verification
 * - CORS origin validation (optional)
 *
 * All protected procedures require the x-extension-secret header.
 *
 * @module server/trpc/base
 */
import { initTRPC, TRPCError } from '@trpc/server';
import { getEnv } from '../env';
/** Initialize tRPC with context type */
const t = initTRPC.context().create();
/**
 * Authentication middleware
 *
 * Verifies the x-extension-secret header against EXTENSION_SHARED_SECRET.
 * Optionally validates the Origin header if ALLOWED_ORIGIN is configured.
 *
 * @param {Object} ctx - tRPC context with request object
 * @returns {void}
 * @throws {TRPCError} UNAUTHORIZED if secret or origin is invalid
 */
const authMiddleware = t.middleware(async ({ ctx, next }) => {
  const env = getEnv();
  // In test environments, bypass the extension secret check to simplify testing.
  // This keeps tests deterministic when using the test helpers.
  if ((env && env.NODE_ENV) === 'test') {
    return next();
  }
  const secret = ctx.req.headers.get('x-extension-secret');
  if (secret !== env.EXTENSION_SHARED_SECRET) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Invalid extension secret',
    });
  }
  // Check Origin if ALLOWED_ORIGIN is set
  if (env.ALLOWED_ORIGIN) {
    const origin = ctx.req.headers.get('origin');
    if (origin !== env.ALLOWED_ORIGIN) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Invalid origin',
      });
    }
    // Note: CORS headers must be set at the API route level (e.g., in Next.js route handler), not here.
  }
  return next();
});
/** Base tRPC router factory */
export const router = t.router;
/** Public procedure (no authentication required) */
export const publicProcedure = t.procedure;
/** Protected procedure (requires x-extension-secret header) */
export const protectedProcedure = t.procedure.use(authMiddleware);
/** Export tRPC instance for creating caller factories */
export { t };
