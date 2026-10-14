// src/features/shell/language-bindings.ts — UI translation bindings
import { getShellState, updateShellState, APP_LANG_KEY } from './bootstrap';

interface LazyTranslationSource {
  globalName: string;
  src: string;
  label: string;
}

const LAZY_TRANSLATION_SOURCES: Record<string, LazyTranslationSource> = {
  fr: {
    globalName: 'TRANSLATIONS_FR',
    src: 'js/core/translations-fr.js',
    label: 'French',
  },
  zh: {
    globalName: 'TRANSLATIONS_ZH',
    src: 'js/core/translations-zh.js',
    label: 'Chinese',
  },
};

declare global {
  interface Window {
    TRANSLATIONS?: Record<string, Translation>;
    [key: string]: any;
  }
}

function lazyTranslationsReady(lang: string): boolean {
  const pack = window.TRANSLATIONS?.[lang];
  return Boolean(pack && typeof pack === 'object' && pack.title && pack.guideSubtabStart);
}

function getTranslationsForLang(lang: string): Translation {
  if (LAZY_TRANSLATION_SOURCES[lang]) {
    return lazyTranslationsReady(lang) ? (window.TRANSLATIONS?.[lang] || {}) : (window.TRANSLATIONS?.en || {});
  }
  return window.TRANSLATIONS?.[lang] || window.TRANSLATIONS?.en || {};
}

function loadLazyTranslations(lang: string): Promise<void> {
  const config = LAZY_TRANSLATION_SOURCES[lang];
  if (!config) return Promise.resolve();
  if (lazyTranslationsReady(lang)) return Promise.resolve();
  const existing = window[config.globalName];
  if (existing) {
    window.TRANSLATIONS = window.TRANSLATIONS || {};
    window.TRANSLATIONS[lang] = { ...window.TRANSLATIONS.en, ...existing };
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = config.src;
    s.onload = () => {
      window.TRANSLATIONS = window.TRANSLATIONS || {};
      window.TRANSLATIONS[lang] = {
        ...window.TRANSLATIONS.en,
        ...(window[config.globalName] || {}),
      };
      resolve();
    };
    s.onerror = () => reject(new Error(`Failed to load ${config.label} translations`));
    document.head.appendChild(s);
  });
}

export async function updateLanguage(lang: 'en' | 'ru' | 'fr' | 'zh'): Promise<void> {
  if (LAZY_TRANSLATION_SOURCES[lang]) await loadLazyTranslations(lang);
  updateShellState({ currentLang: lang });
  localStorage.setItem(APP_LANG_KEY, lang);
  const t = getTranslationsForLang(lang);

  document.documentElement.lang =
    lang === 'ru' ? 'ru' : lang === 'fr' ? 'fr' : lang === 'zh' ? 'zh' : 'en';

  // Update title
  document.title = t.title || 'SW Forge';
  const siteLogoLink = document.getElementById('site-logo-link');
  if (siteLogoLink) siteLogoLink.setAttribute('aria-label', t.title || 'SW Forge');

  // Update tabs
  const setMainNavTabLabel = (btn: HTMLElement | null, text: string | undefined): void => {
    if (!btn || text == null) return;
    const label = btn.querySelector('.tab__label');
    if (label) label.textContent = text;
    btn.setAttribute('title', text);
  };

  setMainNavTabLabel(document.querySelector('[data-tab="dashboard"]') as HTMLElement, t.dashboardTab);
  setMainNavTabLabel(document.querySelector('[data-tab="gear"]') as HTMLElement, t.dashboard);
  setMainNavTabLabel(document.querySelector('[data-tab="monsters"]') as HTMLElement, t.monsters);
  setMainNavTabLabel(document.querySelector('[data-tab="guide"]') as HTMLElement, t.guide);
  setMainNavTabLabel(document.querySelector('[data-tab="changelog"]') as HTMLElement, t.changelog);
  setMainNavTabLabel(document.querySelector('[data-tab="app-settings"]') as HTMLElement, t.appSettings);

  // Update header elements
  const uploadLabel = document.querySelector('label[for="json-upload"] span');
  if (uploadLabel) uploadLabel.textContent = t.loadJson || '';
  const settingsBtn = document.getElementById('open-app-settings');
  if (settingsBtn) settingsBtn.textContent = t.settings || '';

  // Update stage options
  const stageSelect = document.getElementById('stage-select') as HTMLSelectElement;
  if (stageSelect) {
    const { stage } = getShellState();
    const preserved = ['Early', 'Mid', 'Late'].includes(stage) ? stage : 'Mid';
    stageSelect.innerHTML = `
      <option value="Early">${t.early || ''}</option>
      <option value="Mid">${t.mid || ''}</option>
      <option value="Late">${t.late || ''}`;
    stageSelect.value = preserved;
  }
}
