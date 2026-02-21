import { kv } from '@vercel/kv';
import { Ratelimit } from '@upstash/ratelimit';

// Create a new ratelimiter, that allows 10 requests per 60 seconds
const ratelimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(10, '60 s'),
});

export const checkRateLimit = async (ip: string): Promise<boolean> => {
  const { success } = await ratelimit.limit(ip);
  return success;
};
