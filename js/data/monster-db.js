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
    const direct = `https://swarfarm.com/${rel}`;
    const useProxy =
      typeof SWRM_SWARFARM_PROXY_STATIC === 'boolean' && SWRM_SWARFARM_PROXY_STATIC === true;
    const api = typeof window !== 'undefined' && typeof SWRM_API === 'string' ? SWRM_API : '';
    if (useProxy && api) return `${api}/swarfarm/${rel}`;
    return direct;
  }

  function swarfarmDirectUrl(relativePath) {
    const rel = String(relativePath || '').replace(/^\//, '');
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
    if (row.awakened === true || row.is_awakened === true) return true;
    if (row.awaken_level != null && Number(row.awaken_level) > 0) return true;
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

  function swarfarmApiUrl(pathAndQuery) {
    const rel = String(pathAndQuery || '').replace(/^\//, '');
    const direct = `https://swarfarm.com/${rel}`;
    if (
      typeof SWRM_SWARFARM_PROXY_STATIC === 'boolean' &&
      SWRM_SWARFARM_PROXY_STATIC &&
      typeof SWRM_API === 'string' &&
      SWRM_API
    ) {
      return `${SWRM_API}/swarfarm/${rel}`;
    }
    return direct;
  }

  function monsterBaseStatsAtLevel(metaRow, level) {
    if (!metaRow) return null;
    const maxLvl = Number(metaRow.max_level) || 40;
    const lv = Number(level) || 1;
    const hp = scaleStat(metaRow.base_hp, metaRow.max_lvl_hp, lv, maxLvl);
    const atk = scaleStat(metaRow.base_attack, metaRow.max_lvl_attack, lv, maxLvl);
    const def = scaleStat(metaRow.base_defense, metaRow.max_lvl_defense, lv, maxLvl);
    const spdFlat = Number(metaRow.base_speed ?? metaRow.speed);
    const spdScaled = scaleStat(metaRow.base_speed, metaRow.max_lvl_speed, lv, maxLvl);
    const spd = Number.isFinite(spdScaled)
      ? spdScaled
      : Number.isFinite(spdFlat)
        ? Math.round(spdFlat)
        : null;
    const critRate = Number(metaRow.crit_rate);
    const critDmg = Number(metaRow.crit_damage);
    const res = Number(metaRow.resistance);
    const acc = Number(metaRow.accuracy);
    if (
      hp == null &&
      atk == null &&
      def == null &&
      spd == null &&
      !Number.isFinite(critRate) &&
      !Number.isFinite(critDmg) &&
      !Number.isFinite(res) &&
      !Number.isFinite(acc)
    ) {
      return null;
    }
    return {
      hp: hp != null ? hp : null,
      atk: atk != null ? atk : null,
      def: def != null ? def : null,
      spd: spd != null ? spd : null,
      critRate: Number.isFinite(critRate) ? critRate : null,
      critDmg: Number.isFinite(critDmg) ? critDmg : null,
      res: Number.isFinite(res) ? res : null,
      acc: Number.isFinite(acc) ? acc : null,
    };
  }

  function hasUsableBaseStats(base) {
    if (!base || typeof base !== 'object') return false;
    return ['hp', 'atk', 'def', 'spd', 'critRate', 'critDmg', 'res', 'acc'].some((k) =>
      Number.isFinite(Number(base[k])),
    );
  }

  /** SWARFARM leader skill tiles: static/herders/images/skills/leader/leader_skill_{Attr}_{Area}.png */
  function leaderSkillIconUrl(leaderSkill) {
    if (!leaderSkill) return '';
    const attr = String(leaderSkill.attribute || '')
      .trim()
      .replace(/\s+/g, '_');
    if (!attr) return '';
    const area = String(leaderSkill.area || '').trim();
    const element = leaderSkill.element ? String(leaderSkill.element).trim() : '';
    let suffix = '';
    if (area === 'Element' && element) {
      suffix = `_${element}`;
    } else if (area && area !== 'General') {
      suffix = `_${area}`;
    }
    const filename = `leader_skill_${attr}${suffix}.png`;
    return swarfarmAssetUrl(`static/herders/images/skills/leader/${filename}`);
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
      awakened: m.awakened === true || (m.awaken_level != null && Number(m.awaken_level) > 0),
      base_hp: m.base_hp,
      base_attack: m.base_attack,
      base_defense: m.base_defense,
      base_speed: m.base_speed != null ? m.base_speed : m.speed,
      max_lvl_hp: m.max_lvl_hp,
      max_lvl_attack: m.max_lvl_attack,
      max_lvl_defense: m.max_lvl_defense,
      max_lvl_speed: m.max_lvl_speed != null ? m.max_lvl_speed : m.speed,
      speed: m.speed,
      max_level: m.max_level,
      crit_rate: m.crit_rate,
      crit_damage: m.crit_damage,
      resistance: m.resistance,
      accuracy: m.accuracy,
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
        const res = await fetch(url);
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
    const detail = options && options.detail === true;
    const cached = byCom2usId.get(id);
    const cachedHasStats =
      cached && cached.max_lvl_hp != null && cached.base_hp != null;
    if (
      cached &&
      !force &&
      !detail &&
      cached.archetype &&
      cachedHasStats &&
      cached.awaken_level != null
    ) {
      return cached;
    }
    if (cached && !force && detail && cachedHasStats && cached.leader_skill !== undefined) {
      return cached;
    }
    try {
      const url = swarfarmApiUrl(`api/v2/monsters/?com2us_id=${id}`);
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

  /** Detail panel only — never call for full roster (blocks UI). */
  async function fetchMonsterMetaForDetail(masterId) {
    return fetchMonsterMeta(masterId, { detail: true });
  }

  function mergeMonsterMetaIntoCache(masterId, row) {
    if (!row) return;
    const id = Number(masterId);
    const prev = byCom2usId.get(id);
    byCom2usId.set(id, prev ? { ...prev, ...row } : row);
  }

  window.SWRM_MONSTER_DB = {
    loadMonsterIndex,
    fetchMonsterMetaForDetail,
    mergeMonsterMetaIntoCache,
    fetchMonsterMeta,
    ensureMonsterBaseStats,
    swarfarmDirectUrl,
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
    hasUsableBaseStats,
    leaderSkillIconUrl,
    swarfarmApiUrl,
    IMG_BASES,
    isReady: () => loaded,
    indexCount,
  };
})();
