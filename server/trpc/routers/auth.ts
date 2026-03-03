/**
 * @fileoverview Authentication router for Bluesky login and session management.
 *
 * This router handles user authentication via Bluesky credentials (handle + app password).
 * The backend is stateless—sessions are stored client-side in the extension's chrome.storage.session.
 *
 * @module server/trpc/routers/auth
 */

import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { AtpAgent } from '@atproto/api';
import { protectedProcedure, router } from '../base';
import { getEnv } from '../../env';
import { log } from '../../log';

/** Input schema for Bluesky login: handle/email and app password */
const loginInputSchema = z.object({
  /** Bluesky handle (e.g., 'user.bsky.social') or email address */
  identifier: z.string().min(1),
  /** App-specific password (generated in Bluesky settings) */
  appPassword: z.string().min(1),
});

/** Session object returned after successful login */
const sessionSchema = z.object({
  /** User's Decentralized Identifier (DID) */
  did: z.string(),
  /** JWT token for authenticated API requests to Bluesky */
  accessJwt: z.string(),
  /** User's Bluesky handle */
  handle: z.string(),
  /** JWT token for refreshing the session */
  refreshJwt: z.string(),
});

/** Response shape for the status endpoint */
const statusOutputSchema = z.object({
  /** Whether a session currently exists (always false in stateless backend) */
  loggedIn: z.boolean(),
  /** Session object or null if not logged in */
  session: sessionSchema.nullable(),
});

/**
 * Authentication Router
 *
 * Provides Bluesky login, session refresh, and session status endpoints.
 * All procedures require the x-extension-secret header (protectedProcedure).
 */
export const authRouter = router({
  /**
   * Login to Bluesky with handle and app password
   *
   * @procedure protectedProcedure (requires x-extension-secret header)
   * @param {AuthLoginInput} input - Bluesky credentials
   * @returns {AuthSession} Session object with DID, JWT, and handle
   * @throws {TRPCError} UNAUTHORIZED if credentials are invalid
   *
   * @example
   * const session = await trpc.auth.login.mutate({
   *   identifier: 'user.bsky.social',
   *   appPassword: 'xxxx-xxxx-xxxx-xxxx'
   * });
   * // Returns: { did: 'did:plc:...', accessJwt: '...', handle: 'user.bsky.social' }
   */
  login: protectedProcedure
    .input(loginInputSchema)
    .output(sessionSchema)
    .mutation(async ({ input }) => {
      const env = getEnv();
      const agent = new AtpAgent({ service: env.BLUESKY_SERVICE_URL });
      try {
        await agent.login({
          identifier: input.identifier,
          password: input.appPassword,
        });
      } catch (error) {
        log.warn('Bluesky login failed', {
          identifier: input.identifier,
          error:
            error instanceof Error
              ? error.stack || error.message
              : JSON.stringify(error),
        });
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message:
            error instanceof Error
              ? error.message
              : 'Invalid Bluesky credentials',
        });
      }

      if (!agent.session) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Session not established',
        });
      }

      const { did, accessJwt, handle, refreshJwt } = agent.session;

      const session: AuthSession = {
        did,
        accessJwt,
        handle,
        refreshJwt,
      };

      return session;
    }),

  /**
   * Refresh an expired Bluesky session using refresh token
   *
   * @procedure protectedProcedure (requires x-extension-secret header)
   * @param {Object} input - Session refresh parameters
   * @param {string} input.refreshJwt - Refresh JWT from previous session
   * @param {string} input.did - User's DID
   * @param {string} input.handle - User's handle
   * @returns {AuthSession} New session object with refreshed tokens
   * @throws {TRPCError} UNAUTHORIZED if refresh fails
   *
   * @example
   * const refreshed = await trpc.auth.refresh.mutate({
   *   refreshJwt: session.refreshJwt,
   *   did: session.did,
   *   handle: session.handle
   * });
   * // Returns: { did: '...', accessJwt: 'new-token', handle: '...', refreshJwt: 'new-refresh' }
   */
  refresh: protectedProcedure
    .input(
      z.object({
        refreshJwt: z.string(),
        did: z.string(),
        handle: z.string(),
      })
    )
    .output(sessionSchema)
    .mutation(async ({ input }) => {
      const env = getEnv();
      const agent = new AtpAgent({ service: env.BLUESKY_SERVICE_URL });

      try {
        // Resume with refresh token. The accessJwt will be ignored and a new one fetched.
        await agent.resumeSession({
          ...input,
          accessJwt: '', // Ignored by resume, but required by type
          active: true,
        });

        if (!agent.session) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Session refresh failed',
          });
        }

        log.info('Session refreshed successfully', {
          handle: agent.session.handle,
        });

        const session: AuthSession = {
          did: agent.session.did,
          accessJwt: agent.session.accessJwt,
          handle: agent.session.handle,
          refreshJwt: agent.session.refreshJwt,
        };

        return session;
      } catch (error) {
        log.warn('Session refresh failed', {
          handle: input.handle,
          error:
            error instanceof Error
              ? error.stack || error.message
              : JSON.stringify(error),
        });
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Session expired, please login again',
        });
      }
    }),

  /**
   * Get current authentication status
   *
   * This endpoint always returns `{ loggedIn: false, session: null }` because the backend
   * is stateless. Session management is handled by the extension in chrome.storage.session.
   *
   * This endpoint exists to provide a consistent API shape for the extension UI.
   *
   * @procedure protectedProcedure (requires x-extension-secret header)
   * @returns {Object} Status object (always has empty session)
   *
   * @example
   * const status = await trpc.auth.status.query();
   * // Returns: { loggedIn: false, session: null }
   */
  status: protectedProcedure.output(statusOutputSchema).query(() => {
    return {
      loggedIn: false,
      session: null,
    };
  }),

  /**
   * Resume a Bluesky session from stored session data
   *
   * @procedure protectedProcedure (requires x-extension-secret header)
   * @param {AuthSession} input - Stored session object
   * @returns {AuthSession} New session object with refreshed tokens
   * @throws {TRPCError} UNAUTHORIZED if resume fails
   */
  resumeSession: protectedProcedure
    .input(sessionSchema)
    .output(sessionSchema)
    .mutation(async ({ input }) => {
      const env = getEnv();
      const agent = new AtpAgent({
        service: env.BLUESKY_SERVICE_URL,
      });

      try {
        await agent.resumeSession({ ...input, active: true });

        if (!agent.session) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Session resume failed',
          });
        }

        log.info('Session resumed successfully', {
          handle: agent.session.handle,
        });

        return {
          did: agent.session.did,
          accessJwt: agent.session.accessJwt,
          handle: agent.session.handle,
          refreshJwt: agent.session.refreshJwt,
        };
      } catch (error) {
        log.warn('Session resume failed', {
          handle: input.handle,
          error:
            error instanceof Error
              ? error.stack || error.message
              : JSON.stringify(error),
        });
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Session expired, please login again',
        });
      }
    }),

  /**
   * Logout from Bluesky
   *
   * This is a placeholder as the backend is stateless. The extension is
   * responsible for clearing its own session storage.
   *
   * @procedure protectedProcedure (requires x-extension-secret header)
   * @returns {object} Success status
   */
  logout: protectedProcedure
    .input(z.object({ did: z.string() }))
    .mutation(async ({ input }) => {
      // Backend is stateless; extension clears local storage.
      console.info('input: ', input);
      return { success: true };
    }),
});

/** Type for auth.login input parameters */
export type AuthLoginInput = z.infer<typeof loginInputSchema>;
/** Type for authenticated session object */
export type AuthSession = z.infer<typeof sessionSchema>;
