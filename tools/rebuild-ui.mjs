/**
 * Rebuild js/ui.js from js/ui-parts/*.js (same as build-ui.mjs, explicit entry point).
 * Run: node tools/rebuild-ui.mjs
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const r = spawnSync(process.execPath, ['tools/build-ui.mjs'], {
  cwd: root,
  stdio: 'inherit',
  encoding: 'utf8',
});
process.exit(r.status ?? 1);
