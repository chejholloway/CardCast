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

import { QueryClient } from "@tanstack/react-query";
import { trpc } from "./trpcClient";

/**
 * Shared React Query client for the service worker
 * Configured with automatic retries (2 for queries, 1 for mutations)
 * and exponential backoff up to 10 seconds
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: attempt => Math.min(1000 * 2 ** attempt, 10_000)
    },
    mutations: {
      retry: 1,
      retryDelay: 1000
    }
  }
});

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
      type: "FETCH_OG";
      url: string;
    }
  | {
      type: "CREATE_POST";
      payload: {
        text: string;
        url: string;
        title: string;
        description: string;
        imageUrl: string;
      };
    }
  | {
      type: "AUTH_LOGIN";
      identifier: string;
      appPassword: string;
    }
  | {
      type: "AUTH_STATUS";
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
 */chrome.runtime.onMessage.addListener(
  (
    message: MessageRequest,
    _sender,
    sendResponse: (response: unknown) => void
  ) => {
    void (async () => {
      try {
        if (message.type === "FETCH_OG") {
          const data = await queryClient.fetchQuery({
            queryKey: ["og", message.url],
            queryFn: () => trpc.og.fetch.query({ url: message.url })
          });
          sendResponse({ ok: true, data });
          return;
        }

        if (message.type === "CREATE_POST") {
          const session = await chrome.storage.session.get(["bskySession"]);
          const bskySession = session.bskySession as
            | { accessJwt: string; did: string }
            | undefined;

          if (!bskySession) {
            sendResponse({
              ok: false,
              error: "NOT_AUTHENTICATED"
            });
            return;
          }

          const data = await trpc.post.create.mutation({
            ...message.payload,
            accessJwt: bskySession.accessJwt,
            did: bskySession.did
          });

          sendResponse({ ok: true, data });
          return;
        }

        if (message.type === "AUTH_LOGIN") {
          const data = await trpc.auth.login.mutation({
            identifier: message.identifier,
            appPassword: message.appPassword
          });

          await chrome.storage.session.set({
            bskySession: {
              did: data.did,
              accessJwt: data.accessJwt,
              handle: data.handle
            }
          });

          sendResponse({ ok: true, data });
          return;
        }

        if (message.type === "AUTH_STATUS") {
          const session = await chrome.storage.session.get(["bskySession"]);
          const bskySession = session.bskySession ?? null;
          sendResponse({
            ok: true,
            data: {
              loggedIn: Boolean(bskySession),
              session: bskySession
            }
          });
          return;
        }
      } catch (error) {
        // Log error for debugging
        // eslint-disable-next-line no-console
        console.error("Background error:", error);
        // We intentionally only send a safe error message back to the caller.
        sendResponse({
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : typeof error === 'string'
                ? error
                : JSON.stringify(error)
        });
      }
    })();

    // Indicate that we'll respond asynchronously.
    return true;
  }
);

