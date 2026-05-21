// js/data/relics/effects.js — relic labels (only user-confirmed mappings)
(function () {
  const RELIC_PRI_PCT = { 100: 'hp', 101: 'atk', 102: 'def' };

  /** Category name only when confirmed with in-game name + matching JSON type. */
  const RELIC_CATEGORY_BY_TYPE = {
    6: 'Resolute',
    12: 'Timeless',
    13: 'Primal',
    14: 'Primal',
    16: 'Restore',
  };

  const RELIC_CATEGORY_VERIFIED = new Set([6, 12, 13, 14, 16]);

  const RELIC_SEC_FORMAT = {
    6: (threshold) =>
      `DMG Taken (-1%) per (${threshold}) MAX HP at the start of battle`,
    12: (threshold, pct) =>
      `DEF +(${pct}%) per (${threshold}) MAX HP at the start of battle`,
    13: (threshold, pct) =>
      `MAX HP +(${pct}%) per (${threshold}) ATK at the start of battle`,
    14: (threshold, pct) =>
      `MAX HP +(${pct}%) per (${threshold}) SPD at the start of battle`,
    16: (threshold, pct) =>
      `HP Recovery and Shield amount +(${pct}%) per (${threshold}) MAX HP at the start of battle`,
  };

  /** sec_effect[2] = bonus % shown in-game. */
  const RELIC_SEC_USES_PCT = new Set([12, 13, 14, 16]);

  const RELIC_SEC_VERIFIED = new Set([6, 12, 13, 14, 16]);

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
    if (RELIC_SEC_USES_PCT.has(type)) {
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
