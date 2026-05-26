// tools/build-css.mjs — concatenate CSS partials → css/dist/app.css
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outPath = path.join(root, 'css/dist/app.css');

// Order follows css/style.css → feature index.css @import chains
const FILES = [
  'css/foundation/base.css',
  'css/foundation/header.css',
  'css/features/shell/donate-dialog.css',
  'css/foundation/overlays.css',
  'css/foundation/toasts.css',
  'css/foundation/action-chrome.css',
  'css/features/guide/archive.css',
  'css/features/app/settings.css',
  // runes/index.css
  'css/features/runes/typography.css',
  'css/features/runes/hub.css',
  'css/features/runes/stage-advisor.css',
  'css/features/runes/rules.css',
  'css/features/runes/grid.css',
  'css/features/runes/chrome.css',
  'css/features/runes/stat-cards.css',
  'css/features/runes/panel.css',
  'css/features/runes/dashboard-artifacts.css',
  'css/features/runes/chart-bars.css',
  'css/features/runes/slot-distribution.css',
  'css/features/runes/top-spd.css',
  'css/features/runes/eff-histo.css',
  'css/features/runes/floating-tip.css',
  'css/features/shared/table-zebra.css',
  'css/features/runes/table-toolbar.css',
  'css/features/runes/table-core.css',
  'css/features/runes/table-header.css',
  'css/features/runes/table-chips.css',
  // gear/index.css
  'css/features/gear/table-kind.css',
  'css/features/gear/table-filters.css',
  // teams/index.css
  'css/features/teams/teams.css',
  'css/features/teams/teams-v2.css',
  // monsters/index.css
  'css/features/monsters/tokens.css',
  'css/features/monsters/box-overview.css',
  'css/features/monsters/skill-planner.css',
  'css/features/monsters/hub.css',
  'css/features/monsters/toolbar-v2.css',
  'css/features/monsters/toolbar.css',
  'css/features/monsters/elements.css',
  'css/features/monsters/bulk.css',
  'css/features/monsters/detail-runes.css',
  'css/features/monsters/detail-gear.css',
  'css/features/monsters/shell.css',
  'css/features/monsters/toolbar-controls.css',
  'css/features/monsters/list-runes.css',
  'css/features/monsters/cards.css',
  'css/features/monsters/table.css',
  'css/features/monsters/rune-slots.css',
  'css/features/monsters/detail.css',
  'css/features/monsters/table-link.css',
  'css/features/monsters/card-meta.css',
  'css/features/monsters/detail-tabs.css',
  'css/features/monsters/tags-bulk-stats.css',
  'css/features/monsters/responsive.css',
];

fs.mkdirSync(path.join(root, 'css/dist'), { recursive: true });

const missing = [];
const body = FILES.map((f) => {
  const full = path.join(root, f);
  if (!fs.existsSync(full)) {
    missing.push(f);
    return '';
  }
  return `/* === ${f} === */\n${fs.readFileSync(full, 'utf8')}`;
})
  .filter(Boolean)
  .join('\n\n');

if (missing.length) {
  console.error('missing files:', missing.join(', '));
  process.exit(1);
}

fs.writeFileSync(outPath, body, 'utf8');
console.log('wrote', path.relative(root, outPath), 'from', FILES.length, 'files');
