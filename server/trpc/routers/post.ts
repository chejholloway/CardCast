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
import { uploadImage } from './uploadImage';

/** Post content details */
const postContentSchema = z.object({
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
});

/** Bluesky authentication credentials */
const authSchema = z.object({
  /** Bluesky access JWT (obtained from auth.login) */
  accessJwt: z.string().min(10),
  /** User's DID (Decentralized Identifier) */
  did: z.string().min(1),
  /** User's Bluesky handle */
  handle: z.string().min(1),
  /** Bluesky refresh JWT (obtained from auth.login) */
  refreshJwt: z.string().min(1),
});

/** Input schema for post creation, combining content and auth */
const postInputSchema = postContentSchema.merge(authSchema);

/** Output schema for post creation */
const postOutputSchema = z.object({
  /** Always true on success */
  success: z.literal(true),
  /** The AT Protocol URI of the created post (at://...) */
  uri: z.string(),
  /** Whether the thumbnail image was successfully uploaded */
  thumbUploaded: z.boolean(),
});

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
   * @throws {TRPCError} INTERNAL_SERVER_ERROR if post creation or image upload fails
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

      // uploadImage handles fetch, compression, and upload.
      // It returns the blob on success or undefined on failure.
      const blobRef = await uploadImage(agent, input.imageUrl);

      try {
        const record: Record<string, unknown> = {
          $type: 'app.bsky.feed.post',
          text: input.text,
          createdAt: new Date().toISOString(),
          embed: {
            $type: 'app.bsky.embed.external',
            external: {
              uri: input.url,
              title: input.title,
              description: input.description,
              ...(blobRef ? { thumb: blobRef } : {}),
            },
          },
        };

        const res = await agent.api.com.atproto.repo.createRecord({
          repo: input.did,
          collection: 'app.bsky.feed.post',
          record,
        });

        const uri = res.data.uri;
        if (!uri) {
          throw new Error('Missing URI from createRecord response');
        }

        return {
          success: true,
          uri,
          thumbUploaded: !!blobRef,
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

/** Type for post.create input parameters */
export type PostCreateInput = z.infer<typeof postInputSchema>;
/** Type for post.create output: success flag, URI, and image upload status */
export type PostCreateOutput = z.infer<typeof postOutputSchema>;
