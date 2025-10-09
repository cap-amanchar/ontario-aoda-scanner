import { describe, expect, it } from 'vitest';
import type { ImpactLevel } from '../types';
import { AODA_RULES_MAP, getAODAMapping, isOntarioCritical } from './aoda-rules';

describe('AODA Rules Mapping', () => {
  describe('AODA_RULES_MAP', () => {
    it('should contain all expected critical rules', () => {
      const criticalRules = [
        'color-contrast',
        'html-has-lang',
        'image-alt',
        'button-name',
        'label',
      ];

      for (const ruleId of criticalRules) {
        expect(AODA_RULES_MAP[ruleId]).toBeDefined();
        expect(AODA_RULES_MAP[ruleId].impact).toBe('critical');
      }
    });

    it('should have valid WCAG levels for all rules', () => {
      const validLevels = ['A', 'AA', 'AAA'];

      for (const [_ruleId, rule] of Object.entries(AODA_RULES_MAP)) {
        expect(validLevels).toContain(rule.wcagLevel);
      }
    });

    it('should have valid impact levels for all rules', () => {
      const validImpacts: ImpactLevel[] = ['critical', 'serious', 'moderate', 'minor'];

      for (const [_ruleId, rule] of Object.entries(AODA_RULES_MAP)) {
        expect(validImpacts).toContain(rule.impact);
      }
    });

    it('should have non-empty WCAG criterion for all rules', () => {
      for (const [_ruleId, rule] of Object.entries(AODA_RULES_MAP)) {
        expect(rule.wcagCriterion).toBeTruthy();
        expect(rule.wcagCriterion.length).toBeGreaterThan(0);
      }
    });

    it('should have AODA section reference for all rules', () => {
      for (const [_ruleId, rule] of Object.entries(AODA_RULES_MAP)) {
        expect(rule.aodaSection).toBeTruthy();
        expect(rule.aodaSection).toContain('IASR');
      }
    });

    it('should have at least one affected user group for all rules', () => {
      for (const [_ruleId, rule] of Object.entries(AODA_RULES_MAP)) {
        expect(rule.affectedUsers).toBeDefined();
        expect(rule.affectedUsers.length).toBeGreaterThan(0);
      }
    });

    it('should have realistic estimated fix times', () => {
      for (const [_ruleId, rule] of Object.entries(AODA_RULES_MAP)) {
        expect(rule.estimatedFixTime).toBeGreaterThan(0);
        expect(rule.estimatedFixTime).toBeLessThanOrEqual(120); // Max 2 hours is reasonable
      }
    });

    it('should have penalty information for all rules', () => {
      for (const [_ruleId, rule] of Object.entries(AODA_RULES_MAP)) {
        expect(rule.penalty).toBeTruthy();
        expect(rule.penalty.length).toBeGreaterThan(0);
      }
    });
  });

  describe('getAODAMapping', () => {
    it('should return undefined for non-existent rule', () => {
      const result = getAODAMapping('non-existent-rule');
      expect(result).toBeUndefined();
    });

    it('should return correct mapping for color-contrast', () => {
      const result = getAODAMapping('color-contrast');

      expect(result).toBeDefined();
      expect(result?.wcagCriterion).toBe('1.4.3 Contrast (Minimum)');
      expect(result?.wcagLevel).toBe('AA');
      expect(result?.impact).toBe('critical');
      expect(result?.aodaSection).toBe('IASR 14(4)(a) - Web Accessibility');
      expect(result?.affectedUsers).toContain('Low vision');
    });

    it('should return correct mapping for html-has-lang', () => {
      const result = getAODAMapping('html-has-lang');

      expect(result).toBeDefined();
      expect(result?.wcagCriterion).toBe('3.1.1 Language of Page');
      expect(result?.wcagLevel).toBe('A');
      expect(result?.impact).toBe('critical');
      expect(result?.aodaSection).toContain('Bilingual');
      expect(result?.affectedUsers).toContain('French-speaking Ontarians');
    });

    it('should return correct mapping for image-alt', () => {
      const result = getAODAMapping('image-alt');

      expect(result).toBeDefined();
      expect(result?.wcagCriterion).toBe('1.1.1 Non-text Content');
      expect(result?.wcagLevel).toBe('A');
      expect(result?.impact).toBe('critical');
      expect(result?.affectedUsers).toContain('Blind users');
    });

    it('should return correct mapping for serious violations', () => {
      const result = getAODAMapping('link-name');

      expect(result).toBeDefined();
      expect(result?.impact).toBe('serious');
      expect(result?.wcagLevel).toBe('A');
    });

    it('should return correct mapping for moderate violations', () => {
      const result = getAODAMapping('landmark-one-main');

      expect(result).toBeDefined();
      expect(result?.impact).toBe('moderate');
    });

    it('should return correct mapping for minor violations', () => {
      const result = getAODAMapping('meta-viewport');

      expect(result).toBeDefined();
      expect(result?.impact).toBe('minor');
      expect(result?.wcagLevel).toBe('AA');
    });
  });

  describe('isOntarioCritical', () => {
    it('should return true for critical impact rules', () => {
      expect(isOntarioCritical('color-contrast')).toBe(true);
      expect(isOntarioCritical('image-alt')).toBe(true);
      expect(isOntarioCritical('button-name')).toBe(true);
      expect(isOntarioCritical('label')).toBe(true);
    });

    it('should return true for bilingual requirement rules', () => {
      expect(isOntarioCritical('html-has-lang')).toBe(true);
    });

    it('should return false for serious violations', () => {
      expect(isOntarioCritical('link-name')).toBe(false);
      expect(isOntarioCritical('heading-order')).toBe(false);
    });

    it('should return false for moderate violations', () => {
      expect(isOntarioCritical('landmark-one-main')).toBe(false);
      expect(isOntarioCritical('region')).toBe(false);
    });

    it('should return false for minor violations', () => {
      expect(isOntarioCritical('meta-viewport')).toBe(false);
      expect(isOntarioCritical('html-lang-valid')).toBe(false);
    });

    it('should return false for non-existent rules', () => {
      expect(isOntarioCritical('non-existent-rule')).toBe(false);
    });
  });

  describe('WCAG Level A compliance', () => {
    it('should include all Level A critical rules', () => {
      const levelARules = Object.entries(AODA_RULES_MAP).filter(
        ([_, rule]) => rule.wcagLevel === 'A'
      );

      expect(levelARules.length).toBeGreaterThan(0);

      // Check specific Level A rules exist
      const levelARuleIds = levelARules.map(([id]) => id);
      expect(levelARuleIds).toContain('html-has-lang');
      expect(levelARuleIds).toContain('image-alt');
      expect(levelARuleIds).toContain('button-name');
    });
  });

  describe('WCAG Level AA compliance', () => {
    it('should include all Level AA critical rules', () => {
      const levelAARules = Object.entries(AODA_RULES_MAP).filter(
        ([_, rule]) => rule.wcagLevel === 'AA'
      );

      expect(levelAARules.length).toBeGreaterThan(0);

      // Check specific Level AA rules exist
      const levelAARuleIds = levelAARules.map(([id]) => id);
      expect(levelAARuleIds).toContain('color-contrast');
      expect(levelAARuleIds).toContain('page-has-heading-one');
    });
  });

  describe('Affected user groups', () => {
    it('should identify screen reader user impacts', () => {
      const screenReaderRules = Object.entries(AODA_RULES_MAP).filter(([_, rule]) =>
        rule.affectedUsers.some((user) => user.toLowerCase().includes('screen reader'))
      );

      expect(screenReaderRules.length).toBeGreaterThan(0);
      expect(screenReaderRules.map(([id]) => id)).toContain('image-alt');
      expect(screenReaderRules.map(([id]) => id)).toContain('label');
    });

    it('should identify keyboard-only user impacts', () => {
      const keyboardRules = Object.entries(AODA_RULES_MAP).filter(([_, rule]) =>
        rule.affectedUsers.some((user) => user.toLowerCase().includes('keyboard'))
      );

      expect(keyboardRules.length).toBeGreaterThan(0);
      expect(keyboardRules.map(([id]) => id)).toContain('button-name');
    });

    it('should identify low vision user impacts', () => {
      const lowVisionRules = Object.entries(AODA_RULES_MAP).filter(([_, rule]) =>
        rule.affectedUsers.some((user) => user.toLowerCase().includes('low vision'))
      );

      expect(lowVisionRules.length).toBeGreaterThan(0);
      expect(lowVisionRules.map(([id]) => id)).toContain('color-contrast');
    });
  });

  describe('Ontario-specific requirements', () => {
    it('should have French-speaking Ontarians as affected users for language rules', () => {
      const langRule = getAODAMapping('html-has-lang');
      expect(langRule?.affectedUsers).toContain('French-speaking Ontarians');
    });

    it('should reference Official Languages Act for bilingual violations', () => {
      const langRule = getAODAMapping('html-has-lang');
      expect(langRule?.penalty).toContain('Official Languages Act');
    });

    it('should have IASR section references', () => {
      const allRulesHaveIASR = Object.values(AODA_RULES_MAP).every((rule) =>
        rule.aodaSection.includes('IASR')
      );
      expect(allRulesHaveIASR).toBe(true);
    });
  });

  describe('Estimated fix times', () => {
    it('should have quick fixes (under 10 minutes) for simple issues', () => {
      const quickFixes = Object.entries(AODA_RULES_MAP).filter(
        ([_, rule]) => rule.estimatedFixTime < 10
      );

      expect(quickFixes.length).toBeGreaterThan(0);
      expect(quickFixes.map(([id]) => id)).toContain('html-has-lang'); // 5 min
      expect(quickFixes.map(([id]) => id)).toContain('meta-viewport'); // 5 min
    });

    it('should have longer fix times for complex issues', () => {
      const complexFixes = Object.entries(AODA_RULES_MAP).filter(
        ([_, rule]) => rule.estimatedFixTime >= 30
      );

      expect(complexFixes.length).toBeGreaterThan(0);
      expect(complexFixes.map(([id]) => id)).toContain('focus-order-semantics'); // 45 min
    });
  });

  describe('Impact level distribution', () => {
    it('should have multiple critical violations', () => {
      const critical = Object.values(AODA_RULES_MAP).filter((rule) => rule.impact === 'critical');
      expect(critical.length).toBeGreaterThanOrEqual(5);
    });

    it('should have serious violations', () => {
      const serious = Object.values(AODA_RULES_MAP).filter((rule) => rule.impact === 'serious');
      expect(serious.length).toBeGreaterThan(0);
    });

    it('should have moderate violations', () => {
      const moderate = Object.values(AODA_RULES_MAP).filter((rule) => rule.impact === 'moderate');
      expect(moderate.length).toBeGreaterThan(0);
    });

    it('should have minor violations', () => {
      const minor = Object.values(AODA_RULES_MAP).filter((rule) => rule.impact === 'minor');
      expect(minor.length).toBeGreaterThan(0);
    });
  });
});
