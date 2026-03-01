import { NextRequest } from 'next/server';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '../../../../server/trpc/router';
import { createTRPCContext } from '../../../../server/trpc/trpcContext';

export const runtime = 'nodejs';

function getCorsHeaders(origin: string | null): HeadersInit {
  return {
    'Access-Control-Allow-Origin': origin ?? '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers':
      'Content-Type, Authorization, x-extension-secret',
  };
}

const handler = async (req: NextRequest) => {
  const origin = req.headers.get('origin');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: getCorsHeaders(origin),
    });
  }

  const res = await fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createTRPCContext(req),
    onError: ({ error, path }) => {
      console.error(`tRPC Error on ${path}:`, error);
    },
  });

  // Clone the response with CORS headers appended.
  // Do NOT mutate res.headers directly — the Response object returned by
  // fetchRequestHandler may have immutable headers in the Node.js runtime,
  // and a silent throw there is what produces the empty body.
  const headers = new Headers(res.headers);
  const corsHeaders = getCorsHeaders(origin);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    headers.set(key, value);
  });

  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers,
  });
};

export { handler as GET, handler as POST, handler as OPTIONS };
