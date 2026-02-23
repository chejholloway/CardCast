import { describe, it, expect, beforeEach } from 'vitest';
import { createTestCaller } from '../../tests/testHelpers';

describe('postRouter.create', () => {
  beforeEach(() => {
    // Reset MSW handlers between tests - handled by vitest.setup.ts
  });

  it.skip('should create a post with a link card', async () => {
    const caller = createTestCaller({
      secret: process.env.EXTENSION_SHARED_SECRET,
    });

    const input = {
      text: 'Check out this article',
      url: 'https://success.com/article',
      title: 'Test Article',
      description: 'This is a test article',
      imageUrl: 'https://example.com/image.jpg',
      accessJwt: 'test-jwt-token-1234567890',
      did: 'did:plc:test123',
      handle: 'testuser.bsky.social',
      refreshJwt: 'test-refresh-token',
    };

    const result = await caller.post.create(input);

    expect(result).toEqual({
      success: true,
      uri: 'at://did:plc:test123/app.bsky.feed.post/3k7z3s6y2y22a',
      thumbUploaded: true,
    });
  });

  it('should throw an error if post creation fails', async () => {
    const caller = createTestCaller({
      secret: process.env.EXTENSION_SHARED_SECRET,
    });

    const input = {
      text: 'This post will fail',
      url: 'https://success.com/article',
      title: 'Test Article',
      description: 'This is a test article',
      imageUrl: 'https://example.com/image.jpg',
      accessJwt: 'test-jwt-token-1234567890',
      did: 'did:plc:test123',
      handle: 'testuser.bsky.social',
      refreshJwt: 'test-refresh-token',
    };

    await expect(caller.post.create(input)).rejects.toThrow();
  });

  it('should throw UNAUTHORIZED without valid secret', async () => {
    const mockInput = {
      text: 'Check out this article',
      url: 'https://thehill.com/article',
      title: 'Test Article',
      description: 'This is a test article',
      imageUrl: 'https://example.com/image.jpg',
      accessJwt: 'test-jwt-token-1234567890',
      did: 'did:plc:test123',
      handle: 'testuser.bsky.social',
      refreshJwt: 'test-refresh-token',
    };

    const caller = createTestCaller({ secret: 'invalid-secret' });
    await expect(caller.post.create(mockInput)).rejects.toThrow();
  });

  it('should validate input schema - requires text', async () => {
    const caller = createTestCaller({
      secret: process.env.EXTENSION_SHARED_SECRET,
    });

    // Missing required field - text is empty
    await expect(
      caller.post.create({
        text: '', // Empty text not allowed
        url: 'https://thehill.com/article',
        title: 'Test Article',
        description: 'This is a test article',
        imageUrl: 'https://example.com/image.jpg',
        accessJwt: 'test-jwt-token-1234567890',
        did: 'did:plc:test123',
        handle: 'testuser.bsky.social',
        refreshJwt: 'test-refresh-token',
      })
    ).rejects.toThrow();
  });
});
