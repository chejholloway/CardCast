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
import * as Sentry from '@sentry/browser';
import { SENTRY_DSN } from './config';

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: 1.0,
  });

  self.addEventListener('unhandledrejection', (event) => {
    Sentry.captureException(event.reason);
  });

  self.addEventListener('error', (event) => {
    Sentry.captureException(event.error);
  });
}

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
 * Check if JWT token is expired or expiring soon
 * @param {string} jwt - JWT token to check
 * @param {number} bufferMinutes - Minutes before expiry to consider expired (default: 5)
 * @returns {boolean} True if token is expired or expiring soon
 */
const isTokenExpiring = (jwt: string, bufferMinutes = 5): boolean => {
  try {
    const payload = JSON.parse(atob(jwt.split('.')[1]));
    const expiresAt = payload.exp * 1000; // Convert to milliseconds
    return Date.now() > expiresAt - bufferMinutes * 60 * 1000;
  } catch {
    return true; // If we can't parse, assume expired
  }
};

/**
 * Check session and refresh if needed
 * @returns {Promise<Session | null>} Refreshed session or null if refresh failed
 */
const checkAndRefreshSession = async (): Promise<{
  accessJwt: string;
  did: string;
  handle: string;
  refreshJwt: string;
} | null> => {
  const session = await chrome.storage.session.get(['bskySession']);
  const bskySession = session.bskySession as
    | {
        accessJwt: string;
        did: string;
        handle: string;
        refreshJwt: string;
      }
    | undefined;

  if (!bskySession) return null;

  // Check if token is expiring within 5 minutes
  if (isTokenExpiring(bskySession.accessJwt)) {
    try {
      const refreshed = await backgroundClient.auth.refresh.mutate({
        refreshJwt: bskySession.refreshJwt,
        did: bskySession.did,
        handle: bskySession.handle,
      });

      await chrome.storage.session.set({ bskySession: refreshed });
      return refreshed;
    } catch {
      // Refresh failed, clear session
      await chrome.storage.session.remove(['bskySession']);
      return null;
    }
  }

  return bskySession;
};

/**
 * Message types supported by the service worker
 *
 * @typedef {Object} MessageRequest
 * @property {"FETCH_OG"} type - Fetch Open Graph metadata
 * @property {string} url - URL to fetch metadata for
 *
 * OR
 *
 * @property {"CREATE_POST"} type - Create a Bluesky post with link card
 * @property {Object} payload - Post creation payload
 * @property {string} payload.text - Post text content
 * @property {string} payload.url - Link URL
 * @property {string} payload.title - Link title
 * @property {string} payload.description - Link description
 * @property {string} payload.imageUrl - Preview image URL
 *
 * OR
 *
 * @property {"AUTH_LOGIN"} type - Authenticate with Bluesky
 * @property {string} identifier - Bluesky handle or email
 * @property {string} appPassword - Bluesky app password (not user password)
 *
 * OR
 *
 * @property {"AUTH_STATUS"} type - Get authentication status
 */
type MessageRequest =
  | {
      type: 'FETCH_OG';
      url: string;
    }
  | {
      type: 'CREATE_POST';
      payload: {
        text: string;
        url: string;
        title: string;
        description: string;
        imageUrl: string;
      };
    }
  | {
      type: 'AUTH_LOGIN';
      identifier: string;
      appPassword: string;
    }
  | {
      type: 'AUTH_STATUS';
    };
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
 */ chrome.runtime.onMessage.addListener(
  (
    message: MessageRequest,
    _sender,
    sendResponse: (response: unknown) => void
  ) => {
    void (async () => {
      try {
        if (message.type === 'BSKY_SESSION') {
          await chrome.storage.session.set({ bskySession: message.session });
          sendResponse({ ok: true });
          return;
        }

        if (message.type === 'BSKY_THEME') {
          await chrome.storage.session.set({ bskyTheme: message.theme });
          sendResponse({ ok: true });
          return;
        }

        if (message.type === 'FETCH_OG') {
          const data = await queryClient.fetchQuery({
            queryKey: ['og', message.url],
            queryFn: () =>
              backgroundClient.og.fetch.query({ url: message.url }),
          });
          sendResponse({ ok: true, data });
          return;
        }

        if (message.type === 'CREATE_POST') {
          const bskySession = await checkAndRefreshSession();

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
  }
);
