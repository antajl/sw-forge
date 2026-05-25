/**
 * Concatenate ordered UI feature files → js/ui.js (no transforms; same IIFE closure).
 * Rebuild after edits: npm run build:ui
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const featuresDir = path.join(root, 'js/features');
const outPath = path.join(root, 'js/ui.js');

/** Concat order — must match runtime dependencies inside the IIFE */
const CHUNKS = [
  'shell/bootstrap.js',
  'shell/theme-nav.js',
  'shell/donate-dialog.js',
  'shell/i18n-bindings.js',
  'shell/mobile-nav.js',
  'shell/filters-popover.js',
  'shell/main-tabs.js',
  'runes/stage-filters.js',
  'runes/rune-processor-worker.js',
  'runes/processed-cache.js',
  'runes/upload.js',
  'runes/utils.js',
  'runes/verdict-filters.js',
  'runes/charts.js',
  'runes/copy-summary.js',
  'runes/stage-advisor-ui.js',
  'runes/depth.js',
  'runes/dashboard.js',
  'runes/rune-score.js',
  'runes/table-row-render.js',
  'runes/table-virtual.js',
  'runes/table-filters.js',
  'gear/table-kind.js',
  'gear/gear-roster-chips.js',
  'gear/artifacts-table.js',
  'gear/relics-table.js',
  'runes/table.js',
  'rules/formulas-ui.js',
  'rules/panel.js',
  'rules/constants-ui.js',
  'rules/bootstrap.js',
  'rules/policy-ui.js',
  'app/settings-ui.js',
  'app/share.js',
  'app/changelog.js',
  'monsters/bootstrap.js',
];

/** Concatenated before monsters/bootstrap.js (same IIFE scope) */
const MONSTER_PARTS = [
  'monsters/monsters-state.js',
  'monsters/monsters-hub.js',
  'monsters/monsters-stats-calc.js',
  'teams/storage.js',
  'teams/ui.js',
  'monsters/monsters-storage.js',
  'monsters/monsters-bulk.js',
  'monsters/monsters-filters.js',
  'monsters/box-overview.js',
  'monsters/skill-planner.js',
  'monsters/monsters-gear.js',
  'monsters/monsters-runes.js',
  'monsters/monsters-detail.js',
  'monsters/monsters-card.js',
  'monsters/monsters-table.js',
  'monsters/monsters-list.js',
  'monsters/monsters-events.js',
];

function featurePath(relPath) {
  return path.join(featuresDir, relPath);
}

const missing = CHUNKS.filter((name) => !fs.existsSync(featurePath(name)));
if (missing.length) {
  console.error('Missing feature UI parts:', missing.join(', '));
  process.exit(1);
}

const banner = `// =============================================
// ui.js — built from js/features/ (do not edit by hand)
// Rebuild: npm run build:ui
// =============================================

`;

const lastPart = CHUNKS[CHUNKS.length - 1];
for (let i = 0; i < CHUNKS.length - 1; i++) {
  const name = CHUNKS[i];
  const raw = fs.readFileSync(featurePath(name), 'utf8');
  if (/\}\)\(\);\s*$/.test(raw.trim())) {
    console.error(`js/features/${name} must not close the IIFE — only ${lastPart} may end with })();`);
    process.exit(1);
  }
}

function readPart(relPath, stripHeader) {
  const full = featurePath(relPath);
  let raw = fs.readFileSync(full, 'utf8');
  if (stripHeader) {
    raw = raw.replace(/^\/\/ (?:ui-parts|js\/monsters|js\/features)\/[^\n]+\n/, '');
  }
  return raw;
}

const missingMonsters = MONSTER_PARTS.filter((f) => !fs.existsSync(featurePath(f)));
const useMonsterModules = missingMonsters.length === 0;
if (!useMonsterModules && missingMonsters.length < MONSTER_PARTS.length) {
  console.error('Partial js/features/monsters/ — expected all monster modules');
  process.exit(1);
}
if (!useMonsterModules) {
  console.warn('Using monolithic js/features/monsters/bootstrap.js only');
}

const body = CHUNKS.flatMap((f) => {
  if (f === 'monsters/bootstrap.js' && useMonsterModules) {
    return [...MONSTER_PARTS.map((mp) => readPart(mp, true)), readPart(f, true)];
  }
  return [readPart(f, true)];
}).join('\n');

fs.writeFileSync(outPath, banner + body, 'utf8');
console.log('wrote js/ui.js from', CHUNKS.length, 'chunks (', body.split('\n').length, 'lines )');
