// js/monsters/monsters-filters.js — from ui-parts/14-monsters.js L302-580
  function bindMonsterPortrait(img, imageFilename) {
    if (!img || !imageFilename || !window.SWRM_MONSTER_DB) return;
    const db = window.SWRM_MONSTER_DB;
    let base = 0;
    img.onerror = () => {
      base += 1;
      if (base < db.IMG_BASES.length) {
        img.src = db.monsterImageUrl(imageFilename, base);
      } else {
        img.removeAttribute('src');
        img.classList.add('monsters-card__img--placeholder');
      }
    };
    img.referrerPolicy = 'no-referrer';
    img.src = db.monsterImageUrl(imageFilename, 0);
  }

  function elementClass(el) {
    const k = String(el || '').toLowerCase();
    if (k === 'fire' || k === 'water' || k === 'wind' || k === 'light' || k === 'dark') return k;
    return '';
  }

  function unitHasRuneSet(u, setName) {
    if (!setName) return true;
    for (const slot of u.runeSlots || []) {
      if (slot.rune && slot.rune.setName === setName) return true;
    }
    return false;
  }

  function filterMonstersList(units, filters) {
    const q = (filters.q || '').trim().toLowerCase();
    const el = filters.element || '';
    const loc = filters.location || 'all';
    const fullSixOnly = !!filters.fullSixOnly;
    const skillFilter = filters.skillFilter || '';
    const runeFilter = filters.runeFilter || '';
    const runeSet = filters.runeSet || '';
    const tagFilter = filters.tagFilter || '';
    const roleFilter = filters.roleFilter || '';
    const markFilter = filters.markFilter || '';
    return units.filter((u) => {
      if (fullSixOnly && !u.hasFullRunes) return false;
      if (el && u.metaElement !== el) return false;
      if (loc === 'active' && u.inStorage) return false;
      if (loc === 'storage' && !u.inStorage) return false;
      if (skillFilter === 'maxed') {
        if (!u.skillsKnown || !u.skillsMaxed) return false;
      } else if (skillFilter === 'needs-up') {
        if (u.skillUpsNeeded <= 0) return false;
      }
      if (runeFilter === 'unruned') {
        if (u.equippedCount > 0) return false;
      } else if (runeFilter === 'partial') {
        if (u.equippedCount <= 0 || u.hasFullRunes) return false;
      }
      if (runeSet && !unitHasRuneSet(u, runeSet)) return false;
      if (tagFilter && !(u.customTags || []).includes(tagFilter)) return false;
      if (roleFilter && normalizeArchetype(u.metaArchetype) !== roleFilter) return false;
      if (markFilter === 'favorite' && !u.favorite) return false;
      if (markFilter === 'food' && !u.food) return false;
      if (q) {
        const hay = `${u.displayName || ''} ${u.masterId}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }

  function sortMonstersList(units, sortKey) {
    const list = units.slice();
    const elIdx = (el) => {
      const i = ELEMENT_ORDER.indexOf(el);
      return i === -1 ? 99 : i;
    };
    list.sort((a, b) => {
      switch (sortKey) {
        case 'level-desc':
          return b.level - a.level || String(a.displayName).localeCompare(String(b.displayName));
        case 'level-asc':
          return a.level - b.level || String(a.displayName).localeCompare(String(b.displayName));
        case 'runes-desc':
          return b.equippedCount - a.equippedCount || String(a.displayName).localeCompare(String(b.displayName));
        case 'element':
          return elIdx(a.metaElement) - elIdx(b.metaElement)
            || String(a.displayName).localeCompare(String(b.displayName));
        case 'favorite-first':
          return (
            (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0)
            || (b.food ? 1 : 0) - (a.food ? 1 : 0)
            || String(a.displayName).localeCompare(String(b.displayName))
          );
        case 'food-first':
          return (
            (b.food ? 1 : 0) - (a.food ? 1 : 0)
            || (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0)
            || String(a.displayName).localeCompare(String(b.displayName))
          );
        case 'name':
        default:
          return String(a.displayName).localeCompare(String(b.displayName));
      }
    });
    return list;
  }

  function computeMonstersSummary(units) {
    const total = units.length;
    let anyRune = 0;
    let fullSix = 0;
    let skillUpsTotal = 0;
    for (const u of units) {
      if (u.equippedCount > 0) anyRune += 1;
      if (u.hasFullRunes) fullSix += 1;
      if (u.skillUpsNeeded > 0) skillUpsTotal += u.skillUpsNeeded;
    }
    return { total, anyRune, fullSix, skillUpsTotal };
  }

  function renderMonstersChips(sum, t, indexMissing, skillsIndexMissing) {
    const chips = document.getElementById('monsters-chips');
    if (!chips) return;
    const tpl =
      t.monstersStatsTpl || '{total} six-star · {any} with any rune · {full} with 6 runes';
    const parts = [
      { label: t.monstersChipTotal || '6★', value: sum.total },
      { label: t.monstersChipRunes || 'With runes', value: sum.anyRune },
      { label: t.monstersChipFull || '6/6', value: sum.fullSix },
    ];
    if (sum.skillUpsTotal > 0) {
      parts.push({
        label: t.monstersChipSkillUps || 'Skill-ups needed',
        value: sum.skillUpsTotal,
      });
    }
    chips.innerHTML = parts
      .map(
        (p) =>
          `<span class="monsters-chip"><span class="monsters-chip__label">${escapeHtml(p.label)}</span><strong class="monsters-chip__value">${escapeHtml(String(p.value))}</strong></span>`,
      )
      .join('');
    if (indexMissing) {
      const hint =
        t.monstersIndexMissing ||
        'Monster names need data/monsters-index.json — run: node tools/fetch-monsters-index.mjs';
      chips.insertAdjacentHTML(
        'beforeend',
        `<p class="monsters-index-warn monsters-index-warn--inline">${escapeHtml(hint)}</p>`,
      );
    }
    if (skillsIndexMissing) {
      const hint =
        t.monstersSkillsIndexMissing ||
        'Skill max levels need data/skills-index.json — run: node tools/fetch-skills-index.mjs';
      chips.insertAdjacentHTML(
        'beforeend',
        `<p class="monsters-index-warn monsters-index-warn--inline">${escapeHtml(hint)}</p>`,
      );
    }
    const statsEl = document.getElementById('monsters-stats');
    if (statsEl) statsEl.hidden = true;
  }

  function readMonstersView() {
    try {
      return localStorage.getItem(MONSTERS_VIEW_KEY) === 'list' ? 'list' : 'cards';
    } catch (e) {
      return 'cards';
    }
  }

  function writeMonstersView(view) {
    try {
      localStorage.setItem(MONSTERS_VIEW_KEY, view === 'list' ? 'list' : 'cards');
    } catch (e) { /* ignore */ }
  }

  function syncMonstersShowAllButton(fullSixOnly, t) {
    const btn = document.getElementById('monsters-filter-full-six');
    const lbl = document.getElementById('lbl-monsters-filter-full-six-btn');
    const fieldLbl = document.getElementById('lbl-monsters-filter-full-six');
    if (!btn) return;
    const hideUnruned = !!fullSixOnly;
    btn.classList.toggle('monsters-toolbar-btn--active', hideUnruned);
    btn.setAttribute('aria-pressed', hideUnruned ? 'true' : 'false');
    const text = hideUnruned
      ? t.monstersFilterShowAll || 'Show all monsters'
      : t.monstersFilterSixOnly || '6/6 runes only';
    if (lblBtn) lblBtn.textContent = text;
    else btn.textContent = text;
  }

  function clearMonstersPanelFilters() {
    const ids = [
      'monsters-filter-location',
      'monsters-filter-skill',
      'monsters-filter-rune',
      'monsters-filter-rune-set',
      'monsters-filter-tag',
      'monsters-filter-role',
      'monsters-filter-mark',
    ];
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) el.value = '';
    }
    const sixBtn = document.getElementById('monsters-filter-full-six');
    if (sixBtn) {
      sixBtn.setAttribute('aria-pressed', 'false');
      sixBtn.classList.remove('monsters-toolbar-btn--active');
    }
  }

  function resetMonstersSearchQuery() {
    const q = document.getElementById('monsters-filter-q');
    if (q) q.value = '';
  }

  function renderMonstersEmptyState(mode, t) {
    const root = document.getElementById('monsters-empty');
    const titleEl = document.getElementById('monsters-empty-title');
    const hintEl = document.getElementById('monsters-empty-hint');
    const actionsEl = document.getElementById('monsters-empty-actions');
    if (!root || !titleEl) return;
    if (mode === 'no-data') {
      titleEl.textContent = t.monstersEmptyNoData || 'Load a SWEX export to see your 6★ monsters.';
      if (hintEl) {
        hintEl.textContent = '';
        hintEl.hidden = true;
      }
      if (actionsEl) actionsEl.hidden = true;
    } else {
      titleEl.textContent = t.monstersEmptyTitle || 'No monsters found';
      if (hintEl) {
        hintEl.textContent = t.monstersEmptyFiltered || '';
        hintEl.hidden = !hintEl.textContent;
      }
      if (actionsEl) actionsEl.hidden = false;
    }
    root.hidden = false;
  }

  function syncMonstersViewToggle(view) {
    const grid = document.getElementById('monsters-grid');
    if (grid) {
      grid.classList.toggle('monsters-grid--list', view === 'list');
      grid.classList.toggle('monsters-grid--cards', view !== 'list');
    }
    const btnCards = document.getElementById('monsters-view-cards');
    const btnList = document.getElementById('monsters-view-list');
    if (btnCards) {
      btnCards.classList.toggle('monsters-view-btn--active', view === 'cards');
      btnCards.setAttribute('aria-pressed', view === 'cards' ? 'true' : 'false');
    }
    if (btnList) {
      btnList.classList.toggle('monsters-view-btn--active', view === 'list');
      btnList.setAttribute('aria-pressed', view === 'list' ? 'true' : 'false');
    }
  }

  function cancelMonstersDetailHide() {
    if (monstersDetailHideTimer) {
      clearTimeout(monstersDetailHideTimer);
      monstersDetailHideTimer = null;
    }
  }

  function scheduleMonstersDetailHide() {
    cancelMonstersDetailHide();
    monstersDetailHideTimer = setTimeout(() => {
      monstersDetailHideTimer = null;
      hideMonstersDetailFloat();
    }, 140);
  }

  function hideMonstersDetailFloat() {
    const aside = document.getElementById('monsters-detail');
    if (aside) {
      aside.hidden = true;
      aside.classList.remove('monsters-detail--visible');
      aside.style.removeProperty('left');
      aside.style.removeProperty('top');
    }
    monstersDetailHoverUnitId = null;
    document.querySelectorAll('.monsters-card--hover').forEach((c) => {
      c.classList.remove('monsters-card--hover');
    });
  }

  function positionMonstersDetailFloat(anchorEl) {
    const aside = document.getElementById('monsters-detail');
    if (!aside || !anchorEl) return;
    aside.hidden = false;
    aside.classList.add('monsters-detail--visible');
    const place = () => {
      const rect = anchorEl.getBoundingClientRect();
      const pad = 10;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const w = aside.offsetWidth || 320;
      const h = aside.offsetHeight || 400;
      let left = rect.right + pad;
      let top = rect.top;
      if (left + w > vw - pad) left = rect.left - w - pad;
      if (left < pad) left = Math.max(pad, (vw - w) / 2);
      if (top + h > vh - pad) top = Math.max(pad, vh - h - pad);
      if (top < pad) top = pad;
      aside.style.left = `${Math.round(left)}px`;
      aside.style.top = `${Math.round(top)}px`;
    };
    requestAnimationFrame(() => requestAnimationFrame(place));
  }

  function bindMonstersDetailFloat() {
    const aside = document.getElementById('monsters-detail');
    if (!aside || aside.dataset.floatBound === '1') return;
    aside.dataset.floatBound = '1';
    aside.addEventListener('mouseenter', cancelMonstersDetailHide);
    aside.addEventListener('mouseleave', scheduleMonstersDetailHide);
    const reposition = () => {
      const uid = monstersDetailHoverUnitId;
      const card = uid
        ? document.querySelector(`.monsters-card[data-unit-id="${String(uid).replace(/"/g, '\\"')}"]`)
        : null;
      if (card && !aside.hidden) positionMonstersDetailFloat(card);
    };
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
  }
