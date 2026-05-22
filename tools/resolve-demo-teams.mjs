import fs from 'fs';

const j = JSON.parse(fs.readFileSync('data/demo.json', 'utf8'));
const db = JSON.parse(fs.readFileSync('data/monsters-index.json', 'utf8'));
const byMid = new Map(db.monsters.map((m) => [m.com2us_id, m]));
const storageIds = new Set();
for (const b of j.building_list || []) {
  if ([3, 25].includes(Number(b.building_master_id))) storageIds.add(Number(b.building_id));
}
const roster = [];
for (const u of j.unit_list || []) {
  if (storageIds.has(Number(u.building_id))) continue;
  const meta = byMid.get(Number(u.unit_master_id));
  if (!meta) continue;
  roster.push({ unit_id: u.unit_id, name: meta.name, el: meta.element });
}

const HOMU_W = 8025980618;
const HOMU_D = 15761171187;
const lushens = roster.filter((r) => r.name === 'Lushen').map((r) => r.unit_id);
const galleonId = 6946053164;

const alias = {
  'Homunculus (W)': HOMU_W,
  'Homunculus (D)': HOMU_D,
  'Xiaong Fei': 7992322900,
  'Xiong Fei': 7992322900,
  Ken: 16410692026,
  KEN: 16410692026,
};

function resolve(name) {
  let raw = String(name).replace(/★/g, '').trim();
  if (alias[raw]) return alias[raw];
  if (/^Lushen2$/i.test(raw)) return lushens[1] || lushens[0];
  if (/\(2A\)/i.test(raw)) raw = raw.replace(/\(2A\)/gi, '').trim();
  let hits = roster.filter((r) => r.name.toLowerCase() === raw.toLowerCase());
  if (!hits.length) hits = roster.filter((r) => r.name.toLowerCase().includes(raw.toLowerCase()));
  if (raw.toLowerCase() === 'galleon') return galleonId;
  if (!hits.length) return null;
  return hits[0].unit_id;
}

const rawTeams = `GB12|Prilea|Teshar★|Konamiya|Luna|Homunculus (W)
DB12|Shaina★|Julie|Kyle|Konamiya|Liam
NB12|Abigail★|Raoq (2A)|Seren|Astar|Shamann
SRB12|Shaina|Sieq|Raoq (2A)|Astar|Verdehile★
SFB12|Zinc|Gina|Loren|Raoq (2A)|Ken★
PCB12|Eirgar|Icaru (2A)|Raoq (2A)|Astar|Verdehile★
Magic Ess|Lushen★|Lushen2|Hellea|Shamann|Lyn
Fire Ess|Icaru (2A)|Raoq (2A)|Astar|Ken★|Kro (2A)
Water Ess|Loren|Jamire|Lushen★|Sigmarus|Lyn
Wind Ess|Loren★|Icaru (2A)|Raoq (2A)|Astar|Kro (2A)
Light Ess|Lushen|Lushen2|Hellea|Nangrim|Perna★
Dark Ess|Astar★|Icaru (2A)|Raoq (2A)|Astar|Lyn
Rift R5|Icaru|Darion (2A)|Konamiya|Sieq|Loren★|Xiao Lin
Rift R5|Xiaong Fei|Dias★|Hwa|Lisa|Homunculus (D)|Kro (2A)
Rift R5|Bastet★|Mav|Ken|Amarna|Baleygr|Eirgar
Fire Beast|Xiao Lin|Sabrina|Talia|Baleygr|Kro (2A)|Eirgar★
Water Beast|Hraesvelg|Riley|Talia|Sabrina|Kro (2A)|Eirgar★
Wind Beast|Eirgar★|Riley|Sieq|Raoq (2A)|Kro (2A)|Baleygr
Light Beast|Icaru (2A)|Sabrina|Talia|Raoq (2A)|Kro (2A)|Eirgar★
Dark Beast|Icaru (2A)|Sabrina|Talia|Raoq (2A)|Kro (2A)|Eirgar★
AO|Tiana|Bastet|Malaka|Seara★
AO|Tiana|Galleon|Trinity★|Zaiross
AO|Tiana|Galleon|Verad|Zaiross★
AD|Abellio|Karnal|Ritesh|Vanessa★
GD|Orion|Seara★|Perna
GD|Tiana|Galleon★|Zaiross
GD|Shaina|Martina★|Triana
GD|Chandra★|Zen|Rakan
GD|Vigor (2A)|Skogul|Khmun★
Dim R5 1|Liam★|Galleon|Kyle|Konamiya|Theomars
Dim R5 2|Fran★|Zinc|Gina|Raoq (2A)|Icaru (2A)
Dim R5 3|Veromos★|Eirgar|Carcano|Darion (2A)|Nangrim`;

function overlap(a, b) {
  const A = new Set(a.ids.filter(Boolean));
  const B = new Set(b.ids.filter(Boolean));
  let inter = 0;
  for (const x of A) if (B.has(x)) inter += 1;
  return inter / Math.max(A.size, B.size, 1);
}

const parsed = [];
for (const line of rawTeams.trim().split('\n')) {
  const p = line.split('|');
  const label = p[0];
  const slots = [];
  let leader = null;
  for (let i = 1; i < p.length; i++) {
    const cell = p[i].trim();
    if (!cell) continue;
    const isL = cell.includes('★');
    const name = cell.replace(/★/g, '').trim();
    slots.push(name);
    if (isL) leader = name;
  }
  const ids = slots.map(resolve);
  const leaderId = leader ? resolve(leader) : null;
  const missing = slots.filter((n, i) => !ids[i]);
  parsed.push({ label, leader, leaderId, slots, ids, missing, size: slots.length });
}

const keep = [];
for (const t of parsed) {
  if (t.missing.length) {
    console.log('SKIP missing', t.label, t.missing.join(', '));
    continue;
  }
  const beastDup = keep.find(
    (k) => /Beast/i.test(k.label) && /Beast/i.test(t.label) && overlap(k, t) >= 0.85,
  );
  if (beastDup) {
    console.log('SKIP beast dup', t.label);
    continue;
  }
  const aoDup = keep.find(
    (k) => k.label.startsWith('AO') && t.label.startsWith('AO') && overlap(k, t) >= 0.5,
  );
  if (aoDup) {
    console.log('SKIP ao similar', t.label, '~', aoDup.label);
    continue;
  }
  const essDup = keep.find(
    (k) => /Ess$/i.test(k.label) && /Ess$/i.test(t.label) && k.leader === t.leader && overlap(k, t) >= 0.7,
  );
  if (essDup) {
    console.log('SKIP ess similar', t.label);
    continue;
  }
  const nearDup = keep.find((k) => k.size === t.size && k.leader === t.leader && overlap(k, t) >= 0.85);
  if (nearDup) {
    console.log('SKIP near dup', t.label, '~', nearDup.label);
    continue;
  }
  keep.push(t);
}

const folders = {
  'Demo · B12': ['GB12', 'DB12', 'NB12', 'SRB12', 'PCB12'],
  'Demo · Essence': ['Magic Ess', 'Fire Ess', 'Water Ess', 'Wind Ess', 'Light Ess'],
  'Demo · Rift': ['Rift R5'],
  'Demo · Beasts': ['Fire Beast'],
  'Demo · Arena': ['AO', 'AD'],
  'Demo · GvG': ['GD'],
  'Demo · Dimension': ['Dim R5 1', 'Dim R5 3'],
};

const layout = [];
for (const [setName, labels] of Object.entries(folders)) {
  const teams = [];
  for (const lbl of labels) {
    const matches = keep.filter((t) => t.label === lbl || t.label.startsWith(lbl));
    for (const t of matches) {
      teams.push({
        name: t.label,
        leader: t.leaderId,
        slots: t.ids,
        size: t.size,
      });
    }
  }
  if (teams.length) layout.push({ setName, teams });
}

// Fix folder for multiple AO - all labeled AO
const arena = keep.filter((t) => t.label === 'AO');
const gd = keep.filter((t) => t.label === 'GD');
const rift = keep.filter((t) => t.label.startsWith('Rift'));

const finalLayout = [
  {
    setName: 'Demo · B12',
    teams: keep
      .filter((t) => ['GB12', 'DB12', 'NB12', 'SRB12', 'PCB12'].includes(t.label))
      .map((t) => ({ name: t.label, leader: t.leaderId, slots: t.ids, size: t.size })),
  },
  {
    setName: 'Demo · Essence',
    teams: keep
      .filter((t) => /Ess$/i.test(t.label))
      .map((t) => ({ name: t.label, leader: t.leaderId, slots: t.ids, size: t.size })),
  },
  {
    setName: 'Demo · Rift',
    teams: keep
      .filter((t) => t.label.startsWith('Rift'))
      .map((t) => ({ name: t.label, leader: t.leaderId, slots: t.ids, size: t.size })),
  },
  {
    setName: 'Demo · Beasts',
    teams: keep
      .filter((t) => /Beast/i.test(t.label))
      .slice(0, 1)
      .map((t) => ({ name: t.label, leader: t.leaderId, slots: t.ids, size: t.size })),
  },
  {
    setName: 'Demo · Arena',
    teams: [
      ...arena.map((t) => ({ name: 'AO — ' + (t.leader || ''), leader: t.leaderId, slots: t.ids, size: t.size })),
      ...keep
        .filter((t) => t.label === 'AD')
        .map((t) => ({ name: t.label, leader: t.leaderId, slots: t.ids, size: t.size })),
    ],
  },
  {
    setName: 'Demo · GvG',
    teams: gd
      .slice(0, 4)
      .map((t, i) => ({
        name: 'GD — ' + (t.leader || String(i + 1)),
        leader: t.leaderId,
        slots: t.ids,
        size: t.size,
      })),
  },
  {
    setName: 'Demo · Dimension',
    teams: keep
      .filter((t) => t.label.startsWith('Dim'))
      .map((t) => ({ name: t.label, leader: t.leaderId, slots: t.ids, size: t.size })),
  },
].filter((b) => b.teams.length);

console.log(JSON.stringify({ keep: keep.map((t) => t.label), layout: finalLayout }, null, 2));
