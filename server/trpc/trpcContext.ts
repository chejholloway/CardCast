// Accept any request-like object to facilitate testing with mocks
import { NextRequest } from 'next/server';
import { getEnv } from '../env';
import { log } from '../log';

export interface TRPCContext {
  req: NextRequest;
}

export const createTRPCContext = (req: NextRequest): TRPCContext => {
  const env = getEnv();
  const secret = req.headers.get('x-extension-secret');

  if (secret !== env.EXTENSION_SHARED_SECRET) {
    log.warn('Unauthorized tRPC request', {
      path: req.nextUrl.pathname,
      ip: req.headers.get('x-forwarded-for') ?? 'unknown',
    });
  }

  return { req };
};
