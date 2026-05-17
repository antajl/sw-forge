import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const transcript =
  process.argv[2] ||
  'C:/Users/Antal/.cursor/projects/empty-window/agent-transcripts/4a01d3d1-5cd1-4f65-9f32-965a10cee789/4a01d3d1-5cd1-4f65-9f32-965a10cee789.jsonl';

const line = fs
  .readFileSync(transcript, 'utf8')
  .split(/\n/)
  .find((l) => l.includes('viewBox=\\"0 0 934 1074\\"'));
if (!line) {
  console.error('Transcript line with tab SVGs not found');
  process.exit(1);
}

const obj = JSON.parse(line);
const text = obj.message.content[0].text;
const runesMatch = text.match(
  /1\. замени иконку Runes[^:]*:\n(<svg[\s\S]+?)\n\n2\. замени/
);
const monstersMatch = text.match(
  /2\. замени иконку Monsters[^:]*:\n(<svg[\s\S]+?)\n\n3\. Замени/
);
if (!runesMatch || !monstersMatch) {
  console.error('Failed to extract SVGs', Boolean(runesMatch), Boolean(monstersMatch));
  process.exit(1);
}

function normalize(svg) {
  // Opaque black for CSS mask-image; header tints via background-color: currentColor
  return svg
    .replace(/fill="#212121"/g, 'fill="#000"')
    .replace(/fill="#040404"/g, 'fill="#000"')
    .replace(/fill="#383838"/g, 'fill="#000"')
    .replace(/fill="currentColor"/g, 'fill="#000"');
}

const assets = path.join(root, 'assets');
fs.mkdirSync(assets, { recursive: true });
const runesPath = path.join(assets, 'tab-runes.svg');
const monstersPath = path.join(assets, 'tab-monsters.svg');
fs.writeFileSync(runesPath, normalize(runesMatch[1]));
fs.writeFileSync(monstersPath, normalize(monstersMatch[1]));
console.log('Wrote', runesPath, fs.statSync(runesPath).size);
console.log('Wrote', monstersPath, fs.statSync(monstersPath).size);
