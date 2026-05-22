/**
 * Fetch SWARFARM /api/v2/skills/ → data/skills-index.json
 * (max_level, icons, descriptions, upgrades — bundled for offline UI)
 *
 * Run: node tools/fetch-skills-index.mjs
 * Resume: node tools/fetch-skills-index.mjs --resume
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outPath = path.join(root, 'data/skills-index.json');
const PAGE_SIZE = 100;
const PAUSE_MS = 1600;
const MAX_RETRIES = 8;
const resume = process.argv.includes('--resume');
const fresh = process.argv.includes('--fresh');

if (fresh && fs.existsSync(outPath)) {
  fs.unlinkSync(outPath);
  console.log('Fresh run: removed existing skills-index.json');
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function stripHtml(text) {
  return String(text || '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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
        'User-Agent': 'SWRuneMaster-skills-index/2.0 (local dev; skill sync)',
      },
    });
    if (res.ok) return res.json();
    if (res.status === 429 || res.status >= 500) {
      const retryMs = parseRetryAfterMs(res) ?? Math.min(60000, 2000 * 2 ** attempt);
      console.warn(`HTTP ${res.status} — wait ${Math.round(retryMs / 1000)}s (${attempt}/${MAX_RETRIES})`);
      await sleep(retryMs);
      continue;
    }
    throw new Error(`HTTP ${res.status} ${url}`);
  }
  throw new Error(`Failed after ${MAX_RETRIES} retries: ${url}`);
}

function loadPartial() {
  if (!resume || !fs.existsSync(outPath)) {
    return { byId: {}, byIcon: {}, metaById: {}, nextUrl: null };
  }
  try {
    const data = JSON.parse(fs.readFileSync(outPath, 'utf8'));
    const byId = data.byId && typeof data.byId === 'object' ? data.byId : {};
    const byIcon = data.byIcon && typeof data.byIcon === 'object' ? data.byIcon : {};
    const metaById = data.metaById && typeof data.metaById === 'object' ? data.metaById : {};
    const nextUrl = data._nextUrl || null;
    console.log(`Resume: ${Object.keys(byId).length} skills, ${Object.keys(metaById).length} meta on disk`);
    return { byId, byIcon, metaById, nextUrl };
  } catch (e) {
    console.warn('Resume read failed:', e.message);
    return { byId: {}, byIcon: {}, metaById: {}, nextUrl: null };
  }
}

function savePartial(byId, byIcon, metaById, nextUrl, complete) {
  const payload = {
    generatedAt: new Date().toISOString(),
    count: Object.keys(byId).length,
    metaCount: Object.keys(metaById).length,
    complete: !!complete,
    schema: 2,
    byId,
    byIcon,
    metaById,
    _nextUrl: nextUrl || null,
  };
  fs.writeFileSync(outPath, JSON.stringify(payload));
}

function compactUpgrades(upgrades) {
  if (!Array.isArray(upgrades)) return [];
  return upgrades
    .map((u) => {
      if (typeof u === 'string') return { e: stripHtml(u), a: null };
      if (!u || !u.effect) return null;
      const amt = u.amount != null && Number.isFinite(Number(u.amount)) ? Number(u.amount) : null;
      return { e: stripHtml(u.effect), a: amt };
    })
    .filter(Boolean);
}

function ingestSkill(s, byId, byIcon, metaById) {
  if (!s || s.com2us_id == null || s.max_level == null) return;
  const id = String(s.com2us_id);
  byId[id] = Number(s.max_level);
  if (s.icon_filename) byIcon[id] = String(s.icon_filename);
  const desc = stripHtml(s.description || s.description_en || '');
  const name = stripHtml(s.name || s.name_en || '');
  const ups = compactUpgrades(s.upgrades);
  if (name || desc || ups.length) {
    metaById[id] = {
      n: name,
      d: desc,
      ct:
        s.cooltime != null && Number.isFinite(Number(s.cooltime)) ? Number(s.cooltime) : null,
      up: ups,
    };
  }
}

async function main() {
  let { byId, byIcon, metaById, nextUrl } = loadPartial();
  if (!nextUrl) {
    const first = await fetchJson(`https://swarfarm.com/api/v2/skills/?limit=${PAGE_SIZE}`);
    for (const s of first.results || []) ingestSkill(s, byId, byIcon, metaById);
    nextUrl = first.next;
    savePartial(byId, byIcon, metaById, nextUrl, false);
    console.log(`Page 1 — ${Object.keys(byId).length} skills`);
    await sleep(PAUSE_MS);
  }

  let page = 2;
  while (nextUrl) {
    const data = await fetchJson(nextUrl);
    for (const s of data.results || []) ingestSkill(s, byId, byIcon, metaById);
    nextUrl = data.next;
    savePartial(byId, byIcon, metaById, nextUrl, !nextUrl);
    console.log(`Page ${page} — ${Object.keys(byId).length} skills`);
    page += 1;
    if (nextUrl) await sleep(PAUSE_MS);
  }

  savePartial(byId, byIcon, metaById, null, true);
  console.log(
    `Done: ${Object.keys(byId).length} skills, ${Object.keys(metaById).length} meta → ${outPath}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
