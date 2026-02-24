import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc, trpcClient } from './trpcClient';
import { useAllowedDomains } from './useAllowedDomains';
import { LinkCardComposer } from './LinkCardComposer';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
    },
  },
});

const TRPCProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  </trpc.Provider>
);

const isSupportedUrl = (value: string, domains: string[]): boolean => {
  try {
    const url = new URL(value);
    return domains.includes(url.hostname);
  } catch {
    return false;
  }
};

const mountComposer = (composeEl: HTMLElement, url: string) => {
  if (composeEl.querySelector('.bsext-root')) return;

  const container = document.createElement('div');
  container.className = 'bsext-root';
  composeEl.appendChild(container);

  const root = createRoot(container);
  root.render(
    <TRPCProvider>
      <LinkCardComposer url={url} />
    </TRPCProvider>
  );
};

const App: React.FC = () => {
  const { domains, loading } = useAllowedDomains();

  useEffect(() => {
    if (loading) return;

    const compose = document.querySelector<HTMLElement>('div[role="textbox"]');
    if (!compose) return;

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          const textContent = compose.textContent ?? '';
          const maybeUrl = textContent.match(/https?:\/\/\S+/)?.[0];
          if (maybeUrl && isSupportedUrl(maybeUrl, domains)) {
            mountComposer(compose, maybeUrl);
          }
        }
      }
    });

    observer.observe(compose, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }, [domains, loading]);

  return null;
};

const extractAndRelaySession = () => {
  try {
    const raw = localStorage.getItem('bsky-storage');
    if (!raw) return;

    const parsed = JSON.parse(raw);
    const currentAccount = parsed.accounts.find(
      (acc: any) => acc.did === parsed.currentAccount
    );

    if (currentAccount) {
      const { did, accessJwt, handle } = currentAccount;
      chrome.runtime.sendMessage({
        type: 'BSKY_SESSION',
        session: { did, accessJwt, handle },
      });
    }

    const isDark = document.documentElement.classList.contains('theme--dark');
    chrome.runtime.sendMessage({
      type: 'BSKY_THEME',
      theme: isDark ? 'dark' : 'light',
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('CardCast: Failed to extract bsky.app session', error);
  }
};

if (window.location.hostname === 'bsky.app') {
  extractAndRelaySession();

  window.addEventListener('storage', (e) => {
    if (e.key === 'bsky-storage') {
      extractAndRelaySession();
    }
  });

  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  root.render(<App />);
}
