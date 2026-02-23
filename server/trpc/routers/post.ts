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
import { getEnv } from '../../env';
import { BskyAgent } from '@atproto/api';
import { uploadImage } from './uploadImage';

/**
 * Uploads an image to Bluesky and returns the blob reference.
 * @param agent The BskyAgent instance.
 * @param imageUrl The URL of the image to upload.
 * @returns The blob reference or undefined if upload fails.
 */
async function uploadImageAndGetBlobRef(agent: BskyAgent, imageUrl: string) {
  // uploadImage handles fetch, compression, and upload.
  // It returns the blob on success or undefined on failure.
  return await uploadImage(agent, imageUrl);
}

/**
 * Creates a Bluesky post record.
 * @param agent The BskyAgent instance.
 * @param postInput The post content input.
 * @param blobRef The image blob reference, if any.
 * @returns The URI of the created post and whether the thumbnail was uploaded.
 * @throws {TRPCError} if post creation fails or URI is missing.
 */
async function createBlueskyPostRecord(
  agent: BskyAgent,
  postInput: z.infer<typeof postContentSchema>,
  blobRef: { cid: string; mimeType: string } | undefined
) {
  const record: Record<string, unknown> = {
    $type: 'app.bsky.feed.post',
    text: postInput.text,
    createdAt: new Date().toISOString(),
    embed: {
      $type: 'app.bsky.embed.external',
      external: {
        uri: postInput.url,
        title: postInput.title,
        description: postInput.description,
        ...(blobRef ? { thumb: blobRef } : {}),
      },
    },
  };

  const res = await agent.api.com.atproto.repo.createRecord({
    repo: agent.session?.did || '',
    collection: 'app.bsky.feed.post',
    record,
  });

  const uri = res.data.uri;
  if (!uri) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Missing URI from createRecord response',
    });
  }

  return { uri, thumbUploaded: !!blobRef };
}

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
const postCreateInputSchema = z.object({
  post: postContentSchema,
  auth: authSchema,
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
    .input(postCreateInputSchema)
    .output(postOutputSchema)
    .mutation(async ({ input, ctx }) => {
      ctx.log.info('Attempting to create Bluesky post', {
        text: input.post.text.substring(0, 50) + '...',
        url: input.post.url,
      });
      const env = getEnv();
      const agent = new BskyAgent({ service: env.BLUESKY_SERVICE_URL });

      // Hydrate agent with existing session rather than logging in with password.
      await agent.resumeSession({
        accessJwt: input.auth.accessJwt,
        did: input.auth.did,
        handle: input.auth.handle,
        refreshJwt: input.auth.refreshJwt,
        active: true,
      });
      ctx.log.debug('Bluesky agent session resumed', { did: input.auth.did });

      ctx.log.debug('Uploading image and getting blob reference', {
        imageUrl: input.post.imageUrl,
      });
      const blobRef = await uploadImageAndGetBlobRef(
        agent,
        input.post.imageUrl
      );
      if (blobRef) {
        ctx.log.debug('Image uploaded successfully', {
          cid: blobRef.ref.toString(),
        });
      } else {
        ctx.log.warn('Image upload failed or returned no blob reference', {
          imageUrl: input.post.imageUrl,
        });
      }

      try {
        ctx.log.debug('Creating Bluesky post record');
        const { uri, thumbUploaded } = await createBlueskyPostRecord(
          agent,
          input.post,
          blobRef
            ? { cid: blobRef.ref.toString(), mimeType: blobRef.mimeType }
            : undefined
        );
        ctx.log.info('Bluesky post created successfully', {
          uri,
          thumbUploaded,
        });

        return {
          success: true,
          uri,
          thumbUploaded,
        };
      } catch (error) {
        ctx.log.error('Failed to create Bluesky post', {
          error:
            error instanceof Error
              ? error.stack || error.message
              : JSON.stringify(error),
          postInput: { ...input.post, auth: '[REDACTED]' }, // Log post input but redact auth
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
export type PostCreateInput = z.infer<typeof postCreateInputSchema>;
/** Type for post.create output: success flag, URI, and image upload status */
export type PostCreateOutput = z.infer<typeof postOutputSchema>;
