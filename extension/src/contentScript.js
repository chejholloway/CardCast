import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc } from "./trpcClient";
import { motion } from "framer-motion";
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 2,
            retryDelay: attempt => Math.min(1000 * 2 ** attempt, 10_000)
        }
    }
});
const TRPCProvider = ({ children }) => (_jsx(QueryClientProvider, { client: queryClient, children: children }));
const isSupportedUrl = (value, domains) => {
    try {
        const url = new URL(value);
        return domains.includes(url.hostname);
    }
    catch {
        return false;
    }
};
const LinkCardComposer = ({ url }) => {
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
        const textArea = document.querySelector('textarea[placeholder*="What\'s up?"]');
        const text = textArea?.value ?? url;
        if (!data)
            return;
        chrome.runtime.sendMessage({
            type: "CREATE_POST",
            payload: {
                text,
                url,
                title: data.title,
                description: data.description,
                imageUrl: data.imageUrl
            }
        }, (response) => {
            if (!response?.ok) {
                // eslint-disable-next-line no-console
                console.error("Failed to create post", response?.error);
            }
        });
    };
    const status = isLoading ? "loading" : error ? "error" : data ? "success" : "idle";
    const cardClasses = isDark
        ? "bsext-card mt-2 rounded-xl border border-slate-700 bg-slate-900/80 p-3 text-sm text-slate-100"
        : "bsext-card mt-2 rounded-xl border border-gray-300 bg-white/80 p-3 text-sm text-gray-900";
    return (_jsxs(motion.div, { className: cardClasses, initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 }, children: [_jsxs("div", { className: "flex justify-between items-center mb-2", children: [_jsx("span", { className: `font-medium ${isDark ? 'text-slate-50' : 'text-gray-900'}`, children: "Link card preview" }), _jsx(motion.button, { type: "button", className: `px-2 py-1 text-xs rounded ${isDark ? 'bg-sky-600 hover:bg-sky-500' : 'bg-blue-600 hover:bg-blue-500'}`, onClick: fetchMetadata, whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 }, children: "Fetch Link Card" })] }), status === "loading" && (_jsx(motion.div, { className: `text-xs ${isDark ? 'text-slate-300' : 'text-gray-600'}`, initial: { opacity: 0 }, animate: { opacity: 1 }, children: "Fetching metadata\u2026" })), status === "error" && (_jsxs(motion.div, { className: "text-xs text-red-400", initial: { opacity: 0, x: -10 }, animate: { opacity: 1, x: 0 }, children: ["Failed to fetch card: ", error?.message ?? "Unknown error"] })), status === "success" && data && (_jsxs(motion.div, { className: "flex gap-3", initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 0.4 }, children: [_jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "text-sm font-semibold line-clamp-2", children: data.title }), _jsx("div", { className: `mt-1 text-xs line-clamp-3 ${isDark ? 'text-slate-300' : 'text-gray-600'}`, children: data.description }), _jsx("div", { className: "mt-2", children: _jsx(motion.button, { type: "button", className: `px-3 py-1 text-xs rounded ${isDark ? 'bg-sky-600 hover:bg-sky-500' : 'bg-blue-600 hover:bg-blue-500'}`, onClick: postWithCard, disabled: createPostMutation.isPending, whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 }, children: createPostMutation.isPending ? "Posting…" : "Post with Card" }) })] }), _jsx(motion.div, { className: `w-20 h-20 flex-shrink-0 overflow-hidden rounded-md ${isDark ? 'bg-slate-800' : 'bg-gray-200'}`, initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: 0.2 }, children: _jsx("img", { src: data.imageUrl, alt: "", className: "h-full w-full object-cover" }) })] }))] }));
};
const mountComposer = (composeEl, url) => {
    if (composeEl.querySelector(".bsext-root"))
        return;
    const container = document.createElement("div");
    container.className = "bsext-root";
    composeEl.appendChild(container);
    const root = createRoot(container);
    root.render(_jsx(TRPCProvider, { children: _jsx(LinkCardComposer, { url: url }) }));
};
const detectAndMount = async () => {
    const compose = document.querySelector('div[role="textbox"]');
    if (!compose)
        return;
    // Get allowed domains from storage
    const storage = await chrome.storage.session.get(["allowedDomains"]);
    const domains = storage.allowedDomains ?? ["thehill.com", "theroot.com", "usanews.com"];
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
