// Copy bundled Tailwind CSS from the root public folder into the built extension assets
// so the extension uses a locally bundled stylesheet instead of a remote CDN.
const fs = require('fs');
const path = require('path');

try {
  const src = path.resolve(__dirname, '../../public/tailwind.css');
  const destDir = path.resolve(__dirname, '../../extension/dist');
  const dest = path.resolve(destDir, 'tailwind.css');

  if (!fs.existsSync(src)) {
    console.warn('[copy-tailwind-css] Source CSS not found:', src);
    process.exit(0);
  }

  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  fs.copyFileSync(src, dest);
  console.log('[copy-tailwind-css] Copied', src, '→', dest);
} catch (err) {
  console.error('[copy-tailwind-css] Failed to copy Tailwind CSS:', err);
  process.exit(1);
}
