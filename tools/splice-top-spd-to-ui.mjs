import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const uiPath = join(root, 'js/ui.js');
const c06Path = join(root, 'js/ui-parts/06c-dashboard-helpers.js');
const startMarker = '  const TOP_SPD_RADAR_WEAK_RATIO = 0.72;';
const endMarker = '  function resolveTopSpdSetPick';

const ui = readFileSync(uiPath, 'utf8');
const c06 = readFileSync(c06Path, 'utf8');
const start06 = c06.indexOf(startMarker);
const end06 = c06.indexOf(endMarker);
const startUi = ui.indexOf(startMarker);
const endUi = ui.indexOf(endMarker);
if (start06 < 0 || end06 < 0 || startUi < 0 || endUi < 0) {
  console.error('markers missing', { start06, end06, startUi, endUi });
  process.exit(1);
}
const block = c06.slice(start06, end06);
const out = ui.slice(0, startUi) + block + ui.slice(endUi);
writeFileSync(uiPath, out, 'utf8');
console.log('spliced', block.split('\n').length, 'lines into ui.js');
