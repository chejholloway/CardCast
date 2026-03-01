import { NextRequest } from 'next/server';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '../../../../server/trpc/router';
import { createTRPCContext } from '../../../../server/trpc/trpcContext';

export const runtime = 'nodejs';

function getCorsHeaders(origin: string | null): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin ?? '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers':
      'Content-Type, Authorization, x-extension-secret',
  };
}

const handler = async (req: NextRequest) => {
  const origin = req.headers.get('origin');

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

  // Read the body as text before the stream gets locked or consumed.
  // Passing res.body (a ReadableStream) directly to new Response() causes
  // an empty body on Vercel's Node runtime when the stream has already
  // been touched internally by fetchRequestHandler.
  const body = await res.text();

  const headers = new Headers(res.headers);
  Object.entries(getCorsHeaders(origin)).forEach(([key, value]) => {
    headers.set(key, value);
  });

  return new Response(body, {
    status: res.status,
    statusText: res.statusText,
    headers,
  });
};

export { handler as GET, handler as POST, handler as OPTIONS };
