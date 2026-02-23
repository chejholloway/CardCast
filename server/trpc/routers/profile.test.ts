import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createTestCaller } from '../../tests/testHelpers';
import { TRPCError } from '@trpc/server';

// Get the actual Response class from node-fetch
const { Response } =
  await vi.importActual<typeof import('node-fetch')>('node-fetch');

// Mock the node-fetch module
vi.mock('node-fetch', () => ({
  __esModule: true,
  default: mockFetch,
  Response: Response, // Use the actual Response class
}));

const mockFetch = vi.fn();

describe('profileRouter', () => {
  beforeEach(() => {
    // Reset the mock before each test
    mockFetch.mockClear();
    mockFetch.mockClear();
  });

  it('should return profile data on successful retrieval', async () => {
    const mockProfileResponse = {
      did: 'did:plc:testdid',
      handle: 'testuser.bsky.social',
    };

    // Set the mock implementation for the default export of node-fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockProfileResponse),
    });

    const caller = createTestCaller({
      secret: process.env.EXTENSION_SHARED_SECRET,
    });

    const result = await caller.profile.getProfile({
      actor: 'testuser.bsky.social',
      accessJwt: 'test-access-jwt',
    });

    expect(result).toEqual(mockProfileResponse);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
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
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: () => Promise.resolve('Profile not found'),
    });

    const caller = createTestCaller({
      secret: process.env.EXTENSION_SHARED_SECRET,
    });

    await expect(
      caller.profile.getProfile({
        actor: 'nonexistent.bsky.social',
        accessJwt: 'test-access-jwt',
      })
    ).rejects.toThrow('getProfile failed: 404 Profile not found');
    expect(mockFetch).toHaveBeenCalledTimes(1);
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
