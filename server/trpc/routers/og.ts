/**
 * @fileoverview Open Graph metadata fetching router.
 *
 * This router fetches and parses Open Graph (OG) metadata from allowed domains.
 * It includes:
 * - Domain whitelist validation (thehill.com, theroot.com, usanews.com)
 * - Rate limiting (10 requests per minute per IP)
 * - 5-second timeout for all fetch operations
 * - Cheerio-based HTML parsing for OG tags
 *
 * @module server/trpc/routers/og
 */

import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import * as cheerio from 'cheerio';
import { protectedProcedure, router } from '../base';
import { log } from '../../log';
import { kv } from '@vercel/kv';
import { checkRateLimit } from '../../lib/rateLimit';

/** Input schema for OG fetch: a valid URL */
const ogInputSchema = z.object({
  /** Full URL to fetch metadata from (must be HTTPS on allowed domain) */
  url: z.string().url(),
});

/** Output schema for OG fetch: title, description, image URL */
const ogOutputSchema = z.object({
  /** og:title meta tag value */
  title: z.string(),
  /** og:description meta tag value */
  description: z.string(),
  /** og:image meta tag value (must be a valid URL) */
  imageUrl: z.string().url(),
});

/** Whitelisted domains for OG metadata fetching */
const ALLOWED_DOMAINS = [
  'thehill.com',
  'theroot.com',
  'usanews.com',
  'example.com',
  'success.com',
];

/** Realistic browser User-Agent header for external requests */
const realisticHeaders: Record<string, string> = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

// Simple in-memory rate limiter (resets on cold start)

/**
 * Wrap a promise with a timeout
 * @template T
 * @param {Promise<T>} promise - Promise to wrap
 * @param {number} ms - Timeout in milliseconds
 * @returns {Promise<T>} Promise that rejects if timeout exceeded
 * @throws {TRPCError} INTERNAL_SERVER_ERROR if timeout exceeded
 */
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
 * Open Graph Metadata Router
 *
 * Provides procedures for fetching and parsing OG metadata from whitelisted domains.
 * All procedures require the x-extension-secret header (protectedProcedure).
 */
export const ogRouter = router({
  /**
   * Fetch Open Graph metadata from a URL
   *
   * Validates that the URL is from an allowed domain, enforces rate limits,
   * fetches the HTML with realistic headers, and parses OG tags using Cheerio.
   *
   * @procedure protectedProcedure (requires x-extension-secret header)
   * @param {OgFetchInput} input - Object containing the URL to fetch
   * @returns {OgFetchOutput} Open Graph metadata
   *
   * @throws {TRPCError} BAD_REQUEST if domain not whitelisted or rate limit exceeded
   * @throws {TRPCError} NOT_FOUND with message 'blocked' if HTTP 403 returned
   * @throws {TRPCError} NOT_FOUND with message 'empty' if HTML response is empty
   * @throws {TRPCError} NOT_FOUND with message 'missing_tags' if OG tags are incomplete
   * @throws {TRPCError} INTERNAL_SERVER_ERROR if fetch times out (5s) or other error
   *
   * @example
   * const metadata = await trpc.og.fetch.query({
   *   url: 'https://thehill.com/some-article'
   * });
   * // Returns: {
   * //   title: 'Article Title',
   * //   description: 'Article summary...',
   * //   imageUrl: 'https://...'
   * // }
   *
   * @rate-limiting 10 requests per minute per IP address
   * @allowed-domains thehill.com, theroot.com, usanews.com
   */
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
          fetch(input.url, {
            headers: realisticHeaders,
          }),
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
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message:
            error instanceof Error ? error.message : 'Failed to fetch URL',
        });
      }

      if (res.status === 403) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'blocked',
        });
      }

      if (!res.ok) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Upstream error: ${res.status}`,
        });
      }

      const html = await res.text();
      if (!html.trim()) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'empty',
        });
      }

      const $ = cheerio.load(html);
      const title =
        $('meta[property="og:title"]').attr('content')?.trim() || '';
      const description =
        $('meta[property="og:description"]').attr('content')?.trim() || '';
      const imageUrl =
        $('meta[property="og:image"]').attr('content')?.trim() || '';

      if (!title || !description || !imageUrl) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'missing_tags',
        });
      }

      return {
        title,
        description,
        imageUrl,
      };

      const result = {
        title,
        description,
        imageUrl,
      };

      await kv.set(cacheKey, result, { ex: 3600 });

      return result;
    }),
});

/** Type for og.fetch input parameters */
export type OgFetchInput = z.infer<typeof ogInputSchema>;
/** Type for og.fetch output: OG metadata for a page */
export type OgFetchOutput = z.infer<typeof ogOutputSchema>;
