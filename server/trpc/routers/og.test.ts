import { describe, it, expect, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";
import { createTestCaller } from "../tests/testHelpers";

// Mock global fetch
global.fetch = vi.fn();

describe("ogRouter.fetch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch OG metadata for allowed domain", async () => {
    const mockHtml = `
      <html>
        <head>
          <meta property="og:title" content="Test Article" />
          <meta property="og:description" content="This is a test article" />
          <meta property="og:image" content="https://example.com/image.jpg" />
        </head>
      </html>
    `;

    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(mockHtml, { status: 200 })
    );

    const caller = createTestCaller({ secret: process.env.EXTENSION_SHARED_SECRET });
    const result = await caller.og.fetch({
      url: "https://thehill.com/article"
    });

    expect(result).toEqual({
      title: "Test Article",
      description: "This is a test article",
      imageUrl: "https://example.com/image.jpg"
    });
  });

  it("should throw BAD_REQUEST for blocked domain", async () => {
    const caller = createTestCaller({ secret: process.env.EXTENSION_SHARED_SECRET });
    await expect(
      caller.og.fetch({
        url: "https://blocked-domain.com/article"
      })
    ).rejects.toThrow();
  });

  it("should throw NOT_FOUND when 403 status received", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response("Forbidden", { status: 403 })
    );

    const caller = createTestCaller({ secret: process.env.EXTENSION_SHARED_SECRET });
    await expect(
      caller.og.fetch({
        url: "https://thehill.com/article"
      })
    ).rejects.toThrow();
  });

  it("should throw INTERNAL_SERVER_ERROR for upstream errors", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response("Server Error", { status: 500 })
    );

    const caller = createTestCaller({ secret: process.env.EXTENSION_SHARED_SECRET });
    await expect(
      caller.og.fetch({
        url: "https://thehill.com/article"
      })
    ).rejects.toThrow();
  });

  it("should throw NOT_FOUND for missing OG tags", async () => {
    const mockHtml = `<html><head></head></html>`;

    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(mockHtml, { status: 200 })
    );

    const caller = createTestCaller({ secret: process.env.EXTENSION_SHARED_SECRET });
    await expect(
      caller.og.fetch({
        url: "https://thehill.com/article"
      })
    ).rejects.toThrow();
  });

  it("should throw UNAUTHORIZED without valid secret", async () => {
    const caller = createTestCaller({ secret: "invalid-secret" });
    await expect(
      caller.og.fetch({
        url: "https://thehill.com/article"
      })
    ).rejects.toThrow();
  });

  it("should timeout after 5 seconds", async () => {
    vi.mocked(global.fetch).mockImplementationOnce(
      () => new Promise(resolve => setTimeout(() => resolve(new Response("")), 10000))
    );

    const caller = createTestCaller({ secret: process.env.EXTENSION_SHARED_SECRET });
    await expect(
      caller.og.fetch({
        url: "https://thehill.com/article"
      })
    ).rejects.toThrow();
  }, { timeout: 15000 });

  it("should enforce rate limiting", async () => {
    const mockHtml = `
      <html>
        <head>
          <meta property="og:title" content="Test" />
          <meta property="og:description" content="Test" />
          <meta property="og:image" content="https://example.com/image.jpg" />
        </head>
      </html>
    `;

    vi.mocked(global.fetch).mockResolvedValue(
      new Response(mockHtml, { status: 200 })
    );

    const caller = createTestCaller({ secret: process.env.EXTENSION_SHARED_SECRET, ip: "127.0.0.1" });

    // Make 10 successful requests (should all succeed)
    for (let i = 0; i < 10; i++) {
      await caller.og.fetch({ url: "https://thehill.com/article" });
    }

    // 11th request should hit rate limit
    await expect(
      caller.og.fetch({ url: "https://thehill.com/article" })
    ).rejects.toThrow();
  });
});
