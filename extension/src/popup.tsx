/**
 * Extension popup UI for managing authentication and allowed domains
 *
 * Provides a user-friendly interface for:
 * - Bluesky login/logout with handle and app passwords
 * - Managing whitelist of allowed domains for card creation
 * - Current authentication status display
 *
 * Persists authentication state in chrome.storage.session and domain list
 * in chrome.storage.session.
 *
 * @module popup
 * @requires React, react-dom, QueryClient, tRPC
 */

import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { trpc, trpcClient } from './trpcClient';
import { ErrorBoundary } from './ErrorBoundary';
import { logSecurityEvent } from './securityLogger';
import { useSession } from './useSession';
import { PostCreationModal } from './PostCreationModal';
import { TRPCClientError } from '@trpc/client';

// Utility function to validate a domain string
const isValidDomain = (domain: string): boolean => {
  try {
    const url = new URL(`http://${domain}`);
    return url.hostname === domain && !domain.includes('/');
  } catch {
    return false;
  }
};

/**
 * Shared React Query client for the popup
 * Configured with automatic retries (2 for queries) and exponential backoff
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
    },
  },
});

/**
 * TRPC provider component - wraps children with QueryClientProvider and tRPC context
 *
 * @component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to wrap
 * @returns {React.ReactElement} Provider-wrapped children
 *
 * @example
 * <TRPCProvider>
 *   <Popup />
 * </TRPCProvider>
 */
const TRPCProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <QueryClientProvider client={queryClient}>
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      {children}
    </trpc.Provider>
  </QueryClientProvider>
);

/**
 * Main popup UI component
 *
 * Features:
 * - Login/logout form with Bluesky credentials
 * - Real-time auth status queries with tRPC
 * - Add/remove allowed domains for link card creation
 * - ARIA labels and live regions for screen reader accessibility
 * - Persistent domain storage in chrome.storage.session
 * - Error display for failed authentication attempts
 *
 * @component
 * @returns {React.ReactElement} Popup UI with auth form and domain management
 *
 * @example
 * // Rendered in popup.html via JavaScript
 * <TRPCProvider>
 *   <Popup />
 * </TRPCProvider>
 *
 * Features:
 * - Login with Bluesky handle (e.g., "user.bsky.social") and app password
 * - View current login status
 * - Add new allowed domains (e.g., "thehill.com")
 * - Remove existing domains from whitelist
 */
const Popup: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [domains, setDomains] = useState<string[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [liveMessage, setLiveMessage] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { session, loading } = useSession();

  useEffect(() => {
    const handleErrors = (event: PromiseRejectionEvent | ErrorEvent) => {
      const error = 'reason' in event ? event.reason : event.error;
      logSecurityEvent('other_security_event', {
        message: error?.message ?? 'Unknown error',
        stack: error?.stack ?? '',
      });
    };

    window.addEventListener('unhandledrejection', handleErrors);
    window.addEventListener('error', handleErrors);

    return () => {
      window.removeEventListener('unhandledrejection', handleErrors);
      window.removeEventListener('error', handleErrors);
    };
  }, []);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
    onError: (error: TRPCClientError<any>) => {
      logSecurityEvent('auth_failure', {
        message: error.message,
        code: error.shape?.code,
      });
    },
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });

  // Accessibility live messages
  useEffect(() => {
    if (loginMutation.isPending) {
      setLiveMessage('Signing in to Bluesky');
    } else if (session) {
      const h = session?.handle ?? '';
      setLiveMessage(h ? `Logged in as @${h}` : 'Logged in');
    } else {
      setLiveMessage('Not logged in');
    }
  }, [loginMutation.isPending, session]);

  /**
   * Load allowed domains from chrome.storage.session on component mount
   * Defaults to ["thehill.com", "theroot.com", "usanews.com"] if not set
   */
  useEffect(() => {
    // Load domains
    chrome.storage.session.get(['allowedDomains'], (result) => {
      let allowed: string[] = ['thehill.com', 'theroot.com', 'usanews.com'];
      if (result && Array.isArray(result.allowedDomains)) {
        allowed = result.allowedDomains;
      }
      setDomains(allowed);
    });
  }, []);

  /**
   * Attempts login with provided identifier and app password via tRPC
   */
  const onLogin = () => {
    loginMutation.mutate({ identifier, appPassword });
  };

  /**
   * Adds new domain to allowed list and persists to chrome.storage.session
   * No-op if domain already exists
   */
  const addDomain = () => {
    if (!newDomain) {
      setLiveMessage('Domain cannot be empty.');
      return;
    }
    if (!isValidDomain(newDomain)) {
      setLiveMessage('Invalid domain format.');
      return;
    }
    if (domains.includes(newDomain)) {
      setLiveMessage(`Domain ${newDomain} already exists.`);
      return;
    }
    const updated = [...domains, newDomain];
    setDomains(updated);
    chrome.storage.session.set({ allowedDomains: updated });
    setNewDomain('');
    setLiveMessage(`Domain added: ${newDomain}`);
  };

  /**
   * Removes domain from allowed list and persists to chrome.storage.session
   */
  const removeDomain = (domain: string) => {
    const updated = domains.filter((d) => d !== domain);
    setDomains(updated);
    chrome.storage.session.set({ allowedDomains: updated });
    setLiveMessage(`Domain removed: ${domain}`);
  };

  const loggedIn = !!session;
  const handle = session?.handle;

  return (
    <div
      role="region"
      aria-label="Bluesky Link Card popup"
      className="w-80 p-4 bg-slate-950 text-slate-100 text-sm"
    >
      <div aria-live="polite" className="sr-only" id="popup-live">
        {liveMessage}
      </div>
      <h1 className="text-base font-semibold mb-2">Bluesky Link Card</h1>
      {loginMutation.isPending && (
        <div className="text-xs text-slate-300 mb-2">Signing in…</div>
      )}
      {loginMutation.error && (
        <div className="text-xs text-red-400 mb-2">
          {loginMutation.error.message}
        </div>
      )}
      {loggedIn ? (
        <div className="space-y-4">
          <div className="space-y-1">
            <div>
              Logged in as <span className="font-medium">@{handle}</span>
            </div>
            <p className="text-xs text-slate-400">
              You can now create posts with rich link cards.
            </p>
          </div>
          <div className="flex flex-col space-y-2">
            <button
              aria-label="Create a new post"
              type="button"
              className="w-full rounded bg-sky-600 py-2 text-sm font-medium hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
              onClick={() => setIsModalOpen(true)}
            >
              Create Post
            </button>
            <button
              aria-label="Sign out of Bluesky"
              type="button"
              className="w-full rounded bg-slate-700 py-2 text-sm font-medium hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500"
              onClick={() => logoutMutation.mutate()}
            >
              Logout
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2 mb-4">
          <label className="block">
            <span className="text-xs text-slate-300">Bluesky handle</span>
            <input
              id="handle-input"
              aria-label="Bluesky handle"
              className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="you.bsky.social"
            />
          </label>
          <label className="block">
            <span className="text-xs text-slate-300">App password</span>
            <input
              id="password-input"
              aria-label="App password"
              type="password"
              className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
              value={appPassword}
              onChange={(e) => setAppPassword(e.target.value)}
              placeholder="xxxx-xxxx-xxxx-xxxx"
            />
          </label>
          <button
            aria-label="Sign in to Bluesky"
            type="button"
            className="mt-2 w-full rounded bg-sky-600 py-1 text-xs font-medium hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
            onClick={onLogin}
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? 'Signing in…' : 'Sign in to Bluesky'}
          </button>
        </div>
      )}

      <div className="border-t border-slate-800 pt-2 mt-2">
        <h2 className="text-sm font-medium mb-2">Allowed Domains</h2>
        <div
          role="list"
          aria-label="Allowed domains"
          className="space-y-1 mb-2"
        >
          {domains.map((domain) => (
            <div
              key={domain}
              role="listitem"
              className="flex justify-between items-center"
            >
              <span className="text-xs">{domain}</span>
              <button
                aria-label={`Remove domain ${domain}`}
                type="button"
                className="text-xs text-red-400 hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                onClick={() => removeDomain(domain)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-1">
          <input
            aria-label="Add domain"
            id="domain-input"
            className="flex-1 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            placeholder="example.com"
          />
          <button
            aria-label="Add domain"
            type="button"
            className="rounded bg-sky-600 px-2 py-1 text-xs font-medium hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
            onClick={addDomain}
          >
            Add
          </button>
        </div>
      </div>

      <div className="border-t border-slate-800 pt-2 mt-2">
        <a
          href="https://bsky.app"
          target="_blank"
          rel="noreferrer"
          className="text-xs text-sky-400 hover:underline"
        >
          Open Bluesky
        </a>
      </div>

      {isModalOpen && (
        <PostCreationModal onClose={() => setIsModalOpen(false)} />
      )}
    </div>
  );
};

/**
 * Mounts the Popup component into the DOM root element
 *
 * Called on popup.html script load to initialize the popup UI.
 * Safely no-ops if root element is not found.
 *
 * @returns {void}
 */
const mountPopup = () => {
  const container = document.getElementById('root');
  if (!container) return;
  const root = createRoot(container);
  root.render(
    <ErrorBoundary>
      <TRPCProvider>
        <Popup />
      </TRPCProvider>
    </ErrorBoundary>
  );
};

/**
 * Initialize popup UI on script load
 */
mountPopup();
