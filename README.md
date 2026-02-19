# Bluesky Card Cast Browser Extension & Backend

This project is a **Manifest V3 Chrome/Edge extension** plus a **Next.js 14 (App Router) backend** that adds a rich Open Graph link card composer to the official Bluesky web app. It is designed to feel like a native Bluesky feature while keeping enterprise-grade security, observability, and type safety.

The backend is deployed to Vercel and exposes a **tRPC v11** API consumed by the extension via **httpBatchLink**, with **Zod**-validated contracts, **React Query v5** integration, and **@atproto/api** for posting to Bluesky.

---

## High-Level Architecture

- **Browser Extension (Manifest V3)**
  - Background service worker using **tRPC client + React Query**.
  - Content script that detects the Bluesky composer and injects a **link card composer UI**.
  - Popup UI for **Bluesky login** and managing allowed domains.
- **Next.js 14 Backend (Vercel)**
  - Single **`appRouter`** with sub-routers:
    - `ogRouter` – fetch and parse Open Graph metadata via **cheerio**.
    - `postRouter` – upload image blobs and create Bluesky posts via **@atproto/api**.
    - `authRouter` – log in with handle + app password and return a lightweight session.
  - **Zod** used for all input/output validation.
  - **Shared-secret middleware** ensures only the extension can call the API.
  - **Structured JSON logging** for Vercel log drains.

**Diagram (described)**:

1. User is on `bsky.app` → content script watches the compose box.
2. User pastes a URL (e.g., `thehill.com`) → content script sends a message to the background worker.
3. Background worker calls `trpc.og.fetch` on the backend.
4. Backend fetches HTML, parses OG tags, and returns `{ title, description, imageUrl }`.
5. Content script shows a rich card preview under the composer with a **"Post with Card"** button.
6. When clicked, background worker calls `trpc.post.create`, which:
   - Downloads the OG image.
   - Uploads it to Bluesky (`agent.uploadBlob`).
   - Creates an `app.bsky.feed.post` record with an `app.bsky.embed.external` embed.
7. Extension reports success and optionally links to the created post.

---

## Backend (Next.js 14 + tRPC v11)

Key files:

- `app/api/trpc/[trpc]/route.ts` – tRPC HTTP handler for the App Router using `fetchRequestHandler`.
- `server/env.ts` – **Zod-validated environment variables** (single source of truth).
- `server/log.ts` – JSON logger for structured logs.
- `server/trpc/base.ts` – `router`, `publicProcedure`, `protectedProcedure` and shared-secret middleware.
- `server/trpc/router.ts` – `appRouter` combining `og`, `post`, and `auth` routers.
- `server/trpc/routers/og.ts` – OG metadata fetching and parsing.
- `server/trpc/routers/post.ts` – Bluesky post + image upload pipeline.
- `server/trpc/routers/auth.ts` – Bluesky login and session shape.

### tRPC Routers

- **`ogRouter.fetch`**
  - **Input**: `z.object({ url: z.string().url() })`
  - Validates that the URL hostname is one of the allowed domains (e.g. `thehill.com`, `theroot.com`, `usanews.com`).
  - Fetches HTML with a realistic desktop User-Agent.
  - Parses `og:title`, `og:description`, `og:image` with **cheerio**.
  - Explicitly returns **NOT_FOUND** with messages `blocked`, `empty`, or `missing_tags` when appropriate.
  - **Output**: `z.object({ title, description, imageUrl })`.
  - Wrapped in a **5s timeout** to avoid hanging requests.

- **`postRouter.create`**
  - **Input**: `z.object({ text, url, title, description, imageUrl, accessJwt, did })`.
  - Fetches the OG image buffer with the same spoofed User-Agent.
  - Uploads to Bluesky via `agent.uploadBlob`.
  - If the image step fails, **falls back** to a text-only embed and sets `thumbUploaded: false`.
  - Constructs an `app.bsky.feed.post` record with an `app.bsky.embed.external` embed.
  - Posts via `com.atproto.repo.createRecord`.
  - **Output**: `z.object({ success: true, uri: string, thumbUploaded: boolean })`.
  - Guarded by **10s timeouts** on image fetch and createRecord.

- **`authRouter`**
  - `login` – takes Bluesky handle + app password, logs in via **@atproto/api**, and returns a trimmed session object `{ did, accessJwt, handle }`.
  - `status` – returns a consistent `{ loggedIn, session }` shape; the extension is responsible for persisting the session in `chrome.storage.session`.

### Security & Middleware

- **Shared Secret**
  - Every tRPC call must include `x-extension-secret` header.
  - Middleware in `server/trpc/base.ts` rejects requests without a valid secret (`UNAUTHORIZED`).

- **Input/Output Validation**
  - All procedures use **Zod schemas** for both input and output.
  - Application errors are signaled using **TRPCError** with consistent codes:
    - `BAD_REQUEST`, `UNAUTHORIZED`, `NOT_FOUND`, `INTERNAL_SERVER_ERROR`.

- **Environment Variables**
  - Parsed and validated by `server/env.ts`, throwing on invalid config.
  - Validated once and cached globally for per-request performance.

- **CSP & CORS**
  - `next.config.mjs` adds strict `Content-Security-Policy` headers for `/api/*` routes.
  - CORS can be further locked down by checking `Origin` against `ALLOWED_ORIGIN` (configured in `server/env.ts`).

---

## Browser Extension (Manifest V3)

> Note: The extension folder is scaffolded under `extension/`. Scripts are TypeScript-based and built via `npm run build:ext` (uses `tsc` by default; you can swap in a bundler like Vite/Rspack for production).

Planned components:

- **Manifest (`extension/manifest.json`)**
  - MV3 manifest targeting Chrome & Edge.
  - Background **service worker** entry.
  - Content script injected on `https://bsky.app/*`.
  - Minimal permissions: `storage`, `activeTab`, and restricted host permissions.

- **Background Service Worker**
  - Sets up **tRPC client** using `httpBatchLink` pointing at the Vercel backend.
  - Injects the shared secret via a build-time constant or configuration.
  - Uses **React Query** to manage retries and caching (e.g. OG fetch results).
  - Stores Bluesky session and user configuration in `chrome.storage.session` (never `localStorage`).
  - Handles:
    - `FETCH_OG` → `trpc.og.fetch`.
    - `CREATE_POST` → `trpc.post.create`.
    - `AUTH_LOGIN` / `AUTH_STATUS` → `trpc.auth` procedures.

- **Content Script**
  - Detects when the user is on `bsky.app`.
  - Uses `MutationObserver` to detect the compose box.
  - Watches for pasted URLs from supported domains.
  - Injects a **"Fetch Link Card"** button that triggers OG fetching.
  - Renders a card preview (title, description, thumbnail) using a React + Tailwind UI that visually matches Bluesky.
  - Adds a **"Post with Card"** action that delegates to the background worker.

- **Popup**
  - Simple UI for:
    - Logging into Bluesky (handle + app password).
    - Viewing session status (via `trpc.auth.status`).
    - Managing allowed domains (saved to `chrome.storage.session`).
    - Linking to documentation/support.

---

## Features

- **Domain Management**: Configure allowed domains for link card fetching directly in the extension popup.
- **Animations**: Smooth microinteractions using Framer Motion for button hovers, card appearances, and loading states.
- **Theme Awareness**: Automatically adapts to Bluesky's dark/light mode by detecting theme changes on the page.
- **Rate Limiting**: Backend enforces 10 requests per minute per IP to prevent abuse.
- **Type-Safe Communication**: End-to-end type safety between extension and backend via tRPC and Zod.

---

## Type Safety & Shared Types

- The backend exports a single **`AppRouter`** type from `server/trpc/router.ts`.
- The extension imports this type into its tRPC client to get **end-to-end type inference**:
  - `trpc.og.fetch.useQuery`, `trpc.post.create.useMutation`, etc.
- No contracts are manually duplicated; types derive directly from the router definitions and Zod schemas.

---

## Environment Variables

Defined and validated in `server/env.ts`:

- `NODE_ENV` – `"development" | "test" | "production"`.
- `NEXT_PUBLIC_BACKEND_URL` – public HTTPS URL of the deployed backend (e.g. `https://your-app.vercel.app`).
- `BLUESKY_SERVICE_URL` – Bluesky PDS base URL (defaults to `https://bsky.social`).
- `EXTENSION_SHARED_SECRET` – **required**, at least 16 characters, shared between backend and extension.
- `ALLOWED_ORIGIN` – optional, used to further restrict CORS to the extension’s origin.

On Vercel, set these in **Project Settings → Environment Variables**.

---

## Development

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm or pnpm
- Chrome or Microsoft Edge (for loading the unpacked extension)

### Install Dependencies

```bash
cd C:\Development\BSExt
npm install
```

### Run the Backend Locally

```bash
npm run dev
```

This starts Next.js at `http://localhost:3000`. The tRPC endpoint will be at `http://localhost:3000/api/trpc`.

### Build the Extension

```bash
npm run build:ext
```

By default, this compiles the TypeScript sources under `extension/` to JavaScript (e.g. into `extension/dist`). You can replace this with a more sophisticated bundler if desired.

### Load the Extension in Chrome/Edge

1. Run `npm run build:ext`.
2. Open `chrome://extensions` (or `edge://extensions`).
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select the compiled extension directory (e.g. `extension/dist` or `extension` depending on your setup).

---

## Deployment (Vercel)

1. Push this repository to GitHub/GitLab.
2. Create a new Vercel project and select the repo.
3. Vercel should auto-detect **Next.js 14 (App Router)**.
4. Configure environment variables in the project settings:
   - `EXTENSION_SHARED_SECRET` – must match the secret used in the extension.
   - `NEXT_PUBLIC_BACKEND_URL` – set to the final Vercel URL (e.g. `https://your-app.vercel.app`).
   - Any overrides like `BLUESKY_SERVICE_URL`, `ALLOWED_ORIGIN` if needed.
5. Deploy.

Once deployed, update the extension’s tRPC client base URL to point at the Vercel deployment.

---

## Linting & Formatting

- **ESLint** and **Prettier** will be configured to enforce:
  - TypeScript strict mode.
  - No unused variables/imports.
  - Consistent formatting for maintainability.
- Run:

```bash
npm run lint
```

to check code quality locally.

---

## Security & Production Considerations

- **No eval / remote code execution** – required for Chrome Web Store review.
- **Minimal permissions** – only storage and necessary host permissions are requested.
- **Auth Security**
  - Bluesky app passwords are only sent to the backend via HTTPS.
  - Session tokens are stored in `chrome.storage.session`, not `localStorage`.
  - The backend authenticates calls via a **shared secret header**.
- **Time-limited operations**
  - 5s timeout for metadata fetch.
  - 10s timeout for image upload and Bluesky post creation.
- **Logging**
  - All backend logs are JSON, ready for ingestion by log drains (e.g. Datadog, Splunk).

---

## Contributing & Extensibility

- Add more domains by:
  - Extending the allowed-domain list in `ogRouter`.
  - Adding them to the extension’s configurable domain list (popup UI).
- The injected UI is intentionally designed with **Tailwind CSS** and a neutral Bluesky-like design so it can evolve along with Bluesky’s own UI.

