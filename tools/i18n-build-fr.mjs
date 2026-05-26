import fs from 'fs';
import { translateEn } from './i18n-fr-translate.mjs';

const enMissing = JSON.parse(fs.readFileSync('tools/en-missing.json', 'utf8'));
let frSrc = fs.readFileSync('js/core/i18n-fr.js', 'utf8');
const existingKeys = new Set([...frSrc.matchAll(/^\s+(\w+):/gm)].map((m) => m[1]));

const additions = [];
for (const [key, enVal] of Object.entries(enMissing)) {
  if (existingKeys.has(key)) continue;
  const fr = translateEn(enVal);
  const esc = fr.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  additions.push(`  ${key}: '${esc}',`);
}

if (!additions.length) {
  console.log('no FR keys to add');
  process.exit(0);
}

const idx = frSrc.lastIndexOf('};');
if (idx < 0) throw new Error('i18n-fr.js: missing closing };');
frSrc = `${frSrc.slice(0, idx)}\n${additions.join('\n')}\n};`;
fs.writeFileSync('js/core/i18n-fr.js', frSrc);
console.log('added', additions.length, 'FR keys');
