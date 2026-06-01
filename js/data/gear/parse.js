// js/data/gear/parse.js — SWEX artifacts & relics → normalized gear + panel stat bonuses
(function () {
  const STAT = window.SWRM && window.SWRM.STAT_NAMES;
  const GRADE_SHORT = (window.SWRM && window.SWRM.GRADE_SHORT) || { 3: 'Rare', 4: 'Hero', 5: 'Legend' };
  const GRADE_NAMES = (window.SWRM && window.SWRM.GRADE_NAMES) || {
    1: 'Common',
    2: 'Magic',
    3: 'Rare',
    4: 'Hero',
    5: 'Legend',
  };

  /** Artifact primary: flat HP / ATK / DEF (SWEX 100–102). */
  const ARTIFACT_PRI_FLAT = { 100: 'hp', 101: 'atk', 102: 'def' };

  const ARTIFACT_SEC_PANEL_PCT = {};

  const RELIC_PRI_PCT = { 100: 'hp', 101: 'atk', 102: 'def' };

  /** SWEX attribute on element artifacts (slot 1). */
  const ARTIFACT_ELEMENT = {
    1: 'Water',
    2: 'Fire',
    3: 'Wind',
    4: 'Light',
    5: 'Dark',
    6: 'Intangible',
    98: 'Intangible',
  };

  /**
   * SWEX `type` on the artifact record: 1 = Attribute piece, 2 = Type piece (not HP/ATK/DEF/Support).
   * Archetype for Type pieces is `unit_style` (1–4; 98 = Intangible in newer exports).
   */
  const ARTIFACT_PIECE_TYPE = { ATTRIBUTE: 1, TYPE: 2 };

  /** Monster archetype on Type artifacts (`unit_style`). */
  const ARTIFACT_ARCHETYPE = {
    1: 'Attack',
    2: 'Defense',
    3: 'HP',
    4: 'Support',
    5: 'Intangible',
    98: 'Intangible',
  };

  const RELIC_WEAR_MAX = 100;

  function normalizeGradeRank(rank) {
    const n = Number(rank);
    if (!Number.isFinite(n) || n <= 0) return 0;
    if (n >= 1 && n <= 5) return n;
    if (n >= 11 && n <= 15) return n - 10;
    const mod = n % 10;
    if (n >= 10 && mod >= 1 && mod <= 5) return mod;
    return n;
  }

  function gearGradeStr(rankRaw) {
    const grade = normalizeGradeRank(rankRaw);
    if (grade >= 1 && grade <= 5) {
      return GRADE_SHORT[grade] || GRADE_NAMES[grade] || `r${rankRaw}`;
    }
    return rankRaw != null && rankRaw !== '' ? `r${rankRaw}` : '';
  }

  function effectTuple(arr) {
    if (!Array.isArray(arr) || arr.length < 2) return null;
    const type = Number(arr[0]);
    const value = Number(arr[1]);
    if (!Number.isFinite(type)) return null;
    return { type, value: Number.isFinite(value) ? value : 0, raw: arr };
  }

  function statLabel(typeId) {
    if (STAT && STAT[typeId]) return STAT[typeId];
    return `t${typeId}`;
  }

  function artifactPieceKind(raw) {
    const pieceType = Number(raw.type);
    if (pieceType === ARTIFACT_PIECE_TYPE.TYPE) return 'type';
    if (pieceType === ARTIFACT_PIECE_TYPE.ATTRIBUTE) return 'attribute';
    const slot = Number(raw.slot);
    if (slot === 2) return 'type';
    if (slot === 1) return 'attribute';
    return '';
  }

  function artifactCategory(raw) {
    const kind = artifactPieceKind(raw);
    const attr = Number(raw.attribute);
    const unitStyle = Number(raw.unit_style);
    if (kind === 'type') {
      return ARTIFACT_ARCHETYPE[unitStyle] || (Number.isFinite(unitStyle) ? `Type ${unitStyle}` : 'Type');
    }
    if (kind === 'attribute') {
      return ARTIFACT_ELEMENT[attr] || (Number.isFinite(attr) ? `Element ${attr}` : 'Element');
    }
    return 'Artifact';
  }

  function relicCategory(relicType) {
    const fn =
      window.SWRM && typeof window.SWRM.relicCategoryName === 'function'
        ? window.SWRM.relicCategoryName
        : null;
    return fn ? fn(relicType) : '';
  }

  function relicCategoryIsVerified(relicType) {
    const fn =
      window.SWRM && typeof window.SWRM.isRelicCategoryVerified === 'function'
        ? window.SWRM.isRelicCategoryVerified
        : null;
    return fn ? fn(relicType) : false;
  }

  function parseArtifact(raw) {
    if (!raw || raw.rid == null) return null;
    const pri = effectTuple(raw.pri_effect);
    const secs = (raw.sec_effects || []).map(effectTuple).filter(Boolean);
    const slot = Number(raw.slot) || 0;
    const rankRaw =
      raw.natural_rank != null && raw.natural_rank !== ''
        ? raw.natural_rank
        : raw.rank;
    const pieceType = Number(raw.type) || 0;
    const unitStyle = Number(raw.unit_style) || 0;
    return {
      kind: 'artifact',
      rid: raw.rid,
      occupiedId: raw.occupied_id != null ? Number(raw.occupied_id) : null,
      slot,
      pieceType,
      unitStyle,
      /** @deprecated use pieceType — kept for callers expecting raw SWEX `type`. */
      gearType: pieceType,
      attribute: Number(raw.attribute) || 0,
      category: artifactCategory(raw),
      grade: normalizeGradeRank(rankRaw),
      gradeStr: gearGradeStr(rankRaw),
      pri,
      secs,
      locked: !!raw.locked,
    };
  }

  function parseRelic(raw) {
    if (!raw || raw.rid == null) return null;
    const pri = effectTuple(raw.pri_effect);
    const sec = effectTuple(raw.sec_effect);
    const relicType = Number(raw.type) || 0;
    const rankRaw = raw.rank != null ? raw.rank : raw.natural_rank;
    const grade = normalizeGradeRank(rankRaw);
    const durability = Number(raw.durability);
    return {
      kind: 'relic',
      rid: raw.rid,
      occupiedId: raw.occupied_id != null ? Number(raw.occupied_id) : null,
      relicType,
      category: relicCategory(relicType),
      categoryVerified: relicCategoryIsVerified(relicCategory(relicType)),
      level: Number(raw.upgrade_curr) || 0,
      grade,
      gradeStr: grade > 0 ? gearGradeStr(rankRaw) : '',
      durability: Number.isFinite(durability) ? durability : null,
      durabilityMax: 3,
      pri,
      sec,
      locked: !!raw.locked,
    };
  }

  function artifactPanelBonuses(artifact) {
    const flat = {};
    const pct = {};
    if (!artifact) return { flat, pct };
    const pri = artifact.pri;
    if (pri) {
      const key = ARTIFACT_PRI_FLAT[pri.type];
      if (key && pri.value) flat[key] = (flat[key] || 0) + pri.value;
    }
    for (const s of artifact.secs || []) {
      const key = ARTIFACT_SEC_PANEL_PCT[s.type];
      if (key && s.value) pct[key] = (pct[key] || 0) + s.value;
    }
    return { flat, pct };
  }

  function relicPanelBonuses(relic) {
    const flat = {};
    const pct = {};
    if (!relic) return { flat, pct };
    const pri = relic.pri;
    if (pri) {
      const key = RELIC_PRI_PCT[pri.type];
      if (key && pri.value) pct[key] = (pct[key] || 0) + pri.value;
    }
    return { flat, pct };
  }

  function sumGearBonusesForKey(statKey, unit) {
    let flat = 0;
    let pct = 0;
    if (!unit || !statKey) return { flat, pct };
    for (const a of unit.artifacts || []) {
      const b = artifactPanelBonuses(a);
      flat += b.flat[statKey] || 0;
      pct += b.pct[statKey] || 0;
    }
    for (const r of unit.relics || []) {
      const b = relicPanelBonuses(r);
      flat += b.flat[statKey] || 0;
      pct += b.pct[statKey] || 0;
    }
    return { flat, pct };
  }

  function formatEffectLine(effect, opts) {
    if (!effect) return '';
    const o = opts || {};
    const type = effect.type;
    const val = effect.value;
    if (o.kind === 'artifact') {
      const key = ARTIFACT_PRI_FLAT[type];
      if (key) {
        const name = key === 'hp' ? 'HP' : key === 'atk' ? 'ATK' : 'DEF';
        return `${name} +${val}`;
      }
    } else if (o.kind === 'relic') {
      if (window.SWRM && typeof window.SWRM.formatRelicPriLine === 'function') {
        return window.SWRM.formatRelicPriLine(effect);
      }
    }
    if (STAT && STAT[type]) return `${statLabel(type)} +${val}`;
    return `t${type} +${val}`;
  }

  function countRelicWearers(json) {
    const counts = new Map();
    for (const unit of (json && json.unit_list) || []) {
      for (const raw of (unit && unit.relics) || []) {
        if (raw.rid == null) continue;
        counts.set(raw.rid, (counts.get(raw.rid) || 0) + 1);
      }
    }
    return counts;
  }

  function formatRelicDurability(relic) {
    if (!relic || relic.durability == null) return '—';
    const max = relic.durabilityMax != null ? relic.durabilityMax : 3;
    return `${relic.durability}/${max}`;
  }

  function formatRelicWearCount(relic) {
    const n = relic && Number(relic.wearCount);
    const count = Number.isFinite(n) ? n : 0;
    return `${count}/${RELIC_WEAR_MAX}`;
  }

  function parseUnitGear(u) {
    const artifacts = (u && u.artifacts ? u.artifacts : [])
      .map(parseArtifact)
      .filter(Boolean);
    const relics = (u && u.relics ? u.relics : []).map(parseRelic).filter(Boolean);
    return { artifacts, relics };
  }

  function parseAccountGear(json) {
    const artMap = new Map();
    const relMap = new Map();
    let invArtCount = 0;
    let unitArtCount = 0;
    let duplicateRids = new Set();
    
    const pushArt = (raw, unitId) => {
      const a = parseArtifact(raw);
      if (!a || a.rid == null) return;
      if (unitId != null && a.occupiedId == null) a.occupiedId = Number(unitId);
      else if (a.occupiedId === 0) a.occupiedId = null;
      if (artMap.has(a.rid)) {
        duplicateRids.add(a.rid);
      }
      artMap.set(a.rid, a);
      if (unitId == null) invArtCount++;
      else unitArtCount++;
    };
    const pushRel = (raw, unitId) => {
      const r = parseRelic(raw);
      if (!r || r.rid == null) return;
      if (unitId != null && r.occupiedId == null) r.occupiedId = Number(unitId);
      else if (r.occupiedId === 0) r.occupiedId = null;
      relMap.set(r.rid, r);
    };
    for (const raw of (json && json.artifacts) || []) pushArt(raw, null);
    for (const raw of (json && json.relics) || []) pushRel(raw, null);
    for (const unit of (json && json.unit_list) || []) {
      const uid = unit && unit.unit_id != null ? unit.unit_id : null;
      for (const raw of (unit && unit.artifacts) || []) pushArt(raw, uid);
      for (const raw of (unit && unit.relics) || []) pushRel(raw, uid);
    }
    const wearCounts = countRelicWearers(json);
    for (const r of relMap.values()) {
      r.wearCount = wearCounts.get(r.rid) || 0;
    }
    
    // Debug logging
    console.log('[SWRM Gear Parse] Artifacts: inventory=' + invArtCount + ', unit-equipped=' + unitArtCount + ', total=' + artMap.size + ', duplicates=' + duplicateRids.size);
    if (duplicateRids.size > 0) {
      console.log('[SWRM Gear Parse] Duplicate artifact RIDs:', Array.from(duplicateRids));
    }
    
    return {
      artifacts: Array.from(artMap.values()),
      relics: Array.from(relMap.values()),
    };
  }

  window.SWRM = window.SWRM || {};
  window.SWRM.parseArtifact = parseArtifact;
  window.SWRM.parseRelic = parseRelic;
  window.SWRM.parseUnitGear = parseUnitGear;
  window.SWRM.parseAccountGear = parseAccountGear;
  window.SWRM.sumGearBonusesForKey = sumGearBonusesForKey;
  window.SWRM.formatGearEffectLine = formatEffectLine;
  window.SWRM.formatRelicDurability = formatRelicDurability;
  window.SWRM.formatRelicWearCount = formatRelicWearCount;
  window.SWRM.RELIC_WEAR_MAX = RELIC_WEAR_MAX;
  window.SWRM.artifactCategoryName = artifactCategory;
  window.SWRM.ARTIFACT_PIECE_TYPE = ARTIFACT_PIECE_TYPE;
  window.SWRM.ARTIFACT_ARCHETYPE = ARTIFACT_ARCHETYPE;
  window.SWRM.ARTIFACT_ELEMENT = ARTIFACT_ELEMENT;
})();
