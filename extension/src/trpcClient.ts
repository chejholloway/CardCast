/**
 * @fileoverview tRPC client configuration for the browser extension.
 */
import { createTRPCReact } from '@trpc/react-query';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from './types/trpc';
import { BACKEND_URL, EXTENSION_SHARED_SECRET } from './config';

/**
 * Returns headers for every tRPC request.
 *
 * Always a plain async function so httpBatchLink gets a consistent type
 * regardless of environment. The previous version returned an object in test
 * and a function in production, which broke the test-environment client and
 * required a TypeScript cast to hide the mismatch.
 *
 * In test, chrome.storage is mocked, so the session lookup is safe to run.
 */
const getHeaders = async (): Promise<Record<string, string>> => {
  const headers: Record<string, string> = {
    'x-extension-secret': EXTENSION_SHARED_SECRET,
  };

  // chrome.storage is not available in plain Node test environments.
  // The try/catch prevents a crash if the mock isn't set up.
  try {
    const session = await chrome.storage.session.get('bskySession');
    const bskySession = session?.bskySession;
    if (bskySession) {
      headers['x-bsky-session'] = JSON.stringify(bskySession);
    }
  } catch {
    // Running outside extension context (e.g. unit tests without chrome mock).
  }

  return headers;
};

/**
 * tRPC React client — used in popup and content script React components.
 */
export const trpc = createTRPCReact<AppRouter>();

/**
 * tRPC client instance for React Query (popup/content script).
 */
export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${BACKEND_URL}/api/trpc`,
      headers: getHeaders,
    }),
  ],
});

/**
 * Vanilla tRPC client for the background service worker.
 * No React dependency — used directly with .query() and .mutate().
 */
export const backgroundClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${BACKEND_URL}/api/trpc`,
      headers: getHeaders,
    }),
  ],
});
