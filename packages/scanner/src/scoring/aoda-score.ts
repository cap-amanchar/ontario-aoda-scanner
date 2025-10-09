/**
 * AODA Scoring Algorithm
 *
 * Calculates a 0-100 compliance score for Ontario AODA requirements
 * Weighted by violation severity and Ontario penalty impact
 */

import type { ImpactLevel } from '../types';

// Impact weights based on Ontario AODA penalties
const IMPACT_WEIGHTS: Record<ImpactLevel, number> = {
  critical: 20, // Up to $100,000/day penalties
  serious: 10, // Significant compliance risk
  moderate: 5, // Important but lower priority
  minor: 2, // Nice-to-have improvements
};

// Grade thresholds
const GRADE_THRESHOLDS = {
  'A+': 95,
  A: 90,
  'B+': 85,
  B: 80,
  'C+': 75,
  C: 70,
  D: 60,
  F: 0,
} as const;

export type Grade = keyof typeof GRADE_THRESHOLDS;

export interface ScanScore {
  score: number; // 0-100
  grade: Grade; // A+ to F
  maxPossibleScore: number;
  deductions: {
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
    total: number;
  };
  breakdown: {
    passedChecks: number;
    totalChecks: number;
    violationCount: number;
    elementCount: number;
  };
}

interface Violation {
  impact: ImpactLevel;
  nodes: Array<{ target: string[] }>;
}

interface ScanResult {
  violations: Violation[];
  passes: number;
  incomplete: number;
  bilingualCheck?: {
    isBilingual: boolean;
    isOntarioGov: boolean;
  };
}

/**
 * Calculate AODA compliance score for a single page
 */
export function calculateScore(scanResult: ScanResult): ScanScore {
  let score = 100;

  const deductions = {
    critical: 0,
    serious: 0,
    moderate: 0,
    minor: 0,
    total: 0,
  };

  let totalElements = 0;

  // Calculate deductions for each violation
  for (const violation of scanResult.violations) {
    const elementCount = violation.nodes.length;
    totalElements += elementCount;

    // Get weight for this impact level
    const baseWeight = IMPACT_WEIGHTS[violation.impact];

    // Apply logarithmic scaling for multiple elements
    // This prevents a single violation from dominating the score
    const penalty = baseWeight * Math.log10(elementCount + 1);

    deductions[violation.impact] += penalty;
    deductions.total += penalty;
    score -= penalty;
  }

  // Apply bilingual bonus for Ontario government sites
  if (scanResult.bilingualCheck?.isBilingual && scanResult.bilingualCheck?.isOntarioGov) {
    score += 5; // 5-point bonus for bilingual compliance
  }

  // Floor at 0, ceil at 100
  score = Math.max(0, Math.min(100, score));

  // Round to whole number
  score = Math.round(score);

  return {
    score,
    grade: getGrade(score),
    maxPossibleScore: 100,
    deductions: {
      critical: Math.round(deductions.critical),
      serious: Math.round(deductions.serious),
      moderate: Math.round(deductions.moderate),
      minor: Math.round(deductions.minor),
      total: Math.round(deductions.total),
    },
    breakdown: {
      passedChecks: scanResult.passes,
      totalChecks: scanResult.passes + scanResult.violations.length,
      violationCount: scanResult.violations.length,
      elementCount: totalElements,
    },
  };
}

/**
 * Convert numeric score to letter grade
 */
export function getGrade(score: number): Grade {
  if (score >= GRADE_THRESHOLDS['A+']) return 'A+';
  if (score >= GRADE_THRESHOLDS.A) return 'A';
  if (score >= GRADE_THRESHOLDS['B+']) return 'B+';
  if (score >= GRADE_THRESHOLDS.B) return 'B';
  if (score >= GRADE_THRESHOLDS['C+']) return 'C+';
  if (score >= GRADE_THRESHOLDS.C) return 'C';
  if (score >= GRADE_THRESHOLDS.D) return 'D';
  return 'F';
}

/**
 * Get color for grade (for UI display)
 */
export function getGradeColor(grade: Grade): string {
  const colors: Record<Grade, string> = {
    'A+': '#10b981', // green
    A: '#10b981',
    'B+': '#3b82f6', // blue
    B: '#3b82f6',
    'C+': '#f59e0b', // amber
    C: '#f59e0b',
    D: '#f97316', // orange
    F: '#ef4444', // red
  };
  return colors[grade];
}

/**
 * Get human-readable description of grade
 */
export function getGradeDescription(grade: Grade): string {
  const descriptions: Record<Grade, string> = {
    'A+': 'Exceptional - Ready for compliance certification',
    A: 'Excellent - Minor improvements only',
    'B+': 'Very Good - Few issues to address',
    B: 'Good - Some violations need fixing',
    'C+': 'Fair - Multiple issues present',
    C: 'Fair - Significant violations',
    D: 'Poor - Major accessibility barriers',
    F: 'Failing - Critical issues blocking users',
  };
  return descriptions[grade];
}

/**
 * Calculate estimated fix time based on violations
 */
export function calculateEstimatedFixTime(
  violations: Array<{ fixTime?: number; nodes: Array<unknown> }>
): number {
  let totalMinutes = 0;

  for (const violation of violations) {
    if (violation.fixTime) {
      // Fix time is per violation type, not per element
      // But we add a small multiplier for multiple instances
      const elementMultiplier = Math.min(violation.nodes.length, 5) / 5;
      totalMinutes += violation.fixTime * (0.5 + elementMultiplier * 0.5);
    }
  }

  return Math.round(totalMinutes);
}

/**
 * Determine if score meets AODA compliance threshold
 */
export function isCompliant(score: number): boolean {
  // AODA compliance requires addressing all critical violations
  // We consider 90+ as compliant (Grade A)
  return score >= 90;
}

/**
 * Get next milestone score
 */
export function getNextMilestone(currentScore: number): { score: number; grade: Grade } | null {
  const milestones = [60, 70, 75, 80, 85, 90, 95];

  for (const milestone of milestones) {
    if (currentScore < milestone) {
      return {
        score: milestone,
        grade: getGrade(milestone),
      };
    }
  }

  return null; // Already at 95+
}
