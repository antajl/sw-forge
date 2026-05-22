/**
 * Print where SW Forge reads Sky Tribe Totem (SPD%) from a SWEX JSON export.
 * Usage: node tools/inspect-totem-from-json.mjs path/to/export.json
 */
import fs from 'fs';

const WIZARD_SKILL_ID_SPEED_TOTEM = 14;
const SPEED_TOTEM_DECO_MASTER_ID = 11001;
const TOTEM_SPD_PCT_BY_LEVEL = {
  1: 2, 2: 3, 3: 5, 4: 6, 5: 8, 6: 9, 7: 11, 8: 12, 9: 14, 10: 15,
  11: 8.5, 12: 9, 13: 10, 14: 11, 15: 11.5, 16: 12, 17: 13, 18: 14, 19: 14.5, 20: 15,
};

function pctFromLevel(level) {
  const lv = Number(level);
  if (!Number.isFinite(lv) || lv < 1) return 0;
  const pct = TOTEM_SPD_PCT_BY_LEVEL[lv];
  return pct != null ? pct : lv >= 10 ? 15 : 0;
}

const path = process.argv[2] || 'data/demo.json';
const json = JSON.parse(fs.readFileSync(path, 'utf8'));

console.log('File:', path);
console.log('wizard_level:', json.wizard_info?.wizard_level);

const wsl = json.wizard_skill_list || {};
const rows = Array.isArray(wsl) ? wsl : Object.values(wsl);
const skill14 = rows.filter((r) => Number(r.skill_id) === WIZARD_SKILL_ID_SPEED_TOTEM);
console.log('\n[1] wizard_skill_list skill_id=14 (primary, Summoner monument SPD):');
if (!skill14.length) console.log('  NOT FOUND');
else {
  for (const r of skill14) {
    const lv = r.level;
    console.log('  level', lv, '→', pctFromLevel(lv) + '%');
  }
}

const deco = [...(json.deco_list || []), ...(json.deo_list || [])];
const deco11001 = deco.filter((d) => Number(d.master_id) === SPEED_TOTEM_DECO_MASTER_ID);
console.log('\n[2] deco_list / deo_list master_id=11001 (legacy):');
console.log(deco11001.length ? deco11001 : '  NOT FOUND');

const home = json.wizard_info?.unit_home_bonus || json.unit_home_bonus;
console.log('\n[3] wizard_info.unit_home_bonus:');
console.log(home ? home : '  NOT FOUND');

let best = null;
for (const r of skill14) {
  const lv = Number(r.level);
  const pct = pctFromLevel(lv);
  if (pct > 0) best = { source: 'wizard_skill_list', level: lv, pct };
}
if (!best && deco11001.length) {
  const d = deco11001[0];
  best = { source: 'deco_list:11001', level: d.level, pct: pctFromLevel(d.level) };
}
console.log('\nResolved for app:', best || 'no totem data — SPD will show runes only');
