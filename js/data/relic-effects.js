// js/data/relic-effects.js — relic primary & unique (secondary) property labels
// Category ids match SWEX relic.type / sec_effect[0]. Wording follows in-game templates
// (SW-Exporter has no relic block yet; artifact subs: mapping.js artifact.effectTypes.sub).
(function () {
  const RELIC_PRI_PCT = { 100: 'hp', 101: 'atk', 102: 'def' };

  /**
   * SWEX relic.type = unique property category. sec_effect[1] is the threshold shown in-game
   * (e.g. 27000 MAX HP for Resolute), not a decoded %.
   */
  const RELIC_SEC_BY_CATEGORY = {
    6: (raw) => `DMG taken -1% per ${raw} MAX HP at the start of battle`,
    11: (raw) => `HP +1% per ${raw} HP at the start of battle`,
    12: (raw) => `DMG dealt +1% per ${raw} ATK at the start of battle`,
    13: (raw) => `CRI DMG +1% per ${raw} ATK at the start of battle`,
    14: (raw) => `SPD +1 per ${raw} SPD at the start of battle`,
    15: (raw) => `HP +1% per ${raw} HP at the start of battle`,
    16: (raw) => `ATK +1% per ${raw} DEF at the start of battle`,
  };

  function formatRelicPriLine(pri) {
    if (!pri) return '';
    const key = RELIC_PRI_PCT[pri.type];
    if (!key) return '';
    const name = key === 'hp' ? 'HP' : key === 'atk' ? 'ATK' : 'DEF';
    return `${name} +${pri.value}%`;
  }

  function formatRelicSecLine(relic) {
    if (!relic || !relic.sec) return '—';
    const cat = Number(relic.relicType);
    const raw = Number(relic.sec.value);
    if (!Number.isFinite(raw)) return '—';
    const fn = RELIC_SEC_BY_CATEGORY[cat];
    if (fn) return fn(raw);
    return `Unique effect (${raw})`;
  }

  window.SWRM = window.SWRM || {};
  window.SWRM.RELIC_SEC_BY_CATEGORY = RELIC_SEC_BY_CATEGORY;
  window.SWRM.formatRelicPriLine = formatRelicPriLine;
  window.SWRM.formatRelicSecLine = formatRelicSecLine;
})();
