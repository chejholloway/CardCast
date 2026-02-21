#!/usr/bin/env node
/** Quick validation script for extension build outputs */
const fs = require('fs');
const path = require('path');

// distSrc is at repo root: src/extension/dist
const distSrc = path.resolve(__dirname, '..', '..', 'src', 'extension', 'dist');
// distLegacy is at extension/dist (legacy packaging)
const distLegacy = path.resolve(__dirname, '..', '..', 'extension', 'dist');

const assets = [
  'background.js',
  'contentScript.js',
  'popup.js',
  'popup.html',
  'manifest.json',
  'config.js',
  'trpcClient.js',
  'types.js',
  path.join('icons', 'icon-16.png'),
  path.join('icons', 'icon-32.png'),
  path.join('icons', 'icon-48.png'),
  path.join('icons', 'icon-128.png'),
  path.join('icons', 'icon-256.png'),
  path.join('icons', 'icon-512.png'),
];

let allPresent = true;
for (const rel of assets) {
  const p1 = path.join(distSrc, rel);
  const p2 = path.join(distLegacy, rel);
  const exist1 = fs.existsSync(p1);
  const exist2 = fs.existsSync(p2);
  if (!exist1 && !exist2) {
    console.error(
      `Missing asset: ${rel} (neither ${distSrc} nor ${distLegacy} contain it)`
    );
    console.error(`Checked paths: ${p1} => ${exist1}, ${p2} => ${exist2}`);
    allPresent = false;
  } else {
    console.log(`OK: ${rel} found in ${exist1 ? p1 : p2}`);
  }
}

if (!allPresent) {
  process.exit(1);
} else {
  console.log('✅ All extension build assets exist in dist/');
  process.exit(0);
}
