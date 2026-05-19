/**
 * Add awaken_level / awakened to data/monsters-index.json (in-place patch).
 * Run: node tools/patch-monsters-awaken.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outPath = path.join(root, 'data/monsters-index.json');
const PAUSE_MS = 1200;
const BATCH = 20;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchMonster(id) {
  const res = await fetch(`https://swarfarm.com/api/v2/monsters/?com2us_id=${id}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.results && data.results[0];
}

const raw = JSON.parse(fs.readFileSync(outPath, 'utf8'));
const list = Array.isArray(raw.monsters) ? raw.monsters : Object.values(raw.monsters || raw);
let n = 0;
for (let i = 0; i < list.length; i++) {
  const row = list[i];
  if (!row || row.com2us_id == null) continue;
  if (row.awaken_level != null && row.awakened != null) continue;
  const m = await fetchMonster(row.com2us_id);
  if (m) {
    row.awaken_level = m.awaken_level != null ? Number(m.awaken_level) : 0;
    row.awakened = m.awakened === true || row.awaken_level > 0;
    n += 1;
  }
  if ((i + 1) % BATCH === 0) {
    fs.writeFileSync(outPath, JSON.stringify({ count: list.length, monsters: list }));
    console.log(`patched ${n} / ${i + 1}/${list.length}`);
    await sleep(PAUSE_MS);
  }
}
fs.writeFileSync(outPath, JSON.stringify({ count: list.length, monsters: list }));
console.log(`done, patched ${n} monsters`);
