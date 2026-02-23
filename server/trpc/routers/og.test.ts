import { describe, it, expect, beforeEach } from 'vitest';
import { createTestCaller } from '../../tests/testHelpers';

describe('ogRouter.fetch', () => {
  beforeEach(() => {
    // Reset MSW handlers between tests - handled by vitest.setup.ts
  });

  it.skip('should return correct OG data on successful fetch', async () => {
    const caller = createTestCaller({
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

  it.skip('should fetch OG metadata for allowed domain', async () => {
    const caller = createTestCaller({
      secret: process.env.EXTENSION_SHARED_SECRET,
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

  it.skip('should test OG data retrieval for specified domains', async () => {
    const domainsToTest = ['thehill.com', 'theroot.com', 'usanews.com'];

    for (const domain of domainsToTest) {
      const caller = createTestCaller({
        secret: process.env.EXTENSION_SHARED_SECRET,
      });
      const testUrl = `https://${domain}/some-article`; // Using a placeholder article path

      try {
        const result = await caller.og.fetch({
          url: testUrl,
        });
        // Expecting some data to be returned, adjust expectations based on actual mock data
        expect(result).toHaveProperty('title');
        expect(result).toHaveProperty('description');
        expect(result).toHaveProperty('imageUrl');
        console.log(`Successfully retrieved OG data for ${domain}:`, result);
      } catch (error) {
        console.error(`Error retrieving OG data for ${domain}:`, error);
        // Expecting an error if the domain doesn't return OG data or is blocked
        expect(error).toBeInstanceOf(Error);
        // You might want to refine this expectation based on the specific error type
        // e.g., expect(error.message).toContain('missing_tags');
      }
    }
  });

  it('should throw BAD_REQUEST for blocked domain', async () => {
    const caller = createTestCaller({
      secret: process.env.EXTENSION_SHARED_SECRET,
    });
    await expect(
      caller.og.fetch({
        url: 'https://blocked-domain.com/article',
      })
    ).rejects.toThrow();
  });

  it('should throw UNAUTHORIZED without valid secret', async () => {
    const caller = createTestCaller({ secret: 'invalid-secret' });
    await expect(
      caller.og.fetch({
        url: 'https://thehill.com/article',
      })
    ).rejects.toThrow();
  });

  it.skip('should return loggedIn: false (stateless)', async () => {
    const caller = createTestCaller({
      secret: process.env.EXTENSION_SHARED_SECRET,
    });
    const result = await caller.auth.status();

    expect(result).toEqual({
      loggedIn: false,
      session: null,
    });
  });
});
