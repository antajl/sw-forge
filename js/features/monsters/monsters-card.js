// js/features/monsters/monsters-card.js — card rendering
  function devilmonIconHtml(className) {
    const db = window.SWRM_MONSTER_DB;
    const url =
      db && typeof db.devilmonImageUrl === 'function'
        ? db.devilmonImageUrl()
        : 'https://swarfarm.com/static/herders/images/monsters/devilmon_dark.png';
    return `<img class="${className}" src="${escapeHtml(url)}" alt="" width="16" height="16" loading="lazy" decoding="async" referrerpolicy="no-referrer" />`;
  }

  function monsterUnitNatStars(u) {
    const n = u.unitClass != null ? Number(u.unitClass) : Number(u.stars) || 0;
    return Math.min(6, Math.max(0, n));
  }

  function monsterUnitRankStars(u) {
    const n = u.unitRank != null ? Number(u.unitRank) : Number(u.stars) || 0;
    return Math.min(6, Math.max(0, n));
  }

  function monsterUnitIsAwakened(u) {
    const rank = monsterUnitRankStars(u);
    if (rank !== 6) return false;
    const maxLvl = u.maxLevel != null ? Number(u.maxLevel) : 40;
    const lvl = Number(u.level) || 0;
    return maxLvl === 40 && lvl >= 40;
  }

  function buildMonsterNatBadge(u) {
    const n = monsterUnitNatStars(u);
    if (!n) return '';
    return `<span class="monsters-card__nat monsters-card__nat--${n}" title="nat${n}">nat${n}</span>`;
  }

  function buildMonsterStarsBadge(u) {
    const n = monsterUnitRankStars(u);
    if (!n) return '';
    const filled = '★'.repeat(n);
    const awakened = monsterUnitIsAwakened(u);
    const cls = awakened ? ' monsters-card__stars--awakened' : '';
    return `<span class="monsters-card__stars${cls}" aria-label="${n}★">${filled}</span>`;
  }

  function buildMonsterCardHtml(u, db, t, view) {
    const elCls = elementClass(u.metaElement);
    const selected = String(u.unitId) === String(monstersSelectedUnitId);
    const hover = String(u.unitId) === String(monstersDetailHoverUnitId);
    const bestiaryHref = db && u.bestiarySlug ? db.bestiaryUrl(u.bestiarySlug) : '';
    const nameInner = bestiaryHref
      ? `<a href="${escapeHtml(bestiaryHref)}" target="_blank" rel="noopener noreferrer">${escapeHtml(u.displayName)}</a>`
      : escapeHtml(u.displayName);
    const lvlLbl = t.monstersLevelShort || 'Lv';
    const subBits = [
      u.metaElement ? escapeHtml(u.metaElement) : '',
      u.metaArchetype ? escapeHtml(u.metaArchetype) : '',
      `${lvlLbl} ${u.level}`,
    ].filter(Boolean);
    const runeCells = buildRuneBlockHtml(u, db, t, view);
    const listCls = view === 'list' ? ' monsters-card--list' : '';
    const bulkSel = monstersBulkSelected.has(String(u.unitId));
    const isList = view === 'list';
    const listInfoHtml = isList ? buildListRowInfoHtml(u, t) : '';
    const listMetaHtml = isList ? buildListRowMetaHtml(u, t) : '';
    const locHtml = !isList && u.inStorage ? buildLocationIconHtml(u, t) : '';
    const actionsHtml = isList ? '' : buildCardActionsHtml(u, t);
    const natBadge = !isList ? buildMonsterNatBadge(u) : '';
    const starsBadge = !isList ? buildMonsterStarsBadge(u) : '';
    return `<article class="monsters-card${listCls}${u.favorite ? ' monsters-card--favorite' : ''}${u.food ? ' monsters-card--food' : ''}${u.inStorage ? ' monsters-card--storage' : ''}${bulkSel ? ' monsters-card--bulk-on' : ''}${selected ? ' monsters-card--selected' : ''}${hover ? ' monsters-card--hover' : ''}${elCls ? ` monsters-card--${elCls}` : ''}" data-unit-id="${escapeHtml(String(u.unitId))}" data-master-id="${u.masterId}" tabindex="0">
          <div class="monsters-card__bar monsters-card__bar--${elCls}" aria-hidden="true"></div>
          ${actionsHtml}
          <div class="monsters-card__top">
<div class="monsters-card__img-wrap">
              ${natBadge}
              ${starsBadge}
              <img class="monsters-card__img" alt="" width="48" height="48" data-img-file="${escapeHtml(u.imageFilename || '')}" loading="lazy" decoding="async" />
            </div>
            <div class="monsters-card__meta">
              <p class="monsters-card__name">${locHtml}${nameInner}</p>
              <p class="monsters-card__sub">${subBits.join(' · ')}</p>
            </div>
          </div>
          ${listInfoHtml}
          ${runeCells}
          ${listMetaHtml}
        </article>`;
  }

  async function ensureMonstersDataset() {
    if (allUnits.length) return true;
    if (typeof installEmbeddedDemoDataset !== 'function') return false;
    return installEmbeddedDemoDataset({ keepTab: true });
  }

  function showMonsterDetailForCard(unitId, anchorEl) {
    monstersDetailHoverUnitId = unitId != null ? String(unitId) : null;
    const u = monstersEnrichedCache.find((x) => String(x.unitId) === String(unitId));
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    cancelMonstersDetailHide();
    document.querySelectorAll('.monsters-card').forEach((card) => {
      card.classList.toggle('monsters-card--hover', card.getAttribute('data-unit-id') === String(unitId));
    });
    renderMonstersDetail(u || null, t, anchorEl);
  }

  function selectMonsterUnit(unitId, anchorEl) {
    saveMonstersSelectedUnitId(unitId);
    document.querySelectorAll('.monsters-card').forEach((card) => {
      card.classList.toggle('monsters-card--selected', card.getAttribute('data-unit-id') === String(unitId));
    });
    showMonsterDetailForCard(unitId, anchorEl);
  }
