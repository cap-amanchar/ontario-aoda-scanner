import type { ImpactLevel } from '../types';

interface AODARule {
  wcagCriterion: string;
  wcagLevel: 'A' | 'AA' | 'AAA';
  aodaSection: string;
  impact: ImpactLevel;
  affectedUsers: string[];
  estimatedFixTime: number;
  penalty: string;
}

// Map axe-core rule IDs to AODA/WCAG requirements
export const AODA_RULES_MAP: Record<string, AODARule> = {
  // ============================================
  // CRITICAL ONTARIO AODA VIOLATIONS
  // ============================================
  'color-contrast': {
    wcagCriterion: '1.4.3 Contrast (Minimum)',
    wcagLevel: 'AA',
    aodaSection: 'IASR 14(4)(a) - Web Accessibility',
    impact: 'critical',
    affectedUsers: ['Low vision', 'Color blindness', 'Aging users'],
    estimatedFixTime: 30,
    penalty: 'Up to $100,000/day for organizations',
  },

  'html-has-lang': {
    wcagCriterion: '3.1.1 Language of Page',
    wcagLevel: 'A',
    aodaSection: 'IASR 14(4) + Ontario Bilingual Requirements',
    impact: 'critical',
    affectedUsers: ['Screen reader users', 'Translation tools', 'French-speaking Ontarians'],
    estimatedFixTime: 5,
    penalty: 'AODA violation + Official Languages Act non-compliance',
  },

  'image-alt': {
    wcagCriterion: '1.1.1 Non-text Content',
    wcagLevel: 'A',
    aodaSection: 'IASR 14(4)',
    impact: 'critical',
    affectedUsers: ['Blind users', 'Screen reader users'],
    estimatedFixTime: 15,
    penalty: 'Up to $100,000/day for organizations',
  },

  'button-name': {
    wcagCriterion: '4.1.2 Name, Role, Value',
    wcagLevel: 'A',
    aodaSection: 'IASR 14(4)',
    impact: 'critical',
    affectedUsers: ['Screen reader users', 'Keyboard-only users'],
    estimatedFixTime: 10,
    penalty: 'Up to $100,000/day for organizations',
  },

  'label': {
    wcagCriterion: '3.3.2 Labels or Instructions',
    wcagLevel: 'A',
    aodaSection: 'IASR 14(4) + IASR 11(1) Feedback Processes',
    impact: 'critical',
    affectedUsers: ['Screen reader users', 'Cognitive disabilities'],
    estimatedFixTime: 20,
    penalty: 'Up to $100,000/day for organizations',
  },

  // ============================================
  // SERIOUS VIOLATIONS
  // ============================================
  'link-name': {
    wcagCriterion: '2.4.4 Link Purpose (In Context)',
    wcagLevel: 'A',
    aodaSection: 'IASR 14(4)',
    impact: 'serious',
    affectedUsers: ['Screen reader users', 'Cognitive disabilities'],
    estimatedFixTime: 15,
    penalty: 'Up to $100,000/day for organizations',
  },

  'focus-order-semantics': {
    wcagCriterion: '2.4.3 Focus Order',
    wcagLevel: 'A',
    aodaSection: 'IASR 14(4)',
    impact: 'serious',
    affectedUsers: ['Keyboard-only users', 'Motor disabilities'],
    estimatedFixTime: 45,
    penalty: 'Up to $100,000/day for organizations',
  },

  'page-has-heading-one': {
    wcagCriterion: '2.4.6 Headings and Labels',
    wcagLevel: 'AA',
    aodaSection: 'IASR 14(4)(a)',
    impact: 'serious',
    affectedUsers: ['Screen reader users', 'Cognitive disabilities'],
    estimatedFixTime: 10,
    penalty: 'Up to $100,000/day for organizations',
  },

  'heading-order': {
    wcagCriterion: '1.3.1 Info and Relationships',
    wcagLevel: 'A',
    aodaSection: 'IASR 14(4)',
    impact: 'serious',
    affectedUsers: ['Screen reader users', 'Cognitive disabilities'],
    estimatedFixTime: 30,
    penalty: 'Up to $100,000/day for organizations',
  },

  // ============================================
  // MODERATE VIOLATIONS
  // ============================================
  'landmark-one-main': {
    wcagCriterion: '2.4.1 Bypass Blocks',
    wcagLevel: 'A',
    aodaSection: 'IASR 14(4)',
    impact: 'moderate',
    affectedUsers: ['Screen reader users', 'Keyboard-only users'],
    estimatedFixTime: 20,
    penalty: 'Up to $100,000/day for organizations',
  },

  'region': {
    wcagCriterion: '1.3.1 Info and Relationships',
    wcagLevel: 'A',
    aodaSection: 'IASR 14(4)',
    impact: 'moderate',
    affectedUsers: ['Screen reader users'],
    estimatedFixTime: 25,
    penalty: 'Up to $100,000/day for organizations',
  },

  'duplicate-id': {
    wcagCriterion: '4.1.1 Parsing',
    wcagLevel: 'A',
    aodaSection: 'IASR 14(4)',
    impact: 'moderate',
    affectedUsers: ['Assistive technology users'],
    estimatedFixTime: 15,
    penalty: 'Up to $100,000/day for organizations',
  },

  // ============================================
  // MINOR VIOLATIONS
  // ============================================
  'meta-viewport': {
    wcagCriterion: '1.4.4 Resize Text',
    wcagLevel: 'AA',
    aodaSection: 'IASR 14(4)(a)',
    impact: 'minor',
    affectedUsers: ['Low vision users', 'Mobile users'],
    estimatedFixTime: 5,
    penalty: 'Up to $100,000/day for organizations',
  },

  'html-lang-valid': {
    wcagCriterion: '3.1.1 Language of Page',
    wcagLevel: 'A',
    aodaSection: 'IASR 14(4)',
    impact: 'minor',
    affectedUsers: ['Screen reader users'],
    estimatedFixTime: 2,
    penalty: 'Up to $100,000/day for organizations',
  },
};

// Get AODA mapping for a given axe rule ID
export function getAODAMapping(ruleId: string): AODARule | undefined {
  return AODA_RULES_MAP[ruleId];
}

// Check if rule is Ontario-critical
export function isOntarioCritical(ruleId: string): boolean {
  const rule = AODA_RULES_MAP[ruleId];
  return rule?.impact === 'critical' || rule?.aodaSection.includes('Bilingual');
}
