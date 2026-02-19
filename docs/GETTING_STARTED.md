# Getting Started - CardCast

This guide will help you set up a local development environment and start working on CardCast.

## Prerequisites

- **Node.js**: 18+ (download from https://nodejs.org/)
- **Git**: For version control
- **Chrome or Edge Browser**: For testing the extension (Firefox support coming later)
- **Code Editor**: VS Code recommended (https://code.visualstudio.com/)
- **Bluesky Account**: For testing login and posting

### Verify Installation

```bash
node --version    # Should be v18.0.0 or higher
npm --version     # Should be 9.0.0 or higher
git --version
```

---

## Quick Setup (5 minutes)

### 1. Clone Repository

```bash
git clone https://github.com/your-org/cardcast.git
cd cardcast
```

### 2. Install Dependencies

```bash
npm install
```

This installs dependencies for the entire monorepo:
- Backend (Next.js, tRPC, @atproto/api)
- Extension (React, React Query)
- Testing (Vitest, React Testing Library, MSW)

### 3. Create Environment File

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
NODE_ENV=development
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
BLUESKY_SERVICE_URL=https://bsky.social
EXTENSION_SHARED_SECRET=dev-secret-min-16-characters-long!!!
```

### 4. Start Backend

```bash
npm run dev
```

You should see:
```
> ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

The backend is now running locally! ✅

### 5. In a New Terminal: Build Extension

```bash
npm run build:ext
```

Creates compiled extension in `extension/dist/`.

### 6. Load Extension in Browser

#### Chrome/Chromium/Edge:

1. Open `chrome://extensions` (or `edge://extensions`)
2. Enable **Developer Mode** (top-right toggle)
3. Click **"Load unpacked"**
4. Select the `extension/dist/` folder
5. Extension appears in your toolbar (CardCast icon)

#### Firefox (MV2 only, not yet supported for MV3):

Coming in a future release.

### 7. Test It Out

1. Go to https://bsky.app
2. Log in with your Bluesky account
3. Open the **CardCast popup** (click extension icon)
4. Click **Login** and enter your Bluesky credentials (use an app password)
5. Click the **Compose** button on Bluesky
6. Paste a URL like `https://thehill.com/opinion/...`
7. You should see a **link card preview** appear!
8. Click **Post with Card** to post it

---

## Project Structure

```
cardcast/
├── app/                           # Next.js app directory
│   ├── api/
│   │   └── trpc/[trpc]/route.ts  # tRPC HTTP handler
│   ├── layout.tsx                 # Root layout
│   └── page.tsx                   # Homepage
├── server/                        # Backend (Next.js backend)
│   ├── env.ts                     # Environment validation (Zod)
│   ├── log.ts                     # JSON logging
│   └── trpc/
│       ├── base.ts                # tRPC setup, protectedProcedure
│       ├── router.ts              # App router combining sub-routers
│       ├── trpcContext.ts         # tRPC context (request, headers)
│       └── routers/
│           ├── auth.ts            # Login, status
│           ├── og.ts              # Fetch OG metadata
│           └── post.ts            # Create Bluesky posts
├── extension/                     # Chrome/Edge extension (Manifest V3)
│   ├── manifest.json             # Extension metadata
│   ├── src/
│   │   ├── background.ts         # Service worker (main logic)
│   │   ├── contentScript.tsx     # Injects into bsky.app
│   │   ├── popup.tsx             # Extension popup UI
│   │   ├── trpcClient.ts         # tRPC client config
│   │   └── types/
│   │       └── chrome.d.ts       # Chrome API types
│   └── tests/
│       ├── LinkCardComposer.test.tsx
│       ├── Popup.test.tsx
│       └── testUtils.tsx
├── server/tests/                  # Backend tests
│   ├── auth.test.ts
│   ├── og.test.ts
│   ├── post.test.ts
│   └── testHelpers.ts
├── styles/                        # Global CSS
│   └── globals.css
├── docs/                          # Documentation
│   ├── DEPLOYMENT.md
│   ├── CONFIGURATION.md
│   └── GETTING_STARTED.md (this file)
├── package.json                   # Monorepo dependencies
├── tsconfig.json                  # TypeScript config
├── vitest.config.ts              # Test config
└── .env.example                  # Environment template
```

---

## Common Development Tasks

### Start Backend & Extension Together

**Terminal 1 - Backend:**
```bash
npm run dev
```

**Terminal 2 - Extension (watch mode):**
```bash
npm run build:ext -- --watch
```

Whenever you edit extension files, they're recompiled automatically.

### Run Tests

```bash
# Run all tests (unit + integration)
npm run test

# Watch mode (rerun on file changes)
npm run test -- --watch

# Coverage report
npm run test:coverage

# Specific test file
npm run test -- server/trpc/routers/auth.test.ts

# Run E2E tests (requires extension built)
npm run test:e2e
```

### Build for Production

```bash
# Backend
npm run build

# Extension
npm run build:ext

# Check for TypeScript errors
npm run type-check

# Lint code
npm run lint
```

### Debug the Extension

#### In Chrome DevTools:

1. Open `chrome://extensions`
2. Find **CardCast**
3. Click **Details** → **Inspect views** → **background page**
4. DevTools opens for the service worker
5. Set breakpoints in your code

#### View Content Script Logs:

1. Right-click any page element on bsky.app
2. Select **Inspect**
3. Go to **Console** tab
4. Logs from content script appear here

#### View Popup Logs:

1. Click the CardCast extension icon
2. Right-click the popup → **Inspect**
3. Console shows logs from popup UI

### Hot Reload Extension

Edit `extension/src/popup.tsx` → changes visible in extension popup immediately (React HMR).

For service worker changes, you need to reload:
1. Go to `chrome://extensions`
2. Find CardCast
3. Click the refresh icon

---

## Debugging Common Issues

### Extension Won't Load

**Error:** "Cannot load extension"

**Solution:**
1. Verify `extension/dist/` folder exists
2. Try rebuilding: `npm run build:ext`
3. Check for `manifest.json` in `extension/dist/`
4. Reload the extension in DevTools

### Backend Won't Start

**Error:** "Port 3000 already in use"

**Solution:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
npm run dev -- -p 3001
# Then update .env.local: NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

### Extension Can't Connect to Backend

**Error:** "Network error" or "UNAUTHORIZED"

**Check:**
1. Is backend running? (`npm run dev`)
2. Does `NEXT_PUBLIC_BACKEND_URL` in `.env.local` match?
3. Does `EXTENSION_SHARED_SECRET` match in both places?
4. Check browser DevTools for actual error message

### Tests Fail

**Common issues:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Run tests in verbose mode
npm run test -- --reporter=verbose

# Run specific failed test
npm run test -- --grep "test name"
```

### TypeScript Errors

The codebase uses strict TypeScript mode. Verify:

```bash
npm run type-check
```

Fix errors before committing.

---

## Environment Variables Explained

| Variable | Purpose | Example |
|----------|---------|---------|
| `NODE_ENV` | Runtime environment | `development` |
| `NEXT_PUBLIC_BACKEND_URL` | Extension → Backend URL | `http://localhost:3000` |
| `BLUESKY_SERVICE_URL` | Bluesky ATP service | `https://bsky.social` |
| `EXTENSION_SHARED_SECRET` | API auth secret | 32+ char string |

See [CONFIGURATION.md](./CONFIGURATION.md) for detailed explanations.

---

## Git Workflow

### Create a Branch

```bash
git checkout -b feature/your-feature-name
```

### Make Changes

```bash
# Check what changed
git status

# Stage changes
git add .

# Commit with conventional message
git commit -m "feat(router): add new endpoint"
```

### Push & Create PR

```bash
git push origin feature/your-feature-name
```

Then create a pull request on GitHub.

### Commit Message Format

Use conventional commits:
- `feat(scope): description` - New feature
- `fix(scope): description` - Bug fix
- `docs(scope): description` - Documentation
- `refactor(scope): description` - Code refactoring
- `test(scope): description` - Tests

Example:
```
feat(og-router): add domain management UI
fix(extension): handle network timeout gracefully
docs(deployment): add production checklist
```

---

## Testing Your Changes

### Before Committing

```bash
# Type check
npm run type-check

# Lint
npm run lint

# Tests
npm run test

# Build
npm run build
npm run build:ext
```

### Testing the Extension

1. Load the extension in Chrome
2. Test on https://bsky.app
3. Try multiple scenarios:
   - Login success/failure
   - Post with OG card
   - Error handling (bad domain, network timeout)

### Creating Tests

Add tests alongside your code:

**For server:**
```typescript
// server/trpc/routers/my-router.test.ts
import { describe, it, expect } from 'vitest';
import { createTestCaller } from '../testHelpers';

describe('myRouter', () => {
  it('should do something', async () => {
    const caller = createTestCaller();
    const result = await caller.myRouter.myProcedure({ /* input */ });
    expect(result).toEqual({ /* expected */ });
  });
});
```

See existing tests in `server/trpc/routers/*.test.ts` for examples.

---

## IDE Setup (VS Code)

### Recommended Extensions

1. **ES Lint** - Code linting
2. **Prettier** - Code formatting  
3. **TypeScript Vue Plugin** - TypeScript support
4. **Jest** or **Vitest** - Test runner integration
5. **REST Client** - Test API endpoints

### VS Code Settings

Create `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.tsdk": "node_modules/typescript/lib",
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

### Debug in VS Code

Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Next.js dev server",
      "skipFiles": ["<node_internals>/**"],
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"]
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Run Tests",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "test"]
    }
  ]
}
```

Then press `F5` to debug.

---

## Next Steps

1. **Read** [README.md](../README.md) for architecture overview
2. **Explore** the code structure above
3. **Run tests** to understand test patterns
4. **Make a small change** and test it locally
5. **Read** [CONFIGURATION.md](./CONFIGURATION.md) for customization
6. **Deploy** using [DEPLOYMENT.md](./DEPLOYMENT.md) when ready

---

## Getting Help

- **Code Issues?** Check [GitHub Issues](https://github.com/your-org/cardcast/issues)
- **Questions?** Post in [GitHub Discussions](https://github.com/your-org/cardcast/discussions)
- **Bug Report?** Create an issue with:
  - What you were doing
  - What happened
  - What you expected
  - Error messages (with screenshots if helpful)

---

## Community & Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests & type checking
5. Commit with conventional messages
6. Create a pull request

See [CONTRIBUTING.md](../CONTRIBUTING.md) (if available) for more details.

---

**Have fun building! 🚀**
