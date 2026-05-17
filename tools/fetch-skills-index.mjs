/**
 * Fetch SWARFARM /api/v2/skills/ → data/skills-index.json (com2us_id → max_level)
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
        'User-Agent': 'SWRuneMaster-skills-index/1.0 (local dev; one-time skill sync)',
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
  if (!resume || !fs.existsSync(outPath)) return { byId: {}, nextUrl: null };
  try {
    const data = JSON.parse(fs.readFileSync(outPath, 'utf8'));
    const byId = data.byId && typeof data.byId === 'object' ? data.byId : {};
    const nextUrl = data._nextUrl || null;
    console.log(`Resume: ${Object.keys(byId).length} skills on disk`);
    return { byId, nextUrl };
  } catch (e) {
    console.warn('Resume read failed:', e.message);
    return { byId: {}, nextUrl: null };
  }
}

function savePartial(byId, nextUrl, complete) {
  const payload = {
    generatedAt: new Date().toISOString(),
    count: Object.keys(byId).length,
    complete: !!complete,
    byId,
    _nextUrl: nextUrl || null,
  };
  fs.writeFileSync(outPath, JSON.stringify(payload));
}

async function main() {
  let { byId, nextUrl } = loadPartial();
  if (!nextUrl) {
    const first = await fetchJson(`https://swarfarm.com/api/v2/skills/?limit=${PAGE_SIZE}`);
    for (const s of first.results || []) {
      if (s && s.com2us_id != null && s.max_level != null) {
        byId[String(s.com2us_id)] = Number(s.max_level);
      }
    }
    nextUrl = first.next;
    savePartial(byId, nextUrl, false);
    console.log(`Page 1 — ${Object.keys(byId).length} skills`);
    await sleep(PAUSE_MS);
  }

  let page = 2;
  while (nextUrl) {
    const data = await fetchJson(nextUrl);
    for (const s of data.results || []) {
      if (s && s.com2us_id != null && s.max_level != null) {
        byId[String(s.com2us_id)] = Number(s.max_level);
      }
    }
    nextUrl = data.next;
    savePartial(byId, nextUrl, !nextUrl);
    console.log(`Page ${page} — ${Object.keys(byId).length} skills`);
    page += 1;
    if (nextUrl) await sleep(PAUSE_MS);
  }

  savePartial(byId, null, true);
  console.log(`Done: ${Object.keys(byId).length} skills → ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
