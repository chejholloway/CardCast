import { authRouter } from "./auth";
import { TRPCError } from "@trpc/server";

describe("authRouter.login", () => {
  it("should throw UNAUTHORIZED for bad credentials", async () => {
    await expect(
      authRouter.login({
        input: { identifier: "bad", appPassword: "bad" },
        ctx: { req: { ip: "1.2.3.4", headers: new Map() }, res: undefined }
      })
    ).rejects.toThrow(TRPCError);
  });
});
