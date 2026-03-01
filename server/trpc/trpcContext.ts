import { NextRequest } from 'next/server';
import { getEnv } from '../env';
import { createLogger } from '../log';
import * as crypto from 'crypto';

export interface BskySession {
  accessJwt: string;
  did: string;
  handle: string;
  refreshJwt: string;
}

export interface TRPCContext {
  req: NextRequest;
  requestId: string;
  userId?: string;
  sessionId?: string;
  bskySession?: BskySession;
  log: ReturnType<typeof createLogger>;
}

export const createTRPCContext = (req: NextRequest): TRPCContext => {
  const env = getEnv();
  const secret = req.headers.get('x-extension-secret');
  const requestId = crypto.randomUUID();
  const userId = req.headers.get('x-user-id') || undefined;
  const sessionId = req.headers.get('x-session-id') || undefined;
  const bskySessionHeader = req.headers.get('x-bsky-session');

  let bskySession: BskySession | undefined;
  if (bskySessionHeader) {
    try {
      bskySession = JSON.parse(bskySessionHeader) as BskySession;
    } catch {
      // Malformed header — ignore and proceed without a session.
      // The auth middleware will reject the request if a session is required.
    }
  }

  const contextLogger = createLogger({ requestId, userId, sessionId });

  if (secret !== env.EXTENSION_SHARED_SECRET) {
    contextLogger.warn('Unauthorized tRPC request', {
      path: req.nextUrl.pathname,
      ip: req.headers.get('x-forwarded-for') ?? 'unknown',
    });
  }

  return { req, requestId, userId, sessionId, bskySession, log: contextLogger };
};
