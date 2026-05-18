/**
 * One-time migration to §3 layout. Safe to re-run (skips missing sources).
 * Run: node tools/migrate-structure.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function move(srcRel, dstRel) {
  const src = path.join(root, srcRel);
  const dst = path.join(root, dstRel);
  if (!fs.existsSync(src)) return false;
  ensureDir(path.dirname(dst));
  if (fs.existsSync(dst)) fs.unlinkSync(dst);
  fs.copyFileSync(src, dst);
  fs.unlinkSync(src);
  console.log('moved', srcRel, '->', dstRel);
  return true;
}

function remove(rel) {
  const p = path.join(root, rel);
  if (fs.existsSync(p)) {
    fs.unlinkSync(p);
    console.log('removed', rel);
  }
}

function moveDirContents(srcDir, dstDir) {
  const src = path.join(root, srcDir);
  if (!fs.existsSync(src)) return;
  ensureDir(path.join(root, dstDir));
  for (const name of fs.readdirSync(src)) {
    move(path.join(srcDir, name).replace(/\\/g, '/'), path.join(dstDir, name).replace(/\\/g, '/'));
  }
  if (fs.existsSync(src) && fs.readdirSync(src).length === 0) {
    fs.rmdirSync(src);
    console.log('removed dir', srcDir);
  }
}

ensureDir(path.join(root, 'js/core'));
ensureDir(path.join(root, 'js/data'));
ensureDir(path.join(root, 'css/foundation'));
ensureDir(path.join(root, 'css/features/monsters'));

moveDirContents('js/settings', 'js/core');
for (const f of ['parser.js', 'skill-db.js', 'monster-db.js']) {
  move(`js/${f}`, `js/data/${f}`);
}
remove('js/settings.js');

for (const f of ['base.css', 'header.css', 'overlays.css', 'toasts.css']) {
  move(`css/${f}`, `css/foundation/${f}`);
}

move('css/runes-hub.css', 'css/features/runes/hub.css');
move('css/rules.css', 'css/features/runes/rules.css');
move('css/stage-advisor.css', 'css/features/runes/stage-advisor.css');

moveDirContents('css/monsters', 'css/features/monsters');

remove('split-log.txt');
remove('tools/rebuild-ui.mjs');
remove('js/core/.migration-test');

const headerPath = path.join(root, 'css/foundation/header.css');
if (fs.existsSync(headerPath)) {
  let h = fs.readFileSync(headerPath, 'utf8');
  h = h.replaceAll("url('../assets/", "url('../../assets/");
  h = h.replace(
    'DEMO DATASET BAR (assets/demo.json)',
    'DEMO DATASET BAR (data/demo.json)',
  );
  fs.writeFileSync(headerPath, h, 'utf8');
  console.log('patched css/foundation/header.css asset URLs');
}

const overlaysPath = path.join(root, 'css/foundation/overlays.css');
if (fs.existsSync(overlaysPath)) {
  let o = fs.readFileSync(overlaysPath, 'utf8');
  if (o.includes('assets/demo.json')) {
    o = o.replace('assets/demo.json', 'data/demo.json');
    fs.writeFileSync(overlaysPath, o, 'utf8');
    console.log('patched css/foundation/overlays.css demo comment');
  }
}

console.log('Migration complete. Run: npm run build:ui');
