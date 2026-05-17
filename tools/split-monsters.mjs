/**
 * Split js/ui-parts/14-monsters.js → js/monsters/*.js
 * Rebuild ui: node tools/build-ui.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcPath = path.join(root, 'js/ui-parts/14-monsters.js');
const outDir = path.join(root, 'js/monsters');

/** [outFile, startLine, endLine] — 1-based, inclusive, no overlaps */
const SLICES = [
  ['monsters-state.js', 2, 21],
  ['monsters-storage.js', 23, 219],
  ['monsters-bulk.js', 221, 300],
  ['monsters-filters.js', 302, 580],
  ['monsters-runes.js', 582, 1103],
  ['monsters-detail.js', 1105, 1322],
  ['monsters-card.js', 1323, 1397],
  ['monsters-list.js', 1399, 1564],
  ['monsters-events.js', 1566, 1923],
];

const lines = fs.readFileSync(srcPath, 'utf8').split('\n');
fs.mkdirSync(outDir, { recursive: true });

for (const [name, start, end] of SLICES) {
  const slice = lines.slice(start - 1, end).join('\n').trimEnd() + '\n';
  const header = `// js/monsters/${name} — from ui-parts/14-monsters.js L${start}-${end}\n`;
  fs.writeFileSync(path.join(outDir, name), header + slice, 'utf8');
  console.log('wrote', name, `(${end - start + 1} lines)`);
}

const init = `// ui-parts/14-monsters.js — monsters tab bootstrap (see js/monsters/)
  bindMonstersToolbar();
  bindMonstersGridDelegation();

})();
`;
fs.writeFileSync(srcPath, init, 'utf8');
console.log('wrote ui-parts/14-monsters.js (init only)');
