import { kv } from '@vercel/kv';
import { AuthSession } from '../trpc/routers/auth';

const getSessionKey = (did: string) => `session:${did}`;

export const setSession = async (did: string, session: AuthSession) => {
  await kv.set(getSessionKey(did), JSON.stringify(session), {
    ex: 60 * 60 * 24,
  }); // 1 day expiry
};

export const getSession = async (did: string): Promise<AuthSession | null> => {
  const sessionData = await kv.get<string>(getSessionKey(did));
  return sessionData ? JSON.parse(sessionData) : null;
};

export const deleteSession = async (did: string) => {
  await kv.del(getSessionKey(did));
};
