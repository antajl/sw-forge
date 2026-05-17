/**
 * Concatenate js/ui-parts/*.js → js/ui.js (no transforms; same closure as monolith).
 * Split from backup: node tools/build-ui.mjs --split-only
 * Rebuild after edits: node tools/build-ui.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const partsDir = path.join(root, 'js/ui-parts');
const outPath = path.join(root, 'js/ui.js');
const bakPath = path.join(root, 'js/ui.monolith.bak.js');

/** [filename, startLine, endLine] — concat order matches monolith */
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
  ['14-monsters.js'],
];

const partNames = CHUNKS.map(([name]) => name);

function splitFromBak() {
  if (!fs.existsSync(bakPath)) {
    console.error('Missing js/ui.monolith.bak.js');
    process.exit(1);
  }
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
}

const argv = process.argv.slice(2);
if (argv.includes('--split') || argv.includes('--split-only')) {
  splitFromBak();
  if (argv.includes('--split-only')) process.exit(0);
}

const missing = partNames.filter((name) => !fs.existsSync(path.join(partsDir, name)));
if (missing.length && fs.existsSync(bakPath)) {
  console.log(`js/ui-parts/ missing ${missing.length} part(s) — splitting from ui.monolith.bak.js ...`);
  splitFromBak();
}

const stillMissing = partNames.filter((name) => !fs.existsSync(path.join(partsDir, name)));
if (stillMissing.length) {
  console.error('Missing ui-parts:', stillMissing.join(', '));
  console.error('Run: node tools/build-ui.mjs --split-only');
  process.exit(1);
}

const banner = `// =============================================
// ui.js — built from js/ui-parts/ (do not edit by hand)
// Rebuild: node tools/build-ui.mjs
// =============================================

`;

const lastPart = partNames[partNames.length - 1];
for (let i = 0; i < partNames.length - 1; i++) {
  const name = partNames[i];
  const raw = fs.readFileSync(path.join(partsDir, name), 'utf8');
  if (/\}\)\(\);\s*$/.test(raw.trim())) {
    console.error(`ui-parts/${name} must not close the IIFE — only ${lastPart} may end with })();`);
    process.exit(1);
  }
}

const body = partNames
  .map((f) => {
    const raw = fs.readFileSync(path.join(partsDir, f), 'utf8');
    return raw.replace(/^\/\/ ui-parts\/[^\n]+\n/, '');
  })
  .join('\n');

fs.writeFileSync(outPath, banner + body, 'utf8');
console.log('wrote js/ui.js from', partNames.length, 'parts (', body.split('\n').length, 'lines )');

if (fs.existsSync(bakPath)) {
  const bak = fs.readFileSync(bakPath, 'utf8');
  const built = fs.readFileSync(outPath, 'utf8').replace(/^\/\/ ={3,}[\s\S]*?={3,}\n\n/, '');
  if (bak === built) {
    console.log('OK: built ui.js matches ui.monolith.bak.js');
  } else {
    console.warn('WARN: built ui.js differs from ui.monolith.bak.js — check part boundaries');
  }
}
