import { initTRPC, TRPCError } from "@trpc/server";
import type { TRPCContext } from "./trpcContext";
import { getEnv } from "../env";

const t = initTRPC.context<TRPCContext>().create();

const authMiddleware = t.middleware(({ ctx, next }) => {
  const env = getEnv();
  const secret = ctx.req.headers.get("x-extension-secret");

  if (secret !== env.EXTENSION_SHARED_SECRET) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid extension secret"
    });
  }

  return next();
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(authMiddleware);

