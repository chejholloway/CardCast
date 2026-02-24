// Accept any request-like object to facilitate testing with mocks
import { NextRequest } from 'next/server';
import { getEnv } from '../env';
import { createLogger } from '../log';
import * as crypto from 'crypto';

export interface TRPCContext {
  req: NextRequest;
  requestId: string;
  userId?: string;
  sessionId?: string;
  log: ReturnType<typeof createLogger>;
}

export const createTRPCContext = (req: NextRequest): TRPCContext => {
  const env = getEnv();
  const secret = req.headers.get('x-extension-secret');
  const requestId = crypto.randomUUID();
  const userId = req.headers.get('x-user-id') || undefined; // Placeholder
  const sessionId = req.headers.get('x-session-id') || undefined; // Placeholder
  const contextLogger = createLogger({ requestId, userId, sessionId });

  if (secret !== env.EXTENSION_SHARED_SECRET) {
    contextLogger.warn('Unauthorized tRPC request', {
      path: req.nextUrl.pathname,
      ip: req.headers.get('x-forwarded-for') ?? 'unknown',
    });
  }

  return { req, requestId, userId, sessionId, log: contextLogger };
};
