#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const shellPath = path.join(rootDir, 'index-shell.html');
const outputPath = path.join(rootDir, 'index.html');

// Read shell template
let content = fs.readFileSync(shellPath, 'utf-8');

// Find all include markers
const includePattern = /<!-- @include (.+?) -->/g;
let match;
const replacements = [];

while ((match = includePattern.exec(content)) !== null) {
  const [fullMatch, partialPath] = match;
  replacements.push({ fullMatch, partialPath });
}

// Replace each marker with partial content
for (const { fullMatch, partialPath } of replacements) {
  const partialFilePath = path.join(rootDir, partialPath);
  
  if (!fs.existsSync(partialFilePath)) {
    console.error(`Error: Partial file not found: ${partialFilePath}`);
    process.exit(1);
  }
  
  const partialContent = fs.readFileSync(partialFilePath, 'utf-8');
  content = content.replace(fullMatch, partialContent);
  console.log(`Included: ${partialPath}`);
}

// Write output
fs.writeFileSync(outputPath, content, 'utf-8');
console.log(`Build complete: ${outputPath}`);
