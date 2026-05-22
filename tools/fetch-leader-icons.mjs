/**
 * Download leader skill tiles from SWARFARM (unique filenames from monster API)
 *
 * Run: npm run fetch:leader-icons
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leaderDir = path.join(root, 'assets/skills/leader');
const manifestPath = path.join(root, 'data/leader-icons-manifest.json');

const API = 'https://swarfarm.com/api/v2/monsters/';
const SWARFARM_LEADER_BASE = 'https://swarfarm.com/static/herders/images/skills/leader/';
const PAGE_SIZE = 50;
const PAUSE_MS = 1600;
const CONCURRENCY = 6;
const MIN_BYTES = 80;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function leaderFilename(leaderSkill) {
  if (!leaderSkill) return '';
  const attr = String(leaderSkill.attribute || '')
    .trim()
    .replace(/\s+/g, '_');
  if (!attr) return '';
  const area = String(leaderSkill.area || '').trim();
  const element = leaderSkill.element ? String(leaderSkill.element).trim() : '';
  let suffix = '';
  if (area === 'Element' && element) suffix = `_${element}`;
  else if (area && area !== 'General') suffix = `_${area}`;
  return `leader_skill_${attr}${suffix}.png`;
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'SW-Forge-leader-icons/1.0',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function collectFilenames() {
  const files = new Set();
  let url = `${API}?page_size=${PAGE_SIZE}`;
  let pages = 0;
  while (url) {
    const data = await fetchJson(url);
    for (const m of data.results || []) {
      const fn = leaderFilename(m.leader_skill);
      if (fn) files.add(fn);
    }
    url = data.next;
    pages += 1;
    if (pages % 10 === 0) console.log(`… scanned ${pages} pages, ${files.size} leader icons`);
    if (url) await sleep(PAUSE_MS);
  }
  return [...files];
}

async function download(filename) {
  const dest = path.join(leaderDir, filename);
  if (fs.existsSync(dest) && fs.statSync(dest).size >= MIN_BYTES) return 'skip';
  const res = await fetch(SWARFARM_LEADER_BASE + encodeURIComponent(filename), {
    headers: { 'User-Agent': 'SW-Forge-leader-icons/1.0' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < MIN_BYTES) throw new Error('file too small');
  fs.writeFileSync(dest, buf);
  return 'ok';
}

async function runPool(files) {
  let i = 0;
  let ok = 0;
  let skip = 0;
  let fail = 0;
  async function worker() {
    while (i < files.length) {
      const fn = files[i++];
      try {
        const r = await download(fn);
        if (r === 'skip') skip += 1;
        else ok += 1;
      } catch (e) {
        fail += 1;
        if (fail <= 8) console.warn(`FAIL ${fn}: ${e.message}`);
      }
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, files.length) }, () => worker()),
  );
  return { ok, skip, fail };
}

function writeManifest() {
  const files = fs
    .readdirSync(leaderDir)
    .filter((f) => f.endsWith('.png') && fs.statSync(path.join(leaderDir, f)).size >= MIN_BYTES)
    .sort();
  fs.writeFileSync(
    manifestPath,
    JSON.stringify({ generatedAt: new Date().toISOString(), count: files.length, files }, null, 2),
  );
  return files.length;
}

async function main() {
  fs.mkdirSync(leaderDir, { recursive: true });
  console.log('Scanning monsters API for leader skill icons…');
  const files = await collectFilenames();
  console.log(`Unique leader tiles: ${files.length}`);
  const { ok, skip, fail } = await runPool(files);
  const count = writeManifest();
  console.log(`Done: ok ${ok}, skip ${skip}, fail ${fail} → manifest ${count} files`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
