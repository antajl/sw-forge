/**
 * Watch js/ui-parts/*.js and rebuild js/ui.js on change.
 * Run: node tools/watch-ui.mjs
 */
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const partsDir = path.join(root, 'js/ui-parts');
const buildScript = path.join(root, 'tools/build-ui.mjs');

function runBuild() {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [buildScript], {
      cwd: root,
      stdio: 'inherit',
    });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`build-ui.mjs exited with ${code}`));
    });
  });
}

let debounceTimer = null;

function scheduleRebuild(label) {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    const tag = label ? ` (${label})` : '';
    process.stdout.write(`[watch-ui] rebuild${tag}…\n`);
    try {
      await runBuild();
      process.stdout.write('[watch-ui] wrote js/ui.js\n');
    } catch (e) {
      process.stderr.write(`[watch-ui] failed: ${e.message}\n`);
    }
  }, 120);
}

await runBuild();
process.stdout.write('[watch-ui] watching js/ui-parts/ (Ctrl+C to stop)\n');

fs.watch(partsDir, { recursive: true }, (_event, filename) => {
  if (!filename || !String(filename).endsWith('.js')) return;
  scheduleRebuild(path.basename(filename));
});
