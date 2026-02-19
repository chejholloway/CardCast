import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

interface SessionState {
  loading: boolean;
  loggedIn: boolean;
  handle?: string;
  error?: string;
}

const Popup: React.FC = () => {
  const [identifier, setIdentifier] = useState("");
  const [appPassword, setAppPassword] = useState("");
  const [session, setSession] = useState<SessionState>({
    loading: true,
    loggedIn: false
  });

  useEffect(() => {
    chrome.runtime.sendMessage(
      { type: "AUTH_STATUS" },
      (response: { ok: boolean; data?: { loggedIn: boolean; session?: { handle?: string } }; error?: string }) => {
        if (!response?.ok || !response.data) {
          setSession({
            loading: false,
            loggedIn: false,
            error: response?.error ?? "Failed to load session"
          });
          return;
        }

        setSession({
          loading: false,
          loggedIn: response.data.loggedIn,
          handle: response.data.session?.handle
        });
      }
    );
  }, []);

  const onLogin = () => {
    setSession(prev => ({ ...prev, loading: true, error: undefined }));
    chrome.runtime.sendMessage(
      {
        type: "AUTH_LOGIN",
        identifier,
        appPassword
      },
      (response: { ok: boolean; data?: { handle: string }; error?: string }) => {
        if (!response?.ok || !response.data) {
          setSession({
            loading: false,
            loggedIn: false,
            error: response?.error ?? "Login failed"
          });
          return;
        }

        setSession({
          loading: false,
          loggedIn: true,
          handle: response.data.handle
        });
      }
    );
  };

  return (
    <div className="w-80 p-4 bg-slate-950 text-slate-100 text-sm">
      <h1 className="text-base font-semibold mb-2">Bluesky Link Card</h1>
      {session.loading && (
        <div className="text-xs text-slate-300 mb-2">Checking session…</div>
      )}
      {session.error && (
        <div className="text-xs text-red-400 mb-2">{session.error}</div>
      )}
      {session.loggedIn ? (
        <div className="space-y-1 mb-4">
          <div>
            Logged in as <span className="font-medium">@{session.handle}</span>
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
            disabled={session.loading}
          >
            {session.loading ? "Signing in…" : "Sign in to Bluesky"}
          </button>
        </div>
      )}

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
  root.render(<Popup />);
};

mountPopup();

