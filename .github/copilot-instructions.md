# Bluesky Card Cast Extension - AI Coding Guidelines

## Architecture Overview
This is a Manifest V3 Chrome/Edge extension paired with a Next.js 14 backend using tRPC v11 for end-to-end type safety. The extension injects a link card composer into Bluesky's web UI, fetching Open Graph metadata via the backend and posting rich embeds to Bluesky.

- **Extension (`extension/`)**: MV3 service worker, content script on `bsky.app`, popup for auth. Uses React Query for caching/retries.
- **Backend (`server/`)**: tRPC routers (`og`, `post`, `auth`) with Zod validation. Protected procedures require `x-extension-secret` header.
- **Data Flow**: Content script detects URLs → background fetches OG via `trpc.og.fetch` → user posts via `trpc.post.create` with image upload.

## Key Files
- `server/trpc/base.ts`: Defines `protectedProcedure` with shared secret auth.
- `server/trpc/routers/og.ts`: Fetches/parses OG tags with cheerio; allowed domains: `["thehill.com", "theroot.com", "usanews.com"]`.
- `extension/src/background.ts`: Handles messages, uses React Query, stores session in `chrome.storage.session`.
- `extension/src/contentScript.tsx`: Detects compose box with MutationObserver, injects React UI.
- `extension/src/trpcClient.ts`: httpBatchLink with shared secret header.

## Development Workflows
- **Backend**: `npm run dev` starts Next.js at localhost:3000.
- **Extension**: `npm run build:ext` compiles TS to `extension/dist/`, then load unpacked in browser.
- **Auth**: Use Bluesky app passwords; session stored in `chrome.storage.session` (not localStorage).
- **Errors**: Use TRPCError with codes like `BAD_REQUEST`, `NOT_FOUND`, `INTERNAL_SERVER_ERROR`; log with `server/log.ts`.

## Patterns & Conventions
- **Validation**: All inputs/outputs use Zod schemas; export inferred types (e.g., `OgFetchInput`).
- **Timeouts**: 5s for OG fetch, 10s for post creation/image upload.
- **Security**: Shared secret middleware; realistic User-Agent headers for fetches.
- **UI**: Tailwind CSS matching Bluesky's design; inject React components into DOM.
- **State**: Extension persists config in `chrome.storage.session`; backend uses env vars validated in `server/env.ts`.
- **Logging**: JSON logs via `server/log.ts` for production observability.

## Examples
- Add new OG router: Use `protectedProcedure.input(schema).output(schema).query(async ({ input }) => { ... })`.
- Extension message: `chrome.runtime.sendMessage({ type: "FETCH_OG", url }, callback)`.
- Error handling: `throw new TRPCError({ code: "NOT_FOUND", message: "blocked" })` for domain blocks.

## Commit Messages
- Use conventional commits: `type(scope): description`
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- Example: `feat(extension): add domain management in popup`</content>
<parameter name="filePath">c:\Development\CardCast\.github\copilot-instructions.md
