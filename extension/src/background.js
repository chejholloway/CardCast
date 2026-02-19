/**
 * Service worker for the Bluesky Link Card extension
 *
 * Handles message routing from content scripts and popup, manages tRPC calls,
 * and persists authentication state in chrome.storage.session.
 *
 * Message types handled:
 * - `FETCH_OG`: Fetch Open Graph metadata for a URL
 * - `CREATE_POST`: Create a Bluesky post with metadata embed
 * - `AUTH_LOGIN`: Authenticate with Bluesky handle and app password
 * - `AUTH_STATUS`: Get current authentication status
 *
 * All responses are sent via callback with `{ ok: boolean, data?, error? }` shape.
 *
 * @module background
 */
import { QueryClient } from '@tanstack/react-query';
import { backgroundClient } from './trpcClient';
/**
 * Shared React Query client for the service worker
 * Configured with automatic retries (2 for queries, 1 for mutations)
 * and exponential backoff up to 10 seconds
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});
/**
 * Routes incoming messages from content scripts and popup to appropriate tRPC handlers
 *
 * Asynchronously processes requests and sends responses via callback.
 * Always returns `true` to indicate async response handling.
 *
 * @param {MessageRequest} message - Message from content script/popup
 * @param {chrome.runtime.MessageSender} _sender - Sender metadata (unused)
 * @param {Function} sendResponse - Callback to send response back to sender
 * @returns {true} Indicate async response handling
 *
 * @example
 * // Content script fetches metadata
 * chrome.runtime.sendMessage(
 *   { type: "FETCH_OG", url: "https://thehill.com/article" },
 *   (response) => console.log(response.data)
 * );
 *
 * @example
 * // Create a post with link card
 * chrome.runtime.sendMessage({
 *   type: "CREATE_POST",
 *   payload: {
 *     text: "Check this out",
 *     url: "https://thehill.com/article",
 *     title: "Article Title",
 *     description: "Article description",
 *     imageUrl: "https://example.com/image.png"
 *   }
 * }, (response) => {
 *   if (response.ok) console.log("Posted with URI:", response.data.uri);
 *   else console.error("Post failed:", response.error);
 * });
 */ chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  void (async () => {
    try {
      if (message.type === 'FETCH_OG') {
        const data = await queryClient.fetchQuery({
          queryKey: ['og', message.url],
          queryFn: () => backgroundClient.og.fetch.query({ url: message.url }),
        });
        sendResponse({ ok: true, data });
        return;
      }
      if (message.type === 'CREATE_POST') {
        const session = await chrome.storage.session.get(['bskySession']);
        const bskySession = session.bskySession;
        if (!bskySession) {
          sendResponse({
            ok: false,
            error: 'NOT_AUTHENTICATED',
          });
          return;
        }
        const data = await backgroundClient.post.create.mutate({
          ...message.payload,
          accessJwt: bskySession.accessJwt,
          did: bskySession.did,
          handle: bskySession.handle,
          refreshJwt: bskySession.refreshJwt,
        });
        sendResponse({ ok: true, data });
        return;
      }
      if (message.type === 'AUTH_LOGIN') {
        const data = await backgroundClient.auth.login.mutate({
          identifier: message.identifier,
          appPassword: message.appPassword,
        });
        await chrome.storage.session.set({
          bskySession: {
            did: data.did,
            accessJwt: data.accessJwt,
            handle: data.handle,
            refreshJwt: data.refreshJwt,
          },
        });
        sendResponse({ ok: true, data });
        return;
      }
      if (message.type === 'AUTH_STATUS') {
        const session = await chrome.storage.session.get(['bskySession']);
        const bskySession = session.bskySession ?? null;
        sendResponse({
          ok: true,
          data: {
            loggedIn: Boolean(bskySession),
            session: bskySession,
          },
        });
        return;
      }
    } catch (error) {
      // Log error for debugging
      // eslint-disable-next-line no-console
      console.error('Background error:', error);
      // We intentionally only send a safe error message back to the caller.
      sendResponse({
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : typeof error === 'string'
              ? error
              : JSON.stringify(error),
      });
    }
  })();
  // Indicate that we'll respond asynchronously.
  return true;
});
