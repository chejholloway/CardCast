import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TRPCError } from '@trpc/server';
import { createTestCaller } from '../../tests/testHelpers';
import * as rateLimitModule from '../../lib/rateLimit';

vi.mock('@vercel/kv', () => ({
  kv: {
    get: vi.fn(() => null),
    set: vi.fn(() => null),
  },
}));

describe('ogRouter.fetch', () => {
  beforeEach(() => {
    vi.spyOn(rateLimitModule, 'checkRateLimit').mockResolvedValue(true);
    // Reset MSW handlers between tests - handled by vitest.setup.ts
  });

  it('should return correct OG data on successful fetch', async () => {
    const caller = await createTestCaller({
      secret: process.env.EXTENSION_SHARED_SECRET,
    });
    const result = await caller.og.fetch({
      url: 'https://success.com',
    });

    expect(result).toEqual({
      title: 'Mocked Title',
      description: 'Mocked Description',
      imageUrl: 'https://example.com/mocked-image.jpg',
    });
  });

  it('should fetch OG metadata for any valid HTTPS domain', async () => {
    const caller = await createTestCaller({
      secret: process.env.EXTENSION_SHARED_SECRET || 'test-secret-12345',
    });
    const result = await caller.og.fetch({
      url: 'https://thehill.com/article',
    });

    expect(result).toEqual({
      title: 'Test Article',
      description: 'This is a test article',
      imageUrl: 'https://example.com/image.jpg',
    });
  });

  it('should fetch OG metadata for subdomains', async () => {
    const caller = await createTestCaller({
      secret: process.env.EXTENSION_SHARED_SECRET || 'test-secret-12345',
    });

    // These were previously blocked by the allowlist — subdomains should now work
    const urls = [
      'https://news.thehill.com/some-article',
      'https://theroot.com/some-article',
      'https://usanews.com/some-article',
    ];

    for (const url of urls) {
      const result = await caller.og.fetch({ url });
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('imageUrl');
    }
  });

  it('should throw NOT_FOUND when no OG tags can be extracted', async () => {
    const caller = await createTestCaller({
      secret: process.env.EXTENSION_SHARED_SECRET,
    });

    // No MSW handler for this domain, so both Microlink and cheerio return null
    await expect(
      caller.og.fetch({ url: 'https://no-og-tags.example.com/article' })
    ).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'missing_tags',
    });
  });

  it('should throw BAD_REQUEST for non-HTTPS URLs', async () => {
    const caller = await createTestCaller({
      secret: process.env.EXTENSION_SHARED_SECRET,
    });

    await expect(
      caller.og.fetch({ url: 'http://plainhttp.com/article' })
    ).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      message: 'Only HTTPS URLs are supported',
    });
  });

  it('should throw BAD_REQUEST when rate limit is exceeded', async () => {
    vi.spyOn(rateLimitModule, 'checkRateLimit').mockResolvedValue(false);

    const caller = await createTestCaller({
      secret: process.env.EXTENSION_SHARED_SECRET,
    });

    await expect(
      caller.og.fetch({ url: 'https://thehill.com/article' })
    ).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      message: 'Rate limit exceeded',
    });
  });

  it('should return loggedIn: false (stateless)', async () => {
    const caller = await createTestCaller({
      secret: process.env.EXTENSION_SHARED_SECRET,
    });
    const result = await caller.auth.status();

    expect(result).toEqual({
      loggedIn: false,
      session: null,
    });
  });
});
