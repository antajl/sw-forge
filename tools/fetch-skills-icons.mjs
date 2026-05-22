/**
 * Phase D: download unique skill icons from SWARFARM → assets/skills/
 * Manifest: data/skills-icons-manifest.json (drives local-first in the browser)
 *
 * Run: npm run fetch:skills-icons
 * Resume: skips files already on disk
 * Limit: node tools/fetch-skills-icons.mjs --limit 50
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const indexPath = path.join(root, 'data/skills-index.json');
const skillsDir = path.join(root, 'assets/skills');
const manifestPath = path.join(root, 'data/skills-icons-manifest.json');

const SWARFARM_SKILL_BASE = 'https://swarfarm.com/static/herders/images/skills/';
const CONCURRENCY = 8;
const PAUSE_MS = 120;
const MIN_BYTES = 80;

const limitArg = process.argv.find((a) => a.startsWith('--limit='));
const limit = limitArg ? Number(limitArg.split('=')[1]) : 0;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function collectFilenames() {
  const data = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  const fromByIcon = Object.values(data.byIcon || {});
  const fromMeta = Object.values(data.metaById || {})
    .map((m) => m && m.icon_filename)
    .filter(Boolean);
  const files = [...new Set([...fromByIcon, ...fromMeta].map((f) => String(f).trim()).filter(Boolean))];
  return limit > 0 ? files.slice(0, limit) : files;
}

async function download(filename) {
  const dest = path.join(skillsDir, filename);
  if (fs.existsSync(dest)) {
    const st = fs.statSync(dest);
    if (st.size >= MIN_BYTES) return 'skip';
  }
  const url = SWARFARM_SKILL_BASE + encodeURIComponent(filename).replace(/%2F/g, '/');
  const res = await fetch(url, {
    headers: { 'User-Agent': 'SW-Forge-skills-icons/1.0' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < MIN_BYTES) throw new Error('file too small');
  fs.writeFileSync(dest, buf);
  return 'ok';
}

function writeManifest() {
  const files = fs
    .readdirSync(skillsDir)
    .filter((f) => f.endsWith('.png') && fs.statSync(path.join(skillsDir, f)).size >= MIN_BYTES)
    .sort();
  fs.writeFileSync(
    manifestPath,
    JSON.stringify({ generatedAt: new Date().toISOString(), count: files.length, files }, null, 2),
  );
  return files.length;
}

async function runPool(files) {
  let i = 0;
  let ok = 0;
  let skip = 0;
  let fail = 0;

  async function worker() {
    while (i < files.length) {
      const idx = i++;
      const fn = files[idx];
      try {
        const r = await download(fn);
        if (r === 'skip') skip += 1;
        else ok += 1;
        if ((ok + skip + fail) % 100 === 0) {
          writeManifest();
          console.log(`… ${ok + skip + fail}/${files.length} (ok ${ok}, skip ${skip}, fail ${fail})`);
        }
      } catch (e) {
        fail += 1;
        if (fail <= 12) console.warn(`FAIL ${fn}: ${e.message}`);
      }
      await sleep(PAUSE_MS);
    }
  }

  const workers = Array.from({ length: Math.min(CONCURRENCY, files.length) }, () => worker());
  await Promise.all(workers);
  return { ok, skip, fail };
}

async function main() {
  if (!fs.existsSync(indexPath)) {
    console.error('Missing data/skills-index.json — run: node tools/fetch-skills-index.mjs --fresh');
    process.exit(1);
  }
  fs.mkdirSync(skillsDir, { recursive: true });
  const files = collectFilenames();
  console.log(`Skill icons to fetch: ${files.length}`);
  const t0 = Date.now();
  const { ok, skip, fail } = await runPool(files);
  const count = writeManifest();
  console.log(`Done in ${((Date.now() - t0) / 1000).toFixed(1)}s: ok ${ok}, skip ${skip}, fail ${fail}`);
  console.log(`Manifest: ${count} files → ${manifestPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
