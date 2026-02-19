import { ogRouter } from "./og";
import { TRPCError } from "@trpc/server";

describe("ogRouter.fetch", () => {
  it("should throw NOT_FOUND for blocked domain", async () => {
    await expect(
      ogRouter.fetch({
        input: { url: "https://notallowed.com" },
        ctx: { req: { ip: "1.2.3.4", headers: new Map() }, res: undefined }
      })
    ).rejects.toThrow(TRPCError);
  });
});
