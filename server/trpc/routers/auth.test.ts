import { describe, it, expect, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";
import * as atproto from "@atproto/api";
import { createTestCaller } from "../tests/testHelpers";

// Mock @atproto/api
vi.mock("@atproto/api", () => ({
  Agent: vi.fn()
}));

describe("authRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("login", () => {
    it("should return session on successful login", async () => {
      const mockSession = {
        did: "did:plc:test123",
        accessJwt: "test-jwt-token",
        handle: "testuser.bsky.social"
      };

      const MockAgent = vi.mocked(atproto.Agent);
      MockAgent.mockImplementation(() => ({
        login: vi.fn().mockResolvedValue(undefined),
        session: mockSession
      } as any));

      const caller = createTestCaller({ secret: process.env.EXTENSION_SHARED_SECRET });
      const result = await caller.auth.login({
        identifier: "testuser",
        appPassword: "app-password-123"
      });

      expect(result).toEqual(mockSession);
    });

    it("should throw UNAUTHORIZED for invalid credentials", async () => {
      const MockAgent = vi.mocked(atproto.Agent);
      MockAgent.mockImplementation(() => ({
        login: vi.fn().mockRejectedValue(new Error("Invalid credentials")),
        session: null
      } as any));

      const caller = createTestCaller({ secret: process.env.EXTENSION_SHARED_SECRET });
      await expect(
        caller.auth.login({
          identifier: "baduser",
          appPassword: "wrong-password"
        })
      ).rejects.toThrow();
    });

    it("should throw UNAUTHORIZED without valid secret", async () => {
      const caller = createTestCaller({ secret: "invalid-secret" });
      await expect(
        caller.auth.login({
          identifier: "testuser",
          appPassword: "app-password-123"
        })
      ).rejects.toThrow();
    });

    it("should throw INTERNAL_SERVER_ERROR if session not established", async () => {
      const MockAgent = vi.mocked(atproto.Agent);
      MockAgent.mockImplementation(() => ({
        login: vi.fn().mockResolvedValue(undefined),
        session: null
      } as any));

      const caller = createTestCaller({ secret: process.env.EXTENSION_SHARED_SECRET });
      await expect(
        caller.auth.login({
          identifier: "testuser",
          appPassword: "app-password-123"
        })
      ).rejects.toThrow();
    });
  });

  describe("status", () => {
    it("should return loggedIn: false (stateless)", async () => {
      const caller = createTestCaller({ secret: process.env.EXTENSION_SHARED_SECRET });
      const result = await caller.auth.status();

      expect(result).toEqual({
        loggedIn: false,
        session: null
      });
    });

    it("should throw UNAUTHORIZED without valid secret", async () => {
      const caller = createTestCaller({ secret: "invalid-secret" });
      await expect(caller.auth.status()).rejects.toThrow();
    });
  });
});
