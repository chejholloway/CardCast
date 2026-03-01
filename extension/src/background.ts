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

const isTokenExpiring = (jwt: string, bufferMinutes = 5): boolean => {
  try {
    const payload = JSON.parse(atob(jwt.split('.')[1]));
    const expiresAt = payload.exp * 1000;
    return Date.now() > expiresAt - bufferMinutes * 60 * 1000;
  } catch {
    return true;
  }
};

const checkAndRefreshSession = async (): Promise<{
  accessJwt: string;
  did: string;
  handle: string;
  refreshJwt: string;
} | null> => {
  const session = await chrome.storage.session.get(['bskySession']);
  const bskySession = session.bskySession as
    | { accessJwt: string; did: string; handle: string; refreshJwt: string }
    | undefined;

  if (!bskySession) return null;

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
      await chrome.storage.session.remove(['bskySession']);
      return null;
    }
  }

  return bskySession;
};

type MessageRequest =
  | { type: 'FETCH_OG'; url: string }
  | { type: 'AUTH_LOGIN'; identifier: string; appPassword: string }
  | { type: 'AUTH_STATUS' }
  | {
      type: 'CREATE_POST';
      payload: {
        text: string;
        url: string;
        title: string;
        description: string;
        imageUrl: string;
        // NOTE: accessJwt and did are intentionally excluded — the server
        // handles Bluesky auth internally via the shared secret middleware.
      };
    };

chrome.runtime.onMessage.addListener(
  (
    message: MessageRequest,
    _sender,
    sendResponse: (response: unknown) => void
  ) => {
    void (async () => {
      try {
        if ((message as any).type === 'BSKY_SESSION') {
          await chrome.storage.session.set({
            bskySession: (message as any).session,
          });
          sendResponse({ ok: true });
          return;
        }

        if ((message as any).type === 'BSKY_THEME') {
          await chrome.storage.session.set({
            bskyTheme: (message as any).theme,
          });
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
            data: { loggedIn: Boolean(bskySession), session: bskySession },
          });
          return;
        }

        // CREATE_POST is inside the try/catch so errors are caught and
        // sendResponse is guaranteed to fire on every code path.
        if (message.type === 'CREATE_POST') {
          const session = await checkAndRefreshSession();
          if (!session) {
            sendResponse({ ok: false, error: 'Not authenticated' });
            return;
          }

          const data = await backgroundClient.post.create.mutate({
            text: message.payload.text,
            url: message.payload.url,
            title: message.payload.title,
            description: message.payload.description,
            imageUrl: message.payload.imageUrl,
          });

          sendResponse({ ok: true, data });
          return;
        }
      } catch (error) {
        console.error('Background error:', error);
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

    return true;
  }
);
