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

  label: {
    wcagCriterion: '3.3.2 Labels or Instructions',
    wcagLevel: 'A',
    aodaSection: 'IASR 14(4) + IASR 11(1) Feedback Processes',
    impact: 'critical',
    affectedUsers: ['Screen reader users', 'Cognitive disabilities'],
    estimatedFixTime: 20,
    penalty: 'Up to $100,000/day for organizations',
  },

  'document-title': {
    wcagCriterion: '2.4.2 Page Titled',
    wcagLevel: 'A',
    aodaSection: 'IASR 14(4)',
    impact: 'critical',
    affectedUsers: ['Screen reader users', 'All users', 'Search engines'],
    estimatedFixTime: 5,
    penalty: 'Up to $100,000/day for organizations',
  },

  'input-button-name': {
    wcagCriterion: '4.1.2 Name, Role, Value',
    wcagLevel: 'A',
    aodaSection: 'IASR 14(4)',
    impact: 'critical',
    affectedUsers: ['Screen reader users', 'Keyboard-only users'],
    estimatedFixTime: 10,
    penalty: 'Up to $100,000/day for organizations',
  },

  bypass: {
    wcagCriterion: '2.4.1 Bypass Blocks',
    wcagLevel: 'A',
    aodaSection: 'IASR 14(4)',
    impact: 'critical',
    affectedUsers: ['Keyboard-only users', 'Screen reader users'],
    estimatedFixTime: 20,
    penalty: 'Up to $100,000/day for organizations',
  },

  'frame-title': {
    wcagCriterion: '4.1.2 Name, Role, Value',
    wcagLevel: 'A',
    aodaSection: 'IASR 14(4)',
    impact: 'critical',
    affectedUsers: ['Screen reader users', 'Cognitive disabilities'],
    estimatedFixTime: 10,
    penalty: 'Up to $100,000/day for organizations',
  },

  'valid-lang': {
    wcagCriterion: '3.1.1 Language of Page',
    wcagLevel: 'A',
    aodaSection: 'IASR 14(4) + Ontario Bilingual Requirements',
    impact: 'critical',
    affectedUsers: ['Screen reader users', 'French-speaking Ontarians'],
    estimatedFixTime: 5,
    penalty: 'AODA violation + Official Languages Act non-compliance',
  },

  'aria-required-attr': {
    wcagCriterion: '4.1.2 Name, Role, Value',
    wcagLevel: 'A',
    aodaSection: 'IASR 14(4)',
    impact: 'critical',
    affectedUsers: ['Screen reader users', 'Assistive technology users'],
    estimatedFixTime: 15,
    penalty: 'Up to $100,000/day for organizations',
  },

  'aria-roles': {
    wcagCriterion: '4.1.2 Name, Role, Value',
    wcagLevel: 'A',
    aodaSection: 'IASR 14(4)',
    impact: 'critical',
    affectedUsers: ['Screen reader users', 'Assistive technology users'],
    estimatedFixTime: 15,
    penalty: 'Up to $100,000/day for organizations',
  },

  'aria-required-children': {
    wcagCriterion: '1.3.1 Info and Relationships',
    wcagLevel: 'A',
    aodaSection: 'IASR 14(4)',
    impact: 'critical',
    affectedUsers: ['Screen reader users', 'Assistive technology users'],
    estimatedFixTime: 25,
    penalty: 'Up to $100,000/day for organizations',
  },

  'aria-required-parent': {
    wcagCriterion: '1.3.1 Info and Relationships',
    wcagLevel: 'A',
    aodaSection: 'IASR 14(4)',
    impact: 'critical',
    affectedUsers: ['Screen reader users', 'Assistive technology users'],
    estimatedFixTime: 25,
    penalty: 'Up to $100,000/day for organizations',
  },

  'aria-hidden-body': {
    wcagCriterion: '4.1.2 Name, Role, Value',
    wcagLevel: 'A',
    aodaSection: 'IASR 14(4)',
    impact: 'critical',
    affectedUsers: ['Screen reader users', 'All users'],
    estimatedFixTime: 5,
    penalty: 'Up to $100,000/day for organizations',
  },

  'select-name': {
    wcagCriterion: '4.1.2 Name, Role, Value',
    wcagLevel: 'A',
    aodaSection: 'IASR 14(4) + IASR 11(1) Feedback Processes',
    impact: 'critical',
    affectedUsers: ['Screen reader users', 'Cognitive disabilities'],
    estimatedFixTime: 10,
    penalty: 'Up to $100,000/day for organizations',
  },

  'input-image-alt': {
    wcagCriterion: '1.1.1 Non-text Content',
    wcagLevel: 'A',
    aodaSection: 'IASR 14(4)',
    impact: 'critical',
    affectedUsers: ['Blind users', 'Screen reader users'],
    estimatedFixTime: 10,
    penalty: 'Up to $100,000/day for organizations',
  },

  'video-caption': {
    wcagCriterion: '1.2.2 Captions (Prerecorded)',
    wcagLevel: 'A',
    aodaSection: 'IASR 14(4) + IASR 7 Accessible Formats',
    impact: 'critical',
    affectedUsers: ['Deaf users', 'Hard of hearing users'],
    estimatedFixTime: 120,
    penalty: 'Up to $100,000/day for organizations',
  },

  'meta-refresh': {
    wcagCriterion: '2.2.1 Timing Adjustable',
    wcagLevel: 'A',
    aodaSection: 'IASR 14(4)',
    impact: 'critical',
    affectedUsers: ['Cognitive disabilities', 'Screen reader users'],
    estimatedFixTime: 10,
    penalty: 'Up to $100,000/day for organizations',
  },

  'autocomplete-valid': {
    wcagCriterion: '1.3.5 Identify Input Purpose',
    wcagLevel: 'AA',
    aodaSection: 'IASR 14(4)(a)',
    impact: 'critical',
    affectedUsers: ['Cognitive disabilities', 'Motor disabilities'],
    estimatedFixTime: 15,
    penalty: 'Up to $100,000/day for organizations',
  },

  'aria-valid-attr': {
    wcagCriterion: '4.1.2 Name, Role, Value',
    wcagLevel: 'A',
    aodaSection: 'IASR 14(4)',
    impact: 'critical',
    affectedUsers: ['Screen reader users', 'Assistive technology users'],
    estimatedFixTime: 10,
    penalty: 'Up to $100,000/day for organizations',
  },

  'aria-valid-attr-value': {
    wcagCriterion: '4.1.2 Name, Role, Value',
    wcagLevel: 'A',
    aodaSection: 'IASR 14(4)',
    impact: 'critical',
    affectedUsers: ['Screen reader users', 'Assistive technology users'],
    estimatedFixTime: 15,
    penalty: 'Up to $100,000/day for organizations',
  },

  'aria-allowed-attr': {
    wcagCriterion: '4.1.2 Name, Role, Value',
    wcagLevel: 'A',
    aodaSection: 'IASR 14(4)',
    impact: 'critical',
    affectedUsers: ['Screen reader users', 'Assistive technology users'],
    estimatedFixTime: 10,
    penalty: 'Up to $100,000/day for organizations',
  },

  'aria-prohibited-attr': {
    wcagCriterion: '4.1.2 Name, Role, Value',
    wcagLevel: 'A',
    aodaSection: 'IASR 14(4)',
    impact: 'critical',
    affectedUsers: ['Screen reader users', 'Assistive technology users'],
    estimatedFixTime: 10,
    penalty: 'Up to $100,000/day for organizations',
  },

  'aria-conditional-attr': {
    wcagCriterion: '4.1.2 Name, Role, Value',
    wcagLevel: 'A',
    aodaSection: 'IASR 14(4)',
    impact: 'critical',
    affectedUsers: ['Screen reader users', 'Assistive technology users'],
    estimatedFixTime: 15,
    penalty: 'Up to $100,000/day for organizations',
  },

  'aria-input-field-name': {
    wcagCriterion: '4.1.2 Name, Role, Value',
    wcagLevel: 'A',
    aodaSection: 'IASR 14(4) + IASR 11(1) Feedback Processes',
    impact: 'critical',
    affectedUsers: ['Screen reader users', 'Cognitive disabilities'],
    estimatedFixTime: 10,
    penalty: 'Up to $100,000/day for organizations',
  },

  'aria-toggle-field-name': {
    wcagCriterion: '4.1.2 Name, Role, Value',
    wcagLevel: 'A',
    aodaSection: 'IASR 14(4)',
    impact: 'critical',
    affectedUsers: ['Screen reader users', 'Cognitive disabilities'],
    estimatedFixTime: 10,
    penalty: 'Up to $100,000/day for organizations',
  },

  'aria-command-name': {
    wcagCriterion: '4.1.2 Name, Role, Value',
    wcagLevel: 'A',
    aodaSection: 'IASR 14(4)',
    impact: 'critical',
    affectedUsers: ['Screen reader users', 'Keyboard-only users'],
    estimatedFixTime: 10,
    penalty: 'Up to $100,000/day for organizations',
  },

  'area-alt': {
    wcagCriterion: '1.1.1 Non-text Content',
    wcagLevel: 'A',
    aodaSection: 'IASR 14(4)',
    impact: 'critical',
    affectedUsers: ['Blind users', 'Screen reader users'],
    estimatedFixTime: 10,
    penalty: 'Up to $100,000/day for organizations',
  },

  'object-alt': {
    wcagCriterion: '1.1.1 Non-text Content',
    wcagLevel: 'A',
    aodaSection: 'IASR 14(4)',
    impact: 'critical',
    affectedUsers: ['Blind users', 'Screen reader users'],
    estimatedFixTime: 15,
    penalty: 'Up to $100,000/day for organizations',
  },

  'svg-img-alt': {
    wcagCriterion: '1.1.1 Non-text Content',
    wcagLevel: 'A',
    aodaSection: 'IASR 14(4)',
    impact: 'critical',
    affectedUsers: ['Blind users', 'Screen reader users'],
    estimatedFixTime: 10,
    penalty: 'Up to $100,000/day for organizations',
  },

  'role-img-alt': {
    wcagCriterion: '1.1.1 Non-text Content',
    wcagLevel: 'A',
    aodaSection: 'IASR 14(4)',
    impact: 'critical',
    affectedUsers: ['Blind users', 'Screen reader users'],
    estimatedFixTime: 10,
    penalty: 'Up to $100,000/day for organizations',
  },

  'html-xml-lang-mismatch': {
    wcagCriterion: '3.1.1 Language of Page',
    wcagLevel: 'A',
    aodaSection: 'IASR 14(4) + Ontario Bilingual Requirements',
    impact: 'critical',
    affectedUsers: ['Screen reader users', 'French-speaking Ontarians'],
    estimatedFixTime: 5,
    penalty: 'AODA violation + Official Languages Act non-compliance',
  },

  'duplicate-id-aria': {
    wcagCriterion: '4.1.1 Parsing',
    wcagLevel: 'A',
    aodaSection: 'IASR 14(4)',
    impact: 'critical',
    affectedUsers: ['Assistive technology users', 'Screen reader users'],
    estimatedFixTime: 10,
    penalty: 'Up to $100,000/day for organizations',
  },

  'form-field-multiple-labels': {
    wcagCriterion: '3.3.2 Labels or Instructions',
    wcagLevel: 'A',
    aodaSection: 'IASR 14(4) + IASR 11(1) Feedback Processes',
    impact: 'critical',
    affectedUsers: ['Screen reader users', 'Cognitive disabilities'],
    estimatedFixTime: 15,
    penalty: 'Up to $100,000/day for organizations',
  },

  'frame-title-unique': {
    wcagCriterion: '4.1.2 Name, Role, Value',
    wcagLevel: 'A',
    aodaSection: 'IASR 14(4)',
    impact: 'critical',
    affectedUsers: ['Screen reader users', 'Cognitive disabilities'],
    estimatedFixTime: 10,
    penalty: 'Up to $100,000/day for organizations',
  },

  'no-autoplay-audio': {
    wcagCriterion: '1.4.2 Audio Control',
    wcagLevel: 'A',
    aodaSection: 'IASR 14(4)',
    impact: 'critical',
    affectedUsers: [
      'Screen reader users',
      'Cognitive disabilities',
      'Users with attention disorders',
    ],
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

  'nested-interactive': {
    wcagCriterion: '4.1.2 Name, Role, Value',
    wcagLevel: 'A',
    aodaSection: 'IASR 14(4)',
    impact: 'serious',
    affectedUsers: ['Screen reader users', 'Keyboard-only users'],
    estimatedFixTime: 25,
    penalty: 'Up to $100,000/day for organizations',
  },

  'scrollable-region-focusable': {
    wcagCriterion: '2.1.1 Keyboard',
    wcagLevel: 'A',
    aodaSection: 'IASR 14(4)',
    impact: 'serious',
    affectedUsers: ['Keyboard-only users', 'Motor disabilities'],
    estimatedFixTime: 20,
    penalty: 'Up to $100,000/day for organizations',
  },

  'frame-focusable-content': {
    wcagCriterion: '2.4.1 Bypass Blocks',
    wcagLevel: 'A',
    aodaSection: 'IASR 14(4)',
    impact: 'serious',
    affectedUsers: ['Keyboard-only users', 'Screen reader users'],
    estimatedFixTime: 15,
    penalty: 'Up to $100,000/day for organizations',
  },

  'td-headers-attr': {
    wcagCriterion: '1.3.1 Info and Relationships',
    wcagLevel: 'A',
    aodaSection: 'IASR 14(4)',
    impact: 'serious',
    affectedUsers: ['Screen reader users', 'Cognitive disabilities'],
    estimatedFixTime: 30,
    penalty: 'Up to $100,000/day for organizations',
  },

  'th-has-data-cells': {
    wcagCriterion: '1.3.1 Info and Relationships',
    wcagLevel: 'A',
    aodaSection: 'IASR 14(4)',
    impact: 'serious',
    affectedUsers: ['Screen reader users', 'Cognitive disabilities'],
    estimatedFixTime: 20,
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

  region: {
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

  list: {
    wcagCriterion: '1.3.1 Info and Relationships',
    wcagLevel: 'A',
    aodaSection: 'IASR 14(4)',
    impact: 'moderate',
    affectedUsers: ['Screen reader users'],
    estimatedFixTime: 20,
    penalty: 'Up to $100,000/day for organizations',
  },

  listitem: {
    wcagCriterion: '1.3.1 Info and Relationships',
    wcagLevel: 'A',
    aodaSection: 'IASR 14(4)',
    impact: 'moderate',
    affectedUsers: ['Screen reader users'],
    estimatedFixTime: 15,
    penalty: 'Up to $100,000/day for organizations',
  },

  'definition-list': {
    wcagCriterion: '1.3.1 Info and Relationships',
    wcagLevel: 'A',
    aodaSection: 'IASR 14(4)',
    impact: 'moderate',
    affectedUsers: ['Screen reader users'],
    estimatedFixTime: 20,
    penalty: 'Up to $100,000/day for organizations',
  },

  dlitem: {
    wcagCriterion: '1.3.1 Info and Relationships',
    wcagLevel: 'A',
    aodaSection: 'IASR 14(4)',
    impact: 'moderate',
    affectedUsers: ['Screen reader users'],
    estimatedFixTime: 15,
    penalty: 'Up to $100,000/day for organizations',
  },

  'link-in-text-block': {
    wcagCriterion: '1.4.1 Use of Color',
    wcagLevel: 'A',
    aodaSection: 'IASR 14(4)',
    impact: 'moderate',
    affectedUsers: ['Low vision users', 'Color blindness'],
    estimatedFixTime: 25,
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

  'avoid-inline-spacing': {
    wcagCriterion: '1.4.12 Text Spacing',
    wcagLevel: 'AA',
    aodaSection: 'IASR 14(4)(a)',
    impact: 'minor',
    affectedUsers: ['Low vision users', 'Dyslexia', 'Cognitive disabilities'],
    estimatedFixTime: 30,
    penalty: 'Up to $100,000/day for organizations',
  },

  'label-content-name-mismatch': {
    wcagCriterion: '2.5.3 Label in Name',
    wcagLevel: 'A',
    aodaSection: 'IASR 14(4)',
    impact: 'minor',
    affectedUsers: ['Speech input users', 'Screen reader users'],
    estimatedFixTime: 10,
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
  if (!rule) return false;
  return rule.impact === 'critical' || rule.aodaSection.includes('Bilingual');
}
