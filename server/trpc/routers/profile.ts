/**
 * Bluesky profile router
 * Provides a minimal getProfile endpoint that calls Bluesky app.bsky.actor.getProfile
 * using an access JWT supplied by the client.
 */
import { z } from 'zod';
import { protectedProcedure, router } from '../base';

export const profileRouter = router({
  getProfile: protectedProcedure
    .input(
      z.object({
        actor: z.string(),
        accessJwt: z.string(),
      })
    )
    .output(z.any())
    .query(async ({ input }) => {
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
        throw new Error(`getProfile failed: ${res.status} ${text}`);
      }
      const body = await res.json();
      // Return Bluesky response
      return body;
    }),
});
