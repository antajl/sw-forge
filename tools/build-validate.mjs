#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

let errors = 0;

// Check for hardcoded hex colors in CSS (warning only)
function checkHexColors() {
  const cssDir = path.join(rootDir, 'css');
  const hexPattern = /#[0-9a-fA-F]{6}/g;
  
  function scanDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanDir(fullPath);
      } else if (file.endsWith('.css') && !file.includes('dist')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const matches = content.match(hexPattern);
        if (matches) {
          console.warn(`Found ${matches.length} hardcoded hex colors in ${path.relative(rootDir, fullPath)} (warning only)`);
        }
      }
    }
  }
  
  scanDir(cssDir);
}

// Check for missing translation keys
function checkTranslations() {
  const enPath = path.join(rootDir, 'js/core/translations-en.js');
  const ruPath = path.join(rootDir, 'js/core/translations-ru.js');
  
  if (!fs.existsSync(enPath) || !fs.existsSync(ruPath)) {
    console.error('Translation files not found');
    errors++;
    return;
  }
  
  const enContent = fs.readFileSync(enPath, 'utf8');
  const ruContent = fs.readFileSync(ruPath, 'utf8');
  
  // Extract keys from TRANSLATIONS object
  const enKeys = extractKeys(enContent);
  const ruKeys = extractKeys(ruContent);
  
  const missingInRu = enKeys.filter(k => !ruKeys.includes(k));
  const missingInEn = ruKeys.filter(k => !enKeys.includes(k));
  
  if (missingInRu.length) {
    console.error(`Missing ${missingInRu.length} keys in RU translations:`, missingInRu.slice(0, 5));
    errors += missingInRu.length;
  }
  
  if (missingInEn.length) {
    console.error(`Missing ${missingInEn.length} keys in EN translations:`, missingInEn.slice(0, 5));
    errors += missingInEn.length;
  }
}

function extractKeys(content) {
  const match = content.match(/TRANSLATIONS\s*=\s*\{([\s\S]*?)\n\};/);
  if (!match) return [];
  
  const objContent = match[1];
  const keys = [];
  const keyPattern = /'([^']+)'\s*:/g;
  let matchResult;
  
  while ((matchResult = keyPattern.exec(objContent)) !== null) {
    keys.push(matchResult[1]);
  }
  
  return keys;
}

console.log('Running build validation...');
checkHexColors();
checkTranslations();

if (errors > 0) {
  console.error(`Build validation failed with ${errors} errors`);
  process.exit(1);
} else {
  console.log('Build validation passed');
}
