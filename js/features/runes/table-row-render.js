// js/features/runes/table-row-render.js — HTML generation for rune table rows
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
    if (!code) return t.sellReasonNoRole || 'No matching role';
    if (code === 'duo_near') return t.sellReasonDuoNear || '';
    if (code === 'exclude') {
      const roleLbl = roleDisplayName(r.sellReasonDetail || '');
      return (t.sellReasonExclude || 'Exclude stat blocks {role}').replace(/\{role\}/g, roleLbl);
    }
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
    return parts.join(' · ');
  }

  /** Stylised “Ancient” mark: A without crossbar, dot at mid-height (matches in-game cue). */
  const ANCIENT_GRADE_ICON_SVG =
    '<svg class="ancient-grade-icon" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">'
    + '<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.85" d="M2.35 12.85L8 2.65l5.65 10.2"/>'
    + '<circle cx="8" cy="9.55" r="1.45" fill="currentColor"/>'
    + '</svg>';

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
    const valShown = showGrindSuffix ? `${total} [${grindAmt}]` : String(total);
    const plain = `${s.name} ${valShown}`;
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

  function runeRow(r) {
    const tloc = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const gradeKey = r.gradeStr;
    const gradeClass = { Legend: 'legend', Hero: 'hero', Rare: 'rare' }[gradeKey] || 'grade-tag--other';
    const gradeLabel = { Legend: 'Legend', Hero: 'Hero', Rare: 'Rare' }[gradeKey] || String(r.gradeStr);
    const gradeLabelHtml = highlightSearchInPlain(gradeLabel, tableSearchHighlight);
    const ancientTipRaw = tloc.tableAncientBadgeTitle || '';
    const ancientTipAttr = r.isAncient && ancientTipRaw ? ` title="${escapeAttr(ancientTipRaw)}"` : '';
    const ancientLbl = escapeAttr(tloc.tableAncientBadge || 'Ancient');
    const ancientIcon = r.isAncient
      ? `<span class="ancient-grade-icon-wrap" aria-hidden="true">${ANCIENT_GRADE_ICON_SVG}</span>`
      : '';
    const gradeAria = r.isAncient ? ` aria-label="${ancientLbl}, ${escapeAttr(gradeLabel)}"` : '';
    const grade = `<span class="grade-tag ${gradeClass}${r.isAncient ? ' grade-tag--ancient' : ''}"${ancientTipAttr}${gradeAria}>${ancientIcon}<span class="grade-tag__lbl">${gradeLabelHtml}</span></span>`;

    const effNum = getRuneNumericEff(r);
    const effTier =
      effNum >= 90 ? 'stat-chip--eff-hi' : effNum >= 75 ? 'stat-chip--eff-mid' : 'stat-chip--eff-lo';
    const effShown = `${(Math.round(effNum * 10) / 10).toFixed(1)}%`;
    const rCls = roleClass(r.role);
    const subs   = r.substats.slice(0, 4);
    const innate = r.innate_name ? `${r.innate_name} ${r.innate_val}` : '';
    const innateHtml = innate
      ? tableStatLine(highlightSearchInPlain(innate, tableSearchHighlight))
      : '';
    const target = runeTargetText(r);
    const targetHtml = target
      ? tableStatLine(highlightSearchInPlain(target, tableSearchHighlight))
      : '';
    const targetTipRaw = runeEngineDetailTooltip(r);
    const targetTipAttr = targetTipRaw ? ` title="${escapeAttr(targetTipRaw)}"` : '';
    const mainInner = highlightSearchInPlain(r.mainName, tableSearchHighlight);
    const roleText = roleDisplayName((r.role || '').trim());
    const roleHtml = roleText
      ? `<span class="role-tag ${rCls}">${highlightSearchInPlain(roleText, tableSearchHighlight)}</span>`
      : '';
    const verdictText = (r.verdict || '').trim();
    const verdictHtml = verdictText
      ? `<span class="verdict-tag ${verdictText.toLowerCase()}">${highlightSearchInPlain(verdictText, tableSearchHighlight)}</span>`
      : '';

    const subCell = (sub, first) => {
      const inner = sub ? renderSubStat(sub) : '';
      const cls = first ? 'col-sub col-sub-first' : 'col-sub';
      return `<td class="${cls}">${inner}</td>`;
    };

    return `<tr>
      <td class="col-grade col-pin">${grade}</td>
      <td class="col-set col-pin col-text">${tableStatLine(highlightSearchInPlain(r.setName, tableSearchHighlight), { set: true })}</td>
      <td class="col-num td-num-plain">${highlightSearchInPlain(String(r.level), tableSearchHighlight)}</td>
      <td class="col-num td-num-plain">${highlightSearchInPlain(String(r.slot), tableSearchHighlight)}</td>
      <td class="col-text">${tableStatLine(mainInner)}</td>
      <td class="col-text">${innateHtml}</td>
      ${subCell(subs[0], true)}
      ${subCell(subs[1], false)}
      ${subCell(subs[2], false)}
      ${subCell(subs[3], false)}
      <td class="col-num td-num"><span class="stat-chip stat-chip--eff ${effTier}">${highlightSearchInPlain(effShown, tableSearchHighlight)}</span></td>
      <td class="col-text">${roleHtml}</td>
      <td class="col-text">${verdictHtml}</td>
      <td class="target-col-cell col-text"${targetTipAttr}>${targetHtml}</td>
    </tr>`;
  }
