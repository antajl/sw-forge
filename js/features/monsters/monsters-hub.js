// js/features/monsters/monsters-hub.js — Roster / Teams sub-tabs
  let monstersHubTabsBound = false;
  let monstersHubFirstShow = true;

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

    const motionApi = window.SWRM_MOTION;
    if (motionApi && typeof motionApi.positionMonstersHubTabIndicator === 'function') {
      const nav = document.getElementById('monsters-hub-tabs');
      if (nav) {
        const snap = monstersHubFirstShow;
        monstersHubFirstShow = false;
        if (snap) {
          rafTwice(() => motionApi.positionMonstersHubTabIndicator({ nav, activeKey: id, instant: true }));
        } else {
          motionApi.positionMonstersHubTabIndicator({ nav, activeKey: id, instant: false });
        }
      }
    }

    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const lead = document.getElementById('lbl-monsters-lead');
    if (lead) {
      if (id === 'teams') {
        lead.textContent =
          t.monstersTeamsLead || 'Build named teams and group them into sets (e.g. Arena Offence).';
      } else if (id === 'planner') {
        lead.textContent = '';
      } else {
        lead.textContent = t.monstersLead || '';
      }
    }

    if (id === 'roster') {
      void renderMonstersPanel();
    } else if (id === 'dashboard') {
      if (typeof renderMonstersDashboard === 'function') void renderMonstersDashboard();
    } else if (id === 'planner' && typeof renderSkillPlannerPanel === 'function') {
      void renderSkillPlannerPanel();
    } else if (id === 'teams' && typeof renderTeamsPanel === 'function') {
      void renderTeamsPanel();
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

    const motionApi = window.SWRM_MOTION;
    if (motionApi && typeof motionApi.positionMonstersHubTabIndicator === 'function') {
      let resizeTimer = null;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          const nav2 = document.getElementById('monsters-hub-tabs');
          const activeTab = nav2 && nav2.querySelector('.monsters-hub-tab.is-active');
          if (activeTab) {
            motionApi.positionMonstersHubTabIndicator({ nav: nav2, activeKey: activeTab.dataset.monstersHub, instant: true });
          }
        }, 120);
      });
      window.addEventListener('pageshow', () => {
        rafTwice(() => {
          const nav2 = document.getElementById('monsters-hub-tabs');
          const activeTab = nav2 && nav2.querySelector('.monsters-hub-tab.is-active');
          if (activeTab) {
            motionApi.positionMonstersHubTabIndicator({ nav: nav2, activeKey: activeTab.dataset.monstersHub, instant: true });
          }
        });
      });
    }
  }

  function monstersSubtabFromHashSegment(segment) {
    const s = String(segment || '').trim().toLowerCase();
    if (s === 'team' || s === 'teams') return 'teams';
    if (s === 'roster' || s === 'list') return 'roster';
    if (s === 'planner' || s === 'skill' || s === 'skills' || s === 'skill-plan') return 'planner';
    if (s === 'dashboard') return 'dashboard';
    return MONSTERS_SUBTAB_IDS.includes(s) ? s : null;
  }
