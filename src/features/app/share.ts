// src/features/app/share.ts — Share Profile (simplified)
import { getShellState } from '../shell/bootstrap';

const SHARE_QUERY_KEY = 's';
const SHARE_MODE_STORAGE_KEY = 'swrm_share_mode_v1';

const SHARE_MODE_LABEL_KEYS: Record<string, string> = {
  all: 'shareModeAll',
  'equipped-monsters': 'shareModeEquippedMonsters',
  'equipped-runes': 'shareModeEquippedRunes',
  'equipped-both': 'shareModeEquippedBoth',
  selected: 'shareModeSelected',
  favorites: 'shareModeFavorites',
};

let shareExportMode = 'all';

function readStoredShareMode(): string {
  try {
    const v = localStorage.getItem(SHARE_MODE_STORAGE_KEY);
    return v && SHARE_MODE_LABEL_KEYS[v] ? v : 'all';
  } catch (e) {
    return 'all';
  }
}

function writeStoredShareMode(mode: string): void {
  try {
    localStorage.setItem(SHARE_MODE_STORAGE_KEY, mode);
  } catch (e) {
    // ignore
  }
}

export function getShareExportMode(): string {
  return shareExportMode;
}

export function setShareExportMode(mode: string): void {
  if (!SHARE_MODE_LABEL_KEYS[mode]) mode = 'all';
  shareExportMode = mode;
  writeStoredShareMode(mode);
  syncShareSplitLabels();
}



function syncShareSplitLabels(): void {
  const { currentLang } = getShellState();
  const t = (window.TRANSLATIONS?.[currentLang] || window.TRANSLATIONS?.en || {}) as Translation;
  const mainLabel = t.shareButtonLabel || 'Share';
  document.querySelectorAll('[data-share-split-label]').forEach((el) => {
    el.textContent = mainLabel;
  });
  document.querySelectorAll('[data-share-mode]').forEach((btn) => {
    const on = (btn as HTMLElement).dataset.shareMode === shareExportMode;
    btn.classList.toggle('is-active', on);
    btn.setAttribute('aria-checked', on ? 'true' : 'false');
  });
}

function getShareIdFromUrl(): string {
  try {
    return new URL(window.location.href).searchParams.get(SHARE_QUERY_KEY) || '';
  } catch (e) {
    return '';
  }
}

function sharePageUrl(shareId: string): string {
  const base = `${window.location.origin}${window.location.pathname}`;
  return `${base}?${SHARE_QUERY_KEY}=${encodeURIComponent(shareId)}`;
}

async function copyTextToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      // fallback
    }
  }
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch (e) {
    // ignore
  }
  document.body.removeChild(ta);
  if (!ok) throw new Error('Clipboard unavailable');
  return true;
}

async function copyShareLink(_mode: string): Promise<void> {
  const { currentLang } = getShellState();
  const t = (window.TRANSLATIONS?.[currentLang] || window.TRANSLATIONS?.en || {}) as Translation;
  const id = getShareIdFromUrl();
  const url = sharePageUrl(id);
  await copyTextToClipboard(url);
  // Note: showSwrmToast would need to be implemented
  console.log(t.shareLinkCopiedLong || t.shareLinkCopied || 'Share link copied');
}

export function initShare(): void {
  shareExportMode = readStoredShareMode();
  syncShareSplitLabels();
}

export { sharePageUrl, copyShareLink };
