// js/features/app/changelog.js — changelog and roadmap rendering
  // ===================== CHANGELOG (STATIC, ship-time only) =====================
  function escapeChangelogText(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
  function changelogItemsForLang(rel, lang) {
    const pack = (rel.items && rel.items[lang]) || rel.items?.en;
    if (!pack) return [];
    if (Array.isArray(pack)) return pack;
    if (Array.isArray(pack.shipped)) return pack.shipped;
    return [];
  }

  function renderChangelog() {
    const list = document.getElementById('changelog-list');
    if (!list) return;
    try { localStorage.removeItem('swrm_changelog_v1'); } catch (e) { /* ignore */ }
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const releases = (window.SWRM && window.SWRM.STATIC_CHANGELOG) || [];
    if (!releases.length) {
      list.innerHTML = `<p class="settings-desc">${escapeChangelogText(t.changelogEmpty || '')}</p>`;
      return;
    }
    const lang = currentLang === 'ru' ? 'ru' : currentLang === 'fr' ? 'fr' : 'en';
    list.innerHTML = releases.map((rel) => {
      const items = changelogItemsForLang(rel, lang);
      const ul = items.length
        ? `<ul class="changelog-bullets">${items.map((tx) => `<li>${escapeChangelogText(tx)}</li>`).join('')}</ul>`
        : `<p class="settings-desc">${escapeChangelogText(t.changelogEmpty || '')}</p>`;
      return `<article class="changelog-release"><h3 class="changelog-release-date">${escapeChangelogText(rel.date)}</h3>${ul}</article>`;
    }).join('');
  }

  function renderRoadmap() {
    const list = document.getElementById('changelog-roadmap-list');
    if (!list) return;
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const lang = currentLang === 'ru' ? 'ru' : currentLang === 'fr' ? 'fr' : 'en';
    const items =
      (window.SWRM && window.SWRM.STATIC_ROADMAP && window.SWRM.STATIC_ROADMAP[lang]) ||
      (window.SWRM && window.SWRM.STATIC_ROADMAP && window.SWRM.STATIC_ROADMAP.en) ||
      [];
    if (!items.length) {
      list.innerHTML = `<p class="settings-desc">${escapeChangelogText(t.changelogRoadmapEmpty || '')}</p>`;
      return;
    }
    list.innerHTML = `<article class="changelog-release changelog-release--roadmap"><ul class="changelog-bullets">${items.map((tx) => `<li>${escapeChangelogText(tx)}</li>`).join('')}</ul></article>`;
  }
