// js/features/app/share.js — Share Profile (read-only links via Worker + D1)
  const SHARE_QUERY_KEY = 's';
  const PROFILE_URL_QUERY_KEY = 'profile';
  const PROFILE_DATA_QUERY_KEY = 'data';
  const SHARE_SESSION_KEY = 'swrm_share_readonly_v1';
  const SHARE_EXPIRY_DAYS = 90;
  const SHARE_MODE_STORAGE_KEY = 'swrm_share_mode_v1';
  /** Cloudflare D1 row limit ~2 MB; keep request body under this. */
  const SHARE_MAX_BODY_BYTES = 1_850_000;
  let shareReadOnly = false;
  let shareViewLoadFailed = false;
  let shareViewWizardName = '';
  let shareExportMode = 'all';
  /** Set when viewing a shared profile (payload share_mode). */
  let shareViewExportMode = '';

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
      return v && SHARE_MODE_LABEL_KEYS[v] ? v : 'all';
    } catch (e) {
      return 'all';
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
    if (!SHARE_MODE_LABEL_KEYS[mode]) mode = 'all';
    shareExportMode = mode;
    writeStoredShareMode(mode);
    syncShareSplitLabels();
  }

  function shareModeLabel(mode, t) {
    const key = SHARE_MODE_LABEL_KEYS[mode] || SHARE_MODE_LABEL_KEYS.all;
    return (t && t[key]) || mode;
  }

  function syncShareSplitLabels() {
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const mainLabel = t.shareButtonLabel || 'Share';
    document.querySelectorAll('[data-share-split-label]').forEach((el) => {
      el.textContent = mainLabel;
    });
    document.querySelectorAll('[data-share-mode]').forEach((btn) => {
      const on = btn.dataset.shareMode === shareExportMode;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-checked', on ? 'true' : 'false');
    });
  }

  function getShareIdFromUrl() {
    try {
      return new URL(window.location.href).searchParams.get(SHARE_QUERY_KEY) || '';
    } catch (e) {
      return '';
    }
  }

  function getProfileLinkFromUrl() {
    try {
      const params = new URL(window.location.href).searchParams;
      return {
        profileUrl: (params.get(PROFILE_URL_QUERY_KEY) || '').trim(),
        dataBlob: (params.get(PROFILE_DATA_QUERY_KEY) || '').trim(),
      };
    } catch (e) {
      return { profileUrl: '', dataBlob: '' };
    }
  }

  function decodeProfileDataParam(blob) {
    const raw = String(blob || '').trim();
    if (!raw) return '';
    const b64 = raw.replace(/-/g, '+').replace(/_/g, '/');
    const padLen = (4 - (b64.length % 4)) % 4;
    const padded = b64 + (padLen ? '='.repeat(padLen) : '');
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  function normalizeProfileSwexRoot(parsed) {
    if (!parsed || typeof parsed !== 'object') return null;
    if (Array.isArray(parsed.unit_list) || Array.isArray(parsed.runes) || Array.isArray(parsed.rune_list)) {
      return parsed;
    }
    if (parsed.data && typeof parsed.data === 'object') return normalizeProfileSwexRoot(parsed.data);
    if (typeof parsed.data === 'string') {
      try {
        return normalizeProfileSwexRoot(JSON.parse(parsed.data));
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  function applyReadOnlyProfilePayload(parsed, wizardName) {
    const root = normalizeProfileSwexRoot(parsed);
    if (!root) return false;
    const name =
      String(wizardName || '').trim() ||
      String(
        (root.wizard_info && (root.wizard_info.wizard_name || root.wizard_info.name)) ||
          root.wizard_name ||
          '',
      ).trim();
    if (!tryHydrateRunesFromJsonText(JSON.stringify(root))) return false;
    shareReadOnly = true;
    persistShareSession(true);
    shareViewLoadFailed = false;
    shareViewWizardName = name;
    shareViewExportMode = String(
      root.share_mode || parsed.share_mode || parsed.shareMode || '',
    ).trim();
    if (parsed.teams && typeof setTeamsShareViewPayload === 'function') {
      setTeamsShareViewPayload(parsed.teams);
    } else if (root.teams && typeof setTeamsShareViewPayload === 'function') {
      setTeamsShareViewPayload(root.teams);
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
    if (typeof renderTeamsPanel === 'function') renderTeamsPanel();
    if (typeof applyShareUrlTabFromLocation === 'function') applyShareUrlTabFromLocation();
    return true;
  }

  async function tryOpenProfileFromUrl() {
    if (getShareIdFromUrl()) return false;
    const { profileUrl, dataBlob } = getProfileLinkFromUrl();
    if (!profileUrl && !dataBlob) return false;
    shareViewLoadFailed = false;
    try {
      let text = '';
      if (dataBlob) {
        text = decodeProfileDataParam(dataBlob);
      } else {
        const res = await fetch(profileUrl);
        if (!res.ok) throw new Error('profile fetch failed');
        text = await res.text();
      }
      const parsed = JSON.parse(text);
      return applyReadOnlyProfilePayload(parsed);
    } catch (e) {
      console.warn('Profile link load failed', e);
      shareViewLoadFailed = true;
      shareReadOnly = true;
      persistShareSession(true);
      applyShareReadOnlyUi();
      renderShareViewBanner();
      if (typeof uiEmptyRuneApplicationState === 'function') {
        uiEmptyRuneApplicationState({ keepTab: true });
      }
      return false;
    }
  }

  function persistShareSession(on) {
    try {
      if (on) sessionStorage.setItem(SHARE_SESSION_KEY, '1');
      else sessionStorage.removeItem(SHARE_SESSION_KEY);
    } catch (e) { /* ignore */ }
  }

  function readShareSession() {
    try {
      return sessionStorage.getItem(SHARE_SESSION_KEY) === '1';
    } catch (e) {
      return false;
    }
  }

  function shareExpiryUnix() {
    return Math.floor(Date.now() / 1000) + SHARE_EXPIRY_DAYS * 24 * 60 * 60;
  }

  function unitMetaFavorite(unitId) {
    if (typeof unitMetaFor !== 'function') return false;
    return !!unitMetaFor(unitId).favorite;
  }

  function slimRuneRawForShare(raw, parsed) {
    const src = raw && typeof raw === 'object' ? raw : {};
    const rid =
      src.rune_id != null
        ? Number(src.rune_id)
        : parsed && parsed.id != null
          ? Number(parsed.id)
          : null;
    if (!Number.isFinite(rid)) return src;
    const rawRune = parsed && parsed._raw && typeof parsed._raw === 'object' ? parsed._raw : null;
    const out = {
      rune_id: rid,
      slot_no: src.slot_no ?? rawRune?.slot_no ?? parsed?.slot,
      set_id: src.set_id ?? rawRune?.set_id ?? parsed?.setId,
      upgrade_curr: src.upgrade_curr ?? rawRune?.upgrade_curr ?? parsed?.level ?? 0,
      extra: src.extra ?? rawRune?.extra ?? parsed?.grade,
      class: src.class ?? rawRune?.class,
      rank: src.rank ?? rawRune?.rank,
    };
    if (src.pri_eff) out.pri_eff = src.pri_eff;
    else if (rawRune?.pri_eff) out.pri_eff = rawRune.pri_eff;
    else if (parsed?.mainType != null) out.pri_eff = [parsed.mainType, parsed.mainVal];
    if (src.prefix_eff) out.prefix_eff = src.prefix_eff;
    else if (rawRune?.prefix_eff) out.prefix_eff = rawRune.prefix_eff;
    if (src.sec_eff) out.sec_eff = src.sec_eff;
    else if (rawRune?.sec_eff) out.sec_eff = rawRune.sec_eff;
    else if (parsed?.substats) {
      out.sec_eff = (parsed.substats || []).map((s) => [
        s.type,
        s.val,
        s.enchanted ? 1 : 0,
        s.grind || 0,
      ]);
    }
    return out;
  }

  function buildShareSlimPayload(mode) {
    const exportMode = mode || shareExportMode || 'all';
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
          return slimRuneRawForShare(raw, parsed);
        });
        return {
          unit_master_id: u.unit_master_id,
          unit_id: u.unit_id,
          class: u.class,
          attribute: u.attribute,
          unit_level: u.unit_level,
          rank: u.rank,
          con: u.con,
          atk: u.atk,
          def: u.def,
          spd: u.spd,
          critical_rate: u.critical_rate,
          critical_damage: u.critical_damage,
          resist: u.resist,
          accuracy: u.accuracy,
          skills: Array.isArray(u.skills) ? u.skills : [],
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
    if (exportMode === 'all') {
      const inv = json.runes || json.rune_list || [];
      if (Array.isArray(inv) && inv.length) {
        payload.runes = inv.map((raw) => {
          const rid = raw && raw.rune_id != null ? Number(raw.rune_id) : null;
          const parsed = rid != null && runeById.has(rid) ? runeById.get(rid) : null;
          return slimRuneRawForShare(raw, parsed);
        });
      }
    }
    if (typeof exportTeamsForShare === 'function') {
      const teams = exportTeamsForShare();
      if (teams) {
        payload.teams = teams;
        const included = new Set(units.map((u) => String(u.unit_id)));
        const byId = new Map(
          (json.unit_list || []).map((u) => [String(u.unit_id), u]),
        );
        for (const set of teams.sets || []) {
          for (const team of set.teams || []) {
            for (const uid of team.unit_ids || []) {
              if (uid == null || uid === '') continue;
              const key = String(uid);
              if (included.has(key)) continue;
              const src = byId.get(key);
              if (!src) continue;
              included.add(key);
              units.push({
                unit_master_id: src.unit_master_id,
                unit_id: src.unit_id,
                class: src.class,
                attribute: src.attribute,
                unit_level: src.unit_level,
                rank: src.rank,
                runes: (src.runes || []).map((raw) => {
                  const rid = raw.rune_id != null ? Number(raw.rune_id) : null;
                  const parsed = rid != null && runeById.has(rid) ? runeById.get(rid) : null;
                  return slimRuneRawForShare(raw, parsed);
                }),
              });
            }
          }
        }
        payload.unit_list = units;
      }
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
    const payload = {
      wizard_name: data.wizard_name,
      data: JSON.stringify(data),
      expires_at: shareExpiryUnix(),
    };
    const bodyStr = JSON.stringify(payload);
    if (bodyStr.length > SHARE_MAX_BODY_BYTES) {
      const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
      const mb = (bodyStr.length / (1024 * 1024)).toFixed(1);
      const tpl =
        t.sharePayloadTooLarge ||
        'Export is too large to share ({size} MB). Try equipped-only, or remove unused runes from the JSON.';
      throw new Error(tpl.replace(/\{size\}/g, mb));
    }
    const res = await fetch(`${api}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: bodyStr,
    });
    let body = null;
    try {
      body = await res.json();
    } catch (e) {
      body = null;
    }
    if (!res.ok) {
      const detail =
        (body && (body.message || body.error)) ||
        (res.status === 500
          ? 'Server error — share database may be unavailable'
          : `HTTP ${res.status}`);
      throw new Error(detail);
    }
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

  function unitsForShareReview() {
    const cache = typeof monstersEnrichedCache !== 'undefined' ? monstersEnrichedCache : [];
    if (window.SWRM && typeof window.SWRM.filterPlannerRosterUnits === 'function') {
      return window.SWRM.filterPlannerRosterUnits(cache);
    }
    return cache.filter((u) => {
      if (typeof isTechnicalFodderMonster === 'function' && isTechnicalFodderMonster(u)) return false;
      return true;
    });
  }

  function syncShareMentorFilterDom(f) {
    const runeSel = document.getElementById('monsters-filter-rune');
    const skillSel = document.getElementById('monsters-filter-skill');
    const locSel = document.getElementById('monsters-filter-location');
    const sixBtn = document.getElementById('monsters-filter-full-six');
    if (runeSel) runeSel.value = f.runeFilter || '';
    if (skillSel) skillSel.value = f.skillFilter || '';
    if (locSel) locSel.value = f.location || 'all';
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    if (typeof syncMonstersShowAllButton === 'function') {
      syncMonstersShowAllButton(!!f.fullSixOnly, t);
    }
    if (typeof updateMonstersFilterSummary === 'function') updateMonstersFilterSummary();
  }

  function openMentorRoster(kind) {
    const k = String(kind || '').trim();
    if (!k) return;
    const f =
      typeof readMonstersFiltersFromDom === 'function'
        ? readMonstersFiltersFromDom()
        : { sort: 'name', q: '', element: '', location: 'all', minLevelMin: 0 };
    f.runeFilter = '';
    f.skillFilter = '';
    f.fullSixOnly = false;
    f.location = 'all';
    if (k === 'skills') f.skillFilter = 'needs-up';
    else if (k === 'partial') f.runeFilter = 'partial';
    else if (k === 'unruned') f.runeFilter = 'unruned';
    else if (k === 'attention') {
      f.skillFilter = 'needs-up';
    }
    if (typeof writeMonstersFilters === 'function') writeMonstersFilters(f);
    syncShareMentorFilterDom(f);
    if (typeof showMainTab === 'function') {
      showMainTab('monsters', { monstersSubtab: 'roster', writeHash: true });
    }
    window.setTimeout(() => {
      if (typeof renderMonstersPanel === 'function') void renderMonstersPanel();
    }, 40);
  }

  function mentorRosterSegment(innerEscaped, kind) {
    if (!kind) return innerEscaped;
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const title = escapeHtml(t.shareMentorOpenRoster || 'Open filtered roster');
    return `<button type="button" class="account-mentor-btn" data-mentor-roster="${escapeHtml(kind)}" title="${title}">${innerEscaped}</button>`;
  }

  function bindMentorRosterClicks() {
    if (document.documentElement.dataset.mentorRosterBound) return;
    document.documentElement.dataset.mentorRosterBound = '1';
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-mentor-roster]');
      if (!btn) return;
      e.preventDefault();
      openMentorRoster(btn.dataset.mentorRoster);
    });
  }

  function buildShareMentorUnitHints(t) {
    const cache = unitsForShareReview();
    if (!cache.length) return '';
    const scored = [];
    for (const u of cache) {
      let score = 0;
      if (u.skillUpsNeeded > 0) score += 3 + Math.min(u.skillUpsNeeded, 9);
      if (u.equippedCount > 0 && !u.hasFullRunes) score += 2;
      if (u.equippedCount === 0 && (u.level >= 40 || u.stars >= 6)) score += 1;
      if (score > 0) {
        scored.push({
          score,
          name: u.displayName && !String(u.displayName).startsWith('#') ? u.displayName : null,
        });
      }
    }
    scored.sort((a, b) => b.score - a.score);
    const names = [];
    for (const row of scored) {
      if (!row.name) continue;
      if (names.includes(row.name)) continue;
      names.push(row.name);
      if (names.length >= 3) break;
    }
    if (!names.length) return '';
    const tpl = t.shareReviewUnits || 'Needs attention: {names}';
    const text = tpl.replace(/\{names\}/g, names.join(', '));
    return mentorRosterSegment(escapeHtml(text), 'attention');
  }

  function buildAccountReviewLines(opts) {
    const o = opts || {};
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const lines = [];
    if (!o.hideScope) {
      const mode = o.mode || shareViewExportMode || shareExportMode || 'all';
      const scopeTpl = shareReadOnly
        ? t.shareReviewScope || 'In this link: {mode}'
        : t.accountReviewScope || 'Your box: {mode}';
      lines.push(escapeHtml(scopeTpl.replace(/\{mode\}/g, shareModeLabel(mode, t))));
    }

    const runes = typeof allRunes !== 'undefined' && Array.isArray(allRunes) ? allRunes : [];
    if (runes.length) {
      let keep = 0;
      let sell = 0;
      for (const r of runes) {
        const v = (r.verdict || '').trim();
        if (v === 'Keep') keep += 1;
        else if (v === 'Sell') sell += 1;
      }
      const tpl = t.shareReviewRunes || '{n} runes · Keep {keep} · Sell {sell}';
      const runeLine = tpl
        .replace(/\{n\}/g, String(runes.length))
        .replace(/\{keep\}/g, String(keep))
        .replace(/\{sell\}/g, String(sell));
      lines.push(escapeHtml(runeLine));
    }

    const reviewUnits = unitsForShareReview();
    const stats =
      window.SWRM && typeof window.SWRM.computeSkillPlannerStats === 'function'
        ? window.SWRM.computeSkillPlannerStats(reviewUnits)
        : null;
    if (stats && (stats.skillUpsTotal > 0 || stats.monstersNeeding > 0)) {
      const tpl = t.shareReviewSkills || '{skill} skill-ups to max · {monsters} monsters';
      const skillLine = tpl
        .replace(/\{skill\}/g, String(stats.skillUpsTotal))
        .replace(/\{monsters\}/g, String(stats.monstersNeeding));
      lines.push(mentorRosterSegment(escapeHtml(skillLine), 'skills'));
    }
    if (reviewUnits.length) {
      let partial = 0;
      for (const u of reviewUnits) {
        if (u.equippedCount > 0 && !u.hasFullRunes) partial += 1;
      }
      if (partial > 0) {
        const tpl = t.shareReviewPartial || '{partial} with incomplete rune sets';
        const partialLine = tpl.replace(/\{partial\}/g, String(partial));
        lines.push(mentorRosterSegment(escapeHtml(partialLine), 'partial'));
      }
    }

    const hints = buildShareMentorUnitHints(t);
    if (hints) lines.push(hints);
    return lines;
  }

  function buildAccountReviewHtml(opts) {
    const o = opts || {};
    if (shareViewLoadFailed) return '';
    const lines = buildAccountReviewLines(o);
    const runes = typeof allRunes !== 'undefined' && Array.isArray(allRunes) ? allRunes : [];
    if (!lines.length) return '';
    if (!o.hideScope && lines.length <= 1 && !runes.length) return '';
    const wrapClass = o.wrapClass || 'account-review';
    return `<p class="${escapeHtml(wrapClass)}">${lines.join('<span class="account-review__sep" aria-hidden="true"> · </span>')}</p>`;
  }

  function buildShareAccountReviewHtml() {
    return buildAccountReviewHtml({ wrapClass: 'share-view-banner__review account-review' });
  }

  function renderAccountReviewStrip() {
    const el = document.getElementById('monsters-account-review');
    if (!el) return;
    if (shareReadOnly || !allUnits.length) {
      el.hidden = true;
      el.innerHTML = '';
      return;
    }
    const html = buildAccountReviewHtml({
      hideScope: true,
      wrapClass: 'monsters-box-overview__review account-review',
    });
    if (!html) {
      el.hidden = true;
      el.innerHTML = '';
      return;
    }
    el.hidden = false;
    el.innerHTML = html;
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
      bar.className = 'share-view-banner demo-dataset-banner';
      const chrome = document.querySelector('.site-chrome-sticky');
      const demo = document.getElementById('demo-dataset-banner');
      if (demo && chrome && demo.parentElement === chrome) {
        demo.insertAdjacentElement('afterend', bar);
      } else if (chrome) {
        chrome.appendChild(bar);
      } else {
        document.body.prepend(bar);
      }
    }
    bar.removeAttribute('hidden');
    bar.setAttribute('aria-hidden', 'false');
    const nameRaw = (shareViewWizardName || '').trim() || (t.shareUnknownWizard || 'another player');
    const name = escapeHtml(nameRaw);
    const readOnlyLbl = escapeHtml(t.shareReadOnlyLabel || 'Read-only');
    const reviewHtml = shareViewLoadFailed ? '' : buildShareAccountReviewHtml();
    const text = shareViewLoadFailed
      ? escapeHtml(t.shareViewLoadFailed || 'Could not load this shared profile. The link may be expired.')
      : `<span class="share-view-banner__line"><span class="share-view-banner__prefix">${escapeHtml(t.shareViewingPrefix || 'Viewing account')}</span> <strong class="share-view-banner__name">${name}</strong></span> <span class="share-view-banner__readonly">${readOnlyLbl}</span>`;
    bar.innerHTML = `<div class="demo-dataset-banner__inner">
      <div class="demo-dataset-banner__content">
        <span class="demo-dataset-banner__badge" aria-hidden="true">${readOnlyLbl}</span>
        <div class="demo-dataset-banner__text-wrap">
          <span class="demo-dataset-banner__text">${text}</span>
          ${reviewHtml}
        </div>
        <button type="button" class="btn-ghost demo-dataset-banner__upload-btn" id="share-view-exit-btn">${escapeHtml(t.shareLoadOwn || 'Load your SWEX')}</button>
      </div>
    </div>`;
    const exitBtn = bar.querySelector('#share-view-exit-btn');
    if (exitBtn && !exitBtn.dataset.bound) {
      exitBtn.dataset.bound = '1';
      exitBtn.addEventListener('click', () => {
        persistShareSession(false);
        try {
          const u = new URL(window.location.href);
          u.searchParams.delete(SHARE_QUERY_KEY);
          u.searchParams.delete(PROFILE_URL_QUERY_KEY);
          u.searchParams.delete(PROFILE_DATA_QUERY_KEY);
          window.location.href = u.pathname + (u.hash || '');
        } catch (e) {
          window.location.href = window.location.pathname;
        }
      });
    }
  }

  async function tryOpenShareFromUrl(shareId) {
    shareId = shareId || getShareIdFromUrl();
    if (!shareId) return false;
    shareViewLoadFailed = false;
    const api = typeof SWRM_API === 'string' ? SWRM_API : '';
    if (!api) return false;
    try {
      const res = await fetch(`${api}/share?id=${encodeURIComponent(shareId)}`);
      if (!res.ok) return false;
      const body = await res.json();
      const raw = body && body.data != null ? body.data : null;
      const text = typeof raw === 'string' ? raw : JSON.stringify(raw);
      const parsed = JSON.parse(text);
      const wizardName = String(body.wizard_name || parsed.wizard_name || '').trim();
      const root = normalizeProfileSwexRoot(parsed);
      if (!root) {
        shareViewLoadFailed = true;
        return false;
      }
      if (!applyReadOnlyProfilePayload({ ...root, teams: parsed.teams }, wizardName)) {
        shareViewLoadFailed = true;
        return false;
      }
      return true;
    } catch (e) {
      console.warn('Share load failed', e);
      shareViewLoadFailed = true;
      return false;
    }
  }

  function isShareReadOnly() {
    return shareReadOnly || readShareSession();
  }

  function applyShareReadOnlyUi() {
    const ro = isShareReadOnly();
    shareReadOnly = ro;
    document.documentElement.classList.toggle('share-readonly', ro);
    document.body.classList.toggle('share-readonly', ro);
    if (typeof syncDemoBannerVisibility === 'function') syncDemoBannerVisibility();
    document.querySelectorAll('.share-split__main, .share-split__caret, .share-profile-trigger').forEach((el) => {
      el.disabled = ro;
    });
    document.querySelectorAll('.db-slot-btn, #btn-upload-slot, #btn-demo-load').forEach((el) => {
      if (el) el.disabled = ro;
    });
    document.querySelectorAll('[data-share-hidden]').forEach((el) => {
      el.hidden = ro;
    });
    document.querySelectorAll('.tab[data-tab="guide"], .tab[data-tab="changelog"]').forEach((el) => {
      if (ro) el.setAttribute('hidden', '');
      else el.removeAttribute('hidden');
    });
    const saveBtn = document.getElementById('btn-save-settings');
    if (saveBtn) saveBtn.hidden = ro;
    const rulesRoot = document.getElementById('tab-settings');
    if (rulesRoot) {
      rulesRoot.querySelectorAll('input, select, textarea').forEach((el) => {
        el.disabled = ro;
        if (ro) el.setAttribute('readonly', 'readonly');
        else el.removeAttribute('readonly');
      });
      rulesRoot.querySelectorAll('button').forEach((el) => {
        if (el.classList.contains('rules-subtab')) return;
        if (el.id === 'share-view-exit-btn') return;
        if (el.id === 'btn-toggle-threshold-previews') return;
        el.disabled = ro;
        if (ro && el.id === 'btn-save-settings') el.hidden = true;
      });
    }
    const appSettingsRoot = document.getElementById('tab-app-settings');
    if (appSettingsRoot) {
      appSettingsRoot.querySelectorAll('input, select, textarea, button').forEach((el) => {
        if (el.id === 'app-language') return;
        el.disabled = ro;
        if (ro) el.setAttribute('readonly', 'readonly');
        else el.removeAttribute('readonly');
      });
    }
    const bulkBar = document.getElementById('monsters-bulk-bar');
    if (bulkBar) bulkBar.hidden = ro || monstersBulkSelected.size === 0;
    document.querySelectorAll('[data-teams-readonly-hide]').forEach((el) => {
      el.hidden = ro;
    });
    renderShareViewBanner();
    if (ro) {
      const activeMain = document.querySelector('.tab.active')?.dataset?.tab;
      if (activeMain === 'guide' || activeMain === 'changelog') {
        if (typeof showMainTab === 'function') showMainTab('runes', { writeHash: true });
      }
    }
  }

  function bindShareProfileUi() {
    shareExportMode = readStoredShareMode();
    syncShareSplitLabels();
    bindMentorRosterClicks();

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
    const shareId = getShareIdFromUrl();
    if (!shareId) {
      const profileLink = getProfileLinkFromUrl();
      if (profileLink.profileUrl || profileLink.dataBlob) {
        return tryOpenProfileFromUrl();
      }
      if (readShareSession()) persistShareSession(false);
      shareReadOnly = false;
      shareViewLoadFailed = false;
      applyShareReadOnlyUi();
      return false;
    }
    const opened = await tryOpenShareFromUrl(shareId);
    if (!opened) {
      shareReadOnly = true;
      persistShareSession(true);
      shareViewLoadFailed = true;
      applyShareReadOnlyUi();
      if (typeof uiEmptyRuneApplicationState === 'function') {
        uiEmptyRuneApplicationState({ keepTab: true });
      }
    }
    return opened;
  }

  window.SWRM = window.SWRM || {};
  window.SWRM.isShareReadOnly = isShareReadOnly;
  window.SWRM.applyShareReadOnlyUi = applyShareReadOnlyUi;
  window.SWRM.renderShareViewBanner = renderShareViewBanner;
  window.SWRM.openMentorRoster = openMentorRoster;
  window.SWRM.buildAccountReviewHtml = buildAccountReviewHtml;
  window.SWRM.renderAccountReviewStrip = renderAccountReviewStrip;
  window.SWRM.getShareIdFromUrl = getShareIdFromUrl;
  window.SWRM.getProfileLinkFromUrl = getProfileLinkFromUrl;
