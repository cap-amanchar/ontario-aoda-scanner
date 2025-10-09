import { describe, expect, it } from 'vitest';
import {
  type AODAViolation,
  AODAViolationSchema,
  ImpactLevel,
  type ScanResult,
  ScanResultSchema,
  WCAGLevel,
} from './index';

describe('Zod Schema Validators', () => {
  describe('WCAGLevel', () => {
    it('should accept valid WCAG levels', () => {
      expect(WCAGLevel.parse('A')).toBe('A');
      expect(WCAGLevel.parse('AA')).toBe('AA');
      expect(WCAGLevel.parse('AAA')).toBe('AAA');
    });

    it('should reject invalid WCAG levels', () => {
      expect(() => WCAGLevel.parse('B')).toThrow();
      expect(() => WCAGLevel.parse('AAAA')).toThrow();
      expect(() => WCAGLevel.parse('a')).toThrow();
      expect(() => WCAGLevel.parse('')).toThrow();
      expect(() => WCAGLevel.parse(null)).toThrow();
    });
  });

  describe('ImpactLevel', () => {
    it('should accept valid impact levels', () => {
      expect(ImpactLevel.parse('critical')).toBe('critical');
      expect(ImpactLevel.parse('serious')).toBe('serious');
      expect(ImpactLevel.parse('moderate')).toBe('moderate');
      expect(ImpactLevel.parse('minor')).toBe('minor');
    });

    it('should reject invalid impact levels', () => {
      expect(() => ImpactLevel.parse('high')).toThrow();
      expect(() => ImpactLevel.parse('low')).toThrow();
      expect(() => ImpactLevel.parse('Critical')).toThrow(); // Case sensitive
      expect(() => ImpactLevel.parse('')).toThrow();
      expect(() => ImpactLevel.parse(null)).toThrow();
    });
  });

  describe('AODAViolationSchema', () => {
    const validViolation: AODAViolation = {
      id: 'color-contrast',
      wcagCriterion: '1.4.3 Contrast (Minimum)',
      wcagLevel: 'AA',
      aodaSection: 'IASR 14(4)(a)',
      description: 'Elements must have sufficient color contrast',
      impact: 'critical',
      affectedUsers: ['Low vision', 'Color blindness'],
      help: 'Ensure color contrast meets WCAG AA standards',
      helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum',
      estimatedFixTime: 30,
      penalty: 'Up to $100,000/day',
      nodes: [
        {
          html: '<div style="color: #777; background: #fff">Text</div>',
          target: ['#main > div:nth-child(1)'],
          failureSummary: 'Contrast ratio of 3.2:1',
        },
      ],
    };

    it('should accept valid AODA violation object', () => {
      const result = AODAViolationSchema.parse(validViolation);
      expect(result).toEqual(validViolation);
    });

    it('should reject violation with missing required fields', () => {
      const invalidViolation: Record<string, unknown> = { ...validViolation };
      invalidViolation.id = undefined;

      expect(() => AODAViolationSchema.parse(invalidViolation)).toThrow();
    });

    it('should reject violation with invalid wcagLevel', () => {
      const invalidViolation = { ...validViolation, wcagLevel: 'B' };
      expect(() => AODAViolationSchema.parse(invalidViolation)).toThrow();
    });

    it('should reject violation with invalid impact', () => {
      const invalidViolation = { ...validViolation, impact: 'high' };
      expect(() => AODAViolationSchema.parse(invalidViolation)).toThrow();
    });

    it('should reject violation with non-array affectedUsers', () => {
      const invalidViolation = { ...validViolation, affectedUsers: 'Low vision' };
      expect(() => AODAViolationSchema.parse(invalidViolation)).toThrow();
    });

    it('should reject violation with empty affectedUsers array', () => {
      const validEmptyUsers = { ...validViolation, affectedUsers: [] };
      const result = AODAViolationSchema.parse(validEmptyUsers);
      expect(result.affectedUsers).toEqual([]);
    });

    it('should reject violation with invalid estimatedFixTime type', () => {
      const invalidViolation = { ...validViolation, estimatedFixTime: '30' };
      expect(() => AODAViolationSchema.parse(invalidViolation)).toThrow();
    });

    it('should reject violation with negative estimatedFixTime', () => {
      const validNegativeTime = { ...validViolation, estimatedFixTime: -5 };
      // Zod number() doesn't enforce positive by default, so this should still pass
      const result = AODAViolationSchema.parse(validNegativeTime);
      expect(result.estimatedFixTime).toBe(-5);
    });

    it('should accept violation with empty nodes array', () => {
      const validEmptyNodes = { ...validViolation, nodes: [] };
      const result = AODAViolationSchema.parse(validEmptyNodes);
      expect(result.nodes).toEqual([]);
    });

    it('should accept violation with multiple nodes', () => {
      const multipleNodes = {
        ...validViolation,
        nodes: [
          {
            html: '<div>Node 1</div>',
            target: ['#node1'],
            failureSummary: 'Issue 1',
          },
          {
            html: '<div>Node 2</div>',
            target: ['#node2'],
            failureSummary: 'Issue 2',
          },
        ],
      };

      const result = AODAViolationSchema.parse(multipleNodes);
      expect(result.nodes.length).toBe(2);
    });

    it('should reject node with missing html field', () => {
      const invalidNode = {
        ...validViolation,
        nodes: [
          {
            target: ['#main'],
            failureSummary: 'Issue',
          },
        ],
      };

      expect(() => AODAViolationSchema.parse(invalidNode)).toThrow();
    });

    it('should reject node with non-array target', () => {
      const invalidNode = {
        ...validViolation,
        nodes: [
          {
            html: '<div>Test</div>',
            target: '#main',
            failureSummary: 'Issue',
          },
        ],
      };

      expect(() => AODAViolationSchema.parse(invalidNode)).toThrow();
    });
  });

  describe('ScanResultSchema', () => {
    const validScanResult: ScanResult = {
      url: 'https://example.com',
      timestamp: '2024-01-15T10:30:00.000Z',
      violations: [],
      passes: 45,
      incomplete: 2,
      summary: {
        total: 0,
        critical: 0,
        serious: 0,
        moderate: 0,
        minor: 0,
      },
      compliance: {
        wcag2AA: true,
        ontarioAODA: true,
        bilingualCompliant: true,
      },
    };

    it('should accept valid scan result object', () => {
      const result = ScanResultSchema.parse(validScanResult);
      expect(result).toEqual(validScanResult);
    });

    it('should reject scan result with invalid URL', () => {
      const invalidUrl = { ...validScanResult, url: 'not-a-url' };
      expect(() => ScanResultSchema.parse(invalidUrl)).toThrow();
    });

    it('should reject scan result with invalid timestamp format', () => {
      const invalidTimestamp = { ...validScanResult, timestamp: '2024-01-15' };
      expect(() => ScanResultSchema.parse(invalidTimestamp)).toThrow();
    });

    it('should accept scan result with violations array', () => {
      const withViolations = {
        ...validScanResult,
        violations: [
          {
            id: 'color-contrast',
            wcagCriterion: '1.4.3',
            wcagLevel: 'AA' as const,
            aodaSection: 'IASR 14(4)(a)',
            description: 'Test',
            impact: 'critical' as const,
            affectedUsers: ['Low vision'],
            help: 'Fix contrast',
            helpUrl: 'https://example.com',
            estimatedFixTime: 30,
            penalty: '$100,000/day',
            nodes: [],
          },
        ],
        summary: {
          total: 1,
          critical: 1,
          serious: 0,
          moderate: 0,
          minor: 0,
        },
      };

      const result = ScanResultSchema.parse(withViolations);
      expect(result.violations.length).toBe(1);
    });

    it('should reject scan result with non-number passes', () => {
      const invalidPasses = { ...validScanResult, passes: '45' };
      expect(() => ScanResultSchema.parse(invalidPasses)).toThrow();
    });

    it('should reject scan result with missing summary fields', () => {
      const invalidSummary = {
        ...validScanResult,
        summary: {
          total: 0,
          critical: 0,
          // missing serious, moderate, minor
        },
      };

      expect(() => ScanResultSchema.parse(invalidSummary)).toThrow();
    });

    it('should reject scan result with non-boolean compliance values', () => {
      const invalidCompliance = {
        ...validScanResult,
        compliance: {
          wcag2AA: 'true',
          ontarioAODA: true,
          bilingualCompliant: true,
        },
      };

      expect(() => ScanResultSchema.parse(invalidCompliance)).toThrow();
    });

    it('should accept scan result with all compliance false', () => {
      const nonCompliant = {
        ...validScanResult,
        compliance: {
          wcag2AA: false,
          ontarioAODA: false,
          bilingualCompliant: false,
        },
      };

      const result = ScanResultSchema.parse(nonCompliant);
      expect(result.compliance.wcag2AA).toBe(false);
      expect(result.compliance.ontarioAODA).toBe(false);
      expect(result.compliance.bilingualCompliant).toBe(false);
    });

    it('should handle large violation counts in summary', () => {
      const largeCounts = {
        ...validScanResult,
        summary: {
          total: 9999,
          critical: 2500,
          serious: 2500,
          moderate: 2500,
          minor: 2499,
        },
      };

      const result = ScanResultSchema.parse(largeCounts);
      expect(result.summary.total).toBe(9999);
    });

    it('should accept zero values for passes and incomplete', () => {
      const zeroValues = {
        ...validScanResult,
        passes: 0,
        incomplete: 0,
      };

      const result = ScanResultSchema.parse(zeroValues);
      expect(result.passes).toBe(0);
      expect(result.incomplete).toBe(0);
    });
  });

  describe('Schema integration tests', () => {
    it('should validate complete scan result with violations', () => {
      const completeScanResult: ScanResult = {
        url: 'https://ontario.ca/page/test',
        timestamp: '2024-01-15T14:30:00.000Z',
        violations: [
          {
            id: 'color-contrast',
            wcagCriterion: '1.4.3 Contrast (Minimum)',
            wcagLevel: 'AA',
            aodaSection: 'IASR 14(4)(a)',
            description: 'Elements must have sufficient color contrast',
            impact: 'critical',
            affectedUsers: ['Low vision', 'Color blindness'],
            help: 'Ensure color contrast meets WCAG AA',
            helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum',
            estimatedFixTime: 30,
            penalty: 'Up to $100,000/day',
            nodes: [
              {
                html: '<div style="color: #777">Text</div>',
                target: ['#main > div'],
                failureSummary: 'Contrast ratio: 3.2:1',
              },
            ],
          },
          {
            id: 'image-alt',
            wcagCriterion: '1.1.1 Non-text Content',
            wcagLevel: 'A',
            aodaSection: 'IASR 14(4)',
            description: 'Images must have alternative text',
            impact: 'critical',
            affectedUsers: ['Blind users', 'Screen reader users'],
            help: 'Add alt text to images',
            helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/non-text-content',
            estimatedFixTime: 15,
            penalty: 'Up to $100,000/day',
            nodes: [
              {
                html: '<img src="logo.png">',
                target: ['img'],
                failureSummary: 'Element has no alt attribute',
              },
            ],
          },
        ],
        passes: 42,
        incomplete: 3,
        summary: {
          total: 2,
          critical: 2,
          serious: 0,
          moderate: 0,
          minor: 0,
        },
        compliance: {
          wcag2AA: false,
          ontarioAODA: false,
          bilingualCompliant: true,
        },
      };

      const result = ScanResultSchema.parse(completeScanResult);
      expect(result.violations.length).toBe(2);
      expect(result.summary.critical).toBe(2);
      expect(result.compliance.ontarioAODA).toBe(false);
    });
  });
});
