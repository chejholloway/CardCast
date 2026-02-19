import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../base";
import { log } from "../../log";
import { getEnv } from "../../env";
import { Agent } from "@atproto/api";
const postInputSchema = z.object({
    text: z.string().min(1).max(3000),
    url: z.string().url(),
    title: z.string().min(1).max(300),
    description: z.string().min(1).max(1000),
    imageUrl: z.string().url(),
    accessJwt: z.string().min(10),
    did: z.string().min(1)
});
const postOutputSchema = z.object({
    success: z.literal(true),
    uri: z.string(),
    thumbUploaded: z.boolean()
});
const realisticHeaders = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
};
const withTimeout = async (promise, ms) => {
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
            reject(new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Request timed out"
            }));
        }, ms);
    });
    try {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error timeoutId is definitely assigned before use
        const result = await Promise.race([promise, timeoutPromise]);
        clearTimeout(timeoutId);
        return result;
    }
    catch (err) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error timeoutId is definitely assigned before use
        clearTimeout(timeoutId);
        throw err;
    }
};
export const postRouter = router({
    create: protectedProcedure
        .input(postInputSchema)
        .output(postOutputSchema)
        .mutation(async ({ input }) => {
        const env = getEnv();
        const agent = new Agent(env.BLUESKY_SERVICE_URL);
        // Hydrate agent with existing session rather than logging in with password.
        agent.session = {
            accessJwt: input.accessJwt,
            did: input.did
        };
        let blobRef;
        let thumbUploaded = false;
        try {
            const imgRes = await withTimeout(fetch(input.imageUrl, { headers: realisticHeaders }), 10_000);
            if (!imgRes.ok) {
                throw new Error(`Image fetch failed with status ${imgRes.status}`);
            }
            const buffer = Buffer.from(await imgRes.arrayBuffer());
            const uploadRes = await withTimeout(agent.uploadBlob(buffer, {
                encoding: "image/jpeg"
            }), 10_000);
            // Shape: { data: { blob: { ref: {...}, mimeType, size } } }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            blobRef = uploadRes.data.blob;
            thumbUploaded = true;
        }
        catch (error) {
            thumbUploaded = false;
            log.warn("Thumbnail upload failed, falling back to no-thumb post", {
                error: error instanceof Error ? error.stack || error.message : JSON.stringify(error),
                imageUrl: input.imageUrl
            });
        }
        try {
            const record = {
                $type: "app.bsky.feed.post",
                text: input.text,
                createdAt: new Date().toISOString(),
                embed: {
                    $type: "app.bsky.embed.external",
                    external: {
                        uri: input.url,
                        title: input.title,
                        description: input.description,
                        ...(thumbUploaded && blobRef ? { thumb: blobRef } : {})
                    }
                }
            };
            const res = await withTimeout(agent.api.com.atproto.repo.createRecord({
                repo: input.did,
                collection: "app.bsky.feed.post",
                record
            }), 10_000);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const uri = res.uri;
            if (!uri) {
                throw new Error("Missing URI from createRecord response");
            }
            return {
                success: true,
                uri,
                thumbUploaded
            };
        }
        catch (error) {
            log.error("Failed to create Bluesky post", {
                error: error instanceof Error ? error.stack || error.message : JSON.stringify(error)
            });
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: error instanceof Error ? error.message : "Failed to create post"
            });
        }
    })
});
