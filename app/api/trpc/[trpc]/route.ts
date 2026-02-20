import { NextRequest } from 'next/server';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '../../../../server/trpc/router';
import { createTRPCContext } from '../../../../server/trpc/trpcContext';

export const runtime = 'nodejs';

/**
 * CORS handling wrapper for the tRPC API route.
 *
 * - Responds to preflight OPTIONS requests with the appropriate headers.
 * - For actual GET/POST/etc requests, forwards to tRPC handler and appends
 *   the necessary CORS headers based on the Origin header (or '*' when not present).
 * - Honors ALLOWED_ORIGIN by performing origin checks in the tRPC middleware;
 *   this wrapper just ensures the browser receives the correct CORS response.
 */
const handler = async (req: NextRequest) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    const origin = req.headers.get('origin') ?? '*';
    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set(
      'Access-Control-Allow-Methods',
      'GET,POST,PUT,PATCH,DELETE,OPTIONS'
    );
    headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, x-extension-secret'
    );
    return new Response(null, { status: 200, headers });
  }

  const origin = req.headers.get('origin');
  const res = await fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createTRPCContext(req),
  });

  // Attach CORS headers to the actual response
  const headers = new Headers(res.headers);
  if (origin) headers.set('Access-Control-Allow-Origin', origin);
  else headers.set('Access-Control-Allow-Origin', '*');
  headers.set(
    'Access-Control-Allow-Methods',
    'GET,POST,PUT,PATCH,DELETE,OPTIONS'
  );
  headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, x-extension-secret'
  );

  return new Response(res.body, { status: res.status, headers });
};

export { handler as GET, handler as POST };
