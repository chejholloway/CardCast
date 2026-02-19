/**
 * @fileoverview Bluesky post creation router.
 *
 * This router handles creating Bluesky posts with Open Graph link cards.
 * It:
 * - Accepts post text, URL, and OG metadata
 * - Downloads and uploads the OG image as a blob to Bluesky
 * - Creates an app.bsky.feed.post record with app.bsky.embed.external embed
 * - Falls back to text-only posts if image upload fails
 * - Includes 10-second timeouts for image fetch and post creation
 *
 * @module server/trpc/routers/post
 */
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { protectedProcedure, router } from '../base';
import { log } from '../../log';
import { getEnv } from '../../env';
import { BskyAgent } from '@atproto/api';
/** Input schema for post creation */
const postInputSchema = z.object({
  /** Post text content (1-3000 characters) */
  text: z.string().min(1).max(3000),
  /** URL to embed in the post */
  url: z.string().url(),
  /** Open Graph title for the link card */
  title: z.string().min(1).max(300),
  /** Open Graph description for the link card */
  description: z.string().min(1).max(1000),
  /** Open Graph image URL to download and attach */
  imageUrl: z.string().url(),
  /** Bluesky access JWT (obtained from auth.login) */
  accessJwt: z.string().min(10),
  /** User's DID (Decentralized Identifier) */
  did: z.string().min(1),
  /** User's Bluesky handle */
  handle: z.string().min(1),
  /** Bluesky refresh JWT (obtained from auth.login) */
  refreshJwt: z.string().min(1),
});
/** Output schema for post creation */
const postOutputSchema = z.object({
  /** Always true on success */
  success: z.literal(true),
  /** The AT Protocol URI of the created post (at://...) */
  uri: z.string(),
  /** Whether the thumbnail image was successfully uploaded */
  thumbUploaded: z.boolean(),
});
/** Realistic browser User-Agent for external requests */
const realisticHeaders = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
};
/**
 * Wrap a promise with a timeout
 * @template T
 * @param {Promise<T>} promise - Promise to wrap
 * @param {number} ms - Timeout in milliseconds
 * @returns {Promise<T>} Promise that rejects if timeout exceeded
 * @throws {TRPCError} INTERNAL_SERVER_ERROR if timeout exceeded
 */
const withTimeout = async (promise, ms) => {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
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
 * Bluesky Post Creation Router
 *
 * Provides procedures for creating posts with link embeds.
 * All procedures require the x-extension-secret header (protectedProcedure).
 */
export const postRouter = router({
  /**
   * Create a Bluesky post with an embedded link card
   *
   * Uploads an image from the provided imageUrl and creates a post with:
   * - Text content
   * - External (link) embed with title, description, and image thumbnail
   * - Automatic fallback to text-only if image upload fails
   *
   * @procedure protectedProcedure (requires x-extension-secret header)
   * @param {PostCreateInput} input - Post and authentication details
   * @returns {PostCreateOutput} Created post URI and upload status
   *
   * @throws {TRPCError} INTERNAL_SERVER_ERROR if post creation fails
   *
   * @example
   * const result = await trpc.post.create.mutate({
   *   text: 'Check this out!',
   *   url: 'https://thehill.com/article',
   *   title: 'Article Title',
   *   description: 'Summary...',
   *   imageUrl: 'https://...',
   *   accessJwt: '...',
   *   did: 'did:plc:...'
   * });
   * // Returns: {
   * //   success: true,
   * //   uri: 'at://did:plc:.../app.bsky.feed.post/...',
   * //   thumbUploaded: true
   * // }
   *
   * @timeouts Image fetch (10s), post creation (10s)
   * @fallback If image upload fails, creates text-only post with thumbUploaded: false
   */
  create: protectedProcedure
    .input(postInputSchema)
    .output(postOutputSchema)
    .mutation(async ({ input }) => {
      const env = getEnv();
      const agent = new BskyAgent({ service: env.BLUESKY_SERVICE_URL });
      // Hydrate agent with existing session rather than logging in with password.
      await agent.resumeSession({
        accessJwt: input.accessJwt,
        did: input.did,
        handle: input.handle,
        refreshJwt: input.refreshJwt,
        active: true,
      });
      let blobRef;
      let thumbUploaded = false;
      try {
        const imgRes = await withTimeout(
          fetch(input.imageUrl, { headers: realisticHeaders }),
          10_000
        );
        if (!imgRes.ok) {
          throw new Error(`Image fetch failed with status ${imgRes.status}`);
        }
        const buffer = Buffer.from(await imgRes.arrayBuffer());
        const uploadRes = await withTimeout(
          agent.uploadBlob(buffer, {
            encoding: 'image/jpeg',
          }),
          10_000
        );
        // Shape: { data: { blob: { ref: {...}, mimeType, size } } }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        blobRef = uploadRes.data.blob;
        thumbUploaded = true;
      } catch (error) {
        thumbUploaded = false;
        log.warn('Thumbnail upload failed, falling back to no-thumb post', {
          error:
            error instanceof Error
              ? error.stack || error.message
              : JSON.stringify(error),
          imageUrl: input.imageUrl,
        });
      }
      try {
        const record = {
          $type: 'app.bsky.feed.post',
          text: input.text,
          createdAt: new Date().toISOString(),
          embed: {
            $type: 'app.bsky.embed.external',
            external: {
              uri: input.url,
              title: input.title,
              description: input.description,
              ...(thumbUploaded && blobRef ? { thumb: blobRef } : {}),
            },
          },
        };
        const res = await withTimeout(
          agent.api.com.atproto.repo.createRecord({
            repo: input.did,
            collection: 'app.bsky.feed.post',
            record,
          }),
          10_000
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const uri = res.uri;
        if (!uri) {
          throw new Error('Missing URI from createRecord response');
        }
        return {
          success: true,
          uri,
          thumbUploaded,
        };
      } catch (error) {
        log.error('Failed to create Bluesky post', {
          error:
            error instanceof Error
              ? error.stack || error.message
              : JSON.stringify(error),
        });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message:
            error instanceof Error ? error.message : 'Failed to create post',
        });
      }
    }),
});
