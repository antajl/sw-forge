/**
 * Retry missing skill/portrait PNGs; for skills copy nearest existing CDN file into assets/.
 *
 * Run: node tools/fetch-missing-assets.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OVERRIDES_PATH = path.join(root, 'data/skill-icon-overrides.json');
const SKILLS_DIR = path.join(root, 'assets/skills');
const SKILLS_MANIFEST = path.join(root, 'data/skills-icons-manifest.json');

const SWARFARM_SKILL = 'https://swarfarm.com/static/herders/images/skills/';

function loadJson(p, fallback) {
  if (!fs.existsSync(p)) return fallback;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function writeSkillsManifest() {
  const files = fs
    .readdirSync(SKILLS_DIR)
    .filter((f) => f.endsWith('.png') && fs.statSync(path.join(SKILLS_DIR, f)).size >= 80)
    .sort();
  const prev = loadJson(SKILLS_MANIFEST, { files: [] });
  fs.writeFileSync(
    SKILLS_MANIFEST,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        count: files.length,
        files,
        overrides: prev.overrides || loadJson(OVERRIDES_PATH, {}),
      },
      null,
      2,
    ),
  );
  return files.length;
}

async function download(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'SW-Forge-missing/1.0' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function headOk(url) {
  const res = await fetch(url, { method: 'HEAD', headers: { 'User-Agent': 'SW-Forge-missing/1.0' } });
  return res.ok;
}

async function findSkillFallback(filename) {
  const m = filename.match(/^skill_icon_(\d+)_(\d+)_(\d+)\.png$/);
  if (!m) return null;
  const [, fam, slot, tier] = m;
  const tries = [];
  for (let t = 0; t <= 4; t++) {
    if (String(t) !== tier) tries.push(`skill_icon_${fam}_${slot}_${t}.png`);
  }
  for (let s = 0; s <= 9; s++) {
    if (String(s) !== slot) tries.push(`skill_icon_${fam}_${s}_${tier}.png`);
  }
  tries.push(`skill_icon_${fam}_0_0.png`);
  for (const fn of tries) {
    if (await headOk(SWARFARM_SKILL + fn)) return fn;
  }
  if (await headOk(SWARFARM_SKILL + 'skill_icon_0000_0_0.png')) {
    return 'skill_icon_0000_0_0.png';
  }
  return null;
}

function missingFromManifest() {
  const index = loadJson(path.join(root, 'data/skills-index.json'), {});
  const manifest = loadJson(SKILLS_MANIFEST, { files: [] });
  const have = new Set(manifest.files || []);
  return [...new Set(Object.values(index.byIcon || {}))].filter((f) => f && !have.has(f));
}

async function main() {
  fs.mkdirSync(SKILLS_DIR, { recursive: true });
  const missing = missingFromManifest();
  const overrides = {};
  let ok = 0;
  let substituted = 0;
  let fail = 0;

  console.log(`Missing skill icons: ${missing.length}`);

  for (const fn of missing) {
    const dest = path.join(SKILLS_DIR, fn);
    try {
      const buf = await download(SWARFARM_SKILL + encodeURIComponent(fn).replace(/%2F/g, '/'));
      fs.writeFileSync(dest, buf);
      ok += 1;
      console.log(`OK direct ${fn}`);
      continue;
    } catch {
      /* 404 expected */
    }

    const alt = await findSkillFallback(fn);
    if (!alt) {
      fail += 1;
      console.warn(`FAIL ${fn}: no CDN file and no substitute`);
      continue;
    }
    try {
      const buf = await download(SWARFARM_SKILL + alt);
      fs.writeFileSync(dest, buf);
      overrides[fn] = alt;
      substituted += 1;
      console.log(`OK substitute ${fn} <- ${alt}`);
    } catch (e) {
      fail += 1;
      console.warn(`FAIL ${fn}: ${e.message}`);
    }
  }

  if (Object.keys(overrides).length) {
    const merged = { ...loadJson(OVERRIDES_PATH, {}), ...overrides };
    fs.writeFileSync(OVERRIDES_PATH, JSON.stringify(merged, null, 2));
  }

  const count = writeSkillsManifest();
  console.log(`Done: direct ${ok}, substitute ${substituted}, fail ${fail}; manifest ${count} files`);
  if (substituted) {
    console.log(`Overrides map: ${OVERRIDES_PATH} (same PNG reused under missing filename)`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
