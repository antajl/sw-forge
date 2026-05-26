import fs from 'fs';

const src = fs.readFileSync('js/core/i18n.js', 'utf8');
const missFr = JSON.parse(fs.readFileSync('tools/miss-fr-keys.json', 'utf8'));

const enStart = src.indexOf('en: {') + 'en: {'.length;
const enEnd = src.indexOf('\n  ru: {');
const enBlock = src.slice(enStart, enEnd);

const out = {};
for (const key of missFr) {
  const re = new RegExp(`\\n\\s+${key}:\\s*([\\s\\S]*?)(?=,\\n\\s+\\w+:|\\n\\s+},)`);
  const m = enBlock.match(re);
  if (!m) {
    console.warn('missing', key);
    continue;
  }
  let v = m[1].trim();
  if (v.startsWith("'") || v.startsWith('"')) {
    v = v.slice(1, -1);
  } else if (v.startsWith('\n')) {
    v = v
      .replace(/^\s*'/, '')
      .replace(/'\s*,?\s*$/, '')
      .replace(/\\n/g, '\n');
  }
  out[key] = v;
}
fs.writeFileSync('tools/en-missing.json', JSON.stringify(out, null, 2));
console.log('extracted', Object.keys(out).length);
