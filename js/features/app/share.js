// js/features/app/share.js — Share Profile (read-only links via Worker + D1)
  const SHARE_QUERY_KEY = 's';
  const SHARE_EXPIRY_DAYS = 90;
  let shareReadOnly = false;
  let shareViewWizardName = '';

  function shareExpiryUnix() {
    return Math.floor(Date.now() / 1000) + SHARE_EXPIRY_DAYS * 24 * 60 * 60;
  }

  function buildShareSlimPayload(fullInventory) {
    const json = activeSwexJson;
    if (!json || !Array.isArray(json.unit_list)) return null;
    const runeById = new Map();
    for (const r of allRunes || []) {
      if (r && r.id != null) runeById.set(Number(r.id), r);
    }
    const units = json.unit_list
      .filter((u) => u && u.unit_master_id != null)
      .filter((u) => fullInventory || (Array.isArray(u.runes) && u.runes.length > 0))
      .map((u) => {
        const runes = (u.runes || []).map((raw) => {
          const rid = raw.rune_id != null ? Number(raw.rune_id) : null;
          const parsed = rid != null && runeById.has(rid) ? runeById.get(rid) : null;
          if (parsed) {
            const raw = parsed._raw;
            if (raw && typeof raw === 'object') {
              return {
                rune_id: rid,
                slot_no: raw.slot_no ?? parsed.slot,
                set_id: raw.set_id ?? parsed.setId,
                upgrade_curr: raw.upgrade_curr ?? parsed.level,
                extra: raw.extra,
                class: raw.class,
                rank: raw.rank,
                pri_eff: raw.pri_eff ?? [parsed.mainType, parsed.mainVal],
                prefix_eff: raw.prefix_eff,
                sec_eff: raw.sec_eff,
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
    return { wizard_name: String(wizardName || '').trim(), unit_list: units };
  }

  async function postShareProfile(fullInventory) {
    const api = typeof SWRM_API === 'string' ? SWRM_API : '';
    if (!api) throw new Error('API not configured');
    const data = buildShareSlimPayload(fullInventory);
    if (!data || !data.unit_list.length) throw new Error('No units to share');
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

  async function copyShareLink(fullInventory) {
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const id = await postShareProfile(fullInventory);
    const url = sharePageUrl(id);
    await navigator.clipboard.writeText(url);
    if (typeof showToast === 'function') {
      showToast(t.shareLinkCopied || 'Link copied!', 'success');
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
      bar.className = 'share-view-banner';
      const chrome = document.querySelector('.site-chrome-sticky');
      if (chrome) chrome.insertAdjacentElement('afterend', bar);
      else document.body.prepend(bar);
    }
    const name = escapeHtml(shareViewWizardName || t.shareUnknownWizard || 'another player');
    const tpl = t.shareViewingBanner || 'You are viewing {name}\'s profile (read-only).';
    bar.innerHTML = `<div class="share-view-banner__inner">
      <p class="share-view-banner__text">${tpl.replace(/\{name\}/g, name)}</p>
      <button type="button" class="btn-secondary btn-sm" id="share-view-exit-btn">${escapeHtml(t.shareLoadOwn || 'Load your SWEX')}</button>
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
    const t0 = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
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
    const shareBtn = document.getElementById('share-profile-btn');
    const shareFull = document.getElementById('share-full-inventory');
    if (shareBtn) shareBtn.disabled = shareReadOnly;
    if (shareFull) shareFull.disabled = shareReadOnly;
    document.querySelectorAll('.db-slot-btn, #btn-upload-slot, #btn-demo-load').forEach((el) => {
      if (el) el.disabled = shareReadOnly;
    });
    const rulesRoot = document.getElementById('tab-settings');
    if (rulesRoot) {
      rulesRoot.querySelectorAll('input, select, textarea, button').forEach((el) => {
        if (el.id === 'share-view-exit-btn') return;
        el.disabled = shareReadOnly;
      });
    }
  }

  function bindShareProfileUi() {
    document.getElementById('share-profile-btn')?.addEventListener('click', async () => {
      const full = document.getElementById('share-full-inventory')?.checked === true;
      const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
      try {
        await copyShareLink(full);
      } catch (e) {
        if (typeof showToast === 'function') {
          showToast((t.shareFailed || 'Share failed') + (e.message ? `: ${e.message}` : ''), 'error');
        }
      }
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
