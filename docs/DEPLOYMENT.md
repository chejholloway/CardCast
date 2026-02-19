# Deployment Guide - CardCast

This guide covers how to deploy the CardCast backend to Vercel and package the Chrome extension for distribution.

## Table of Contents

1. [Backend Deployment (Vercel)](#backend-deployment-vercel)
2. [Extension Packaging](#extension-packaging)
3. [Environment Setup](#environment-setup)
4. [Verification Checklist](#verification-checklist)
5. [Rollback & Troubleshooting](#rollback--troubleshooting)

---

## Backend Deployment (Vercel)

### Prerequisites

- Vercel account at https://vercel.com
- Git repository (GitHub, GitLab, or Bitbucket) with CardCast code
- Node.js 18+ locally for testing

### Step 1: Prepare Repository

1. Ensure all code is committed to git:
   ```bash
   git status
   git add .
   git commit -m "chore: prepare for vercel deployment"
   ```

2. Verify environment setup locally:
   ```bash
   npm run build
   npm run test
   ```

3. Push to your git provider:
   ```bash
   git push origin main
   ```

### Step 2: Create Vercel Project

1. Go to https://vercel.com/dashboard
2. Click **"Add New..."** → **"Project"**
3. Import your repository
4. Vercel will auto-detect the Next.js project
5. Click **"Deploy"** (you'll set environment variables next)

**Alternative**: Deploy via CLI
```bash
npm i -g vercel
vercel
# Follow prompts, link your git repository
```

### Step 3: Configure Environment Variables

In Vercel Dashboard:

1. Go to your project
2. Click **Settings** → **Environment Variables**
3. Add the following variables to **Production**:

| Variable | Value | Notes |
|----------|-------|-------|
| `EXTENSION_SHARED_SECRET` | `<strong-random-secret>` | Must be ≥16 chars, keep secure |
| `NEXT_PUBLIC_BACKEND_URL` | `https://<your-project>.vercel.app` | Your Vercel project URL |
| `BLUESKY_SERVICE_URL` | `https://bsky.social` | Bluesky PDS endpoint |
| `NODE_ENV` | `production` | Set to production |
| `ALLOWED_ORIGIN` | (optional) | Leave empty for now |

**Generating a secure secret:**
```bash
openssl rand -base64 32
# Output: mN7x9q2kL8+vW3jP5sR0tYhOaIrW4bX9dF6eG2cH1dJ=
```

4. Click **"Save"**

### Step 4: Deploy

1. Vercel automatically deploys when you push to `main`
   - Or manually trigger: **Deployments** → **Redeploy**

2. Watch the build logs in real-time

3. Once complete, you'll see a **"Visit"** button - click it to test the backend

### Step 5: Verify Backend

Test the deployment:

```bash
# Test if backend is accessible (expects UNAUTHORIZED without secret)
curl https://<your-project>.vercel.app/api/trpc/auth.status

# Should return a JSON error (no secret header)
```

---

## Extension Packaging

### Step 1: Update Extension Configuration

Update `extension/manifest.json` with your backend URL:

```json
{
  "manifest_version": 3,
  "permissions": [
    "storage",
    "tabs",
    "activeTab",
    "scripting"
  ],
  "host_permissions": [
    "https://bsky.app/*"
  ],
  "externally_connectable": {
    "matches": ["https://bsky.app/*"]
  }
}
```

Update `extension/src/trpcClient.ts`:

```typescript
const BACKEND_URL = 'https://<your-project>.vercel.app';
const EXTENSION_SHARED_SECRET = '<from-env>';
```

Or use environment variables:
```bash
# In extension/.env
NEXT_PUBLIC_BACKEND_URL=https://your-project.vercel.app
EXTENSION_SHARED_SECRET=your-secret-here
```

### Step 2: Build the Extension

```bash
npm run build:ext
```

This creates `extension/dist/` with compiled code.

### Step 3: Load in Browser (Development)

#### Chrome/Edge:
1. Go to `chrome://extensions`
2. Enable **Developer Mode** (top-right)
3. Click **"Load unpacked"**
4. Select the `extension/dist/` folder
5. Extension appears in your toolbar

#### Testing:
1. Open https://bsky.app (must be logged in)
2. Click the compose button
3. Paste a URL (e.g., https://thehill.com/policy/...)
4. The link card should appear

### Step 4: Package for Distribution

#### Option A: Chrome Web Store

1. Create a developer account at https://chrome.google.com/webstore/developer/dashboard
2. Create a new item (set name, category, etc.)
3. Upload your `extension/dist/` as a ZIP file
4. Upload screenshots and description
5. Wait for review (typically 1-3 days)

#### Option B: Manual Distribution

Create a ZIP file:
```bash
cd extension/dist
zip -r ../cardcast-extension.zip .
```

Share `cardcast-extension.zip` with users.

**Users can load it:**
```bash
# Extract the ZIP somewhere
# Go to chrome://extensions
# Load unpacked → select extracted folder
```

#### Option C: Signed XPI (Firefox)

Install dependencies and build:
```bash
npm run build:ext
# Manually package for Firefox (currently MV3 Chrome-only)
```

---

## Environment Setup

### Production Checklist

- [ ] Backend deployed to Vercel
- [ ] `EXTENSION_SHARED_SECRET` is strong (32+ chars base64)
- [ ] `NEXT_PUBLIC_BACKEND_URL` points to deployed backend
- [ ] Environment variables set in Vercel dashboard
- [ ] Extension updated to use production backend URL
- [ ] Extension package tested in Chrome/Edge
- [ ] Rate limiting configured (10 req/min per IP)
- [ ] Logging enabled for Vercel log drains

### Development Environment

For development without deploying to Vercel:

```bash
# Terminal 1: Start local backend
npm run dev
# Starts at http://localhost:3000

# Terminal 2: Build extension and watch
npm run build:ext --watch

# Browser: Load http://localhost:3000 as backend in trpcClient.ts
```

---

## Verification Checklist

### Backend Tests

```bash
# Run all tests
npm run test

# Check coverage
npm run test:coverage

# Run only OG router tests
npm run test -- server/trpc/routers/og.test.ts
```

### Extension Tests

```bash
# Run extension component tests
npm run test -- extension/tests

# Run e2e tests (requires extension built)
npm run test:e2e
```

### Manual Testing

1. **Login Flow:**
   - Open extension popup
   - Enter Bluesky credentials
   - Verify session is stored

2. **OG Fetch:**
   - Paste URL in Bluesky composer
   - Verify card appears with title, description, image

3. **Post Creation:**
   - Click "Post with Card"
   - Verify post appears on Bluesky with embed

4. **Error Handling:**
   - Try URL from non-allowed domain (should show error)
   - Try invalid credentials (should show error)
   - Make 11+ requests in 1 minute (should rate limit)

---

## Rollback & Troubleshooting

### Rollback to Previous Version

In Vercel Dashboard:

1. Go to **Deployments**
2. Find the previous working deployment
3. Click **...** → **Promote to Production**

### Common Issues

#### Extension Won't Connect to Backend

**Problem:** "Network error" or "Request timed out"

**Solution:**
1. Verify `NEXT_PUBLIC_BACKEND_URL` is correct
2. Check CORS: ensure `ALLOWED_ORIGIN` is not set or matches extension origin
3. Verify `EXTENSION_SHARED_SECRET` matches between extension and backend
4. Check backend logs in Vercel dashboard

#### Rate Limiting Too Strict

**Problem:** Getting "Rate limit exceeded" immediately

**Solution:**
- Current limit is 10 requests per minute per IP
- For development: modify `RATE_LIMIT` in `server/trpc/routers/og.ts`
- For production: use Redis-backed rate limiter (see [CONFIGURATION.md](./CONFIGURATION.md))

#### Image Upload Fails

**Problem:** Posts created but no thumbnail

**Solution:**
1. Verify OG image URL is accessible
2. Check image is JPEG/PNG format
3. Verify Bluesky API token is valid
4. Check backend logs for upload errors

#### Domain Not Allowed

**Problem:** "Domain not allowed" error

**Solution:**
- Only thehill.com, theroot.com, usanews.com are whitelisted
- To add domains: edit `ALLOWED_DOMAINS` in `server/trpc/routers/og.ts`
- Test locally first, then deploy

### Enable Debug Logging

**Backend:**
```typescript
// In server/log.ts
export const log = {
  info: (msg: string, data?: Record<string, unknown>) => {
    console.log(JSON.stringify({ level: 'info', msg, ...data }));
  },
  // ...
};
```

**Extension:**
```typescript
// In extension/src/background.ts or contentScript.tsx
console.log('DEBUG:', message);
// Check in Browser DevTools Console
```

### Vercel Support

If issues persist:
1. Check Vercel Function logs: Dashboard → Deployments → Logs
2. Check build logs: Dashboard → Deployments → Build Logs
3. Contact Vercel support: https://vercel.com/support

---

## Production Readiness Checklist

- [ ] All tests passing (`npm run test` and `npm run test:coverage`)
- [ ] No console errors in production build
- [ ] Backend deployed to Vercel with environment variables set
- [ ] Extension tested in production mode
- [ ] Rate limiter working as expected
- [ ] Error messages clear and helpful
- [ ] Logging configured for observability
- [ ] Documentation updated with deployment URLs
- [ ] Team has access to Vercel dashboard
- [ ] Backup strategy in place (Vercel + Git history)
