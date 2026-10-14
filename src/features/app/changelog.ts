// src/features/app/changelog.ts — changelog and roadmap rendering
import { getShellState } from '../shell/bootstrap';

interface ChangelogRelease {
  date: string;
  items: Record<string, string[]>;
}

interface RoadmapSection {
  id?: string;
  kicker?: string;
  phase?: string;
  lead?: string;
  title: string;
  items: (string | { text: string })[];
}

interface RoadmapPack {
  intro?: string;
  sections: RoadmapSection[];
  outOfScope?: {
    title: string;
    items: string[];
  };
}

function escapeChangelogText(s: string | undefined): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatChangelogDate(isoDate: string): string {
  if (!isoDate) return isoDate;
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  const [year, month, day] = parts;
  const { currentLang } = getShellState();
  if (currentLang === 'ru') return `${day}.${month}.${year}`;
  if (currentLang === 'fr') return `${day}/${month}/${year}`;
  return `${month}/${day}/${year}`;
}

function changelogItemsForLang(rel: ChangelogRelease, lang: string): string[] {
  const pack = (rel.items && rel.items[lang]) || rel.items?.en;
  if (!pack) return [];
  if (Array.isArray(pack)) return pack;
  if (Array.isArray((pack as any).shipped)) return (pack as any).shipped;
  return [];
}

function roadmapLangKey(): string {
  const { currentLang } = getShellState();
  return currentLang === 'ru' ? 'ru' : currentLang === 'fr' ? 'fr' : 'en';
}

function roadmapPackForLang(lang: string): RoadmapPack | null {
  const raw =
    (window.SWRM?.STATIC_ROADMAP && window.SWRM.STATIC_ROADMAP[lang]) ||
    (window.SWRM?.STATIC_ROADMAP && window.SWRM.STATIC_ROADMAP.en);
  if (!raw) return null;
  if (Array.isArray(raw)) {
    return {
      intro: '',
      sections: [{ id: 'legacy', title: 'Plans', items: raw.map((text) => ({ text })) }],
      outOfScope: undefined,
    };
  }
  return raw;
}

function renderRoadmapSection(sec: RoadmapSection, idx: number): string {
  const sid = escapeChangelogText(sec.id || `sec-${idx}`);
  const titleId = `roadmap-h-${sid}`;
  const kicker = sec.kicker
    ? `<span class="roadmap-section__kicker">${escapeChangelogText(sec.kicker)}</span>`
    : '';
  const phase = sec.phase
    ? `<span class="roadmap-phase">${escapeChangelogText(sec.phase)}</span>`
    : '';
  const lead = sec.lead
    ? `<p class="guide-lead">${escapeChangelogText(sec.lead)}</p>`
    : '';
  const items = (sec.items || [])
    .map((item) => {
      const text = typeof item === 'string' ? item : item.text;
      return `<li><span class="guide-checklist__icon" aria-hidden="true">◇</span><span>${escapeChangelogText(text)}</span></li>`;
    })
    .join('');
  return `<section class="guide-section roadmap-section" aria-labelledby="${titleId}">
      <div class="roadmap-section__head">
        ${kicker}
        <h3 class="roadmap-section__title" id="${titleId}">${escapeChangelogText(sec.title)}</h3>
        ${phase}
      </div>
      ${lead}
      <ul class="guide-checklist">${items}</ul>
    </section>`;
}

export function renderChangelog(): void {
  const list = document.getElementById('changelog-list');
  if (!list) return;
  try {
    localStorage.removeItem('swrm_changelog_v1');
  } catch (e) {
    // ignore
  }
  const { currentLang } = getShellState();
  const t = (window.TRANSLATIONS?.[currentLang] || window.TRANSLATIONS?.en || {}) as Translation;
  const releases = window.SWRM?.STATIC_CHANGELOG || [];
  if (!releases.length) {
    list.innerHTML = `<p class="settings-desc">${escapeChangelogText(t.changelogEmpty || '')}</p>`;
    return;
  }
  const lang = roadmapLangKey();
  list.innerHTML = releases
    .map((rel) => {
      const items = changelogItemsForLang(rel, lang);
      const ul = items.length
        ? `<ul class="changelog-bullets">${items.map((tx) => `<li>${escapeChangelogText(tx)}</li>`).join('')}</ul>`
        : `<p class="settings-desc">${escapeChangelogText(t.changelogEmpty || '')}</p>`;
      return `<article class="changelog-release"><h3 class="changelog-release-date">${escapeChangelogText(formatChangelogDate(rel.date))}</h3>${ul}</article>`;
    })
    .join('');
}

export function renderRoadmap(): void {
  const list = document.getElementById('changelog-roadmap-list');
  if (!list) return;
  const { currentLang } = getShellState();
  const t = (window.TRANSLATIONS?.[currentLang] || window.TRANSLATIONS?.en || {}) as Translation;
  const pack = roadmapPackForLang(roadmapLangKey());
  if (!pack || (!pack.sections?.length && !pack.intro)) {
    list.innerHTML = `<p class="settings-desc">${escapeChangelogText(t.changelogRoadmapEmpty || '')}</p>`;
    return;
  }
  const intro = pack.intro
    ? `<section class="guide-section guide-section--hero roadmap-section roadmap-section--intro" aria-labelledby="roadmap-intro-title">
        <h3 id="roadmap-intro-title">${escapeChangelogText(t.changelogSubtabRoadmap || 'Roadmap')}</h3>
        <p class="guide-lead">${escapeChangelogText(pack.intro)}</p>
      </section>`
    : '';
  const sections = (pack.sections || []).map((sec, i) => renderRoadmapSection(sec, i)).join('');
  const oos = pack.outOfScope;
  const outBlock = oos?.items?.length
    ? `<section class="guide-section roadmap-section roadmap-section--oos" aria-labelledby="roadmap-oos-title">
        <h3 id="roadmap-oos-title">${escapeChangelogText(oos.title)}</h3>
        <div class="guide-callout guide-callout--warn">
          <ul class="guide-bullets">${oos.items.map((tx) => `<li>${escapeChangelogText(tx)}</li>`).join('')}</ul>
        </div>
      </section>`
    : '';
  list.innerHTML = `<div class="roadmap-grid__inner">${intro}${sections}${outBlock}</div>`;
}
