import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc, trpcClient } from './trpcClient';
import { motion } from 'framer-motion';
import { useTheme } from './useTheme';
import { useAllowedDomains } from './useAllowedDomains';
import { LinkCardPreview } from './LinkCardPreview';
import { LinkCardActions } from './LinkCardActions';
import { LinkCardStatus } from './LinkCardStatus';

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

export const LinkCardComposer: React.FC<{ url: string }> = ({ url }) => {
  const isDark = useTheme();
  const { data, error, isLoading, refetch } = trpc.og.fetch.useQuery(
    { url },
    { enabled: false }
  );
  const createPostMutation = trpc.post.create.useMutation();

  const fetchMetadata = () => {
    refetch();
  };

  const postWithCard = () => {
    const textArea = document.querySelector<HTMLTextAreaElement>(
      'textarea[placeholder*="What\'s up?"]'
    );
    const text = textArea?.value ?? url;

    if (!data) return;

    chrome.runtime.sendMessage(
      {
        type: 'CREATE_POST',
        payload: {
          text,
          url,
          title: data.title,
          description: data.description,
          imageUrl: data.imageUrl,
        },
      },
      (response: { ok: boolean; error?: string }) => {
        if (!response?.ok) {
          console.error('Failed to create post', response?.error);
        }
      }
    );
  };

  const status = isLoading
    ? 'loading'
    : error
      ? 'error'
      : data
        ? 'success'
        : 'idle';

  const cardClasses = isDark
    ? 'bsext-card mt-2 rounded-xl border border-slate-700 bg-slate-900/80 p-3 text-sm text-slate-100'
    : 'bsext-card mt-2 rounded-xl border border-gray-300 bg-white/80 p-3 text-sm text-gray-900';

  return (
    <motion.div
      role="region"
      aria-label={`Link card preview for ${url}`}
      className={cardClasses}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <LinkCardActions
        isDark={isDark}
        fetchMetadata={fetchMetadata}
        postWithCard={postWithCard}
        isCreatingPost={createPostMutation.isPending}
        showPostButton={status === 'success'}
      />
      <LinkCardStatus
        status={status}
        isDark={isDark}
        errorMessage={error?.message}
      />
      {status === 'success' && data && (
        <LinkCardPreview data={data} isDark={isDark} url={url} />
      )}
    </motion.div>
  );
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

if (window.location.hostname === 'bsky.app') {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  root.render(<App />);
}
