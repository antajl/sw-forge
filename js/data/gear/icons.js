// js/data/gear/icons.js — artifact (SWARFARM) & relic (local assets/relics/) icons
(function () {
  const ARTIFACT_IMG_BASE = 'static/herders/images/artifacts/';
  const RELIC_LOCAL_BASE = 'assets/relics/';

  const ARTIFACT_ELEMENT_KEY = {
    1: 'fire',
    2: 'water',
    3: 'wind',
    4: 'light',
    5: 'dark',
    6: 'dark',
  };

  const ARTIFACT_ARCHETYPE_KEY = {
    1: 'hp',
    2: 'attack',
    3: 'defense',
    4: 'support',
    5: 'support',
  };

  function assetUrl(relativePath) {
    const db = window.SWRM_MONSTER_DB;
    if (db && typeof db.swarfarmAssetUrl === 'function') {
      return db.swarfarmAssetUrl(relativePath);
    }
    const rel = String(relativePath || '').replace(/^\//, '');
    return `https://swarfarm.com/${rel}`;
  }

  function artifactIconKey(artifact) {
    if (!artifact) return '';
    const slot = Number(artifact.slot);
    const gearType = Number(artifact.gearType);
    const attr = Number(artifact.attribute);
    if (slot === 2 || gearType === 2 || gearType === 5) {
      return ARTIFACT_ARCHETYPE_KEY[gearType] || '';
    }
    if (attr === 6 || gearType === 5) return 'dark';
    return ARTIFACT_ELEMENT_KEY[attr] || '';
  }

  function artifactIconUrl(artifact) {
    const key = artifactIconKey(artifact);
    if (!key) return '';
    return assetUrl(`${ARTIFACT_IMG_BASE}${key}.png`);
  }

  function relicLocalCandidates(relic) {
    if (!relic) return [];
    const out = [];
    const type = Number(relic.relicType);
    if (Number.isFinite(type) && type > 0) {
      out.push(`${RELIC_LOCAL_BASE}${type}.png`);
    }
    const cat = String(relic.category || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    if (cat) out.push(`${RELIC_LOCAL_BASE}${cat}.png`);
    out.push(`${RELIC_LOCAL_BASE}default.png`);
    return [...new Set(out)];
  }

  function relicIconUrl(relic) {
    const paths = relicLocalCandidates(relic);
    return paths.length ? paths[0] : '';
  }

  function escAttr(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;');
  }

  function gearCategoryCellHtml(iconUrl, label, iconPaths) {
    const text = String(label || '—');
    const paths = Array.isArray(iconPaths) ? iconPaths : iconUrl ? [iconUrl] : [];
    if (!paths.length) {
      return `<span class="gear-table-category"><span class="gear-table-category__label">${escAttr(text)}</span></span>`;
    }
    const src = escAttr(paths[0]);
    const fallback =
      paths.length > 1
        ? ` onerror="var p=this.dataset.fallback&&this.dataset.fallback.split('|');var i=+this.dataset.fi||0;if(i<p.length-1){this.dataset.fi=i+1;this.src=p[i+1];}else{this.hidden=true;}" data-fallback="${escAttr(paths.join('|'))}" data-fi="0"`
        : ' onerror="this.hidden=true"';
    return `<span class="gear-table-category"><img class="gear-table-category__icon" src="${src}" alt="" width="24" height="24" loading="lazy" decoding="async" referrerpolicy="no-referrer"${fallback} /><span class="gear-table-category__label">${escAttr(text)}</span></span>`;
  }

  window.SWRM = window.SWRM || {};
  window.SWRM.artifactIconUrl = artifactIconUrl;
  window.SWRM.relicIconUrl = relicIconUrl;
  window.SWRM.relicLocalIconCandidates = relicLocalCandidates;
  function gearGradeTagHtml(gradeStr) {
    const gradeKey = String(gradeStr || '').trim();
    if (!gradeKey || gradeKey === '—') return '—';
    const gradeClass = { Legend: 'legend', Hero: 'hero', Rare: 'rare' }[gradeKey] || 'grade-tag--other';
    const esc = (s) =>
      String(s || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    return `<span class="grade-tag ${gradeClass}"><span class="grade-tag__lbl">${esc(gradeKey)}</span></span>`;
  }

  window.SWRM.gearCategoryCellHtml = gearCategoryCellHtml;
  window.SWRM.gearGradeTagHtml = gearGradeTagHtml;
})();
