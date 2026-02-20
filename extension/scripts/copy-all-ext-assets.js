/** Copy assets from src/extension/dist to extension/dist (no delete) */
const fs = require('fs');
const path = require('path');

const srcRoot = path.resolve(__dirname, '..', 'src', 'extension', 'dist');
const dstRoot = path.resolve(__dirname, '..', '..', 'extension', 'dist');

function copyRecursive(srcDir, dstDir) {
  if (!fs.existsSync(srcDir)) return;
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const ent of entries) {
    const srcPath = path.join(srcDir, ent.name);
    const dstPath = path.join(dstDir, ent.name);
    if (ent.isDirectory()) {
      copyRecursive(srcPath, dstPath);
    } else if (ent.isFile()) {
      const dir = path.dirname(dstPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.copyFileSync(srcPath, dstPath);
    }
  }
}

try {
  copyRecursive(srcRoot, dstRoot);
  console.log(
    '✅ Copied assets from src/extension/dist to extension/dist (no-delete)'
  );
} catch (e) {
  console.warn('⚠️  Failed to copy assets:', e);
}
