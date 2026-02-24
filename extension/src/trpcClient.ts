/**
 * @fileoverview tRPC client configuration for the browser extension.
 */
import { createTRPCReact } from '@trpc/react-query';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { BACKEND_URL, EXTENSION_SHARED_SECRET } from './config';

/**
 * tRPC React client instance
 */
export const trpc: any = createTRPCReact<any>();

/**
 * Configured tRPC client with httpBatchLink
 */
export const trpcClient: any = createTRPCClient<any>({
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

/**
 * Vanilla tRPC client for non-React environments (like background service worker)
 */
export const backgroundClient: any = createTRPCClient<any>({
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
