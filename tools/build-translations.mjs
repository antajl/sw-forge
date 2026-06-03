#!/usr/bin/env node

/**
 * Combine translations-en.js + translations-ru.js → js/core/translations.js (build artifact).
 * FR stays in translations-fr.js and loads lazily — not bundled here.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const enPath = path.join(rootDir, 'js/core/translations-en.js');
const ruPath = path.join(rootDir, 'js/core/translations-ru.js');
const outputPath = path.join(rootDir, 'js/core/translations.js');

function extractObjectBody(filePath, label) {
  if (!fs.existsSync(filePath)) {
    console.error(`Error: ${label} not found at ${filePath}`);
    process.exit(1);
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  const start = content.indexOf('{');
  const end = content.lastIndexOf('}');
  if (start < 0 || end <= start) {
    console.error(`Error: could not parse object in ${label}`);
    process.exit(1);
  }
  return content.substring(start + 1, end).trim();
}

const enBody = extractObjectBody(enPath, 'translations-en.js');
const ruBody = extractObjectBody(ruPath, 'translations-ru.js');

const output = `// js/core/translations.js — Combined EN/RU translations (build artifact)
// Generated from translations-en.js + translations-ru.js — DO NOT EDIT MANUALLY
// French: js/core/translations-fr.js (lazy-loaded on language switch)

const TRANSLATIONS = {
  en: {
    ${enBody}
  },
  ru: {
    ${ruBody}
  }
};
`;

fs.writeFileSync(outputPath, output, 'utf-8');
console.log(`Build complete: ${outputPath}`);
