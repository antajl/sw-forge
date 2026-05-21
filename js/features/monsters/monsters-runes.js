// js/features/monsters/monsters-runes.js — rune display helpers
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

  function swarfarmSkillIconUrl(skillId) {
    const db = window.SWRM_SKILL_DB;
    if (db && typeof db.skillIconUrl === 'function') {
      const url = db.skillIconUrl(skillId);
      if (url) return url;
    }
    return '';
  }

  function hydrateMonsterSkillIcons(container) {
    const db = window.SWRM_SKILL_DB;
    if (!db || typeof db.ensureSkillIcon !== 'function' || !container) return;
    container.querySelectorAll('.monsters-detail__skill-img[data-skill-id]').forEach((img) => {
      const id = Number(img.getAttribute('data-skill-id'));
      if (!Number.isFinite(id)) return;
      db.ensureSkillIcon(id).then((url) => {
        if (url && img.isConnected) {
          img.src = url;
          img.hidden = false;
        }
      });
    });
  }

  function formatStatRuneDelta(total, baseVal, asPct) {
    if (!Number.isFinite(total)) return { total: '—', rune: '—' };
    const totStr = asPct ? `${Math.round(total)}%` : String(Math.round(total));
    if (!Number.isFinite(baseVal)) return { total: totStr, rune: '—' };
    const delta = Math.round(total - baseVal);
    const runeStr = delta > 0 ? (asPct ? `+${delta}%` : `+${delta}`) : asPct ? '0%' : '0';
    return { total: totStr, rune: runeStr };
  }

  function buildMonsterDetailStatsBlock(u, t) {
    const s = u.stats;
    if (!s) {
      return `<p class="monsters-detail__muted">${escapeHtml(t.monstersNoStats || 'No stat data in SWEX.')}</p>`;
    }
    const base = u.baseStats || null;
    const breakdown =
      base && typeof calculateMonsterStatBreakdown === 'function'
        ? calculateMonsterStatBreakdown(base, u)
        : null;
    const coreKeys = [
      [t.monstersStatHp || 'HP', 'hp'],
      [t.monstersStatAtk || 'ATK', 'atk'],
      [t.monstersStatDef || 'DEF', 'def'],
      [t.monstersStatSpd || 'SPD', 'spd'],
    ];
    const pctKeys = [
      [t.monstersStatCr || 'CRI Rate', 'critRate'],
      [t.monstersStatCd || 'CRI Dmg', 'critDmg'],
      [t.monstersStatRes || 'RES', 'res'],
      [t.monstersStatAcc || 'ACC', 'acc'],
    ];
    function fmtVal(key, field, isPct) {
      const row = breakdown && breakdown[key];
      if (row) {
        const n = row[field];
        if (!Number.isFinite(n)) return '—';
        if (typeof displayStatValue === 'function') {
          return displayStatValue(key, n, isPct);
        }
        return isPct ? `${Math.round(n)}%` : String(Math.round(n));
      }
      if (field === 'total' && s) {
        const n = Number(s[key]);
        if (Number.isFinite(n)) {
          if (typeof displayStatValue === 'function') return displayStatValue(key, n, isPct);
          return isPct ? `${Math.round(n)}%` : String(Math.round(n));
        }
      }
      return '—';
    }
    function coreRow(label, key) {
      const row = breakdown && breakdown[key];
      const bonus = row && Number.isFinite(row.bonus) ? row.bonus : 0;
      const bonusStr =
        bonus > 0
          ? row.isPct
            ? `+${bonus}%`
            : `+${bonus}`
          : row?.isPct
            ? '0%'
            : '0';
      return `<div class="monsters-detail__stat-row monsters-detail__stat-row--core monsters-detail__stat-row--clickable" data-stat-key="${key}" role="button" tabindex="0" aria-label="${escapeHtml(label)}">
          <span class="monsters-detail__stat-k">${escapeHtml(label)}</span>
          <span class="monsters-detail__stat-num monsters-detail__stat-num--base" data-col="base">${escapeHtml(fmtVal(key, 'base', false))}</span>
          <span class="monsters-detail__stat-num monsters-detail__stat-num--rune" data-col="bonus">${escapeHtml(bonusStr)}</span>
          <span class="monsters-detail__stat-num monsters-detail__stat-num--total-green" data-col="total" hidden>${escapeHtml(fmtVal(key, 'total', false))}</span>
        </div>`;
    }
    function pctRow(label, key) {
      return `<div class="monsters-detail__stat-row monsters-detail__stat-row--pct" data-stat-key="${key}">
          <span class="monsters-detail__stat-k">${escapeHtml(label)}</span>
          <span class="monsters-detail__stat-num monsters-detail__stat-num--pct-total">${escapeHtml(fmtVal(key, 'total', true))}</span>
        </div>`;
    }
    const statRows = coreKeys.map(([label, key]) => coreRow(label, key)).concat(pctKeys.map(([label, key]) => pctRow(label, key))).join('');
    const loading =
      !base && window.SWRM_MONSTER_DB
        ? `<p class="monsters-detail__muted monsters-detail__stats-loading">${escapeHtml(t.monstersStatsLoading || 'Loading base stats…')}</p>`
        : '';
    return (
      '<div class="monsters-detail__stats-grid monsters-detail__stats-grid--split" data-stats-grid data-stats-view="split">' +
      loading +
      statRows +
      '</div>'
    );
  }

  function bindMonsterDetailStatsToggle(root) {
    if (!root) return;
    const grid = root.querySelector('[data-stats-grid]');
    if (!grid || grid.dataset.statsToggleBound === '1') return;
    grid.dataset.statsToggleBound = '1';
    const setView = (mode) => {
      const split = mode !== 'total';
      grid.dataset.statsView = split ? 'split' : 'total';
      grid.classList.toggle('monsters-detail__stats-grid--total-view', !split);
      grid.querySelectorAll('[data-col="total"]').forEach((el) => {
        if (split) el.setAttribute('hidden', '');
        else el.removeAttribute('hidden');
      });
      grid.querySelectorAll('[data-col="base"], [data-col="bonus"]').forEach((el) => {
        if (split) el.removeAttribute('hidden');
        else el.setAttribute('hidden', '');
      });
    };
    const toggle = () => {
      const next = grid.dataset.statsView === 'total' ? 'split' : 'total';
      setView(next);
    };
    grid.querySelectorAll('.monsters-detail__stat-row--core').forEach((row) => {
      row.addEventListener('click', toggle);
      row.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggle();
        }
      });
    });
    setView('split');
  }

  function buildMonsterStatsHtml(u, t) {
    return buildMonsterDetailStatsBlock(u, t);
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
    if (typeof isShareReadOnly === 'function' && isShareReadOnly()) return '';
    const uid = escapeHtml(String(u.unitId));
    const storageOn = isStorageMarked(u);
    const storageTitle = u.inStorage
      ? t.monstersStorageSwex || t.monstersLocationStorage || 'Storage (SWEX)'
      : t.monstersStorageMark || 'Storage tag';
    const storageDisabled = u.inStorage ? ' disabled' : '';
    return `<button type="button" class="monsters-mark-btn${u.favorite ? ' monsters-mark-btn--on monsters-mark-btn--favorite' : ''}" data-unit-tag="favorite" data-unit-id="${uid}" aria-pressed="${u.favorite}" title="${escapeHtml(t.monstersFavorite || 'Favorite')}">★</button>
        <button type="button" class="monsters-mark-btn${u.food ? ' monsters-mark-btn--on monsters-mark-btn--food' : ''}" data-unit-tag="food" data-unit-id="${uid}" aria-pressed="${u.food}" title="${escapeHtml(t.monstersFood || 'Food')}">🍖</button>
        <button type="button" class="monsters-mark-btn${storageOn ? ' monsters-mark-btn--on monsters-mark-btn--storage' : ''}${u.inStorage ? ' monsters-mark-btn--swex' : ''}" data-unit-tag="storageMark" data-unit-id="${uid}" aria-pressed="${storageOn}" title="${escapeHtml(storageTitle)}"${storageDisabled}>▣</button>`;
  }

  function buildListRowMetaHtml(u, t) {
    if (typeof isShareReadOnly === 'function' && isShareReadOnly()) return '';
    const uid = escapeHtml(String(u.unitId));
    const storageOn = isStorageMarked(u);
    const storageTitle = u.inStorage
      ? t.monstersStorageSwex || t.monstersLocationStorage || 'Storage (SWEX)'
      : t.monstersStorageMark || 'Storage tag';
    const storageDisabled = u.inStorage ? ' disabled' : '';
    return `<div class="monsters-card__list-meta">
      <div class="monsters-card__actions monsters-card__actions--list">
        <button type="button" class="monsters-tag-btn monsters-tag-btn--sm${u.favorite ? ' monsters-tag-btn--on' : ''}" data-unit-tag="favorite" data-unit-id="${uid}" aria-pressed="${u.favorite}" title="${escapeHtml(t.monstersFavorite || 'Favorite')}">★</button>
        <button type="button" class="monsters-tag-btn monsters-tag-btn--sm${u.food ? ' monsters-tag-btn--on' : ''}" data-unit-tag="food" data-unit-id="${uid}" aria-pressed="${u.food}" title="${escapeHtml(t.monstersFood || 'Food')}">🍖</button>
        <button type="button" class="monsters-tag-btn monsters-tag-btn--sm${storageOn ? ' monsters-tag-btn--on' : ''}${u.inStorage ? ' monsters-tag-btn--swex' : ''}" data-unit-tag="storageMark" data-unit-id="${uid}" aria-pressed="${storageOn}" title="${escapeHtml(storageTitle)}"${storageDisabled}>▣</button>
      </div>
    </div>`;
  }

  function buildMonsterDetailTagsHtml(u, t) {
    if (typeof isShareReadOnly === 'function' && isShareReadOnly()) {
      const tags = u.customTags || [];
      if (!tags.length) return '';
      const chips = tags
        .map(
          (tag) =>
            `<span class="monsters-detail__tag"><span class="monsters-detail__tag-label">${escapeHtml(tag)}</span></span>`,
        )
        .join('');
      return `<div class="monsters-detail__custom-tags">
      <p class="monsters-detail__custom-tags-label">${escapeHtml(t.monstersCustomTags || 'Custom tags')}</p>
      <div class="monsters-detail__tag-list">${chips}</div>
    </div>`;
    }
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
    const ro = typeof isShareReadOnly === 'function' && isShareReadOnly();
    bar.hidden = ro || !n;
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

  function buildSkillTileHtml(s, skillDb) {
    const url = swarfarmSkillIconUrl(s.skillId);
    const label = skillDb && s.upgradeable !== false ? skillDb.formatSkillLevelDetail(s) : '';
    const img = url
      ? '<img class="monsters-detail__skill-img" src="' +
        escapeHtml(url) +
        '" alt="" width="40" height="40" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.hidden=true" />'
      : '<img class="monsters-detail__skill-img" hidden data-skill-id="' +
        escapeHtml(String(s.skillId)) +
        '" alt="" width="40" height="40" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.hidden=true" />';
    const overlay = label
      ? '<span class="monsters-detail__skill-lv-overlay">' + escapeHtml(label) + '</span>'
      : '';
    return (
      '<div class="monsters-detail__skill-tile monsters-detail__skill-tile--tip" data-skill-id="' +
      escapeHtml(String(s.skillId)) +
      '" data-skill-level="' +
      escapeHtml(String(s.level)) +
      '">' +
      img +
      overlay +
      '</div>'
    );
  }

  function resolveLeaderSkillTile(leaderSkill) {
    if (!leaderSkill) return null;
    const db = window.SWRM_MONSTER_DB;
    if (db && typeof db.leaderSkillIconUrl === 'function') {
      const url = db.leaderSkillIconUrl(leaderSkill);
      if (url) return { url };
    }
    const sk = leaderSkill.skill;
    if (sk && sk.icon_filename && db && typeof db.swarfarmAssetUrl === 'function') {
      return {
        url: db.swarfarmAssetUrl(`static/herders/images/skills/${sk.icon_filename}`),
      };
    }
    return null;
  }

  function formatLeaderSkillTooltip(leaderSkill, t) {
    if (!leaderSkill) return '';
    const sk = leaderSkill.skill;
    if (sk && typeof sk === 'object') {
      const desc = String(sk.description || sk.description_en || '').trim();
      if (desc) return desc;
      const name = String(sk.name || sk.name_en || '').trim();
      if (name) return name;
    }
    const attr = String(leaderSkill.attribute || '').trim();
    const amt = leaderSkill.amount;
    const area = String(leaderSkill.area || '').trim();
    const element = leaderSkill.element ? String(leaderSkill.element).trim() : '';
    let condition = '';
    if (area === 'Dungeon') condition = 'in the Dungeons ';
    else if (area === 'Arena') condition = 'in the Arena ';
    else if (area === 'Guild') condition = 'in Guild Content ';
    else if (area === 'Element' && element) condition = `with ${element} attribute `;
    if (attr && amt != null) {
      return `Increase the ${attr} of ally monsters ${condition}by ${amt}%`;
    }
    const lb = formatLeaderSkillTitleBody(leaderSkill, t);
    return [lb.title, lb.body].filter(Boolean).join(' — ');
  }

  function bindMonsterDetailLeaderTips(root, leaderSkill, t) {
    if (!root || !leaderSkill || typeof setSwrmFloatTipTarget !== 'function') return;
    const tile = root.querySelector('.monsters-detail__skill-tile--leader');
    if (!tile) return;
    const tip = formatLeaderSkillTooltip(leaderSkill, t);
    setSwrmFloatTipTarget(tile, tip);
    tile.setAttribute('aria-label', tip);
  }

  function bindMonsterDetailSkillTips(root, skillRows) {
    if (!root || typeof setSwrmFloatTipTarget !== 'function') return;
    const rows = skillRows || [];
    const tiles = root.querySelectorAll(
      '.monsters-detail__skills-main .monsters-detail__skill-tile--tip',
    );
    tiles.forEach((tile, i) => {
      const row = rows[i];
      const skillId = row?.skillId ?? Number(tile.getAttribute('data-skill-id'));
      const level = row?.level ?? Number(tile.getAttribute('data-skill-level'));
      if (!skillId) return;
      tile.style.cursor = 'help';
      const applyTip = async () => {
        const db = window.SWRM_SKILL_DB;
        if (!db || typeof db.fetchSkillMeta !== 'function') return;
        let text =
          typeof db.formatSkillTooltip === 'function'
            ? db.formatSkillTooltip(skillId, level)
            : '';
        const placeholder = text && /^Skill \d+/.test(text);
        if (!text || placeholder) {
          await db.fetchSkillMeta(skillId);
          text =
            typeof db.formatSkillTooltip === 'function'
              ? db.formatSkillTooltip(skillId, level)
              : '';
        }
        if (text) {
          setSwrmFloatTipTarget(tile, text);
          tile.setAttribute('aria-label', text);
        }
      };
      tile.addEventListener('mouseenter', applyTip);
      tile.addEventListener('focus', applyTip);
    });
  }

  function formatLeaderSkillTitleBody(leaderSkill, t) {
    if (!leaderSkill) return { title: '', body: '' };
    const sk = leaderSkill.skill;
    if (sk && typeof sk === 'object') {
      const name = String(sk.name || sk.name_en || '').trim();
      const desc = String(sk.description || sk.description_en || '').trim();
      return {
        title: name || (t.monstersLeaderSkill || 'Leader skill'),
        body: desc,
      };
    }
    const attr = String(leaderSkill.attribute || '').trim();
    const amt = leaderSkill.amount != null ? String(leaderSkill.amount).trim() : '';
    const area = String(leaderSkill.area || '').trim();
    const element = String(leaderSkill.element || '').trim();
    const bits = [];
    if (amt && attr) bits.push(`${amt}% ${attr}`);
    else if (attr) bits.push(attr);
    if (area) bits.push(area);
    if (element) bits.push(element);
    const title =
      amt && attr
        ? `${amt}% ${attr}`
        : attr || (t.monstersLeaderSkill || 'Leader skill');
    const body = bits.length > 1 ? bits.slice(1).join(' · ') : area && attr ? area : '';
    return { title, body: body || bits.join(' · ') };
  }

  function buildMonsterDetailSkillsBlock(skillRows, t, skillDb, leaderSkill) {
    const rows = skillRows || [];
    const hasLeader = !!(leaderSkill && (leaderSkill.attribute || leaderSkill.skill || leaderSkill.id));
    if (!rows.length && !hasLeader) {
      return '<p class="monsters-detail__muted">' + escapeHtml(t.monstersNoSkills || 'No skill data.') + '</p>';
    }
    const activeTiles = rows.map((s) => buildSkillTileHtml(s, skillDb)).join('');
    const mainHtml =
      '<div class="monsters-detail__skills-main"><div class="monsters-detail__skills-row">' +
      (activeTiles || '<span class="monsters-detail__muted">—</span>') +
      '</div></div>';
    if (!hasLeader) {
      return '<div class="monsters-detail__skills-layout">' + mainHtml + '</div>';
    }
    const leader = resolveLeaderSkillTile(leaderSkill);
    const leaderTip = escapeHtml(formatLeaderSkillTooltip(leaderSkill, t));
    const leaderImg = leader && leader.url
      ? '<img class="monsters-detail__skill-img" src="' +
        escapeHtml(leader.url) +
        '" alt="" width="40" height="40" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.hidden=true" />'
      : '<span class="monsters-detail__skill-img monsters-detail__skill-img--ph" aria-hidden="true"></span>';
    const leaderHtml =
      '<div class="monsters-detail__skills-leader">' +
      '<div class="monsters-detail__skill-tile monsters-detail__skill-tile--leader" title="' +
      leaderTip +
      '">' +
      leaderImg +
      '</div></div>';
    return '<div class="monsters-detail__skills-layout">' + mainHtml + leaderHtml + '</div>';
  }

  function buildMonsterDetailRunesStrip(u, db, t) {
    const empty = t.monstersRuneEmpty || '—';
    const cells = [];
    for (let n = 1; n <= 6; n++) {
      const slot = (u.runeSlots || []).find((s) => Number(s.slot) === n) || { slot: n, rune: null };
      const r = slot.rune;
      const filled = !!(r || slot.runeId);
      const setName = r && r.setName ? r.setName : '';
      const main = r && r.mainName ? String(r.mainName) : '';
      const lvl = r && r.level != null ? '+' + r.level : '';
      const url = filled && db && setName ? db.runeSetImageUrl(setName) : '';
      const img = url
        ? '<img class="monsters-detail__rune-strip__icon" src="' +
          escapeHtml(url) +
          '" alt="" width="28" height="28" loading="lazy" referrerpolicy="no-referrer" />'
        : '';
      cells.push(
        '<div class="monsters-detail__rune-strip__cell' +
          (filled ? '' : ' monsters-detail__rune-strip__cell--empty') +
          '" data-slot="' +
          slot.slot +
          '">' +
          '<span class="monsters-detail__rune-strip__slot">' +
          slot.slot +
          '</span>' +
          img +
          '<span class="monsters-detail__rune-strip__lvl">' +
          escapeHtml(lvl || empty) +
          '</span>' +
          '<span class="monsters-detail__rune-strip__main">' +
          escapeHtml(main || empty) +
          '</span></div>',
      );
    }
    return '<div class="monsters-detail__runes-strip">' + cells.join('') + '</div>';
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
