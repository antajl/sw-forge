#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const shellPath = path.join(rootDir, 'index-shell.html');
const outputPath = path.join(rootDir, 'index.html');

const includePattern = /<!-- @include (.+?) -->/g;

function getFileHash(filePath) {
  const content = fs.readFileSync(filePath);
  return createHash('md5').update(content).digest('hex').substring(0, 8);
}

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

// Add hash-based cache busting
const cssPath = path.join(rootDir, 'css/dist/app.css');
const uiJsPath = path.join(rootDir, 'js/ui.js');
const translationsPath = path.join(rootDir, 'js/core/translations.js');

if (fs.existsSync(cssPath)) {
  const cssHash = getFileHash(cssPath);
  content = content.replace(/css\/dist\/app\.css\?v=[^"]+/g, `css/dist/app.css?v=${cssHash}`);
  console.log(`CSS hash: ${cssHash}`);
}

if (fs.existsSync(uiJsPath)) {
  const jsHash = getFileHash(uiJsPath);
  content = content.replace(/js\/ui\.js\?v=[^"]+/g, `js/ui.js?v=${jsHash}`);
  console.log(`UI.js hash: ${jsHash}`);
}

if (fs.existsSync(translationsPath)) {
  const translationsHash = getFileHash(translationsPath);
  content = content.replace(/js\/core\/translations\.js\?v=[^"]+/g, `js/core/translations.js?v=${translationsHash}`);
  console.log(`Translations.js hash: ${translationsHash}`);
}

fs.writeFileSync(outputPath, content, 'utf-8');
console.log(`Build complete: ${outputPath}`);
