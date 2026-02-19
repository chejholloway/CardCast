import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc } from "./trpcClient";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: attempt => Math.min(1000 * 2 ** attempt, 10_000)
    }
  }
});

const TRPCProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);

interface SessionState {
  loading: boolean;
  loggedIn: boolean;
  handle?: string;
  error?: string;
}

const Popup: React.FC = () => {
  const [identifier, setIdentifier] = useState("");
  const [appPassword, setAppPassword] = useState("");
  const [domains, setDomains] = useState<string[]>([]);
  const [newDomain, setNewDomain] = useState("");

  const { data: authStatus, refetch: refetchAuth } = trpc.auth.status.useQuery();
  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => refetchAuth()
  });

  useEffect(() => {
    // Load domains
    chrome.storage.session.get(["allowedDomains"], (result) => {
      setDomains(result.allowedDomains ?? ["thehill.com", "theroot.com", "usanews.com"]);
    });
  }, []);

  const onLogin = () => {
    loginMutation.mutate({ identifier, appPassword });
  };

  const addDomain = () => {
    if (newDomain && !domains.includes(newDomain)) {
      const updated = [...domains, newDomain];
      setDomains(updated);
      chrome.storage.session.set({ allowedDomains: updated });
      setNewDomain("");
    }
  };

  const removeDomain = (domain: string) => {
    const updated = domains.filter(d => d !== domain);
    setDomains(updated);
    chrome.storage.session.set({ allowedDomains: updated });
  };

  const loggedIn = authStatus?.loggedIn ?? false;
  const handle = authStatus?.session?.handle;

  return (
    <div className="w-80 p-4 bg-slate-950 text-slate-100 text-sm">
      <h1 className="text-base font-semibold mb-2">Bluesky Link Card</h1>
      {loginMutation.isPending && (
        <div className="text-xs text-slate-300 mb-2">Signing in…</div>
      )}
      {loginMutation.error && (
        <div className="text-xs text-red-400 mb-2">{loginMutation.error.message}</div>
      )}
      {loggedIn ? (
        <div className="space-y-1 mb-4">
          <div>
            Logged in as <span className="font-medium">@{handle}</span>
          </div>
          <p className="text-xs text-slate-400">
            You can now paste supported links in the Bluesky composer to post
            with rich cards.
          </p>
        </div>
      ) : (
        <div className="space-y-2 mb-4">
          <label className="block">
            <span className="text-xs text-slate-300">Bluesky handle</span>
            <input
              className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              placeholder="you.bsky.social"
            />
          </label>
          <label className="block">
            <span className="text-xs text-slate-300">App password</span>
            <input
              type="password"
              className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs"
              value={appPassword}
              onChange={e => setAppPassword(e.target.value)}
              placeholder="xxxx-xxxx-xxxx-xxxx"
            />
          </label>
          <button
            type="button"
            className="mt-2 w-full rounded bg-sky-600 py-1 text-xs font-medium hover:bg-sky-500"
            onClick={onLogin}
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? "Signing in…" : "Sign in to Bluesky"}
          </button>
        </div>
      )}

      <div className="border-t border-slate-800 pt-2 mt-2">
        <h2 className="text-sm font-medium mb-2">Allowed Domains</h2>
        <div className="space-y-1 mb-2">
          {domains.map(domain => (
            <div key={domain} className="flex justify-between items-center">
              <span className="text-xs">{domain}</span>
              <button
                type="button"
                className="text-xs text-red-400 hover:text-red-300"
                onClick={() => removeDomain(domain)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-1">
          <input
            className="flex-1 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs"
            value={newDomain}
            onChange={e => setNewDomain(e.target.value)}
            placeholder="example.com"
          />
          <button
            type="button"
            className="rounded bg-sky-600 px-2 py-1 text-xs font-medium hover:bg-sky-500"
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
    </div>
  );
};

const mountPopup = () => {
  const container = document.getElementById("root");
  if (!container) return;
  const root = createRoot(container);
  root.render(
    <TRPCProvider>
      <Popup />
    </TRPCProvider>
  );
};

mountPopup();

