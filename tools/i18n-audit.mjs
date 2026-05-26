import fs from 'fs';

const src = fs.readFileSync('js/core/i18n.js', 'utf8');
const frSrc = fs.readFileSync('js/core/i18n-fr.js', 'utf8');

function sectionKeys(text, startMarker, endMarker) {
  const start = text.indexOf(startMarker);
  const end = text.indexOf(endMarker, start);
  const block = text.slice(start + startMarker.length, end);
  return [...block.matchAll(/^\s+(\w+):/gm)].map((m) => m[1]);
}

const enKeys = sectionKeys(src, 'en: {', '\n  ru: {');
const ruKeys = new Set(sectionKeys(src, 'ru: {', '\n};'));
const frKeys = new Set([...frSrc.matchAll(/^\s+(\w+):/gm)].map((m) => m[1]));

const missRu = enKeys.filter((k) => !ruKeys.has(k));
const missFr = enKeys.filter((k) => !frKeys.has(k));

console.log('EN', enKeys.length, 'RU unique', ruKeys.size, 'FR', frKeys.size);
console.log('missing RU', missRu.length, missRu.join(', '));
console.log('missing FR', missFr.length);
fs.writeFileSync('tools/miss-fr-keys.json', JSON.stringify(missFr, null, 2));
