#!/usr/bin/env node
/** Find FR strings identical to EN (likely untranslated) and changelog count mismatches. */
import fs from 'fs';
import vm from 'vm';

const enSrc = fs.readFileSync('js/core/translations-en.js', 'utf8');
const frSrc = fs
  .readFileSync('js/core/translations-fr.js', 'utf8')
  .replace('window.TRANSLATIONS_FR', 'const TRANSLATIONS_FR');

function loadMap(src, exportName) {
  const sandbox = {};
  vm.runInNewContext(`${src}\nsandbox.out = ${exportName};`, { sandbox });
  return sandbox.out;
}

const en = loadMap(enSrc, 'TRANSLATIONS_EN');
const fr = loadMap(frSrc, 'TRANSLATIONS_FR');

const identical = [];
for (const k of Object.keys(en)) {
  if (fr[k] === en[k] && en[k].length > 2) identical.push([k, en[k]]);
}
console.log('FR keys identical to EN:', identical.length);
for (const [k, v] of identical.slice(0, 40)) {
  console.log(`  ${k}: ${v.slice(0, 80)}`);
}

const changelogSrc = fs.readFileSync('js/core/changelog-data.js', 'utf8');
const clCtx = { STATIC_CHANGELOG: null };
vm.runInNewContext(changelogSrc + '\nthis.STATIC_CHANGELOG = STATIC_CHANGELOG;', clCtx);
const cl = clCtx.STATIC_CHANGELOG;
let clMismatch = 0;
for (const entry of cl) {
  const n = entry.items.en?.length ?? 0;
  const r = entry.items.ru?.length ?? 0;
  const f = entry.items.fr?.length ?? 0;
  if (n !== f || n !== r) {
    clMismatch++;
    console.log(`Changelog ${entry.date}: en=${n} ru=${r} fr=${f}`);
  }
}
if (!clMismatch) console.log('Changelog: all entries have matching en/ru/fr counts');
