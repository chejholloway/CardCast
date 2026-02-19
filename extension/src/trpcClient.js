import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
// This will be replaced at build-time or configured via extension options.
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "https://your-backend-url.vercel.app";
// Shared secret must match EXTENSION_SHARED_SECRET on the backend.
const EXTENSION_SHARED_SECRET = process.env.EXTENSION_SHARED_SECRET ?? "REPLACE_WITH_REAL_SECRET";
export const trpc = createTRPCProxyClient({
    links: [
        httpBatchLink({
            url: `${BACKEND_URL}/api/trpc`,
            headers() {
                return {
                    "x-extension-secret": EXTENSION_SHARED_SECRET
                };
            }
        })
    ]
});
