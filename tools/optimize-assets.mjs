#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const assetsDir = path.join(rootDir, 'assets');
const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp'];
let optimizedCount = 0;
let totalSizeBefore = 0;
let totalSizeAfter = 0;

async function optimizeImage(filePath) {
  try {
    const stats = fs.statSync(filePath);
    totalSizeBefore += stats.size;

    const image = sharp(filePath);
    const metadata = await image.metadata();

    // Convert to WebP with quality 80
    const webpPath = filePath.replace(/\.(png|jpg|jpeg)$/i, '.webp');
    
    await image
      .webp({ quality: 80 })
      .toFile(webpPath);

    const webpStats = fs.statSync(webpPath);
    totalSizeAfter += webpStats.size;
    optimizedCount++;

    const savings = ((stats.size - webpStats.size) / stats.size * 100).toFixed(1);
    console.log(`${path.relative(rootDir, filePath)} → ${path.relative(rootDir, webpPath)} (${stats.size} → ${webpStats.size} bytes, ${savings}% saved)`);
  } catch (e) {
    console.error(`Error optimizing ${filePath}:`, e.message);
  }
}

async function scanDir(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      await scanDir(fullPath);
    } else if (imageExtensions.includes(path.extname(file).toLowerCase())) {
      // Skip if already WebP
      if (path.extname(file).toLowerCase() === '.webp') continue;
      await optimizeImage(fullPath);
    }
  }
}

console.log('Optimizing assets...');
await scanDir(assetsDir);

if (optimizedCount > 0) {
  const totalSavings = ((totalSizeBefore - totalSizeAfter) / totalSizeBefore * 100).toFixed(1);
  console.log(`\nOptimized ${optimizedCount} images`);
  console.log(`Total size: ${totalSizeBefore} → ${totalSizeAfter} bytes (${totalSavings}% saved)`);
} else {
  console.log('No images to optimize');
}
