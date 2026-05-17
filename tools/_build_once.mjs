import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const partsDir = join(root, 'js/ui-parts');
const order = readdirSync(partsDir)
  .filter((f) => f.endsWith('.js'))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

const banner = `// =============================================
// ui.js — built from js/ui-parts/ (do not edit by hand)
// Rebuild: node tools/build-ui.mjs
// =============================================

`;

const body = order
  .map((f) => readFileSync(join(partsDir, f), 'utf8').replace(/^\/\/ ui-parts\/[^\n]+\n/, ''))
  .join('\n');

writeFileSync(join(root, 'js/ui.js'), banner + body, 'utf8');
console.log('wrote ui.js', body.split('\n').length, 'lines');
