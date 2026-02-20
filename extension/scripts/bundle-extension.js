#!/usr/bin/env node
/* Bundles extension entrypoints for browser environment using esbuild */
const path = require('path');
const esbuild = require('esbuild');

const entries = [
  {
    in: path.join(__dirname, '..', 'src', 'background.ts'),
    out: path.join(__dirname, '..', 'dist', 'background.js'),
  },
  {
    in: path.join(__dirname, '..', 'src', 'contentScript.tsx'),
    out: path.join(__dirname, '..', 'dist', 'contentScript.js'),
  },
  {
    in: path.join(__dirname, '..', 'src', 'popup.tsx'),
    out: path.join(__dirname, '..', 'dist', 'popup.js'),
  },
];

async function bundleAll() {
  try {
    await Promise.all(
      entries.map((e) =>
        esbuild
          .build({
            entryPoints: [e.in],
            bundle: true,
            format: 'esm',
            platform: 'browser',
            outfile: e.out,
            logLevel: 'info',
            target: 'es2020',
          })
          .catch((err) => {
            throw err;
          })
      )
    );
    console.log('✅ Extension bundles created');
  } catch (err) {
    console.error('❌ Bundle failed:', err);
    process.exit(1);
  }
}

bundleAll();
