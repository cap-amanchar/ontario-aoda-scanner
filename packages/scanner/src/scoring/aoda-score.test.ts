import { describe, expect, it } from 'vitest';
import {
  calculateEstimatedFixTime,
  calculateScore,
  getGrade,
  getGradeColor,
  getGradeDescription,
  getNextMilestone,
  isCompliant,
} from './aoda-score';
import type { ImpactLevel } from '../types';

describe('AODA Scoring System', () => {
  describe('calculateScore', () => {
    it('should return perfect score for no violations', () => {
      const result = calculateScore({
        violations: [],
        passes: 50,
        incomplete: 0,
      });

      expect(result.score).toBe(100);
      expect(result.grade).toBe('A+');
      expect(result.deductions.total).toBe(0);
      expect(result.breakdown.violationCount).toBe(0);
      expect(result.breakdown.passedChecks).toBe(50);
    });

    it('should apply critical violation penalties', () => {
      const result = calculateScore({
        violations: [
          {
            impact: 'critical' as ImpactLevel,
            nodes: [{ target: ['#el1'] }],
          },
        ],
        passes: 40,
        incomplete: 0,
      });

      expect(result.score).toBeLessThan(100);
      expect(result.deductions.critical).toBeGreaterThan(0);
      expect(result.breakdown.violationCount).toBe(1);
    });

    it('should apply logarithmic scaling for multiple elements', () => {
      const singleElement = calculateScore({
        violations: [
          {
            impact: 'critical' as ImpactLevel,
            nodes: [{ target: ['#el1'] }],
          },
        ],
        passes: 40,
        incomplete: 0,
      });

      const multipleElements = calculateScore({
        violations: [
          {
            impact: 'critical' as ImpactLevel,
            nodes: [
              { target: ['#el1'] },
              { target: ['#el2'] },
              { target: ['#el3'] },
              { target: ['#el4'] },
              { target: ['#el5'] },
            ],
          },
        ],
        passes: 40,
        incomplete: 0,
      });

      expect(multipleElements.deductions.critical).toBeGreaterThan(
        singleElement.deductions.critical
      );
      expect(multipleElements.deductions.critical).toBeLessThan(
        singleElement.deductions.critical * 5
      );
    });

    it('should handle mixed severity violations', () => {
      const result = calculateScore({
        violations: [
          {
            impact: 'critical' as ImpactLevel,
            nodes: [{ target: ['#el1'] }],
          },
          {
            impact: 'serious' as ImpactLevel,
            nodes: [{ target: ['#el2'] }],
          },
          {
            impact: 'moderate' as ImpactLevel,
            nodes: [{ target: ['#el3'] }],
          },
          {
            impact: 'minor' as ImpactLevel,
            nodes: [{ target: ['#el4'] }],
          },
        ],
        passes: 30,
        incomplete: 2,
      });

      expect(result.deductions.critical).toBeGreaterThan(0);
      expect(result.deductions.serious).toBeGreaterThan(0);
      expect(result.deductions.moderate).toBeGreaterThan(0);
      expect(result.deductions.minor).toBeGreaterThan(0);
      expect(result.breakdown.violationCount).toBe(4);
      expect(result.breakdown.passedChecks).toBe(30);
      expect(result.breakdown.totalChecks).toBe(34);
    });

    it('should apply bilingual bonus for Ontario government sites', () => {
      const withBonus = calculateScore({
        violations: [
          {
            impact: 'critical' as ImpactLevel,
            nodes: [{ target: ['#el1'] }, { target: ['#el2'] }],
          },
        ],
        passes: 45,
        incomplete: 0,
        bilingualCheck: {
          isBilingual: true,
          isOntarioGov: true,
        },
      });

      const withoutBonus = calculateScore({
        violations: [
          {
            impact: 'critical' as ImpactLevel,
            nodes: [{ target: ['#el1'] }, { target: ['#el2'] }],
          },
        ],
        passes: 45,
        incomplete: 0,
        bilingualCheck: {
          isBilingual: true,
          isOntarioGov: false,
        },
      });

      // Critical violation with 2 elements (~10 point deduction) gives score of 90
      // Bonus adds 5 points: 90 + 5 = 95
      expect(withBonus.score).toBe(withoutBonus.score + 5);
    });

    it('should not exceed score of 100', () => {
      const result = calculateScore({
        violations: [],
        passes: 100,
        incomplete: 0,
        bilingualCheck: {
          isBilingual: true,
          isOntarioGov: true,
        },
      });

      expect(result.score).toBe(100);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should not go below score of 0', () => {
      const violations = Array.from({ length: 50 }, (_, i) => ({
        impact: 'critical' as ImpactLevel,
        nodes: Array.from({ length: 10 }, (_, j) => ({ target: [`#el${i}-${j}`] })),
      }));

      const result = calculateScore({
        violations,
        passes: 5,
        incomplete: 0,
      });

      expect(result.score).toBe(0);
      expect(result.score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getGrade', () => {
    it('should return A+ for scores 95-100', () => {
      expect(getGrade(100)).toBe('A+');
      expect(getGrade(95)).toBe('A+');
    });

    it('should return A for scores 90-94', () => {
      expect(getGrade(94)).toBe('A');
      expect(getGrade(90)).toBe('A');
    });

    it('should return B+ for scores 85-89', () => {
      expect(getGrade(89)).toBe('B+');
      expect(getGrade(85)).toBe('B+');
    });

    it('should return B for scores 80-84', () => {
      expect(getGrade(84)).toBe('B');
      expect(getGrade(80)).toBe('B');
    });

    it('should return C+ for scores 75-79', () => {
      expect(getGrade(79)).toBe('C+');
      expect(getGrade(75)).toBe('C+');
    });

    it('should return C for scores 70-74', () => {
      expect(getGrade(74)).toBe('C');
      expect(getGrade(70)).toBe('C');
    });

    it('should return D for scores 60-69', () => {
      expect(getGrade(69)).toBe('D');
      expect(getGrade(60)).toBe('D');
    });

    it('should return F for scores below 60', () => {
      expect(getGrade(59)).toBe('F');
      expect(getGrade(0)).toBe('F');
    });
  });

  describe('getGradeColor', () => {
    it('should return correct colors for all grades', () => {
      expect(getGradeColor('A+')).toBe('#10b981');
      expect(getGradeColor('A')).toBe('#10b981');
      expect(getGradeColor('B+')).toBe('#3b82f6');
      expect(getGradeColor('B')).toBe('#3b82f6');
      expect(getGradeColor('C+')).toBe('#f59e0b');
      expect(getGradeColor('C')).toBe('#f59e0b');
      expect(getGradeColor('D')).toBe('#f97316');
      expect(getGradeColor('F')).toBe('#ef4444');
    });
  });

  describe('getGradeDescription', () => {
    it('should return appropriate descriptions for all grades', () => {
      expect(getGradeDescription('A+')).toContain('Exceptional');
      expect(getGradeDescription('A')).toContain('Excellent');
      expect(getGradeDescription('B+')).toContain('Very Good');
      expect(getGradeDescription('B')).toContain('Good');
      expect(getGradeDescription('C+')).toContain('Fair');
      expect(getGradeDescription('C')).toContain('Fair');
      expect(getGradeDescription('D')).toContain('Poor');
      expect(getGradeDescription('F')).toContain('Failing');
    });
  });

  describe('calculateEstimatedFixTime', () => {
    it('should return 0 for no violations', () => {
      expect(calculateEstimatedFixTime([])).toBe(0);
    });

    it('should calculate time for single violation', () => {
      const result = calculateEstimatedFixTime([
        {
          fixTime: 30,
          nodes: [{}],
        },
      ]);

      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(30);
    });

    it('should scale time based on element count', () => {
      const singleElement = calculateEstimatedFixTime([
        {
          fixTime: 30,
          nodes: [{}],
        },
      ]);

      const multipleElements = calculateEstimatedFixTime([
        {
          fixTime: 30,
          nodes: [{}, {}, {}, {}, {}],
        },
      ]);

      expect(multipleElements).toBeGreaterThan(singleElement);
    });

    it('should cap element multiplier at 5 elements', () => {
      const fiveElements = calculateEstimatedFixTime([
        {
          fixTime: 30,
          nodes: [{}, {}, {}, {}, {}],
        },
      ]);

      const tenElements = calculateEstimatedFixTime([
        {
          fixTime: 30,
          nodes: [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}],
        },
      ]);

      expect(tenElements).toBe(fiveElements);
    });
  });

  describe('isCompliant', () => {
    it('should return true for scores 90 and above', () => {
      expect(isCompliant(100)).toBe(true);
      expect(isCompliant(95)).toBe(true);
      expect(isCompliant(90)).toBe(true);
    });

    it('should return false for scores below 90', () => {
      expect(isCompliant(89)).toBe(false);
      expect(isCompliant(80)).toBe(false);
      expect(isCompliant(0)).toBe(false);
    });
  });

  describe('getNextMilestone', () => {
    it('should return next milestone for low scores', () => {
      const result = getNextMilestone(50);
      expect(result).not.toBeNull();
      expect(result?.score).toBe(60);
      expect(result?.grade).toBe('D');
    });

    it('should return appropriate milestones for each range', () => {
      expect(getNextMilestone(65)?.score).toBe(70);
      expect(getNextMilestone(72)?.score).toBe(75);
      expect(getNextMilestone(77)?.score).toBe(80);
      expect(getNextMilestone(82)?.score).toBe(85);
      expect(getNextMilestone(87)?.score).toBe(90);
      expect(getNextMilestone(92)?.score).toBe(95);
    });

    it('should return null for scores 95 and above', () => {
      expect(getNextMilestone(95)).toBeNull();
      expect(getNextMilestone(100)).toBeNull();
    });
  });
});
