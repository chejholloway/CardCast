// Global CORS middleware for the Next.js API to permit the Chrome extension origin
// This ensures the MV3 extension can call /api/trpc/* endpoints without being blocked by CORS.
import { NextRequest, NextResponse } from 'next/server';

// Allowlist can be extended via ALLOWED_ORIGIN env var; the Chrome extension origin is always allowed.
const allowedOrigins = [
  process.env.ALLOWED_ORIGIN || '',
  'chrome-extension://onmenhpkfiinmncaclagiboelfjjeilk',
];

export function proxy(req: NextRequest) {
  const origin = req.headers.get('origin') || '';
  if (origin && allowedOrigins.includes(origin)) {
    const res = NextResponse.next();
    res.headers.set('Access-Control-Allow-Origin', origin);
    res.headers.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, x-extension-secret'
    );
    res.headers.set('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') {
      // Preflight request
      return new NextResponse(null, {
        status: 204,
        headers: res.headers,
      });
    }
    return res;
  }
  // Not whitelisted; proceed as normal (could still be same-origin requests)
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
