// js/data/artifact-effects.js — artifact sub labels (SW-Exporter mapping.js artifact.effectTypes.sub)
(function () {
  /** @type {Record<number, (value: number) => string>} */
  const ARTIFACT_SUB_FORMAT = {
    200: (v) => `ATK Increased Proportional to Lost HP up to ${v}%`,
    201: (v) => `DEF Increased Proportional to Lost HP up to ${v}%`,
    202: (v) => `SPD Increased Proportional to Lost HP up to ${v}%`,
    203: (v) => `SPD Under Inability Effects +${v}%`,
    204: (v) => `ATK Increasing Effect +${v}%`,
    205: (v) => `DEF Increasing Effect +${v}%`,
    206: (v) => `SPD Increasing Effect +${v}%`,
    207: (v) => `Crit Rate Increasing Effect +${v}%`,
    208: (v) => `Damage Dealt by Counterattack +${v}%`,
    209: (v) => `Damage Dealt by Attacking Together +${v}%`,
    210: (v) => `Bomb Damage +${v}%`,
    211: (v) => `Damage Dealt by Reflected DMG +${v}%`,
    212: (v) => `Crushing Hit DMG +${v}%`,
    213: (v) => `Damage Received Under Inability Effect -${v}%`,
    214: (v) => `Received Crit DMG -${v}%`,
    215: (v) => `Life Drain +${v}%`,
    216: (v) => `HP when Revived +${v}%`,
    217: (v) => `Attack Bar when Revived +${v}%`,
    218: (v) => `Additional Damage by ${v}% of HP`,
    219: (v) => `Additional Damage by ${v}% of ATK`,
    220: (v) => `Additional Damage by ${v}% of DEF`,
    221: (v) => `Additional Damage by ${v}% of SPD`,
    222: (v) => `CRIT DMG+ up to ${v}% as the enemy's HP condition is good`,
    223: (v) => `CRIT DMG+ up to ${v}% as the enemy's HP condition is bad`,
    224: (v) => `Single-target skill CRIT DMG ${v}% on your turn`,
    225: (v) => `Counterattack/Co-op Attack DMG +${v}%`,
    226: (v) => `ATK/DEF UP Effect +${v}%`,
    300: (v) => `Damage Dealt on Fire +${v}%`,
    301: (v) => `Damage Dealt on Water +${v}%`,
    302: (v) => `Damage Dealt on Wind +${v}%`,
    303: (v) => `Damage Dealt on Light +${v}%`,
    304: (v) => `Damage Dealt on Dark +${v}%`,
    305: (v) => `Damage Received from Fire -${v}%`,
    306: (v) => `Damage Received from Water -${v}%`,
    307: (v) => `Damage Received from Wind -${v}%`,
    308: (v) => `Damage Received from Light -${v}%`,
    309: (v) => `Damage Received from Dark -${v}%`,
    400: (v) => `Skill 1 CRIT DMG +${v}%`,
    401: (v) => `Skill 2 CRIT DMG +${v}%`,
    402: (v) => `Skill 3 CRIT DMG +${v}%`,
    403: (v) => `Skill 4 CRIT DMG +${v}%`,
    404: (v) => `Skill 1 Recovery +${v}%`,
    405: (v) => `Skill 2 Recovery +${v}%`,
    406: (v) => `Skill 3 Recovery +${v}%`,
    407: (v) => `Skill 1 Accuracy +${v}%`,
    408: (v) => `Skill 2 Accuracy +${v}%`,
    409: (v) => `Skill 3 Accuracy +${v}%`,
    410: (v) => `[Skill 3/4] CRIT DMG +${v}%`,
    411: (v) => `First Attack CRIT DMG +${v}%`,
  };

  function formatArtifactSubLine(sub) {
    if (!sub) return '';
    const fn = ARTIFACT_SUB_FORMAT[sub.type];
    const v = Number(sub.value);
    if (fn && Number.isFinite(v)) return fn(v);
    return `t${sub.type} +${v}`;
  }

  window.SWRM = window.SWRM || {};
  window.SWRM.ARTIFACT_SUB_FORMAT = ARTIFACT_SUB_FORMAT;
  window.SWRM.formatArtifactSubLine = formatArtifactSubLine;
})();
