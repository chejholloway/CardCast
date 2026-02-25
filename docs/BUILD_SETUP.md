# Extension Build Setup Guide

This guide explains how to build the extension with the correct production configuration.

## Quick Start

1. **Use the correct Node.js version**:
   - This repo targets Node `22.x`.

2. **Set up your environment variables**:
   - Create `extension/.env` (local dev) or set environment variables in CI/CD.
   - Required values:
     - `NEXT_PUBLIC_BACKEND_URL`
     - `EXTENSION_SHARED_SECRET`

3. **Build the browser extension (for loading unpacked)**:

   ```bash
   npm run build:ext
   ```

   This will:
   - Build the unpacked extension output in `extension/dist/`

4. **Load in browser**:
   - Open `chrome://extensions` (or `edge://extensions`)
   - Enable **Developer Mode**
   - Click **"Load unpacked"**
   - Select the `extension/dist/` folder

## Cloudflare Workers Builds / Wrangler deploy

Cloudflare Workers Builds runs a build command (commonly `npm run build`) and then runs `npx wrangler deploy`.

There are two different extension build outputs used by this repo:
- `npm run build:ext` writes to `extension/dist/` (this is the folder you load unpacked in your browser).
- `npm run build:cf` writes to `extension/dist-extension/` (this is the folder Wrangler deploys as assets).

Vite prints output paths relative to the Vite `root` (configured as `extension/` in `extension/vite.config.ts`), so seeing `dist/...` or `dist-extension/...` in the build logs still corresponds to `extension/dist/...` and `extension/dist-extension/...` on disk.

This repo expects Wrangler to find:
- `main` at `extension/dist-extension/service-worker-loader.js`
- static assets at `./extension/dist-extension`

To produce that directory locally or in CI, run:

```bash
npm run build:cf
```

`build:cf` writes to `extension/dist-extension/` (not `extension/extension/dist-extension/`). If you see a double-nested output path, ensure the `--outDir` passed to Vite is `dist-extension` (relative to the Vite config root at `extension/`).

If your deployment pipeline uses `npm run build`, it should also produce the same directory.

## How It Works

The build process uses `extension/scripts/generate-config.js` to:

1. Read environment variables from `extension/.env` file (or `process.env`)
2. Generate `extension/src/config.ts` with the values
3. The extension code imports from `config.ts` instead of using `process.env` directly

This is necessary because browser extensions can't access `process.env` at runtime.

## Updating Configuration

To change the backend URL or secret:

1. **Option 1: Edit `.env` file** (recommended for local development):

   ```bash
   # Edit extension/.env
   NEXT_PUBLIC_BACKEND_URL=https://your-new-url.vercel.app
   EXTENSION_SHARED_SECRET=your-new-secret
   ```

2. **Option 2: Set environment variables** (for CI/CD):

   ```bash
   export NEXT_PUBLIC_BACKEND_URL=https://your-new-url.vercel.app
   export EXTENSION_SHARED_SECRET=your-new-secret
   npm run build:ext
   ```

3. **Rebuild**:
   ```bash
   npm run build:ext
   ```

## Important Notes

- **Never commit `.env` files** - They're gitignored for security
- **The secret must match** between:
  - Your Vercel environment variables (`EXTENSION_SHARED_SECRET`)
  - Your extension `.env` file
- **The config file is auto-generated** - Don't edit `extension/src/config.ts` manually

## Troubleshooting

**Build fails with "Cannot find module './config'"**:

- Make sure you run `npm run build:ext` (not just `tsc`)
- The script generates `config.ts` before compiling

**Extension can't connect to backend**:

- Verify the backend URL is correct
- Check that the secret matches in Vercel
- Make sure your Vercel deployment is live

**Secret shows as "REPLACE_WITH_REAL_SECRET"**:

- Check that `extension/.env` exists and has `EXTENSION_SHARED_SECRET` set
- Or set the environment variable before building
