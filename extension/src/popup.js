import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
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
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc, trpcClient } from './trpcClient';
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
const TRPCProvider = ({ children }) =>
  _jsx(QueryClientProvider, {
    client: queryClient,
    children: _jsx(trpc.Provider, {
      client: trpcClient,
      queryClient: queryClient,
      children: children,
    }),
  });
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
const Popup = () => {
  const [identifier, setIdentifier] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [domains, setDomains] = useState([]);
  const [newDomain, setNewDomain] = useState('');
  const [liveMessage, setLiveMessage] = useState('');
  const { data: authStatus, refetch: refetchAuth } =
    trpc.auth.status.useQuery();
  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => refetchAuth(),
  });
  // Accessibility live messages
  useEffect(() => {
    if (loginMutation.isPending) {
      setLiveMessage('Signing in to Bluesky');
    } else if (authStatus?.loggedIn) {
      const h = authStatus?.session?.handle ?? '';
      setLiveMessage(h ? `Logged in as @${h}` : 'Logged in');
    } else if (authStatus) {
      setLiveMessage('Not logged in');
    }
  }, [loginMutation.isPending, authStatus]);
  /**
   * Load allowed domains from chrome.storage.session on component mount
   * Defaults to ["thehill.com", "theroot.com", "usanews.com"] if not set
   */
  useEffect(() => {
    // Load domains
    chrome.storage.session.get(['allowedDomains'], (result) => {
      let allowed = ['thehill.com', 'theroot.com', 'usanews.com'];
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
    if (newDomain && !domains.includes(newDomain)) {
      const updated = [...domains, newDomain];
      setDomains(updated);
      chrome.storage.session.set({ allowedDomains: updated });
      setNewDomain('');
      setLiveMessage(`Domain added: ${newDomain}`);
    }
  };
  /**
   * Removes domain from allowed list and persists to chrome.storage.session
   */
  const removeDomain = (domain) => {
    const updated = domains.filter((d) => d !== domain);
    setDomains(updated);
    chrome.storage.session.set({ allowedDomains: updated });
    setLiveMessage(`Domain removed: ${domain}`);
  };
  const loggedIn = authStatus?.loggedIn ?? false;
  const handle = authStatus?.session?.handle;
  return _jsxs('div', {
    role: 'region',
    'aria-label': 'Bluesky Link Card popup',
    className:
      'w-80 p-4 bg-slate-950 text-slate-100 text-sm rounded-xl shadow-xl animate-pop',
    style: { width: '420px', maxWidth: '92vw' },
    children: [
      _jsx('div', {
        'aria-live': 'polite',
        className: 'sr-only',
        id: 'popup-live',
        children: liveMessage,
      }),
      _jsx('h1', {
        className: 'text-base font-semibold mb-2',
        children: 'Bluesky Link Card',
      }),
      loginMutation.isPending &&
        _jsx('div', {
          className: 'text-xs text-slate-300 mb-2',
          children: 'Signing in\u2026',
        }),
      loginMutation.error &&
        _jsx('div', {
          className: 'text-xs text-red-400 mb-2',
          children: loginMutation.error.message,
        }),
      loggedIn
        ? _jsxs('div', {
            className: 'space-y-1 mb-4',
            children: [
              _jsxs('div', {
                children: [
                  'Logged in as ',
                  _jsxs('span', {
                    className: 'font-medium',
                    children: ['@', handle],
                  }),
                ],
              }),
              _jsx('p', {
                className: 'text-xs text-slate-400',
                children:
                  'You can now paste supported links in the Bluesky composer to post with rich cards.',
              }),
            ],
          })
        : _jsxs('div', {
            className: 'space-y-2 mb-4',
            children: [
              _jsxs('label', {
                className: 'block',
                children: [
                  _jsx('span', {
                    className: 'text-xs text-slate-300',
                    children: 'Bluesky handle',
                  }),
                  _jsx('input', {
                    id: 'handle-input',
                    'aria-label': 'Bluesky handle',
                    className:
                      'mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500',
                    value: identifier,
                    onChange: (e) => setIdentifier(e.target.value),
                    placeholder: 'you.bsky.social',
                  }),
                ],
              }),
              _jsxs('label', {
                className: 'block',
                children: [
                  _jsx('span', {
                    className: 'text-xs text-slate-300',
                    children: 'App password',
                  }),
                  _jsx('input', {
                    id: 'password-input',
                    'aria-label': 'App password',
                    type: 'password',
                    className:
                      'mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500',
                    value: appPassword,
                    onChange: (e) => setAppPassword(e.target.value),
                    placeholder: 'xxxx-xxxx-xxxx-xxxx',
                  }),
                ],
              }),
              _jsx('button', {
                'aria-label': 'Sign in to Bluesky',
                type: 'button',
                className:
                  'mt-2 w-full rounded bg-sky-600 py-1 text-xs font-medium hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500',
                onClick: onLogin,
                disabled: loginMutation.isPending,
                children: loginMutation.isPending
                  ? 'Signing in…'
                  : 'Sign in to Bluesky',
              }),
            ],
          }),
      _jsxs('div', {
        className: 'border-t border-slate-800 pt-2 mt-2',
        children: [
          _jsx('h2', {
            className: 'text-sm font-medium mb-2',
            children: 'Allowed Domains',
          }),
          _jsx('div', {
            role: 'list',
            'aria-label': 'Allowed domains',
            className: 'space-y-1 mb-2',
            children: domains.map((domain) =>
              _jsxs(
                'div',
                {
                  role: 'listitem',
                  className: 'flex justify-between items-center',
                  children: [
                    _jsx('span', { className: 'text-xs', children: domain }),
                    _jsx('button', {
                      'aria-label': `Remove domain ${domain}`,
                      type: 'button',
                      className:
                        'text-xs text-red-400 hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500',
                      onClick: () => removeDomain(domain),
                      children: 'Remove',
                    }),
                  ],
                },
                domain
              )
            ),
          }),
          _jsxs('div', {
            className: 'flex gap-1',
            children: [
              _jsx('input', {
                'aria-label': 'Add domain',
                id: 'domain-input',
                className:
                  'flex-1 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500',
                value: newDomain,
                onChange: (e) => setNewDomain(e.target.value),
                placeholder: 'example.com',
              }),
              _jsx('button', {
                'aria-label': 'Add domain',
                type: 'button',
                className:
                  'rounded bg-sky-600 px-2 py-1 text-xs font-medium hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500',
                onClick: addDomain,
                children: 'Add',
              }),
            ],
          }),
        ],
      }),
      _jsx('div', {
        className: 'border-t border-slate-800 pt-2 mt-2',
        children: _jsx('a', {
          href: 'https://bsky.app',
          target: '_blank',
          rel: 'noreferrer',
          className: 'text-xs text-sky-400 hover:underline',
          children: 'Open Bluesky',
        }),
      }),
    ],
  });
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
  root.render(_jsx(TRPCProvider, { children: _jsx(Popup, {}) }));
};
/**
 * Initialize popup UI on script load
 */
mountPopup();
