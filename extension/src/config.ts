/// <reference types="vite/client" />

// Vite bakes these values into the bundle at build time using import.meta.env.
// process.env is a Node.js/Next.js convention and is always undefined here.
//
// Required variables in your .env.local (or .env.production for prod builds):
//   VITE_BACKEND_URL=https://bluesky-card-cast-extension.vercel.app
//   VITE_EXTENSION_SHARED_SECRET=your-secret-here
//   VITE_SENTRY_DSN=https://...  (optional)

export const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3000';

export const EXTENSION_SHARED_SECRET: string =
  import.meta.env.VITE_EXTENSION_SHARED_SECRET ?? '';

export const SENTRY_DSN: string = import.meta.env.VITE_SENTRY_DSN ?? '';

if (!EXTENSION_SHARED_SECRET) {
  console.error(
    '[CardCast] VITE_EXTENSION_SHARED_SECRET is not set. ' +
      'All API requests will be rejected by the backend. ' +
      'Add it to your .env.local and rebuild.'
  );
}
