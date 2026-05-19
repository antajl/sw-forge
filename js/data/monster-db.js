// =============================================
// monster-db.js — SWARFARM bestiary index (com2us_id → name, icon)
// =============================================
(function () {
  const INDEX_URL = 'data/monsters-index.json';
  const IMG_BASES = [
    'https://swarfarm.com/static/herders/images/monsters/',
    'https://swarfarm.com/static/herders/images/units/',
  ];

  const RUNE_SET_IMG_BASE = 'https://swarfarm.com/static/herders/images/runes/';
  const DEVILMON_DARK_IMG = 'https://swarfarm.com/static/herders/images/monsters/devilmon_dark.png';
  const ELEMENT_ICON_BASE = 'static/herders/images/elements/';

  /** @type {Map<number, object>} */
  let byCom2usId = new Map();
  let loadPromise = null;
  let loaded = false;
  let lastLoadCount = 0;

  function monsterImageUrl(imageFilename, baseIndex) {
    if (!imageFilename) return '';
    const i = baseIndex != null ? baseIndex : 0;
    return IMG_BASES[i] ? IMG_BASES[i] + imageFilename : '';
  }

  function devilmonImageUrl() {
    return DEVILMON_DARK_IMG;
  }

  function runeSetImageUrl(setName) {
    const key = String(setName || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_');
    if (!key || key.startsWith('set')) return '';
    return `${RUNE_SET_IMG_BASE}${key}.png`;
  }

  function bestiaryUrl(slug) {
    if (!slug) return 'https://swarfarm.com/bestiary/';
    return `https://swarfarm.com/bestiary/${slug}/`;
  }

  /** Proxy SWARFARM static assets through our Worker when available. */
  function swarfarmAssetUrl(relativePath) {
    const rel = String(relativePath || '').replace(/^\//, '');
    const api = typeof window !== 'undefined' && typeof SWRM_API === 'string' ? SWRM_API : '';
    if (api) return `${api}/swarfarm/${rel}`;
    return `https://swarfarm.com/${rel}`;
  }

  function elementIconUrl(elementName) {
    const k = String(elementName || '').trim().toLowerCase();
    if (!k || !['fire', 'water', 'wind', 'light', 'dark'].includes(k)) return '';
    return swarfarmAssetUrl(`${ELEMENT_ICON_BASE}${k}.png`);
  }

  function isMonsterAwakened(masterId, metaRow) {
    const row = metaRow || lookupMonster(masterId);
    if (!row) return false;
    if (row.awaken_level != null && Number(row.awaken_level) > 0) return true;
    if (row.is_awakened === true) return true;
    return false;
  }

  function scaleStat(base, max, level, maxLevel) {
    const b = Number(base);
    const m = Number(max);
    const lv = Number(level);
    const cap = Number(maxLevel);
    if (!Number.isFinite(b) || !Number.isFinite(m)) return null;
    if (!Number.isFinite(lv) || !Number.isFinite(cap) || cap <= 1) return Math.round(m);
    const t = Math.max(0, Math.min(1, (lv - 1) / (cap - 1)));
    return Math.round(b + (m - b) * t);
  }

  function monsterBaseStatsAtLevel(metaRow, level) {
    if (!metaRow) return null;
    const maxLvl = Number(metaRow.max_level) || 40;
    const lv = Number(level) || 1;
    const hp = scaleStat(metaRow.base_hp, metaRow.max_lvl_hp, lv, maxLvl);
    const atk = scaleStat(metaRow.base_attack, metaRow.max_lvl_attack, lv, maxLvl);
    const def = scaleStat(metaRow.base_defense, metaRow.max_lvl_defense, lv, maxLvl);
    const spd = scaleStat(metaRow.base_speed, metaRow.max_lvl_speed, lv, maxLvl);
    if (hp == null && atk == null) return null;
    return { hp: hp ?? 0, atk: atk ?? 0, def: def ?? 0, spd: spd ?? 0 };
  }

  function slimMonsterFromApi(m) {
    return {
      com2us_id: m.com2us_id,
      name: m.name,
      element: m.element,
      archetype: m.archetype || '',
      natural_stars: m.natural_stars,
      image_filename: m.image_filename,
      bestiary_slug: m.bestiary_slug,
      awaken_level: m.awaken_level != null ? Number(m.awaken_level) : 0,
      base_hp: m.base_hp,
      base_attack: m.base_attack,
      base_defense: m.base_defense,
      base_speed: m.base_speed,
      max_lvl_hp: m.max_lvl_hp,
      max_lvl_attack: m.max_lvl_attack,
      max_lvl_defense: m.max_lvl_defense,
      max_lvl_speed: m.max_lvl_speed,
      max_level: m.max_level,
      leader_skill: m.leader_skill || null,
      skills: Array.isArray(m.skills) ? m.skills : [],
    };
  }

  function ingestMonsterList(list, target) {
    if (!list) return 0;
    let n = 0;
    if (Array.isArray(list)) {
      for (const row of list) {
        if (row && row.com2us_id != null) {
          target.set(Number(row.com2us_id), row);
          n += 1;
        }
      }
    } else if (typeof list === 'object') {
      for (const [k, row] of Object.entries(list)) {
        const id = Number(row && row.com2us_id != null ? row.com2us_id : k);
        if (Number.isFinite(id) && row) {
          target.set(id, row);
          n += 1;
        }
      }
    }
    return n;
  }

  async function loadMonsterIndex(options) {
    const force = options && options.force === true;
    if (!force && loaded && byCom2usId.size > 0) return byCom2usId;
    if (!force && loadPromise) return loadPromise;

    loadPromise = (async () => {
      const next = new Map();
      try {
        const url = new URL(INDEX_URL, window.location.href);
        url.searchParams.set('_', String(Date.now()).slice(0, 10));
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const list = data.monsters != null ? data.monsters : data;
        const ingested = ingestMonsterList(list, next);
        const expected = Number(data.count);
        if (ingested === 0 && Number.isFinite(expected) && expected > 0) {
          console.warn(
            'Monster index: file reports',
            expected,
            'monsters but none were parsed — check JSON shape',
          );
        }
        byCom2usId = next;
        lastLoadCount = byCom2usId.size;
        loaded = true;
        if (lastLoadCount > 0) {
          console.log(`Monster index loaded: ${lastLoadCount} monsters`);
        } else {
          console.warn(
            'Monster index is empty — run: node tools/fetch-monsters-index.mjs',
          );
        }
      } catch (e) {
        console.warn('Monster index load failed:', e);
        byCom2usId = new Map();
        lastLoadCount = 0;
        loaded = true;
      } finally {
        loadPromise = null;
      }
      return byCom2usId;
    })();
    return loadPromise;
  }

  function lookupMonster(masterId) {
    const id = Number(masterId);
    if (!Number.isFinite(id)) return null;
    return byCom2usId.get(id) || null;
  }

  function indexCount() {
    return byCom2usId.size;
  }

  function monsterDisplayName(masterId, fallback) {
    const row = lookupMonster(masterId);
    if (row && row.name) return row.name;
    return fallback || `#${masterId}`;
  }

  function monsterArchetype(masterId) {
    const row = lookupMonster(masterId);
    return row && row.archetype ? String(row.archetype) : '';
  }

  /** Fetch single monster from SWARFARM API (merges into cache). */
  async function fetchMonsterMeta(masterId, options) {
    const id = Number(masterId);
    if (!Number.isFinite(id)) return null;
    const force = options && options.force === true;
    const cached = byCom2usId.get(id);
    if (cached && cached.max_lvl_hp != null && !force) return cached;
    try {
      const url = `https://swarfarm.com/api/v2/monsters/?com2us_id=${id}`;
      const res = await fetch(url);
      if (!res.ok) return cached || null;
      const data = await res.json();
      const m = data.results && data.results[0];
      if (!m) return cached || null;
      const row = slimMonsterFromApi(m);
      const prev = byCom2usId.get(id);
      byCom2usId.set(id, prev ? { ...prev, ...row } : row);
      return byCom2usId.get(id);
    } catch (e) {
      return cached || null;
    }
  }

  async function ensureMonsterBaseStats(masterId, level) {
    const row = await fetchMonsterMeta(masterId, { force: false });
    return monsterBaseStatsAtLevel(row, level);
  }

  async function hydrateMonsterMeta(masterIds) {
    await loadMonsterIndex();
    if (byCom2usId.size === 0) {
      await loadMonsterIndex({ force: true });
    }
    const uniq = [...new Set((masterIds || []).map(Number).filter(Number.isFinite))];
    const missing = uniq.filter((id) => !byCom2usId.has(id));
    const needsArchetype = uniq.filter((id) => {
      const row = byCom2usId.get(id);
      return (
        !row ||
        !row.archetype ||
        row.max_lvl_hp == null ||
        row.leader_skill === undefined
      );
    });
    const batch = 8;
    for (let i = 0; i < missing.length; i += batch) {
      const slice = missing.slice(i, i + batch);
      await Promise.all(slice.map((id) => fetchMonsterMeta(id)));
    }
    for (let i = 0; i < needsArchetype.length; i += batch) {
      const slice = needsArchetype.slice(i, i + batch);
      await Promise.all(slice.map((id) => fetchMonsterMeta(id)));
    }
  }

  window.SWRM_MONSTER_DB = {
    loadMonsterIndex,
    hydrateMonsterMeta,
    fetchMonsterMeta,
    ensureMonsterBaseStats,
    lookupMonster,
    monsterDisplayName,
    monsterArchetype,
    monsterImageUrl,
    devilmonImageUrl,
    runeSetImageUrl,
    bestiaryUrl,
    swarfarmAssetUrl,
    elementIconUrl,
    isMonsterAwakened,
    monsterBaseStatsAtLevel,
    IMG_BASES,
    isReady: () => loaded,
    indexCount,
  };
})();
