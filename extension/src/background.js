import { QueryClient } from "@tanstack/react-query";
import { trpc } from "./trpcClient";
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 2,
            retryDelay: attempt => Math.min(1000 * 2 ** attempt, 10_000)
        },
        mutations: {
            retry: 1,
            retryDelay: 1000
        }
    }
});
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    void (async () => {
        try {
            if (message.type === "FETCH_OG") {
                const data = await queryClient.fetchQuery({
                    queryKey: ["og", message.url],
                    queryFn: () => trpc.og.fetch.query({ url: message.url })
                });
                sendResponse({ ok: true, data });
                return;
            }
            if (message.type === "CREATE_POST") {
                const session = await chrome.storage.session.get(["bskySession"]);
                const bskySession = session.bskySession;
                if (!bskySession) {
                    sendResponse({
                        ok: false,
                        error: "NOT_AUTHENTICATED"
                    });
                    return;
                }
                const data = await trpc.post.create.mutation({
                    ...message.payload,
                    accessJwt: bskySession.accessJwt,
                    did: bskySession.did
                });
                sendResponse({ ok: true, data });
                return;
            }
            if (message.type === "AUTH_LOGIN") {
                const data = await trpc.auth.login.mutation({
                    identifier: message.identifier,
                    appPassword: message.appPassword
                });
                await chrome.storage.session.set({
                    bskySession: {
                        did: data.did,
                        accessJwt: data.accessJwt,
                        handle: data.handle
                    }
                });
                sendResponse({ ok: true, data });
                return;
            }
            if (message.type === "AUTH_STATUS") {
                const session = await chrome.storage.session.get(["bskySession"]);
                const bskySession = session.bskySession ?? null;
                sendResponse({
                    ok: true,
                    data: {
                        loggedIn: Boolean(bskySession),
                        session: bskySession
                    }
                });
                return;
            }
        }
        catch (error) {
            // Log error for debugging
            // eslint-disable-next-line no-console
            console.error("Background error:", error);
            // We intentionally only send a safe error message back to the caller.
            sendResponse({
                ok: false,
                error: error instanceof Error
                    ? error.message
                    : typeof error === 'string'
                        ? error
                        : JSON.stringify(error)
            });
        }
    })();
    // Indicate that we'll respond asynchronously.
    return true;
});
