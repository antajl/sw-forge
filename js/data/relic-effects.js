// js/data/relic-effects.js — relic labels (SWEX + user-verified examples only)
(function () {
  const RELIC_PRI_PCT = { 100: 'hp', 101: 'atk', 102: 'def' };

  /** In-game category name — only types confirmed against real relic + JSON. */
  const RELIC_CATEGORY_BY_TYPE = {
    6: 'Resolute',
    13: 'Primal',
  };

  const RELIC_CATEGORY_VERIFIED = new Set([6, 13]);

  /** Verified secondary wording (sec_effect = [type, threshold, bonus%]). */
  const RELIC_SEC_FORMAT = {
    6: (threshold) =>
      `DMG Taken (-1%) per (${threshold}) MAX HP at the start of battle`,
    13: (threshold, pct) =>
      `MAX HP +(${pct}%) per (${threshold}) ATK at the start of battle`,
  };

  const RELIC_SEC_VERIFIED = new Set([6, 13]);

  function isRelicCategoryVerified(typeId) {
    return RELIC_CATEGORY_VERIFIED.has(Number(typeId));
  }

  function relicCategoryName(typeId) {
    const id = Number(typeId);
    if (!RELIC_CATEGORY_VERIFIED.has(id)) return '';
    return RELIC_CATEGORY_BY_TYPE[id] || '';
  }

  function formatRelicPriLine(pri) {
    if (!pri) return '';
    const key = RELIC_PRI_PCT[pri.type];
    if (!key) return '';
    const name = key === 'hp' ? 'HP' : key === 'atk' ? 'ATK' : 'DEF';
    return `${name} +${pri.value}%`;
  }

  function formatRelicSecLine(relic) {
    if (!relic || !relic.sec) return '—';
    const raw = relic.sec.raw;
    const type = Number(relic.relicType);
    const threshold = Number(relic.sec.value);
    const pct =
      Array.isArray(raw) && raw.length >= 3 && Number.isFinite(Number(raw[2]))
        ? Number(raw[2])
        : null;
    if (!RELIC_SEC_VERIFIED.has(type) || !Number.isFinite(threshold)) return '—';
    const fn = RELIC_SEC_FORMAT[type];
    if (!fn) return '—';
    if (type === 13) {
      if (!Number.isFinite(pct)) return '—';
      return fn(threshold, pct);
    }
    return fn(threshold);
  }

  window.SWRM = window.SWRM || {};
  window.SWRM.RELIC_CATEGORY_BY_TYPE = RELIC_CATEGORY_BY_TYPE;
  window.SWRM.isRelicCategoryVerified = isRelicCategoryVerified;
  window.SWRM.relicCategoryName = relicCategoryName;
  window.SWRM.formatRelicPriLine = formatRelicPriLine;
  window.SWRM.formatRelicSecLine = formatRelicSecLine;
})();
