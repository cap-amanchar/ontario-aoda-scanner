#!/usr/bin/env bun

import { existsSync, statSync } from 'fs';
import { join } from 'path';

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

const DIST_PATH = join(import.meta.dir, '..', 'dist');

const REQUIRED_FILES = [
  'manifest.json',
  'popup.html',
  'popup.js',
  'content.js',
  'background.js',
];

const REQUIRED_ICONS = [
  'icons/icon-16.png',
  'icons/icon-32.png',
  'icons/icon-48.png',
  'icons/icon-128.png',
];

async function validateBuild(): Promise<ValidationResult> {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  console.log('🔍 Validating extension build...\n');

  // Check dist directory exists
  if (!existsSync(DIST_PATH)) {
    result.valid = false;
    result.errors.push('dist/ directory does not exist. Run: bun run build');
    return result;
  }

  // Check required files
  for (const file of REQUIRED_FILES) {
    const filePath = join(DIST_PATH, file);
    if (!existsSync(filePath)) {
      result.valid = false;
      result.errors.push(`Missing required file: ${file}`);
    } else {
      const stats = statSync(filePath);
      if (stats.size === 0) {
        result.valid = false;
        result.errors.push(`File is empty: ${file}`);
      } else {
        console.log(`✓ ${file} (${formatBytes(stats.size)})`);
      }
    }
  }

  // Check icons (warnings only, not critical for functionality)
  console.log('\n📦 Checking icons...');
  for (const icon of REQUIRED_ICONS) {
    const iconPath = join(DIST_PATH, icon);
    if (!existsSync(iconPath)) {
      result.warnings.push(`Missing icon: ${icon} (extension will load but won't have icon)`);
      console.log(`⚠️  ${icon} - MISSING (non-critical)`);
    } else {
      const stats = statSync(iconPath);
      console.log(`✓ ${icon} (${formatBytes(stats.size)})`);
    }
  }

  // Validate manifest.json structure
  console.log('\n📋 Validating manifest.json...');
  try {
    const manifestPath = join(DIST_PATH, 'manifest.json');
    const manifestFile = Bun.file(manifestPath);
    const manifest = await manifestFile.json();

    // Check required manifest fields
    const requiredFields = [
      'manifest_version',
      'name',
      'version',
      'permissions',
      'action',
      'background',
      'content_scripts',
    ];

    for (const field of requiredFields) {
      if (!manifest[field]) {
        result.valid = false;
        result.errors.push(`Missing manifest field: ${field}`);
      } else {
        console.log(`✓ ${field}: ${JSON.stringify(manifest[field]).substring(0, 50)}...`);
      }
    }

    // Validate manifest version
    if (manifest.manifest_version !== 3) {
      result.valid = false;
      result.errors.push('manifest_version must be 3 (Manifest V3)');
    }

    // Validate action.default_popup exists
    if (manifest.action && manifest.action.default_popup !== 'popup.html') {
      result.warnings.push(`Unexpected popup path: ${manifest.action.default_popup}`);
    }

    // Validate background.service_worker exists
    if (manifest.background && manifest.background.service_worker !== 'background.js') {
      result.warnings.push(`Unexpected service worker: ${manifest.background.service_worker}`);
    }

    // Validate content scripts
    if (manifest.content_scripts && manifest.content_scripts.length > 0) {
      const contentScript = manifest.content_scripts[0];
      if (!contentScript.js || !contentScript.js.includes('content.js')) {
        result.warnings.push('Content script does not include content.js');
      }
    }
  } catch (error) {
    result.valid = false;
    result.errors.push(`Failed to parse manifest.json: ${error}`);
  }

  return result;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// Run validation
const result = await validateBuild();

console.log('\n' + '='.repeat(50));

if (result.warnings.length > 0) {
  console.log('\n⚠️  Warnings:');
  for (const warning of result.warnings) {
    console.log(`   - ${warning}`);
  }
}

if (result.errors.length > 0) {
  console.log('\n❌ Errors:');
  for (const error of result.errors) {
    console.log(`   - ${error}`);
  }
}

console.log('\n' + '='.repeat(50));

if (result.valid && result.errors.length === 0) {
  console.log('\n✅ Extension build is VALID and ready to load!');
  console.log('\nTo load in Chrome:');
  console.log('1. Navigate to chrome://extensions/');
  console.log('2. Enable "Developer mode"');
  console.log('3. Click "Load unpacked"');
  console.log('4. Select: apps/extension/dist\n');
  process.exit(0);
} else {
  console.log('\n❌ Extension build has ERRORS and may not load properly!');
  console.log('   Run: bun run build\n');
  process.exit(1);
}
