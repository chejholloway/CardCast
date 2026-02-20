/**
 * Refresh extension/dist to be an exact mirror of src/extension/dist.
 * This deletes the existing extension/dist and copies fresh assets from src/extension/dist.
 */
const fs = require('fs');
const path = require('path');

const srcRoot = path.resolve(__dirname, '..', 'src', 'extension', 'dist');
const dstRoot = path.resolve(__dirname, '..', '..', 'extension', 'dist');

function rmdirRecursive(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir)) {
    const p = path.join(dir, entry);
    if (fs.lstatSync(p).isDirectory()) {
      rmdirRecursive(p);
    } else {
      fs.unlinkSync(p);
    }
  }
  fs.rmdirSync(dir);
}

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
  if (fs.existsSync(dstRoot)) {
    rmdirRecursive(dstRoot);
  }
  copyRecursive(srcRoot, dstRoot);
  console.log('✅ Refreshed extension/dist from src/extension/dist');
} catch (err) {
  console.warn('⚠️  Failed to refresh extension/dist:', err);
  process.exit(1);
}
