import { z } from 'zod';

// WCAG Level enum
export const WCAGLevel = z.enum(['A', 'AA', 'AAA']);
export type WCAGLevel = z.infer<typeof WCAGLevel>;

// Impact severity
export const ImpactLevel = z.enum(['critical', 'serious', 'moderate', 'minor']);
export type ImpactLevel = z.infer<typeof ImpactLevel>;

// AODA violation schema
export const AODAViolationSchema = z.object({
  id: z.string(),
  wcagCriterion: z.string(),
  wcagLevel: WCAGLevel,
  aodaSection: z.string(),
  description: z.string(),
  impact: ImpactLevel,
  affectedUsers: z.array(z.string()),
  help: z.string(),
  helpUrl: z.string(),
  estimatedFixTime: z.number(), // in minutes
  penalty: z.string(),
  nodes: z.array(
    z.object({
      html: z.string(),
      target: z.array(z.string()),
      failureSummary: z.string(),
    })
  ),
});

export type AODAViolation = z.infer<typeof AODAViolationSchema>;

// Scan result schema
export const ScanResultSchema = z.object({
  url: z.string().url(),
  timestamp: z.string().datetime(),
  violations: z.array(AODAViolationSchema),
  passes: z.number(),
  incomplete: z.number(),
  summary: z.object({
    total: z.number(),
    critical: z.number(),
    serious: z.number(),
    moderate: z.number(),
    minor: z.number(),
  }),
  compliance: z.object({
    wcag2AA: z.boolean(),
    ontarioAODA: z.boolean(),
    bilingualCompliant: z.boolean(),
  }),
});

export type ScanResult = z.infer<typeof ScanResultSchema>;
