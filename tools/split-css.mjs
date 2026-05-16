/** Split css/style.css into partials + @import entry. Run: node tools/split-css.mjs */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cssPath = path.join(root, 'css/style.css');
const raw = fs.readFileSync(cssPath, 'utf8');

if (raw.includes('@import url(')) {
  console.log('CSS already split, skipping');
  process.exit(0);
}

const lines = raw.split('\n');
const chunks = [
  ['css/base.css', 1, 184],
  ['css/header.css', 185, 489],
  ['css/stage-advisor.css', 490, 1417],
  ['css/overlays.css', 1418, 1882],
  ['css/dashboard.css', 1883, 3038],
  ['css/rune-table.css', 3039, 4165],
  ['css/rules.css', 4166, 4752],
  ['css/toasts.css', 4753, lines.length],
];

for (const [rel, start, end] of chunks) {
  const slice = lines.slice(start - 1, end).join('\n').trimEnd() + '\n';
  fs.writeFileSync(path.join(root, rel), slice, 'utf8');
  console.log('wrote', rel, `(${end - start + 1} lines)`);
}

const entry =
  '/* SW Rune Master — entry; partials loaded via @import */\n' +
  chunks.map(([rel]) => `@import url('./${path.basename(rel)}');`).join('\n') +
  '\n';
fs.writeFileSync(cssPath, entry, 'utf8');
console.log('wrote css/style.css (imports only)');
