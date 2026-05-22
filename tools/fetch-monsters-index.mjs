/**
 * Fetch SWARFARM /api/v2/monsters/ and write data/monsters-index.json
 *
 * SWARFARM rate-limits aggressive crawls (HTTP 429). This script uses small pages,
 * pauses between requests, and retries with backoff.
 *
 * Run: node tools/fetch-monsters-index.mjs
 * Resume after partial run: node tools/fetch-monsters-index.mjs --resume
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outPath = path.join(root, 'data/monsters-index.json');
const PAGE_SIZE = 50;
const PAUSE_MS = 1800;
const MAX_RETRIES = 8;

const resume = process.argv.includes('--resume');
const fresh = process.argv.includes('--fresh');
const SCHEMA = 2;

if (fresh && fs.existsSync(outPath)) {
  fs.unlinkSync(outPath);
  console.log('Fresh run: removed existing monsters-index.json');
}

function stripHtml(text) {
  return String(text || '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function slimLeaderSkill(ls) {
  if (!ls) return null;
  const sk = ls.skill;
  let skill = null;
  if (sk && typeof sk === 'object') {
    skill = {
      com2us_id: sk.com2us_id,
      icon_filename: sk.icon_filename || null,
      name: sk.name || null,
    };
    const desc = stripHtml(sk.description || sk.description_en || '');
    if (desc) skill.description = desc;
  }
  return {
    attribute: ls.attribute,
    amount: ls.amount,
    area: ls.area,
    element: ls.element || null,
    skill,
  };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseRetryAfterMs(res) {
  const h = res.headers.get('retry-after');
  if (!h) return null;
  const n = Number(h);
  if (Number.isFinite(n) && n > 0) return n * 1000;
  const t = Date.parse(h);
  if (Number.isFinite(t)) return Math.max(0, t - Date.now());
  return null;
}

async function fetchJson(url) {
  let attempt = 0;
  while (attempt < MAX_RETRIES) {
    attempt += 1;
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'SWRuneMaster-monster-index/1.0 (local dev; one-time bestiary sync)',
      },
    });
    if (res.ok) return res.json();

    if (res.status === 429 || res.status >= 500) {
      const retryMs = parseRetryAfterMs(res) ?? Math.min(60000, 2000 * 2 ** attempt);
      console.warn(`\nHTTP ${res.status} — wait ${Math.round(retryMs / 1000)}s (attempt ${attempt}/${MAX_RETRIES})`);
      await sleep(retryMs);
      continue;
    }
    throw new Error(`HTTP ${res.status} ${url}`);
  }
  throw new Error(`Failed after ${MAX_RETRIES} retries: ${url}`);
}

function slimMonster(m) {
  return {
    com2us_id: m.com2us_id,
    name: m.name,
    element: m.element,
    archetype: m.archetype || '',
    natural_stars: m.natural_stars,
    image_filename: m.image_filename,
    bestiary_slug: m.bestiary_slug,
    awaken_level: m.awaken_level != null ? Number(m.awaken_level) : 0,
    awakened: m.awakened === true || (m.awaken_level != null && Number(m.awaken_level) > 0),
    base_hp: m.base_hp,
    base_attack: m.base_attack,
    base_defense: m.base_defense,
    base_speed: m.base_speed != null ? m.base_speed : m.speed,
    max_lvl_hp: m.max_lvl_hp,
    max_lvl_attack: m.max_lvl_attack,
    max_lvl_defense: m.max_lvl_defense,
    max_lvl_speed: m.max_lvl_speed != null ? m.max_lvl_speed : m.speed,
    max_level: m.max_level,
    crit_rate: m.crit_rate,
    crit_damage: m.crit_damage,
    resistance: m.resistance,
    accuracy: m.accuracy,
    leader_skill: slimLeaderSkill(m.leader_skill),
  };
}

function loadPartial() {
  if (!resume || !fs.existsSync(outPath)) return { monsters: [], nextUrl: null };
  try {
    const data = JSON.parse(fs.readFileSync(outPath, 'utf8'));
    const monsters = Array.isArray(data.monsters) ? data.monsters : [];
    const nextUrl = data._nextUrl || null;
    console.log(`Resume: ${monsters.length} monsters already on disk`);
    return { monsters, nextUrl };
  } catch (e) {
    console.warn('Resume read failed, starting fresh:', e.message);
    return { monsters: [], nextUrl: null };
  }
}

function writePartial(monsters, nextUrl) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(
    outPath,
    JSON.stringify(
      {
        schema: SCHEMA,
        generatedAt: new Date().toISOString(),
        count: monsters.length,
        complete: !nextUrl,
        _nextUrl: nextUrl || undefined,
        monsters,
      },
      null,
      0,
    ),
    'utf8',
  );
}

async function fetchAll() {
  let { monsters, nextUrl } = loadPartial();
  const seen = new Set(monsters.map((m) => m.com2us_id));
  let url =
    nextUrl ||
    `https://swarfarm.com/api/v2/monsters/?page_size=${PAGE_SIZE}`;

  while (url) {
    const data = await fetchJson(url);
    for (const m of data.results || []) {
      if (m.com2us_id == null || seen.has(m.com2us_id)) continue;
      seen.add(m.com2us_id);
      monsters.push(slimMonster(m));
    }
    url = data.next;
    process.stdout.write(`\r${monsters.length} monsters…`);
    writePartial(monsters, url);
    if (url) await sleep(PAUSE_MS);
  }
  console.log(`\nTotal: ${monsters.length}`);
  return monsters;
}

const monsters = await fetchAll();
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(
  outPath,
  JSON.stringify(
    {
      schema: SCHEMA,
      generatedAt: new Date().toISOString(),
      count: monsters.length,
      complete: true,
      monsters,
    },
    null,
    0,
  ),
  'utf8',
);
console.log('wrote', outPath);
