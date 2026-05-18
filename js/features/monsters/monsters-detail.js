// js/features/monsters/monsters-detail.js — detail panel rendering
  function renderMonstersDetail(u, t, anchorEl) {
    const aside = document.getElementById('monsters-detail');
    const body = document.getElementById('monsters-detail-body');
    if (!aside || !body) return;
    bindMonstersDetailFloat();

    if (!u) {
      hideMonstersDetailFloat();
      body.hidden = true;
      body.innerHTML = '';
      return;
    }

    const db = window.SWRM_MONSTER_DB;
    const meta = u.meta;
    const elCls = elementClass(u.metaElement);
    const natLbl = t.monstersNatShort || 'nat';
    const lvlLbl = t.monstersLevelShort || 'Lv';
    const storageLbl = t.monstersStorageBadge || 'Storage';
    const bestiaryHref = db && u.bestiarySlug ? db.bestiaryUrl(u.bestiarySlug) : '';
    const skillDb = window.SWRM_SKILL_DB;
    const skillRows = Array.isArray(u.skillRows)
      ? u.skillRows
      : skillDb
        ? skillDb.enrichUnitSkills(u.skills).skills
        : [];
    const rawSkillCount = Array.isArray(u.skills) ? u.skills.length : 0;
    const skillSlotLbl = t.monstersSkillSlot || 'Skill';
    const skillsHtml = skillRows.length
      ? `<ul class="monsters-detail__skills">${skillRows
          .map((s) => {
            const label = skillDb ? skillDb.formatSkillLevel(s, t) : String(s.level);
            const maxCls = s.isMaxed ? ' monsters-detail__skill-lv--maxed' : '';
            const unknownCls = !s.hasMax ? ' monsters-detail__skill-lv--unknown' : '';
            return `<li class="monsters-detail__skill${s.isMaxed ? ' monsters-detail__skill--maxed' : ''}">
              <span class="monsters-detail__skill-slot">${escapeHtml(skillSlotLbl)} ${s.slot}</span>
              <span class="monsters-detail__skill-lv${maxCls}${unknownCls}" title="${escapeHtml(t.monstersSkillLevel || 'Level')}">${escapeHtml(label)}</span>
            </li>`;
          })
          .join('')}</ul>`
      : rawSkillCount > 0
        ? `<p class="monsters-detail__muted">${escapeHtml(t.monstersNoUpgradeableSkills || 'No upgradeable skills (passive only).')}</p>`
        : `<p class="monsters-detail__muted">${escapeHtml(t.monstersNoSkills || 'No skill data in SWEX.')}</p>`;

    const subBits = [
      u.metaElement ? escapeHtml(u.metaElement) : '',
      u.metaArchetype ? escapeHtml(u.metaArchetype) : '',
      meta && meta.natural_stars != null ? `${natLbl} ${meta.natural_stars}` : '',
    ].filter(Boolean);
    const tab = monstersDetailTab || 'info';
    const tabInfo = tab === 'info' ? ' is-active' : '';
    const tabSkills = tab === 'skills' ? ' is-active' : '';
    const tabRunes = tab === 'runes' ? ' is-active' : '';
    const roleLine = u.metaArchetype
      ? `<p class="monsters-detail__role">${escapeHtml(u.metaArchetype)}</p>`
      : '';

    body.innerHTML = `
      <header class="monsters-detail__head">
        <div class="monsters-detail__portrait-wrap monsters-detail__portrait-wrap--${elCls}">
          <img class="monsters-detail__portrait" alt="" width="96" height="96" data-img-file="${escapeHtml(u.imageFilename || '')}" loading="lazy" decoding="async" />
        </div>
        <div class="monsters-detail__head-text">
          <h3 class="monsters-detail__title" id="monsters-detail-title">${bestiaryHref ? `<a href="${escapeHtml(bestiaryHref)}" target="_blank" rel="noopener noreferrer">${escapeHtml(u.displayName)}</a>` : escapeHtml(u.displayName)}</h3>
          <p class="monsters-detail__sub">${subBits.join(' · ')}</p>
          <button type="button" class="btn-secondary btn-sm monsters-detail__open-runes" data-open-runes-all="1">${escapeHtml(t.monstersOpenRunes || 'Open runes in table')}</button>
        </div>
      </header>
      <div class="monsters-detail__layout">
      <nav class="monsters-detail__tabs" role="tablist">
        <button type="button" class="monsters-detail__tab${tabInfo}" data-detail-tab="info" role="tab" aria-selected="${tab === 'info'}">${escapeHtml(t.monstersDetailTabInfo || 'Info')}</button>
        <button type="button" class="monsters-detail__tab${tabSkills}" data-detail-tab="skills" role="tab" aria-selected="${tab === 'skills'}">${escapeHtml(t.monstersDetailTabSkills || 'Skill')}</button>
        <button type="button" class="monsters-detail__tab${tabRunes}" data-detail-tab="runes" role="tab" aria-selected="${tab === 'runes'}">${escapeHtml(t.monstersDetailTabRunes || 'Rune')}</button>
      </nav>
      <div class="monsters-detail__tab-panels">
      <div class="monsters-detail__panel" data-detail-panel="info"${tab !== 'info' ? ' hidden' : ''}>
        <p class="monsters-detail__level">${escapeHtml(lvlLbl)} <strong>${u.level}</strong>${u.inStorage ? ` · <span class="monsters-detail__storage">${escapeHtml(storageLbl)}</span>` : ''}</p>
        ${roleLine}
        ${buildMonsterStatsHtml(u, t)}
      </div>
      <div class="monsters-detail__panel" data-detail-panel="skills"${tab !== 'skills' ? ' hidden' : ''}>
        ${skillsHtml}
      </div>
      <div class="monsters-detail__panel" data-detail-panel="runes"${tab !== 'runes' ? ' hidden' : ''}>
        <h4 class="monsters-detail__section-title monsters-detail__section-title--sr">${escapeHtml(t.monstersDetailRunes || 'Runes')}</h4>
        ${buildRuneSetBonusSummaryHtml(u, t, db)}
        ${'<div class="monsters-detail__runes-wrap">'}
          ${buildRuneSlotHtml(u, db, t, { large: true, clickable: true, hideSlotNum: true, gridOrder: DETAIL_RUNE_GRID_ORDER, starLayout: true })}
          <div class="monsters-rune-focus-panel" data-rune-focus hidden></div>
        </div>
      </div>
      </div>
      </div>`;

    body.hidden = false;

    const img = body.querySelector('.monsters-detail__portrait[data-img-file]');
    if (img && u.imageFilename) bindMonsterPortrait(img, u.imageFilename);

    body.querySelector('[data-open-runes-all]')?.addEventListener('click', () => openMonsterRunesInTable(u));
    body.querySelectorAll('[data-open-runes]').forEach((el) => {
      el.addEventListener('click', () => openMonsterRunesInTable(u));
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openMonsterRunesInTable(u);
        }
      });
    });
    const runeWrap = body.querySelector('.monsters-detail__runes-wrap');
    bindMonsterRuneFocusPanel(runeWrap, u, t);

    body.querySelectorAll('[data-detail-tab]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const next = btn.getAttribute('data-detail-tab');
        if (!next || next === monstersDetailTab) return;
        monstersDetailTab = next;
        renderMonstersDetail(u, t, anchorEl);
      });
    });

    if (anchorEl) positionMonstersDetailFloat(anchorEl);
  }

  function handleMonstersUnitTagClick(btn) {
    const tag = btn.getAttribute('data-unit-tag');
    const uid = btn.getAttribute('data-unit-id');
    if (!tag || !uid) return;
    if (tag === 'favorite' || tag === 'food' || tag === 'storageMark') {
      if (tag === 'storageMark') {
        const u = monstersEnrichedCache.find((x) => String(x.unitId) === String(uid));
        if (u && u.inStorage) return;
      }
      toggleUnitMetaFlag(uid, tag);
      renderMonstersPanel();
    }
  }

  function syncBulkCardStates(grid) {
    if (!grid) return;
    grid.querySelectorAll('.monsters-card').forEach((card) => {
      const uid = card.getAttribute('data-unit-id');
      const on = monstersBulkSelected.has(String(uid));
      card.classList.toggle('monsters-card--bulk-on', on);
    });
  }

  function bindMonstersGridDelegation() {
    const grid = document.getElementById('monsters-grid');
    if (!grid || grid.dataset.monstersDelegation === '1') return;
    grid.dataset.monstersDelegation = '1';

    grid.addEventListener('click', (e) => {
      const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

      const addBtn = e.target.closest('[data-add-custom-tag]');
      if (addBtn && grid.contains(addBtn)) {
        e.preventDefault();
        e.stopPropagation();
        const uid = addBtn.getAttribute('data-unit-id');
        const row = addBtn.closest('.monsters-card');
        const input = row?.querySelector(`[data-tag-input][data-unit-id="${uid}"]`);
        const val = input ? input.value : '';
        if (uid && normalizeCustomTag(val)) {
          addUnitCustomTag(uid, val);
          if (input) input.value = '';
          renderMonstersPanel();
        }
        return;
      }

      const rmBtn = e.target.closest('[data-remove-custom-tag]');
      if (rmBtn && grid.contains(rmBtn)) {
        e.preventDefault();
        e.stopPropagation();
        const uid = rmBtn.getAttribute('data-unit-id');
        const tag = rmBtn.getAttribute('data-remove-custom-tag');
        if (uid && tag) {
          removeUnitCustomTag(uid, tag);
          renderMonstersPanel();
        }
        return;
      }

      const tagBtn = e.target.closest('[data-unit-tag]');
      if (tagBtn && grid.contains(tagBtn)) {
        e.preventDefault();
        e.stopPropagation();
        handleMonstersUnitTagClick(tagBtn);
        return;
      }

      const card = e.target.closest('.monsters-card');
      if (!card || !grid.contains(card)) return;
      const uid = card.getAttribute('data-unit-id');
      if (!uid) return;

      if (e.target.closest('a')) return;
      if (e.target.closest('[data-tag-input]')) return;
      if (e.target.closest('.monsters-tag-btn')) return;

      e.preventDefault();
      if (typeof selectMonsterUnit === 'function') {
        selectMonsterUnit(uid, card);
      }
      const idx = monstersVisibleUnitIds.indexOf(String(uid));
      if (e.shiftKey && monstersBulkLastIndex >= 0 && idx >= 0) {
        const a = Math.min(monstersBulkLastIndex, idx);
        const b = Math.max(monstersBulkLastIndex, idx);
        for (let i = a; i <= b; i++) monstersBulkSelected.add(monstersVisibleUnitIds[i]);
      } else {
        toggleMonstersBulkSelect(uid);
        monstersBulkLastIndex = idx;
      }
      writeMonstersBulkSelected(monstersBulkSelected);
      syncMonstersBulkBar(t);
      syncBulkCardStates(grid);
    });
  }
