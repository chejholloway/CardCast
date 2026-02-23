/**
 * Bluesky profile router
 * Provides a minimal getProfile endpoint that calls Bluesky app.bsky.actor.getProfile
 * using an access JWT supplied by the client.
 */
import { z } from 'zod';
import { protectedProcedure, router } from '../base';

const profileViewDetailedSchema = z.object({
  did: z.string(),
  handle: z.string(),
  displayName: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  avatar: z.string().optional().nullable(),
  banner: z.string().optional().nullable(),
  followersCount: z.number().int().optional(),
  followsCount: z.number().int().optional(),
  postsCount: z.number().int().optional(),
  indexedAt: z.string().datetime().optional(),
  viewer: z
    .object({
      muted: z.boolean().optional(),
      blockedBy: z.boolean().optional(),
      following: z.string().optional().nullable(),
      followedBy: z.string().optional().nullable(),
    })
    .optional(),
  labels: z.array(z.any()).optional(), // Assuming labels can be any for now, or further investigation needed
  associated: z.any().optional(), // Further investigation needed
  joinedViaStarterPack: z.any().optional(), // Further investigation needed
  pinnedPost: z.any().optional(), // Further investigation needed
  verification: z.any().optional(), // Further investigation needed
  status: z.any().optional(), // Further investigation needed
});

export const profileRouter = router({
  getProfile: protectedProcedure
    .input(
      z.object({
        actor: z.string(),
        accessJwt: z.string(),
      })
    )
    .output(profileViewDetailedSchema)
    .query(async ({ input, ctx }) => {
      ctx.log.info('Attempting to retrieve Bluesky profile', {
        actor: input.actor,
      });
      const endpoint = 'https://bsky.app/xrpc/app.bsky.actor.getProfile';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${input.accessJwt}`,
        },
        body: JSON.stringify({ actor: input.actor }),
      });
      if (!res.ok) {
        const text = await res.text();
        ctx.log.error('Failed to retrieve Bluesky profile', {
          actor: input.actor,
          status: res.status,
          response: text,
        });
        throw new Error(`getProfile failed: ${res.status} ${text}`);
      }
      const body = await res.json();
      ctx.log.info('Bluesky profile retrieved successfully', {
        actor: input.actor,
        did: body.did,
      });
      ctx.log.info('Response body from fetch', body);
      // Return Bluesky response
      return body;
    }),
});
