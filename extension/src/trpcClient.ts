
import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../server/trpc/router';

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? 'https://your-backend-url.vercel.app';

const EXTENSION_SHARED_SECRET =
  process.env.EXTENSION_SHARED_SECRET ?? 'REPLACE_WITH_REAL_SECRET';

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${BACKEND_URL}/api/trpc`,
      headers() {
        return {
          'x-extension-secret': EXTENSION_SHARED_SECRET,
        };
      },
    }),
  ],
});

