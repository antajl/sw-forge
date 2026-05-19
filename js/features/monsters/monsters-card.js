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
    const db = window.SWRM_MONSTER_DB;
    if (db && typeof db.isMonsterAwakened === 'function') {
      return db.isMonsterAwakened(u.masterId, u.meta);
    }
    return false;
  }

  function buildMonsterStarsBadge(u, variant) {
    const n = monsterUnitRankStars(u);
    if (!n) return '';
    const awakened = monsterUnitIsAwakened(u);
    const rowCls =
      variant === 'table'
        ? 'monsters-table__stars'
        : 'monsters-card__stars-row';
    const starCls = variant === 'table' ? 'monsters-table__star' : 'monsters-card__star';
    const awakenCls = awakened
      ? variant === 'table'
        ? ' monsters-table__stars--awakened'
        : ' monsters-card__stars-row--awakened'
      : '';
    const stars = Array.from(
      { length: n },
      (_, i) => `<span class="${starCls}" style="--star-i:${i}">★</span>`,
    ).join('');
    if (variant === 'table') {
      return `<div class="${rowCls}${awakenCls}" aria-label="${n}★">${stars}</div>`;
    }
    return `<div class="${rowCls}${awakenCls} monsters-card__stars-row--overlay" aria-label="${n}★">${stars}</div>`;
  }

  function buildMonsterElementBadge(u) {
    const db = window.SWRM_MONSTER_DB;
    const el = elementClass(u.metaElement);
    if (!el) return '';
    const url = db && typeof db.elementIconUrl === 'function' ? db.elementIconUrl(u.metaElement) : '';
    if (url) {
      const fallback =
        db && typeof db.swarfarmDirectUrl === 'function'
          ? db.swarfarmDirectUrl(`static/herders/images/elements/${elementClass(u.metaElement)}.png`)
          : '';
      const onerr = fallback
        ? ` onerror="if(this.dataset.fb){this.onerror=null;this.src=this.dataset.fb}" data-fb="${escapeHtml(fallback)}"`
        : '';
      return `<img class="monsters-card__element-img" src="${escapeHtml(url)}" alt="${escapeHtml(u.metaElement)}" width="24" height="24" loading="lazy" decoding="async" referrerpolicy="no-referrer"${onerr} />`;
    }
    const letter = String(u.metaElement || '?').charAt(0).toUpperCase();
    return `<span class="monsters-card__element monsters-card__element--${el}" title="${escapeHtml(u.metaElement)}">${escapeHtml(letter)}</span>`;
  }

  function buildMonsterLevelBadge(u, t) {
    const lbl = t.monstersLevelShort || 'Lv';
    const lv = escapeHtml(String(u.level));
    return `<span class="monsters-card__level" aria-label="${escapeHtml(lbl)} ${lv}">${lv}</span>`;
  }

  function buildMonsterBulkToggleHtml(u) {
    const uid = escapeHtml(String(u.unitId));
    const on = monstersBulkSelected.has(String(u.unitId));
    return `<button type="button" class="monsters-card__bulk-btn${on ? ' monsters-card__bulk-btn--on' : ''}" data-bulk-toggle="1" data-unit-id="${uid}" aria-pressed="${on ? 'true' : 'false'}" title="Select for bulk">✓</button>`;
  }

  function buildMonsterCardHtml(u, db, t, view) {
    const elCls = elementClass(u.metaElement);
    const pinned = monstersDetailPinnedUnitId != null && String(monstersDetailPinnedUnitId) === String(u.unitId);
    const hover =
      !pinned &&
      monstersDetailHoverUnitId != null &&
      String(monstersDetailHoverUnitId) === String(u.unitId);
    const bestiaryHref = db && u.bestiarySlug ? db.bestiaryUrl(u.bestiarySlug) : '';
    const nameInner = bestiaryHref
      ? `<a href="${escapeHtml(bestiaryHref)}" target="_blank" rel="noopener noreferrer">${escapeHtml(u.displayName)}</a>`
      : escapeHtml(u.displayName);
    const runeCells = buildRuneBlockHtml(u, db, t, view);
    const bulkSel = monstersBulkSelected.has(String(u.unitId));
    const starsBadge = buildMonsterStarsBadge(u);
    const ro = typeof isShareReadOnly === 'function' && isShareReadOnly();
    const marksHtml =
      view !== 'table' && !ro
        ? `<span class="monsters-card__name-marks">${buildCardActionsHtml(u, t)}</span>`
        : '';
    const pinClose =
      pinned && !ro
        ? `<button type="button" class="monsters-card__pin-close" data-unpin-detail="1" title="${escapeHtml(t.monstersDetailUnpin || 'Close')}">×</button>`
        : '';
    return `<article class="monsters-card monsters-card--grid${u.favorite ? ' monsters-card--favorite' : ''}${u.food ? ' monsters-card--food' : ''}${bulkSel ? ' monsters-card--bulk-on' : ''}${pinned ? ' monsters-card--pinned' : ''}${hover ? ' monsters-card--hover' : ''}${elCls ? ` monsters-card--${elCls}` : ''}" data-unit-id="${escapeHtml(String(u.unitId))}" data-master-id="${u.masterId}" tabindex="0">
          ${pinClose}
          <div class="monsters-card__bar monsters-card__bar--${elCls}" aria-hidden="true"></div>
          ${ro ? '' : buildMonsterBulkToggleHtml(u)}
          <div class="monsters-card__hero">
            ${starsBadge}
            <img class="monsters-card__img" alt="" width="120" height="120" data-img-file="${escapeHtml(u.imageFilename || '')}" loading="lazy" decoding="async" />
            ${buildMonsterElementBadge(u)}
            ${buildMonsterLevelBadge(u, t)}
          </div>
          <div class="monsters-card__meta">
            <p class="monsters-card__name">
              <span class="monsters-card__name-text">${nameInner}</span>${marksHtml}
            </p>
          </div>
          ${runeCells}
        </article>`;
  }

  async function ensureMonstersDataset() {
    if (allUnits.length) return true;
    if (typeof installEmbeddedDemoDataset !== 'function') return false;
    return installEmbeddedDemoDataset({ keepTab: true });
  }

  function syncMonsterRowHighlight(unitId) {
    const uid = unitId != null ? String(unitId) : '';
    const pinned = monstersDetailPinnedUnitId != null;
    document.querySelectorAll('.monsters-card, .monsters-table__row').forEach((node) => {
      const id = node.getAttribute('data-unit-id');
      const on = id === uid;
      if (node.classList.contains('monsters-card')) {
        node.classList.toggle('monsters-card--hover', !pinned && on);
        node.classList.toggle('monsters-card--pinned', pinned && on);
      } else {
        node.classList.toggle('monsters-table__row--hover', !pinned && on);
        node.classList.toggle('monsters-table__row--pinned', pinned && on);
      }
    });
  }

  function showMonsterDetailForCard(unitId, anchorEl, options) {
    const opts = options || {};
    const pin = opts.pin === true;
    if (pin) {
      monstersDetailPinnedUnitId = unitId != null ? String(unitId) : null;
    }
    if (!monstersDetailPinnedUnitId) {
      monstersDetailHoverUnitId = unitId != null ? String(unitId) : null;
    } else if (pin) {
      monstersDetailHoverUnitId = null;
    }
    const u = monstersEnrichedCache.find((x) => String(x.unitId) === String(unitId));
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    cancelMonstersDetailHide();
    syncMonsterRowHighlight(unitId);
    syncMonstersDetailPinnedLayout();
    renderMonstersDetail(u || null, t, pin ? null : anchorEl);
  }

  function pinMonsterDetail(unitId, anchorEl) {
    showMonsterDetailForCard(unitId, anchorEl, { pin: true });
  }

  function unpinMonsterDetail() {
    monstersDetailPinnedUnitId = null;
    syncMonstersDetailPinnedLayout();
    hideMonstersDetailFloat();
  }
