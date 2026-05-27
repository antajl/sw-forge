// js/features/monsters/monsters-filters.js — filters and empty states
  function bindMonsterPortrait(img, imageFilename) {
    if (!img || !imageFilename || !window.SWRM_MONSTER_DB) return;
    const db = window.SWRM_MONSTER_DB;
    const la = window.SWRM_LOCAL_ASSETS;
    let base = 0;
    img.onerror = () => {
      base += 1;
      if (base < db.IMG_BASES.length) {
        const url =
          la && typeof la.monsterPortraitRemoteUrl === 'function'
            ? la.monsterPortraitRemoteUrl(imageFilename, base)
            : db.monsterImageUrl(imageFilename, base);
        img.src = url;
      } else {
        img.removeAttribute('src');
        img.classList.add('monsters-card__img--placeholder');
      }
    };
    img.referrerPolicy = 'no-referrer';
    const primary = db.monsterImageUrl(imageFilename, 0);
    const fb =
      la && typeof la.monsterPortraitFallbackUrl === 'function'
        ? la.monsterPortraitFallbackUrl(imageFilename)
        : '';
    if (fb && fb !== primary) img.dataset.fallback = fb;
    img.src = primary;
  }

  function elementClass(el) {
    const k = String(el || '').toLowerCase();
    if (k === 'fire' || k === 'water' || k === 'wind' || k === 'light' || k === 'dark') return k;
    return '';
  }

  /** Rainbowmon, elemental Angelmon, Devilmon — excluded from roster views. */
  function isTechnicalFodderMonster(u) {
    if (!u) return false;
    const name = String(u.displayName || '').toLowerCase();
    if (/\brainbowmon\b/i.test(name)) return true;
    if (/\bdevilmon\b/i.test(name)) return true;
    if (/\bangelmon\b/i.test(name)) return true;
    return false;
  }

  function unitHasRuneSet(u, setName) {
    if (!setName) return true;
    for (const slot of u.runeSlots || []) {
      if (slot.rune && slot.rune.setName === setName) return true;
    }
    return false;
  }

  let monstersSearchHighlight = '';

  function highlightMonstersSearchInPlain(text, qRaw) {
    const q = (qRaw || '').trim().toLowerCase();
    const t = String(text ?? '');
    if (!q) return escapeHtml(t);
    const tl = t.toLowerCase();
    const parts = [];
    let i = 0;
    while (i < t.length) {
      const idx = tl.indexOf(q, i);
      if (idx === -1) {
        parts.push(escapeHtml(t.slice(i)));
        break;
      }
      if (idx > i) parts.push(escapeHtml(t.slice(i, idx)));
      parts.push(`<mark class="search-hit">${escapeHtml(t.slice(idx, idx + q.length))}</mark>`);
      i = idx + q.length;
    }
    return parts.join('');
  }

  function monsterUnitSearchHaystack(u) {
    const bits = [
      u.displayName,
      u.masterId,
      u.metaElement,
      u.metaArchetype,
      String(u.level ?? ''),
      String(u.equippedCount ?? ''),
      u.inStorage ? 'storage' : 'active',
      u.favorite ? 'favorite' : '',
      u.food ? 'food fodder' : '',
      (u.customTags || []).join(' '),
    ];
    for (const slot of u.runeSlots || []) {
      const r = slot.rune;
      if (!r) continue;
      bits.push(
        r.setName,
        r.mainName,
        r.gradeStr,
        String(r.slot),
        String(r.level),
        r.role,
        r.verdict,
      );
      for (const s of r.substats || []) {
        if (s.name) bits.push(s.name, String(s.val ?? ''));
      }
    }
    for (const sk of u.skillRows || []) {
      bits.push(sk.name, String(sk.level), String(sk.maxLevel));
    }
    return bits
      .filter((x) => x != null && String(x).trim() !== '')
      .join(' ')
      .toLowerCase();
  }

  /** Roster "Needs attention": runes on unit, not in storage, skill 2+ with ≥1 devilmon invested but not maxed. */
  function unitSkillAttentionState(u) {
    if (!u || (Number(u.equippedCount) || 0) <= 0) return { ok: false, total: 0 };
    if (u.inStorage) return { ok: false, total: 0 };
    const rows = Array.isArray(u.skillRows) ? u.skillRows : [];
    let total = 0;
    let hasPartial = false;
    for (const s of rows) {
      if ((Number(s.origSlot) || 0) <= 1) continue;
      const max = Number(s.maxLevel) || 0;
      const level = Number(s.level) || 0;
      if (max <= 1) continue;
      if (level > 1 && level < max) hasPartial = true;
      const d = Number(s.deficit) || 0;
      if (d > 0) total += d;
    }
    return { ok: hasPartial && total > 0, total };
  }

  function filterMonstersList(units, filters) {
    const q = (filters.q || '').trim().toLowerCase();
    const el = filters.element || '';
    const loc = filters.location || 'all';
    const fullSixOnly = !!filters.fullSixOnly;
    const minLevelMin = Number(filters.minLevelMin) || 0;
    const skillFilter = filters.skillFilter || '';
    const runeFilter = filters.runeFilter || '';
    const runeSet = filters.runeSet || '';
    const tagFilter = filters.tagFilter || '';
    const roleFilter = filters.roleFilter || '';
    const markFilter = filters.markFilter || '';
    const attentionOnly = !!filters.attentionOnly;
    return units.filter((u) => {
      if (isTechnicalFodderMonster(u)) return false;
      if (fullSixOnly && !u.hasFullRunes) return false;
      if (minLevelMin > 0 && (Number(u.level) || 0) < minLevelMin) return false;
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
      if (attentionOnly && !unitSkillAttentionState(u).ok) return false;
      if (q) {
        const hay = monsterUnitSearchHaystack(u);
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
        case 'skills-closest': {
          const deficitSum = (u) => {
            const st = unitSkillAttentionState(u);
            return st.ok ? st.total : 999;
          };
          return (
            deficitSum(a) - deficitSum(b) ||
            String(a.displayName).localeCompare(String(b.displayName))
          );
        }
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
    let total = 0;
    let anyRune = 0;
    let fullSix = 0;
    let unruned = 0;
    let partial = 0;
    let skillUpsTotal = 0;
    let skillMonsters = 0;
    let storage = 0;
    for (const u of units) {
      if (typeof isTechnicalFodderMonster === 'function' && isTechnicalFodderMonster(u)) continue;
      total += 1;
      if (u.inStorage) storage += 1;
      if (u.equippedCount <= 0) unruned += 1;
      else if (!u.hasFullRunes) partial += 1;
      if (u.equippedCount > 0) anyRune += 1;
      if (u.hasFullRunes) fullSix += 1;
      if (u.skillUpsNeeded > 0) {
        skillMonsters += 1;
        skillUpsTotal += u.skillUpsNeeded;
      }
    }
    return { total, anyRune, fullSix, unruned, partial, skillUpsTotal, skillMonsters, storage };
  }

  function renderMonstersChips(sum, t, indexMissing, skillsIndexMissing, chipsHostId) {
    const chips = document.getElementById(chipsHostId || 'monsters-chips');
    if (!chips) return;
    const tpl =
      t.monstersStatsTpl || '{total} six-star · {any} with any rune · {full} with 6 runes';
    const parts = [
      { label: t.monstersChipTotal || '6★', value: sum.total },
      { label: t.monstersChipFull || 'Full 6/6', value: sum.fullSix },
      { label: t.monstersChipUnruned || 'No runes', value: sum.unruned },
      { label: t.monstersChipPartial || 'Incomplete', value: sum.partial },
      { label: t.monstersChipRunes || 'With runes', value: sum.anyRune },
    ];
    if (sum.storage > 0) {
      parts.push({ label: t.monstersChipStorage || 'In storage', value: sum.storage });
    }
    if (sum.skillUpsTotal > 0) {
      parts.push({
        label: t.monstersChipSkillUps || 'Skill-ups',
        value: sum.skillUpsTotal,
      });
    }
    if (sum.skillMonsters > 0) {
      parts.push({
        label: t.monstersChipSkillMons || 'Need skill-ups',
        value: sum.skillMonsters,
      });
    }
    const bag = window.SWRM_ACCOUNT_GEAR;
    if (bag && ((bag.artifacts && bag.artifacts.length) || (bag.relics && bag.relics.length))) {
      const na = (bag.artifacts || []).length;
      const nr = (bag.relics || []).length;
      parts.push({
        label: t.monstersChipGear || 'Gear in box',
        value: `${na} / ${nr}`,
      });
    }
    chips.innerHTML = parts
      .map(
        (p) =>
          `<span class="monsters-chip"><span class="monsters-chip__label">${escapeHtml(p.label)}</span><strong class="monsters-chip__value">${escapeHtml(String(p.value))}</strong></span>`,
      )
      .join('');
    const hostId = chipsHostId || 'monsters-chips';
    if (hostId === 'monsters-chips') {
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
  }

  function readMonstersView() {
    try {
      const v = localStorage.getItem(MONSTERS_VIEW_KEY);
      if (v === 'table') return 'table';
      if (v === 'list') return 'cards';
      if (v === 'cards') return 'cards';
      return 'table';
    } catch (e) {
      return 'table';
    }
  }

  function writeMonstersView(view) {
    try {
      const v = view === 'table' ? 'table' : 'cards';
      localStorage.setItem(MONSTERS_VIEW_KEY, v);
    } catch (e) { /* ignore */ }
  }

  function syncMonstersShowAllButton(fullSixOnly, t) {
    const btn = document.getElementById('monsters-filter-full-six');
    const lbl = document.getElementById('lbl-monsters-filter-full-six-btn');
    if (!btn) return;
    const hideUnruned = !!fullSixOnly;
    btn.classList.toggle('monsters-toolbar-btn--active', hideUnruned);
    btn.setAttribute('aria-pressed', hideUnruned ? 'true' : 'false');
    const text = hideUnruned
      ? t.monstersFilterShowAll || 'Show all monsters'
      : t.monstersFilterSixOnly || '6/6 runes only';
    if (lbl) lbl.textContent = text;
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
      if (!el) continue;
      if (id === 'monsters-filter-location') el.value = 'all';
      else el.value = '';
    }
    const sixBtn = document.getElementById('monsters-filter-full-six');
    if (sixBtn) {
      sixBtn.setAttribute('aria-pressed', 'false');
      sixBtn.classList.remove('monsters-toolbar-btn--active');
    }
    const lvlInp = document.getElementById('monsters-filter-min-level');
    if (lvlInp) lvlInp.value = '';
  }

  /** Reset search, element, location, advanced filters, level / 6-6 toggles; then persist from DOM. */
  function resetMonstersToolbarFilters(t) {
    clearMonstersPanelFilters();
    resetMonstersSearchQuery();
    const elSel = document.getElementById('monsters-filter-element');
    if (elSel) elSel.value = '';
    const locSel = document.getElementById('monsters-filter-location');
    if (locSel) locSel.value = 'all';
    if (t) {
      syncMonstersShowAllButton(false, t);
      syncMonstersMinLevelInput(0, t);
    }
    const next = readMonstersFiltersFromDom();
    next.attentionOnly = false;
    writeMonstersFilters(next);
    updateMonstersFilterSummary();
  }

  function resetMonstersSearchQuery() {
    const q = document.getElementById('monsters-filter-q');
    if (q) q.value = '';
  }

  function renderMonstersEmptyState(mode, t) {
    const grid = document.getElementById('monsters-grid');
    const gridHead = document.getElementById('monsters-grid-head');
    if (!grid) return;
    if (gridHead) gridHead.hidden = true;
    const title =
      mode === 'no-data'
        ? t.monstersEmptyNoData || 'Load a SWEX export to see your monsters.'
        : t.monstersEmptyTitle || 'No monsters found';
    const hint = mode === 'filtered' ? t.monstersEmptyFiltered || '' : '';
    const actions =
      mode === 'filtered'
        ? `<div class="monsters-grid__empty-actions">
            <button type="button" class="monsters-toolbar-btn btn-sm" id="monsters-empty-clear-filters">${escapeHtml(t.monstersEmptyClearFilters || 'Clear filters')}</button>
            <button type="button" class="monsters-toolbar-btn btn-sm" id="monsters-empty-reset-search">${escapeHtml(t.monstersEmptyResetSearch || 'Reset search')}</button>
          </div>`
        : '';
    grid.innerHTML =
      '<div class="monsters-grid__empty" role="status">' +
      `<p class="monsters-grid__empty-title">${escapeHtml(title)}</p>` +
      (hint ? `<p class="monsters-grid__empty-hint">${escapeHtml(hint)}</p>` : '') +
      actions +
      '</div>';
    grid.classList.remove('monsters-grid--table', 'monsters-grid--cards');
    grid.classList.add('monsters-grid--empty-state');
  }

  function syncMonstersMinLevelInput(minLevelMin, t) {
    const n = Number(minLevelMin) || 0;
    const inp = document.getElementById('monsters-filter-min-level');
    if (inp) inp.value = n > 0 ? String(n) : '';
    const lbl = document.getElementById('lbl-monsters-filter-min-level');
    if (lbl) lbl.textContent = t.monstersFilterMinLevel || 'Min level';
  }

  function selectAllVisibleMonsters() {
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    for (const id of monstersVisibleUnitIds) monstersBulkSelected.add(id);
    writeMonstersBulkSelected(monstersBulkSelected);
    syncMonstersBulkBar(t);
    const grid = document.getElementById('monsters-grid');
    if (typeof syncBulkCardStates === 'function') syncBulkCardStates(grid);
    syncMonstersSelectAllState();
  }

  function syncMonstersSelectAllState() {
    const vis = monstersVisibleUnitIds.length;
    let n = 0;
    for (const id of monstersVisibleUnitIds) {
      if (monstersBulkSelected.has(id)) n += 1;
    }
    const state = { checked: vis > 0 && n === vis, indeterminate: n > 0 && n < vis };
    for (const id of ['monsters-table-select-all', 'monsters-grid-select-all']) {
      const el = document.getElementById(id);
      if (!el) continue;
      el.checked = state.checked;
      el.indeterminate = state.indeterminate;
    }
  }

  function bindMonstersGridSelectAll(t) {
    const selAll = document.getElementById('monsters-grid-select-all');
    if (!selAll || selAll.dataset.bound === '1') return;
    selAll.dataset.bound = '1';
    const ro = typeof isShareReadOnly === 'function' && isShareReadOnly();
    if (ro) return;
    selAll.addEventListener('change', () => {
      const on = selAll.checked;
      for (const id of monstersVisibleUnitIds) {
        if (on) monstersBulkSelected.add(id);
        else monstersBulkSelected.delete(id);
      }
      writeMonstersBulkSelected(monstersBulkSelected);
      syncMonstersBulkBar(t);
      const grid = document.getElementById('monsters-grid');
      if (typeof syncBulkCardStates === 'function') syncBulkCardStates(grid);
      syncMonstersSelectAllState();
    });
  }

  function syncMonstersViewToggle(view) {
    const grid = document.getElementById('monsters-grid');
    const gridHead = document.getElementById('monsters-grid-head');
    const sortField = document.querySelector('.monsters-toolbar__field--sort');
    if (sortField) sortField.hidden = view === 'table';
    const rosterMeta = document.querySelector('.monsters-roster-meta');
    if (gridHead) gridHead.hidden = view !== 'cards';
    if (rosterMeta) rosterMeta.classList.toggle('monsters-roster-meta--table', view === 'table');
    if (grid) {
      grid.classList.toggle('monsters-grid--table', view === 'table');
      grid.classList.toggle('monsters-grid--cards', view === 'cards');
    }
    const btnCards = document.getElementById('monsters-view-cards');
    const btnTable = document.getElementById('monsters-view-table');
    if (btnCards) {
      btnCards.classList.toggle('monsters-view-btn--active', view === 'cards');
      btnCards.setAttribute('aria-pressed', view === 'cards' ? 'true' : 'false');
    }
    if (btnTable) {
      btnTable.classList.toggle('monsters-view-btn--active', view === 'table');
      btnTable.setAttribute('aria-pressed', view === 'table' ? 'true' : 'false');
    }
  }

  function cancelMonstersDetailHide() {
    if (monstersDetailHideTimer) {
      clearTimeout(monstersDetailHideTimer);
      monstersDetailHideTimer = null;
    }
  }

  function scheduleMonstersDetailHide() {
    if (monstersDetailPinnedUnitId != null) return;
    cancelMonstersDetailHide();
    monstersDetailHideTimer = setTimeout(() => {
      monstersDetailHideTimer = null;
      hideMonstersDetailFloat();
    }, 140);
  }

  function syncMonstersDetailPinnedLayout() {
    const layout = document.getElementById('monsters-layout');
    const aside = document.getElementById('monsters-detail');
    const pinned = monstersDetailPinnedUnitId != null;
    if (layout) layout.classList.remove('monsters-layout--pinned');
    if (!aside) return;
    aside.classList.add('monsters-detail--float');
    aside.classList.remove('monsters-detail--pinned');
    aside.classList.toggle('monsters-detail--locked', pinned);
  }

  function hideMonstersDetailFloat() {
    if (monstersDetailPinnedUnitId != null) return;
    const aside = document.getElementById('monsters-detail');
    if (aside) {
      aside.hidden = true;
      aside.classList.remove('monsters-detail--visible');
      aside.style.removeProperty('left');
      aside.style.removeProperty('top');
    }
    monstersDetailHoverUnitId = null;
    syncMonsterRowHighlight(null);
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
      const uid = monstersDetailPinnedUnitId || monstersDetailHoverUnitId;
      if (!uid) return;
      const esc = String(uid).replace(/"/g, '\\"');
      const card =
        document.querySelector(`.monsters-card[data-unit-id="${esc}"]`) ||
        document.querySelector(`.monsters-table__row[data-unit-id="${esc}"]`) ||
        document.querySelector(`.team-card__slot[data-unit-id="${esc}"]`);
      if (card && !aside.hidden) positionMonstersDetailFloat(card);
    };
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
  }
