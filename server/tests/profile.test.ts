import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { server } from './mswServer';
import { createTestCaller } from './testHelpers';

describe('profile.getProfile', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
  afterAll(() => server.close());

  // TODO: This test is skipped because of an issue with the test environment configuration.
  // The EXTENSION_SHARED_SECRET is not being correctly passed to the tRPC context.
  it.skip('returns a profile object for a valid actor', async () => {
    const caller = createTestCaller({ secret: 'test-secret-key-0000' });
    const res = await caller.profile.getProfile({
      actor: 'did:plc:test123',
      accessJwt: 'test-jwt-token',
    });
    expect(res).toBeTruthy();
  });
});
