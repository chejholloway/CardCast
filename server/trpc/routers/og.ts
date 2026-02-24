import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import * as cheerio from 'cheerio';
import { protectedProcedure, router } from '../base';
import { log } from '../../log';
import { kv } from '@vercel/kv';
import { checkRateLimit } from '../../lib/rateLimit';

const ogInputSchema = z.object({
  url: z.string().url(),
});

const ogOutputSchema = z.object({
  title: z.string(),
  description: z.string(),
  imageUrl: z.string().url(),
});

const ALLOWED_DOMAINS = [
  'thehill.com',
  'theroot.com',
  'usanews.com',
  'example.com',
  'success.com',
];

const realisticHeaders: Record<string, string> = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

const withTimeout = async <T>(promise: Promise<T>, ms: number): Promise<T> => {
  let timeoutId: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(
        new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Request timed out',
        })
      );
    }, ms);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    if (timeoutId) clearTimeout(timeoutId);
    return result;
  } catch (err) {
    if (timeoutId) clearTimeout(timeoutId);
    throw err;
  }
};

export const ogRouter = router({
  fetch: protectedProcedure
    .input(ogInputSchema)
    .output(ogOutputSchema)
    .query(async ({ input, ctx }) => {
      const cacheKey = `og:${input.url}`;
      const cached = await kv.get<OgFetchOutput>(cacheKey);

      if (cached) {
        log.info('OG cache hit', { url: input.url });
        return cached;
      }

      const ip = ctx.req.headers.get('x-forwarded-for') ?? 'unknown';
      if (!(await checkRateLimit(ip))) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Rate limit exceeded',
        });
      }

      const urlObj = new URL(input.url);
      if (!ALLOWED_DOMAINS.includes(urlObj.hostname)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Domain not allowed',
        });
      }

      let res: Response;
      try {
        res = await withTimeout(
          fetch(input.url, { headers: realisticHeaders }),
          5000
        );
      } catch (error) {
        log.error('OG fetch failed', {
          error:
            error instanceof Error
              ? error.stack || error.message
              : JSON.stringify(error),
          url: input.url,
        });
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message:
            error instanceof Error ? error.message : 'Failed to fetch URL',
        });
      }

      if (res.status === 403) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'blocked' });
      }

      if (!res.ok) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Upstream error: ${res.status}`,
        });
      }

      const html = await res.text();
      if (!html.trim()) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'empty' });
      }

      const $ = cheerio.load(html);
      const title =
        $('meta[property="og:title"]').attr('content')?.trim() || '';
      const description =
        $('meta[property="og:description"]').attr('content')?.trim() || '';
      const imageUrl =
        $('meta[property="og:image"]').attr('content')?.trim() || '';

      if (!title || !description || !imageUrl) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'missing_tags' });
      }

      // FIX: previously there was a bare `return` here before kv.set,
      // so the cache write was unreachable dead code. Now we cache then return.
      const result = { title, description, imageUrl };
      await kv.set(cacheKey, result, { ex: 3600 });
      return result;
    }),
});

export type OgFetchInput = z.infer<typeof ogInputSchema>;
export type OgFetchOutput = z.infer<typeof ogOutputSchema>;
