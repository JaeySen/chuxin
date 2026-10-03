import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const FFMPEG_PATH = '/opt/local/bin/ffmpeg';
const PUBLIC_DIR = path.resolve('apps/react/public');

async function processDirectory(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await processDirectory(fullPath);
    } else {
      await optimizeFile(fullPath);
    }
  }
}

async function optimizeFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (!['.jpg', '.jpeg', '.png', '.pdf'].includes(ext)) return;

  const baseName = path.basename(filePath, path.extname(filePath));
  const dirName = path.dirname(filePath);
  const webpPath = path.join(dirName, `${baseName}.webp`);

  try {
    const srcStat = await fs.stat(filePath);
    const webpStat = await fs.stat(webpPath);
    if (webpStat.mtimeMs >= srcStat.mtimeMs) {
      return; // Skip, already optimized
    }
  } catch (e) {
    // WebP doesn't exist, proceed
  }

  console.log(`Optimizing: ${path.relative(PUBLIC_DIR, filePath)}`);

  let cmd = '';
  if (ext === '.jpg' || ext === '.jpeg') {
    cmd = `"${FFMPEG_PATH}" -y -i "${filePath}" -c:v libwebp -quality 85 "${webpPath}"`;
  } else if (ext === '.png') {
    cmd = `"${FFMPEG_PATH}" -y -i "${filePath}" -c:v libwebp -lossless 1 -compression_level 6 "${webpPath}"`;
  } else if (ext === '.pdf') {
    cmd = `"${FFMPEG_PATH}" -y -i "${filePath}" -vf "scale=1240:-1" -c:v libwebp -quality 85 "${webpPath}"`;
  }

  try {
    await execAsync(cmd);
    console.log(`✅ Created: ${path.basename(webpPath)}`);
  } catch (err) {
    console.error(`❌ Failed to convert ${filePath}:`, err.message);
  }
}

console.log('🖼️  Starting media optimization to WebP...');
await processDirectory(PUBLIC_DIR);
console.log('✨ Media optimization complete!');
