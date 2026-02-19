import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

const SUPPORTED_DOMAINS = ["thehill.com", "theroot.com", "usanews.com"];

const isSupportedUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return SUPPORTED_DOMAINS.includes(url.hostname);
  } catch {
    return false;
  }
};

interface CardState {
  status: "idle" | "loading" | "error" | "success";
  error?: string;
  data?: {
    title: string;
    description: string;
    imageUrl: string;
  };
}

const LinkCardComposer: React.FC<{ url: string }> = ({ url }) => {
  const [state, setState] = useState<CardState>({ status: "idle" });

  const fetchMetadata = () => {
    setState({ status: "loading" });
    chrome.runtime.sendMessage(
      { type: "FETCH_OG", url },
      (response: { ok: boolean; data?: CardState["data"]; error?: string }) => {
        if (!response?.ok || !response.data) {
          setState({
            status: "error",
            error: response?.error ?? "Failed to fetch metadata"
          });
          return;
        }

        setState({ status: "success", data: response.data });
      }
    );
  };

  const postWithCard = () => {
    const textArea = document.querySelector<HTMLTextAreaElement>(
      'textarea[placeholder*="What\'s up?"]'
    );
    const text = textArea?.value ?? url;

    if (!state.data) return;

    chrome.runtime.sendMessage(
      {
        type: "CREATE_POST",
        payload: {
          text,
          url,
          title: state.data.title,
          description: state.data.description,
          imageUrl: state.data.imageUrl
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

  return (
    <div className="bsext-card mt-2 rounded-xl border border-slate-700 bg-slate-900/80 p-3 text-sm text-slate-100">
      <div className="flex justify-between items-center mb-2">
        <span className="font-medium text-slate-50">Link card preview</span>
        <button
          type="button"
          className="px-2 py-1 text-xs rounded bg-sky-600 hover:bg-sky-500"
          onClick={fetchMetadata}
        >
          Fetch Link Card
        </button>
      </div>

      {state.status === "loading" && (
        <div className="text-xs text-slate-300">Fetching metadata…</div>
      )}

      {state.status === "error" && (
        <div className="text-xs text-red-400">
          Failed to fetch card: {state.error}
        </div>
      )}

      {state.status === "success" && state.data && (
        <div className="flex gap-3">
          <div className="flex-1">
            <div className="text-sm font-semibold line-clamp-2">
              {state.data.title}
            </div>
            <div className="mt-1 text-xs text-slate-300 line-clamp-3">
              {state.data.description}
            </div>
            <div className="mt-2">
              <button
                type="button"
                className="px-3 py-1 text-xs rounded bg-sky-600 hover:bg-sky-500"
                onClick={postWithCard}
              >
                Post with Card
              </button>
            </div>
          </div>
          <div className="w-20 h-20 flex-shrink-0 overflow-hidden rounded-md bg-slate-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={state.data.imageUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      )}
    </div>
  );
};

const mountComposer = (composeEl: HTMLElement, url: string) => {
  if (composeEl.querySelector(".bsext-root")) return;

  const container = document.createElement("div");
  container.className = "bsext-root";
  composeEl.appendChild(container);

  const root = createRoot(container);
  root.render(<LinkCardComposer url={url} />);
};

const detectAndMount = () => {
  const compose = document.querySelector<HTMLElement>('div[role="textbox"]');
  if (!compose) return;

  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      if (mutation.type === "childList") {
        const textContent = compose.textContent ?? "";
        const maybeUrl = textContent.match(/https?:\/\/\S+/)?.[0];
        if (maybeUrl && isSupportedUrl(maybeUrl)) {
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

