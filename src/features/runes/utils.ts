// src/features/runes/utils.ts - Shared UI helpers
// Migrated from js/features/runes/utils.js

import type { Rune } from '../../types/rune';

/**
 * Database slot metadata
 */
export interface DbSlot {
  id: number;
  name: string;
  uploadedAt: string;
  active: boolean;
  wizardName: string;
  wizardLevel: number | null;
  wizardId: string;
  monsterCount: number | null;
  inventoryRuneCount: number | null;
  runeCount: number | null;
  demoProfile: boolean;
}

/**
 * Toast options
 */
export interface ToastOptions {
  type?: 'success' | 'info' | 'error';
  duration?: number;
}

/**
 * Escape HTML to prevent XSS
 */
export function escapeHtml(s: string | null | undefined): string {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Normalize database slot from raw data
 */
export function normalizeDbSlot(raw: Partial<DbSlot & { heroRuneCount?: number }>): DbSlot {
  const id = Number(raw.id);
  return {
    id: Number.isFinite(id) ? id : 0,
    name: raw.name != null ? String(raw.name) : '',
    uploadedAt: raw.uploadedAt != null ? String(raw.uploadedAt) : '',
    active: !!raw.active,
    wizardName: raw.wizardName != null ? String(raw.wizardName) : '',
    wizardLevel: raw.wizardLevel != null && String(raw.wizardLevel) !== '' && Number.isFinite(Number(raw.wizardLevel))
      ? Number(raw.wizardLevel) : null,
    wizardId: raw.wizardId != null ? String(raw.wizardId) : '',
    monsterCount: raw.monsterCount != null && Number.isFinite(Number(raw.monsterCount))
      ? Number(raw.monsterCount) : null,
    inventoryRuneCount: raw.inventoryRuneCount != null && Number.isFinite(Number(raw.inventoryRuneCount))
      ? Number(raw.inventoryRuneCount) : null,
    runeCount: (() => {
      if (raw.runeCount != null && Number.isFinite(Number(raw.runeCount))) return Number(raw.runeCount);
      if (raw.heroRuneCount != null && Number.isFinite(Number(raw.heroRuneCount))) return Number(raw.heroRuneCount);
      return null;
    })(),
    demoProfile: !!raw.demoProfile,
  };
}

/**
 * Create default empty database slots
 */
export function defaultEmptyDbSlotsMeta(): DbSlot[] {
  return Array.from({ length: 4 }, (_, i) =>
    normalizeDbSlot({ id: i + 1, name: '', uploadedAt: '', active: i === 0 }));
}

/**
 * Format slot summary line for display
 */
export function formatSlotSummaryLine(slot: DbSlot, t: Record<string, string>): string {
  if (!slot.name) return '';
  const parts: string[] = [];
  
  if (slot.demoProfile) {
    parts.push('—');
    parts.push('—');
    if (slot.runeCount != null) {
      parts.push(`${escapeHtml(String(slot.runeCount))}\u00A0${escapeHtml(t.runesWord || t.runesHeroPlus || 'runes')}`);
    }
    if (slot.monsterCount != null) {
      parts.push(`${escapeHtml(String(slot.monsterCount))}\u00A0${escapeHtml(t.monsShort || 'mons')}`);
    }
    return `<div class="db-slot-summary">${parts.join(' · ')}</div>`;
  }
  
  if (slot.wizardName) parts.push(escapeHtml(slot.wizardName));
  if (slot.wizardLevel != null) {
    parts.push(`${escapeHtml(t.lvAbbr || 'Lv.')}${escapeHtml(String(slot.wizardLevel))}`);
  }
  if (slot.runeCount != null) {
    parts.push(`${escapeHtml(String(slot.runeCount))}\u00A0${escapeHtml(t.runesWord || t.runesHeroPlus || 'runes')}`);
  }
  if (slot.monsterCount != null) {
    parts.push(`${escapeHtml(String(slot.monsterCount))}\u00A0${escapeHtml(t.monsShort || 'mons')}`);
  }
  if (!parts.length && slot.wizardId) {
    parts.push(`ID\u00A0${escapeHtml(slot.wizardId)}`);
  }
  if (!parts.length) return '';
  
  return `<div class="db-slot-summary">${parts.join(' · ')}</div>`;
}

/**
 * Clear local storage rune backup
 */
export function clearLocalStorageRuneBackup(): void {
  localStorage.removeItem('loadedRunes');
  localStorage.removeItem('loadedRunesName');
  localStorage.removeItem('loadedRunesDate');
  localStorage.removeItem('loadedRunesStorage');
  localStorage.removeItem('loadedRunesSize');
}

/**
 * Check if rune is equipped
 */
export function isRuneEquipped(r: Rune): boolean {
  const uid = r.equipped_to != null ? Number(r.equipped_to) : NaN;
  if (Number.isFinite(uid) && uid !== 0) return true;
  const mid = r.equipped_name != null ? Number(r.equipped_name) : NaN;
  return Number.isFinite(mid) && mid !== 0;
}

/**
 * Update toolbar reset button state
 */
export function updateToolbarResetButton(btnId: string | HTMLElement, isActive: boolean): void {
  const btn = typeof btnId === 'string' ? document.getElementById(btnId) as HTMLButtonElement : btnId as HTMLButtonElement;
  if (!btn) return;
  const active = !!isActive;
  btn.disabled = !active;
  btn.classList.toggle('btn-toolbar--inactive', !active);
  btn.setAttribute('aria-disabled', active ? 'false' : 'true');
}

/**
 * Show toast notification
 * Note: This is a simplified version - full implementation requires motion API
 */
export function showToast(message: string, typeOrOptions?: string | ToastOptions): void {
  const opts =
    typeof typeOrOptions === 'string'
      ? { type: typeOrOptions as 'success' | 'info' | 'error' }
      : typeOrOptions && typeof typeOrOptions === 'object'
        ? typeOrOptions
        : {};
  
  console.log('Toast:', message, opts);
  // Full implementation would show UI toast with motion
}

/**
 * Floating tooltip configuration
 */
const SWRM_FLOAT_TIP_SHOW_MS = 0;
const SWRM_FLOAT_TIP_HIDE_MS = 0;

let swrmFloatTipEl: HTMLElement | null = null;
let swrmFloatTipShowTimer: number | null = null;
let swrmFloatTipHideTimer: number | null = null;
let swrmFloatTipAnchor: HTMLElement | null = null;
let swrmFloatTipIsVisible = false;

/**
 * Ensure floating tip element exists
 */
function ensureSwrmFloatTipEl(): HTMLElement {
  if (swrmFloatTipEl) return swrmFloatTipEl;
  const el = document.createElement('div');
  el.id = 'swrm-floating-tip';
  el.className = 'swrm-floating-tip';
  el.setAttribute('role', 'tooltip');
  el.hidden = true;
  document.body.appendChild(el);
  swrmFloatTipEl = el;
  return el;
}

/**
 * Position floating tip relative to anchor
 */
function positionSwrmFloatTip(anchor: HTMLElement): void {
  const tip = ensureSwrmFloatTipEl();
  if (!anchor || tip.hidden) return;
  const r = anchor.getBoundingClientRect();
  const pad = 8;
  const gap = 10;
  const tw = tip.offsetWidth;
  const th = tip.offsetHeight;
  let left = r.left + r.width / 2 - tw / 2;
  left = Math.max(pad, Math.min(left, window.innerWidth - tw - pad));
  let top = r.top - th - gap;
  if (top < pad) top = r.bottom + gap;
  tip.style.left = `${Math.round(left)}px`;
  tip.style.top = `${Math.round(top)}px`;
}

/**
 * Hide floating tip
 */
function hideSwrmFloatTip(immediate: boolean): void {
  if (swrmFloatTipShowTimer) {
    clearTimeout(swrmFloatTipShowTimer);
    swrmFloatTipShowTimer = null;
  }
  if (swrmFloatTipHideTimer) {
    clearTimeout(swrmFloatTipHideTimer);
    swrmFloatTipHideTimer = null;
  }
  const tip = swrmFloatTipEl;
  if (!tip) return;
  if (!swrmFloatTipIsVisible) return;
  
  const finish = () => {
    tip.hidden = true;
    tip.textContent = '';
    tip.innerHTML = '';
    tip.classList.remove('swrm-floating-tip--rich', 'swrm-floating-tip--pre');
    swrmFloatTipAnchor = null;
    swrmFloatTipIsVisible = false;
  };
  
  if (immediate) {
    finish();
    return;
  }
  
  swrmFloatTipHideTimer = window.setTimeout(finish, SWRM_FLOAT_TIP_HIDE_MS);
}

/**
 * Normalize tooltip text
 */
function normalizeSwrmTipText(text: string | null | undefined): string {
  return String(text || '').trim();
}

/**
 * Paint floating tip immediately
 */
function paintSwrmFloatTipNow(anchor: HTMLElement, tipHtml: string, tipText: string): void {
  const tip = ensureSwrmFloatTipEl();
  if (tipHtml) {
    tip.innerHTML = tipHtml;
    tip.classList.add('swrm-floating-tip--rich');
    tip.classList.remove('swrm-floating-tip--pre');
  } else {
    tip.textContent = tipText;
    tip.classList.remove('swrm-floating-tip--rich');
    tip.classList.add('swrm-floating-tip--pre');
  }
  tip.hidden = false;
  swrmFloatTipIsVisible = true;
  requestAnimationFrame(() => {
    if (swrmFloatTipAnchor !== anchor) return;
    positionSwrmFloatTip(anchor);
  });
}

/**
 * Show floating tip
 */
function showSwrmFloatTip(anchor: HTMLElement, text: string, isHtml: boolean): void {
  const tipHtml = isHtml ? String(text || '').trim() : '';
  const tipText = isHtml ? '' : normalizeSwrmTipText(text);
  if (!anchor || (!tipText && !tipHtml)) return;
  
  if (swrmFloatTipShowTimer) {
    clearTimeout(swrmFloatTipShowTimer);
    swrmFloatTipShowTimer = null;
  }
  if (swrmFloatTipHideTimer) {
    clearTimeout(swrmFloatTipHideTimer);
    swrmFloatTipHideTimer = null;
  }
  
  swrmFloatTipAnchor = anchor;
  if (SWRM_FLOAT_TIP_SHOW_MS <= 0) {
    paintSwrmFloatTipNow(anchor, tipHtml, tipText);
    return;
  }
  swrmFloatTipShowTimer = window.setTimeout(() => {
    swrmFloatTipShowTimer = null;
    if (swrmFloatTipAnchor !== anchor) return;
    paintSwrmFloatTipNow(anchor, tipHtml, tipText);
  }, SWRM_FLOAT_TIP_SHOW_MS);
}

/**
 * Set floating tip target
 */
export function setSwrmFloatTipTarget(el: HTMLElement, text: string, options: { html?: string }): void {
  if (!el) return;
  const opts = options && typeof options === 'object' ? options : {};
  const tipHtml = String(opts.html || '').trim();
  const tipText = normalizeSwrmTipText(text);
  
  if (tipHtml) {
    el.setAttribute('data-swrm-tip-html', tipHtml);
    el.removeAttribute('data-swrm-tip');
    el.removeAttribute('title');
  } else if (tipText) {
    el.setAttribute('data-swrm-tip', tipText);
    el.removeAttribute('data-swrm-tip-html');
    el.removeAttribute('title');
  } else {
    el.removeAttribute('data-swrm-tip');
    el.removeAttribute('data-swrm-tip-html');
    el.removeAttribute('title');
  }
}

/**
 * Show floating tip from target element
 */
function showSwrmFloatTipFromTarget(anchor: HTMLElement): void {
  if (!anchor) return;
  const html = anchor.getAttribute('data-swrm-tip-html');
  if (html) {
    showSwrmFloatTip(anchor, html, true);
    return;
  }
  showSwrmFloatTip(anchor, anchor.getAttribute('data-swrm-tip') || '', false);
}

/**
 * Initialize floating tips system
 */
export function initSwrmFloatingTips(): void {
  if (initSwrmFloatingTips._done) return;
  initSwrmFloatingTips._done = true;

  function attachTooltipToElement(el: Element): void {
    if (!el || el.hasAttribute('data-swrm-tip-attached')) return;
    el.setAttribute('data-swrm-tip-attached', 'true');
    
    el.addEventListener('mouseenter', () => {
      showSwrmFloatTipFromTarget(el as HTMLElement);
    });
    
    el.addEventListener('mouseleave', () => {
      if (swrmFloatTipAnchor === el) {
        hideSwrmFloatTip(true);
      }
    });
  }
  
  // Use MutationObserver to attach tooltip to dynamically added elements
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === 1) { // Element node
          const el = node as Element;
          const tipTargets = el.querySelectorAll('[data-swrm-tip],[data-swrm-tip-html]');
          tipTargets.forEach(attachTooltipToElement);
          if (el.hasAttribute && (el.hasAttribute('data-swrm-tip') || el.hasAttribute('data-swrm-tip-html'))) {
            attachTooltipToElement(el);
          }
        }
      }
    }
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
  
  // Attach to existing elements
  document.querySelectorAll('[data-swrm-tip],[data-swrm-tip-html]').forEach(attachTooltipToElement);
  
  window.addEventListener(
    'scroll',
    () => {
      if (swrmFloatTipAnchor) positionSwrmFloatTip(swrmFloatTipAnchor);
    },
    true,
  );
  window.addEventListener('resize', () => {
    if (swrmFloatTipAnchor) positionSwrmFloatTip(swrmFloatTipAnchor);
  });
}

// Static property to track initialization
initSwrmFloatingTips._done = false as boolean;
