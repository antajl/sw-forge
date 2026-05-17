/**
 * One-shot: split ui.monolith.bak.js → js/ui-parts/* and rebuild js/ui.js
 * Run: node tools/run-ui-split.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const partsDir = path.join(root, 'js/ui-parts');
const outPath = path.join(root, 'js/ui.js');
const bakPath = path.join(root, 'js/ui.monolith.bak.js');

const CHUNKS = [
  ['01-preamble.js', 5, 58],
  ['02-theme-nav.js', 59, 343],
  ['03-i18n.js', 344, 768],
  ['04-main-tabs.js', 769, 786],
  ['05-stage-filters.js', 787, 1092],
  ['06-upload.js', 1093, 1487],
  ['06b-ui-utils.js', 1488, 1837],
  ['06c-dashboard-helpers.js', 1838, 2471],
  ['07-depth.js', 2472, 2843],
  ['08-dashboard.js', 2844, 3303],
  ['09-table.js', 3304, 4072],
  ['10-formulas-ui.js', 4073, 4334],
  ['11-rules-ui.js', 4335, 4647],
  ['11-constants-ui.js', 4648, 4820],
  ['11-rules-bootstrap.js', 4821, 5121],
  ['12-app-settings.js', 5122, 5455],
  ['13-changelog.js', 5456, 5507],
];

const lines = fs.readFileSync(bakPath, 'utf8').split('\n');
fs.mkdirSync(partsDir, { recursive: true });
const written = new Set();
for (const [name, start, end] of CHUNKS) {
  const slice = lines.slice(start - 1, end).join('\n').trimEnd() + '\n';
  const header = `// ui-parts/${name} — slice of ui.monolith.bak.js L${start}-${end}\n`;
  fs.writeFileSync(path.join(partsDir, name), header + slice, 'utf8');
  written.add(name);
  console.log('wrote ui-parts/' + name, `(${end - start + 1} lines)`);
}
for (const f of fs.readdirSync(partsDir)) {
  if (f.endsWith('.js') && !written.has(f)) {
    fs.unlinkSync(path.join(partsDir, f));
    console.log('removed stale ui-parts/' + f);
  }
}

const banner = `// =============================================
// ui.js — built from js/ui-parts/ (do not edit by hand)
// Rebuild: node tools/build-ui.mjs
// =============================================

`;
const partNames = CHUNKS.map(([n]) => n);
const body = partNames
  .map((f) => fs.readFileSync(path.join(partsDir, f), 'utf8').replace(/^\/\/ ui-parts\/[^\n]+\n/, ''))
  .join('\n');
fs.writeFileSync(outPath, banner + body, 'utf8');
const bak = fs.readFileSync(bakPath, 'utf8');
const built = fs.readFileSync(outPath, 'utf8').replace(/^\/\/ ={3,}[\s\S]*?={3,}\n\n/, '');
console.log(bak === built ? 'OK: built ui.js matches ui.monolith.bak.js' : 'WARN: mismatch');
