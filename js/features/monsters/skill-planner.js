// js/features/monsters/skill-planner.js — devilmon / skill-up planner (account-wide)
  const SKILL_PLANNER_STORAGE_KEY = 'swrm_skill_planner_exclude_storage_v1';

  let skillPlannerBound = false;
  let skillPlannerNatFilter = 'all';
  let skillPlannerExcludeStorage = true;
  let skillPlannerView = 'queue';
  /** @type {{ col: string, dir: 'asc'|'desc' }|null} */
  let skillPlannerQueueSort = null;
  /** @type {{ col: string, dir: 'asc'|'desc' }|null} */
  let skillPlannerStuckSort = null;
  /** @type {Array<object>} */
  let skillPlannerUnitsCache = [];
  let skillPlannerCdHydrateGen = 0;
  let skillPlannerCdMetaReady = false;
  /** @type {Promise<void>|null} */
  let skillPlannerRenderPromise = null;

  function readSkillPlannerExcludeStorage() {
    try {
      const v = localStorage.getItem(SKILL_PLANNER_STORAGE_KEY);
      if (v === '0' || v === 'false') return false;
      if (v === '1' || v === 'true') return true;
    } catch (e) { /* ignore */ }
    return true;
  }

  function writeSkillPlannerExcludeStorage(on) {
    try {
      localStorage.setItem(SKILL_PLANNER_STORAGE_KEY, on ? '1' : '0');
    } catch (e) { /* ignore */ }
  }

  function syncSkillPlannerExcludeStorageButton(t) {
    const btn = document.getElementById('skill-planner-exclude-storage');
    if (!btn) return;
    const hiding = !!skillPlannerExcludeStorage;
    btn.classList.toggle('is-active', hiding);
    btn.setAttribute('aria-pressed', hiding ? 'true' : 'false');
    const lbl = document.getElementById('lbl-skill-planner-exclude-storage');
    if (lbl) {
      lbl.textContent = hiding
        ? t.skillPlannerShowStorage || 'Include Storage'
        : t.skillPlannerHideStorage || 'Exclude Storage';
    }
  }

  function showSkillPlannerView(view) {
    const id = view === 'stuck' ? 'stuck' : 'queue';
    skillPlannerView = id;
    document.querySelectorAll('.skill-planner__tab').forEach((btn) => {
      const on = btn.dataset.plannerView === id;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
      btn.tabIndex = on ? 0 : -1;
    });
    document.querySelectorAll('.skill-planner__panel').forEach((pane) => {
      const on = pane.id === `skill-planner-panel-${id}`;
      pane.classList.toggle('is-active', on);
      if (on) pane.removeAttribute('hidden');
      else pane.setAttribute('hidden', '');
    });
    if (id === 'stuck') void paintSkillPlannerCdPanel();
  }

  function syncSkillPlannerCdTabLabel(stats, t) {
    const stuckTab = document.getElementById('skill-planner-tab-stuck');
    if (!stuckTab) return;
    const stuckLbl = t.skillPlannerTabStuck || 'Cooldown hunt';
    const count = stats && stats.stuckRows > 0 ? ` (${stats.stuckRows})` : '';
    const label = stuckTab.querySelector('.rules-subtab__label');
    if (label) label.textContent = stuckLbl + count;
  }

  function paintSkillPlannerQueue(rosterUnits, t) {
    const queueWrap = document.getElementById('skill-planner-queue');
    const emptyEl = document.getElementById('skill-planner-empty');
    const skillDb = window.SWRM_SKILL_DB;
    if (!queueWrap) return;
    const noData = !rosterUnits.length;
    const stats = computeSkillPlannerStats(rosterUnits);
    const noUps = !noData && stats.skillUpsTotal === 0;
    if (emptyEl) {
      emptyEl.hidden = !noData && !noUps;
      emptyEl.textContent = noData
        ? t.skillPlannerEmptyNoData || 'Load your export first (Runes tab).'
        : t.skillPlannerEmptyMaxed || 'All tracked monsters have maxed skills.';
    }
    if (noData || noUps) {
      queueWrap.innerHTML = '';
      return;
    }
    const needing = sortPlannerQueue(
      rosterUnits.filter((u) => (u.skillUpsNeeded || 0) > 0 && plannerPassesNatFilter(u)),
    );
    queueWrap.innerHTML = `<table class="skill-planner__table swrm-table-zebra"><caption class="sr-only">${escapeHtml(t.skillPlannerQueueTitle || 'Priority queue')}</caption>${skillPlannerQueueHeadHtml(t)}<tbody>${needing.map((u) => skillPlannerQueueRowHtml(u, skillDb, t)).join('')}</tbody></table>`;
  }

  function paintSkillPlannerCdTable(rosterUnits, t) {
    const stuckWrap = document.getElementById('skill-planner-stuck');
    const skillDb = window.SWRM_SKILL_DB;
    if (!stuckWrap) return;
    const stuckEntries = sortPlannerStuck(
      plannerCooldownGapEntries(rosterUnits.filter((u) => plannerPassesNatFilter(u))),
    );
    if (!stuckEntries.length) {
      stuckWrap.innerHTML = `<p class="skill-planner__stuck-empty">${escapeHtml(t.skillPlannerCdEmpty || t.skillPlannerStuckEmpty || 'No cooldown hunts right now.')}</p>`;
    } else {
      stuckWrap.innerHTML = `<table class="skill-planner__table skill-planner__table--stuck swrm-table-zebra"><caption class="sr-only">${escapeHtml(t.skillPlannerCdTitle || t.skillPlannerStuckTitle || 'Cooldown hunt')}</caption>${skillPlannerStuckHeadHtml(t)}<tbody>${stuckEntries.map((e) => skillPlannerStuckRowHtml(e, skillDb, t)).join('')}</tbody></table>`;
    }
    const root = document.getElementById('skill-planner-root');
    if (root) bindSkillPlannerPortraits(root);
  }

  async function ensureSkillPlannerCdReady(units) {
    const skillDb = window.SWRM_SKILL_DB;
    if (!skillDb) return units.map((u) => refreshUnitSkillRows(u));
    await skillDb.loadSkillIndex();
    if (typeof skillDb.hasBundledSkillMeta === 'function' && skillDb.hasBundledSkillMeta()) {
      skillPlannerCdMetaReady = true;
      return units.map((u) => refreshUnitSkillRows(u));
    }
    if (!skillPlannerCdMetaReady) {
      return hydratePlannerCdMeta(units);
    }
    return units.map((u) => refreshUnitSkillRows(u));
  }

  async function paintSkillPlannerCdPanel() {
    const stuckWrap = document.getElementById('skill-planner-stuck');
    if (!stuckWrap || skillPlannerView !== 'stuck') return;
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    let units = skillPlannerUnitsCache;

    if (!units.length && skillPlannerRenderPromise) {
      stuckWrap.innerHTML = `<p class="skill-planner__loading" role="status">${escapeHtml(t.skillPlannerCdLoading || 'Loading…')}</p>`;
      await skillPlannerRenderPromise;
      units = skillPlannerUnitsCache;
    }

    if (!units.length) {
      stuckWrap.innerHTML = '';
      return;
    }

    stuckWrap.innerHTML = `<p class="skill-planner__loading" role="status">${escapeHtml(t.skillPlannerCdLoading || 'Loading Cooltime Turn data…')}</p>`;
    const updated = await ensureSkillPlannerCdReady(units);
    if (skillPlannerView !== 'stuck') return;

    skillPlannerUnitsCache = updated;
    const stats = computeSkillPlannerStats(updated);
    syncSkillPlannerCdTabLabel(stats, t);
    const summary = document.getElementById('skill-planner-summary');
    if (summary) summary.innerHTML = skillPlannerSummaryHtml(stats, t);
    paintSkillPlannerCdTable(updated, t);
  }

  function schedulePlannerCdMetaBackground(units) {
    const skillDb = window.SWRM_SKILL_DB;
    if (skillDb && typeof skillDb.hasBundledSkillMeta === 'function' && skillDb.hasBundledSkillMeta()) {
      skillPlannerCdMetaReady = true;
      skillPlannerUnitsCache = units.map((u) => refreshUnitSkillRows(u));
      const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
      const stats = computeSkillPlannerStats(skillPlannerUnitsCache);
      syncSkillPlannerCdTabLabel(stats, t);
      const summary = document.getElementById('skill-planner-summary');
      if (summary) summary.innerHTML = skillPlannerSummaryHtml(stats, t);
      if (skillPlannerView === 'stuck') paintSkillPlannerCdTable(skillPlannerUnitsCache, t);
      return;
    }
    void hydratePlannerCdMeta(units).then((updated) => {
      skillPlannerUnitsCache = updated;
      const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
      const stats = computeSkillPlannerStats(updated);
      syncSkillPlannerCdTabLabel(stats, t);
      const summary = document.getElementById('skill-planner-summary');
      if (summary) summary.innerHTML = skillPlannerSummaryHtml(stats, t);
      if (skillPlannerView === 'stuck') paintSkillPlannerCdTable(updated, t);
    });
  }

  function plannerNaturalStars(u) {
    const n = u.meta && Number(u.meta.natural_stars);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }

  function plannerUnitLevelsToMax(u) {
    const lvl = Number(u.level);
    const max = Number(u.maxLevel);
    if (!Number.isFinite(lvl) || !Number.isFinite(max) || max <= lvl) return 0;
    return max - lvl;
  }

  function unitSkillsSource(u) {
    if (Array.isArray(u.skills) && u.skills.length) return u.skills;
    return (u.skillRows || [])
      .filter((s) => s && Number.isFinite(Number(s.skillId)))
      .map((s) => ({ skillId: s.skillId, level: s.level }));
  }

  function refreshUnitSkillRows(u) {
    const skillDb = window.SWRM_SKILL_DB;
    const skills = unitSkillsSource(u);
    if (!skillDb || typeof skillDb.enrichUnitSkills !== 'function' || !skills.length) return u;
    const pack = skillDb.enrichUnitSkills(skills);
    return {
      ...u,
      skillRows: pack.skills,
      skillUpsNeeded: pack.skillUpsNeeded,
      skillsMaxed: pack.skillsMaxed,
      skillsKnown: pack.skillsKnown,
    };
  }

  /** SWARFARM meta only for skills that may still need CD−1 (not whole roster). */
  async function hydratePlannerCdMeta(units) {
    const skillDb = window.SWRM_SKILL_DB;
    if (!skillDb || typeof skillDb.hydrateSkillMetaBatch !== 'function') {
      return units.map((u) => refreshUnitSkillRows(u));
    }
    const gen = ++skillPlannerCdHydrateGen;
    const ids = [];
    for (const u of units) {
      if ((u.skillUpsNeeded || 0) <= 0) continue;
      for (const s of u.skillRows || []) {
        if ((s.deficit || 0) > 0 && s.skillId) ids.push(s.skillId);
      }
    }
    const uniq = [...new Set(ids.map(Number).filter(Number.isFinite))];
    if (uniq.length) {
      await skillDb.hydrateSkillMetaBatch(uniq, { pauseMs: 60, batchSize: 12 });
    }
    if (gen !== skillPlannerCdHydrateGen) return units;
    skillPlannerCdMetaReady = true;
    return units.map((u) => refreshUnitSkillRows(u));
  }

  function plannerCooldownGapEntries(units) {
    const out = [];
    for (const u of units) {
      for (const s of u.skillRows || []) {
        if ((s.deficitToCooldown || 0) > 0) {
          out.push({ u, s });
        }
      }
    }
    return out;
  }

  function devilmonIconUrl() {
    const db = window.SWRM_MONSTER_DB;
    return db && typeof db.devilmonImageUrl === 'function' ? db.devilmonImageUrl() : '';
  }

  function plannerComparePriority(a, b) {
    const nat = plannerNaturalStars(b) - plannerNaturalStars(a);
    if (nat !== 0) return nat;
    const ups = (b.skillUpsNeeded || 0) - (a.skillUpsNeeded || 0);
    if (ups !== 0) return ups;
    const lv = plannerUnitLevelsToMax(b) - plannerUnitLevelsToMax(a);
    if (lv !== 0) return lv;
    return String(a.displayName || '').localeCompare(String(b.displayName || ''));
  }

  function plannerPassesNatFilter(u) {
    const nat = plannerNaturalStars(u);
    if (skillPlannerNatFilter === 'nat5') return nat >= 5;
    if (skillPlannerNatFilter === 'nat4') return nat === 4;
    if (skillPlannerNatFilter === 'nat3') return nat === 3;
    if (skillPlannerNatFilter === 'nat4plus') return nat >= 4;
    return true;
  }

  function filterPlannerRosterUnits(units) {
    return (units || []).filter((u) => {
      if (typeof isTechnicalFodderMonster === 'function' && isTechnicalFodderMonster(u)) return false;
      if (skillPlannerExcludeStorage && u.inStorage) return false;
      return true;
    });
  }

  function plannerSortIcon(col, table) {
    const sort = table === 'stuck' ? skillPlannerStuckSort : skillPlannerQueueSort;
    if (!sort || sort.col !== col) {
      return '<span class="skill-planner__sort-icon" aria-hidden="true">↕</span>';
    }
    return `<span class="skill-planner__sort-icon" aria-hidden="true">${sort.dir === 'asc' ? '▲' : '▼'}</span>`;
  }

  function cycleSkillPlannerSort(table, col) {
    const cur = table === 'stuck' ? skillPlannerStuckSort : skillPlannerQueueSort;
    if (!cur || cur.col !== col) {
      const next = { col, dir: 'desc' };
      if (table === 'stuck') skillPlannerStuckSort = next;
      else skillPlannerQueueSort = next;
      return;
    }
    cur.dir = cur.dir === 'desc' ? 'asc' : 'desc';
  }

  function comparePlannerQueueRows(a, b, col, dir) {
    const mul = dir === 'asc' ? 1 : -1;
    switch (col) {
      case 'nat':
        return mul * (plannerNaturalStars(a) - plannerNaturalStars(b)) || mul * String(a.displayName).localeCompare(String(b.displayName));
      case 'ups':
        return (
          mul * ((Number(a.skillUpsNeeded) || 0) - (Number(b.skillUpsNeeded) || 0)) ||
          mul * String(a.displayName).localeCompare(String(b.displayName))
        );
      case 'level':
        return (
          mul * (plannerUnitLevelsToMax(a) - plannerUnitLevelsToMax(b)) ||
          mul * ((Number(a.level) || 0) - (Number(b.level) || 0)) ||
          mul * String(a.displayName).localeCompare(String(b.displayName))
        );
      case 'name':
      default:
        return mul * String(a.displayName || '').localeCompare(String(b.displayName || ''));
    }
  }

  function comparePlannerStuckRows(a, b, col, dir) {
    const mul = dir === 'asc' ? 1 : -1;
    const ua = a.u;
    const ub = b.u;
    const sa = a.s;
    const sb = b.s;
    switch (col) {
      case 'nat':
        return mul * (plannerNaturalStars(ua) - plannerNaturalStars(ub)) || comparePlannerStuckRows(a, b, 'name', dir);
      case 'skill':
        return (
          mul * String((sa.skillName || '') + sa.skillId).localeCompare(String((sb.skillName || '') + sb.skillId)) ||
          comparePlannerStuckRows(a, b, 'name', dir)
        );
      case 'target':
        return (
          mul * ((Number(sa.cooldownUnlockLevel) || 0) - (Number(sb.cooldownUnlockLevel) || 0)) ||
          comparePlannerStuckRows(a, b, 'name', dir)
        );
      case 'deficit':
        return (
          mul * ((Number(sa.deficitToCooldown) || 0) - (Number(sb.deficitToCooldown) || 0)) ||
          comparePlannerStuckRows(a, b, 'name', dir)
        );
      case 'name':
      default:
        return (
          mul * String(ua.displayName || '').localeCompare(String(ub.displayName || '')) ||
          mul * ((sa.slot || 0) - (sb.slot || 0))
        );
    }
  }

  function sortPlannerQueue(units) {
    const list = units.slice();
    if (!skillPlannerQueueSort) {
      list.sort(plannerComparePriority);
      return list;
    }
    const { col, dir } = skillPlannerQueueSort;
    list.sort((a, b) => comparePlannerQueueRows(a, b, col, dir));
    return list;
  }

  function sortPlannerStuck(entries) {
    const list = entries.slice();
    if (!skillPlannerStuckSort) {
      list.sort((a, b) => {
        const c = plannerComparePriority(a.u, b.u);
        if (c !== 0) return c;
        return (a.s.slot || 0) - (b.s.slot || 0);
      });
      return list;
    }
    const { col, dir } = skillPlannerStuckSort;
    list.sort((a, b) => comparePlannerStuckRows(a, b, col, dir));
    return list;
  }

  async function getMonstersEnrichedForPlanner() {
    if (monstersEnrichedCache && monstersEnrichedCache.length) {
      const skillDb = window.SWRM_SKILL_DB;
      if (skillDb && typeof skillDb.loadSkillIndex === 'function') {
        try {
          await skillDb.loadSkillIndex();
          if (skillDb.indexCount() === 0) await skillDb.loadSkillIndex({ force: true });
        } catch (e) { /* ignore */ }
      }
      return monstersEnrichedCache.map((u) => refreshUnitSkillRows(u));
    }
    if (!allUnits.length) {
      const loaded = await ensureMonstersDataset();
      if (!loaded || !allUnits.length) return [];
    }
    const db = window.SWRM_MONSTER_DB;
    const skillDb = window.SWRM_SKILL_DB;
    if (db && typeof db.loadMonsterIndex === 'function') {
      try {
        await db.loadMonsterIndex();
        if (db.indexCount() === 0) await db.loadMonsterIndex({ force: true });
      } catch (e) { /* ignore */ }
    }
    if (skillDb && typeof skillDb.loadSkillIndex === 'function') {
      try {
        await skillDb.loadSkillIndex();
        if (skillDb.indexCount() === 0) await skillDb.loadSkillIndex({ force: true });
      } catch (e) { /* ignore */ }
    }
    return allUnits.map((u) => {
      const meta = db ? db.lookupMonster(u.masterId) : null;
      const tags = unitMetaFor(u.unitId);
      const skillPack = skillDb
        ? skillDb.enrichUnitSkills(u.skills)
        : { skills: [], skillUpsNeeded: 0, skillsMaxed: true, skillsKnown: false };
      return {
        ...u,
        meta,
        metaElement: meta && meta.element ? meta.element : '',
        displayName: db ? db.monsterDisplayName(u.masterId) : `#${u.masterId}`,
        imageFilename: meta && meta.image_filename ? meta.image_filename : '',
        naturalStars: meta && Number(meta.natural_stars) > 0 ? Number(meta.natural_stars) : 0,
        skillRows: skillPack.skills,
        skillUpsNeeded: skillPack.skillUpsNeeded,
        skillsMaxed: skillPack.skillsMaxed,
        skillsKnown: skillPack.skillsKnown,
        unitLevelsToMax: plannerUnitLevelsToMax(u),
        favorite: tags.favorite,
        food: tags.food,
        storageMark: tags.storageMark,
        customTags: tags.tags,
      };
    });
  }

  function computeSkillPlannerStats(units) {
    const stats = {
      monstersNeeding: 0,
      skillUpsTotal: 0,
      nat5Monsters: 0,
      nat5Ups: 0,
      nat4Monsters: 0,
      nat4Ups: 0,
      otherUps: 0,
      stuckRows: 0,
      unitLevelsTotal: 0,
      monstersBelowMaxLevel: 0,
    };
    for (const u of units) {
      const ups = u.skillUpsNeeded || 0;
      const nat = plannerNaturalStars(u);
      const lvGap = plannerUnitLevelsToMax(u);
      if (lvGap > 0) {
        stats.monstersBelowMaxLevel += 1;
        stats.unitLevelsTotal += lvGap;
      }
      if (ups <= 0) continue;
      stats.monstersNeeding += 1;
      stats.skillUpsTotal += ups;
      if (nat >= 5) {
        stats.nat5Monsters += 1;
        stats.nat5Ups += ups;
      } else if (nat === 4) {
        stats.nat4Monsters += 1;
        stats.nat4Ups += ups;
      } else {
        stats.otherUps += ups;
      }
      for (const s of u.skillRows || []) {
        if ((s.deficitToCooldown || 0) > 0) stats.stuckRows += 1;
      }
    }
    return stats;
  }

  function skillPlannerSummaryHtml(stats, t) {
    const cards = [
      {
        key: 'total',
        value: stats.skillUpsTotal,
        label: t.skillPlannerCardTotal || 'Skill levels to max',
        sub:
          stats.monstersNeeding > 0
            ? (t.skillPlannerCardTotalSub || '{n} monsters').replace('{n}', String(stats.monstersNeeding))
            : '',
      },
      {
        key: 'nat5',
        value: stats.nat5Ups,
        label: t.skillPlannerCardNat5 || 'Nat 5 debt',
        sub:
          stats.nat5Monsters > 0
            ? (t.skillPlannerCardNat5Sub || '{n} monsters').replace('{n}', String(stats.nat5Monsters))
            : '',
      },
      {
        key: 'nat4',
        value: stats.nat4Ups,
        label: t.skillPlannerCardNat4 || 'Nat 4 debt',
        sub:
          stats.nat4Monsters > 0
            ? (t.skillPlannerCardNat4Sub || '{n} monsters').replace('{n}', String(stats.nat4Monsters))
            : '',
      },
      {
        key: 'stuck',
        value: stats.stuckRows,
        label: t.skillPlannerCardCd || 'CD −1 gaps',
        sub: t.skillPlannerCardCdSub || 'Skills missing CD upgrade',
        tab: 'stuck',
      },
      {
        key: 'level',
        value: stats.unitLevelsTotal,
        label: t.skillPlannerCardLevel || 'Monster levels to max',
        sub:
          stats.monstersBelowMaxLevel > 0
            ? (t.skillPlannerCardLevelSub || '{n} below max').replace('{n}', String(stats.monstersBelowMaxLevel))
            : '',
      },
    ];
    return cards
      .map((c) => {
        const tabAttr = c.tab ? ` data-planner-goto-tab="${c.tab}" role="button" tabindex="0"` : '';
        const cls = c.tab ? ' skill-planner__card--clickable' : '';
        return `<div class="skill-planner__card${cls}" data-planner-card="${c.key}"${tabAttr}>
            <span class="skill-planner__card-value">${escapeHtml(String(c.value))}</span>
            <span class="skill-planner__card-label">${escapeHtml(c.label)}</span>
            ${c.sub ? `<span class="skill-planner__card-sub">${escapeHtml(c.sub)}</span>` : ''}
          </div>`;
      })
      .join('');
  }

  function skillPlannerSkillChipHtml(s, skillDb) {
    const label =
      skillDb && typeof skillDb.formatSkillLevelDetail === 'function'
        ? skillDb.formatSkillLevelDetail(s)
        : `${s.level}/${s.maxLevel}`;
    const url =
      skillDb && typeof skillDb.skillIconUrl === 'function' ? skillDb.skillIconUrl(s.skillId) : '';
    const fb =
      skillDb && typeof skillDb.skillIconFallbackUrl === 'function'
        ? skillDb.skillIconFallbackUrl(s.skillId)
        : '';
    const cdCls = (s.deficitToCooldown || 0) > 0 ? ' skill-planner__skill-chip--cd' : '';
    const fbAttr = fb ? ` data-fallback="${escapeHtml(fb)}"` : '';
    const img = url
      ? `<img class="skill-planner__skill-chip-icon" src="${escapeHtml(url)}"${fbAttr} alt="" width="28" height="28" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="var f=this.dataset.fallback;if(f){this.src=f;this.removeAttribute('data-fallback');}else{this.classList.add('is-broken');}" />`
      : '<span class="skill-planner__skill-chip-icon skill-planner__skill-chip-icon--empty" aria-hidden="true"></span>';
    return `<span class="skill-planner__skill-chip${cdCls}" data-skill-id="${escapeHtml(String(s.skillId))}" data-skill-level="${escapeHtml(String(s.level))}" tabindex="0">${img}<span class="skill-planner__skill-chip-lv">${escapeHtml(label)}</span></span>`;
  }

  function skillPlannerSkillsCell(u, skillDb) {
    const rows = (u.skillRows || []).filter((s) => s.deficit > 0);
    if (!rows.length) return '—';
    return `<div class="skill-planner__skill-chips">${rows.map((s) => skillPlannerSkillChipHtml(s, skillDb)).join('')}</div>`;
  }

  function skillPlannerUpsCell(u, t) {
    const n = u.skillUpsNeeded || 0;
    const dUrl = devilmonIconUrl();
    const img = dUrl
      ? `<img class="skill-planner__devilmon" src="${escapeHtml(dUrl)}" alt="" width="22" height="22" loading="lazy" decoding="async" referrerpolicy="no-referrer" />`
      : '';
    const tip = escapeHtml(t.skillPlannerUpsTip || 'Skill levels still needed (≈ devilmon uses)');
    return `<span class="skill-planner__ups-cell" title="${tip}">${img}<strong>${escapeHtml(String(n))}</strong></span>`;
  }

  function skillPlannerQueueHeadHtml(t) {
    const sort = skillPlannerQueueSort;
    const th = (col, labelKey, fallback) => {
      const label = t[labelKey] || fallback;
      const sorted = sort && sort.col === col;
      const ariaSort = sorted ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none';
      return `<th scope="col" class="skill-planner__th--sortable${sorted ? ' skill-planner__th--sorted' : ''}" data-sort-table="queue" data-sort-col="${col}" aria-sort="${ariaSort}"><span class="skill-planner__th-inner">${escapeHtml(label)}${plannerSortIcon(col, 'queue')}</span></th>`;
    };
    return `<thead><tr>
      ${th('name', 'skillPlannerColMonster', 'Monster')}
      ${th('nat', 'skillPlannerColNat', 'Natural')}
      ${th('ups', 'skillPlannerColUps', 'Levels needed')}
      <th scope="col">${escapeHtml(t.skillPlannerColSkills || 'Skills')}</th>
      ${th('level', 'skillPlannerColUnitLv', 'Monster level')}
      <th scope="col" class="skill-planner__th--action">${escapeHtml(t.skillPlannerColAction || '')}</th>
    </tr></thead>`;
  }

  function skillPlannerStuckHeadHtml(t) {
    const sort = skillPlannerStuckSort;
    const th = (col, labelKey, fallback) => {
      const label = t[labelKey] || fallback;
      const sorted = sort && sort.col === col;
      const ariaSort = sorted ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none';
      return `<th scope="col" class="skill-planner__th--sortable${sorted ? ' skill-planner__th--sorted' : ''}" data-sort-table="stuck" data-sort-col="${col}" aria-sort="${ariaSort}"><span class="skill-planner__th-inner">${escapeHtml(label)}${plannerSortIcon(col, 'stuck')}</span></th>`;
    };
    return `<thead><tr>
      ${th('name', 'skillPlannerColMonster', 'Monster')}
      ${th('nat', 'skillPlannerColNat', 'Natural')}
      ${th('skill', 'skillPlannerColCdSkill', 'Skill')}
      ${th('target', 'skillPlannerColCdTarget', 'Target level')}
      ${th('deficit', 'skillPlannerColDeficit', 'Skill-ups needed')}
      <th scope="col" class="skill-planner__th--action"></th>
    </tr></thead>`;
  }

  function skillPlannerQueueRowHtml(u, skillDb, t) {
    const nat = plannerNaturalStars(u);
    const natLbl = nat > 0 ? `Nat ${nat}` : '—';
    const lvGap = plannerUnitLevelsToMax(u);
    const lvTxt =
      lvGap > 0
        ? `${u.level}/${u.maxLevel} (+${lvGap})`
        : `${u.level}/${u.maxLevel}`;
    const thumb = u.imageFilename
      ? `<img class="skill-planner__thumb" alt="" width="36" height="36" data-img-file="${escapeHtml(u.imageFilename)}" loading="lazy" decoding="async" />`
      : '<span class="skill-planner__thumb skill-planner__thumb--empty" aria-hidden="true"></span>';
    const openLbl = escapeHtml(t.skillPlannerOpenMonster || 'Open in Roster');
    return `<tr class="skill-planner__row" data-unit-id="${escapeHtml(String(u.unitId))}">
      <td class="skill-planner__td skill-planner__td--monster">
        <button type="button" class="skill-planner__monster-btn" data-planner-open="${escapeHtml(String(u.unitId))}">
          ${thumb}
          <span class="skill-planner__monster-name">${escapeHtml(u.displayName || '')}</span>
        </button>
      </td>
      <td class="skill-planner__td skill-planner__td--nat">${escapeHtml(natLbl)}</td>
      <td class="skill-planner__td skill-planner__td--ups">${skillPlannerUpsCell(u, t)}</td>
      <td class="skill-planner__td skill-planner__td--skills">${skillPlannerSkillsCell(u, skillDb)}</td>
      <td class="skill-planner__td skill-planner__td--level">${escapeHtml(lvTxt)}</td>
      <td class="skill-planner__td skill-planner__td--act">
        <button type="button" class="btn-ghost btn-toolbar btn-toolbar--sm" data-planner-open="${escapeHtml(String(u.unitId))}">${openLbl}</button>
      </td>
    </tr>`;
  }

  function skillPlannerStuckRowHtml(entry, skillDb, t) {
    const { u, s } = entry;
    const nat = plannerNaturalStars(u);
    const natLbl = nat > 0 ? `Nat ${nat}` : '—';
    const thumb = u.imageFilename
      ? `<img class="skill-planner__thumb" alt="" width="36" height="36" data-img-file="${escapeHtml(u.imageFilename)}" loading="lazy" decoding="async" />`
      : '<span class="skill-planner__thumb skill-planner__thumb--empty" aria-hidden="true"></span>';
    const openLbl = escapeHtml(t.skillPlannerOpenMonster || 'Open in Roster');
    const cdLv = s.cooldownUnlockLevel != null ? s.cooldownUnlockLevel : '—';
    const targetTxt = (t.skillPlannerCdTarget || 'Lv {cur} → {goal}')
      .replace('{cur}', String(s.level))
      .replace('{goal}', String(cdLv));
    const skillName = s.skillName ? `<span class="skill-planner__cd-skill-name">${escapeHtml(s.skillName)}</span>` : '';
    return `<tr class="skill-planner__row skill-planner__row--stuck" data-unit-id="${escapeHtml(String(u.unitId))}">
      <td class="skill-planner__td skill-planner__td--monster">
        <button type="button" class="skill-planner__monster-btn" data-planner-open="${escapeHtml(String(u.unitId))}">
          ${thumb}
          <span class="skill-planner__monster-name">${escapeHtml(u.displayName || '')}</span>
        </button>
      </td>
      <td class="skill-planner__td skill-planner__td--nat">${escapeHtml(natLbl)}</td>
      <td class="skill-planner__td skill-planner__td--skills"><div class="skill-planner__cd-skill">${skillPlannerSkillChipHtml(s, skillDb)}${skillName}</div></td>
      <td class="skill-planner__td">${escapeHtml(targetTxt)}</td>
      <td class="skill-planner__td"><strong>+${escapeHtml(String(s.deficitToCooldown || 0))}</strong></td>
      <td class="skill-planner__td skill-planner__td--act"><button type="button" class="btn-ghost btn-toolbar btn-toolbar--sm" data-planner-open="${escapeHtml(String(u.unitId))}">${openLbl}</button></td>
    </tr>`;
  }

  function applySkillPlannerChipTip(chip, skillDb) {
    if (!chip || !skillDb || typeof setSwrmFloatTipTarget !== 'function') return;
    const skillId = Number(chip.getAttribute('data-skill-id'));
    const level = Number(chip.getAttribute('data-skill-level'));
    if (!Number.isFinite(skillId)) return;
    const text =
      typeof skillDb.formatSkillProgressTooltip === 'function'
        ? skillDb.formatSkillProgressTooltip(skillId, level)
        : '';
    const html =
      typeof skillDb.formatSkillProgressTooltipHtml === 'function'
        ? skillDb.formatSkillProgressTooltipHtml(skillId, level)
        : '';
    if (html) {
      setSwrmFloatTipTarget(chip, '', { html });
      chip.setAttribute('aria-label', text || '');
    } else if (text) {
      setSwrmFloatTipTarget(chip, text);
      chip.setAttribute('aria-label', text);
    }
  }

  function bindSkillPlannerSkillTips(root) {
    if (!root) return;
    const skillDb = window.SWRM_SKILL_DB;
    const chips = root.querySelectorAll('.skill-planner__skill-chip[data-skill-id]');
    if (!chips.length) return;
    void (async () => {
      if (skillDb && typeof skillDb.loadSkillIndex === 'function') {
        try {
          await skillDb.loadSkillIndex();
        } catch (e) { /* ignore */ }
      }
      chips.forEach((chip) => {
        if (!chip.isConnected) return;
        applySkillPlannerChipTip(chip, skillDb);
      });
    })();
  }

  function bindSkillPlannerPortraits(root) {
    if (!root) return;
    root.querySelectorAll('.skill-planner__thumb[data-img-file]').forEach((img) => {
      const file = img.getAttribute('data-img-file');
      if (file && typeof bindMonsterPortrait === 'function') bindMonsterPortrait(img, file);
    });
    bindSkillPlannerSkillTips(root);
  }

  function openMonsterFromSkillPlanner(unitId) {
    const uid = unitId != null ? String(unitId) : '';
    if (!uid) return;
    if (typeof saveMonstersSelectedUnitId === 'function') saveMonstersSelectedUnitId(uid);
    monstersSelectedUnitId = uid;
    if (typeof showMainTab === 'function') {
      showMainTab('monsters', { monstersSubtab: 'roster', writeHash: true });
    }
    window.setTimeout(() => {
      if (typeof renderMonstersPanel === 'function') void renderMonstersPanel();
      window.setTimeout(() => {
        const esc =
          typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
            ? CSS.escape(uid)
            : uid.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        const node = document.querySelector(
          `.monsters-card[data-unit-id="${esc}"], .monsters-table__row[data-unit-id="${esc}"]`,
        );
        if (node) node.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        if (typeof showMonsterDetailForCard === 'function') {
          showMonsterDetailForCard(uid, node || null, { pin: true });
        }
      }, 80);
    }, 40);
  }

  function bindSkillPlannerPanel(root) {
    if (!root || skillPlannerBound) return;
    skillPlannerBound = true;
    skillPlannerExcludeStorage = readSkillPlannerExcludeStorage();

    root.addEventListener('click', (ev) => {
      const sortTh = ev.target.closest('[data-sort-col][data-sort-table]');
      if (sortTh) {
        ev.preventDefault();
        cycleSkillPlannerSort(sortTh.getAttribute('data-sort-table'), sortTh.getAttribute('data-sort-col'));
        void renderSkillPlannerPanel();
        return;
      }
      const tabBtn = ev.target.closest('[data-planner-view]');
      if (tabBtn && tabBtn.classList.contains('skill-planner__tab')) {
        showSkillPlannerView(tabBtn.getAttribute('data-planner-view'));
        return;
      }
      const gotoTab = ev.target.closest('[data-planner-goto-tab]');
      if (gotoTab) {
        showSkillPlannerView(gotoTab.getAttribute('data-planner-goto-tab'));
        return;
      }
      const btn = ev.target.closest('[data-planner-open]');
      if (btn) {
        ev.preventDefault();
        openMonsterFromSkillPlanner(btn.getAttribute('data-planner-open'));
      }
    });

    root.addEventListener('keydown', (ev) => {
      if (ev.key !== 'Enter' && ev.key !== ' ') return;
      const card = ev.target.closest('[data-planner-goto-tab]');
      if (!card) return;
      ev.preventDefault();
      showSkillPlannerView(card.getAttribute('data-planner-goto-tab'));
    });

    const natSel = document.getElementById('skill-planner-nat-filter');
    if (natSel) {
      natSel.addEventListener('change', () => {
        skillPlannerNatFilter = natSel.value || 'all';
        void renderSkillPlannerPanel();
      });
    }

    const storageBtn = document.getElementById('skill-planner-exclude-storage');
    if (storageBtn) {
      storageBtn.addEventListener('click', () => {
        skillPlannerExcludeStorage = !skillPlannerExcludeStorage;
        writeSkillPlannerExcludeStorage(skillPlannerExcludeStorage);
        const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
        syncSkillPlannerExcludeStorageButton(t);
        void renderSkillPlannerPanel();
      });
    }

    document.querySelectorAll('.skill-planner__tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        const v = btn.getAttribute('data-planner-view');
        if (v) showSkillPlannerView(v);
      });
    });
  }

  async function renderSkillPlannerPanel() {
    const root = document.getElementById('skill-planner-root');
    const summary = document.getElementById('skill-planner-summary');
    const queueWrap = document.getElementById('skill-planner-queue');
    const stuckWrap = document.getElementById('skill-planner-stuck');
    const emptyEl = document.getElementById('skill-planner-empty');
    if (!root || !summary || !queueWrap || !stuckWrap) return;

    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

    bindSkillPlannerPanel(root);
    syncSkillPlannerExcludeStorageButton(t);
    showSkillPlannerView(skillPlannerView);

    const tabsNav = document.getElementById('skill-planner-view-tabs');
    if (tabsNav) tabsNav.setAttribute('aria-label', t.skillPlannerTabsAria || 'Skill plan views');

    const natSel = document.getElementById('skill-planner-nat-filter');
    if (natSel && natSel.value !== skillPlannerNatFilter) natSel.value = skillPlannerNatFilter;

    const renderTask = (async () => {
      const skillDb = window.SWRM_SKILL_DB;
      if (skillDb && typeof skillDb.loadSkillIndex === 'function') {
        try {
          await skillDb.loadSkillIndex();
        } catch (e) { /* ignore */ }
      }

      const bundled =
        skillDb &&
        typeof skillDb.hasBundledSkillMeta === 'function' &&
        skillDb.hasBundledSkillMeta();

      if (!bundled) {
        skillPlannerCdMetaReady = false;
        skillPlannerCdHydrateGen += 1;
      }

      let allEnriched = await getMonstersEnrichedForPlanner();
      let rosterUnits = filterPlannerRosterUnits(allEnriched);
      if (bundled) {
        rosterUnits = rosterUnits.map((u) => refreshUnitSkillRows(u));
        skillPlannerCdMetaReady = true;
      }
      skillPlannerUnitsCache = rosterUnits;

      const stats = computeSkillPlannerStats(rosterUnits);
      summary.innerHTML = skillPlannerSummaryHtml(stats, t);
      syncSkillPlannerCdTabLabel(stats, t);

      if (!rosterUnits.length) {
        queueWrap.innerHTML = '';
        stuckWrap.innerHTML = '';
        return;
      }

      paintSkillPlannerQueue(rosterUnits, t);
      if (skillPlannerView === 'stuck') {
        void paintSkillPlannerCdPanel();
      } else {
        stuckWrap.innerHTML = '';
      }

      bindSkillPlannerPortraits(root);
      schedulePlannerCdMetaBackground(rosterUnits);
    })();

    skillPlannerRenderPromise = renderTask;
    try {
      await renderTask;
    } finally {
      if (skillPlannerRenderPromise === renderTask) skillPlannerRenderPromise = null;
    }
  }

  window.SWRM = window.SWRM || {};
  window.SWRM.computeSkillPlannerStats = computeSkillPlannerStats;
  window.SWRM.filterPlannerRosterUnits = filterPlannerRosterUnits;

  skillPlannerExcludeStorage = readSkillPlannerExcludeStorage();
