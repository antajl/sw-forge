const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const partsDir = path.join(root, 'js', 'ui-parts');
const outPath = path.join(root, 'js', 'ui.js');
const partNames = [
  '01-preamble.js',
  '02-theme-nav.js',
  '03-i18n.js',
  '04-main-tabs.js',
  '05-stage-filters.js',
  '06-upload.js',
  '06b-ui-utils.js',
  '06c-dashboard-helpers.js',
  '07-depth.js',
  '08-dashboard.js',
  '09-table.js',
  '10-formulas-ui.js',
  '11-rules-ui.js',
  '11-constants-ui.js',
  '11-rules-bootstrap.js',
  '12-app-settings.js',
  '13-changelog.js',
  '14-monsters.js',
];
const banner = `// =============================================
// ui.js — built from js/ui-parts/ (do not edit by hand)
// Rebuild: node tools/build-ui.mjs
// =============================================

`;
const body = partNames
  .map((f) => {
    const raw = fs.readFileSync(path.join(partsDir, f), 'utf8');
    return raw.replace(/^\/\/ ui-parts\/[^\n]+\n/, '');
  })
  .join('\n');
fs.writeFileSync(outPath, banner + body, 'utf8');
console.log('wrote', outPath, body.length);
