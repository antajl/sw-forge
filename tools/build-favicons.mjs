/**
 * Resize assets/favicon.png → favicon-16.png, favicon-32.png, apple-touch-icon.png
 */
import sharp from 'sharp';
import { existsSync } from 'fs';
import { join } from 'path';

const root = join(import.meta.dirname, '..');
const src = join(root, 'assets', 'favicon.png');

if (!existsSync(src)) {
  console.error('Missing assets/favicon.png');
  process.exit(1);
}

const out = [
  { file: 'favicon-16.png', size: 16 },
  { file: 'favicon-32.png', size: 32 },
  { file: 'apple-touch-icon.png', size: 180 },
];

for (const { file, size } of out) {
  const dest = join(root, 'assets', file);
  await sharp(src)
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(dest);
  console.log(`wrote assets/${file} (${size}×${size})`);
}
