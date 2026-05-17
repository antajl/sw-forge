import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const uiPath = path.join(root, 'js/ui.js');
const partPath = path.join(root, 'js/ui-parts/14-monsters.js');

const ui = fs.readFileSync(uiPath, 'utf8');
const part = fs.readFileSync(partPath, 'utf8').replace(/^\/\/ ui-parts\/[^\n]+\n/, '');

const startMarker = "  const MONSTERS_FILTER_STORAGE_KEY = 'swrm_monsters_filters_v1';";
const start = ui.indexOf(startMarker);
const endMarker = '\n})();\n';
const end = ui.lastIndexOf(endMarker);
if (start < 0 || end <= start) {
  console.error('Could not locate monsters block in ui.js');
  process.exit(1);
}

const next = ui.slice(0, start) + part + ui.slice(end);
fs.writeFileSync(uiPath, next, 'utf8');
console.log('Synced monsters block into ui.js');
