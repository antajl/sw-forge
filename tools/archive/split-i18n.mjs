#!/usr/bin/env node

/**
 * One-time migration: i18n.js → translations-en.js + translations-ru.js,
 * i18n-fr.js → translations-fr.js. Then run build-translations.mjs.
 */
import fs from 'fs';
import path from 'path';

const i18nPath = path.join(process.cwd(), 'js/core/i18n.js');
if (!fs.existsSync(i18nPath)) {
  console.error('i18n.js not found — migration already done?');
  process.exit(1);
}

const content = fs.readFileSync(i18nPath, 'utf-8');

const enStart = content.indexOf('en: {');
const enRuBoundary = content.slice(enStart).match(/\r?\n  ru: \{/);
const enEnd = enRuBoundary ? enStart + enRuBoundary.index : -1;
if (enStart < 0 || enEnd < 0) {
  console.error('Could not locate en: { … ru: { block in i18n.js');
  process.exit(1);
}
const enContent = content.substring(enStart + 5, enEnd).trim();

const ruStart = content.indexOf('ru: {');
const ruClose = content.slice(ruStart).match(/\r?\n  },\r?\n};/);
const ruEnd = ruClose ? ruStart + ruClose.index : -1;
if (ruStart < 0 || ruEnd < 0) {
  console.error('Could not locate ru: { … closing block in i18n.js');
  process.exit(1);
}
const ruContent = content.substring(ruStart + 5, ruEnd).trim();

const enFile = `// js/core/translations-en.js — English UI strings (source file)
const TRANSLATIONS_EN = {
  ${enContent}
};
`;
fs.writeFileSync('js/core/translations-en.js', enFile, 'utf-8');
console.log('Created translations-en.js');

const ruFile = `// js/core/translations-ru.js — Russian UI strings (source file)
const TRANSLATIONS_RU = {
  ${ruContent}
};
`;
fs.writeFileSync('js/core/translations-ru.js', ruFile, 'utf-8');
console.log('Created translations-ru.js');

const frPath = path.join(process.cwd(), 'js/core/i18n-fr.js');
const newFrPath = path.join(process.cwd(), 'js/core/translations-fr.js');
if (fs.existsSync(frPath)) {
  const frContent = fs.readFileSync(frPath, 'utf-8');
  const updatedFrContent = frContent
    .replace(
      '// js/core/i18n-fr.js — French UI strings (lazy-loaded on language switch)',
      '// js/core/translations-fr.js — French UI strings (lazy-loaded on language switch)',
    )
    .replace('window.SWRM_I18N_FR =', 'window.TRANSLATIONS_FR =');
  fs.writeFileSync(newFrPath, updatedFrContent, 'utf-8');
  console.log('Created translations-fr.js from i18n-fr.js');
} else if (!fs.existsSync(newFrPath)) {
  fs.writeFileSync(
    newFrPath,
    '// js/core/translations-fr.js — French UI strings (lazy-loaded)\nwindow.TRANSLATIONS_FR = {};\n',
    'utf-8',
  );
  console.warn('Warning: i18n-fr.js not found, created empty translations-fr.js');
}

console.log('Split complete. Run: npm run build:translations');
