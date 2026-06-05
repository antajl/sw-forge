#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const shellPath = path.join(rootDir, 'index-shell.html');
const outputPath = path.join(rootDir, 'index.html');

const includePattern = /<!-- @include (.+?) -->/g;

function resolveIncludes(content) {
  let out = content;
  let pass = 0;
  for (;;) {
    const hits = [...out.matchAll(includePattern)];
    if (!hits.length) break;
    pass += 1;
    for (const m of hits) {
      const partialPath = m[1].trim();
      const partialFilePath = path.join(rootDir, partialPath);
      if (!fs.existsSync(partialFilePath)) {
        console.error(`Error: Partial file not found: ${partialFilePath}`);
        process.exit(1);
      }
      const partialContent = fs.readFileSync(partialFilePath, 'utf-8');
      out = out.replace(m[0], partialContent);
      console.log(`Included: ${partialPath}`);
    }
    if (pass > 20) {
      console.error('Error: too many nested @include passes (cycle?)');
      process.exit(1);
    }
  }
  return out;
}

let content = fs.readFileSync(shellPath, 'utf-8');
content = resolveIncludes(content);
fs.writeFileSync(outputPath, content, 'utf-8');
console.log(`Build complete: ${outputPath}`);
