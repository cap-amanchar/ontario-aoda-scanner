#!/usr/bin/env bun

import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Copy Canadian maple leaf icons to dist folder
 * Icons are generated from src/icons/canada-flag.png using sharp
 */

const srcIconsPath = join(import.meta.dir, '..', 'src', 'icons');
const distIconsPath = join(import.meta.dir, '..', 'dist', 'icons');
const sizes = [16, 32, 48, 128];

// Ensure dist/icons directory exists
if (!existsSync(distIconsPath)) {
  mkdirSync(distIconsPath, { recursive: true });
}

console.log('🍁 Copying Canadian maple leaf icons to dist...\n');

// Copy each icon size
for (const size of sizes) {
  const srcFile = join(srcIconsPath, `icon-${size}.png`);
  const distFile = join(distIconsPath, `icon-${size}.png`);

  if (existsSync(srcFile)) {
    copyFileSync(srcFile, distFile);
    console.log(`✓ Copied icon-${size}.png`);
  } else {
    console.warn(`⚠ Warning: ${srcFile} not found`);
  }
}

// Also copy canada-flag.png for popup usage
const canadaFlag = join(srcIconsPath, 'canada-flag.png');
const canadaFlagDist = join(distIconsPath, 'canada-flag.png');

if (existsSync(canadaFlag)) {
  copyFileSync(canadaFlag, canadaFlagDist);
  console.log('✓ Copied canada-flag.png');
}

console.log('\n✅ Extension icons ready!');
console.log('🇨🇦 Your extension now features the Canadian maple leaf!\n');
