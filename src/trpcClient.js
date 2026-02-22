/**
 * @fileoverview tRPC client configuration for the browser extension.
 *
 * Sets up a tRPC React client with httpBatchLink that:
 * - Points to the backend via NEXT_PUBLIC_BACKEND_URL
 * - Includes the x-extension-secret header on all requests
 * - Uses React Query for caching, retries, and state management
 *
 * This module is used by extension React components to call the backend API.
 *
 * @module extension/src/trpcClient
 */
import { createTRPCReact } from '@trpc/react-query';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { BACKEND_URL, EXTENSION_SHARED_SECRET } from './config';
/**
 * tRPC React client instance
 *
 * Provides hooks for:
 * - Queries: useQuery
 * - Mutations: useMutation
 * - Utilities: useContext, useUtils
 *
 * @example
 * const { data } = trpc.auth.status.useQuery();
 * const loginMutation = trpc.auth.login.useMutation();
 */
export const trpc = createTRPCReact();
/**
 * Configured tRPC client with httpBatchLink
 *
 * Features:
 * - Batches multiple requests into single HTTP call for efficiency
 * - Includes x-extension-secret header for authentication
 * - Uses NEXT_PUBLIC_BACKEND_URL as API endpoint
 *
 * @example
 * const client = new QueryClient();
 * <trpc.Provider client={trpcClient} queryClient={client}>
 *   <App />
 * </trpc.Provider>
 */
export const trpcClient = trpc.createClient({
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
export const backgroundClient = createTRPCClient({
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
