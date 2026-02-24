import { describe, it, expect } from 'vitest';
import { vi } from 'vitest';
import { createTestCaller } from '../../tests/testHelpers';

vi.mock('@vercel/kv', () => ({
  kv: {
    get: vi.fn(() => null),
    set: vi.fn(() => null),
    del: vi.fn(() => null),
  },
}));

describe('authRouter', () => {
  describe('login', () => {
    it('should return session on successful login', async () => {
      const caller = createTestCaller({
        secret: process.env.EXTENSION_SHARED_SECRET,
      });

      const result = await caller.auth.login({
        identifier: 'testuser',
        appPassword: 'app-password-123',
      });

      expect(result).toEqual({
        did: 'did:plc:test123',
        handle: 'testuser.bsky.social',
        accessJwt: expect.any(String),
        refreshJwt: expect.any(String),
      });
    });

    it('should throw UNAUTHORIZED without valid secret', async () => {
      const caller = createTestCaller({ secret: 'invalid-secret' });
      await expect(
        caller.auth.login({
          identifier: 'testuser',
          appPassword: 'app-password-123',
        })
      ).rejects.toThrow();
    });
  });

  describe('status', () => {
    it('should return loggedIn: false (stateless)', async () => {
      const caller = createTestCaller({
        secret: process.env.EXTENSION_SHARED_SECRET,
      });

      const result = await caller.auth.status();

      expect(result).toEqual({
        loggedIn: false,
        session: null,
      });
    });

    it('should throw UNAUTHORIZED without valid secret', async () => {
      const caller = createTestCaller({ secret: 'invalid-secret' });
      await expect(caller.auth.status()).rejects.toThrow();
    });
  });
});
