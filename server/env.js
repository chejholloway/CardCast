import { z } from "zod";
const envSchema = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    NEXT_PUBLIC_BACKEND_URL: z
        .string()
        .url()
        .optional(),
    BLUESKY_SERVICE_URL: z
        .string()
        .url()
        .default("https://bsky.social"),
    EXTENSION_SHARED_SECRET: z.string().min(16),
    ALLOWED_ORIGIN: z.string().optional()
});
export const getEnv = () => {
    if (global.__bsext_env) {
        return global.__bsext_env;
    }
    const parsed = envSchema.safeParse({
        NODE_ENV: process.env.NODE_ENV,
        NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
        BLUESKY_SERVICE_URL: process.env.BLUESKY_SERVICE_URL,
        EXTENSION_SHARED_SECRET: process.env.EXTENSION_SHARED_SECRET,
        ALLOWED_ORIGIN: process.env.ALLOWED_ORIGIN
    });
    if (!parsed.success) {
        // eslint-disable-next-line no-console
        console.error(JSON.stringify({
            level: "error",
            msg: "Invalid environment variables",
            issues: parsed.error.issues
        }, null, 2));
        throw new Error("Invalid environment variables");
    }
    global.__bsext_env = parsed.data;
    return parsed.data;
};
