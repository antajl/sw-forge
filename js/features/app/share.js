// js/features/app/share.js — Share Profile (read-only links via Worker + D1)
  const SHARE_QUERY_KEY = 's';
  const SHARE_EXPIRY_DAYS = 90;
  const SHARE_MODE_STORAGE_KEY = 'swrm_share_mode_v1';
  let shareReadOnly = false;
  let shareViewWizardName = '';
  let shareExportMode = 'equipped-both';

  const SHARE_MODE_LABEL_KEYS = {
    'all': 'shareModeAll',
    'equipped-monsters': 'shareModeEquippedMonsters',
    'equipped-runes': 'shareModeEquippedRunes',
    'equipped-both': 'shareModeEquippedBoth',
    selected: 'shareModeSelected',
    favorites: 'shareModeFavorites',
  };

  function shareToast(message, type) {
    const opts = { type: type || 'info', duration: type === 'error' ? 6800 : 5200 };
    if (typeof showSwrmToast === 'function') showSwrmToast(message, opts);
    else if (typeof showToast === 'function') showToast(message, opts.type);
  }

  function readStoredShareMode() {
    try {
      const v = localStorage.getItem(SHARE_MODE_STORAGE_KEY);
      return v && SHARE_MODE_LABEL_KEYS[v] ? v : 'equipped-both';
    } catch (e) {
      return 'equipped-both';
    }
  }

  function writeStoredShareMode(mode) {
    try {
      localStorage.setItem(SHARE_MODE_STORAGE_KEY, mode);
    } catch (e) { /* ignore */ }
  }

  function getShareExportMode() {
    return shareExportMode;
  }

  function setShareExportMode(mode) {
    if (!SHARE_MODE_LABEL_KEYS[mode]) mode = 'equipped-both';
    shareExportMode = mode;
    writeStoredShareMode(mode);
    syncShareSplitLabels();
  }

  function shareModeLabel(mode, t) {
    const key = SHARE_MODE_LABEL_KEYS[mode] || SHARE_MODE_LABEL_KEYS['equipped-both'];
    return (t && t[key]) || mode;
  }

  function syncShareSplitLabels() {
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const label = shareModeLabel(shareExportMode, t);
    document.querySelectorAll('[data-share-split-label]').forEach((el) => {
      el.textContent = label;
    });
    document.querySelectorAll('[data-share-mode-option]').forEach((btn) => {
      const on = btn.dataset.shareMode === shareExportMode;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-checked', on ? 'true' : 'false');
    });
  }

  function shareExpiryUnix() {
    return Math.floor(Date.now() / 1000) + SHARE_EXPIRY_DAYS * 24 * 60 * 60;
  }

  function unitMetaFavorite(unitId) {
    if (typeof unitMetaFor !== 'function') return false;
    return !!unitMetaFor(unitId).favorite;
  }

  function buildShareSlimPayload(mode) {
    const exportMode = mode || shareExportMode || 'equipped-both';
    const json = activeSwexJson;
    if (!json || !Array.isArray(json.unit_list)) return null;
    const runeById = new Map();
    for (const r of allRunes || []) {
      if (r && r.id != null) runeById.set(Number(r.id), r);
    }

    const selectedIds =
      typeof monstersBulkSelected !== 'undefined' && monstersBulkSelected && monstersBulkSelected.size
        ? new Set([...monstersBulkSelected].map(String))
        : null;

    const units = json.unit_list
      .filter((u) => u && u.unit_master_id != null)
      .filter((u) => {
        const uid = u.unit_id != null ? String(u.unit_id) : '';
        const hasRunes = Array.isArray(u.runes) && u.runes.length > 0;
        if (exportMode === 'selected') {
          return selectedIds && selectedIds.has(uid);
        }
        if (exportMode === 'favorites') {
          return unitMetaFavorite(uid);
        }
        if (exportMode === 'all') return true;
        if (exportMode === 'equipped-monsters') return hasRunes;
        if (exportMode === 'equipped-runes') return hasRunes;
        if (exportMode === 'equipped-both') return hasRunes;
        return hasRunes;
      })
      .map((u) => {
        const runes = (u.runes || []).map((raw) => {
          const rid = raw.rune_id != null ? Number(raw.rune_id) : null;
          const parsed = rid != null && runeById.has(rid) ? runeById.get(rid) : null;
          if (parsed) {
            const rawRune = parsed._raw;
            if (rawRune && typeof rawRune === 'object') {
              return {
                rune_id: rid,
                slot_no: rawRune.slot_no ?? parsed.slot,
                set_id: rawRune.set_id ?? parsed.setId,
                upgrade_curr: rawRune.upgrade_curr ?? parsed.level,
                extra: rawRune.extra,
                class: rawRune.class,
                rank: rawRune.rank,
                pri_eff: rawRune.pri_eff ?? [parsed.mainType, parsed.mainVal],
                prefix_eff: rawRune.prefix_eff,
                sec_eff: rawRune.sec_eff,
              };
            }
            return {
              rune_id: rid,
              slot_no: parsed.slot,
              set_id: parsed.setId,
              upgrade_curr: parsed.level,
              extra: parsed.grade,
              pri_eff: [parsed.mainType, parsed.mainVal],
              sec_eff: (parsed.substats || []).map((s) => [
                s.type,
                s.val,
                s.enchanted ? 1 : 0,
                s.grind || 0,
              ]),
            };
          }
          return raw;
        });
        return {
          unit_master_id: u.unit_master_id,
          unit_id: u.unit_id,
          class: u.class,
          attribute: u.attribute,
          unit_level: u.unit_level,
          rank: u.rank,
          runes,
        };
      });
    const wizardName =
      (json.wizard_info && (json.wizard_info.wizard_name || json.wizard_info.name)) ||
      localStorage.getItem('loadedRunesName') ||
      '';
    const payload = {
      wizard_name: String(wizardName || '').trim(),
      unit_list: units,
      share_mode: exportMode,
    };
    if (typeof exportTeamsForShare === 'function') {
      const teams = exportTeamsForShare();
      if (teams) payload.teams = teams;
    }
    return payload;
  }

  function shareHasExportableContent(data) {
    if (!data) return false;
    const units = Array.isArray(data.unit_list) ? data.unit_list.length : 0;
    const teamSets =
      data.teams && Array.isArray(data.teams.sets) ? data.teams.sets.length : 0;
    return units > 0 || teamSets > 0;
  }

  async function postShareProfile(mode) {
    const api = typeof SWRM_API === 'string' ? SWRM_API : '';
    if (!api) throw new Error('API not configured');
    const data = buildShareSlimPayload(mode);
    if (!shareHasExportableContent(data)) {
      const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
      throw new Error(t.shareNoContent || 'Nothing to share for this export mode');
    }
    const res = await fetch(`${api}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wizard_name: data.wizard_name,
        data: JSON.stringify(data),
        expires_at: shareExpiryUnix(),
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    if (!body || !body.id) throw new Error('Invalid response');
    return String(body.id);
  }

  function sharePageUrl(shareId) {
    const base = `${window.location.origin}${window.location.pathname}`;
    return `${base}?${SHARE_QUERY_KEY}=${encodeURIComponent(shareId)}`;
  }

  async function copyTextToClipboard(text) {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (e) { /* fallback */ }
    }
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch (e) { /* ignore */ }
    document.body.removeChild(ta);
    if (!ok) throw new Error('Clipboard unavailable');
    return ok;
  }

  async function copyShareLink(mode) {
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const id = await postShareProfile(mode);
    const url = sharePageUrl(id);
    await copyTextToClipboard(url);
    shareToast(t.shareLinkCopiedLong || t.shareLinkCopied || 'Share link copied', 'success');
  }

  function closeShareSplitMenus() {
    document.querySelectorAll('.share-split').forEach((root) => {
      root.classList.remove('is-open');
      const menu = root.querySelector('.share-split__menu');
      const caret = root.querySelector('.share-split__caret');
      if (menu) menu.hidden = true;
      if (caret) caret.setAttribute('aria-expanded', 'false');
    });
  }

  async function triggerShareProfile(mode) {
    const exportMode = mode || shareExportMode;
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const triggers = document.querySelectorAll('.share-split__main, .share-profile-trigger');
    triggers.forEach((btn) => {
      btn.disabled = true;
    });
    closeShareSplitMenus();
    try {
      await copyShareLink(exportMode);
    } catch (e) {
      shareToast((t.shareFailed || 'Share failed') + (e.message ? `: ${e.message}` : ''), 'error');
    } finally {
      if (!shareReadOnly) {
        triggers.forEach((btn) => {
          btn.disabled = false;
        });
      }
    }
  }

  function renderShareViewBanner() {
    let bar = document.getElementById('share-view-banner');
    if (!shareReadOnly) {
      if (bar) bar.remove();
      return;
    }
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    if (!bar) {
      bar = document.createElement('aside');
      bar.id = 'share-view-banner';
      bar.className = 'demo-dataset-banner share-view-banner';
      const chrome = document.querySelector('.site-chrome-sticky');
      if (chrome) chrome.insertAdjacentElement('afterend', bar);
      else document.body.prepend(bar);
    }
    const name = escapeHtml(shareViewWizardName || t.shareUnknownWizard || 'another player');
    const tpl = t.shareViewingBanner || 'You are viewing {name}\'s profile (read-only).';
    bar.innerHTML = `<div class="demo-dataset-banner__inner">
      <div class="demo-dataset-banner__content">
        <span class="demo-dataset-banner__badge" aria-hidden="true">VIEW</span>
        <span class="demo-dataset-banner__text">${tpl.replace(/\{name\}/g, name)}</span>
        <button type="button" class="btn-ghost demo-dataset-banner__upload-btn" id="share-view-exit-btn">${escapeHtml(t.shareLoadOwn || 'Load your SWEX')}</button>
      </div>
    </div>`;
    bar.querySelector('#share-view-exit-btn')?.addEventListener('click', () => {
      try {
        const u = new URL(window.location.href);
        u.searchParams.delete(SHARE_QUERY_KEY);
        window.location.href = u.pathname + u.hash;
      } catch (e) {
        window.location.href = window.location.pathname;
      }
    });
  }

  async function tryOpenShareFromUrl() {
    let shareId = '';
    try {
      shareId = new URL(window.location.href).searchParams.get(SHARE_QUERY_KEY) || '';
    } catch (e) { /* ignore */ }
    if (!shareId) return false;
    const api = typeof SWRM_API === 'string' ? SWRM_API : '';
    if (!api) return false;
    try {
      const res = await fetch(`${api}/share?id=${encodeURIComponent(shareId)}`);
      if (!res.ok) return false;
      const body = await res.json();
      const raw = body && body.data != null ? body.data : null;
      const text = typeof raw === 'string' ? raw : JSON.stringify(raw);
      const parsed = JSON.parse(text);
      const wrapped = {
        wizard_info: { wizard_name: body.wizard_name || parsed.wizard_name || '' },
        unit_list: parsed.unit_list || [],
        runes: [],
      };
      if (!tryHydrateRunesFromJsonText(JSON.stringify(wrapped))) return false;
      shareReadOnly = true;
      shareViewWizardName = String(body.wizard_name || parsed.wizard_name || '').trim();
      if (parsed.teams && typeof setTeamsShareViewPayload === 'function') {
        setTeamsShareViewPayload(parsed.teams);
      }
      applyShareReadOnlyUi();
      renderShareViewBanner();
      if (typeof uiAfterSuccessfulRuneRestore === 'function') {
        uiAfterSuccessfulRuneRestore({ name: shareViewWizardName }, { keepTab: true });
      }
      if (typeof renderDashboard === 'function' && typeof getVisibleRunes === 'function') {
        renderDashboard(getVisibleRunes(), { animateCharts: false });
      }
      if (typeof renderMonstersPanel === 'function') renderMonstersPanel();
      return true;
    } catch (e) {
      console.warn('Share load failed', e);
      return false;
    }
  }

  function isShareReadOnly() {
    return shareReadOnly;
  }

  function applyShareReadOnlyUi() {
    document.body.classList.toggle('share-readonly', shareReadOnly);
    document.querySelectorAll('.share-split__main, .share-split__caret, .share-profile-trigger').forEach((el) => {
      el.disabled = shareReadOnly;
    });
    document.querySelectorAll('.db-slot-btn, #btn-upload-slot, #btn-demo-load').forEach((el) => {
      if (el) el.disabled = shareReadOnly;
    });
    const saveBtn = document.getElementById('btn-save-settings');
    if (saveBtn) saveBtn.hidden = shareReadOnly;
    const rulesRoot = document.getElementById('tab-settings');
    if (rulesRoot) {
      rulesRoot.querySelectorAll('input, select, textarea').forEach((el) => {
        el.disabled = shareReadOnly;
      });
      rulesRoot.querySelectorAll('button').forEach((el) => {
        if (el.classList.contains('rules-subtab')) return;
        if (el.id === 'share-view-exit-btn') return;
        el.disabled = shareReadOnly;
        if (shareReadOnly && el.id === 'btn-save-settings') el.hidden = true;
      });
    }
    const bulkBar = document.getElementById('monsters-bulk-bar');
    if (bulkBar) bulkBar.hidden = shareReadOnly || monstersBulkSelected.size === 0;
    document.querySelectorAll('[data-teams-readonly-hide]').forEach((el) => {
      el.hidden = shareReadOnly;
    });
  }

  function bindShareProfileUi() {
    shareExportMode = readStoredShareMode();
    syncShareSplitLabels();

    document.addEventListener('click', (e) => {
      const mainBtn = e.target.closest('.share-split__main');
      if (mainBtn && !mainBtn.disabled && !shareReadOnly) {
        e.preventDefault();
        void triggerShareProfile();
        return;
      }
      const legacyBtn = e.target.closest('.share-profile-trigger');
      if (legacyBtn && !legacyBtn.disabled && !shareReadOnly) {
        e.preventDefault();
        void triggerShareProfile();
        return;
      }
      const modeBtn = e.target.closest('[data-share-mode]');
      if (modeBtn) {
        e.preventDefault();
        setShareExportMode(modeBtn.dataset.shareMode);
        closeShareSplitMenus();
        return;
      }
      const copyBtn = e.target.closest('[data-share-copy-link]');
      if (copyBtn) {
        e.preventDefault();
        void triggerShareProfile(shareExportMode);
        return;
      }
      const caret = e.target.closest('.share-split__caret');
      if (caret) {
        e.preventDefault();
        const root = caret.closest('.share-split');
        if (!root) return;
        const open = !root.classList.contains('is-open');
        closeShareSplitMenus();
        if (open) {
          root.classList.add('is-open');
          const menu = root.querySelector('.share-split__menu');
          if (menu) menu.hidden = false;
          caret.setAttribute('aria-expanded', 'true');
        }
        return;
      }
      if (!e.target.closest('.share-split')) closeShareSplitMenus();
    });
  }

  async function initShareProfile() {
    bindShareProfileUi();
    const opened = await tryOpenShareFromUrl();
    if (!opened) {
      shareReadOnly = false;
      applyShareReadOnlyUi();
      renderShareViewBanner();
    }
    return opened;
  }
