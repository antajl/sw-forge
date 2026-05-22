/**
 * Report PNGs in our index that SWARFARM CDN returns 404 for, and suggest nearest existing file.
 *
 * Run: node tools/diagnose-missing-assets.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function headOk(url) {
  const res = await fetch(url, { method: 'HEAD', headers: { 'User-Agent': 'SW-Forge-diagnose/1.0' } });
  return res.ok;
}

async function findSkillFallback(filename) {
  const m = filename.match(/^skill_icon_(\d+)_(\d+)_(\d+)\.png$/);
  if (!m) return null;
  const [, fam, slot, tier] = m;
  const base = 'https://swarfarm.com/static/herders/images/skills/';
  const tries = [];
  for (let t = 0; t <= 4; t++) {
    if (String(t) !== tier) tries.push(`skill_icon_${fam}_${slot}_${t}.png`);
  }
  for (let s = 0; s <= 9; s++) {
    if (String(s) !== slot) tries.push(`skill_icon_${fam}_${s}_${tier}.png`);
  }
  tries.push(`skill_icon_${fam}_0_0.png`);
  for (const fn of tries) {
    if (await headOk(base + fn)) return fn;
  }
  return null;
}

async function findPortraitFallback(filename) {
  const bases = [
    'https://swarfarm.com/static/herders/images/monsters/',
    'https://swarfarm.com/static/herders/images/units/',
  ];
  for (const base of bases) {
    if (await headOk(base + filename)) return { url: base + filename, note: 'found alternate base' };
  }
  return null;
}

function missingSkills() {
  const index = JSON.parse(fs.readFileSync(path.join(root, 'data/skills-index.json'), 'utf8'));
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'data/skills-icons-manifest.json'), 'utf8'));
  const have = new Set(manifest.files);
  return [...new Set(Object.values(index.byIcon || {}))].filter((f) => f && !have.has(f));
}

function missingPortraits() {
  const index = JSON.parse(fs.readFileSync(path.join(root, 'data/monsters-index.json'), 'utf8'));
  const manifest = JSON.parse(
    fs.readFileSync(path.join(root, 'data/monsters-portraits-manifest.json'), 'utf8'),
  );
  const have = new Set(manifest.files);
  const all = [...new Set(index.monsters.map((m) => m.image_filename).filter(Boolean))];
  return all.filter((f) => !have.has(f));
}

async function main() {
  console.log('=== Skill icons (CDN 404 on SWARFARM) ===\n');
  const skills = missingSkills();
  const skillReport = [];
  for (const fn of skills) {
    const url = `https://swarfarm.com/static/herders/images/skills/${fn}`;
    const status = (await fetch(url, { method: 'HEAD' })).status;
    const fallback = await findSkillFallback(fn);
    skillReport.push({ file: fn, http: status, suggestedFallback: fallback });
    console.log(`${fn}`);
    console.log(`  HTTP ${status} — API/index name, file not on SWARFARM CDN`);
    console.log(`  Suggested substitute: ${fallback || '(none found)'}\n`);
  }

  console.log('=== Portraits ===\n');
  const portraits = missingPortraits();
  for (const fn of portraits) {
    const urlM = `https://swarfarm.com/static/herders/images/monsters/${fn}`;
    const urlU = `https://swarfarm.com/static/herders/images/units/${fn}`;
    const sM = (await fetch(urlM, { method: 'HEAD' })).status;
    const sU = (await fetch(urlU, { method: 'HEAD' })).status;
    console.log(`${fn}`);
    console.log(`  monsters/ HTTP ${sM}, units/ HTTP ${sU}`);
    const index = JSON.parse(fs.readFileSync(path.join(root, 'data/monsters-index.json'), 'utf8'));
    const names = index.monsters
      .filter((m) => m.image_filename === fn)
      .slice(0, 5)
      .map((m) => `${m.com2us_id} ${m.name}`);
    console.log(`  Used by: ${names.join('; ')}${names.length ? '…' : ''}\n`);
  }

  const outPath = path.join(root, 'data/missing-assets-report.json');
  fs.writeFileSync(
    outPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        skills: skillReport,
        portraits: portraits.map((file) => ({ file })),
      },
      null,
      2,
    ),
  );
  console.log(`Wrote ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
