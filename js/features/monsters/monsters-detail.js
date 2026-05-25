// js/features/monsters/monsters-detail.js — detail panel rendering
  function renderMonstersDetail(u, t, anchorEl) {
    const aside = document.getElementById('monsters-detail');
    const body = document.getElementById('monsters-detail-body');
    if (!aside || !body) return;
    bindMonstersDetailFloat();
    syncMonstersDetailPinnedLayout();

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
    const bestiaryHref = db && u.bestiarySlug ? db.bestiaryUrl(u.bestiarySlug) : '';
    const skillDb = window.SWRM_SKILL_DB;
    const skillRows = skillDb
      ? skillDb.enrichUnitSkillsForDetail(u.skills)
      : Array.isArray(u.skillRows)
        ? u.skillRows
        : [];
    const lookupRow = db && typeof db.lookupMonster === 'function' ? db.lookupMonster(u.masterId) : null;
    const metaRow = meta || lookupRow;
    const leaderSkill = metaRow && metaRow.leader_skill ? metaRow.leader_skill : null;
    const skillsBlock = buildMonsterDetailSkillsBlock(skillRows, t, skillDb, leaderSkill);
    let statsBlock = buildMonsterStatsHtml(u, t);
    if (db && lookupRow && typeof db.monsterBaseStatsAtLevel === 'function') {
      const initialBase = db.monsterBaseStatsAtLevel(lookupRow, u.level);
      if (
        initialBase &&
        typeof db.hasUsableBaseStats === 'function' &&
        db.hasUsableBaseStats(initialBase)
      ) {
        statsBlock = buildMonsterDetailStatsBlock(
          { ...u, meta: metaRow, baseStats: initialBase },
          t,
        );
      }
    }
    const runesBlock =
      buildRuneSetBonusSummaryHtml(u, t, db) + buildMonsterDetailRunesStrip(u, db, t);
    const loadoutBlock =
      typeof buildMonsterDetailLoadoutHtml === 'function'
        ? buildMonsterDetailLoadoutHtml(u, t, runesBlock)
        : runesBlock;
    const natStars =
      meta && meta.natural_stars != null
        ? meta.natural_stars
        : u.stars != null
          ? u.stars
          : '';
    const subBits = [u.metaArchetype ? escapeHtml(u.metaArchetype) : ''].filter(Boolean);
    const rankStars = typeof buildMonsterStarsBadge === 'function' ? buildMonsterStarsBadge(u) : '';
    const elementBadge =
      typeof buildMonsterElementBadge === 'function' ? buildMonsterElementBadge(u) : '';
    const levelBadge =
      typeof buildMonsterLevelBadge === 'function' ? buildMonsterLevelBadge(u, t) : '';
    const natLine =
      natStars !== ''
        ? `<span class="monsters-detail__nat-pill">${escapeHtml(natLbl)} <strong>${escapeHtml(String(natStars))}</strong></span>`
        : '';
    const pinned = monstersDetailPinnedUnitId != null;
    const closeBtn = pinned
      ? `<button type="button" class="monsters-detail__unpin btn-secondary btn-sm" data-unpin-detail="1" title="${escapeHtml(t.monstersDetailUnpin || 'Close')}">×</button>`
      : '';
    const storageIcon =
      u.inStorage && typeof buildLocationIconHtml === 'function' ? buildLocationIconHtml(u, t) : '';
    const metaParts = [natLine, subBits.join(' · ')].filter(Boolean);

    body.innerHTML = `
      <header class="monsters-detail__head">
        <div class="monsters-detail__portrait-wrap monsters-detail__portrait-wrap--${elCls}">
          ${rankStars}
          <img class="monsters-detail__portrait" alt="" width="96" height="96" data-img-file="${escapeHtml(u.imageFilename || '')}" loading="lazy" decoding="async" />
          ${elementBadge}
          ${levelBadge}
        </div>
        <div class="monsters-detail__head-text">
          <h3 class="monsters-detail__title" id="monsters-detail-title">${bestiaryHref ? `<a href="${escapeHtml(bestiaryHref)}" target="_blank" rel="noopener noreferrer">${escapeHtml(u.displayName)}</a>` : escapeHtml(u.displayName)}</h3>
          <p class="monsters-detail__meta-line">${metaParts.join(' · ')}${storageIcon}</p>
          <button type="button" class="btn-secondary btn-sm monsters-detail__open-runes" data-open-runes-all="1">${escapeHtml(t.monstersOpenRunes || 'Open runes in table')}</button>
        </div>
        ${closeBtn}
      </header>
      <div class="monsters-detail__scroll" data-detail-scroll>
        <div data-detail-stats>${statsBlock}</div>
        <section class="monsters-detail__section" data-detail-skills>
          <h4 class="monsters-detail__section-title">${escapeHtml(t.monstersDetailTabSkills || 'Skills')}</h4>
          ${skillsBlock}
        </section>
        <section class="monsters-detail__section monsters-detail__section--loadout" data-detail-loadout>
          ${loadoutBlock}
        </section>
      </div>`;

    body.hidden = false;
    aside.hidden = false;
    aside.classList.add('monsters-detail--visible');

    const img = body.querySelector('.monsters-detail__portrait[data-img-file]');
    if (img && u.imageFilename) bindMonsterPortrait(img, u.imageFilename);
    if (typeof hydrateMonsterSkillIcons === 'function') hydrateMonsterSkillIcons(body);
    if (typeof bindMonsterDetailLeaderTips === 'function') {
      bindMonsterDetailLeaderTips(body, leaderSkill, t);
    }
    if (typeof bindMonsterDetailSkillTips === 'function') {
      bindMonsterDetailSkillTips(body, skillRows);
    }
    if (typeof bindMonsterDetailLoadoutTabs === 'function') {
      bindMonsterDetailLoadoutTabs(body);
    }
    if (typeof bindMonsterRuneFocusPanel === 'function') {
      bindMonsterRuneFocusPanel(body, u, t);
    }
    if (typeof bindMonsterDetailStatsToggle === 'function') {
      bindMonsterDetailStatsToggle(body);
    }

    body.querySelector('[data-open-runes-all]')?.addEventListener('click', () => openMonsterRunesInTable(u));
    body.querySelector('[data-unpin-detail]')?.addEventListener('click', () => unpinMonsterDetail());

    if (anchorEl) positionMonstersDetailFloat(anchorEl);

    const needsApiFetch =
      db &&
      typeof db.fetchMonsterMetaForDetail === 'function' &&
      (!lookupRow ||
        typeof db.monsterHasBundledDetail !== 'function' ||
        !db.monsterHasBundledDetail(lookupRow));

    if (needsApiFetch) {
      db.fetchMonsterMetaForDetail(u.masterId).then((row) => {
        if (!row || !body.isConnected) return;
        db.mergeMonsterMetaIntoCache(u.masterId, row);
        const cur = monstersEnrichedCache.find((x) => String(x.unitId) === String(u.unitId));
        if (cur) cur.meta = { ...(cur.meta || {}), ...row };

        const base =
          db.monsterBaseStatsAtLevel && typeof db.monsterBaseStatsAtLevel === 'function'
            ? db.monsterBaseStatsAtLevel(row, u.level)
            : null;
        const statsHost = body.querySelector('[data-detail-stats]');
        const baseOk =
          base &&
          db.hasUsableBaseStats &&
          typeof db.hasUsableBaseStats === 'function' &&
          db.hasUsableBaseStats(base);
        if (statsHost && baseOk) {
          statsHost.innerHTML = buildMonsterDetailStatsBlock({ ...u, meta: row, baseStats: base }, t);
          if (typeof bindMonsterDetailStatsToggle === 'function') {
            bindMonsterDetailStatsToggle(body);
          }
        }

        const skillsSec = body.querySelector('[data-detail-skills]');
        if (skillsSec) {
          const block = buildMonsterDetailSkillsBlock(
            skillDb ? skillDb.enrichUnitSkillsForDetail(u.skills) : skillRows,
            t,
            skillDb,
            row.leader_skill || null,
          );
          skillsSec.innerHTML = `<h4 class="monsters-detail__section-title">${escapeHtml(t.monstersDetailTabSkills || 'Skills')}</h4>${block}`;
          if (typeof hydrateMonsterSkillIcons === 'function') hydrateMonsterSkillIcons(body);
          if (typeof bindMonsterDetailLeaderTips === 'function') {
            bindMonsterDetailLeaderTips(body, row.leader_skill || null, t);
          }
          if (typeof bindMonsterDetailSkillTips === 'function') {
            const rows = skillDb ? skillDb.enrichUnitSkillsForDetail(u.skills) : skillRows;
            bindMonsterDetailSkillTips(body, rows);
          }
          if (typeof bindMonsterDetailStatsToggle === 'function') {
            bindMonsterDetailStatsToggle(body);
          }
        }

        syncMonsterRowHighlight(u.unitId);
      });
    }
  }

  function handleMonstersUnitTagClick(btn) {
    if (typeof isShareReadOnly === 'function' && isShareReadOnly()) return;
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
      const bulkBtn = card.querySelector('[data-bulk-toggle]');
      if (bulkBtn) {
        bulkBtn.classList.toggle('monsters-card__bulk-btn--on', on);
        bulkBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
      }
    });
    grid.querySelectorAll('.monsters-table__row').forEach((row) => {
      const uid = row.getAttribute('data-unit-id');
      const on = monstersBulkSelected.has(String(uid));
      row.classList.toggle('monsters-table__row--bulk-on', on);
      const cb = row.querySelector('.monsters-table__bulk-cb:not(.monsters-table__bulk-cb--all)');
      if (cb) cb.checked = on;
    });
    if (typeof syncMonstersSelectAllState === 'function') syncMonstersSelectAllState();
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

      const bulkBtn = e.target.closest('[data-bulk-toggle]');
      if (bulkBtn && grid.contains(bulkBtn)) {
        e.preventDefault();
        e.stopPropagation();
        const uid = bulkBtn.getAttribute('data-unit-id');
        if (!uid) return;
        toggleMonstersBulkSelect(uid);
        monstersBulkLastIndex = monstersVisibleUnitIds.indexOf(String(uid));
        writeMonstersBulkSelected(monstersBulkSelected);
        syncMonstersBulkBar(t);
        syncBulkCardStates(grid);
        return;
      }

      const card = e.target.closest('.monsters-card');
      if (!card || !grid.contains(card)) return;
      const uid = card.getAttribute('data-unit-id');
      if (!uid) return;

      if (e.target.closest('[data-unpin-detail]')) {
        e.preventDefault();
        e.stopPropagation();
        unpinMonsterDetail();
        return;
      }
      if (e.target.closest('a, button, input, .monsters-mark-btn, .monsters-card__bulk-btn')) return;
      if (e.target.closest('[data-tag-input]')) return;
      if (e.target.closest('.monsters-tag-btn')) return;

      e.preventDefault();
      pinMonsterDetail(uid, card);
    });
  }
