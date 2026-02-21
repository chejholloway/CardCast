import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { server } from './mswServer';
import { createTestCaller } from './testHelpers';

describe('post.create', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
  afterAll(() => server.close());

  // TODO: This test is skipped because of an issue with the test environment configuration.
  // The EXTENSION_SHARED_SECRET is not being correctly passed to the tRPC context.
  it.skip('should create a post with valid input', async () => {
    const caller = createTestCaller({ secret: 'test-secret-key-0000' });
    const res = await caller.post.create({
      text: 'This is a test post',
      url: 'https://example.com',
      title: 'Test Post',
      description: 'This is a test post',
      imageUrl: 'https://example.com/image.jpg',
      accessJwt: 'test-jwt-token',
      did: 'did:plc:test123',
      handle: 'testuser.bsky.social',
      refreshJwt: 'test-refresh-token',
    });
    expect(res).toBeTruthy();
  });

  it('should throw an error if the text is empty', async () => {
    const caller = createTestCaller({ secret: 'test-secret-key-0000' });
    await expect(
      caller.post.create({
        text: '',
        url: 'https://example.com',
        title: 'Test Post',
        description: 'This is a test post',
        imageUrl: 'https://example.com/image.jpg',
        accessJwt: 'test-jwt-token',
        did: 'did:plc:test123',
        handle: 'testuser.bsky.social',
        refreshJwt: 'test-refresh-token',
      })
    ).rejects.toThrow();
  });

  it('should throw an error if the url is invalid', async () => {
    const caller = createTestCaller({ secret: 'test-secret-key-0000' });
    await expect(
      caller.post.create({
        text: 'This is a test post',
        url: 'invalid-url',
        title: 'Test Post',
        description: 'This is a test post',
        imageUrl: 'https://example.com/image.jpg',
        accessJwt: 'test-jwt-token',
        did: 'did:plc:test123',
        handle: 'testuser.bsky.social',
        refreshJwt: 'test-refresh-token',
      })
    ).rejects.toThrow();
  });
});
