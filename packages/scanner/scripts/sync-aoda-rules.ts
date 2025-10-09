#!/usr/bin/env bun

/**
 * AODA Rules Sync & Analysis Tool
 *
 * This script:
 * 1. Analyzes the AODA_RULES_MAP for completeness
 * 2. Generates statistics and metadata
 * 3. Exports rules as JSON for web app consumption
 * 4. Validates all rules have required fields
 * 5. Generates documentation
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { AODA_RULES_MAP } from '../src/ontario/aoda-rules';
import type { ImpactLevel } from '../src/types';

interface RuleStats {
  totalRules: number;
  byCritical: number;
  bySerious: number;
  byModerate: number;
  byMinor: number;
  byWCAGLevel: {
    A: number;
    AA: number;
    AAA: number;
  };
  avgFixTime: number;
  ontarioSpecific: number;
}

interface ValidationError {
  ruleId: string;
  field: string;
  issue: string;
}

/**
 * Validate that all rules have complete metadata
 */
function validateRules(): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const [ruleId, rule] of Object.entries(AODA_RULES_MAP)) {
    // Check required fields
    if (!rule.wcagCriterion) {
      errors.push({ ruleId, field: 'wcagCriterion', issue: 'Missing WCAG criterion' });
    }

    if (!rule.wcagLevel) {
      errors.push({ ruleId, field: 'wcagLevel', issue: 'Missing WCAG level' });
    }

    if (!rule.aodaSection) {
      errors.push({ ruleId, field: 'aodaSection', issue: 'Missing AODA section reference' });
    }

    if (!rule.impact) {
      errors.push({ ruleId, field: 'impact', issue: 'Missing impact level' });
    }

    if (!rule.affectedUsers || rule.affectedUsers.length === 0) {
      errors.push({ ruleId, field: 'affectedUsers', issue: 'No affected user groups specified' });
    }

    if (!rule.estimatedFixTime || rule.estimatedFixTime <= 0) {
      errors.push({
        ruleId,
        field: 'estimatedFixTime',
        issue: 'Invalid or missing fix time estimate',
      });
    }

    if (!rule.penalty) {
      errors.push({ ruleId, field: 'penalty', issue: 'Missing penalty information' });
    }

    // Validate WCAG level
    if (rule.wcagLevel && !['A', 'AA', 'AAA'].includes(rule.wcagLevel)) {
      errors.push({ ruleId, field: 'wcagLevel', issue: `Invalid WCAG level: ${rule.wcagLevel}` });
    }

    // Validate impact level
    const validImpacts: ImpactLevel[] = ['critical', 'serious', 'moderate', 'minor'];
    if (rule.impact && !validImpacts.includes(rule.impact)) {
      errors.push({ ruleId, field: 'impact', issue: `Invalid impact level: ${rule.impact}` });
    }

    // Check for reasonable fix times (1-240 minutes)
    if (rule.estimatedFixTime && (rule.estimatedFixTime < 1 || rule.estimatedFixTime > 240)) {
      errors.push({
        ruleId,
        field: 'estimatedFixTime',
        issue: `Fix time should be 1-240 minutes, got ${rule.estimatedFixTime}`,
      });
    }
  }

  return errors;
}

/**
 * Generate statistics about the rules
 */
function generateStats(): RuleStats {
  const rules = Object.values(AODA_RULES_MAP);

  const stats: RuleStats = {
    totalRules: rules.length,
    byCritical: rules.filter((r) => r.impact === 'critical').length,
    bySerious: rules.filter((r) => r.impact === 'serious').length,
    byModerate: rules.filter((r) => r.impact === 'moderate').length,
    byMinor: rules.filter((r) => r.impact === 'minor').length,
    byWCAGLevel: {
      A: rules.filter((r) => r.wcagLevel === 'A').length,
      AA: rules.filter((r) => r.wcagLevel === 'AA').length,
      AAA: rules.filter((r) => r.wcagLevel === 'AAA').length,
    },
    avgFixTime:
      rules.reduce((sum, r) => sum + r.estimatedFixTime, 0) / rules.length,
    ontarioSpecific: rules.filter((r) => r.aodaSection.includes('Bilingual')).length,
  };

  return stats;
}

/**
 * Export rules as JSON for web app
 */
function exportRulesJSON(): void {
  const outputPath = join(import.meta.dir, '../dist/aoda-rules.json');

  const exportData = {
    version: '1.0.0',
    generated: new Date().toISOString(),
    rules: AODA_RULES_MAP,
    stats: generateStats(),
  };

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, JSON.stringify(exportData, null, 2));
  console.log(`✓ Exported rules to ${outputPath}`);
}

/**
 * Generate markdown documentation
 */
function generateDocs(): void {
  const stats = generateStats();
  const rules = Object.entries(AODA_RULES_MAP);

  let markdown = `# AODA Rules Reference\n\n`;
  markdown += `**Generated:** ${new Date().toLocaleString()}\n\n`;
  markdown += `## Summary Statistics\n\n`;
  markdown += `- **Total Rules:** ${stats.totalRules}\n`;
  markdown += `- **Critical:** ${stats.byCritical}\n`;
  markdown += `- **Serious:** ${stats.bySerious}\n`;
  markdown += `- **Moderate:** ${stats.byModerate}\n`;
  markdown += `- **Minor:** ${stats.byMinor}\n`;
  markdown += `- **WCAG Level A:** ${stats.byWCAGLevel.A}\n`;
  markdown += `- **WCAG Level AA:** ${stats.byWCAGLevel.AA}\n`;
  markdown += `- **Ontario-Specific (Bilingual):** ${stats.ontarioSpecific}\n`;
  markdown += `- **Average Fix Time:** ${Math.round(stats.avgFixTime)} minutes\n\n`;

  // Group by impact
  const byImpact = {
    critical: rules.filter(([_, r]) => r.impact === 'critical'),
    serious: rules.filter(([_, r]) => r.impact === 'serious'),
    moderate: rules.filter(([_, r]) => r.impact === 'moderate'),
    minor: rules.filter(([_, r]) => r.impact === 'minor'),
  };

  for (const [level, rulesList] of Object.entries(byImpact)) {
    markdown += `## ${level.toUpperCase()} Impact Rules (${rulesList.length})\n\n`;

    for (const [ruleId, rule] of rulesList) {
      markdown += `### \`${ruleId}\`\n\n`;
      markdown += `**WCAG:** ${rule.wcagCriterion} (Level ${rule.wcagLevel})\n\n`;
      markdown += `**AODA Section:** ${rule.aodaSection}\n\n`;
      markdown += `**Affected Users:** ${rule.affectedUsers.join(', ')}\n\n`;
      markdown += `**Estimated Fix Time:** ${rule.estimatedFixTime} minutes\n\n`;
      markdown += `**Penalty:** ${rule.penalty}\n\n`;
      markdown += `---\n\n`;
    }
  }

  const docsPath = join(import.meta.dir, '../docs/aoda-rules-reference.md');
  mkdirSync(dirname(docsPath), { recursive: true });
  writeFileSync(docsPath, markdown);
  console.log(`✓ Generated documentation at ${docsPath}`);
}

/**
 * Main execution
 */
function main(): void {
  console.log('🔍 AODA Rules Sync & Analysis Tool\n');

  // Validate rules
  console.log('Validating rules...');
  const errors = validateRules();

  if (errors.length > 0) {
    console.log(`\n❌ Found ${errors.length} validation errors:\n`);
    for (const error of errors) {
      console.log(`  - ${error.ruleId}.${error.field}: ${error.issue}`);
    }
    process.exit(1);
  }

  console.log('✓ All rules valid!\n');

  // Generate stats
  const stats = generateStats();
  console.log('📊 Statistics:');
  console.log(`   Total Rules: ${stats.totalRules}`);
  console.log(`   Critical: ${stats.byCritical}`);
  console.log(`   Serious: ${stats.bySerious}`);
  console.log(`   Moderate: ${stats.byModerate}`);
  console.log(`   Minor: ${stats.byMinor}`);
  console.log(`   Avg Fix Time: ${Math.round(stats.avgFixTime)} min\n`);

  // Export JSON
  console.log('Exporting rules...');
  exportRulesJSON();

  // Generate docs
  console.log('Generating documentation...');
  generateDocs();

  console.log('\n✅ Sync complete!\n');
}

// Run the tool
main();
