import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'index.html');
let s = fs.readFileSync(file, 'utf8');
const marker = 'id="tab-monsters-teams"';
const i = s.indexOf(marker);
if (i < 0) {
  console.error('teams pane not found');
  process.exit(1);
}
const open = s.lastIndexOf('<', i);
const attrib = s.indexOf('class="monsters-attrib"', i);
if (attrib < 0) {
  console.error('attrib not found');
  process.exit(1);
}
const block = s.slice(open, attrib).trim();
let rest = s.slice(0, open) + s.slice(attrib);
const navEnd = rest.indexOf('</nav>', rest.indexOf('monsters-hub-tabs'));
if (navEnd < 0) {
  console.error('nav end not found');
  process.exit(1);
}
const insertAt = navEnd + '</nav>'.length;
rest = rest.slice(0, insertAt) + '\n' + block + '\n' + rest.slice(insertAt);
fs.writeFileSync(file, rest);
console.log('moved teams pane');
