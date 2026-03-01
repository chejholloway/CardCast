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

/**
 * Try Microlink first — it handles JS-rendered pages.
 * Returns null if the response is missing any required field so the
 * caller can fall back to cheerio.
 */
const fetchViaLicrolink = async (
  url: string
): Promise<{ title: string; description: string; imageUrl: string } | null> => {
  try {
    const microlinkUrl = `https://api.microlink.io?url=${encodeURIComponent(url)}&screenshot=false`;
    const res = await withTimeout(fetch(microlinkUrl), 8000);
    if (!res.ok) return null;

    const json = await res.json();
    if (json.status !== 'success') return null;

    const title = json.data?.title?.trim() || '';
    const description = json.data?.description?.trim() || '';
    const imageUrl = json.data?.image?.url?.trim() || '';

    if (!title || !description || !imageUrl) return null;

    return { title, description, imageUrl };
  } catch {
    return null;
  }
};

/**
 * Cheerio-based scraper as fallback for sites that serve full HTML
 * without JS rendering. Tries OG tags, then Twitter Card, then
 * standard HTML meta tags.
 */
const fetchViaCheerio = async (
  url: string
): Promise<{ title: string; description: string; imageUrl: string } | null> => {
  let res: Response;
  try {
    res = await withTimeout(fetch(url, { headers: realisticHeaders }), 5000);
  } catch {
    return null;
  }

  if (!res.ok) return null;

  const html = await res.text();
  if (!html.trim()) return null;

  const $ = cheerio.load(html);

  const title =
    $('meta[property="og:title"]').attr('content')?.trim() ||
    $('meta[name="twitter:title"]').attr('content')?.trim() ||
    $('title').first().text().trim() ||
    '';

  const description =
    $('meta[property="og:description"]').attr('content')?.trim() ||
    $('meta[name="twitter:description"]').attr('content')?.trim() ||
    $('meta[name="description"]').attr('content')?.trim() ||
    '';

  const imageUrl =
    $('meta[property="og:image"]').attr('content')?.trim() ||
    $('meta[name="twitter:image"]').attr('content')?.trim() ||
    $('meta[name="twitter:image:src"]').attr('content')?.trim() ||
    '';

  if (!title || !description || !imageUrl) return null;

  return { title, description, imageUrl };
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
      const hostname = urlObj.hostname.replace(/^www\./, '');
      if (!ALLOWED_DOMAINS.includes(hostname)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Domain not allowed',
        });
      }

      // Try Microlink first (handles JS-rendered pages), then fall back
      // to cheerio for sites that serve full static HTML.
      log.info('Fetching OG via Microlink', { url: input.url });
      let result = await fetchViaLicrolink(input.url);

      if (!result) {
        log.info('Microlink miss, falling back to cheerio', { url: input.url });
        result = await fetchViaCheerio(input.url);
      }

      if (!result) {
        log.warn('Both Microlink and cheerio failed to extract OG tags', {
          url: input.url,
        });
        throw new TRPCError({ code: 'NOT_FOUND', message: 'missing_tags' });
      }

      await kv.set(cacheKey, result, { ex: 3600 });
      return result;
    }),
});

export type OgFetchInput = z.infer<typeof ogInputSchema>;
export type OgFetchOutput = z.infer<typeof ogOutputSchema>;
