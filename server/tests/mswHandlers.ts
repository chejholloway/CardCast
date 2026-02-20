import { http, HttpResponse } from 'msw';

export const handlers = [
  // Mock successful OG fetch
  http.post('http://localhost:3000/api/trpc/og.fetch', async () => {
    return HttpResponse.json({
      result: {
        data: {
          title: 'Test Article',
          description: 'This is a test article',
          imageUrl: 'https://example.com/image.jpg',
        },
      },
    });
  }),

  // Mock successful auth login
  http.post('http://localhost:3000/api/trpc/auth.login', async () => {
    return HttpResponse.json({
      result: {
        data: {
          did: 'did:plc:test123',
          accessJwt: 'test-jwt-token',
          handle: 'testuser.bsky.social',
          refreshJwt: 'test-refresh-token',
        },
      },
    });
  }),

  // Mock auth status check
  http.post('http://localhost:3000/api/trpc/auth.status', async () => {
    return HttpResponse.json({
      result: {
        data: {
          loggedIn: false,
          session: null,
        },
      },
    });
  }),

  // Mock post creation
  http.post('http://localhost:3000/api/trpc/post.create', async () => {
    return HttpResponse.json({
      result: {
        data: {
          uri: 'at://did:plc:test/app.bsky.feed.post/test123',
          cid: 'bafy123test',
        },
      },
    });
  }),

  // Mock Bluesky API session creation
  http.post(
    'https://bsky.social/xrpc/com.atproto.server.createSession',
    async () => {
      return HttpResponse.json({
        did: 'did:plc:test123',
        accessJwt: 'test-jwt-token',
        refreshJwt: 'test-refresh-token',
        handle: 'testuser.bsky.social',
      });
    }
  ),

  // Mock OG metadata fetch for thehill.com
  http.get('https://thehill.com/article', async () => {
    const mockHtml = `
      <html>
        <head>
          <meta property="og:title" content="Test Article" />
          <meta property="og:description" content="This is a test article" />
          <meta property="og:image" content="https://example.com/image.jpg" />
        </head>
      </html>
    `;
    return new Response(mockHtml, { status: 200 });
  }),

  // Mock OG metadata fetch for example.com (image)
  http.get('https://example.com/image.jpg', async () => {
    return new Response(Buffer.from('fake image data'), {
      status: 200,
      headers: { 'Content-Type': 'image/jpeg' },
    });
  }),

  // Mock Bluesky get session
  http.get(
    'https://bsky.social/xrpc/com.atproto.server.getSession',
    async () => {
      return HttpResponse.json({
        did: 'did:plc:test123',
        handle: 'testuser.bsky.social',
        accessJwt: 'test-jwt-token',
        refreshJwt: 'test-refresh-token',
      });
    }
  ),

  // Mock Bluesky getProfile (single actor)
  http.post('https://bsky.app/xrpc/app.bsky.actor.getProfile', async () => {
    return HttpResponse.json({
      result: {
        data: {
          did: 'did:plc:test123',
          handle: 'testuser.bsky.social',
          displayName: 'Test User',
        },
      },
    });
  }),

  // Mock tRPC profile.getProfile (internal to backend) - not required for endpoint, but helpful in tests
  http.post('http://localhost:3000/api/trpc/profile.getProfile', async () => {
    return HttpResponse.json({
      result: {
        data: {
          did: 'did:plc:test123',
          handle: 'testuser.bsky.social',
          displayName: 'Test User',
        },
      },
    });
  }),

  // Mock Bluesky refresh session
  http.post(
    'https://bsky.social/xrpc/com.atproto.server.refreshSession',
    async () => {
      return HttpResponse.json({
        did: 'did:plc:test123',
        handle: 'testuser.bsky.social',
        accessJwt: 'test-jwt-token-refreshed',
        refreshJwt: 'test-refresh-token-refreshed',
      });
    }
  ),

  // Mock Bluesky upload blob
  http.post(
    'https://bsky.social/xrpc/com.atproto.repo.uploadBlob',
    async () => {
      return HttpResponse.json({
        blob: {
          ref: { $link: 'bafy123' },
          mimeType: 'image/jpeg',
          size: 12345,
        },
      });
    }
  ),

  // Mock Bluesky create record (post)
  http.post(
    'https://bsky.social/xrpc/com.atproto.repo.createRecord',
    async () => {
      return HttpResponse.json({
        uri: 'at://did:plc:test123/app.bsky.feed.post/test123',
        cid: 'bafy123test',
      });
    }
  ),
];
