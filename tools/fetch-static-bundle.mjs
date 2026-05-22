/**
 * Download small static PNGs from SWARFARM → assets/ (Phase B local bundle)
 *
 * Run: node tools/fetch-static-bundle.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const assetsRoot = path.join(root, 'assets');
const manifestPath = path.join(root, 'data/static-manifest.json');

const SWARFARM = 'https://swarfarm.com';

const BUNDLE = [
  { category: 'elements', file: 'fire.png', url: `${SWARFARM}/static/herders/images/elements/fire.png` },
  { category: 'elements', file: 'water.png', url: `${SWARFARM}/static/herders/images/elements/water.png` },
  { category: 'elements', file: 'wind.png', url: `${SWARFARM}/static/herders/images/elements/wind.png` },
  { category: 'elements', file: 'light.png', url: `${SWARFARM}/static/herders/images/elements/light.png` },
  { category: 'elements', file: 'dark.png', url: `${SWARFARM}/static/herders/images/elements/dark.png` },
  { category: 'ui', file: 'devilmon.png', url: `${SWARFARM}/static/herders/images/monsters/devilmon_dark.png` },
  { category: 'artifacts', file: 'fire.png', url: `${SWARFARM}/static/herders/images/artifacts/fire.png` },
  { category: 'artifacts', file: 'water.png', url: `${SWARFARM}/static/herders/images/artifacts/water.png` },
  { category: 'artifacts', file: 'wind.png', url: `${SWARFARM}/static/herders/images/artifacts/wind.png` },
  { category: 'artifacts', file: 'light.png', url: `${SWARFARM}/static/herders/images/artifacts/light.png` },
  { category: 'artifacts', file: 'dark.png', url: `${SWARFARM}/static/herders/images/artifacts/dark.png` },
  { category: 'artifacts', file: 'hp.png', url: `${SWARFARM}/static/herders/images/artifacts/hp.png` },
  { category: 'artifacts', file: 'attack.png', url: `${SWARFARM}/static/herders/images/artifacts/attack.png` },
  { category: 'artifacts', file: 'defense.png', url: `${SWARFARM}/static/herders/images/artifacts/defense.png` },
  { category: 'artifacts', file: 'support.png', url: `${SWARFARM}/static/herders/images/artifacts/support.png` },
];

const RUNE_SETS = [
  'energy',
  'guard',
  'swift',
  'blade',
  'rage',
  'focus',
  'endure',
  'fatal',
  'despair',
  'vampire',
  'violent',
  'nemesis',
  'will',
  'shield',
  'revenge',
  'destroy',
  'fight',
  'determination',
  'enhance',
  'accuracy',
  'tolerance',
  'seal',
  'intangible',
];

for (const key of RUNE_SETS) {
  BUNDLE.push({
    category: 'runes',
    file: `${key}.png`,
    url: `${SWARFARM}/static/herders/images/runes/${key}.png`,
  });
}

async function download(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'SW-Forge-static-bundle/1.0' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  const manifest = { generatedAt: new Date().toISOString(), files: [] };
  let ok = 0;
  let fail = 0;

  for (const item of BUNDLE) {
    const dir =
      item.category === 'runes'
        ? path.join(assetsRoot, 'runes', 'sets')
        : path.join(assetsRoot, item.category);
    fs.mkdirSync(dir, { recursive: true });
    const dest = path.join(dir, item.file);
    try {
      const buf = await download(item.url);
      fs.writeFileSync(dest, buf);
      manifest.files.push({
        category: item.category,
        file: item.category === 'runes' ? `sets/${item.file}` : item.file,
        bytes: buf.length,
      });
      ok += 1;
      console.log(`OK ${item.category}/${item.file}`);
    } catch (e) {
      fail += 1;
      console.warn(`FAIL ${item.category}/${item.file}: ${e.message}`);
    }
  }

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`Done: ${ok} ok, ${fail} fail → ${manifestPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
