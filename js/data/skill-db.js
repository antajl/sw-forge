// skill-db.js — SWARFARM skill max levels (com2us_id → max_level)
(function () {
  const INDEX_URL = 'data/skills-index.json';

  /** @type {Map<number, number>} */
  let byCom2usId = new Map();
  /** @type {Map<number, string>} */
  let iconByCom2usId = new Map();
  /** @type {Map<number, { name: string, description: string }>} */
  let metaByCom2usId = new Map();
  let loadPromise = null;
  let loaded = false;
  let lastLoadCount = 0;

  function ingestById(obj, target) {
    if (!obj || typeof obj !== 'object') return 0;
    let n = 0;
    for (const [k, v] of Object.entries(obj)) {
      const id = Number(k);
      const max = Number(v);
      if (Number.isFinite(id) && Number.isFinite(max) && max > 0) {
        target.set(id, max);
        n += 1;
      }
    }
    return n;
  }

  async function loadSkillIndex(options) {
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
        const ingested = ingestById(data.byId, next);
        if (ingested === 0 && Array.isArray(data.skills)) {
          for (const row of data.skills) {
            if (row && row.com2us_id != null && row.max_level != null) {
              next.set(Number(row.com2us_id), Number(row.max_level));
            }
          }
        }
        byCom2usId = next;
        const iconMap = data.byIcon;
        if (iconMap && typeof iconMap === 'object') {
          for (const [k, fn] of Object.entries(iconMap)) {
            const id = Number(k);
            if (Number.isFinite(id) && fn) iconByCom2usId.set(id, String(fn));
          }
        }
        if (Array.isArray(data.skills)) {
          for (const row of data.skills) {
            if (row && row.com2us_id != null && row.icon_filename) {
              iconByCom2usId.set(Number(row.com2us_id), String(row.icon_filename));
            }
          }
        }
        lastLoadCount = byCom2usId.size;
        loaded = true;
        if (lastLoadCount > 0) {
          console.log(`Skill index loaded: ${lastLoadCount} skills`);
        } else {
          console.warn('Skill index empty — run: node tools/fetch-skills-index.mjs');
        }
      } catch (e) {
        console.warn('Skill index load failed:', e);
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

  /** Skills with max_level 1 are innate/passive — no devilmon upgrades. */
  function isUpgradeableSkill(entry) {
    if (!entry || !entry.hasMax) return true;
    return entry.maxLevel > 1;
  }

  function maxLevel(skillId) {
    const id = Number(skillId);
    if (!Number.isFinite(id)) return null;
    const v = byCom2usId.get(id);
    return v != null && Number.isFinite(v) ? v : null;
  }

  function stripSkillHtml(text) {
    return String(text || '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function ingestSkillApiRow(s) {
    if (!s || s.com2us_id == null) return;
    const id = Number(s.com2us_id);
    if (!Number.isFinite(id)) return;
    if (s.max_level != null) {
      const max = Number(s.max_level);
      if (Number.isFinite(max) && max > 0) byCom2usId.set(id, max);
    }
    if (s.icon_filename) iconByCom2usId.set(id, String(s.icon_filename));
    metaByCom2usId.set(id, {
      name: stripSkillHtml(s.name || s.name_en || ''),
      description: stripSkillHtml(s.description || s.description_en || ''),
    });
  }

  function skillApiUrl(com2usId) {
    const path = `api/v2/skills/?com2us_id=${encodeURIComponent(com2usId)}`;
    const api = typeof SWRM_API === 'string' ? SWRM_API.replace(/\/$/, '') : '';
    if (api) return `${api}/swarfarm/${path}`;
    return `https://swarfarm.com/${path}`;
  }

  async function fetchSkillMeta(skillId) {
    const id = Number(skillId);
    if (!Number.isFinite(id)) return null;
    const cached = metaByCom2usId.get(id);
    if (cached && cached.description) return cached;
    try {
      const res = await fetch(skillApiUrl(id));
      if (!res.ok) return null;
      const data = await res.json();
      const s = data.results && data.results[0];
      if (!s) return null;
      ingestSkillApiRow(s);
      return metaByCom2usId.get(id) || null;
    } catch (e) {
      return null;
    }
  }

  async function fetchSkillMaxLevel(skillId) {
    const id = Number(skillId);
    if (!Number.isFinite(id)) return null;
    if (byCom2usId.has(id) && metaByCom2usId.get(id)?.description) return byCom2usId.get(id);
    try {
      const res = await fetch(skillApiUrl(id));
      if (!res.ok) return null;
      const data = await res.json();
      const s = data.results && data.results[0];
      if (!s || s.max_level == null) return null;
      ingestSkillApiRow(s);
      const max = Number(s.max_level);
      return Number.isFinite(max) && max > 0 ? max : null;
    } catch (e) {
      return null;
    }
  }

  function formatSkillTooltip(skillId, level) {
    const id = Number(skillId);
    const m = metaByCom2usId.get(id);
    const lv = Number.isFinite(Number(level)) ? Number(level) : null;
    if (m?.description) {
      const head = m.name ? `${m.name}\n` : '';
      const lvLine = lv != null ? `\nLv ${lv}` : '';
      return `${head}${m.description}${lvLine}`.trim();
    }
    if (m?.name) return m.name;
    return lv != null ? `Skill ${id} (Lv ${lv})` : '';
  }

  async function hydrateSkillMaxLevels(skillIds) {
    await loadSkillIndex();
    const uniq = [...new Set((skillIds || []).map(Number).filter(Number.isFinite))];
    const missing = uniq.filter((id) => !byCom2usId.has(id));
    const batch = 6;
    for (let i = 0; i < missing.length; i += batch) {
      const slice = missing.slice(i, i + batch);
      await Promise.all(slice.map((id) => fetchSkillMaxLevel(id)));
      if (i + batch < missing.length) {
        await new Promise((r) => setTimeout(r, 400));
      }
    }
  }

  /**
   * @param {Array<{skillId:number, level:number}>} skills
   * @returns {{ skills: Array<object>, skillUpsNeeded: number, skillsMaxed: boolean, skillsKnown: boolean }}
   */
  function enrichUnitSkills(skills) {
    const list = Array.isArray(skills) ? skills : [];
    let skillUpsNeeded = 0;
    let skillsKnown = list.length > 0;
    let allMaxed = list.length > 0;

    const enriched = list.map((s, idx) => {
      const skillId = Number(s.skillId);
      const level = Number.isFinite(Number(s.level)) ? Number(s.level) : 0;
      const maxLv = maxLevel(skillId);
      const hasMax = maxLv != null;
      const isMaxed = hasMax && level >= maxLv;
      const deficit = hasMax && level < maxLv ? maxLv - level : 0;
      const upgradeable = isUpgradeableSkill({ hasMax, maxLevel: maxLv });
      if (upgradeable) {
        if (hasMax) {
          skillUpsNeeded += deficit;
          if (!isMaxed) allMaxed = false;
        } else {
          skillsKnown = false;
          allMaxed = false;
        }
      }
      return {
        skillId,
        level,
        slot: idx + 1,
        maxLevel: maxLv,
        hasMax,
        isMaxed,
        deficit,
        upgradeable,
      };
    });

    const displayable = enriched.filter((s) => s.upgradeable).map((s, i) => ({ ...s, slot: i + 1 }));

    if (!list.length) {
      skillsKnown = false;
      allMaxed = false;
    } else if (!displayable.length) {
      skillsKnown = enriched.every((s) => s.hasMax);
      allMaxed = true;
      skillUpsNeeded = 0;
    } else {
      allMaxed = displayable.every((s) => s.isMaxed);
      skillsKnown = displayable.every((s) => s.hasMax);
    }

    return { skills: displayable, skillUpsNeeded, skillsMaxed: allMaxed, skillsKnown };
  }

  function skillIconUrl(skillId) {
    const id = Number(skillId);
    if (!Number.isFinite(id) || id <= 0) return '';
    const fn = iconByCom2usId.get(id);
    if (!fn) return '';
    const rel = `static/herders/images/skills/${fn}`;
    const direct = `https://swarfarm.com/${rel}`;
    const useProxy =
      typeof SWRM_SWARFARM_PROXY_STATIC === 'boolean' && SWRM_SWARFARM_PROXY_STATIC === true;
    const api = typeof SWRM_API === 'string' ? SWRM_API : '';
    if (useProxy && api) return `${api}/swarfarm/${rel}`;
    return direct;
  }

  async function ensureSkillIcon(skillId) {
    const id = Number(skillId);
    if (!Number.isFinite(id) || id <= 0) return '';
    if (iconByCom2usId.has(id)) return skillIconUrl(id);
    await fetchSkillMaxLevel(id);
    return skillIconUrl(id);
  }

  function formatSkillLevel(s, t) {
    const lv = Number(s.level);
    const maxLv = s.maxLevel;
    if (maxLv == null || !s.hasMax) return String(lv);
    if (s.isMaxed) {
      const maxLbl = t.monstersSkillMax || 'max';
      return `${maxLv}/${maxLv} ${maxLbl}`;
    }
    return `${lv}/${maxLv}`;
  }

  function enrichUnitSkillsForDetail(skills) {
    const list = Array.isArray(skills) ? skills : [];
    return list.map((s, idx) => {
      const skillId = Number(s.skillId);
      const level = Number.isFinite(Number(s.level)) ? Number(s.level) : 0;
      const maxLv = maxLevel(skillId);
      const hasMax = maxLv != null;
      const upgradeable = hasMax ? maxLv > 1 : true;
      const isMaxed = hasMax && level >= maxLv;
      return {
        skillId,
        level,
        slot: idx + 1,
        maxLevel: maxLv,
        hasMax,
        isMaxed,
        upgradeable,
        passive: hasMax && maxLv <= 1,
      };
    });
  }

  function formatSkillLevelDetail(s) {
    if (!s.upgradeable) return '';
    if (!s.hasMax) return String(s.level);
    return `${s.level}/${s.maxLevel}`;
  }

  window.SWRM_SKILL_DB = {
    loadSkillIndex,
    hydrateSkillMaxLevels,
    fetchSkillMaxLevel,
    fetchSkillMeta,
    formatSkillTooltip,
    skillIconUrl,
    ensureSkillIcon,
    maxLevel,
    isUpgradeableSkill,
    enrichUnitSkills,
    enrichUnitSkillsForDetail,
    formatSkillLevel,
    formatSkillLevelDetail,
    isReady: () => loaded,
    indexCount: () => byCom2usId.size,
  };
})();
