// js/monsters/monsters-runes.js — from ui-parts/14-monsters.js L582-1103
  function formatMonsterRuneTooltip(r, t, slotNo) {
    if (!r) return '';
    const subFn =
      window.SWRM && typeof window.SWRM.subRuneValue === 'function'
        ? window.SWRM.subRuneValue
        : (s) => (Number(s?.val) || 0) + (Number(s?.grind) || 0);
    const parts = [];
    const hdr = [r.setName, `+${r.level || 0}`, r.gradeStr || ''].filter(Boolean).join(' ');
    if (hdr) parts.push(hdr);
    if (r.mainName) {
      parts.push(`${r.mainName} ${fmtRuneStatVal(r.mainType, r.mainVal, slotNo)}`);
    }
    if (r.innate_name && r.innate_val) {
      parts.push(
        `${t.monstersRuneInnate || 'Inn'} ${r.innate_name} ${fmtRuneStatVal(r.innate_type, r.innate_val, null)}`,
      );
    }
    for (const s of r.substats || []) {
      let line = `${s.name} +${subFn(s)}`;
      if (s.enchanted) line += ' *';
      if (Number(s.grind) > 0) line += ` (+${s.grind})`;
      parts.push(line);
    }
    if (Number.isFinite(r.eff)) {
      parts.push(`${t.monstersRuneEff || 'Eff'} ${(Math.round(r.eff * 10) / 10).toFixed(1)}%`);
    }
    return parts.join(' · ');
  }

  function computeActiveSetBonuses(u) {
    const counts = {};
    for (const slot of u.runeSlots || []) {
      const name = slot.rune && slot.rune.setName;
      if (!name) continue;
      counts[name] = (counts[name] || 0) + 1;
    }
    const out = [];
    for (const [name, total] of Object.entries(counts)) {
      let left = total;
      const parts = [];
      while (left >= 4) {
        parts.push(4);
        left -= 4;
      }
      if (left >= 2) {
        parts.push(2);
        left -= 2;
      }
      for (const pieces of parts) {
        out.push({ name, pieces });
      }
    }
    out.sort((a, b) => b.pieces - a.pieces || String(a.name).localeCompare(String(b.name)));
    return out;
  }

  function buildRuneSetBonusSummaryHtml(u, t, db) {
    const bonuses = computeActiveSetBonuses(u);
    if (!bonuses.length) return '';
    const chips = bonuses
      .map((b) => {
        const icon =
          db && typeof db.runeSetImageUrl === 'function' ? db.runeSetImageUrl(b.name) : '';
        const iconHtml = icon
          ? `<img class="monsters-rune-set-chip__icon" src="${escapeHtml(icon)}" alt="" width="18" height="18" loading="lazy" decoding="async" referrerpolicy="no-referrer" />`
          : '';
        return `<span class="monsters-rune-set-chip">${iconHtml}<span class="monsters-rune-set-chip__label">${escapeHtml(String(b.pieces))} ${escapeHtml(b.name)}</span></span>`;
      })
      .join('');
    const lbl = t.monstersRuneSetsActive || 'Active sets';
    return (
      '<div class="monsters-rune-sets" aria-label="' +
      escapeHtml(lbl) +
      '">' +
      chips +
      '</div>'
    );
  }

  function buildListRuneLineHtml(slot, db, t) {
    const emptySlot = t.monstersRuneEmpty || '—';
    const slotLbl = t.monstersRuneSlot || 'Slot';
    const r = slot.rune;
    const setName = r && r.setName ? r.setName : '';
    const runeIconUrl = setName && db ? db.runeSetImageUrl(setName) : '';
    const iconInner = runeIconUrl
      ? `<img src="${escapeHtml(runeIconUrl)}" alt="" width="16" height="16" loading="lazy" decoding="async" referrerpolicy="no-referrer" />`
      : '<span class="monsters-list-rune-row__ph" aria-hidden="true"></span>';

    if (!r && !slot.runeId) {
      return `<div class="monsters-list-rune-row monsters-list-rune-row--empty" data-slot="${slot.slot}" title="${escapeHtml(`${slotLbl} ${slot.slot}`)}">
        <span class="monsters-list-rune-row__icon">${iconInner}</span>
        <span class="monsters-list-rune-row__text">${slotLbl} ${slot.slot}: ${escapeHtml(emptySlot)}</span>
      </div>`;
    }

    const subFn =
      window.SWRM && typeof window.SWRM.subRuneValue === 'function'
        ? window.SWRM.subRuneValue
        : (s) => (Number(s?.val) || 0) + (Number(s?.grind) || 0);
    const hdr = [setName, r.level != null ? `+${r.level}` : '', r.gradeStr || '']
      .filter(Boolean)
      .join(' ');
    const mainPart = r.mainName
      ? `${r.mainName} ${fmtRuneStatVal(r.mainType, r.mainVal, slot.slot)}`
      : '';
    const innPart =
      r.innate_name && r.innate_val
        ? `${t.monstersRuneInnate || 'Inn'} ${r.innate_name} ${fmtRuneStatVal(r.innate_type, r.innate_val, null)}`
        : '';
    const subPart = (r.substats || [])
      .map((s) => {
        let line = `${s.name} +${subFn(s)}`;
        if (s.enchanted) line += '*';
        if (Number(s.grind) > 0) line += `+${s.grind}`;
        return line;
      })
      .join(', ');
    const text = [hdr, mainPart, innPart, subPart].filter(Boolean).join(' · ');
    const tip = formatMonsterRuneTooltip(r, t, slot.slot);

    return `<div class="monsters-list-rune-row" data-slot="${slot.slot}" title="${escapeHtml(tip || text)}">
        <span class="monsters-list-rune-row__icon">${iconInner}</span>
        <span class="monsters-list-rune-row__text"><strong>${slotLbl} ${slot.slot}</strong> ${escapeHtml(text)}</span>
      </div>`;
  }

  function buildListRuneColumnHtml(u, db, t) {
    const slots = (u.runeSlots || []).slice().sort((a, b) => a.slot - b.slot);
    const lines = slots.map((slot) => buildListRuneLineHtml(slot, db, t)).join('');
    return `<div class="monsters-list__runes-col">${lines}</div>`;
  }

  function bindMonsterRuneTooltips(root, unit, t) {
    if (!root || !unit || typeof setSwrmFloatTipTarget !== 'function') return;
    root.querySelectorAll('[data-slot]').forEach((el) => {
      const slotNo = Number(el.getAttribute('data-slot'));
      if (!Number.isFinite(slotNo)) return;
      const slot = (unit.runeSlots || []).find((s) => s.slot === slotNo);
      const tip = slot && slot.rune ? formatMonsterRuneTooltip(slot.rune, t, slotNo) : '';
      setSwrmFloatTipTarget(el, tip);
    });
  }

  function buildLocationIconHtml(u, t) {
    if (!u.inStorage) return '';
    const label = t.monstersLocationStorage || 'Storage';
    return `<span class="monsters-card__loc monsters-card__loc--storage monsters-card__loc--on" title="${escapeHtml(label)}" aria-label="${escapeHtml(label)}"><span class="monsters-card__loc-icon" aria-hidden="true"></span><span class="monsters-card__loc-text">${escapeHtml(label)}</span></span>`;
  }

  function buildCustomTagsHtml(tags) {
    if (!tags || !tags.length) return '';
    return `<span class="monsters-card__tags">${tags
      .map((tag) => `<span class="monsters-card__tag">${escapeHtml(tag)}</span>`)
      .join('')}</span>`;
  }

  function buildMonsterStatsHtml(u, t) {
    const s = u.stats;
    if (!s) {
      return `<p class="monsters-detail__muted">${escapeHtml(t.monstersNoStats || 'No stat data in SWEX.')}</p>`;
    }
    const rows = [
      [t.monstersStatHp || 'HP', s.hp],
      [t.monstersStatAtk || 'ATK', s.atk],
      [t.monstersStatDef || 'DEF', s.def],
      [t.monstersStatSpd || 'SPD', s.spd],
      [t.monstersStatCr || 'CRI Rate', `${s.critRate}%`],
      [t.monstersStatCd || 'CRI Dmg', `${s.critDmg}%`],
      [t.monstersStatRes || 'RES', `${s.res}%`],
      [t.monstersStatAcc || 'ACC', `${s.acc}%`],
    ];
    const body = rows
      .map(
        ([label, val]) =>
          `<div class="monsters-detail__stat"><span class="monsters-detail__stat-k">${escapeHtml(label)}</span><span class="monsters-detail__stat-v">${escapeHtml(String(val))}</span></div>`,
      )
      .join('');
    return `<div class="monsters-detail__stats">${body}</` + `div>`;
  }

  const DETAIL_RUNE_GRID_ORDER = [6, 1, 2, 5, 4, 3];
  const STAR_SLOT_ANGLES = { 6: -150, 1: -90, 2: -30, 3: 30, 4: 90, 5: 150 };

  function buildRuneDetailPanelHtml(r, t, slotNo) {
    if (!r) {
      return `<p class="monsters-detail__muted">${escapeHtml(t.monstersRuneEmpty || '—')}</p>`;
    }
    const subFn =
      window.SWRM && typeof window.SWRM.subRuneValue === 'function'
        ? window.SWRM.subRuneValue
        : (s) => (Number(s?.val) || 0) + (Number(s?.grind) || 0);
    const lines = [];
    const hdr = [r.setName, `+${r.level || 0}`, r.gradeStr || ''].filter(Boolean).join(' ');
    if (hdr) {
      lines.push(
        `<div class="monsters-rune-focus__line monsters-rune-focus__hdr">${escapeHtml(hdr)}</div>`,
      );
    }
    if (r.mainName) {
      lines.push(
        `<div class="monsters-rune-focus__line"><span class="monsters-rune-focus__k">${escapeHtml(r.mainName)}</span><span class="monsters-rune-focus__v">${escapeHtml(fmtRuneStatVal(r.mainType, r.mainVal, slotNo))}</span></div>`,
      );
    }
    if (r.innate_name && r.innate_val) {
      lines.push(
        `<div class="monsters-rune-focus__line"><span class="monsters-rune-focus__k">${escapeHtml(t.monstersRuneInnate || 'Inn')} ${escapeHtml(r.innate_name)}</span><span class="monsters-rune-focus__v">${escapeHtml(fmtRuneStatVal(r.innate_type, r.innate_val, null))}</span></div>`,
      );
    }
    for (const s of r.substats || []) {
      let sub = `${s.name} +${subFn(s)}`;
      if (s.enchanted) sub += ' *';
      if (Number(s.grind) > 0) sub += ` (+${s.grind})`;
      lines.push(
        '<' +
          'd' +
          'iv class="monsters-rune-focus__line"><span class="monsters-rune-focus__k">' +
          escapeHtml(sub) +
          '</span></' +
          'd' +
          'iv>',
      );
    }
    if (Number.isFinite(r.eff)) {
      lines.push(
        `<div class="monsters-rune-focus__line"><span class="monsters-rune-focus__k">${escapeHtml(t.monstersRuneEff || 'Eff')}</span><span class="monsters-rune-focus__v">${escapeHtml((Math.round(r.eff * 10) / 10).toFixed(1))}%</span></div>`,
      );
    }
    return `<div class="monsters-rune-focus">${lines.join('')}</div>`;
  }

  function clearMonsterRuneFocus(root) {
    if (!root) return;
    const panel = root.querySelector('[data-rune-focus]');
    const grid = root.querySelector('.monsters-detail__runes, .monsters-runes--hex-star');
    if (panel) {
      panel.hidden = true;
      panel.innerHTML = '';
    }
    if (grid) grid.removeAttribute('aria-hidden');
    monstersRuneFocusState = null;
  }

  function bindMonsterRuneFocusPanel(root, unit, t) {
    if (!root || !unit) return;
    const panel = root.querySelector('[data-rune-focus]');
    if (!panel) return;
    const grid = root.querySelector('.monsters-detail__runes, .monsters-runes--hex-star');
    const unitId = String(unit.unitId);

    const showSlot = (slotNo) => {
      const slot = (unit.runeSlots || []).find((s) => s.slot === slotNo);
      if (!slot || !slot.rune) {
        clearMonsterRuneFocus(root);
        return;
      }
      if (
        monstersRuneFocusState &&
        monstersRuneFocusState.unitId === unitId &&
        monstersRuneFocusState.slot === slotNo
      ) {
        return;
      }
      monstersRuneFocusState = { unitId, slot: slotNo };
      panel.innerHTML = buildRuneDetailPanelHtml(slot.rune, t, slotNo);
      panel.hidden = false;
      if (grid) grid.setAttribute('aria-hidden', 'true');
      if (typeof setSwrmFloatTipTarget === 'function') {
        root.querySelectorAll('[data-slot]').forEach((el) => setSwrmFloatTipTarget(el, ''));
      }
      history.pushState({ swrmMonsterRuneFocus: 1, unitId, slot: slotNo }, '');
    };

    root.querySelectorAll('[data-slot]').forEach((el) => {
      const slotNo = Number(el.getAttribute('data-slot'));
      if (!Number.isFinite(slotNo)) return;
      const slot = (unit.runeSlots || []).find((s) => s.slot === slotNo);
      const tip = slot && slot.rune ? formatMonsterRuneTooltip(slot.rune, t, slotNo) : '';
      if (typeof setSwrmFloatTipTarget === 'function') setSwrmFloatTipTarget(el, tip);

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (!slot || !slot.rune) return;
        showSlot(slotNo);
      });
    });
  }

  if (!window.__swrmMonsterRunePopstate) {
    window.__swrmMonsterRunePopstate = true;
    window.addEventListener('popstate', () => {
      if (!monstersRuneFocusState) return;
      const wrap = document.querySelector('.monsters-detail__runes-wrap');
      clearMonsterRuneFocus(wrap);
    });
  }

  function isStorageMarked(u) {
    return !!(u && (u.storageMark || u.inStorage));
  }

  function buildCardActionsHtml(u, t) {
    const uid = escapeHtml(String(u.unitId));
    const storageOn = isStorageMarked(u);
    const storageTitle = u.inStorage
      ? t.monstersStorageSwex || t.monstersLocationStorage || 'Storage (SWEX)'
      : t.monstersStorageMark || 'Storage tag';
    const storageDisabled = u.inStorage ? ' disabled' : '';
    return `<div class="monsters-card__actions">
        <button type="button" class="monsters-tag-btn monsters-tag-btn--sm${u.favorite ? ' monsters-tag-btn--on' : ''}" data-unit-tag="favorite" data-unit-id="${uid}" aria-pressed="${u.favorite}" title="${escapeHtml(t.monstersFavorite || 'Favorite')}">★</button>
        <button type="button" class="monsters-tag-btn monsters-tag-btn--sm${u.food ? ' monsters-tag-btn--on' : ''}" data-unit-tag="food" data-unit-id="${uid}" aria-pressed="${u.food}" title="${escapeHtml(t.monstersFood || 'Food')}">🍖</button>
        <button type="button" class="monsters-tag-btn monsters-tag-btn--sm${storageOn ? ' monsters-tag-btn--on' : ''}${u.inStorage ? ' monsters-tag-btn--swex' : ''}" data-unit-tag="storageMark" data-unit-id="${uid}" aria-pressed="${storageOn}" title="${escapeHtml(storageTitle)}"${storageDisabled}>▣</button>
        ${buildLocationIconHtml(u, t)}
      </div>`;
  }

  function buildListRowMetaHtml(u, t) {
    const uid = escapeHtml(String(u.unitId));
    const storageOn = isStorageMarked(u);
    const storageTitle = u.inStorage
      ? t.monstersStorageSwex || t.monstersLocationStorage || 'Storage (SWEX)'
      : t.monstersStorageMark || 'Storage tag';
    const storageDisabled = u.inStorage ? ' disabled' : '';
    const tagChips = (u.customTags || [])
      .map(
        (tag) =>
          `<span class="monsters-list__tag"><span class="monsters-list__tag-label">${escapeHtml(tag)}</span><button type="button" class="monsters-list__tag-rm" data-remove-custom-tag="${escapeHtml(tag)}" data-unit-id="${uid}" title="${escapeHtml(t.monstersTagRemove || 'Remove tag')}">×</button></span>`,
      )
      .join('');
    return `<div class="monsters-card__list-meta">
      <div class="monsters-card__actions monsters-card__actions--list">
        <button type="button" class="monsters-tag-btn monsters-tag-btn--sm${u.favorite ? ' monsters-tag-btn--on' : ''}" data-unit-tag="favorite" data-unit-id="${uid}" aria-pressed="${u.favorite}" title="${escapeHtml(t.monstersFavorite || 'Favorite')}">★</button>
        <button type="button" class="monsters-tag-btn monsters-tag-btn--sm${u.food ? ' monsters-tag-btn--on' : ''}" data-unit-tag="food" data-unit-id="${uid}" aria-pressed="${u.food}" title="${escapeHtml(t.monstersFood || 'Food')}">🍖</button>
        <button type="button" class="monsters-tag-btn monsters-tag-btn--sm${storageOn ? ' monsters-tag-btn--on' : ''}${u.inStorage ? ' monsters-tag-btn--swex' : ''}" data-unit-tag="storageMark" data-unit-id="${uid}" aria-pressed="${storageOn}" title="${escapeHtml(storageTitle)}"${storageDisabled}>▣</button>
        ${buildLocationIconHtml(u, t)}
      </div>
      <div class="monsters-list__tags">
        ${tagChips}
        <input type="text" class="monsters-list__tag-input" data-tag-input data-unit-id="${uid}" maxlength="${MAX_TAG_LEN}" placeholder="${escapeHtml(t.monstersTagPlaceholder || 'New tag…')}" autocomplete="off" />
        <button type="button" class="monsters-list__tag-add" data-add-custom-tag data-unit-id="${uid}" title="${escapeHtml(t.monstersTagAdd || 'Add')}">+</button>
      </div>
    </div>`;
  }

  function buildMonsterDetailTagsHtml(u, t) {
    const tags = u.customTags || [];
    const chips = tags.length
      ? tags
          .map(
            (tag) =>
              `<span class="monsters-detail__tag"><span class="monsters-detail__tag-label">${escapeHtml(tag)}</span><button type="button" class="monsters-detail__tag-remove" data-remove-custom-tag="${escapeHtml(tag)}" data-unit-id="${escapeHtml(String(u.unitId))}" title="${escapeHtml(t.monstersTagRemove || 'Remove tag')}">×</button></span>`,
          )
          .join('')
      : `<span class="monsters-detail__muted">${escapeHtml(t.monstersNoCustomTags || 'No custom tags.')}</span>`;
    return `<div class="monsters-detail__custom-tags">
      <p class="monsters-detail__custom-tags-label">${escapeHtml(t.monstersCustomTags || 'Custom tags')}</p>
      <div class="monsters-detail__tag-list">${chips}</div>
      <div class="monsters-detail__tag-add">
        <input type="text" class="monsters-detail__tag-input" id="monsters-detail-tag-input" maxlength="${MAX_TAG_LEN}" placeholder="${escapeHtml(t.monstersTagPlaceholder || 'New tag…')}" autocomplete="off" />
        <button type="button" class="btn-secondary btn-sm" data-add-custom-tag="1" data-unit-id="${escapeHtml(String(u.unitId))}">${escapeHtml(t.monstersTagAdd || 'Add')}</button>
      </div>
    </div>`;
  }

  function syncMonstersBulkBar(t) {
    const bar = document.getElementById('monsters-bulk-bar');
    const countEl = document.getElementById('monsters-bulk-count');
    const n = monstersBulkSelected.size;
    const tpl = t.monstersBulkCountTpl || '{n} selected';
    if (countEl) countEl.textContent = n ? tpl.replace(/\{n\}/g, String(n)) : '';
    if (!bar) return;
    bar.hidden = !n;
    if (!n) return;
    const ids = [...monstersBulkSelected];
    const syncMarkBtn = (id, key, isOn) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      const on = isOn(ids);
      btn.classList.toggle('monsters-bulk-mark-btn--on', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    };
    syncMarkBtn('monsters-bulk-favorite', 'favorite', (list) => list.length > 0 && list.every((uid) => unitMetaFor(uid).favorite));
    syncMarkBtn('monsters-bulk-food', 'food', (list) => list.length > 0 && list.every((uid) => unitMetaFor(uid).food));
    syncMarkBtn('monsters-bulk-storage', 'storageMark', (list) => {
      const eligible = list.filter((uid) => {
        const u = monstersEnrichedCache.find((x) => String(x.unitId) === String(uid));
        return !u || !u.inStorage;
      });
      return eligible.length > 0 && eligible.every((uid) => unitMetaFor(uid).storageMark);
    });
    const storageBtn = document.getElementById('monsters-bulk-storage');
    if (storageBtn) {
      const allSwex = ids.length > 0 && ids.every((uid) => {
        const u = monstersEnrichedCache.find((x) => String(x.unitId) === String(uid));
        return u && u.inStorage;
      });
      storageBtn.disabled = allSwex;
    }
  }

  function openMonsterRunesInTable(u) {
    if (typeof setRuneTableMonsterMasterId === 'function') {
      setRuneTableMonsterMasterId(u.masterId);
    }
    if (typeof showMainTab === 'function') {
      showMainTab('runes', { runesSubtab: 'runetable', writeHash: true });
    }
    if (typeof applyFiltersAndSort === 'function') {
      applyFiltersAndSort(getVisibleRunes(), { preserveTableExpansion: true });
    }
  }

  function buildRuneSetIconsHtml(u, db, t) {
    const emptySlot = t.monstersRuneEmpty || '—';
    const slotLbl = t.monstersRuneSlot || 'Slot';
    const inner = (u.runeSlots || [])
      .map((slot) => {
        const r = slot.rune;
        const filled = !!(r || slot.runeId);
        const setName = r && r.setName ? r.setName : '';
        const tip = filled
          ? `${slotLbl} ${slot.slot}: ${setName}`
          : `${slotLbl} ${slot.slot}: ${emptySlot}`;
        const runeIconUrl = filled && db && setName ? db.runeSetImageUrl(setName) : '';
        if (runeIconUrl) {
          return `<span class="monsters-rune-icon" data-slot="${slot.slot}" title="${escapeHtml(tip)}">
            <img class="monsters-rune-icon__img" src="${escapeHtml(runeIconUrl)}" alt="${escapeHtml(setName)}" width="20" height="20" loading="lazy" decoding="async" referrerpolicy="no-referrer" />
            <span class="monsters-rune-icon__n">${slot.slot}</span>
          </span>`;
        }
        return `<span class="monsters-rune-icon monsters-rune-icon--empty" data-slot="${slot.slot}" title="${escapeHtml(tip)}">
          <span class="monsters-rune-icon__n">${slot.slot}</span>
        </span>`;
      })
      .join('');
    return `<div class="monsters-rune-icons" aria-label="${escapeHtml(t.monstersRunesLabel || 'Rune sets')}">${inner}</div>`;
  }

  function buildRuneBlockHtml(u, db, t, view) {
    if (view === 'list') return '';
    return '';
  }

  function buildListRowInfoHtml(u, t) {
    const filled = (u.runeSlots || []).filter((s) => s.rune || s.runeId).length;
    const runeTpl = t.monstersListRunesTpl || '{n}/6 runes';
    const runeTip = t.monstersRunesLabel || 'Runes';
    const runeHtml = `<span class="monsters-list-info__runes" title="${escapeHtml(runeTip)}">${escapeHtml(runeTpl.replace(/\{n\}/g, String(filled)))}</span>`;
    const bonuses = computeActiveSetBonuses(u);
    const setHtml = bonuses.length
      ? `<span class="monsters-list-info__sets">${bonuses
          .slice(0, 3)
          .map((b) => `<span class="monsters-list-info__set">${escapeHtml(b.pieces)} ${escapeHtml(b.name)}</span>`)
          .join('')}</span>`
      : '';
    const skillHtml =
      u.skillUpsNeeded > 0
        ? `<span class="monsters-list-info__skills" title="${escapeHtml((t.monstersSkillDeficitTip || '{n} to max').replace(/\{n\}/g, String(u.skillUpsNeeded)))}">${devilmonIconHtml('monsters-list-info__skill-icon')}<span class="monsters-list-info__skill-n">${escapeHtml(String(u.skillUpsNeeded))}</span></span>`
        : '';
    const locHtml = u.inStorage ? buildLocationIconHtml(u, t) : '';
    return `<div class="monsters-list-info">${runeHtml}${setHtml}${skillHtml}${locHtml}</div>`;
  }

  function buildRuneSlotHtml(u, db, t, opts) {
    const large = opts && opts.large;
    const clickable = opts && opts.clickable;
    const hideNum = opts && opts.hideSlotNum;
    const gridOrder = opts && opts.gridOrder;
    const starLayout = opts && opts.starLayout;
    const emptySlot = t.monstersRuneEmpty || '—';
    const clsBase = large ? 'monsters-detail-rune' : 'monsters-rune-slot';
    const slotList = gridOrder
      ? gridOrder
          .map((n) => (u.runeSlots || []).find((s) => Number(s.slot) === Number(n)))
          .filter(Boolean)
      : u.runeSlots || [];
    const inner = slotList
      .map((slot) => {
        const r = slot.rune;
        const filled = !!(r || slot.runeId);
        const setName = r && r.setName ? r.setName : '';
        const cls = filled ? '' : ` ${clsBase}--empty`;
        const starCls = starLayout ? ' monsters-rune-star' : '';
        const angle = starLayout ? STAR_SLOT_ANGLES[slot.slot] : null;
        const starStyle = angle != null ? ` style="--star-angle: ${angle}deg"` : '';
        const runeIconUrl = filled && db && setName ? db.runeSetImageUrl(setName) : '';
        const iconHtml = runeIconUrl
          ? `<img class="${clsBase}__icon" src="${escapeHtml(runeIconUrl)}" alt="${escapeHtml(setName)}" width="${large ? 32 : 22}" height="${large ? 32 : 22}" loading="lazy" decoding="async" referrerpolicy="no-referrer" />`
          : '';
        const mainTxt =
          filled && r && r.mainName
            ? String(r.mainName)
            : '';
        const tip = [setName, mainTxt].filter(Boolean).join(' · ') || emptySlot;
        const clickAttr = clickable
          ? ` role="button" tabindex="0" title="${escapeHtml(tip)}"`
          : ` title="${escapeHtml(tip)}"`;
        const labelHtml = runeIconUrl
          ? `<span class="${clsBase}__set ${clsBase}__set--sr">${escapeHtml(setName)}</span>`
          : `<span class="${clsBase}__set">${escapeHtml(setName || emptySlot)}</span>`;
        const mainHtml =
          large && mainTxt
            ? `<span class="${clsBase}__main">${escapeHtml(mainTxt)}</span>`
            : '';
        const numHtml = hideNum
          ? ''
          : `<span class="${clsBase}__num">${slot.slot}</span>`;
        return `<div class="${clsBase}${cls}${starCls}" data-slot="${slot.slot}"${starStyle}${clickAttr}>
          ${numHtml}
          ${iconHtml}
          ${labelHtml}
          ${mainHtml}
        </div>`;
      })
      .join('');
    if (starLayout) {
      const lbl = escapeHtml(t.monstersDetailRunes || 'Runes');
      return `<div class="monsters-runes monsters-runes--hex-star monsters-runes--game" role="group" aria-label="${lbl}">${inner}${'<'+'/div>'}`;
    }
    return inner;
  }
