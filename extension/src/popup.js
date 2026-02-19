import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc, trpcClient } from "./trpcClient";
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 2,
            retryDelay: attempt => Math.min(1000 * 2 ** attempt, 10_000)
        }
    }
});
const TRPCProvider = ({ children }) => (_jsx(trpc.Provider, { client: trpcClient, queryClient: queryClient, children: _jsx(QueryClientProvider, { client: queryClient, children: children }) }));
const Popup = () => {
    const [identifier, setIdentifier] = useState("");
    const [appPassword, setAppPassword] = useState("");
    const [domains, setDomains] = useState([]);
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
    const removeDomain = (domain) => {
        const updated = domains.filter(d => d !== domain);
        setDomains(updated);
        chrome.storage.session.set({ allowedDomains: updated });
    };
    const loggedIn = authStatus?.loggedIn ?? false;
    const handle = authStatus?.session?.handle;
    return (_jsxs("div", { className: "w-80 p-4 bg-slate-950 text-slate-100 text-sm", children: [_jsx("h1", { className: "text-base font-semibold mb-2", children: "Bluesky Link Card" }), loginMutation.isPending && (_jsx("div", { className: "text-xs text-slate-300 mb-2", children: "Signing in\u2026" })), loginMutation.error && (_jsx("div", { className: "text-xs text-red-400 mb-2", children: loginMutation.error.message })), loggedIn ? (_jsxs("div", { className: "space-y-1 mb-4", children: [_jsxs("div", { children: ["Logged in as ", _jsxs("span", { className: "font-medium", children: ["@", handle] })] }), _jsx("p", { className: "text-xs text-slate-400", children: "You can now paste supported links in the Bluesky composer to post with rich cards." })] })) : (_jsxs("div", { className: "space-y-2 mb-4", children: [_jsxs("label", { className: "block", children: [_jsx("span", { className: "text-xs text-slate-300", children: "Bluesky handle" }), _jsx("input", { className: "mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs", value: identifier, onChange: e => setIdentifier(e.target.value), placeholder: "you.bsky.social" })] }), _jsxs("label", { className: "block", children: [_jsx("span", { className: "text-xs text-slate-300", children: "App password" }), _jsx("input", { type: "password", className: "mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs", value: appPassword, onChange: e => setAppPassword(e.target.value), placeholder: "xxxx-xxxx-xxxx-xxxx" })] }), _jsx("button", { type: "button", className: "mt-2 w-full rounded bg-sky-600 py-1 text-xs font-medium hover:bg-sky-500", onClick: onLogin, disabled: loginMutation.isPending, children: loginMutation.isPending ? "Signing in…" : "Sign in to Bluesky" })] })), _jsxs("div", { className: "border-t border-slate-800 pt-2 mt-2", children: [_jsx("h2", { className: "text-sm font-medium mb-2", children: "Allowed Domains" }), _jsx("div", { className: "space-y-1 mb-2", children: domains.map(domain => (_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-xs", children: domain }), _jsx("button", { type: "button", className: "text-xs text-red-400 hover:text-red-300", onClick: () => removeDomain(domain), children: "Remove" })] }, domain))) }), _jsxs("div", { className: "flex gap-1", children: [_jsx("input", { className: "flex-1 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs", value: newDomain, onChange: e => setNewDomain(e.target.value), placeholder: "example.com" }), _jsx("button", { type: "button", className: "rounded bg-sky-600 px-2 py-1 text-xs font-medium hover:bg-sky-500", onClick: addDomain, children: "Add" })] })] }), _jsx("div", { className: "border-t border-slate-800 pt-2 mt-2", children: _jsx("a", { href: "https://bsky.app", target: "_blank", rel: "noreferrer", className: "text-xs text-sky-400 hover:underline", children: "Open Bluesky" }) })] }));
};
const mountPopup = () => {
    const container = document.getElementById("root");
    if (!container)
        return;
    const root = createRoot(container);
    root.render(_jsx(TRPCProvider, { children: _jsx(Popup, {}) }));
};
mountPopup();
