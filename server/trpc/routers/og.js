import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as cheerio from "cheerio";
import { protectedProcedure, router } from "../base";
import { log } from "../../log";
const ogInputSchema = z.object({
    url: z.string().url()
});
const ogOutputSchema = z.object({
    title: z.string(),
    description: z.string(),
    imageUrl: z.string().url()
});
const ALLOWED_DOMAINS = ["thehill.com", "theroot.com", "usanews.com"];
const realisticHeaders = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9"
};
// Simple in-memory rate limiter (resets on cold start)
const rateLimitMap = new Map();
const RATE_LIMIT = 10; // requests
const RATE_WINDOW = 60 * 1000; // 1 minute
const checkRateLimit = (ip) => {
    const now = Date.now();
    const timestamps = rateLimitMap.get(ip) || [];
    const recent = timestamps.filter(ts => now - ts < RATE_WINDOW);
    if (recent.length >= RATE_LIMIT) {
        return false;
    }
    recent.push(now);
    rateLimitMap.set(ip, recent);
    return true;
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
export const ogRouter = router({
    fetch: protectedProcedure
        .input(ogInputSchema)
        .output(ogOutputSchema)
        .query(async ({ input, ctx }) => {
        const ip = ctx.req.ip ?? "unknown";
        if (!checkRateLimit(ip)) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Rate limit exceeded"
            });
        }
        const urlObj = new URL(input.url);
        if (!ALLOWED_DOMAINS.includes(urlObj.hostname)) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Domain not allowed"
            });
        }
        let res;
        try {
            res = await withTimeout(fetch(input.url, {
                headers: realisticHeaders
            }), 5000);
        }
        catch (error) {
            log.error("OG fetch failed", {
                error: error instanceof Error ? error.stack || error.message : JSON.stringify(error),
                url: input.url
            });
            if (error instanceof TRPCError) {
                throw error;
            }
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: error instanceof Error ? error.message : "Failed to fetch URL"
            });
        }
        if (res.status === 403) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "blocked"
            });
        }
        if (!res.ok) {
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: `Upstream error: ${res.status}`
            });
        }
        const html = await res.text();
        if (!html.trim()) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "empty"
            });
        }
        const $ = cheerio.load(html);
        const title = $('meta[property="og:title"]').attr("content")?.trim();
        const description = $('meta[property="og:description"]')
            .attr("content")
            ?.trim();
        const imageUrl = $('meta[property="og:image"]').attr("content")?.trim();
        if (!title || !description || !imageUrl) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "missing_tags"
            });
        }
        return {
            title,
            description,
            imageUrl
        };
    })
});
