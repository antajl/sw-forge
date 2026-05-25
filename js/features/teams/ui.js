// js/features/teams/ui.js — Teams builder UI (Monsters → Teams pane)
  let teamsUiBound = false;
  let teamsEditingTeamId = null;

  function teamUnitRecord(unitId) {
    const id = Number(unitId);
    if (!Number.isFinite(id) || id <= 0) return null;
    return (
      (monstersEnrichedCache || []).find((x) => x.unitId === id) ||
      (allUnits || []).find((x) => x.unitId === id) ||
      null
    );
  }

  function teamUnitLabel(unitId) {
    const u = teamUnitRecord(unitId);
    if (!u) return `#${unitId}`;
    return u.displayName || `#${u.masterId}`;
  }

  function teamUnitImageFile(unitId, masterIdFallback) {
    const u = teamUnitRecord(unitId);
    const db = window.SWRM_MONSTER_DB;
    const masterId = u?.masterId ?? masterIdFallback;
    if (u && u.imageFilename) return u.imageFilename;
    if (db && masterId && typeof db.imageFilename === 'function') {
      return db.imageFilename(masterId) || '';
    }
    return '';
  }

  function enrichTeamsUnitRow(u, db, skillDb) {
    const meta = db ? db.lookupMonster(u.masterId) : null;
    const skillPack = skillDb
      ? skillDb.enrichUnitSkills(u.skills)
      : { skills: [], skillUpsNeeded: 0, skillsMaxed: true, skillsKnown: false };
    const tags =
      typeof unitMetaFor === 'function' ? unitMetaFor(u.unitId) : { favorite: false, food: false, storageMark: false, tags: [] };
    return {
      ...u,
      meta,
      metaElement: meta && meta.element ? meta.element : '',
      displayName: db ? db.monsterDisplayName(u.masterId) : `#${u.masterId}`,
      imageFilename: meta && meta.image_filename ? meta.image_filename : '',
      bestiarySlug: meta && meta.bestiary_slug ? meta.bestiary_slug : '',
      favorite: tags.favorite,
      food: tags.food,
      storageMark: tags.storageMark,
      customTags: tags.tags,
      metaArchetype:
        typeof normalizeArchetype === 'function'
          ? normalizeArchetype(
              (meta && meta.archetype) ||
                (db && typeof db.monsterArchetype === 'function' ? db.monsterArchetype(u.masterId) : ''),
            )
          : '',
      skillRows: skillPack.skills,
      skillUpsNeeded: skillPack.skillUpsNeeded,
      skillsMaxed: skillPack.skillsMaxed,
      skillsKnown: skillPack.skillsKnown,
    };
  }

  async function ensureTeamsUnitCache() {
    if (!allUnits || !allUnits.length) return;
    const db = window.SWRM_MONSTER_DB;
    const skillDb = window.SWRM_SKILL_DB;
    if (db && typeof db.loadMonsterIndex === 'function') {
      try {
        await db.loadMonsterIndex();
        if (typeof db.indexCount === 'function' && db.indexCount() === 0) {
          await db.loadMonsterIndex({ force: true });
        }
      } catch (e) { /* ignore */ }
    }
    if (skillDb && typeof skillDb.loadIndex === 'function') {
      try {
        await skillDb.loadIndex();
      } catch (e) { /* ignore */ }
    }
    if (monstersEnrichedCache.length) return;
    monstersEnrichedCache = allUnits.map((u) => enrichTeamsUnitRow(u, db, skillDb));
  }

  function bindTeamsCardPortraits(root) {
    const host = root || document.getElementById('teams-card-grid');
    if (!host || typeof bindMonsterPortrait !== 'function') return;
    host.querySelectorAll('img.team-card__portrait[data-img-file]').forEach((img) => {
      const file = img.getAttribute('data-img-file');
      if (file) bindMonsterPortrait(img, file);
    });
  }

  function bindTeamsSlotDetailHover(root) {
    const host = root || document.getElementById('teams-card-grid');
    if (!host || typeof showMonsterDetailForCard !== 'function') return;
    host.querySelectorAll('.team-card__slot[data-unit-id]').forEach((slot) => {
      const uid = slot.getAttribute('data-unit-id');
      if (!uid || slot.dataset.teamsDetailHover === '1') return;
      slot.dataset.teamsDetailHover = '1';
      slot.addEventListener('mouseenter', () => {
        if (monstersDetailPinnedUnitId) return;
        const u = teamUnitRecord(uid);
        if (!u && typeof ensureTeamsUnitCache === 'function') {
          void ensureTeamsUnitCache().then(() => showMonsterDetailForCard(uid, slot));
          return;
        }
        showMonsterDetailForCard(uid, slot);
      });
      slot.addEventListener('mouseleave', () => {
        if (typeof scheduleMonstersDetailHide === 'function') scheduleMonstersDetailHide();
      });
      slot.addEventListener('focus', () => {
        if (monstersDetailPinnedUnitId) return;
        const u = teamUnitRecord(uid);
        if (!u && typeof ensureTeamsUnitCache === 'function') {
          void ensureTeamsUnitCache().then(() => showMonsterDetailForCard(uid, slot));
          return;
        }
        showMonsterDetailForCard(uid, slot);
      });
      slot.addEventListener('blur', () => {
        if (typeof scheduleMonstersDetailHide === 'function') scheduleMonstersDetailHide();
      });
    });
  }

  function teamRuneStatus(unitId) {
    const u = teamUnitRecord(unitId);
    if (!u) return 'missing';
    if (u.hasFullRunes) return 'ready';
    if (u.equippedCount > 0) return 'partial';
    return 'unruned';
  }

  function teamLeaderSpdPct(team) {
    const lid = team && team.leaderUnitId != null ? Number(team.leaderUnitId) : null;
    if (!Number.isFinite(lid) || lid <= 0) return 0;
    const u = teamUnitRecord(lid);
    if (!u) return 0;
    const meta =
      u.meta ||
      (window.SWRM_MONSTER_DB && typeof window.SWRM_MONSTER_DB.lookupMonster === 'function'
        ? window.SWRM_MONSTER_DB.lookupMonster(u.masterId)
        : null);
    const ls = meta && meta.leader_skill ? meta.leader_skill : null;
    if (typeof leaderSkillSpdPct === 'function') return leaderSkillSpdPct(ls);
    if (!ls) return 0;
    const attr = String(ls.attribute || '').toLowerCase();
    if (!attr.includes('speed')) return 0;
    const n = Number(ls.amount);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }

  function teamTotemSpdPct() {
    if (typeof getAccountTotemSpdPct === 'function') return getAccountTotemSpdPct();
    if (window.SWRM && typeof window.SWRM.getAccountTotemSpdPct === 'function') {
      return window.SWRM.getAccountTotemSpdPct();
    }
    const json = typeof activeSwexJson !== 'undefined' ? activeSwexJson : null;
    if (typeof totemSpdPctFromSwexJson === 'function') return totemSpdPctFromSwexJson(json);
    if (window.SWRM && typeof window.SWRM.totemSpdPctFromSwexJson === 'function') {
      return window.SWRM.totemSpdPctFromSwexJson(json);
    }
    return 0;
  }

  function teamUnitDisplaySpeed(unitId, team) {
    const u = teamUnitRecord(unitId);
    if (!u) return null;
    const opts = {
      totemSpdPct: teamTotemSpdPct(),
      leaderSpdPct: teamLeaderSpdPct(team),
    };
    const calc =
      (window.SWRM && typeof window.SWRM.computeUnitSpeedForTeam === 'function'
        ? window.SWRM.computeUnitSpeedForTeam
        : null) ||
      (typeof computeUnitSpeedForTeam === 'function' ? computeUnitSpeedForTeam : null);
    if (calc) return calc(u, opts);
    const sw = Number(u.stats && u.stats.spd);
    return Number.isFinite(sw) && sw > 0 ? Math.floor(sw) : null;
  }

  function computeTeamCardStats(team) {
    const slots = team.slots || [];
    let filled = 0;
    let fullSix = 0;
    for (const uid of slots) {
      if (!uid) continue;
      const u = teamUnitRecord(uid);
      if (!u) continue;
      filled += 1;
      if (u.hasFullRunes) fullSix += 1;
    }
    return { filled, slotCount: slots.length, fullSix };
  }

  function buildTeamCardMeta(team, t) {
    const st = computeTeamCardStats(team);
    if (!st.filled) return '';
    const tpl = t.teamsCardReadiness || '{full}/{filled} with 6/6 runes';
    return `<p class="team-card__meta">${escapeHtml(
      tpl.replace(/\{full\}/g, String(st.fullSix)).replace(/\{filled\}/g, String(st.filled)),
    )}</p>`;
  }

  function buildTeamsUnitOptions(selectedId) {
    const units = monstersEnrichedCache.length
      ? monstersEnrichedCache
      : (allUnits || []).map((u) => ({
          unitId: u.unitId,
          displayName: `#${u.masterId}`,
          masterId: u.masterId,
        }));
    const opts = ['<option value="">—</option>'];
    for (const u of units) {
      const sel = Number(selectedId) === u.unitId ? ' selected' : '';
      opts.push(
        `<option value="${escapeHtml(String(u.unitId))}"${sel}>${escapeHtml(u.displayName || String(u.unitId))}</option>`,
      );
    }
    return opts.join('');
  }

  function buildTeamSlotIcons(team, t) {
    const slots = team.slots || [];
    const masterIds = team.masterIds || [];
    const size = slots.length;
    const cells = slots
      .map((uid, i) => {
        const leader = team.leaderUnitId != null && Number(team.leaderUnitId) === Number(uid);
        const missing = uid && !teamUnitRecord(uid) && !masterIds[i];
        const runeSt = uid ? teamRuneStatus(uid) : '';
        const imgFile = uid ? teamUnitImageFile(uid, masterIds[i]) : '';
        const spd = uid ? teamUnitDisplaySpeed(uid, team) : null;
        const spdBadge =
          spd != null
            ? `<span class="team-card__spd" title="${escapeHtml(t.teamsSlotSpd || 'Speed')}">${escapeHtml(String(spd))}</span>`
            : '';
        const inner = imgFile
          ? `<img class="team-card__portrait" data-img-file="${escapeAttr(imgFile)}" alt="" width="52" height="52" loading="lazy" decoding="async" />`
          : '<span class="team-card__slot-empty">+</span>';
        const label = uid ? teamUnitLabel(uid) : '';
        const unitAttr = uid ? ` data-unit-id="${escapeHtml(String(uid))}"` : '';
        const aria = label ? ` aria-label="${escapeHtml(label)}"` : '';
        return `<div class="team-card__slot${leader ? ' team-card__slot--leader' : ''}${missing ? ' team-card__slot--missing' : ''}" data-slot-idx="${i}"${unitAttr}${aria} tabindex="${uid ? '0' : '-1'}">
          ${leader ? '<span class="team-card__crown" aria-hidden="true">👑</span>' : ''}
          ${inner}
          ${spdBadge}
          ${runeSt === 'ready' ? '<span class="team-card__rune-ok" title="6/6 runes">✓</span>' : ''}
        </div>`;
      })
      .join('');
    return `<div class="team-card__slots team-card__slots--n${size}">${cells}</div>`;
  }

  function buildShareTeamFromPayload(team) {
    const unitIds = Array.isArray(team.unit_ids) ? team.unit_ids : [];
    const masterIds = Array.isArray(team.master_ids) ? team.master_ids : [];
    const size = Math.max(unitIds.length, TEAM_SIZE_DEFAULT);
    return {
      id: 'share',
      name: team.name || 'Team',
      notes: team.notes || '',
      tags: team.tags || [],
      size,
      leaderUnitId: team.leader_unit_id != null ? Number(team.leader_unit_id) : null,
      slots: unitIds,
      masterIds,
    };
  }

  function buildTeamCardHtml(team, t, opts) {
    const ro = !!(opts && opts.readOnly);
    const tags = (team.tags || [])
      .map((tag) => `<span class="team-card__tag">${escapeHtml(tag)}</span>`)
      .join('');
    const notes = team.notes
      ? `<p class="team-card__notes">${escapeHtml(team.notes)}</p>`
      : '';
    const name = team.name || t.teamsUntitled || 'New Team';
    const publicBadge =
      team.shareInProfile || (ro && opts && opts.fromShare)
        ? `<span class="team-card__public" title="${escapeHtml(t.teamsSharePublic || 'Public in profile')}">◉</span>`
        : '';
    const actions = ro
      ? ''
      : `<div class="team-card__actions">
          <button type="button" class="team-card__action" data-team-action="edit" data-team-id="${escapeHtml(team.id)}">${escapeHtml(t.teamsEdit || 'Edit')}</button>
          <button type="button" class="team-card__action" data-team-action="duplicate" data-team-id="${escapeHtml(team.id)}">${escapeHtml(t.teamsDuplicate || 'Duplicate')}</button>
          <button type="button" class="team-card__action" data-team-action="share" data-team-id="${escapeHtml(team.id)}">${escapeHtml(t.teamsShare || 'Share')}</button>
          <button type="button" class="team-card__action team-card__action--danger" data-team-action="delete" data-team-id="${escapeHtml(team.id)}">${escapeHtml(t.teamsDelete || 'Delete')}</button>
        </div>`;
    return `<article class="team-card${ro ? ' team-card--readonly' : ''}" data-teams-team-id="${escapeHtml(team.id)}"${ro ? '' : ' draggable="true"'}>
      <header class="team-card__head">
        <h4 class="team-card__title">${escapeHtml(name)}${publicBadge}</h4>
        ${actions}
      </header>
      ${buildTeamSlotIcons(team, t)}
      ${buildTeamCardMeta(team, t)}
      ${tags ? `<div class="team-card__tags">${tags}</div>` : ''}
      ${notes}
    </article>`;
  }

  function renderTeamsSetList(state, t) {
    const list = document.getElementById('teams-set-list');
    if (!list) return;
    if (!state.sets.length) {
      list.innerHTML = `<li class="teams-set-list__empty">${escapeHtml(t.teamsNoSets || 'No team sets yet. Create one to get started.')}</li>`;
      return;
    }
    const activeId = getTeamsActiveSetId();
    list.innerHTML = state.sets
      .map((set) => {
        const on = set.id === activeId;
        const collapsed = !!set.collapsed;
        const count = (set.teamIds || []).length;
        const delTitle = escapeAttr(t.teamsDeleteSet || 'Delete set');
        return `<li class="teams-set-tree__item">
          <div class="teams-set-tree__row${on ? ' is-active' : ''}">
            <button type="button" class="teams-set-tree__toggle" data-teams-set-collapse="${escapeHtml(set.id)}" aria-expanded="${collapsed ? 'false' : 'true'}">${collapsed ? '▶' : '▼'}</button>
            <button type="button" class="teams-set-tree__btn" data-teams-set-id="${escapeHtml(set.id)}">
              <span class="teams-set-tree__name">${escapeHtml(set.name)}</span>
              <span class="teams-set-tree__count">${count}</span>
            </button>
            <button type="button" class="teams-set-tree__delete btn-ghost" data-teams-delete-set="${escapeHtml(set.id)}" title="${delTitle}" aria-label="${delTitle}" data-teams-readonly-hide>×</button>
          </div>
        </li>`;
      })
      .join('');
  }

  function renderTeamsCardGrid(set, state, t) {
    const grid = document.getElementById('teams-card-grid');
    if (!grid) return;
    if (!set) {
      grid.innerHTML = `<p class="teams-main__empty">${escapeHtml(t.teamsPickSet || 'Select or create a team set.')}</p>`;
      return;
    }
    const teams = (set.teamIds || []).map((id) => state.teams[id]).filter(Boolean);
    if (!teams.length) {
      grid.innerHTML = `<div class="teams-main__empty">
        <p>${escapeHtml(t.teamsNoTeams || 'No teams in this set yet.')}</p>
        <button type="button" class="btn-primary" id="teams-create-team-inline">${escapeHtml(t.teamsCreateTeam || '+ Create Team')}</button>
      </div>`;
      return;
    }
    grid.innerHTML = teams.map((team) => buildTeamCardHtml(team, t)).join('');
  }

  function openTeamsEditor(teamId) {
    const dlg = document.getElementById('teams-editor-dialog');
    const team = getTeamById(teamId);
    if (!dlg || !team) return;
    teamsEditingTeamId = teamId;
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const nameInput = document.getElementById('teams-team-name');
    const notesInput = document.getElementById('teams-team-notes');
    const tagsInput = document.getElementById('teams-team-tags');
    const sizeSelect = document.getElementById('teams-team-size');
    const shareCb = document.getElementById('teams-share-public');
    if (nameInput) {
      nameInput.value = team.name || '';
      nameInput.placeholder = t.teamsNamePlaceholder || 'e.g. Arena Offence';
    }
    if (notesInput) notesInput.value = team.notes || '';
    if (tagsInput) tagsInput.value = (team.tags || []).join(', ');
    if (sizeSelect) sizeSelect.value = String(team.size || TEAM_SIZE_DEFAULT);
    if (shareCb) shareCb.checked = !!team.shareInProfile;
    renderEditorSlots(team, t);
    if (typeof dlg.showModal === 'function') dlg.showModal();
    else dlg.setAttribute('open', '');
  }

  function closeTeamsEditor() {
    const dlg = document.getElementById('teams-editor-dialog');
    teamsEditingTeamId = null;
    if (dlg && dlg.open && typeof dlg.close === 'function') dlg.close();
    else if (dlg) dlg.removeAttribute('open');
  }

  function renderEditorSlots(team, t) {
    const wrap = document.getElementById('teams-monster-slots');
    if (!wrap || !team) return;
    wrap.innerHTML = (team.slots || [])
      .map((slotId, i) => {
        const leader = team.leaderUnitId != null && Number(team.leaderUnitId) === Number(slotId);
        return `<div class="teams-editor-slot${leader ? ' teams-editor-slot--leader' : ''}" data-slot-idx="${i}">
          <label class="teams-editor-slot__label">
            <span>${escapeHtml((t.teamsSlotLabel || 'Slot {n}').replace('{n}', String(i + 1)))}</span>
            <select class="teams-slot-select" data-slot-idx="${i}">${buildTeamsUnitOptions(slotId)}</select>
          </label>
          <button type="button" class="teams-editor-slot__leader" data-set-leader="${i}" title="${escapeHtml(t.teamsSetLeader || 'Set leader')}">👑</button>
        </div>`;
      })
      .join('');
  }

  function saveTeamsEditorFromDom() {
    const teamId = teamsEditingTeamId;
    if (!teamId) return;
    const name = document.getElementById('teams-team-name')?.value;
    const notes = document.getElementById('teams-team-notes')?.value;
    const tagsRaw = document.getElementById('teams-team-tags')?.value || '';
    const size = document.getElementById('teams-team-size')?.value;
    const shareInProfile = document.getElementById('teams-share-public')?.checked === true;
    const slots = [];
    document.querySelectorAll('#teams-monster-slots .teams-slot-select').forEach((sel) => {
      slots.push(sel.value ? Number(sel.value) : null);
    });
    let leaderUnitId = getTeamById(teamId)?.leaderUnitId ?? null;
    const leaderBtn = document.querySelector('#teams-monster-slots .teams-editor-slot--leader .teams-slot-select');
    if (leaderBtn && leaderBtn.value) leaderUnitId = Number(leaderBtn.value);
    updateTeam(teamId, {
      name,
      notes,
      tags: tagsRaw.split(/[,;]+/).map((x) => x.trim()).filter(Boolean),
      size,
      slots,
      leaderUnitId,
      shareInProfile,
    });
    closeTeamsEditor();
    renderTeamsPanel();
  }

  async function renderTeamsPanel() {
    const shell = document.getElementById('teams-shell');
    if (!shell) return;
    if (typeof syncDemoTeamsWithDatasetMode === 'function') syncDemoTeamsWithDatasetMode();
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const ro = typeof isShareReadOnly === 'function' && isShareReadOnly();
    const sharePayload = getTeamsShareViewPayload();
    const layout = shell.querySelector('.teams-layout');
    const shareView = document.getElementById('teams-share-view');

    if (ro) {
      shell.classList.add('teams-shell--share-only');
      if (layout) {
        layout.hidden = true;
        layout.setAttribute('aria-hidden', 'true');
      }
      const dlg = document.getElementById('teams-editor-dialog');
      if (dlg?.open && typeof dlg.close === 'function') dlg.close();
      renderTeamsShareView(sharePayload || { sets: [] }, t);
      return;
    }

    shell.classList.remove('teams-shell--share-only');
    if (layout) {
      layout.hidden = false;
      layout.removeAttribute('aria-hidden');
    }
    if (shareView) {
      shareView.hidden = true;
      shareView.innerHTML = '';
    }

    const state = loadTeamsState();
    if (!getTeamsActiveSetId() && state.sets[0]) setTeamsActiveSetId(state.sets[0].id);

    const set = getTeamSetById(getTeamsActiveSetId()) || null;
    const setNameInput = document.getElementById('teams-set-name');
    if (setNameInput) {
      setNameInput.value = set ? set.name : '';
      setNameInput.placeholder = t.teamsSetNamePlaceholder || 'e.g. Arena';
      setNameInput.disabled = !set;
    }

    const createBtn = document.getElementById('teams-create-team');
    if (createBtn) createBtn.disabled = !set;

    renderTeamsSetList(state, t);
    await ensureTeamsUnitCache();
    renderTeamsCardGrid(set, state, t);
    bindTeamsCardPortraits(document.getElementById('teams-card-grid'));
    bindTeamsSlotDetailHover(document.getElementById('teams-card-grid'));

    shell.querySelectorAll('[data-teams-readonly-hide]').forEach((el) => {
      el.hidden = ro;
    });
  }

  async function renderTeamsShareView(payload, t) {
    const shell = document.getElementById('teams-shell');
    if (!shell) return;
    const layout = shell.querySelector('.teams-layout');
    if (layout) layout.hidden = true;
    let view = document.getElementById('teams-share-view');
    if (!view) {
      view = document.createElement('div');
      view.id = 'teams-share-view';
      view.className = 'teams-share-view-wrap';
      shell.appendChild(view);
    }
    view.hidden = false;

    const db = window.SWRM_MONSTER_DB;
    if (db && typeof db.loadMonsterIndex === 'function') {
      try {
        await db.loadMonsterIndex();
      } catch (e) { /* ignore */ }
    }
    if (!monstersEnrichedCache.length && allUnits.length) {
      const skillDb = window.SWRM_SKILL_DB;
      if (skillDb && typeof skillDb.loadIndex === 'function') {
        try {
          await skillDb.loadIndex();
        } catch (e) { /* ignore */ }
      }
      monstersEnrichedCache = allUnits.map((u) => enrichTeamsUnitRow(u, db, skillDb));
    }

    const blocks = (payload.sets || [])
      .map((set) => {
        const teams = (set.teams || [])
          .map((raw) =>
            buildTeamCardHtml(buildShareTeamFromPayload(raw), t, { readOnly: true, fromShare: true }),
          )
          .join('');
        const count = (set.teams || []).length;
        return `<section class="teams-share-set-panel">
          <header class="teams-share-set-panel__head">
            <span class="teams-share-set-panel__icon" aria-hidden="true">📁</span>
            <h4 class="teams-share-set-panel__title">${escapeHtml(set.name || 'Set')}</h4>
            <span class="teams-share-set-panel__count">${count}</span>
          </header>
          <div class="teams-share-set-panel__grid">${teams}</div>
        </section>`;
      })
      .join('');
    view.innerHTML = `<div class="teams-share-view">
      <h3 class="teams-share-view__title">${escapeHtml(t.teamsShareViewTitle || 'Shared teams')}</h3>
      ${blocks || `<p class="teams-share-view__empty">${escapeHtml(t.teamsShareViewEmpty || 'No public teams in this profile.')}</p>`}
    </div>`;
    bindTeamsCardPortraits(view);
    bindTeamsSlotDetailHover(view);
  }

  function bindTeamsUi() {
    if (teamsUiBound) return;
    teamsUiBound = true;

    const createTeamHandler = () => {
      const setId = getTeamsActiveSetId();
      if (!setId) return;
      const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
      createTeamInSet(setId, '', TEAM_SIZE_DEFAULT);
      const set = getTeamSetById(setId);
      const tid = set && set.teamIds.length ? set.teamIds[set.teamIds.length - 1] : null;
      renderTeamsPanel();
      if (tid) openTeamsEditor(tid);
    };

    document.getElementById('teams-export-json')?.addEventListener('click', () => {
      const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
      try {
        const json = exportTeamsStateJson();
        const blob = new Blob([json], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'sw-forge-teams.json';
        a.click();
        URL.revokeObjectURL(a.href);
        if (typeof showSwrmToast === 'function') {
          showSwrmToast(t.teamsExportDone || 'Teams exported.', { type: 'success' });
        }
      } catch (e) {
        if (typeof showSwrmToast === 'function') {
          showSwrmToast((t.teamsExportFailed || 'Export failed') + (e.message ? `: ${e.message}` : ''), { type: 'error' });
        }
      }
    });

    document.getElementById('teams-import-json')?.addEventListener('click', () => {
      const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
      const inp = document.createElement('input');
      inp.type = 'file';
      inp.accept = '.json,application/json';
      inp.style.display = 'none';
      document.body.appendChild(inp);
      inp.addEventListener('change', () => {
        const file = inp.files?.[0];
        document.body.removeChild(inp);
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          const replaceAll = confirm(
            t.teamsImportReplaceConfirm || 'Replace all teams? OK = replace, Cancel = merge into existing.',
          );
          const res = importTeamsStateFromJson(String(reader.result || ''), !replaceAll);
          if (!res.ok) {
            if (typeof showSwrmToast === 'function') {
              showSwrmToast(t.teamsImportFailed || 'Import failed — invalid JSON.', { type: 'error' });
            }
            return;
          }
          renderTeamsPanel();
          if (typeof showSwrmToast === 'function') {
            showSwrmToast(t.teamsImportDone || 'Teams imported.', { type: 'success' });
          }
        };
        reader.readAsText(file);
      });
      inp.click();
    });

    document.getElementById('teams-add-set')?.addEventListener('click', () => {
      const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
      const name = window.prompt(t.teamsNewSetPrompt || 'Set name', '');
      if (name == null) return;
      createTeamSet(name || t.teamsDefaultSetName || 'Arena');
      renderTeamsPanel();
    });

    document.getElementById('teams-create-team')?.addEventListener('click', createTeamHandler);
    document.getElementById('teams-card-grid')?.addEventListener('click', (e) => {
      if (e.target.id === 'teams-create-team-inline') {
        createTeamHandler();
        return;
      }
      const actionBtn = e.target.closest('[data-team-action]');
      if (!actionBtn) return;
      const action = actionBtn.dataset.teamAction;
      const teamId = actionBtn.dataset.teamId;
      if (action === 'edit') openTeamsEditor(teamId);
      else if (action === 'duplicate') {
        duplicateTeam(teamId);
        renderTeamsPanel();
      } else if (action === 'delete') {
        if (window.confirm((TRANSLATIONS[currentLang] || TRANSLATIONS.en).teamsDeleteConfirm || 'Delete this team?')) {
          deleteTeam(teamId);
          renderTeamsPanel();
        }
      } else if (action === 'share') {
        const team = getTeamById(teamId);
        if (team) {
          updateTeam(teamId, { shareInProfile: true });
          if (typeof triggerShareProfile === 'function') void triggerShareProfile();
        }
      }
    });

    document.getElementById('teams-set-list')?.addEventListener('click', (e) => {
      const delBtn = e.target.closest('[data-teams-delete-set]');
      if (delBtn) {
        e.stopPropagation();
        const tloc = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
        const setId = delBtn.dataset.teamsDeleteSet;
        if (!setId) return;
        if (!window.confirm(tloc.teamsDeleteSetConfirm || 'Delete this team set and all teams in it?')) return;
        deleteTeamSet(setId);
        renderTeamsPanel();
        return;
      }
      const collapse = e.target.closest('[data-teams-set-collapse]');
      if (collapse) {
        toggleSetCollapsed(collapse.dataset.teamsSetCollapse);
        renderTeamsPanel();
        return;
      }
      const btn = e.target.closest('[data-teams-set-id]');
      if (!btn) return;
      setTeamsActiveSetId(btn.dataset.teamsSetId);
      renderTeamsPanel();
    });

    document.getElementById('teams-set-name')?.addEventListener('change', (e) => {
      const setId = getTeamsActiveSetId();
      if (!setId) return;
      renameTeamSet(setId, e.target.value);
      renderTeamsPanel();
    });

    document.getElementById('teams-editor-dialog')?.addEventListener('close', () => {
      teamsEditingTeamId = null;
    });

    document.getElementById('teams-editor-save')?.addEventListener('click', () => {
      saveTeamsEditorFromDom();
    });

    const closeEditor = () => closeTeamsEditor();
    document.getElementById('teams-editor-cancel')?.addEventListener('click', closeEditor);
    document.getElementById('teams-editor-cancel-foot')?.addEventListener('click', closeEditor);

    document.getElementById('teams-team-size')?.addEventListener('change', () => {
      const teamId = teamsEditingTeamId;
      if (!teamId) return;
      const size = document.getElementById('teams-team-size')?.value;
      const team = getTeamById(teamId);
      if (!team) return;
      updateTeam(teamId, { size, slots: team.slots });
      renderEditorSlots(getTeamById(teamId), TRANSLATIONS[currentLang] || TRANSLATIONS.en);
    });

    document.getElementById('teams-monster-slots')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-set-leader]');
      if (!btn || !teamsEditingTeamId) return;
      const idx = Number(btn.dataset.setLeader);
      const sel = document.querySelector(`#teams-monster-slots .teams-slot-select[data-slot-idx="${idx}"]`);
      const val = sel?.value;
      if (!val) return;
      document.querySelectorAll('.teams-editor-slot').forEach((el) => el.classList.remove('teams-editor-slot--leader'));
      btn.closest('.teams-editor-slot')?.classList.add('teams-editor-slot--leader');
    });

    const grid = document.getElementById('teams-card-grid');
    if (grid) {
      let dragTeamId = null;
      grid.addEventListener('dragstart', (e) => {
        const card = e.target.closest('.team-card');
        if (!card) return;
        dragTeamId = card.dataset.teamsTeamId;
        e.dataTransfer?.setData('text/plain', dragTeamId);
      });
      grid.addEventListener('dragover', (e) => {
        if (!dragTeamId) return;
        e.preventDefault();
      });
      grid.addEventListener('drop', (e) => {
        e.preventDefault();
        const target = e.target.closest('.team-card');
        const setId = getTeamsActiveSetId();
        const set = getTeamSetById(setId);
        if (!target || !set || !dragTeamId) return;
        const targetId = target.dataset.teamsTeamId;
        const ids = [...set.teamIds];
        const from = ids.indexOf(dragTeamId);
        const to = ids.indexOf(targetId);
        if (from < 0 || to < 0) return;
        ids.splice(from, 1);
        ids.splice(to, 0, dragTeamId);
        reorderTeamsInSet(setId, ids);
        dragTeamId = null;
        renderTeamsPanel();
      });
    }
  }

  function initTeamsPanel() {
    bindTeamsUi();
    void renderTeamsPanel();
  }
