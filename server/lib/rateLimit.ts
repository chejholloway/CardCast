import { kv } from '@vercel/kv';

export const checkRateLimit = async (ip: string): Promise<boolean> => {
  const key = `ratelimit:${ip}`;
  const now = Date.now();
  const window = 60 * 1000; // 1 minute
  const limit = 10;

  // Get timestamps from Redis
  const timestamps = await kv.lrange(key, 0, -1);
  const recent = timestamps.map(Number).filter((ts) => now - ts < window);

  if (recent.length >= limit) {
    return false;
  }

  // Add new timestamp
  await kv.lpush(key, now);
  await kv.ltrim(key, 0, limit - 1);
  await kv.expire(key, 60); // Auto-expire after 1 minute

  return true;
};
