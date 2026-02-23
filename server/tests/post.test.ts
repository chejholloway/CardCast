import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { server } from './mswServer';
import { createTestCaller } from './testHelpers';
import * as uploadImageModule from '../trpc/routers/uploadImage';

const mockCreateRecord = vi.fn();

vi.mock('@atproto/api', async (importOriginal) => {
  const original = await importOriginal<typeof import('@atproto/api')>();
  return {
    ...original,
    AtpAgent: class MockAtpAgent {
      api = {
        com: {
          atproto: {
            repo: {
              createRecord: mockCreateRecord,
            },
          },
        },
      };
      uploadBlob = vi.fn().mockResolvedValue({
        data: {
          blob: {
            ref: { $link: 'bafy123' },
            mimeType: 'image/jpeg',
            size: 12345,
          },
        },
      });

      constructor(options: any) {
        // You can inspect options here if needed
      }
      resumeSession = vi.fn().mockResolvedValue(undefined);
    },
  };
});

describe('post.create', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
  afterAll(() => server.close());

  it('should create a post with valid input', async () => {
    mockCreateRecord.mockResolvedValue({
      data: {
        uri: 'at://did:plc:test123/app.bsky.feed.post/test123',
        cid: 'bafy123test',
      },
    });

    const caller = createTestCaller({ secret: 'test-secret-12345' });
    const res = await caller.post.create({
      post: {
        text: 'This is a test post',
        url: 'https://example.com',
        title: 'Test Post',
        description: 'This is a test post',
        imageUrl: 'https://example.com/image.jpg',
      },
      auth: {
        accessJwt: 'test-jwt-token',
        did: 'did:plc:test123',
        handle: 'testuser.bsky.social',
        refreshJwt: 'test-refresh-token',
      },
    });
    expect(res).toBeTruthy();

    vi.restoreAllMocks();
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
