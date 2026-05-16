/**
 * One-off splitter: CSS @import partials + ui.js → js/ui/* modules (SWRM_UI namespace).
 * Run: node tools/refactor-split.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function write(rel, content) {
  const p = path.join(root, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content, 'utf8');
  console.log('wrote', rel);
}

// --- CSS ---
const css = fs.readFileSync(path.join(root, 'css/style.css'), 'utf8');
const cssLines = css.split('\n');
const cssChunks = [
  ['css/base.css', 1, 184],
  ['css/header.css', 185, 489],
  ['css/stage-advisor.css', 490, 1417],
  ['css/overlays.css', 1418, 1882],
  ['css/dashboard.css', 1883, 3038],
  ['css/rune-table.css', 3039, 4165],
  ['css/rules.css', 4166, 4752],
  ['css/toasts.css', 4753, cssLines.length],
];
for (const [file, start, end] of cssChunks) {
  const slice = cssLines.slice(start - 1, end).join('\n').trimEnd() + '\n';
  write(file, slice);
}
write(
  'css/style.css',
  `/* SW Rune Master — split styles (loaded via @import) */\n${cssChunks
    .map(([f]) => `@import url('./${path.basename(f)}');`)
    .join('\n')}\n`,
);

// --- UI ---
const uiSrc = fs.readFileSync(path.join(root, 'js/ui.js'), 'utf8');
const bodyMatch = uiSrc.match(/\(function\s*\(\)\s*\{([\s\S]*)\}\)\(\)\s*;/);
if (!bodyMatch) throw new Error('ui.js IIFE not found');
const body = bodyMatch[1];

const STATE_AND_MUTABLE = [
  'allRunes',
  'processedRunes',
  'stage',
  'sortKey',
  'sortDir',
  'runeTableShowAll',
  'runeTableApplyingHash',
  'tableSearchHighlight',
  'searchDebounceTimer',
  'globalMinLevel',
  'globalGradeMin',
  'globalGradeMax',
  'currentLang',
  'currentTheme',
  'rulesSubtabsBound',
  'changelogSubtabsBound',
  'guideSubtabsBound',
  'swrmDropVeilDragging',
  'swrmFloatTipEl',
  'swrmFloatTipShowTimer',
  'swrmFloatTipHideTimer',
  'swrmFloatTipAnchor',
  'filteredRunes',
  'idb',
];

const CONST_ON_C = [
  'APP_LANG_KEY',
  'RUNE_TABLE_PAGE',
  'RUNE_TABLE_SORT_KEYS',
  'RUNE_TABLE_ANCIENT_ONLY_KEY',
  'RUNE_TABLE_HIDE_TARGET_KEY',
  'STAGE_PROGRESSION_EXPANDED_KEY',
  'TOP_SPD_STORAGE_KEY',
  'TOP_SPD_DEFAULT_SET',
  'TOP_SPD_PER_SLOT',
  'DASH_UNIFIED_DIST_KEY',
  'DASH_DIST_TAB_LEGACY_KEY',
  'RULES_SUBTAB_KEY',
  'CHANGELOG_SUBTAB_KEY',
  'GUIDE_SUBTAB_KEY',
  'MAIN_TAB_IDS',
  'LS_USING_DEMO',
  'LS_USER_LOADED_REAL',
  'SS_DEMO_BANNER_DISMISS',
  'SWRM_FLOAT_TIP_SHOW_MS',
  'SWRM_FLOAT_TIP_HIDE_MS',
  'VERDICT_LABEL_MAP',
  'DASH_CHART_ROW_FLIP_MS',
  'DASH_VERDICT_SEG_ORDER',
  'DASH_VERDICT_SEG_CSS',
  'ANCIENT_GRADE_ICON_SVG',
  'STAT_SUB_GEM_ICON_SVG',
  'HR_PREVIEW_COL_KEYS',
  'DB_SLOTS_META_KEY',
  'DB_NAME',
  'DB_VERSION',
  'STORE_NAME',
];

const SWRM_BINDINGS = [
  'parseSWEX',
  'extractSwexSummary',
  'countAllSwexRunes',
  'processAll',
  'STAT_NAMES',
  'SET_NAMES',
  'GRADE_SHORT',
  'saveSettings',
  'DEFAULT_STAT_CONSTANTS',
  'DEFAULT_THRESHOLDS',
  'DEFAULT_FORMULAS',
  'DEFAULT_ROLES',
  'DEFAULT_REAPP',
  'DEFAULT_GRIND',
  'DEFAULT_GEM_META',
  'TRANSLATIONS',
];

function transformModule(section) {
  let s = section;
  s = s.replace(/^  function (\w+)\(/gm, '  C.$1 = function (');
  for (const v of STATE_AND_MUTABLE) {
    s = s.replace(new RegExp(`\\b${v}\\b`, 'g'), `C.${v}`);
  }
  return s;
}

const sectionRe = /  \/\/ =====================[^\n]*\n/g;
const indices = [...body.matchAll(sectionRe)].map((m) => m.index);
const headers = [...body.matchAll(sectionRe)].map((m) => m[0]);

const parts = [];
if (indices[0] > 0) parts.push({ head: 'preamble', content: body.slice(0, indices[0]) });
for (let i = 0; i < indices.length; i++) {
  const start = indices[i];
  const end = i + 1 < indices.length ? indices[i + 1] : body.length;
  const title = headers[i].trim().replace(/\//g, '').replace(/=+/g, '').trim() || `part${i}`;
  parts.push({ head: title, content: body.slice(start, end) });
}

const moduleMap = [
  [/THEME|LANGUAGE/, 'shell.js'],
  [/TABS|STAGE/, 'shell.js'],
  [/FILE UPLOAD|GAME STAGE/, 'data-load.js'],
  [/DASHBOARD/, 'dashboard.js'],
  [/TABLE/, 'table.js'],
  [/ADVANCED FORMULAS|SETTINGS UI/, 'settings-ui.js'],
  [/APP SETTINGS/, 'app-settings.js'],
  [/CHANGELOG/, 'changelog.js'],
];

const buckets = new Map();
for (const p of parts) {
  let file = 'misc.js';
  for (const [re, name] of moduleMap) {
    if (re.test(p.head)) {
      file = name;
      break;
    }
  }
  if (!buckets.has(file)) buckets.set(file, []);
  buckets.get(file).push(p.content);
}

const preamble = parts.find((p) => p.head === 'preamble')?.content || '';

const contextJs = `// Shared UI state and SWRM bindings (load first).
(function (g) {
  'use strict';
  const SWRM = g.SWRM || {};
  const C = {
    SWRM,
${SWRM_BINDINGS.map((k) => `    ${k}: SWRM.${k},`).join('\n')}
  };
${preamble
  .split('\n')
  .map((line) => {
    let l = line;
    for (const v of STATE_AND_MUTABLE) l = l.replace(new RegExp(`\\b${v}\\b`, 'g'), `C.${v}`);
    for (const k of CONST_ON_C) {
      if (l.includes(`const ${k}`) || l.includes(`let ${k}`)) l = l.replace(`const ${k}`, `C.${k}`);
    }
    if (l.includes('const { parseSWEX')) {
      return '  // SWRM exports bound on C above';
    }
    return l;
  })
  .join('\n')}
  g.SWRM_UI = C;
})(typeof window !== 'undefined' ? window : globalThis);
`;

write('js/ui/context.js', contextJs);

for (const [file, chunks] of buckets) {
  const mod = `// ui/${file}
(function (C) {
  'use strict';
  if (!C) return;
${chunks.map(transformModule).join('\n')}
})(window.SWRM_UI);
`;
  write(`js/ui/${file}`, mod);
}

// Backup original monolith
if (!fs.existsSync(path.join(root, 'js/ui.monolith.bak.js'))) {
  fs.writeFileSync(path.join(root, 'js/ui.monolith.bak.js'), uiSrc, 'utf8');
  console.log('backup js/ui.monolith.bak.js');
}

// --- settings.js split ---
const settingsSrc = fs.readFileSync(path.join(root, 'js/settings.js'), 'utf8');
if (!fs.existsSync(path.join(root, 'js/settings.monolith.bak.js'))) {
  fs.writeFileSync(path.join(root, 'js/settings.monolith.bak.js'), settingsSrc, 'utf8');
}

const settingsLines = settingsSrc.split('\n');
function sliceLines(start, end) {
  return settingsLines.slice(start - 1, end).join('\n').trimEnd() + '\n';
}

write('js/settings/meta.js', sliceLines(1, 64));
write('js/settings/i18n.js', sliceLines(65, 1146));
write('js/settings/defaults.js', sliceLines(1147, 1607));
write('js/settings/changelog-data.js', sliceLines(1608, 1742));
write(
  'js/settings/bootstrap.js',
  `${sliceLines(1744, settingsLines.length).replace(/^window\.SWRM = window\.SWRM \|\| \{\};\n/, '')}`,
);
write(
  'js/settings.js',
  `// settings.js — load chain (order matters)
// meta → i18n → defaults → changelog-data → bootstrap
`,
);
