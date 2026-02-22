import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('https://trpc.io/og.fetch', ({ request }) => {
    const url = new URL(request.url);
    const urlParam = url.searchParams.get('url');

    if (urlParam === 'https://error.com') {
      return new HttpResponse(null, {
        status: 500,
        statusText: 'Internal Server Error',
      });
    }

    return HttpResponse.json({
      result: {
        data: {
          title: 'Mocked Title',
          description: 'Mocked Description',
          imageUrl: 'https://example.com/mocked-image.jpg',
        },
      },
    });
  }),

  http.post(
    'https://bsky.social/xrpc/com.atproto.repo.createRecord',
    async ({ request }) => {
      const body = (await request.json()) as { record: { text: string } };
      if (body.record.text.includes('fail')) {
        return new HttpResponse(null, {
          status: 500,
          statusText: 'Internal Server Error',
        });
      }

      return HttpResponse.json({
        uri: 'at://did:plc:test123/app.bsky.feed.post/3k7z3s6y2y22a',
        cid: 'bafyreibm27u625qkcheqfr36k7v6w6yqi5v64wc6v5h5b2a5t6z3w5z3w5i',
      });
    }
  ),

  http.post('https://bsky.social/xrpc/com.atproto.server.createSession', () => {
    return HttpResponse.json({
      accessJwt: 'test-jwt-token-1234567890',
      did: 'did:plc:test123',
      handle: 'testuser.bsky.social',
      refreshJwt: 'test-refresh-token',
    });
  }),
];
