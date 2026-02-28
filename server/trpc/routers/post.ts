import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { protectedProcedure, router } from '../base';
import { getEnv } from '../../env';
import { AtpAgent } from '@atproto/api';
import { uploadImage } from './uploadImage';

const postContentSchema = z.object({
  text: z.string().min(1).max(3000),
  url: z.string().url(),
  title: z.string().min(1).max(300),
  description: z.string().min(1).max(1000),
  imageUrl: z.string().url(),
});

const authSchema = z.object({
  accessJwt: z.string().min(10),
  did: z.string().min(1),
  handle: z.string().min(1),
  refreshJwt: z.string().min(10),
});

console.info('Auth Schema: ', authSchema);

export const postRouter = router({
  create: protectedProcedure
    .input(postContentSchema)
    .output(
      z.object({
        success: z.literal(true),
        uri: z.string(),
        thumbUploaded: z.boolean(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const env = getEnv();
      const agent = new AtpAgent({ service: env.BLUESKY_SERVICE_URL });

      // Ensure Bluesky session exists, with a fallback to header-based parsing
      // in case ctx.bskySession wasn't populated by the context middleware
      // during tests or edge scenarios.
      if (!ctx.bskySession) {
        try {
          // Attempt to read from the raw request header as a fallback
          const hdr = (ctx.req as any)?.headers?.get?.('x-bsky-session');
          if (hdr) {
            ctx.bskySession = JSON.parse(hdr) as {
              accessJwt: string;
              did: string;
              handle: string;
              refreshJwt: string;
            };
          }
        } catch {
          // ignore parse errors, will throw below if still missing
        }
      }
      if (!ctx.bskySession) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Bluesky session not found in context',
        });
      }

      try {
        // session is a getter in newer @atproto/api versions so direct
        // assignment throws at runtime. Object.defineProperty bypasses that.
        Object.defineProperty(agent, 'session', {
          value: {
            ...ctx.bskySession,
            active: true,
          },
          writable: true,
          configurable: true,
        });

        const blobRef = await uploadImage(agent, input.imageUrl);

        const record: any = {
          $type: 'app.bsky.feed.post',
          text: input.text,
          createdAt: new Date().toISOString(),
          embed: {
            $type: 'app.bsky.embed.external',
            external: {
              uri: input.url,
              title: input.title,
              description: input.description,
            },
          },
        };

        if (blobRef) {
          record.embed.external.thumb = blobRef;
        }

        const res = await agent.api.com.atproto.repo.createRecord({
          repo: agent.session?.did || ctx.bskySession.did,
          collection: 'app.bsky.feed.post',
          record,
        });

        return {
          success: true as const,
          uri: res.data.uri,
          thumbUploaded: !!blobRef,
        };
      } catch (error: any) {
        ctx.log.error('Failed to create Bluesky post', {
          message: error?.message,
          status: error?.status,
        });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error?.message || 'Failed to create post',
        });
      }
    }),
});
