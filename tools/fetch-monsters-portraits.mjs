/**
 * Phase E: monster portraits → assets/monsters/{image_filename}
 * Manifest: data/monsters-portraits-manifest.json
 *
 * Run: npm run fetch:monsters-portraits
 * Limit: node tools/fetch-monsters-portraits.mjs --limit=100
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const indexPath = path.join(root, 'data/monsters-index.json');
const outDir = path.join(root, 'assets/monsters');
const manifestPath = path.join(root, 'data/monsters-portraits-manifest.json');

const REMOTE_BASES = [
  'https://swarfarm.com/static/herders/images/monsters/',
  'https://swarfarm.com/static/herders/images/units/',
];
const CONCURRENCY = 8;
const PAUSE_MS = 80;
const MIN_BYTES = 120;

const limitArg = process.argv.find((a) => a.startsWith('--limit='));
const limit = limitArg ? Number(limitArg.split('=')[1]) : 0;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function collectFilenames() {
  const data = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  const list = (data.monsters || [])
    .map((m) => String(m.image_filename || '').trim())
    .filter(Boolean);
  const files = [...new Set(list)];
  return limit > 0 ? files.slice(0, limit) : files;
}

async function downloadOne(filename) {
  const dest = path.join(outDir, filename);
  if (fs.existsSync(dest) && fs.statSync(dest).size >= MIN_BYTES) return 'skip';
  for (const base of REMOTE_BASES) {
    const url = base + encodeURIComponent(filename).replace(/%2F/g, '/');
    const res = await fetch(url, { headers: { 'User-Agent': 'SW-Forge-portraits/1.0' } });
    if (!res.ok) continue;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < MIN_BYTES) continue;
    fs.writeFileSync(dest, buf);
    return 'ok';
  }
  throw new Error('not found on SWARFARM');
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
        const r = await downloadOne(fn);
        if (r === 'skip') skip += 1;
        else ok += 1;
        if ((ok + skip + fail) % 200 === 0) {
          writeManifest();
          console.log(`… ${ok + skip + fail}/${files.length} (ok ${ok}, skip ${skip}, fail ${fail})`);
        }
      } catch (e) {
        fail += 1;
        if (fail <= 10) console.warn(`FAIL ${fn}: ${e.message}`);
      }
      await sleep(PAUSE_MS);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, files.length) }, () => worker()),
  );
  return { ok, skip, fail };
}

function writeManifest() {
  const files = fs
    .readdirSync(outDir)
    .filter((f) => f.endsWith('.png') && fs.statSync(path.join(outDir, f)).size >= MIN_BYTES)
    .sort();
  fs.writeFileSync(
    manifestPath,
    JSON.stringify({ generatedAt: new Date().toISOString(), count: files.length, files }, null, 2),
  );
  return files.length;
}

async function main() {
  if (!fs.existsSync(indexPath)) {
    console.error('Missing monsters-index.json — run: npm run fetch:monsters-index');
    process.exit(1);
  }
  fs.mkdirSync(outDir, { recursive: true });
  const files = collectFilenames();
  console.log(`Portraits to fetch: ${files.length}`);
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
