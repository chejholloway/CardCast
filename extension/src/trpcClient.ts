/**
 * @fileoverview tRPC client configuration for the browser extension.
 */
import { createTRPCReact } from '@trpc/react-query';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@server/trpc/router';
import { BACKEND_URL, EXTENSION_SHARED_SECRET } from './config';

/**
 * tRPC React client instance
 */
export const trpc = createTRPCReact<AppRouter>();

/**
 * Configured tRPC client with httpBatchLink
 */
export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${BACKEND_URL}/api/trpc`,
      async headers() {
        const session = await chrome.storage.session.get('bskySession');
        const bskySession = session?.bskySession;

        const headers: Record<string, string> = {
          'x-extension-secret': EXTENSION_SHARED_SECRET,
        };

        if (bskySession) {
          headers['x-bsky-session'] = JSON.stringify(bskySession);
        }

        return headers;
      },
    }),
  ],
});

/**
 * Vanilla tRPC client for non-React environments (like background service worker)
 */
export const backgroundClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${BACKEND_URL}/api/trpc`,
      headers() {
        return {
          'x-extension-secret': EXTENSION_SHARED_SECRET,
        };
      },
    }),
  ],
});
