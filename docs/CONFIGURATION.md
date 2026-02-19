# Configuration Guide - CardCast

This guide explains all configuration options, environment variables, and how to customize CardCast for your needs.

## Table of Contents

1. [Environment Variables](#environment-variables)
2. [Backend Configuration](#backend-configuration)
3. [Extension Configuration](#extension-configuration)
4. [Rate Limiting](#rate-limiting)
5. [Domain Whitelisting](#domain-whitelisting)
6. [Advanced: Redis & Persistent State](#advanced-redis--persistent-state)

---

## Environment Variables

All configuration is managed via environment variables defined in `.env.example`. Copy it to `.env.local` for local development.

### Required Variables

#### `EXTENSION_SHARED_SECRET`

**Description:** Shared secret for authenticating extension requests to the backend.

**Requirements:**
- Minimum 16 characters
- Recommended: 32+ characters (base64 encoded)
- Must match between extension and backend

**Example:**
```bash
EXTENSION_SHARED_SECRET=mN7x9q2kL8+vW3jP5sR0tYhOaIrW4bX9dF6eG2cH1dJ=
```

**Generate:**
```bash
openssl rand -base64 32
```

**Location in code:**
- Backend: `server/env.ts` schema
- Extension: `extension/src/trpcClient.ts` header injection

---

### Optional Variables

#### `NEXT_PUBLIC_BACKEND_URL`

**Description:** Public URL of the Next.js backend.

**Default:** `http://localhost:3000`

**Examples:**
- Local: `http://localhost:3000`
- Staging: `https://cardcast-staging.vercel.app`
- Production: `https://cardcast.vercel.app`

**Used by:** Extension to construct API endpoint: `${BACKEND_URL}/api/trpc`

**Note:** Must be accessible from the browser where extension runs.

---

#### `BLUESKY_SERVICE_URL`

**Description:** Bluesky ATP (Authenticated Transfer Protocol) service URL.

**Default:** `https://bsky.social`

**Examples:**
- Production Bluesky: `https://bsky.social`
- Private instance: `https://your-bsky-pds.example.com`

**Used by:** `auth` and `post` routers for authentication and posting.

---

#### `ALLOWED_ORIGIN` (Optional)

**Description:** Restrict API access to specific origin.

**Default:** Empty (no origin validation)

**Usage:**
- Leave empty in development
- Set to strict origin in production (if needed)

**Example:**
```bash
ALLOWED_ORIGIN=https://bsky.app
```

**Security note:**
- Chrome extensions don't send traditional `Origin` header
- This is for restricting web-based access only
- Not recommended unless you run a web UI alongside the extension

---

#### `NODE_ENV`

**Description:** Node environment mode.

**Options:** `development`, `test`, `production`

**Default:** `development`

**Affects:**
- Error messages (verbose in dev, minimal in prod)
- Logging level
- Caching behavior

---

## Backend Configuration

### Logging

Edit `server/log.ts` to customize logging output:

```typescript
export const log = {
  info: (msg: string, data?: Record<string, unknown>) => {
    // Log INFO level messages
    console.log(JSON.stringify({ level: 'info', msg, ...data }));
  },
  warn: (msg: string, data?: Record<string, unknown>) => {
    // Log WARN level messages
    console.warn(JSON.stringify({ level: 'warn', msg, ...data }));
  },
  error: (msg: string, data?: Record<string, unknown>) => {
    // Log ERROR level messages
    console.error(JSON.stringify({ level: 'error', msg, ...data }));
  }
};
```

**Production Integration:**
- Vercel automatically captures `console.log` and `console.error`
- Logs appear in: Vercel Dashboard → Project → Logs
- JSON format allows easy parsing by log aggregation tools

### API Routes

Modify `app/api/trpc/[trpc]/route.ts` to customize:

```typescript
// CORS headers for specific origins
// Response timeout for requests
// Request body size limits
// Custom middleware
```

### Timeouts

Configured per-router in `server/trpc/routers/`:

| Router | Timeout | Configurable |
|--------|---------|--------------|
| `og.fetch` | 5s | `withTimeout(promise, 5000)` in `og.ts` |
| `post.create` (image) | 10s | `withTimeout` calls in `post.ts` |
| `post.create` (record) | 10s | `withTimeout` calls in `post.ts` |

**To adjust:**
```typescript
// In server/trpc/routers/og.ts
res = await withTimeout(
  fetch(input.url, { headers: realisticHeaders }),
  5000  // Change to 10000 for 10 seconds
);
```

---

## Extension Configuration

### Client Configuration

Edit `extension/src/trpcClient.ts`:

```typescript
// Backend URL
const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? 'https://your-backend.vercel.app';

// Shared secret (MUST match backend)
const EXTENSION_SHARED_SECRET =
  process.env.EXTENSION_SHARED_SECRET ?? 'your-secret-here';

// Add custom headers
export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${BACKEND_URL}/api/trpc`,
      headers() {
        return {
          'x-extension-secret': EXTENSION_SHARED_SECRET,
          // Add more headers if needed
          'x-custom-header': 'value',
        };
      },
    }),
  ],
});
```

### Manifest Configuration

Modify `extension/manifest.json` for permissions and host matching:

```json
{
  "manifest_version": 3,
  "name": "CardCast",
  "version": "1.0.0",
  "permissions": ["storage", "tabs", "activeTab", "scripting"],
  "host_permissions": ["https://bsky.app/*"],
  "externally_connectable": {
    "matches": ["https://bsky.app/*"]
  },
  "background": {
    "service_worker": "background.js",
    "type": "module"
  },
  "content_scripts": [
    {
      "matches": ["https://bsky.app/*"],
      "js": ["contentScript.js"],
      "run_at": "document_start"
    }
  ],
  "action": {
    "default_popup": "popup.html"
  }
}
```

### Storage Configuration

The extension uses `chrome.storage.session` for session management:

```typescript
// Storing session after login
chrome.storage.session.set({
  session: { did, accessJwt, handle }
});

// Reading session
const { session } = await chrome.storage.session.get('session');
```

**Features:**
- Auto-cleared when browser closes
- Synced across extension pages
- Size limit: 10MB per item

---

## Rate Limiting

### Current Implementation

Simple in-memory rate limiter in `server/trpc/routers/og.ts`:

```typescript
const RATE_LIMIT = 10; // requests
const RATE_WINDOW = 60 * 1000; // 1 minute
```

**Behavior:** 10 requests per minute per IP address

**Reset:** On server restart (resets entire rate limit map)

### Adjusting Rate Limit

Edit `server/trpc/routers/og.ts`:

```typescript
// Increase to 20 requests per minute
const RATE_LIMIT = 20;

// Or increase window to 2 minutes
const RATE_WINDOW = 2 * 60 * 1000;
```

### Production: Redis-Backed Rate Limiter

For production, replace in-memory with Redis:

```bash
npm install redis @upstash/redis
```

Example with Upstash (Redis via HTTP):

```typescript
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const checkRateLimit = async (ip: string): Promise<boolean> => {
  const key = `rate-limit:${ip}`;
  const count = await redis.incr(key);
  
  if (count === 1) {
    // First request, set expiry
    await redis.expire(key, 60); // 1 minute
  }
  
  return count <= RATE_LIMIT;
};
```

**Vercel Integration:**
1. Sign up at https://upstash.com
2. Create Redis database
3. Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to Vercel environment
4. Replace memory-based limiter with Redis code above

---

## Domain Whitelisting

### Current Allowed Domains

Defined in `server/trpc/routers/og.ts`:

```typescript
const ALLOWED_DOMAINS = ["thehill.com", "theroot.com", "usanews.com"];
```

### Adding a Domain

1. Edit `server/trpc/routers/og.ts`:
   ```typescript
   const ALLOWED_DOMAINS = [
     "thehill.com",
     "theroot.com",
     "usanews.com",
     "politico.com",  // New domain
     "cnn.com"         // New domain
   ];
   ```

2. Test locally:
   ```bash
   npm run test -- server/trpc/routers/og.test.ts
   ```

3. Update test fixtures in `server/trpc/routers/og.test.ts` to test new domains

4. Deploy to Vercel

### Dynamic Domain Management (Future)

Store domains in database/config:

```typescript
// Pseudo-code
const ALLOWED_DOMAINS = await db.domains.findMany({
  where: { enabled: true }
});
```

This would allow admin UI to manage domains without redeployment.

---

## Advanced: Redis & Persistent State

### Session Persistence

Current: Sessions stored in `chrome.storage.session` (extension) only.

For persistent backend sessions:

```typescript
// In server/trpc/routers/auth.ts
const cacheSession = async (did: string, session: AuthSession) => {
  await redis.set(`session:${did}`, JSON.stringify(session), {
    ex: 60 * 60 * 24 // 1 day expiry
  });
};

// Later retrieve
const getSession = async (did: string) => {
  const sessionData = await redis.get(`session:${did}`);
  return sessionData ? JSON.parse(sessionData) : null;
};
```

### Image Caching

Cache downloaded OG images to reduce bandwidth:

```typescript
// In server/trpc/routers/post.ts
const getCachedImage = async (imageUrl: string) => {
  const hash = crypto.createHash('sha256').update(imageUrl).digest('hex');
  const cached = await redis.get(`image:${hash}`);
  if (cached) return Buffer.from(cached, 'base64');
  // ... fetch and cache ...
};
```

### Metadata Caching

Cache OG metadata to reduce fetch overhead:

```typescript
// In server/trpc/routers/og.ts
const getCachedMetadata = async (url: string) => {
  const key = `og:${crypto.createHash('sha256').update(url).digest('hex')}`;
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);
  // ... fetch and cache ...
};
```

---

## Summary Checklist

- [ ] `.env.local` created with all required variables
- [ ] `EXTENSION_SHARED_SECRET` is strong and matches between backend/extension
- [ ] `NEXT_PUBLIC_BACKEND_URL` points to correct backend
- [ ] Rate limiting configured appropriately for your use case
- [ ] Allowed domains include all needed sources
- [ ] Logging configured for your monitoring system
- [ ] Timeouts adjusted for your network conditions
- [ ] Production: Redis set up for rate limiting and caching

---

## Next Steps

- [Deployment Guide](./DEPLOYMENT.md) - Deploy to Vercel
- [Getting Started](./GETTING_STARTED.md) - Local development setup
- [README](../README.md) - Architecture overview
