import { describe, it, expect, beforeEach } from 'vitest';
import { createTestCaller } from '../../tests/testHelpers';

describe('authRouter', () => {
  beforeEach(() => {
    // Reset MSW handlers between tests - handled by vitest.setup.ts
  });

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
        accessJwt: 'test-jwt-token',
        handle: 'testuser.bsky.social',
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
