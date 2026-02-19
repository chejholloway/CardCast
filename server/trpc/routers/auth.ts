import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { Agent } from "@atproto/api";
import { protectedProcedure, router } from "../base";
import { getEnv } from "../../env";
import { log } from "../../log";

const loginInputSchema = z.object({
  identifier: z.string().min(1),
  appPassword: z.string().min(1)
});

const sessionSchema = z.object({
  did: z.string(),
  accessJwt: z.string(),
  handle: z.string()
});

const statusOutputSchema = z.object({
  loggedIn: z.boolean(),
  session: sessionSchema.nullable()
});

export const authRouter = router({
  login: protectedProcedure
    .input(loginInputSchema)
    .output(sessionSchema)
    .mutation(async ({ input }) => {
      const env = getEnv();
      const agent = new Agent(env.BLUESKY_SERVICE_URL);
      try {
        await agent.login({
          identifier: input.identifier,
          password: input.appPassword
        });
      } catch (error) {
        log.warn("Bluesky login failed", {
          identifier: input.identifier,
          error: error instanceof Error ? error.message : "Unknown error"
        });
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid Bluesky credentials"
        });
      }

      if (!agent.session) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Session not established"
        });
      }

      const { did, accessJwt, handle } = agent.session;

      return {
        did,
        accessJwt,
        handle
      };
    }),
  status: protectedProcedure.output(statusOutputSchema).query(() => {
    // Stateless backend: the extension is responsible for storing session.
    // This endpoint exists so the popup can show a consistent shape.
    return {
      loggedIn: false,
      session: null
    };
  })
});

export type AuthLoginInput = z.infer<typeof loginInputSchema>;
export type AuthSession = z.infer<typeof sessionSchema>;

