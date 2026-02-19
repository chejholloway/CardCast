import { http, HttpResponse } from 'msw';
export const handlers = [
  // Mock successful OG fetch
  http.post('http://localhost:3000/api/trpc/og.fetch', async ({ request }) => {
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
  // Mock auth login
  http.post('http://localhost:3000/api/trpc/auth.login', async () => {
    return HttpResponse.json({
      result: {
        data: {
          did: 'did:plc:test123',
          accessJwt: 'test-jwt-token',
          handle: 'testuser.bsky.social',
        },
      },
    });
  }),
  // Mock auth status
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
          success: true,
          uri: 'at://did:plc:test/app.bsky.feed.post/test123',
          thumbUploaded: true,
        },
      },
    });
  }),
];
