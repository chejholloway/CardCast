import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc, trpcClient } from "./trpcClient";
import { motion } from "framer-motion";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: attempt => Math.min(1000 * 2 ** attempt, 10_000)
    }
  }
});

// (trpcClient is re-exported with trpc for provider usage)

const TRPCProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      {children}
    </trpc.Provider>
  </QueryClientProvider>
);

const isSupportedUrl = (value: string, domains: string[]): boolean => {
  try {
    const url = new URL(value);
    return domains.includes(url.hostname);
  } catch {
    return false;
  }
};


const LinkCardComposer: React.FC<{ url: string }> = ({ url }) => {
  const [isDark, setIsDark] = useState(true); // Default to dark
  const { data, error, isLoading, refetch } = trpc.og.fetch.useQuery({ url }, { enabled: false });
  const createPostMutation = trpc.post.create.useMutation();

  useEffect(() => {
    // Detect Bluesky theme
    const checkTheme = () => {
      const body = document.body;
      const theme = body.getAttribute('data-theme') || (body.classList.contains('dark') ? 'dark' : 'light');
      setIsDark(theme === 'dark');
    };
    checkTheme();

    // Watch for theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.body, { attributes: true, attributeFilter: ['data-theme', 'class'] });

    return () => observer.disconnect();
  }, []);

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
        type: "CREATE_POST",
        payload: {
          text,
          url,
          title: data.title,
          description: data.description,
          imageUrl: data.imageUrl
        }
      },
      (response: { ok: boolean; error?: string }) => {
        if (!response?.ok) {
          // eslint-disable-next-line no-console
          console.error("Failed to create post", response?.error);
        }
      }
    );
  };

  const status = isLoading ? "loading" : error ? "error" : data ? "success" : "idle";
  const statusMessage = status === "loading" ? "Fetching metadata…" : status === "error" ? `Failed to fetch card: ${error?.message ?? "Unknown error"}` : status === "success" && data ? "Card fetched" : "";

  const cardClasses = isDark
    ? "bsext-card mt-2 rounded-xl border border-slate-700 bg-slate-900/80 p-3 text-sm text-slate-100"
    : "bsext-card mt-2 rounded-xl border border-gray-300 bg-white/80 p-3 text-sm text-gray-900";

  return (
    <motion.div
      role="region"
      aria-label={`Link card preview for ${url}`}
      className={cardClasses}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div aria-live="polite" className="sr-only">{statusMessage}</div>
      <div className="flex justify-between items-center mb-2">
        <span className={`font-medium ${isDark ? 'text-slate-50' : 'text-gray-900'}`}>Link card preview</span>
        <motion.button
          aria-label="Fetch link metadata"
          type="button"
          className={`px-2 py-1 text-xs rounded ${isDark ? 'bg-sky-600 hover:bg-sky-500' : 'bg-blue-600 hover:bg-blue-500'}`}
          onClick={fetchMetadata}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Fetch Link Card
        </motion.button>
      </div>

      {status === "loading" && (
        <motion.div
          className={`text-xs ${isDark ? 'text-slate-300' : 'text-gray-600'}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Fetching metadata…
        </motion.div>
      )}

      {status === "error" && (
        <motion.div
          className="text-xs text-red-400"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          Failed to fetch card: {error?.message ?? "Unknown error"}
        </motion.div>
      )}

      {status === "success" && data && (
        <motion.div
          className="flex gap-3"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex-1">
            <div className="text-sm font-semibold line-clamp-2">
              {data.title}
            </div>
            <div className={`mt-1 text-xs line-clamp-3 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
              {data.description}
            </div>
            <div className="mt-2">
              <motion.button
                type="button"
                className={`px-3 py-1 text-xs rounded ${isDark ? 'bg-sky-600 hover:bg-sky-500' : 'bg-blue-600 hover:bg-blue-500'}`}
                onClick={postWithCard}
                disabled={createPostMutation.isPending}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {createPostMutation.isPending ? "Posting…" : "Post with Card"}
              </motion.button>
            </div>
          </div>
          <motion.div
            className={`w-20 h-20 flex-shrink-0 overflow-hidden rounded-md ${isDark ? 'bg-slate-800' : 'bg-gray-200'}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.imageUrl}
              alt={`Preview image for ${data.title ?? url}`}
              className="h-full w-full object-cover"
            />
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};

const mountComposer = (composeEl: HTMLElement, url: string) => {
  if (composeEl.querySelector(".bsext-root")) return;

  const container = document.createElement("div");
  container.className = "bsext-root";
  composeEl.appendChild(container);

  const root = createRoot(container);
  root.render(
    <TRPCProvider>
      <LinkCardComposer url={url} />
    </TRPCProvider>
  );
};

const detectAndMount = async () => {
  const compose = document.querySelector<HTMLElement>('div[role="textbox"]');
  if (!compose) return;

  // Get allowed domains from storage
  const storage = await chrome.storage.session.get(["allowedDomains"]);
  const domains = storage.allowedDomains as string[] ?? ["thehill.com", "theroot.com", "usanews.com"];

  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      if (mutation.type === "childList") {
        const textContent = compose.textContent ?? "";
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
    characterData: true
  });
};

if (window.location.hostname === "bsky.app") {
  window.addEventListener("load", () => {
    detectAndMount();
  });
}

