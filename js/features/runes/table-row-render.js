// js/features/runes/table-row-render.js — HTML generation for rune table rows
  function runeStatBaseName(name) {
    return String(name || '').replace(/%$/, '').trim();
  }

  /** Whether the rolled value is shown with a % suffix (incl. RES / ACC). */
  function runeStatValueIsPercent(typeId, name) {
    const t = Number(typeId);
    if (Number.isFinite(t)) {
      if (t === 1 || t === 3 || t === 5 || t === 8) return false;
      if (t === 2 || t === 4 || t === 6 || t === 9 || t === 10 || t === 11 || t === 12) return true;
    }
    return /%$/.test(String(name || '').trim());
  }

  function formatRuneStatPlainText(opts) {
    const o = opts || {};
    const lang = typeof currentLang !== 'undefined' ? currentLang : 'en';
    const dispFn = window.SWRM && window.SWRM.displayStatForUi;
    const uiName = typeof dispFn === 'function' ? dispFn(o.type, o.name, lang) : o.name;
    const base = runeStatBaseName(uiName) || runeStatBaseName(o.name) || '?';
    const isPct = runeStatValueIsPercent(o.type, o.name);
    const total =
      o.total != null && Number.isFinite(Number(o.total))
        ? Number(o.total)
        : Number(o.val);
    const n = Number.isFinite(total) ? total : 0;
    const valShown = isPct ? `${n}%` : String(n);
    let out = `${base} ${valShown}`;
    const grind = Number(o.grind) || 0;
    if (grind > 0) out += ` [+${grind}]`;
    return out;
  }

  function runeVerdictTipText(r) {
    const reason = runeTargetText(r);
    const detail = runeEngineDetailTooltip(r);
    const parts = [];
    if (reason) parts.push(reason);
    if (detail && detail !== reason) parts.push(detail);
    return parts.join('\n\n');
  }

  function highlightSearchInPlain(text, qRaw) {
    const q = (qRaw || '').trim().toLowerCase();
    const t = String(text ?? '');
    if (!q) return escapeHtml(t);
    const tl = t.toLowerCase();
    const parts = [];
    let i = 0;
    while (i < t.length) {
      const idx = tl.indexOf(q, i);
      if (idx === -1) {
        parts.push(escapeHtml(t.slice(i)));
        break;
      }
      if (idx > i) parts.push(escapeHtml(t.slice(i, idx)));
      parts.push(`<mark class="search-hit">${escapeHtml(t.slice(idx, idx + q.length))}</mark>`);
      i = idx + q.length;
    }
    return parts.join('');
  }

  function roleDisplayName(role) {
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    if (role === 'God Roll' || role === 'High Roll') return t.roleGodRoll || 'God Roll';
    return role || '';
  }

  function sellReasonText(r) {
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const code = r.sellReasonCode || '';
    const roleLbl = roleDisplayName(r.sellReasonDetail || '');
    const roleTpl = (tpl) => (tpl || '').replace(/\{role\}/g, roleLbl);
    if (!code) return t.sellReasonNoRole || 'No matching role';
    if (code === 'duo_near') return t.sellReasonDuoNear || '';
    if (code === 'exclude') return roleTpl(t.sellReasonExclude || 'Exclude stat blocks {role}');
    if (code === 'main_stat') return roleTpl(t.sellReasonMainStat || 'Main stat not accepted for {role}');
    if (code === 'must_have') return roleTpl(t.sellReasonMustHave || 'Missing required stat for {role}');
    if (code === 'anchor_hr') return roleTpl(t.sellReasonAnchor || 'No high-roll anchor for {role}');
    if (code === 'min_stats') return roleTpl(t.sellReasonMinStats || 'Too few supporting subs for {role}');
    if (code === 'role_pressure') return roleTpl(t.sellReasonPressure || 'Substats too weak for {role}');
    if (code === 'slot_req') return roleTpl(t.sellReasonSlotReq || 'Slot requirement failed for {role}');
    if (code === 'slow_dps_core') return roleTpl(t.sellReasonSlowDps || 'Core DPS stats too low for {role}');
    if (code === 'near_miss') return roleTpl(t.sellReasonNearMiss || 'Close to {role}, preset rules not met');
    if (code === 'bad_flat') return t.sellReasonBadFlat || '';
    if (code === 'low_eff') return t.sellReasonLowEff || '';
    if (code === 'low_eff_finish') return t.sellReasonLowEffFinish || '';
    return t.sellReasonNoRole || 'No matching role';
  }

  function runeTargetText(r) {
    const tl = TRANSLATIONS[currentLang];
    const v = r.verdict || '';
    if (v === 'Sell') return sellReasonText(r);
    if (v === 'Grind') {
      const g = r.grindInfo;
      if (g && g.can && g.stat) {
        if (typeof g.from === 'number' && typeof g.need === 'number') {
          const from = Math.ceil(g.from);
          const need = Math.ceil(g.need);
          const maxTo = typeof g.to === 'number' ? Math.ceil(g.to) : null;
          if (maxTo != null) {
            return `${g.stat} ${from}→${need} (max ${maxTo})`;
          }
          return `${g.stat} ${from}→${need}`;
        }
        return g.stat;
      }
      return '';
    }
    if (v === 'Gem') {
      const subs = Array.isArray(r.gemInfo?.badFlatSubs)
        ? r.gemInfo.badFlatSubs.filter(Boolean)
        : [];
      if (subs.length > 0) {
        const verb = tl.targetGemReplaceVerb || 'Replace';
        const sep = tl.targetGemReplaceOr || ' or ';
        return `${verb} ${subs.join(sep)}`;
      }
      return '';
    }
    if (v === 'Upgrade') return tl.actionTargetUpgrade;
    if (v === 'Finish') return tl.actionTargetFinish;
    if (v === 'Reapp') return tl.actionTargetReapp;
    if (v === 'Keep' && r && r.decisionTrace) {
      const dt = r.decisionTrace || {};
      const strict = !!dt.strictFormulaMatch;
      const policy = !!dt.policyFormulaMatch;
      const strictRole = dt.strictBestFormula || '';
      const policyRole = dt.policyBestFormula || dt.bestRole || '';
      const fitScore = Number(r.fitSummary?.bestScore || 0);
      const tier =
        fitScore >= 75
          ? tl.keepFitExcellent || 'Excellent'
          : fitScore >= 60
            ? tl.keepFitGood || 'Good'
            : tl.keepFitUsable || 'Usable';
      const fitLabel = tl.keepFitLabel || 'Fit';
      const fit =
        Number.isFinite(fitScore) && fitScore > 0 ? `${fitLabel} ${Math.round(fitScore)}` : '';

      if (r.policyRelaxedRole) {
        const mode = tl.keepModeRelaxed || 'Relaxed';
        const base = `${roleDisplayName(r.policyRelaxedRole)} · ${tier} (${mode})`;
        return fit ? `${base} · ${fit}` : base;
      }

      if ((policyRole || '') === 'Universal' || r.universalSource) {
        if (String(r.universalSource) === 'God') {
          const src = tl.keepUniversalGod || 'High Value · God';
          return fit ? `${src} · ${fit}` : src;
        }
        if (String(r.universalSource) === 'Duo') {
          const src = tl.keepUniversalDuo || 'High Value · Duo';
          return fit ? `${src} · ${fit}` : src;
        }
        const src = tl.keepUniversalHighValue || 'High Value';
        return fit ? `${src} · ${fit}` : src;
      }

      if (!strict && policy && policyRole) {
        const mode = tl.keepModeFlexible || 'Flexible';
        const base = `${roleDisplayName(policyRole)} · ${tier} (${mode})`;
        return fit ? `${base} · ${fit}` : base;
      }
      if (strictRole) {
        const mode = tl.keepModeStrict || 'Strict';
        const base = `${roleDisplayName(strictRole)} · ${tier} (${mode})`;
        return fit ? `${base} · ${fit}` : base;
      }
    }
    return '';
  }

  /** Raw grindInfo / gemInfo fields for native tooltip on Target cell (Grind/Gem). */
  function runeEngineDetailTooltip(r) {
    const tl = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const parts = [];
    const v = r.verdict || '';
    if (v === 'Grind' && r.grindInfo && typeof r.grindInfo === 'object') {
      parts.push(tl.tableTooltipGrind || 'Grind');
      Object.keys(r.grindInfo).sort().forEach((k) => {
        const val = r.grindInfo[k];
        if (val === undefined || val === null || val === '') return;
        parts.push(`${k}=${val}`);
      });
    } else if (v === 'Gem' && r.gemInfo && typeof r.gemInfo === 'object') {
      parts.push(tl.tableTooltipGem || 'Gem');
      Object.keys(r.gemInfo).sort().forEach((k) => {
        const val = r.gemInfo[k];
        if (val === undefined || val === null || val === '') return;
        parts.push(`${k}=${val}`);
      });
    }
    if (v === 'Keep' && r && r.fitSummary && Number(r.fitSummary.bestScore || 0) > 0) {
      parts.push(`Fit Score: ${Math.round(Number(r.fitSummary.bestScore || 0))}`);
      parts.push('Fit Score — how well the rune stats fit this role');
    }
    return parts.join('\n');
  }

  /** Counter‑clockwise circular arrows (gem / replaced sub) — stroke reads clearly at small sizes. */
  const STAT_SUB_GEM_ICON_SVG =
    '<svg class="table-stat-gem-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">'
    + '<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="M1 4v6h6"/>'
    + '<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="M23 20v-6h-6"/>'
    + '<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>'
    + '</svg>';

  /** Plain table text (no chip) — set / main / innate / subs / target */
  function tableStatLine(innerHtml, opts) {
    const setCls = opts && opts.set ? ' table-stat--set' : '';
    const gemOnlyCls = opts && opts.gemOnly ? ' table-stat--gem-only' : '';
    const tipAttr = opts && opts.tip ? ` title="${escapeAttr(opts.tip)}"` : '';
    const gemSvg = opts && opts.gem ? STAT_SUB_GEM_ICON_SVG : '';
    return `<span class="table-stat${setCls}${gemOnlyCls}"${tipAttr}>${innerHtml}${gemSvg}</span>`;
  }

  function renderSubStat(s) {
    if (!s || !s.name) return '';
    const grindAmt = Number(s.grind) || 0;
    const gemMarked = !!(s.enchanted || (Number(s.gem) || 0) !== 0);
    const total = subLineTotal(s);
    const showGrindSuffix = grindAmt > 0;
    const plain = formatRuneStatPlainText({
      type: s.type,
      name: s.name,
      val: s.val,
      total,
      grind: grindAmt,
    });
    const inner = highlightSearchInPlain(plain, tableSearchHighlight);
    const grindCls = showGrindSuffix ? ' table-stat__text--grind' : '';
    const tloc = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const tipParts = [];
    if (showGrindSuffix) {
      tipParts.push((tloc.tableSubGrindTooltip || '').replace(/\{n\}/g, String(grindAmt)));
    }
    if (gemMarked) tipParts.push(tloc.tableSubGemTooltip || '');
    const tip = tipParts.filter(Boolean).join(' ');
    return tableStatLine(`<span class="table-stat__text${grindCls}">${inner}</span>`, {
      tip,
      gem: gemMarked,
      gemOnly: gemMarked && !showGrindSuffix,
    });
  }

  function roleClass(role) {
    const m = {
      'God Roll':'godroll','High Roll':'godroll','Bruiser':'bruiser','Fast CC':'fastcc',
      'Classic DPS':'classicdps','Slow DPS':'slowdps','Bomber':'bomber',
      'Tank':'tank','Duo Roll':'duoroll'
    };
    return m[role] || '';
  }

  function runeLocationLabel(r, t) {
    const inv = t.tableGearInventory || 'Inventory';
    const unitId = r.equipped_to != null ? Number(r.equipped_to) : NaN;
    if (Number.isFinite(unitId) && unitId !== 0 && typeof gearLocationLabel === 'function') {
      return gearLocationLabel(unitId, t);
    }
    const masterId = r.equipped_name != null ? Number(r.equipped_name) : NaN;
    if (Number.isFinite(masterId) && masterId !== 0) {
      if (typeof gearMonsterNameFromMasterId === 'function') {
        const byMaster = gearMonsterNameFromMasterId(masterId);
        if (byMaster) return byMaster;
      }
      if (typeof gearLocationLabel === 'function') return gearLocationLabel(masterId, t);
    }
    return inv;
  }

  function runeRow(r, opts) {
    // Cache translations to avoid repeated lookups
    const tloc = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const tScore = tloc;
    
    const gradeKey = r.gradeStr;
    const gradeClass = { Legend: 'legend', Hero: 'hero', Rare: 'rare' }[gradeKey] || 'grade-tag--other';
    const gradeLabel = { Legend: 'Legend', Hero: 'Hero', Rare: 'Rare' }[gradeKey] || String(r.gradeStr);
    const gradeLabelHtml = highlightSearchInPlain(gradeLabel, tableSearchHighlight);
    
    const isAncient = r.isAncient;
    const ancientTipRaw = tloc.tableAncientBadgeTitle || '';
    const gradeTip = isAncient && ancientTipRaw
      ? `${gradeLabel} · ${ancientTipRaw}` 
      : gradeLabel;
    const ancientTipAttr = ` data-swrm-tip="${escapeAttr(gradeTip)}"`;
    const ancientLbl = escapeAttr(tloc.tableAncientBadge || 'Ancient');
    const gradeAria = isAncient ? ` aria-label="${ancientLbl}, ${escapeAttr(gradeLabel)}"` : '';
    const ancientIcon = isAncient && (gradeKey === 'Hero' || gradeKey === 'Legend')
        ? '<span class="grade-tag__ancient-icon" aria-hidden="true"></span>'
        : '';
    const grade = `<span class="grade-tag ${gradeClass}${isAncient ? ' grade-tag--ancient' : ''}"${ancientTipAttr}${gradeAria}>${ancientIcon}<span class="grade-tag__lbl">${gradeLabelHtml}</span></span>`;

    // Cache score calculations
    const ingameScore = typeof getRuneIngameScore === 'function'
        ? getRuneIngameScore(r)
        : Number.isFinite(r.ingameScore)
          ? r.ingameScore
          : typeof window.SWRM?.calcIngameScore === 'function'
            ? window.SWRM.calcIngameScore(r)
            : 0;
    const ingameShown = String(ingameScore);
    const ingameTip = typeof window.SWRM?.ingameScoreBreakdown === 'function'
        ? window.SWRM.ingameScoreBreakdown(r).join('\n')
        : tScore.tableIngameScoreHeaderTitle || '';
    const ingameTipAttr = ingameTip ? ` data-swrm-tip="${escapeAttr(ingameTip)}"` : '';
    
    const scoreNum = Number.isFinite(r.forgeScore)
      ? r.forgeScore
      : typeof computeRuneScore === 'function'
        ? computeRuneScore(r, tScore)
        : 0;
    const scoreTier = typeof runeScoreTier === 'function' ? runeScoreTier(scoreNum) : 'stat-chip--score-lo';
    const scoreShown = String(scoreNum);
    const scoreTip = typeof runeScoreTooltip === 'function'
        ? runeScoreTooltip(r, tScore)
        : tScore.tableScoreHint || '';
    const scoreTipAttr = scoreTip ? ` data-swrm-tip="${escapeAttr(scoreTip)}"` : '';
    
    const rCls = roleClass(r.role);
    const subs = r.substats.slice(0, 4);
    
    // Cache stat formatting
    const innatePlain = r.innate_name
      ? formatRuneStatPlainText({
          type: r.innate_type,
          name: r.innate_name,
          val: r.innate_val,
        })
      : '';
    const innateHtml = innatePlain
      ? tableStatLine(highlightSearchInPlain(innatePlain, tableSearchHighlight))
      : '';
      
    const mainPlain = formatRuneStatPlainText({
      type: r.mainType,
      name: r.mainName,
      val: r.mainVal,
    });
    const mainInner = highlightSearchInPlain(mainPlain, tableSearchHighlight);

    const setLevel = r.level || 0;
    const ancientText = isAncient ? ' (Ancient)' : '';
    const tooltipText = `Slot ${r.slot} | ${r.setName} +${setLevel}${ancientText}`;

    // Calculate pentagon points based on slot
    const slotAngleMap = { 1: -90, 2: -30, 3: 30, 4: 90, 5: 150, 6: -150 };
    const deg = slotAngleMap[r.slot] || 0;
    const outerAngle = deg * Math.PI / 180;
    const R = 16; // radius in pixels (half of 32px image)

    // Shift center towards elongated tip (index 0) by 4 pixels
    const cx = 16 - 8 * Math.cos(outerAngle);
    const cy = 16 - 8 * Math.sin(outerAngle);

    // Calculate polygon points - elongated tip (index 0), shortened base (indices 2,3)
    const points = [];
    for (let i = 0; i < 5; i++) {
      const angle = outerAngle + i * 2 * Math.PI / 5;
      const radius = i === 0 ? R * 1.9 : (i === 2 || i === 3) ? R * 0.62 : R;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    const polygonPoints = points.join(' ');

    // Center image in pentagon - no special offsets per slot
    const imageX = 0;
    const imageY = 0;

    const setKey = String(r.setName || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_');
    const setIconUrl = setKey ? `assets/runes/sets/${setKey}.png` : '';
    const setIconHtml = setIconUrl
      ? `<div class="rune-table__set-wrapper${isAncient ? ' rune-table__set-wrapper--ancient' : ''}" data-swrm-tip="${escapeAttr(tooltipText)}">
        <svg class="rune-table__set-icon rune-table__set-icon--${gradeClass}${isAncient ? ' rune-table__set-icon--ancient' : ''}" width="48" height="48" viewBox="-16 -16 64 64">
          <defs>
            <clipPath id="clip-${r.id || Math.random().toString(36).substr(2, 9)}">
              <polygon points="${polygonPoints}" />
            </clipPath>
            ${isAncient ? `
            <filter id="glow-${r.id || Math.random().toString(36).substr(2, 9)}">
              <feGaussianBlur stdDeviation="4" result="blur"/>
              <feMerge>
                <feMergeNode in="blur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            ` : ''}
          </defs>
          ${isAncient ? `<polygon points="${polygonPoints}" fill="currentColor" filter="url(#glow-${r.id || Math.random().toString(36).substr(2, 9)})" opacity="0.6" />` : ''}
          <polygon points="${polygonPoints}" fill="none" stroke-width="2" />
          <image href="${escapeHtml(setIconUrl)}" width="32" height="32" x="${imageX}" y="${imageY}" clip-path="url(#clip-${r.id || Math.random().toString(36).substr(2, 9)})" />
        </svg>
        <span class="rune-table__set-level">+${setLevel}</span>
      </div>`
      : '';

    const setHtml = setIconHtml;
    
    const roleText = roleDisplayName((r.role || '').trim());
    const roleHtml = roleText
      ? `<span class="role-tag ${rCls}">${highlightSearchInPlain(roleText, tableSearchHighlight)}</span>`
      : '';
      
    const verdictText = (r.verdict || '').trim();
    const verdictTip = runeVerdictTipText(r);
    const verdictTipAttr = verdictTip ? ` data-swrm-tip="${escapeAttr(verdictTip)}"` : '';
    const verdictHtml = verdictText
      ? `<span class="verdict-tag ${verdictText.toLowerCase()}${verdictTip ? ' verdict-tag--has-tip' : ''}"${verdictTipAttr}>${highlightSearchInPlain(verdictText, tableSearchHighlight)}</span>`
      : '';
      
    const locText = runeLocationLabel(r, tloc);
    const locHtml = tableStatLine(highlightSearchInPlain(locText, tableSearchHighlight));

    // Build multi-line stats cell (Main + Innate)
    const mainInnateHtml = `
      <div class="rune-table__stats-multi">
        <div class="rune-table__stat-line rune-table__stat-line--main"><span class="rune-table__stat-prefix">Main</span> ${mainInner}</div>
        ${innateHtml ? `<div class="rune-table__stat-line rune-table__stat-line--innate"><span class="rune-table__stat-prefix">Inn</span> ${innateHtml}</div>` : ''}
      </div>
    `;

    // Build multi-line subs cell
    const subsHtml = subs.length > 0
      ? `<div class="rune-table__subs-multi">
        ${subs.map(sub => `<div class="rune-table__stat-line">${renderSubStat(sub)}</div>`).join('')}
      </div>`
      : '';

    // Build multi-line scores cell (Ingame + Forge)
    const scoresHtml = `
      <div class="rune-table__scores-multi">
        <div class="rune-table__score-line rune-table__score-line--ingame"><span class="rune-table__score-label">Ingame</span> <span class="rune-ingame-score${ingameTip ? ' rune-ingame-score--tip' : ''}"${ingameTipAttr}>${highlightSearchInPlain(ingameShown, tableSearchHighlight)}</span></div>
        <div class="rune-table__score-line rune-table__score-line--forge"><span class="rune-table__score-label">Forge</span> <span class="stat-chip stat-chip--score ${scoreTier}${scoreTip ? ' stat-chip--has-tip' : ''}"${scoreTipAttr}>${highlightSearchInPlain(scoreShown, tableSearchHighlight)}</span></div>
      </div>
    `;

    const rowIndex = opts && Number.isFinite(opts.rowIndex) ? opts.rowIndex : -1;
    const evenCls = rowIndex >= 0 && rowIndex % 2 === 1 ? ' rune-table__data-row--even' : '';
    const runeId = r.id != null ? String(r.id) : '';
    
    // Build row HTML
    return `<tr class="rune-table__data-row${evenCls}" data-rune-id="${escapeHtml(runeId)}">
      <td class="col-text col-location">${locHtml}</td>
      <td class="col-set col-text">${setHtml}</td>
      <td class="col-text col-main-innate">${mainInnateHtml}</td>
      <td class="col-text col-sub">${subsHtml}</td>
      <td class="col-text col-scores col-block-gap">${scoresHtml}</td>
      <td class="col-text col-verdict col-block-gap">${verdictHtml}</td>
      <td class="col-text col-role">${roleHtml}</td>
      <td class="col-actions"><button type="button" class="rune-table__delete-btn btn-secondary btn-sm" data-delete-rune="${escapeHtml(runeId)}" title="Delete rune">Sold</button></td>
    </tr>`;
  }
