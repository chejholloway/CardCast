import { describe, it, expect, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { createTestCaller } from '../../tests/testHelpers';
import { server } from '../../tests/mswServer';

const validAuth = {
  accessJwt: 'test-jwt-token-1234567890',
  did: 'did:plc:test123',
  handle: 'testuser.bsky.social',
  refreshJwt: 'test-refresh-token',
};

const validPost = {
  text: 'Check out this article',
  url: 'https://success.com/article',
  title: 'Test Article',
  description: 'This is a test article',
  imageUrl: 'https://example.com/image.jpg',
};

describe('postRouter.create', () => {
  afterEach(() => server.resetHandlers());

  it('should create a post with a link card', async () => {
    const caller = await createTestCaller({
      secret: process.env.EXTENSION_SHARED_SECRET,
    });

    const result = await caller.post.create({
      post: validPost,
      auth: validAuth,
    });

    expect(result).toEqual({
      success: true,
      uri: 'at://did:plc:test123/app.bsky.feed.post/3k7z3s6y2y22a',
      thumbUploaded: true,
    });
  });

  it('should throw an error if post creation fails', async () => {
    server.use(
      http.post(
        'https://bsky.social/xrpc/com.atproto.repo.createRecord',
        () => {
          return HttpResponse.json(
            { error: 'InternalServerError', message: 'Bluesky is down' },
            { status: 500 }
          );
        }
      )
    );

    const caller = await createTestCaller({
      secret: process.env.EXTENSION_SHARED_SECRET,
    });

    await expect(
      caller.post.create({ post: validPost, auth: validAuth })
    ).rejects.toThrow();
  });

  it('should throw UNAUTHORIZED without valid secret', async () => {
    const caller = await createTestCaller({ secret: 'invalid-secret' });

    await expect(
      caller.post.create({ post: validPost, auth: validAuth })
    ).rejects.toThrow();
  });

  it('should validate input schema - requires text', async () => {
    const caller = await createTestCaller({
      secret: process.env.EXTENSION_SHARED_SECRET,
    });

    await expect(
      caller.post.create({
        post: { ...validPost, text: '' },
        auth: validAuth,
      })
    ).rejects.toThrow();
  });
});
