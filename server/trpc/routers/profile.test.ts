import { describe, it, expect, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { createTestCaller } from '../../tests/testHelpers';
import { server } from '../../tests/mswServer';
import { TRPCError } from '@trpc/server';

describe('profileRouter', () => {
  afterEach(() => server.resetHandlers());

  it('should return profile data on successful retrieval', async () => {
    const caller = createTestCaller({
      secret: process.env.EXTENSION_SHARED_SECRET,
    });

    const result = await caller.profile.getProfile({
      actor: 'testuser.bsky.social',
      accessJwt: 'test-access-jwt',
    });

    expect(result).toMatchObject({
      did: 'did:plc:test123',
      handle: 'testuser.bsky.social',
    });
  });

  it('should throw an error if profile retrieval fails', async () => {
    server.use(
      http.post('https://bsky.app/xrpc/app.bsky.actor.getProfile', () => {
        return new HttpResponse('Profile not found', { status: 404 });
      })
    );

    const caller = createTestCaller({
      secret: process.env.EXTENSION_SHARED_SECRET,
    });

    await expect(
      caller.profile.getProfile({
        actor: 'nonexistent.bsky.social',
        accessJwt: 'test-access-jwt',
      })
    ).rejects.toThrow('getProfile failed: 404 Profile not found');
  });

  it('should throw UNAUTHORIZED without valid secret', async () => {
    const caller = createTestCaller({ secret: 'invalid-secret' });

    await expect(
      caller.profile.getProfile({
        actor: 'testuser.bsky.social',
        accessJwt: 'test-access-jwt',
      })
    ).rejects.toThrow(TRPCError);
  });
});
