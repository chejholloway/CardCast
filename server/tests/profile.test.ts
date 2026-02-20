import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { server } from './mswServer';
import { createTestCaller } from './testHelpers';

describe('profile.getProfile', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
  afterAll(() => server.close());

  it('returns a profile object for a valid actor', async () => {
    // Use the default test secret to align with env/test helper defaults
    const caller = createTestCaller({ secret: 'test-secret-key-0000' });
    const res = await caller.profile.getProfile({
      actor: 'did:plc:test123',
      accessJwt: 'test-jwt-token',
    });
    expect(res).toBeTruthy();
  });
});
