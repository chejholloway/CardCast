import { postRouter } from "./post";
import { TRPCError } from "@trpc/server";

describe("postRouter.create", () => {
  it("should throw if missing session", async () => {
    await expect(
      postRouter.create({
        input: { text: "hi", url: "https://thehill.com", title: "t", description: "d", imageUrl: "", accessJwt: "", did: "" },
        ctx: { req: { ip: "1.2.3.4", headers: new Map() }, res: undefined }
      })
    ).rejects.toThrow(TRPCError);
  });
});
