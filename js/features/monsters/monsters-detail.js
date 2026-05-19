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
    const skillsBlock = buildMonsterDetailSkillsBlock(skillRows, t, skillDb);
    const statsBlock = buildMonsterStatsHtml(u, t);
    const runesBlock =
      buildRuneSetBonusSummaryHtml(u, t, db) + buildMonsterDetailRunesStrip(u, db, t);
    const natStars =
      meta && meta.natural_stars != null
        ? meta.natural_stars
        : u.stars != null
          ? u.stars
          : '';
    const subBits = [
      u.metaElement ? escapeHtml(u.metaElement) : '',
      u.metaArchetype ? escapeHtml(u.metaArchetype) : '',
    ].filter(Boolean);
    const rankStars = typeof buildMonsterStarsBadge === 'function' ? buildMonsterStarsBadge(u) : '';
    const starsDetailCls = rankStars.includes('monsters-card__stars--awakened')
      ? ' monsters-detail__stars--awakened'
      : '';
    const starsOnPortrait = rankStars
      ? rankStars.replace('monsters-card__stars', `monsters-detail__stars${starsDetailCls}`)
      : '';
    const natLine =
      natStars !== ''
        ? `<span class="monsters-detail__nat-pill">${escapeHtml(natLbl)} <strong>${escapeHtml(String(natStars))}</strong></span>`
        : '';

    body.innerHTML = `
      <header class="monsters-detail__head">
        <div class="monsters-detail__portrait-wrap monsters-detail__portrait-wrap--${elCls}">
          <img class="monsters-detail__portrait" alt="" width="96" height="96" data-img-file="${escapeHtml(u.imageFilename || '')}" loading="lazy" decoding="async" />
          ${starsOnPortrait}
        </div>
        <div class="monsters-detail__head-text">
          <h3 class="monsters-detail__title" id="monsters-detail-title">${bestiaryHref ? `<a href="${escapeHtml(bestiaryHref)}" target="_blank" rel="noopener noreferrer">${escapeHtml(u.displayName)}</a>` : escapeHtml(u.displayName)}</h3>
          <p class="monsters-detail__meta-line">${[natLine, subBits.join(' · '), `${escapeHtml(lvlLbl)} <strong>${u.level}</strong>`].filter(Boolean).join(' · ')}${u.inStorage ? ` · <span class="monsters-detail__storage">${escapeHtml(storageLbl)}</span>` : ''}</p>
          <button type="button" class="btn-secondary btn-sm monsters-detail__open-runes" data-open-runes-all="1">${escapeHtml(t.monstersOpenRunes || 'Open runes in table')}</button>
        </div>
      </header>
      <div class="monsters-detail__scroll">
        ${statsBlock}
        <section class="monsters-detail__section">
          <h4 class="monsters-detail__section-title">${escapeHtml(t.monstersDetailTabSkills || 'Skills')}</h4>
          ${skillsBlock}
        </section>
        <section class="monsters-detail__section">
          <h4 class="monsters-detail__section-title">${escapeHtml(t.monstersDetailRunes || 'Runes')}</h4>
          ${runesBlock}
        </section>
      </div>`;

    body.hidden = false;

    const img = body.querySelector('.monsters-detail__portrait[data-img-file]');
    if (img && u.imageFilename) bindMonsterPortrait(img, u.imageFilename);
    if (typeof hydrateMonsterSkillIcons === 'function') hydrateMonsterSkillIcons(body);

    body.querySelector('[data-open-runes-all]')?.addEventListener('click', () => openMonsterRunesInTable(u));

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
      const selected =
        monstersSelectedUnitId != null && String(monstersSelectedUnitId) === String(uid);
      card.classList.toggle('monsters-card--bulk-on', on);
      card.classList.toggle('monsters-card--selected', selected);
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
