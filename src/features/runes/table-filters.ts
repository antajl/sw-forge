// src/features/runes/table-filters.ts - Rune table filtering logic
// Migrated from js/features/runes/table-filters.js

import type { Rune } from '../../types/rune';
import { escapeHtml, isRuneEquipped } from './utils';

/**
 * Rune table summary statistics
 */
export interface RuneTableSummary {
  total: number;
  ancient: number;
  equipped: number;
  inventory: number;
  plus15: number;
  keep: number;
  sell: number;
  grades: Record<string, number>;
}

/**
 * Rune table filters
 */
export interface RuneTableFilters {
  verdict: string;
  role: string;
  grade: string;
  set: string;
  slot: string;
  main: string;
  location: string;
  ancientOnly: boolean;
}

/**
 * Filter chip definition
 */
export interface FilterChip {
  key: string;
  label: string;
}

/**
 * Search query result
 */
export interface SearchQueryResult {
  pairs: Array<{ stat: string; value: number }>;
  free: string[];
}

/**
 * Stat value line for search
 */
export interface StatValueLine {
  key: string;
  value: number;
}

const DEBOUNCE_DELAY = 150;
const RUNE_SEARCH_STAT_KEYS = new Set(['hp', 'atk', 'def', 'spd', 'crate', 'cdmg', 'res', 'acc']);

// Global state (in real app, this would be managed by state management)
let runeTableRenderPending = false;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Check if rune table runes tab is active
 */
export function isRuneTableRunesTabActive(): boolean {
  // Placeholder - in real implementation, check with shell module
  return true;
}

/**
 * Flush rune table render if needed
 */
export function flushRuneTableRenderIfNeeded(): void {
  if (!runeTableRenderPending && !isRuneTableRunesTabActive()) return;
  if (!isRuneTableRunesTabActive()) return;
  runeTableRenderPending = false;
  // Placeholder - in real implementation, call applyFiltersAndSort
  console.log('flushRuneTableRenderIfNeeded');
}

/**
 * Schedule rune table render with debounce
 */
export function scheduleRuneTableRender(): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    flushRuneTableRenderIfNeeded();
  }, DEBOUNCE_DELAY);
}

/**
 * Compute rune table summary statistics
 */
export function computeRuneTableSummary(runes: Rune[]): RuneTableSummary {
  const list = runes || [];
  let ancient = 0;
  let equipped = 0;
  let plus15 = 0;
  let keep = 0;
  let sell = 0;
  const grades: Record<string, number> = {};
  
  for (const r of list) {
    if (r.isAncient) ancient += 1;
    if (isRuneEquipped(r)) equipped += 1;
    if (Number(r.level) >= 15) plus15 += 1;
    const v = (r.verdict || '').trim();
    if (v === 'Keep') keep += 1;
    else if (v === 'Sell') sell += 1;
    const g = String(r.grade || '').trim();
    if (g) grades[g] = (grades[g] || 0) + 1;
  }
  
  return {
    total: list.length,
    ancient,
    equipped,
    inventory: list.length - equipped,
    plus15,
    keep,
    sell,
    grades,
  };
}

/**
 * Render rune table roster chips
 */
export function renderRuneTableRosterChips(pool: Rune[], translations: Record<string, string>): void {
  const host = document.getElementById('rune-table-roster-chips');
  const meta = document.getElementById('rune-table-roster-meta');
  if (!host) return;
  
  if (!pool.length) {
    host.innerHTML = '';
    if (meta) meta.hidden = true;
    return;
  }
  
  if (meta) meta.hidden = false;
  const sum = computeRuneTableSummary(pool);
  const t = translations;
  
  const parts = [
    { label: t.runeChipTotal || 'Runes', value: sum.total },
    { label: t.runeChipAncient || 'Ancient', value: sum.ancient },
    { label: t.runeChipEquipped || 'Equipped', value: sum.equipped },
    { label: t.runeChipInventory || 'Inventory', value: sum.inventory },
    { label: t.runeChipPlus15 || '+15', value: sum.plus15 },
    { label: t.runeChipKeep || 'Keep', value: sum.keep },
  ];
  
  if (sum.sell > 0) {
    parts.push({ label: t.runeChipSell || 'Sell', value: sum.sell });
  }
  
  const gradeOrder = ['Legend', 'Hero', 'Rare', 'Magic', 'Common'];
  for (const g of gradeOrder) {
    if (sum.grades[g] > 0) {
      parts.push({ label: g, value: sum.grades[g] });
    }
  }
  
  host.innerHTML = parts
    .map(
      (p) =>
        `<span class="monsters-chip"><span class="monsters-chip__label">${escapeHtml(p.label)}</span><strong class="monsters-chip__value">${escapeHtml(String(p.value))}</strong></span>`,
    )
    .join('');
}

/**
 * Build rune table query suffix for URL
 */
export function buildRuneTableQuerySuffix(sortKey: string, sortDir: string, runeTableShowAll: boolean): string {
  const p = new URLSearchParams();
  const q = (document.getElementById('search-box') as HTMLInputElement)?.value || '';
  if (q) p.set('q', q);
  const fv = (document.getElementById('filter-verdict') as HTMLInputElement)?.value;
  if (fv) p.set('verdict', fv);
  const fr = (document.getElementById('filter-role') as HTMLInputElement)?.value;
  if (fr) p.set('role', fr);
  const fg = (document.getElementById('filter-grade') as HTMLInputElement)?.value;
  if (fg) p.set('grade', fg);
  const fs = (document.getElementById('filter-set') as HTMLInputElement)?.value;
  if (fs) p.set('set', fs);
  const fsl = (document.getElementById('filter-slot') as HTMLInputElement)?.value;
  if (fsl) p.set('slot', fsl);
  const fm = (document.getElementById('filter-main') as HTMLInputElement)?.value;
  if (fm) p.set('main', fm);
  const fl = (document.getElementById('filter-rune-location') as HTMLInputElement)?.value;
  if (fl) p.set('loc', fl);
  if (sortKey !== 'score') p.set('sort', sortKey);
  if (sortDir !== 'desc') p.set('dir', sortDir);
  if ((document.getElementById('toggle-ancient-only') as HTMLInputElement)?.checked) p.set('ancient', '1');
  if (runeTableShowAll) p.set('all', '1');
  const s = p.toString();
  return s ? `?${s}` : '';
}

/**
 * Read rune table filters from DOM
 */
export function readRuneTableFiltersFromDom(): RuneTableFilters {
  return {
    verdict: (document.getElementById('filter-verdict') as HTMLInputElement)?.value || '',
    role: (document.getElementById('filter-role') as HTMLInputElement)?.value || '',
    grade: (document.getElementById('filter-grade') as HTMLInputElement)?.value || '',
    set: (document.getElementById('filter-set') as HTMLInputElement)?.value || '',
    slot: (document.getElementById('filter-slot') as HTMLInputElement)?.value || '',
    main: (document.getElementById('filter-main') as HTMLInputElement)?.value || '',
    location: (document.getElementById('filter-rune-location') as HTMLInputElement)?.value || '',
    ancientOnly: !!(document.getElementById('toggle-ancient-only') as HTMLInputElement)?.checked,
  };
}

/**
 * Count active rune table filters
 */
export function countRuneTableActiveFilters(f: RuneTableFilters): number {
  let n = 0;
  if (f.verdict) n += 1;
  if (f.role) n += 1;
  if (f.grade) n += 1;
  if (f.set) n += 1;
  if (f.slot) n += 1;
  if (f.main) n += 1;
  if (f.location) n += 1;
  if (f.ancientOnly) n += 1;
  return n;
}

/**
 * Check if rune table has active filters or search
 */
export function runeTableHasActiveFiltersOrSearch(monsterMasterId: number | null): boolean {
  const q = ((document.getElementById('search-box') as HTMLInputElement)?.value || '').trim();
  if (q) return true;
  if (monsterMasterId != null) return true;
  return countRuneTableActiveFilters(readRuneTableFiltersFromDom()) > 0;
}

/**
 * Canonicalize rune search stat key
 */
export function canonRuneSearchStatKey(tok: string): string | null {
  const t = String(tok || '')
    .toLowerCase()
    .replace(/%$/, '')
    .trim();
  const map: Record<string, string> = {
    hp: 'hp',
    health: 'hp',
    atk: 'atk',
    attack: 'atk',
    def: 'def',
    defense: 'def',
    defence: 'def',
    spd: 'spd',
    speed: 'spd',
    crate: 'crate',
    cr: 'crate',
    cdmg: 'cdmg',
    cd: 'cdmg',
    cdamage: 'cdmg',
    res: 'res',
    resistance: 'res',
    acc: 'acc',
    accuracy: 'acc',
    pv: 'hp',
    atq: 'atk',
    vit: 'spd',
    tc: 'crate',
    dcc: 'cdmg',
  };
  if (map[t]) return map[t];
  return RUNE_SEARCH_STAT_KEYS.has(t) ? t : null;
}

/**
 * Normalize rune search text
 */
export function normalizeRuneSearchText(s: string): string {
  return String(s || '')
    .toLowerCase()
    .replace(/%/g, ' ')
    .replace(/\[\+\d+\]/g, ' ')
    .replace(/[^a-z0-9\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Parse rune search query
 */
export function parseRuneSearchQuery(rawQuery: string): SearchQueryResult {
  const norm = normalizeRuneSearchText(rawQuery);
  if (!norm) return { pairs: [], free: [] };
  const tokens = norm.split(' ').filter(Boolean);
  const pairs: Array<{ stat: string; value: number }> = [];
  const free: string[] = [];
  let i = 0;
  
  while (i < tokens.length) {
    const key = canonRuneSearchStatKey(tokens[i]);
    const next = tokens[i + 1];
    if (key && next !== undefined && /^\d+$/.test(next)) {
      pairs.push({ stat: key, value: Number(next) });
      i += 2;
      continue;
    }
    if (/^\d+$/.test(tokens[i]) && canonRuneSearchStatKey(next)) {
      pairs.push({ stat: canonRuneSearchStatKey(next)!, value: Number(tokens[i]) });
      i += 2;
      continue;
    }
    if (key && (next === undefined || !/^\d+$/.test(next))) {
      free.push(key);
      i += 1;
      continue;
    }
    free.push(tokens[i]);
    i += 1;
  }
  
  return { pairs, free };
}

/**
 * Get stat value lines from rune for search
 */
export function runeStatValueLines(r: Rune): StatValueLine[] {
  const lines: StatValueLine[] = [];
  const add = (name: string, total: number) => {
    if (!name) return;
    const base = name.replace(/%$/, '');
    const key = canonRuneSearchStatKey(base);
    const val = Number(total);
    if (!key || !Number.isFinite(val)) return;
    lines.push({ key, value: Math.round(val) });
  };
  
  if (r.mainName) add(r.mainName, r.mainVal);
  if (r.innate_name) add(r.innate_name, r.innate_val);
  
  for (const s of r.substats || []) {
    if (!s || !s.name) continue;
    const total = (Number(s.val) || 0) + (Number(s.grind) || 0);
    add(s.name, total);
  }
  
  return lines;
}

/**
 * Split haystack into words
 */
export function runeHaystackWords(hay: string): string[] {
  return hay.split(' ').filter(Boolean);
}

/**
 * Check if free tokens match haystack
 */
export function runeFreeTokensMatchHaystack(hay: string, free: string[]): boolean {
  if (!free.length) return true;
  const words = runeHaystackWords(hay);
  const full = free.join(' ');
  if (full.length >= 2 && hay.includes(full)) return true;
  return free.every((tok) => {
    const stat = canonRuneSearchStatKey(tok);
    if (stat) return words.includes(stat);
    return words.includes(tok) || hay.includes(tok);
  });
}

/**
 * Build rune search haystack
 */
export function buildRuneSearchHaystack(r: Rune, tTable: Record<string, string>): string {
  const parts = [
    r.setName,
    r.mainName,
    r.gradeStr,
    r.role,
    r.verdict,
    r.innate_name,
    String(r.innate_val ?? ''),
    String(r.slot),
    String(r.level),
    String(r.ingameScore ?? ''),
  ];
  
  if (r.mainName) {
    parts.push(runeSearchStatTokens(r.mainName, r.mainType, r.mainVal, 0, r.mainVal));
  }
  if (r.innate_name) {
    parts.push(runeSearchStatTokens(r.innate_name, r.innate_type, r.innate_val, 0, r.innate_val));
  }
  
  for (const s of r.substats || []) {
    if (!s || !s.name) continue;
    const total = (Number(s.val) || 0) + (Number(s.grind) || 0);
    parts.push(runeSearchStatTokens(s.name, s.type, s.val, s.grind, total));
  }
  
  if (r.isAncient) {
    parts.push(String(tTable.tableAncientBadge || 'Ancient'), 'ancient');
  }
  
  return normalizeRuneSearchText(parts.join(' '));
}

/**
 * Generate search tokens for a stat
 */
export function runeSearchStatTokens(statName: string, _typeId: number, val: number, grind: number, total: number): string {
  const base = String(statName || '').replace(/%$/, '');
  const v = Number.isFinite(Number(val)) ? Number(val) : 0;
  const g = Number.isFinite(Number(grind)) ? Number(grind) : 0;
  const t = Number.isFinite(Number(total)) ? Number(total) : v + g;
  const parts = [base, String(v), String(t)];
  if (g > 0) parts.push(String(g), `${v} ${g}`, `${base} ${t}`, `${base} ${v} ${g}`);
  return normalizeRuneSearchText(parts.join(' '));
}

/**
 * Check if rune matches search query
 */
export function runeMatchesSearchQuery(r: Rune, rawQuery: string, tTable: Record<string, string>): boolean {
  const norm = normalizeRuneSearchText(rawQuery);
  if (!norm) return true;
  const { pairs, free } = parseRuneSearchQuery(rawQuery);
  const statLines = runeStatValueLines(r);
  
  for (const p of pairs) {
    const hit = statLines.some((ln) => ln.key === p.stat && ln.value === p.value);
    if (!hit) return false;
  }
  
  if (pairs.length && !free.length) return true;
  const hay = buildRuneSearchHaystack(r, tTable);
  if (!pairs.length && !free.length) return true;
  if (!free.length) return hay.includes(norm);
  return runeFreeTokensMatchHaystack(hay, free);
}

/**
 * Get filter chip definitions
 */
export function runeTableFilterChipDefs(f: RuneTableFilters, t: Record<string, string>): FilterChip[] {
  const chips: FilterChip[] = [];
  if (f.verdict) chips.push({ key: 'verdict', label: f.verdict });
  if (f.role) chips.push({ key: 'role', label: f.role });
  if (f.grade) chips.push({ key: 'grade', label: f.grade });
  if (f.set) chips.push({ key: 'set', label: f.set });
  if (f.slot) chips.push({ key: 'slot', label: `${t.runeFilterSlot || 'Slot'} ${f.slot}` });
  if (f.main) chips.push({ key: 'main', label: f.main });
  if (f.location === 'inventory') {
    chips.push({
      key: 'location',
      label: t.runeFilterInventory || t.artifactFilterInventory || t.tableGearInventory || 'Inventory',
    });
  } else if (f.location === 'equipped') {
    chips.push({
      key: 'location',
      label: t.runeFilterEquipped || t.artifactFilterEquipped || 'Equipped',
    });
  }
  if (f.ancientOnly) chips.push({ key: 'ancientOnly', label: t.tableAncientOnly || 'Ancient only' });
  return chips;
}

/**
 * Clear a specific rune table filter chip
 */
export function clearRuneTableFilterChip(key: string): void {
  switch (key) {
    case 'verdict':
      (document.getElementById('filter-verdict') as HTMLInputElement)!.value = '';
      break;
    case 'role':
      (document.getElementById('filter-role') as HTMLInputElement)!.value = '';
      break;
    case 'grade':
      (document.getElementById('filter-grade') as HTMLInputElement)!.value = '';
      break;
    case 'set':
      (document.getElementById('filter-set') as HTMLInputElement)!.value = '';
      break;
    case 'slot':
      (document.getElementById('filter-slot') as HTMLInputElement)!.value = '';
      break;
    case 'main':
      (document.getElementById('filter-main') as HTMLInputElement)!.value = '';
      break;
    case 'location':
      (document.getElementById('filter-rune-location') as HTMLInputElement)!.value = '';
      break;
    case 'ancientOnly': {
      const tgl = document.getElementById('toggle-ancient-only') as HTMLInputElement;
      if (tgl) tgl.checked = false;
      localStorage.setItem('RUNE_TABLE_ANCIENT_ONLY_KEY', '0');
      break;
    }
    default:
      break;
  }
}

/**
 * Render active filter chips
 */
export function renderRuneTableActiveFilterChips(): void {
  const row = document.getElementById('rune-table-active-filters');
  const host = document.getElementById('rune-table-filter-chips');
  if (!row || !host) return;
  
  const t = {}; // Placeholder - in real implementation, use TRANSLATIONS[currentLang]
  const chips = runeTableFilterChipDefs(readRuneTableFiltersFromDom(), t);
  
  if (!chips.length) {
    host.innerHTML = '';
    row.hidden = true;
    return;
  }
  
  row.hidden = false;
  host.innerHTML = chips
    .map(
      (c) =>
        `<span class="monsters-filter-chip">${escapeHtml(c.label)}<button type="button" class="monsters-filter-chip__remove" data-rune-filter-chip-remove="${escapeHtml(c.key)}" aria-label="Remove">✕</button></span>`,
    )
    .join('');
}

/**
 * Update rune table filter summary
 */
export function updateRuneTableFilterSummary(translations: Record<string, string>): void {
  const f = readRuneTableFiltersFromDom();
  const n = countRuneTableActiveFilters(f);
  const countEl = document.getElementById('rune-filters-active-count');
  const moreBtn = document.getElementById('rune-more-filters-btn');
  const t = translations;
  const activeTpl = t.runeTableFiltersActive || '{n}';
  
  if (countEl) {
    countEl.textContent = n ? activeTpl.replace(/\{n\}/g, String(n)) : '';
    countEl.hidden = !n;
  }
  if (moreBtn) moreBtn.classList.toggle('monsters-toolbar-btn--filters-active', n > 0);
  renderRuneTableActiveFilterChips();
}

/**
 * Reset all rune table filters
 */
export function resetRuneTableFilters(): void {
  const sb = document.getElementById('search-box') as HTMLInputElement;
  if (sb) sb.value = '';
  const fv = document.getElementById('filter-verdict') as HTMLInputElement;
  if (fv) fv.value = '';
  const fr = document.getElementById('filter-role') as HTMLInputElement;
  if (fr) fr.value = '';
  const fg = document.getElementById('filter-grade') as HTMLInputElement;
  if (fg) fg.value = '';
  const fs = document.getElementById('filter-set') as HTMLInputElement;
  if (fs) fs.value = '';
  const fsl = document.getElementById('filter-slot') as HTMLInputElement;
  if (fsl) fsl.value = '';
  const fm = document.getElementById('filter-main') as HTMLInputElement;
  if (fm) fm.value = '';
  const floc = document.getElementById('filter-rune-location') as HTMLInputElement;
  if (floc) floc.value = '';
  const tglAncient = document.getElementById('toggle-ancient-only') as HTMLInputElement;
  if (tglAncient) tglAncient.checked = false;
  localStorage.setItem('RUNE_TABLE_ANCIENT_ONLY_KEY', '0');
  
  // Placeholder - in real implementation, reset sort and other state
  updateRuneTableFilterSummary({});
}
