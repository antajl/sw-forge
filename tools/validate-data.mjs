#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

let errors = 0;

// Validate JSON files
function validateJSON(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    JSON.parse(content);
    return true;
  } catch (e) {
    console.error(`Invalid JSON in ${path.relative(rootDir, filePath)}: ${e.message}`);
    errors++;
    return false;
  }
}

// Check for missing assets referenced in data
function checkMissingAssets() {
  const dataDir = path.join(rootDir, 'data');
  const assetsDir = path.join(rootDir, 'assets');
  
  if (!fs.existsSync(dataDir) || !fs.existsSync(assetsDir)) {
    return;
  }
  
  const monstersIndexPath = path.join(dataDir, 'monsters-index.json');
  if (!fs.existsSync(monstersIndexPath)) {
    console.error('monsters-index.json not found');
    errors++;
    return;
  }
  
  const monstersIndex = JSON.parse(fs.readFileSync(monstersIndexPath, 'utf8'));
  const missingPortraits = [];
  
  for (const monster of Object.values(monstersIndex)) {
    if (monster.image_filename) {
      const portraitPath = path.join(assetsDir, 'monsters', monster.image_filename);
      if (!fs.existsSync(portraitPath)) {
        missingPortraits.push(monster.image_filename);
      }
    }
  }
  
  if (missingPortraits.length) {
    console.error(`Missing ${missingPortraits.length} monster portraits:`, missingPortraits.slice(0, 5));
    errors += missingPortraits.length;
  }
}

// Validate all JSON files in data directory
function validateDataFiles() {
  const dataDir = path.join(rootDir, 'data');
  if (!fs.existsSync(dataDir)) {
    console.error('data directory not found');
    errors++;
    return;
  }
  
  const files = fs.readdirSync(dataDir);
  for (const file of files) {
    if (file.endsWith('.json')) {
      validateJSON(path.join(dataDir, file));
    }
  }
}

console.log('Running data validation...');
validateDataFiles();
checkMissingAssets();

if (errors > 0) {
  console.error(`Data validation failed with ${errors} errors`);
  process.exit(1);
} else {
  console.log('Data validation passed');
}
