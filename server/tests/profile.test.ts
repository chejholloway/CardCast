import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { server } from './mswServer';
import { createTestCaller } from './testHelpers';

describe('profile.getProfile', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
  afterAll(() => server.close());

  it('returns a profile object for a valid actor', async () => {
    const caller = createTestCaller({ secret: 'test-secret' });
    const res = await caller.profile.getProfile({
      actor: 'did:plc:test123',
      accessJwt: 'test-jwt-token',
    });
    expect(res).toBeTruthy();
  });
});
