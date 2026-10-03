import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, '../public');
const DIST_DIR = path.resolve(__dirname, '../dist');

async function syncMtime(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await syncMtime(fullPath);
    } else {
      const relativePath = path.relative(DIST_DIR, fullPath);
      const publicPath = path.join(PUBLIC_DIR, relativePath);
      try {
        const publicStat = await fs.stat(publicPath);
        await fs.utimes(fullPath, publicStat.atime, publicStat.mtime);
      } catch (e) {
        // File doesn't exist in public/, ignore
      }
    }
  }
}

console.log('🕒 Syncing modification times for public assets...');
await syncMtime(DIST_DIR);
console.log('✨ Mtime sync complete!');
