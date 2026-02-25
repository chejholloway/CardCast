#!/usr/bin/env node
'use strict';

// Guard script to ensure Cloudflare deploys run from repo root and target canonical dist-extension path.
const fs = require('fs');
const path = require('path');

const cwd = process.cwd();
const root = path.resolve(cwd);
const wranglerToml = path.resolve(root, 'wrangler.toml');
const canonicalOutput = path.resolve(
  root,
  'extension/dist-extension/service-worker-loader.js'
);

function exists(p) {
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
}

let errors = [];
let ok = true;

const inExtensionDir = path.basename(cwd).toLowerCase() === 'extension';
if (inExtensionDir) {
  ok = false;
  errors.push(
    'Do not run deploy from inside the extension/ directory. Run from the repository root (CardCast).'
  );
}

if (!exists(wranglerToml)) {
  ok = false;
  errors.push(
    'wrangler.toml not found at repo root. Ensure you are in the repository root when deploying.'
  );
}

if (!exists(canonicalOutput)) {
  ok = false;
  errors.push(
    `Canonical build output not found at ${canonicalOutput}. Please run the build first (npm run build:cf).`
  );
}

if (!ok) {
  console.error('Deployment guard failed:');
  errors.forEach((e) => console.error('- ' + e));
  process.exit(1);
}

console.log('Deployment guard passed: canonical paths verified.');
process.exit(0);
