#!/usr/bin/env node
/**
 * Rebuild js/core/translations-fr.js from translations-en.js using SW FR terminology.
 * Run: node tools/rebuild-translations-fr.mjs
 */
import fs from 'fs';
import vm from 'vm';
import { FR_OVERRIDES, applySwFrGlossary } from './translations-fr-dictionary.mjs';

function loadEn() {
  const src = fs.readFileSync('js/core/translations-en.js', 'utf8');
  const sandbox = {};
  vm.runInNewContext(`${src}\nsandbox.out = TRANSLATIONS_EN;`, { sandbox });
  return sandbox.out;
}

function escapeJsString(s) {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');
}

function formatValue(value) {
  const s = String(value);
  if (s.includes('\n')) {
    const lines = s.split('\n');
    return `    '${escapeJsString(lines[0])}' +\n      '${escapeJsString(lines.slice(1).join('\n'))}'`;
  }
  return `'${escapeJsString(s)}'`;
}

const en = loadEn();
const keys = Object.keys(en);
const fr = {};

for (const key of keys) {
  if (FR_OVERRIDES[key] != null) {
    fr[key] = FR_OVERRIDES[key];
  } else {
    fr[key] = applySwFrGlossary(en[key], key);
  }
}

const lines = [
  '// js/core/translations-fr.js — French UI strings (lazy-loaded on language switch)',
  'window.TRANSLATIONS_FR = {',
];

for (const key of keys) {
  const val = fr[key];
  if (String(val).includes('\n')) {
    lines.push(`  ${key}:`);
    lines.push(`    ${formatValue(val)},`);
  } else {
    lines.push(`  ${key}: ${formatValue(val)},`);
  }
}

lines.push('};');
lines.push('');

fs.writeFileSync('js/core/translations-fr.js', lines.join('\n'), 'utf8');
console.log(`Wrote ${keys.length} FR keys to js/core/translations-fr.js`);
