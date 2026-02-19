import { describe, it, expect, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";
import * as atproto from "@atproto/api";
import { createTestCaller } from "../tests/testHelpers";

// Mock @atproto/api
vi.mock("@atproto/api", () => ({
  Agent: vi.fn()
}));

// Mock global fetch
global.fetch = vi.fn();

describe("postRouter.create", () => {
  const mockInput = {
    text: "Check out this article",
    url: "https://thehill.com/article",
    title: "Test Article",
    description: "This is a test article",
    imageUrl: "https://example.com/image.jpg",
    accessJwt: "test-jwt-token-1234567890",
    did: "did:plc:test123"
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a post with image upload", async () => {
    const MockAgent = vi.mocked(atproto.Agent);
    const mockUploadRes = {
      data: {
        blob: {
          ref: { $link: "bafy123" },
          mimeType: "image/jpeg",
          size: 12345
        }
      }
    };

    const mockCreateRes = {
      uri: "at://did:plc:test/app.bsky.feed.post/test123"
    };

    MockAgent.mockImplementation(() => ({
      session: null,
      uploadBlob: vi.fn().mockResolvedValue(mockUploadRes),
      api: {
        com: {
          atproto: {
            repo: {
              createRecord: vi.fn().mockResolvedValue(mockCreateRes)
            }
          }
        }
      }
    } as any));

    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(Buffer.from("image data"), { status: 200 })
    );

    const caller = createTestCaller({ secret: process.env.EXTENSION_SHARED_SECRET });
    const result = await caller.post.create(mockInput);

    expect(result).toEqual({
      success: true,
      uri: "at://did:plc:test/app.bsky.feed.post/test123",
      thumbUploaded: true
    });
  });

  it("should create a post without image if upload fails", async () => {
    const MockAgent = vi.mocked(atproto.Agent);

    const mockCreateRes = {
      uri: "at://did:plc:test/app.bsky.feed.post/test456"
    };

    MockAgent.mockImplementation(() => ({
      session: null,
      uploadBlob: vi.fn().mockRejectedValue(new Error("Upload failed")),
      api: {
        com: {
          atproto: {
            repo: {
              createRecord: vi.fn().mockResolvedValue(mockCreateRes)
            }
          }
        }
      }
    } as any));

    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(Buffer.from("image data"), { status: 200 })
    );

    const caller = createTestCaller({ secret: process.env.EXTENSION_SHARED_SECRET });
    const result = await caller.post.create(mockInput);

    expect(result).toEqual({
      success: true,
      uri: "at://did:plc:test/app.bsky.feed.post/test456",
      thumbUploaded: false
    });
  });

  it("should throw if post creation fails", async () => {
    const MockAgent = vi.mocked(atproto.Agent);

    MockAgent.mockImplementation(() => ({
      session: null,
      uploadBlob: vi.fn().mockResolvedValue({
        data: { blob: { ref: { $link: "bafy" } } }
      }),
      api: {
        com: {
          atproto: {
            repo: {
              createRecord: vi.fn().mockRejectedValue(new Error("Post creation failed"))
            }
          }
        }
      }
    } as any));

    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(Buffer.from("image data"), { status: 200 })
    );

    const caller = createTestCaller({ secret: process.env.EXTENSION_SHARED_SECRET });
    await expect(caller.post.create(mockInput)).rejects.toThrow();
  });

  it("should throw UNAUTHORIZED without valid secret", async () => {
    const caller = createTestCaller({ secret: "invalid-secret" });
    await expect(caller.post.create(mockInput)).rejects.toThrow();
  });

  it("should validate input schema", async () => {
    const caller = createTestCaller({ secret: process.env.EXTENSION_SHARED_SECRET });

    // Missing required field
    await expect(
      caller.post.create({
        ...mockInput,
        text: "" // Empty text not allowed
      })
    ).rejects.toThrow();
  });

  it("should timeout on slow image fetch", async () => {
    const MockAgent = vi.mocked(atproto.Agent);
    MockAgent.mockImplementation(() => ({
      session: null,
      uploadBlob: vi.fn(),
      api: { com: { atproto: { repo: { createRecord: vi.fn() } } } }
    } as any));

    vi.mocked(global.fetch).mockImplementationOnce(
      () => new Promise(resolve => setTimeout(() => resolve(new Response("")), 15000))
    );

    const caller = createTestCaller({ secret: process.env.EXTENSION_SHARED_SECRET });
    await expect(caller.post.create(mockInput)).rejects.toThrow();
  }, { timeout: 20000 });
});
