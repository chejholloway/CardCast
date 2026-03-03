import { http, HttpResponse } from 'msw';

// Reusable OG HTML builder
const ogHtml = (title: string, description: string, image: string) => `
  <html><head>
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${image}">
  </head></html>
`;

// Empty HTML — used by the catch-all so unrecognised domains fail fast
// with missing_tags instead of timing out on a real network call.
const emptyHtml = '<html><head></head></html>';

const theHillOg = () =>
  new HttpResponse(
    ogHtml(
      'Test Article',
      'This is a test article',
      'https://example.com/image.jpg'
    ),
    { headers: { 'Content-Type': 'text/html' } }
  );

const theRootOg = () =>
  new HttpResponse(
    ogHtml(
      'Root Article',
      'A test article from The Root',
      'https://example.com/image.jpg'
    ),
    { headers: { 'Content-Type': 'text/html' } }
  );

const usnewsOg = () =>
  new HttpResponse(
    ogHtml(
      'USA News Article',
      'A test article from USA News',
      'https://example.com/image.jpg'
    ),
    { headers: { 'Content-Type': 'text/html' } }
  );

export const handlers = [
  // Mock Microlink to test cheerio fallback
  http.get('https://api.microlink.io/', () => {
    return HttpResponse.json({ status: 'error' });
  }),

  // Auth - session verification
  http.get('https://bsky.social/xrpc/com.atproto.server.getSession', () => {
    return HttpResponse.json({
      did: 'did:plc:test123',
      handle: 'testuser.bsky.social',
      email: 'test@example.com',
      emailConfirmed: true,
    });
  }),

  // Auth - login (createSession)
  http.post('https://bsky.social/xrpc/com.atproto.server.createSession', () => {
    return HttpResponse.json({
      did: 'did:plc:test123',
      accessJwt: 'test-jwt-token-1234567890',
      handle: 'testuser.bsky.social',
      refreshJwt: 'test-refresh-token-1234567890',
      email: 'test@example.com',
      emailConfirmed: true,
      active: true,
    });
  }),

  // Auth - session refresh
  http.post(
    'https://bsky.social/xrpc/com.atproto.server.refreshSession',
    () => {
      return HttpResponse.json({
        did: 'did:plc:test123',
        handle: 'testuser.bsky.social',
        accessJwt: 'refreshed-test-jwt-token-long-enough',
        refreshJwt: 'refreshed-test-refresh-token-long-enough',
      });
    }
  ),

  // Blob upload
  http.post('https://bsky.social/xrpc/com.atproto.repo.uploadBlob', () => {
    return HttpResponse.json({
      blob: {
        $type: 'blob',
        ref: {
          $link: 'bafkreihdwdcefgh4dqkjv67uzcmw37tak336skifc4tzdkqkieabcdefgh',
        },
        mimeType: 'image/jpeg',
        size: 12345,
      },
    });
  }),

  // Create record
  http.post('https://bsky.social/xrpc/com.atproto.repo.createRecord', () => {
    return HttpResponse.json({
      uri: 'at://did:plc:test123/app.bsky.feed.post/3k7z3s6y2y22a',
      cid: 'bafyreib2rxk3rybk3aobmv5cjuql3bm2twh4jo5ufzvfpvlnfcmhcxzy4m',
    });
  }),

  // External image download (for uploadImage)
  http.get('https://example.com/image.jpg', () => {
    const buffer = Buffer.from([
      0xff, 0xd8, 0xff, 0xdb, 0x00, 0x43, 0x00, 0xff, 0xd9,
    ]);
    return new HttpResponse(buffer, {
      headers: { 'Content-Type': 'image/jpeg' },
    });
  }),

  // OG: success.com base URL — used by og.test.ts test 1
  http.get('https://success.com', () => {
    return new HttpResponse(
      ogHtml(
        'Mocked Title',
        'Mocked Description',
        'https://example.com/mocked-image.jpg'
      ),
      { headers: { 'Content-Type': 'text/html' } }
    );
  }),

  // success.com/article — used by post.test.ts (just needs a 200, no OG tags required)
  http.get('https://success.com/article', () => {
    return new Response('<html></html>', { status: 200 });
  }),

  // OG: thehill.com and all subdomains (e.g. news.thehill.com)
  http.get('https://thehill.com/:path*', theHillOg),
  http.get('https://*.thehill.com/:path*', theHillOg),

  // OG: theroot.com and all subdomains
  http.get('https://theroot.com/:path*', theRootOg),
  http.get('https://*.theroot.com/:path*', theRootOg),

  // OG: usnews.com and all subdomains
  http.get('https://usnews.com/:path*', usnewsOg),
  http.get('https://*.usnews.com/:path*', usnewsOg),

  // Profile endpoint
  http.post('https://bsky.app/xrpc/app.bsky.actor.getProfile', () => {
    return HttpResponse.json({
      did: 'did:plc:test123',
      handle: 'testuser.bsky.social',
      displayName: 'Test User',
      description: 'A test account',
      avatar: null,
      banner: null,
      followersCount: 0,
      followsCount: 0,
      postsCount: 0,
      labels: [],
    });
  }),

  // Catch-all: return empty HTML for any unrecognised HTTPS GET so tests
  // that expect missing_tags fail fast instead of hitting real network timeouts.
  http.get('https://*/*', () => {
    return new HttpResponse(emptyHtml, {
      headers: { 'Content-Type': 'text/html' },
    });
  }),
];
