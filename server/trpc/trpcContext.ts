// Accept any request-like object to facilitate testing with mocks
import { getEnv } from '../env';
import { log } from '../log';

export interface TRPCContext {
  req: any;
}

export const createTRPCContext = (req: any): TRPCContext => {
  const env = getEnv();
  const secret = req.headers.get('x-extension-secret');

  if (secret !== env.EXTENSION_SHARED_SECRET) {
    log.warn('Unauthorized tRPC request', {
      path: req.nextUrl.pathname,
      ip: req.ip ?? 'unknown',
    });
  }

  return { req };
};
