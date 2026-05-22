/** Quick check: Sky Tribe Totem in SWEX JSON (master_id 11001). */
const TOTEM_SPD_PCT_BY_LEVEL = {
  1: 2, 2: 3, 3: 5, 4: 6, 5: 8, 6: 9, 7: 11, 8: 12, 9: 14, 10: 15,
  11: 8.5, 12: 9, 13: 10, 14: 11, 15: 11.5, 16: 12, 17: 13, 18: 14, 19: 14.5, 20: 15,
};
const SPEED_TOTEM_DECO_MASTER_ID = 11001;

function totemSpdPctFromLevel(level) {
  const lv = Number(level);
  if (!Number.isFinite(lv) || lv < 1) return 0;
  const pct = TOTEM_SPD_PCT_BY_LEVEL[lv];
  return pct != null ? pct : lv >= 10 ? 15 : 0;
}
function decoEntryMasterId(d) {
  return Number(d.master_id ?? d.deco_master_id ?? d.building_master_id);
}
function decoEntryLevel(d) {
  return Number(d.level ?? d.lv ?? d.upgrade_curr ?? d.upgrade_level ?? d.building_level);
}
function swexAllDecoEntries(json) {
  const out = [];
  const seen = new Set();
  const pushList = (list) => {
    if (!Array.isArray(list)) return;
    for (const d of list) {
      const key = `${decoEntryMasterId(d)}:${decoEntryLevel(d)}:${d.deco_id ?? ''}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(d);
    }
  };
  pushList(json.deco_list);
  pushList(json.deo_list);
  return out;
}
function findSkyTribeTotemInJson(json) {
  let best = null;
  for (const d of swexAllDecoEntries(json)) {
    if (decoEntryMasterId(d) !== SPEED_TOTEM_DECO_MASTER_ID) continue;
    const lv = decoEntryLevel(d);
    const pct = totemSpdPctFromLevel(lv);
    if (pct > 0 && (!best || lv > best.level)) best = { level: lv, pct };
  }
  return best;
}

const sample = {
  deo_list: [{ deco_id: 123456, master_id: 11001, level: 10, pos_x: 3, pos_y: 5 }],
};
const hit = findSkyTribeTotemInJson(sample);
console.log('sample totem', hit);
console.log('teshar totem flat', Math.round((114 * (hit?.pct || 0)) / 100));
console.log('teshar total spd', 164 + Math.round((114 * (hit?.pct || 0)) / 100));

import fs from 'fs';
const demo = JSON.parse(fs.readFileSync('data/demo.json', 'utf8'));
console.log('demo totem', findSkyTribeTotemInJson(demo));
