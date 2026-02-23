import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createTestCaller } from '../../tests/testHelpers';
import { TRPCError } from '@trpc/server';

// Get the actual Response class from node-fetch
const { Response } =
  await vi.importActual<typeof import('node-fetch')>('node-fetch');

// Mock the node-fetch module
vi.mock('node-fetch', () => ({
  __esModule: true,
  default: vi.fn(),
  Response: Response, // Use the actual Response class
}));

const mockFetch = vi.fn();

describe('profileRouter', () => {
  beforeEach(() => {
    // Reset the mock before each test
    (require('node-fetch') as any).default.mockClear();
    mockFetch.mockClear();
  });

  it('should return profile data on successful retrieval', async () => {
    const mockProfileResponse = {
      did: 'did:plc:testdid',
      handle: 'testuser.bsky.social',
    };

    // Set the mock implementation for the default export of node-fetch
    (require('node-fetch') as any).default.mockResolvedValueOnce(
      new Response(JSON.stringify(mockProfileResponse), { status: 200 })
    );

    const caller = createTestCaller({
      secret: process.env.EXTENSION_SHARED_SECRET,
    });

    const result = await caller.profile.getProfile({
      actor: 'testuser.bsky.social',
      accessJwt: 'test-access-jwt',
    });

    expect(result).toEqual(mockProfileResponse);
    expect((require('node-fetch') as any).default).toHaveBeenCalledTimes(1);
    expect((require('node-fetch') as any).default).toHaveBeenCalledWith(
      'https://bsky.app/xrpc/app.bsky.actor.getProfile',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-access-jwt',
        },
        body: JSON.stringify({ actor: 'testuser.bsky.social' }),
      })
    );
  });

  it('should throw an error if profile retrieval fails', async () => {
    (require('node-fetch') as any).default.mockResolvedValueOnce(
      new Response('Profile not found', { status: 404 })
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
    expect((require('node-fetch') as any).default).toHaveBeenCalledTimes(1);
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
