// js/features/runes/utils.js — shared UI helpers
  /** Parse stored SWEX JSON (string or object) and populate allRunes. */
  function tryHydrateRunesFromJsonText(raw) {
    if (raw == null) return false;
    if (typeof raw === 'string' && raw.trim() === '') return false;
    let obj;
    try {
      obj = typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch (e) {
      console.error('Stored data is not valid JSON:', e);
      return false;
    }
    if (!obj || typeof obj !== 'object') return false;
    const runes = parseSWEX(obj);
    if (!runes.length) return false;
    allRunes = runes;
    rebuildUnitsFromSwex(obj);
    reprocess();
    return true;
  }

  function rebuildUnitsFromSwex(json) {
    activeSwexJson = json && typeof json === 'object' ? json : null;
    if (!activeSwexJson || typeof parseUnits !== 'function') {
      allUnits = [];
      return;
    }
    const runeById = new Map();
    for (const r of allRunes) {
      if (r && r.id != null) runeById.set(Number(r.id), r);
    }
    allUnits = parseUnits(activeSwexJson, { sixStarOnly: false, runeById });
  }

  /**
   * @param {object} [meta]
   * @param {{ keepTab?: boolean }} [options] if keepTab, do not switch to Dashboard (e.g. user is in App Settings)
   */
  function uiAfterSuccessfulRuneRestore(meta, options = {}) {
    const keepTab = options.keepTab === true;
    document.getElementById('upload-prompt').classList.add('hidden');
    if (!keepTab) {
      const fromHash = mainTabIdFromHash();
      if (fromHash) {
        showMainTab(fromHash);
      } else {
        showMainTab('dashboard', { writeHash: true });
      }
    }
    if (meta && meta.name) {
      console.log(`Auto-loaded runes from ${meta.name}${meta.id != null ? ` (Data ${meta.id})` : ''}`);
    }
    syncDemoBannerVisibility();
  }

  function uiShowUploadPrompt() {
    document.getElementById('upload-prompt').classList.remove('hidden');
  }

  function clearLocalStorageRuneBackup() {
    localStorage.removeItem('loadedRunes');
    localStorage.removeItem('loadedRunesName');
    localStorage.removeItem('loadedRunesDate');
    localStorage.removeItem('loadedRunesStorage');
    localStorage.removeItem('loadedRunesSize');
  }

  /**
   * No runes in memory; reset charts/tables.
   * Default: Guide tab + upload overlay. With keepTab: stay on current tab, no overlay (e.g. slot delete from Settings).
   */
  function uiEmptyRuneApplicationState(options = {}) {
    const keepTab = options.keepTab === true;
    allRunes = [];
    allUnits = [];
    activeSwexJson = null;
    processedRunes = [];
    if (!keepTab) {
      showMainTab('guide', { writeHash: true });
      document.getElementById('upload-prompt').classList.remove('hidden');
    } else {
      document.getElementById('upload-prompt').classList.add('hidden');
    }
    const accCt = document.getElementById('dashboard-account-run-count');
    if (accCt) accCt.textContent = '\u2014';
    document.getElementById('rune-tbody').innerHTML = '';
    renderDashboard([]);
    renderTable([]);
    renderMonstersPanel();
  }

  function normalizeDbSlot(raw) {
    const id = Number(raw.id);
    return {
      id: Number.isFinite(id) ? id : 0,
      name: raw.name != null ? String(raw.name) : '',
      uploadedAt: raw.uploadedAt != null ? String(raw.uploadedAt) : '',
      active: !!raw.active,
      wizardName: raw.wizardName != null ? String(raw.wizardName) : '',
      wizardLevel: raw.wizardLevel != null && raw.wizardLevel !== '' && Number.isFinite(Number(raw.wizardLevel))
        ? Number(raw.wizardLevel) : null,
      wizardId: raw.wizardId != null ? String(raw.wizardId) : '',
      monsterCount: raw.monsterCount != null && Number.isFinite(Number(raw.monsterCount))
        ? Number(raw.monsterCount) : null,
      inventoryRuneCount: raw.inventoryRuneCount != null && Number.isFinite(Number(raw.inventoryRuneCount))
        ? Number(raw.inventoryRuneCount) : null,
      runeCount: (() => {
        if (raw.runeCount != null && Number.isFinite(Number(raw.runeCount))) return Number(raw.runeCount);
        if (raw.heroRuneCount != null && Number.isFinite(Number(raw.heroRuneCount))) return Number(raw.heroRuneCount);
        return null;
      })(),
    };
  }

  function defaultEmptyDbSlotsMeta() {
    return Array.from({ length: 4 }, (_, i) =>
      normalizeDbSlot({ id: i + 1, name: '', uploadedAt: '', active: i === 0 }));
  }

  function applySlotSummaryFromJson(slot, displayName, jsonObj) {
    slot.name = displayName;
    slot.uploadedAt = new Date().toLocaleString();
    const sum = extractSwexSummary(jsonObj);
    if (sum) {
      slot.wizardName = sum.wizardName || '';
      slot.wizardLevel = sum.wizardLevel;
      slot.wizardId = sum.wizardId || '';
      slot.monsterCount = sum.monsterCount;
      slot.inventoryRuneCount = sum.inventoryRuneCount;
    } else {
      slot.wizardName = '';
      slot.wizardLevel = null;
      slot.wizardId = '';
      slot.monsterCount = null;
      slot.inventoryRuneCount = null;
    }
    slot.runeCount = countAllSwexRunes(jsonObj);
  }

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatSlotSummaryLine(slot, t) {
    if (!slot.name) return '';
    const parts = [];
    if (slot.wizardName) parts.push(escapeHtml(slot.wizardName));
    if (slot.wizardLevel != null) {
      parts.push(`${escapeHtml(t.lvAbbr || 'Lv.')}${escapeHtml(slot.wizardLevel)}`);
    }
    if (slot.runeCount != null) {
      parts.push(`${escapeHtml(String(slot.runeCount))}\u00A0${escapeHtml(t.runesWord || t.runesHeroPlus || 'runes')}`);
    }
    if (slot.monsterCount != null) {
      parts.push(`${escapeHtml(String(slot.monsterCount))}\u00A0${escapeHtml(t.monsShort || 'mons')}`);
    }
    if (!parts.length && slot.wizardId) {
      parts.push(`ID\u00A0${escapeHtml(slot.wizardId)}`);
    }
    if (!parts.length) return '';
    return `<div class="db-slot-summary">${parts.join(' · ')}</div>`;
  }

  /**
   * In-app toast (styled panel, bottom-right). Replaces browser alert for non-blocking notices.
   * @param {string} message
   * @param {{ type?: 'success'|'info'|'error', duration?: number }} [options] duration ms; 0 = no auto-dismiss
   */
  function showSwrmToast(message, options = {}) {
    const type = options.type || 'info';
    const duration = options.duration !== undefined ? options.duration : 5200;
    const host = document.getElementById('swrm-toast-host');
    if (!host || !message) return;

    const icons = { success: '\u2713', info: '\u25C6', error: '\u0021' };
    const el = document.createElement('div');
    el.className = `swrm-toast swrm-toast--${type}`;
    el.setAttribute('role', 'status');

    const iconEl = document.createElement('span');
    iconEl.className = 'swrm-toast-icon';
    iconEl.textContent = icons[type] || icons.info;

    const msgEl = document.createElement('span');
    msgEl.className = 'swrm-toast-msg';
    msgEl.textContent = message;

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'swrm-toast-close';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.textContent = '\u00D7';

    el.append(iconEl, msgEl, closeBtn);
    host.appendChild(el);

    let hideTimer = null;
    const dismiss = () => {
      if (hideTimer) {
        clearTimeout(hideTimer);
        hideTimer = null;
      }
      const motionApi = window.SWRM_MOTION;
      if (motionApi && motionApi.toastOut(el, () => el.remove())) return;
      el.classList.remove('swrm-toast--in');
      el.classList.add('swrm-toast--out');
      setTimeout(() => el.remove(), 320);
    };

    closeBtn.addEventListener('click', dismiss);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const motionApi = window.SWRM_MOTION;
        if (!motionApi || !motionApi.toastIn(el)) el.classList.add('swrm-toast--in');
      });
    });
    if (duration > 0) hideTimer = setTimeout(dismiss, duration);
  }

  const SWRM_FLOAT_TIP_SHOW_MS = 220;
  const SWRM_FLOAT_TIP_HIDE_MS = 80;
  let swrmFloatTipEl = null;
  let swrmFloatTipShowTimer = null;
  let swrmFloatTipHideTimer = null;
  let swrmFloatTipAnchor = null;

  function ensureSwrmFloatTipEl() {
    if (swrmFloatTipEl) return swrmFloatTipEl;
    const el = document.createElement('d' + 'iv');
    el.id = 'swrm-floating-tip';
    el.className = 'swrm-floating-tip';
    el.setAttribute('role', 'tooltip');
    el.hidden = true;
    document.body.appendChild(el);
    swrmFloatTipEl = el;
    return el;
  }

  function positionSwrmFloatTip(anchor) {
    const tip = ensureSwrmFloatTipEl();
    if (!anchor || tip.hidden) return;
    const r = anchor.getBoundingClientRect();
    const pad = 8;
    const gap = 10;
    tip.style.left = '0px';
    tip.style.top = '0px';
    tip.hidden = false;
    const tw = tip.offsetWidth;
    const th = tip.offsetHeight;
    let left = r.left + r.width / 2 - tw / 2;
    left = Math.max(pad, Math.min(left, window.innerWidth - tw - pad));
    let top = r.top - th - gap;
    if (top < pad) top = r.bottom + gap;
    tip.style.left = `${Math.round(left)}px`;
    tip.style.top = `${Math.round(top)}px`;
  }

  function hideSwrmFloatTip(immediate) {
    if (swrmFloatTipShowTimer) {
      clearTimeout(swrmFloatTipShowTimer);
      swrmFloatTipShowTimer = null;
    }
    if (swrmFloatTipHideTimer) {
      clearTimeout(swrmFloatTipHideTimer);
      swrmFloatTipHideTimer = null;
    }
    const tip = swrmFloatTipEl;
    if (!tip) return;
    const finish = () => {
      tip.hidden = true;
      tip.classList.remove('swrm-floating-tip--in');
      tip.textContent = '';
      swrmFloatTipAnchor = null;
    };
    if (immediate) {
      finish();
      return;
    }
    const motionApi = window.SWRM_MOTION;
    if (motionApi && motionApi.floatTipOut(tip, finish)) return;
    tip.classList.remove('swrm-floating-tip--in');
    swrmFloatTipHideTimer = window.setTimeout(finish, SWRM_FLOAT_TIP_HIDE_MS);
  }

  function showSwrmFloatTip(anchor, text) {
    const tipText = String(text || '').replace(/\s+/g, ' ').trim();
    if (!anchor || !tipText) return;
    if (swrmFloatTipShowTimer) {
      clearTimeout(swrmFloatTipShowTimer);
      swrmFloatTipShowTimer = null;
    }
    if (swrmFloatTipHideTimer) {
      clearTimeout(swrmFloatTipHideTimer);
      swrmFloatTipHideTimer = null;
    }
    swrmFloatTipAnchor = anchor;
    swrmFloatTipShowTimer = window.setTimeout(() => {
      swrmFloatTipShowTimer = null;
      if (swrmFloatTipAnchor !== anchor) return;
      const tip = ensureSwrmFloatTipEl();
      tip.textContent = tipText;
      tip.hidden = false;
      requestAnimationFrame(() => {
        positionSwrmFloatTip(anchor);
        const motionApi = window.SWRM_MOTION;
        if (!motionApi || !motionApi.floatTipIn(tip)) tip.classList.add('swrm-floating-tip--in');
      });
    }, SWRM_FLOAT_TIP_SHOW_MS);
  }

  function setSwrmFloatTipTarget(el, text) {
    if (!el) return;
    const tipText = String(text || '').replace(/\s+/g, ' ').trim();
    if (tipText) {
      el.setAttribute('data-swrm-tip', tipText);
      el.removeAttribute('title');
    } else {
      el.removeAttribute('data-swrm-tip');
      el.removeAttribute('title');
    }
  }

  function initSwrmFloatingTips() {
    if (initSwrmFloatingTips._done) return;
    initSwrmFloatingTips._done = true;

    const onEnter = (e) => {
      const t = e.target && e.target.closest ? e.target.closest('[data-swrm-tip]') : null;
      if (!t) return;
      showSwrmFloatTip(t, t.getAttribute('data-swrm-tip'));
    };
    const onLeave = (e) => {
      const t = e.target && e.target.closest ? e.target.closest('[data-swrm-tip]') : null;
      if (!t) return;
      const rel = e.relatedTarget;
      if (rel && t.contains(rel)) return;
      if (swrmFloatTipAnchor === t) hideSwrmFloatTip(false);
    };
    const onFocusIn = (e) => {
      const t = e.target && e.target.closest ? e.target.closest('[data-swrm-tip]') : null;
      if (t) showSwrmFloatTip(t, t.getAttribute('data-swrm-tip'));
    };
    const onFocusOut = (e) => {
      const t = e.target && e.target.closest ? e.target.closest('[data-swrm-tip]') : null;
      if (t && swrmFloatTipAnchor === t) hideSwrmFloatTip(false);
    };

    document.addEventListener('mouseover', onEnter);
    document.addEventListener('mouseout', onLeave);
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    window.addEventListener(
      'scroll',
      () => {
        if (swrmFloatTipAnchor) positionSwrmFloatTip(swrmFloatTipAnchor);
      },
      true,
    );
    window.addEventListener('resize', () => {
      if (swrmFloatTipAnchor) positionSwrmFloatTip(swrmFloatTipAnchor);
    });
  }
