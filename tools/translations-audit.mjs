import fs from 'fs';

const enSrc = fs.readFileSync('js/core/translations-en.js', 'utf8');
const ruSrc = fs.readFileSync('js/core/translations-ru.js', 'utf8');
const frSrc = fs.readFileSync('js/core/translations-fr.js', 'utf8');

function objectKeys(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  const block = text.slice(start + 1, end);
  return [...block.matchAll(/^\s+(\w+):/gm)].map((m) => m[1]);
}

const enKeys = objectKeys(enSrc);
const ruKeys = new Set(objectKeys(ruSrc));
const frKeys = new Set(objectKeys(frSrc));

const missRu = enKeys.filter((k) => !ruKeys.has(k));
const missFr = enKeys.filter((k) => !frKeys.has(k));

console.log('EN', enKeys.length, 'RU unique', ruKeys.size, 'FR', frKeys.size);
console.log('missing RU', missRu.length, missRu.join(', '));
console.log('missing FR', missFr.length);
fs.writeFileSync('tools/miss-fr-keys.json', JSON.stringify(missFr, null, 2));
