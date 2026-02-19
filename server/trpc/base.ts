import { initTRPC, TRPCError } from "@trpc/server";
import type { TRPCContext } from "./trpcContext";
import { getEnv } from "../env";

const t = initTRPC.context<TRPCContext>().create();


const authMiddleware = t.middleware(async ({ ctx, next }) => {
  const env = getEnv();
  const secret = ctx.req.headers.get("x-extension-secret");

  if (secret !== env.EXTENSION_SHARED_SECRET) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid extension secret"
    });
  }

  // Check Origin if ALLOWED_ORIGIN is set
  if (env.ALLOWED_ORIGIN) {
    const origin = ctx.req.headers.get("origin");
    if (origin !== env.ALLOWED_ORIGIN) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid origin"
      });
    }
    // Note: CORS headers must be set at the API route level (e.g., in Next.js route handler), not here.
  }

  return next();
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(authMiddleware);

