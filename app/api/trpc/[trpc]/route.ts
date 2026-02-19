import { NextRequest } from "next/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "../../../../server/trpc/router";
import { createTRPCContext } from "../../../../server/trpc/trpcContext";

export const runtime = "nodejs";

const handler = (req: NextRequest) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createTRPCContext(req)
  });
};

export { handler as GET, handler as POST };

