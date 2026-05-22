// js/features/monsters/monsters-hub.js — Roster / Teams sub-tabs
  let monstersHubTabsBound = false;

  function normalizeMonstersSubtabId(id) {
    return MONSTERS_SUBTAB_IDS.includes(id) ? id : 'roster';
  }

  function showMonstersSubtab(subId, options) {
    const id = normalizeMonstersSubtabId(subId);
    try {
      sessionStorage.setItem(MONSTERS_SUBTAB_STORAGE_KEY, id);
    } catch (e) { /* ignore */ }

    document.querySelectorAll('.monsters-hub-tab').forEach((btn) => {
      const on = btn.dataset.monstersHub === id;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
      btn.tabIndex = on ? 0 : -1;
    });

    document.querySelectorAll('.monsters-hub-pane').forEach((pane) => {
      const on = pane.dataset.monstersPane === id;
      pane.classList.toggle('is-active', on);
      pane.classList.toggle('hidden', !on);
      if (on) pane.removeAttribute('hidden');
      else pane.setAttribute('hidden', '');
    });

    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const lead = document.getElementById('lbl-monsters-lead');
    if (lead) {
      if (id === 'teams') {
        lead.textContent =
          t.monstersTeamsLead || 'Build named teams and group them into sets (e.g. Arena Offence).';
      } else if (id === 'planner') {
        lead.textContent = t.skillPlannerLead || '';
      } else {
        lead.textContent = t.monstersLead || '';
      }
    }

    if (id === 'roster') {
      void renderMonstersPanel();
    } else if (id === 'planner' && typeof renderSkillPlannerPanel === 'function') {
      void renderSkillPlannerPanel();
    } else if (id === 'teams' && typeof renderTeamsPanel === 'function') {
      renderTeamsPanel();
    }
  }

  function initMonstersHubTabs() {
    const nav = document.getElementById('monsters-hub-tabs');
    if (!nav || monstersHubTabsBound) return;
    monstersHubTabsBound = true;
    nav.querySelectorAll('.monsters-hub-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        const sub = btn.dataset.monstersHub;
        if (!sub) return;
        showMainTab('monsters', { monstersSubtab: sub, writeHash: true });
      });
    });
  }

  function monstersSubtabFromHashSegment(segment) {
    const s = String(segment || '').trim().toLowerCase();
    if (s === 'team' || s === 'teams') return 'teams';
    if (s === 'roster' || s === 'list') return 'roster';
    if (s === 'planner' || s === 'skill' || s === 'skills' || s === 'skill-plan') return 'planner';
    return MONSTERS_SUBTAB_IDS.includes(s) ? s : null;
  }
