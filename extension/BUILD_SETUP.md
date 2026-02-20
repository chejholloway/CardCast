# Extension Build Setup Guide

This guide explains how to build the extension with the correct production configuration.

## Quick Start

1. **Set up your environment variables** (already done for you):
   - The `.env` file in `extension/` directory contains your production values
   - Backend URL: `https://bluesky-card-cast-extension-8u6iubpsm-chejholloway1s-projects.vercel.app`
   - Secret: `PHmqQj/o6pl0/7EN1+a1489n5DXvdLo3cs0tAbGoQAs=`

2. **Build the extension**:

   ```bash
   npm run build:ext
   ```

   This will:
   - Generate `extension/src/config.ts` from your `.env` file
   - Compile TypeScript to JavaScript in `extension/dist/`

3. **Load in browser**:
   - Open `chrome://extensions` (or `edge://extensions`)
   - Enable **Developer Mode**
   - Click **"Load unpacked"**
   - Select the `extension/dist/` folder

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
